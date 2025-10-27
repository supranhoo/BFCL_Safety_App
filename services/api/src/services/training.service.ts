import { PrismaClient, TrainingType, TrainingSessionStatus } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware';

const prisma = new PrismaClient();

interface CreateTrainingProgramData {
  title: string;
  description: string;
  trainingType: TrainingType;
  duration: number;
  validityPeriod?: number;
  syllabus?: string;
  videoUrl?: string;
  documentUrl?: string;
  isMandatory: boolean;
  targetRoles?: string[];
  hasQuiz: boolean;
  passingScore?: number;
}

interface CreateTrainingSessionData {
  programId: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  location: string;
  trainerName: string;
  trainerId?: string;
  maxParticipants?: number;
}

interface GetAllFilters {
  page: number;
  limit: number;
  status?: string;
  trainingType?: string;
  userId?: string;
  userRole?: string;
}

export class TrainingService {
  // Training Programs
  async createProgram(data: CreateTrainingProgramData) {
    const program = await prisma.trainingProgram.create({
      data,
    });

    return program;
  }

  async getAllPrograms(filters: GetAllFilters) {
    const { page, limit, trainingType } = filters;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };

    if (trainingType) where.trainingType = trainingType;

    const [programs, total] = await Promise.all([
      prisma.trainingProgram.findMany({
        where,
        skip,
        take: limit,
        include: {
          trainingSessions: {
            select: {
              id: true,
              sessionNumber: true,
              scheduledDate: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.trainingProgram.count({ where }),
    ]);

    return {
      data: programs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProgramById(id: string) {
    const program = await prisma.trainingProgram.findUnique({
      where: { id },
      include: {
        trainingSessions: {
          include: {
            attendances: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return program;
  }

  async updateProgram(id: string, data: Partial<CreateTrainingProgramData>) {
    const existing = await prisma.trainingProgram.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError('Training program not found', 404);
    }

    const program = await prisma.trainingProgram.update({
      where: { id },
      data,
    });

    return program;
  }

  async deleteProgram(id: string) {
    const existing = await prisma.trainingProgram.findUnique({
      where: { id },
      include: {
        trainingSessions: true,
      },
    });

    if (!existing) {
      throw new AppError('Training program not found', 404);
    }

    if (existing.trainingSessions.length > 0) {
      throw new AppError('Cannot delete program with existing sessions', 400);
    }

    await prisma.trainingProgram.delete({ where: { id } });
  }

  // Training Sessions
  async createSession(data: CreateTrainingSessionData) {
    // Generate session number
    const year = new Date().getFullYear();
    const count = await prisma.trainingSession.count({
      where: {
        sessionNumber: {
          startsWith: `TRN-${year}`,
        },
      },
    });
    const sessionNumber = `TRN-${year}-${String(count + 1).padStart(4, '0')}`;

    const session = await prisma.trainingSession.create({
      data: {
        ...data,
        sessionNumber,
        scheduledDate: new Date(data.scheduledDate),
      },
      include: {
        program: true,
      },
    });

    return session;
  }

  async getAllSessions(filters: GetAllFilters) {
    const { page, limit, status } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) where.status = status;

    const [sessions, total] = await Promise.all([
      prisma.trainingSession.findMany({
        where,
        skip,
        take: limit,
        include: {
          program: {
            select: {
              id: true,
              title: true,
              trainingType: true,
            },
          },
          attendances: {
            select: {
              id: true,
              attended: true,
            },
          },
        },
        orderBy: {
          scheduledDate: 'desc',
        },
      }),
      prisma.trainingSession.count({ where }),
    ]);

    return {
      data: sessions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSessionById(id: string) {
    const session = await prisma.trainingSession.findUnique({
      where: { id },
      include: {
        program: true,
        attendances: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                employeeId: true,
              },
            },
          },
        },
        certifications: true,
      },
    });

    return session;
  }

  async updateSession(id: string, data: Partial<CreateTrainingSessionData>) {
    const existing = await prisma.trainingSession.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError('Training session not found', 404);
    }

    if (existing.status === 'COMPLETED' || existing.status === 'CANCELLED') {
      throw new AppError('Cannot update completed or cancelled session', 400);
    }

    const session = await prisma.trainingSession.update({
      where: { id },
      data: {
        ...data,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
      },
      include: {
        program: true,
      },
    });

    return session;
  }

  async completeSession(id: string) {
    const existing = await prisma.trainingSession.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError('Training session not found', 404);
    }

    if (existing.status === 'COMPLETED') {
      throw new AppError('Session already completed', 400);
    }

    const session = await prisma.trainingSession.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      include: {
        program: true,
      },
    });

    return session;
  }

  async cancelSession(id: string) {
    const existing = await prisma.trainingSession.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError('Training session not found', 404);
    }

    if (existing.status === 'COMPLETED') {
      throw new AppError('Cannot cancel completed session', 400);
    }

    const session = await prisma.trainingSession.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
      include: {
        program: true,
      },
    });

    return session;
  }
}
