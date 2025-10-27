import { PrismaClient, HazardCategory, RiskLevel } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware';

const prisma = new PrismaClient();

interface CreateHazardData {
  location: string;
  geoLocation?: string;
  departmentId?: string;
  category: HazardCategory;
  description: string;
  potentialImpact: string;
  likelihood: number;
  consequence: number;
  existingControls?: string;
  suggestedControls?: string;
}

interface GetAllFilters {
  page: number;
  limit: number;
  status?: string;
  category?: string;
  departmentId?: string;
  riskLevel?: string;
  userId?: string;
  userRole?: string;
}

export class HazardService {
  private calculateRiskLevel(riskScore: number): RiskLevel {
    if (riskScore <= 4) return 'LOW';
    if (riskScore <= 9) return 'MEDIUM';
    if (riskScore <= 16) return 'HIGH';
    return 'EXTREME';
  }

  async create(data: CreateHazardData, reportedById: string) {
    // Generate hazard number
    const year = new Date().getFullYear();
    const count = await prisma.hazard.count({
      where: {
        hazardNumber: {
          startsWith: `HAZ-${year}`,
        },
      },
    });
    const hazardNumber = `HAZ-${year}-${String(count + 1).padStart(4, '0')}`;

    const riskScore = data.likelihood * data.consequence;
    const riskLevel = this.calculateRiskLevel(riskScore);

    const hazard = await prisma.hazard.create({
      data: {
        ...data,
        hazardNumber,
        reportedById,
        riskScore,
        riskLevel,
      },
      include: {
        reportedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        department: true,
      },
    });

    return hazard;
  }

  async getAll(filters: GetAllFilters) {
    const { page, limit, status, category, departmentId, riskLevel } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) where.status = status;
    if (category) where.category = category;
    if (departmentId) where.departmentId = departmentId;
    if (riskLevel) where.riskLevel = riskLevel;

    const [hazards, total] = await Promise.all([
      prisma.hazard.findMany({
        where,
        skip,
        take: limit,
        include: {
          reportedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          department: true,
          correctiveActions: {
            select: {
              id: true,
              capaNumber: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.hazard.count({ where }),
    ]);

    return {
      data: hazards,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string) {
    const hazard = await prisma.hazard.findUnique({
      where: { id },
      include: {
        reportedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
          },
        },
        department: true,
        correctiveActions: {
          include: {
            assignedTo: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        attachments: true,
      },
    });

    return hazard;
  }

  async update(id: string, data: Partial<CreateHazardData>) {
    const existing = await prisma.hazard.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError('Hazard not found', 404);
    }

    if (existing.status === 'CLOSED') {
      throw new AppError('Cannot update closed hazard', 400);
    }

    const updateData: any = { ...data };

    if (data.likelihood || data.consequence) {
      const likelihood = data.likelihood || existing.likelihood;
      const consequence = data.consequence || existing.consequence;
      const riskScore = likelihood * consequence;
      updateData.riskScore = riskScore;
      updateData.riskLevel = this.calculateRiskLevel(riskScore);
    }

    const hazard = await prisma.hazard.update({
      where: { id },
      data: updateData,
      include: {
        reportedBy: true,
        department: true,
      },
    });

    return hazard;
  }

  async close(id: string, closureRemarks: string) {
    const existing = await prisma.hazard.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError('Hazard not found', 404);
    }

    if (existing.status === 'CLOSED') {
      throw new AppError('Hazard already closed', 400);
    }

    const hazard = await prisma.hazard.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        closureRemarks,
      },
      include: {
        reportedBy: true,
        department: true,
      },
    });

    return hazard;
  }
}
