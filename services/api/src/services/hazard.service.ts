import { PrismaClient, HazardCategory, RiskLevel, HazardStatus } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware';

const prisma = new PrismaClient();

interface CreateHazardData {
  location: string;
  geoLocation?: string;
  departmentId?: string;
  category: HazardCategory;
  description: string;
  potentialImpact: string;
  likelihood: number; // 1-5
  consequence: number; // 1-5
  existingControls?: string;
  suggestedControls?: string;
}

interface UpdateHazardData {
  location?: string;
  geoLocation?: string;
  departmentId?: string;
  category?: HazardCategory;
  description?: string;
  potentialImpact?: string;
  likelihood?: number;
  consequence?: number;
  existingControls?: string;
  suggestedControls?: string;
}

interface GetAllFilters {
  page: number;
  limit: number;
  status?: string;
  category?: string;
  riskLevel?: string;
  departmentId?: string;
}

export class HazardService {
  /**
   * Calculate risk level based on likelihood and consequence
   * Risk Score = Likelihood (1-5) × Consequence (1-5)
   * 
   * Risk Levels:
   * - LOW: 1-5
   * - MEDIUM: 6-10
   * - HIGH: 11-15
   * - EXTREME: 16-25
   */
  private calculateRiskLevel(riskScore: number): RiskLevel {
    if (riskScore >= 1 && riskScore <= 5) return 'LOW';
    if (riskScore >= 6 && riskScore <= 10) return 'MEDIUM';
    if (riskScore >= 11 && riskScore <= 15) return 'HIGH';
    return 'EXTREME';
  }

  /**
   * Create a new hazard report
   */
  async create(data: CreateHazardData, reportedById: string) {
    // Validate likelihood and consequence values
    if (data.likelihood < 1 || data.likelihood > 5) {
      throw new AppError('Likelihood must be between 1 and 5', 400);
    }
    if (data.consequence < 1 || data.consequence > 5) {
      throw new AppError('Consequence must be between 1 and 5', 400);
    }

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

    // Calculate risk score and level
    const riskScore = data.likelihood * data.consequence;
    const riskLevel = this.calculateRiskLevel(riskScore);

    const hazard = await prisma.hazard.create({
      data: {
        hazardNumber,
        reportedById,
        location: data.location,
        geoLocation: data.geoLocation,
        departmentId: data.departmentId,
        category: data.category,
        description: data.description,
        potentialImpact: data.potentialImpact,
        likelihood: data.likelihood,
        consequence: data.consequence,
        riskScore,
        riskLevel,
        existingControls: data.existingControls,
        suggestedControls: data.suggestedControls,
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

    // TODO: Create notification for safety team if HIGH or EXTREME risk
    // TODO: Auto-create CAPA for EXTREME risk hazards

    return hazard;
  }

  /**
   * Get all hazards with filters and pagination
   */
  async getAll(filters: GetAllFilters) {
    const { page, limit, status, category, riskLevel, departmentId } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) where.status = status;
    if (category) where.category = category;
    if (riskLevel) where.riskLevel = riskLevel;
    if (departmentId) where.departmentId = departmentId;

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
              title: true,
              status: true,
              dueDate: true,
            },
          },
        },
        orderBy: [
          { riskScore: 'desc' }, // Highest risk first
          { createdAt: 'desc' },
        ],
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

  /**
   * Get hazard by ID with full details
   */
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
                email: true,
              },
            },
          },
        },
        attachments: true,
      },
    });

    if (!hazard) {
      throw new AppError('Hazard not found', 404);
    }

    return hazard;
  }

  /**
   * Update hazard
   */
  async update(id: string, data: UpdateHazardData) {
    const existing = await prisma.hazard.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError('Hazard not found', 404);
    }

    if (existing.status === 'CLOSED') {
      throw new AppError('Cannot update closed hazard', 400);
    }

    // Recalculate risk if likelihood or consequence changed
    let riskScore = existing.riskScore;
    let riskLevel = existing.riskLevel;

    if (data.likelihood || data.consequence) {
      const likelihood = data.likelihood || existing.likelihood;
      const consequence = data.consequence || existing.consequence;

      // Validate values
      if (likelihood < 1 || likelihood > 5) {
        throw new AppError('Likelihood must be between 1 and 5', 400);
      }
      if (consequence < 1 || consequence > 5) {
        throw new AppError('Consequence must be between 1 and 5', 400);
      }

      riskScore = likelihood * consequence;
      riskLevel = this.calculateRiskLevel(riskScore);
    }

    const hazard = await prisma.hazard.update({
      where: { id },
      data: {
        ...data,
        riskScore,
        riskLevel,
      },
      include: {
        reportedBy: true,
        department: true,
        correctiveActions: true,
      },
    });

    return hazard;
  }

  /**
   * Close hazard with remarks
   */
  async close(id: string, closureRemarks: string) {
    const existing = await prisma.hazard.findUnique({
      where: { id },
      include: {
        correctiveActions: true,
      },
    });

    if (!existing) {
      throw new AppError('Hazard not found', 404);
    }

    if (existing.status === 'CLOSED') {
      throw new AppError('Hazard already closed', 400);
    }

    // Check if all associated CAPAs are completed
    const pendingCAPAs = existing.correctiveActions.filter(
      (capa) => capa.status !== 'COMPLETED' && capa.status !== 'VERIFIED'
    );

    if (pendingCAPAs.length > 0) {
      throw new AppError(
        'Cannot close hazard with pending corrective actions. Complete all CAPAs first.',
        400
      );
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
        correctiveActions: true,
      },
    });

    // TODO: Send notification to reporter and safety team

    return hazard;
  }

  /**
   * Get hazard register (all hazards with summary)
   */
  async getHazardRegister(filters?: {
    status?: string;
    category?: string;
    riskLevel?: string;
    departmentId?: string;
  }) {
    const where: any = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.category) where.category = filters.category;
    if (filters?.riskLevel) where.riskLevel = filters.riskLevel;
    if (filters?.departmentId) where.departmentId = filters.departmentId;

    const hazards = await prisma.hazard.findMany({
      where,
      include: {
        reportedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        correctiveActions: {
          select: {
            id: true,
            capaNumber: true,
            status: true,
          },
        },
      },
      orderBy: [
        { riskScore: 'desc' },
        { reportedAt: 'desc' },
      ],
    });

    // Get summary statistics
    const statistics = {
      total: hazards.length,
      byRiskLevel: {
        extreme: hazards.filter((h) => h.riskLevel === 'EXTREME').length,
        high: hazards.filter((h) => h.riskLevel === 'HIGH').length,
        medium: hazards.filter((h) => h.riskLevel === 'MEDIUM').length,
        low: hazards.filter((h) => h.riskLevel === 'LOW').length,
      },
      byStatus: {
        open: hazards.filter((h) => h.status === 'OPEN').length,
        underReview: hazards.filter((h) => h.status === 'UNDER_REVIEW').length,
        controlsImplemented: hazards.filter((h) => h.status === 'CONTROLS_IMPLEMENTED').length,
        closed: hazards.filter((h) => h.status === 'CLOSED').length,
      },
      byCategory: {} as Record<string, number>,
    };

    // Count by category
    hazards.forEach((hazard) => {
      const category = hazard.category;
      statistics.byCategory[category] = (statistics.byCategory[category] || 0) + 1;
    });

    return {
      hazards,
      statistics,
    };
  }

  /**
   * Get hazard statistics
   */
  async getStatistics() {
    const [
      totalHazards,
      extremeRiskCount,
      highRiskCount,
      openHazards,
      closedHazards,
      avgDaysToClose,
    ] = await Promise.all([
      prisma.hazard.count(),
      prisma.hazard.count({ where: { riskLevel: 'EXTREME' } }),
      prisma.hazard.count({ where: { riskLevel: 'HIGH' } }),
      prisma.hazard.count({ where: { status: 'OPEN' } }),
      prisma.hazard.count({ where: { status: 'CLOSED' } }),
      prisma.$queryRaw<Array<{ avg_days: number }>>`
        SELECT AVG(EXTRACT(DAY FROM (closed_at - reported_at))) as avg_days
        FROM hazards
        WHERE status = 'CLOSED' AND closed_at IS NOT NULL
      `,
    ]);

    return {
      total: totalHazards,
      byRiskLevel: {
        extreme: extremeRiskCount,
        high: highRiskCount,
      },
      byStatus: {
        open: openHazards,
        closed: closedHazards,
      },
      avgDaysToClose: (avgDaysToClose[0]?.avg_days as number) || 0,
    };
  }

  /**
   * Delete hazard (only if no CAPAs and status is OPEN)
   */
  async delete(id: string) {
    const existing = await prisma.hazard.findUnique({
      where: { id },
      include: {
        correctiveActions: true,
      },
    });

    if (!existing) {
      throw new AppError('Hazard not found', 404);
    }

    if (existing.correctiveActions.length > 0) {
      throw new AppError('Cannot delete hazard with linked corrective actions', 400);
    }

    if (existing.status !== 'OPEN') {
      throw new AppError('Can only delete hazards in OPEN status', 400);
    }

    await prisma.hazard.delete({ where: { id } });
  }
}
