import {
  PrismaClient,
  TrainingType,
  TrainingSessionStatus,
} from '@prisma/client';
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
  isMandatory?: boolean;
  targetRoles?: string[];
  hasQuiz?: boolean;
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
  trainingType?: string;
  isMandatory?: boolean;
}

export class TrainingService {
  async createProgram(data: CreateTrainingProgramData) {
    const program = await prisma.trainingProgram.create({
      data: {
        ...data,
        targetRoles: data.targetRoles ? data.targetRoles : undefined,
      },
    });

    return program;
  }

  async getAllPrograms(filters: GetAllFilters) {
    const { page, limit, trainingType, isMandatory } = filters;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };

    if (trainingType) where.trainingType = trainingType;
    if (isMandatory !== undefined) where.isMandatory = isMandatory;

    const [programs, total] = await Promise.all([
      prisma.trainingProgram.findMany({
        where,
        skip,
        take: limit,
        include: {
          trainingSessions: {
            where: {
              status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
            },
            take: 5,
            orderBy: {
              scheduledDate: 'desc',
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

  async createSession(data: CreateTrainingSessionData) {
    // Verify program exists
    const program = await prisma.trainingProgram.findUnique({
      where: { id: data.programId },
    });

    if (!program) {
      throw new AppError('Training program not found', 404);
    }

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

    // TODO: Send notifications to target roles

    return session;
  }

  async getAllSessions(filters: GetAllFilters) {
    const { page, limit } = filters;
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      prisma.trainingSession.findMany({
        skip,
        take: limit,
        include: {
          program: {
            select: {
              id: true,
              title: true,
              trainingType: true,
              duration: true,
            },
          },
          attendances: {
            select: {
              id: true,
              attended: true,
              userId: true,
            },
          },
        },
        orderBy: {
          scheduledDate: 'desc',
        },
      }),
      prisma.trainingSession.count(),
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

  async recordAttendance(sessionId: string, userId: string, attended: boolean, quizScore?: number) {
    const session = await prisma.trainingSession.findUnique({
      where: { id: sessionId },
      include: { program: true },
    });

    if (!session) {
      throw new AppError('Training session not found', 404);
    }

    // Check if quiz score meets passing criteria
    let passed: boolean | undefined = undefined;
    if (attended && session.program.hasQuiz && quizScore !== undefined) {
      passed = quizScore >= (session.program.passingScore || 70);
    }

    const attendance = await prisma.trainingAttendance.upsert({
      where: {
        sessionId_userId: {
          sessionId,
          userId,
        },
      },
      update: {
        attended,
        quizScore,
        passed,
      },
      create: {
        sessionId,
        userId,
        attended,
        quizScore,
        passed,
      },
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
    });

    // Issue certification if attended and passed (or no quiz)
    if (attended && (passed !== false)) {
      await this.issueCertification(sessionId, userId);
    }

    return attendance;
  }

  async getCertifications(userId?: string) {
    const where: any = { isValid: true };
    if (userId) where.userId = userId;

    const certifications = await prisma.certification.findMany({
      where,
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
        session: {
          include: {
            program: {
              select: {
                title: true,
                trainingType: true,
              },
            },
          },
        },
      },
      orderBy: {
        issuedDate: 'desc',
      },
    });

    return certifications;
  }

  async getExpiringCertifications(days: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const certifications = await prisma.certification.findMany({
      where: {
        isValid: true,
        expiryDate: {
          lte: futureDate,
          gte: new Date(),
        },
      },
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
        session: {
          include: {
            program: {
              select: {
                title: true,
                trainingType: true,
              },
            },
          },
        },
      },
      orderBy: {
        expiryDate: 'asc',
      },
    });

    // TODO: Send expiry alert notifications

    return certifications;
  }

  private async issueCertification(sessionId: string, userId: string) {
    const session = await prisma.trainingSession.findUnique({
      where: { id: sessionId },
      include: { program: true },
    });

    if (!session) return;

    // Generate certification number
    const year = new Date().getFullYear();
    const count = await prisma.certification.count({
      where: {
        certNumber: {
          startsWith: `CERT-${year}`,
        },
      },
    });
    const certNumber = `CERT-${year}-${String(count + 1).padStart(4, '0')}`;

    // Calculate expiry date if validity period exists
    let expiryDate: Date | undefined = undefined;
    if (session.program.validityPeriod) {
      expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + session.program.validityPeriod);
    }

    await prisma.certification.create({
      data: {
        certNumber,
        userId,
        sessionId,
        title: session.program.title,
        expiryDate,
      },
    });
  }
}
