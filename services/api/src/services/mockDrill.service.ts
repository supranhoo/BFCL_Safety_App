import { PrismaClient, DrillType, DrillStatus } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware';

const prisma = new PrismaClient();

interface CreateMockDrillData {
  drillType: DrillType;
  scheduledDate: string;
  startTime: string;
  endTime?: string;
  location: string;
  scenario: string;
  observers: string[];
}

interface RecordParticipationData {
  drillId: string;
  userId: string;
  attended: boolean;
  performance?: string;
  remarks?: string;
}

interface GetAllFilters {
  page: number;
  limit: number;
  status?: string;
  drillType?: string;
}

export class MockDrillService {
  async create(data: CreateMockDrillData) {
    // Generate drill number
    const year = new Date().getFullYear();
    const count = await prisma.mockDrill.count({
      where: {
        drillNumber: {
          startsWith: `DRILL-${year}`,
        },
      },
    });
    const drillNumber = `DRILL-${year}-${String(count + 1).padStart(4, '0')}`;

    const drill = await prisma.mockDrill.create({
      data: {
        ...data,
        drillNumber,
        scheduledDate: new Date(data.scheduledDate),
      },
    });

    // TODO: Send notifications to observers and participants

    return drill;
  }

  async getAll(filters: GetAllFilters) {
    const { page, limit, status, drillType } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) where.status = status;
    if (drillType) where.drillType = drillType;

    const [drills, total] = await Promise.all([
      prisma.mockDrill.findMany({
        where,
        skip,
        take: limit,
        include: {
          participants: {
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
        orderBy: {
          scheduledDate: 'desc',
        },
      }),
      prisma.mockDrill.count({ where }),
    ]);

    return {
      data: drills,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string) {
    const drill = await prisma.mockDrill.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                employeeId: true,
                department: true,
              },
            },
          },
          orderBy: {
            user: {
              firstName: 'asc',
            },
          },
        },
        attachments: true,
      },
    });

    return drill;
  }

  async update(id: string, data: Partial<CreateMockDrillData>) {
    const existing = await prisma.mockDrill.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError('Mock drill not found', 404);
    }

    if (existing.status === 'COMPLETED') {
      throw new AppError('Cannot update completed drill', 400);
    }

    const drill = await prisma.mockDrill.update({
      where: { id },
      data: {
        ...data,
        scheduledDate: data.scheduledDate
          ? new Date(data.scheduledDate)
          : undefined,
      },
    });

    return drill;
  }

  async complete(
    id: string,
    completionData: {
      duration: number;
      overallRating: number;
      gaps?: string;
      observations?: string;
      recommendations?: string;
    }
  ) {
    const existing = await prisma.mockDrill.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError('Mock drill not found', 404);
    }

    if (existing.status === 'COMPLETED') {
      throw new AppError('Drill already completed', 400);
    }

    const drill = await prisma.mockDrill.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        conductedDate: new Date(),
        ...completionData,
      },
      include: {
        participants: true,
      },
    });

    // TODO: Generate report and send notifications

    return drill;
  }

  async recordParticipation(data: RecordParticipationData) {
    const drill = await prisma.mockDrill.findUnique({
      where: { id: data.drillId },
    });

    if (!drill) {
      throw new AppError('Mock drill not found', 404);
    }

    const participation = await prisma.mockDrillParticipant.upsert({
      where: {
        drillId_userId: {
          drillId: data.drillId,
          userId: data.userId,
        },
      },
      update: {
        attended: data.attended,
        performance: data.performance,
        remarks: data.remarks,
      },
      create: {
        drillId: data.drillId,
        userId: data.userId,
        attended: data.attended,
        performance: data.performance,
        remarks: data.remarks,
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

    return participation;
  }
}
