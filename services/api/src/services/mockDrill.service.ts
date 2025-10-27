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

interface GetAllFilters {
  page: number;
  limit: number;
  status?: string;
  drillType?: string;
  userId?: string;
  userRole?: string;
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
            select: {
              id: true,
              attended: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
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
              },
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

    if (existing.status === 'COMPLETED' || existing.status === 'CANCELLED') {
      throw new AppError('Cannot update completed or cancelled drill', 400);
    }

    const drill = await prisma.mockDrill.update({
      where: { id },
      data: {
        ...data,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
      },
    });

    return drill;
  }

  async start(id: string) {
    const existing = await prisma.mockDrill.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError('Mock drill not found', 404);
    }

    if (existing.status !== 'SCHEDULED') {
      throw new AppError('Drill not in scheduled state', 400);
    }

    const drill = await prisma.mockDrill.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        conductedDate: new Date(),
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
        ...completionData,
      },
    });

    return drill;
  }

  async cancel(id: string) {
    const existing = await prisma.mockDrill.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError('Mock drill not found', 404);
    }

    if (existing.status === 'COMPLETED') {
      throw new AppError('Cannot cancel completed drill', 400);
    }

    const drill = await prisma.mockDrill.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    });

    return drill;
  }

  async delete(id: string) {
    const existing = await prisma.mockDrill.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError('Mock drill not found', 404);
    }

    if (existing.status !== 'SCHEDULED') {
      throw new AppError('Cannot delete drill that is in progress or completed', 400);
    }

    await prisma.mockDrill.delete({ where: { id } });
  }
}
