import { PrismaClient, Hazard, HazardCategory, RiskLevel, HazardStatus } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware';

const prisma = new PrismaClient();

interface CreateHazardData {
  reportedById: string;
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

interface UpdateHazardData extends Partial<CreateHazardData> {
  status?: HazardStatus;
  closureRemarks?: string;
}

export class HazardService {
  /**
   * Create hazard report
   */
  async createHazard(data: CreateHazardData) {
    // Generate hazard number
    const hazardNumber = await this.generateHazardNumber();
    
    // Calculate risk score and level
    const riskScore = data.likelihood * data.consequence;
    const riskLevel = this.calculateRiskLevel(riskScore);
    
    const hazard = await prisma.hazard.create({
      data: {
        hazardNumber,
        ...data,
        riskScore,
        riskLevel,
        status: HazardStatus.OPEN,
      },
      include: {
        reportedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        department: true,
      },
    });
    
    await this.logAudit(data.reportedById, 'CREATE', 'hazards', hazard.id);
    await this.createHazardNotifications(hazard);
    
    return hazard;
  }

  /**
   * Get all hazards
   */
  async getHazards(filters: {
    status?: HazardStatus;
    category?: HazardCategory;
    riskLevel?: RiskLevel;
    departmentId?: string;
    reportedById?: string;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20, ...where } = filters;
    const skip = (page - 1) * limit;

    const [hazards, total] = await Promise.all([
      prisma.hazard.findMany({
        where,
        include: {
          reportedBy: { select: { id: true, firstName: true, lastName: true } },
          department: true,
        },
        orderBy: [{ riskLevel: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.hazard.count({ where }),
    ]);

    return {
      data: hazards,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get hazard by ID
   */
  async getHazardById(id: string) {
    const hazard = await prisma.hazard.findUnique({
      where: { id },
      include: {
        reportedBy: true,
        department: true,
        correctiveActions: {
          include: {
            assignedTo: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        attachments: true,
      },
    });

    if (!hazard) throw new AppError('Hazard not found', 404);
    return hazard;
  }

  /**
   * Update hazard
   */
  async updateHazard(id: string, userId: string, data: UpdateHazardData) {
    const existing = await prisma.hazard.findUnique({ where: { id } });
    if (!existing) throw new AppError('Hazard not found', 404);

    // Recalculate risk if likelihood/consequence changed
    let updates: any = { ...data };
    if (data.likelihood || data.consequence) {
      const likelihood = data.likelihood || existing.likelihood;
      const consequence = data.consequence || existing.consequence;
      updates.riskScore = likelihood * consequence;
      updates.riskLevel = this.calculateRiskLevel(updates.riskScore);
    }

    const hazard = await prisma.hazard.update({
      where: { id },
      data: updates,
      include: { reportedBy: true, department: true },
    });

    await this.logAudit(userId, 'UPDATE', 'hazards', id, data);
    return hazard;
  }

  /**
   * Close hazard
   */
  async closeHazard(id: string, userId: string, closureRemarks: string) {
    const hazard = await prisma.hazard.findUnique({ where: { id } });
    if (!hazard) throw new AppError('Hazard not found', 404);

    const updated = await prisma.hazard.update({
      where: { id },
      data: {
        status: HazardStatus.CLOSED,
        closedAt: new Date(),
        closureRemarks,
      },
    });

    await this.logAudit(userId, 'CLOSE', 'hazards', id);
    return updated;
  }

  /**
   * Get hazard statistics
   */
  async getHazardStats(filters: { dateFrom?: Date; dateTo?: Date; departmentId?: string }) {
    const where: any = {};
    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.dateFrom || filters.dateTo) {
      where.reportedAt = {
        ...(filters.dateFrom && { gte: filters.dateFrom }),
        ...(filters.dateTo && { lte: filters.dateTo }),
      };
    }

    const [total, byCategory, byRiskLevel, byStatus] = await Promise.all([
      prisma.hazard.count({ where }),
      prisma.hazard.groupBy({ by: ['category'], where, _count: true }),
      prisma.hazard.groupBy({ by: ['riskLevel'], where, _count: true }),
      prisma.hazard.groupBy({ by: ['status'], where, _count: true }),
    ]);

    return { total, byCategory, byRiskLevel, byStatus };
  }

  private async generateHazardNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `HAZ-${year}-`;
    const last = await prisma.hazard.findFirst({
      where: { hazardNumber: { startsWith: prefix } },
      orderBy: { createdAt: 'desc' },
    });
    const nextNumber = last ? parseInt(last.hazardNumber.split('-')[2]) + 1 : 1;
    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  private calculateRiskLevel(riskScore: number): RiskLevel {
    if (riskScore >= 20) return RiskLevel.EXTREME;
    if (riskScore >= 15) return RiskLevel.HIGH;
    if (riskScore >= 8) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  private async createHazardNotifications(hazard: any) {
    const safetyOfficers = await prisma.user.findMany({
      where: {
        role: { name: { in: ['Safety Officer', 'Senior Safety Officer', 'Safety Head'] } },
        isActive: true,
      },
    });

    await prisma.notification.createMany({
      data: safetyOfficers.map((officer) => ({
        userId: officer.id,
        title: `New Hazard Reported: ${hazard.hazardNumber}`,
        message: `Risk Level: ${hazard.riskLevel} - ${hazard.description.substring(0, 100)}...`,
        type: 'HAZARD_REPORTED',
        entityType: 'hazards',
        entityId: hazard.id,
      })),
    });
  }

  private async logAudit(userId: string, action: string, resource: string, resourceId: string, changes?: any) {
    await prisma.auditLog.create({
      data: { userId, action, resource, resourceId, changes },
    });
  }
}
