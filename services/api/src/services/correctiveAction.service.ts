import { PrismaClient, CAPAStatus, CAPASourceType, Priority } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware';

const prisma = new PrismaClient();

interface CreateCAPAData {
  title: string;
  description: string;
  sourceType: CAPASourceType;
  sourceId: string;
  investigationId?: string;
  auditId?: string;
  hazardId?: string;
  assignedToId: string;
  dueDate: Date;
  priority?: Priority;
}

interface UpdateCAPAData extends Partial<CreateCAPAData> {
  status?: CAPAStatus;
  completionDate?: Date;
  completionRemarks?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
}

export class CorrectiveActionService {
  /**
   * Create a new CAPA
   */
  async createCAPA(data: CreateCAPAData, createdById: string) {
    // Validate source exists
    await this.validateSource(data.sourceType, data.sourceId);

    // Generate CAPA number: CAPA-YYYY-XXXX
    const capaNumber = await this.generateCAPANumber();

    const capa = await prisma.correctiveAction.create({
      data: {
        capaNumber,
        title: data.title,
        description: data.description,
        sourceType: data.sourceType,
        sourceId: data.sourceId,
        investigationId: data.investigationId,
        auditId: data.auditId,
        hazardId: data.hazardId,
        assignedToId: data.assignedToId,
        createdById,
        dueDate: data.dueDate,
        priority: data.priority || Priority.MEDIUM,
        status: CAPAStatus.PENDING,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        investigation: {
          select: {
            id: true,
            investigationNumber: true,
            incident: {
              select: {
                id: true,
                incidentNumber: true,
              },
            },
          },
        },
      },
    });

    // Calculate aging
    await this.updateCAPAAging(capa.id);

    // Log audit
    await this.logAudit(createdById, 'CREATE', 'corrective_actions', capa.id);

    // Notify assignee
    await this.createCAPANotification(capa, 'ASSIGNED');

    return capa;
  }

  /**
   * Get CAPA by ID
   */
  async getCAPAById(id: string) {
    const capa = await prisma.correctiveAction.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        investigation: {
          include: {
            incident: {
              select: {
                id: true,
                incidentNumber: true,
                incidentType: true,
                severity: true,
              },
            },
          },
        },
        audit: {
          select: {
            id: true,
            auditNumber: true,
            title: true,
            auditType: true,
          },
        },
        hazard: {
          select: {
            id: true,
            hazardNumber: true,
            category: true,
            riskLevel: true,
          },
        },
      },
    });

    if (!capa) {
      throw new AppError('CAPA not found', 404);
    }

    return capa;
  }

  /**
   * Get all CAPAs with filters
   */
  async getCAPAs(filters: {
    status?: CAPAStatus;
    priority?: Priority;
    assignedToId?: string;
    createdById?: string;
    sourceType?: CAPASourceType;
    overdue?: boolean;
    dueDateFrom?: Date;
    dueDateTo?: Date;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20, overdue, ...whereFilters } = filters;
    const skip = (page - 1) * limit;

    const where: any = { ...whereFilters };

    // Filter overdue CAPAs
    if (overdue) {
      where.dueDate = { lt: new Date() };
      where.status = {
        in: [CAPAStatus.PENDING, CAPAStatus.IN_PROGRESS],
      };
    }

    // Date range filter
    if (filters.dueDateFrom || filters.dueDateTo) {
      where.dueDate = {
        ...(filters.dueDateFrom && { gte: filters.dueDateFrom }),
        ...(filters.dueDateTo && { lte: filters.dueDateTo }),
      };
    }

    const [capas, total] = await Promise.all([
      prisma.correctiveAction.findMany({
        where,
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          investigation: {
            select: {
              id: true,
              investigationNumber: true,
            },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
        ],
        skip,
        take: limit,
      }),
      prisma.correctiveAction.count({ where }),
    ]);

    return {
      data: capas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update CAPA
   */
  async updateCAPA(id: string, userId: string, data: UpdateCAPAData) {
    const existing = await prisma.correctiveAction.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('CAPA not found', 404);
    }

    // Only allow updates if not verified or cancelled
    if ([CAPAStatus.VERIFIED, CAPAStatus.CANCELLED].includes(existing.status)) {
      throw new AppError('Cannot update verified or cancelled CAPA', 400);
    }

    const capa = await prisma.correctiveAction.update({
      where: { id },
      data,
      include: {
        assignedTo: true,
        createdBy: true,
      },
    });

    // Update aging
    await this.updateCAPAAging(id);

    // Log audit
    await this.logAudit(userId, 'UPDATE', 'corrective_actions', id, data);

    return capa;
  }

  /**
   * Mark CAPA as in progress
   */
  async startCAPA(id: string, userId: string) {
    const capa = await prisma.correctiveAction.findUnique({
      where: { id },
    });

    if (!capa) {
      throw new AppError('CAPA not found', 404);
    }

    if (capa.status !== CAPAStatus.PENDING) {
      throw new AppError('CAPA must be in PENDING status to start', 400);
    }

    const updated = await prisma.correctiveAction.update({
      where: { id },
      data: {
        status: CAPAStatus.IN_PROGRESS,
      },
      include: {
        assignedTo: true,
      },
    });

    // Log audit
    await this.logAudit(userId, 'START', 'corrective_actions', id);

    return updated;
  }

  /**
   * Complete CAPA
   */
  async completeCAPA(id: string, userId: string, completionRemarks: string) {
    const capa = await prisma.correctiveAction.findUnique({
      where: { id },
      include: {
        assignedTo: true,
        createdBy: true,
      },
    });

    if (!capa) {
      throw new AppError('CAPA not found', 404);
    }

    if (![CAPAStatus.PENDING, CAPAStatus.IN_PROGRESS].includes(capa.status)) {
      throw new AppError('CAPA must be PENDING or IN_PROGRESS to complete', 400);
    }

    // Check if user is assigned or has authority
    if (capa.assignedToId !== userId) {
      // Could add role-based override here
    }

    const updated = await prisma.correctiveAction.update({
      where: { id },
      data: {
        status: CAPAStatus.COMPLETED,
        completionDate: new Date(),
        completionRemarks,
      },
      include: {
        assignedTo: true,
        createdBy: true,
      },
    });

    // Update aging
    await this.updateCAPAAging(id);

    // Log audit
    await this.logAudit(userId, 'COMPLETE', 'corrective_actions', id);

    // Notify creator and verifiers
    await this.createCAPANotification(updated, 'COMPLETED');

    return updated;
  }

  /**
   * Verify CAPA
   */
  async verifyCAPA(id: string, userId: string, verificationRemarks?: string) {
    const capa = await prisma.correctiveAction.findUnique({
      where: { id },
    });

    if (!capa) {
      throw new AppError('CAPA not found', 404);
    }

    if (capa.status !== CAPAStatus.COMPLETED) {
      throw new AppError('CAPA must be COMPLETED before verification', 400);
    }

    const updated = await prisma.correctiveAction.update({
      where: { id },
      data: {
        status: CAPAStatus.VERIFIED,
        verifiedBy: userId,
        verifiedAt: new Date(),
        completionRemarks: verificationRemarks 
          ? `${capa.completionRemarks || ''}\n\nVerification: ${verificationRemarks}`
          : capa.completionRemarks,
      },
      include: {
        assignedTo: true,
        createdBy: true,
      },
    });

    // Log audit
    await this.logAudit(userId, 'VERIFY', 'corrective_actions', id);

    // Notify assignee
    await this.createCAPANotification(updated, 'VERIFIED');

    return updated;
  }

  /**
   * Cancel CAPA
   */
  async cancelCAPA(id: string, userId: string, reason: string) {
    const capa = await prisma.correctiveAction.findUnique({
      where: { id },
    });

    if (!capa) {
      throw new AppError('CAPA not found', 404);
    }

    if ([CAPAStatus.VERIFIED, CAPAStatus.CANCELLED].includes(capa.status)) {
      throw new AppError('Cannot cancel verified or already cancelled CAPA', 400);
    }

    const updated = await prisma.correctiveAction.update({
      where: { id },
      data: {
        status: CAPAStatus.CANCELLED,
        completionRemarks: `Cancelled: ${reason}`,
      },
      include: {
        assignedTo: true,
      },
    });

    // Log audit
    await this.logAudit(userId, 'CANCEL', 'corrective_actions', id, { reason });

    return updated;
  }

  /**
   * Get CAPA statistics
   */
  async getCAPAStats(filters: {
    assignedToId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    const where: any = {};

    if (filters.assignedToId) {
      where.assignedToId = filters.assignedToId;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {
        ...(filters.dateFrom && { gte: filters.dateFrom }),
        ...(filters.dateTo && { lte: filters.dateTo }),
      };
    }

    const [
      total,
      byStatus,
      byPriority,
      overdue,
      avgCompletionTime,
    ] = await Promise.all([
      prisma.correctiveAction.count({ where }),
      prisma.correctiveAction.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.correctiveAction.groupBy({
        by: ['priority'],
        where,
        _count: true,
      }),
      prisma.correctiveAction.count({
        where: {
          ...where,
          dueDate: { lt: new Date() },
          status: {
            in: [CAPAStatus.PENDING, CAPAStatus.IN_PROGRESS],
          },
        },
      }),
      this.calculateAvgCompletionTime(where),
    ]);

    return {
      total,
      byStatus,
      byPriority,
      overdue,
      avgCompletionTime,
    };
  }

  /**
   * Get overdue CAPAs
   */
  async getOverdueCAPAs() {
    const capas = await prisma.correctiveAction.findMany({
      where: {
        dueDate: { lt: new Date() },
        status: {
          in: [CAPAStatus.PENDING, CAPAStatus.IN_PROGRESS],
        },
      },
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
      orderBy: { dueDate: 'asc' },
    });

    // Update status to OVERDUE if necessary
    for (const capa of capas) {
      if (capa.status !== CAPAStatus.OVERDUE) {
        await prisma.correctiveAction.update({
          where: { id: capa.id },
          data: { status: CAPAStatus.OVERDUE },
        });
      }
    }

    return capas;
  }

  /**
   * Generate unique CAPA number
   */
  private async generateCAPANumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CAPA-${year}-`;

    const lastCAPA = await prisma.correctiveAction.findFirst({
      where: {
        capaNumber: {
          startsWith: prefix,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let nextNumber = 1;
    if (lastCAPA) {
      const lastNumber = parseInt(lastCAPA.capaNumber.split('-')[2]);
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Validate source entity exists
   */
  private async validateSource(sourceType: CAPASourceType, sourceId: string) {
    switch (sourceType) {
      case CAPASourceType.INVESTIGATION:
        const investigation = await prisma.investigation.findUnique({
          where: { id: sourceId },
        });
        if (!investigation) {
          throw new AppError('Investigation not found', 404);
        }
        break;
      case CAPASourceType.AUDIT:
        const audit = await prisma.audit.findUnique({
          where: { id: sourceId },
        });
        if (!audit) {
          throw new AppError('Audit not found', 404);
        }
        break;
      case CAPASourceType.HAZARD:
        const hazard = await prisma.hazard.findUnique({
          where: { id: sourceId },
        });
        if (!hazard) {
          throw new AppError('Hazard not found', 404);
        }
        break;
      case CAPASourceType.MANUAL:
        // No validation needed for manual entries
        break;
    }
  }

  /**
   * Update CAPA aging in days
   */
  private async updateCAPAAging(id: string) {
    const capa = await prisma.correctiveAction.findUnique({
      where: { id },
    });

    if (!capa) return;

    const now = new Date();
    const createdDate = new Date(capa.createdAt);
    const ageDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

    await prisma.correctiveAction.update({
      where: { id },
      data: { ageDays },
    });
  }

  /**
   * Calculate average completion time
   */
  private async calculateAvgCompletionTime(where: any): Promise<number> {
    const completedCapas = await prisma.correctiveAction.findMany({
      where: {
        ...where,
        status: CAPAStatus.COMPLETED,
        completionDate: { not: null },
      },
      select: {
        createdAt: true,
        completionDate: true,
      },
    });

    if (completedCapas.length === 0) return 0;

    const totalDays = completedCapas.reduce((sum, capa) => {
      const days = Math.floor(
        (capa.completionDate!.getTime() - capa.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      return sum + days;
    }, 0);

    return Math.round(totalDays / completedCapas.length);
  }

  /**
   * Create CAPA notifications
   */
  private async createCAPANotification(capa: any, event: 'ASSIGNED' | 'COMPLETED' | 'VERIFIED') {
    const notifications: any[] = [];

    if (event === 'ASSIGNED') {
      notifications.push({
        userId: capa.assignedToId,
        title: `CAPA Assigned: ${capa.capaNumber}`,
        message: `You have been assigned a corrective action: ${capa.title}`,
        type: 'CAPA_ASSIGNED',
        entityType: 'corrective_actions',
        entityId: capa.id,
      });
    }

    if (event === 'COMPLETED') {
      // Notify Safety Head for verification
      const safetyHead = await prisma.user.findFirst({
        where: { role: { name: 'Safety Head' }, isActive: true },
      });

      if (safetyHead) {
        notifications.push({
          userId: safetyHead.id,
          title: `CAPA Completed - Verification Required: ${capa.capaNumber}`,
          message: `CAPA ${capa.capaNumber} has been marked as completed and requires verification`,
          type: 'CAPA_ASSIGNED',
          entityType: 'corrective_actions',
          entityId: capa.id,
        });
      }

      // Notify creator
      if (capa.createdById) {
        notifications.push({
          userId: capa.createdById,
          title: `CAPA Completed: ${capa.capaNumber}`,
          message: `Your CAPA ${capa.capaNumber} has been completed`,
          type: 'SYSTEM_ALERT',
          entityType: 'corrective_actions',
          entityId: capa.id,
        });
      }
    }

    if (event === 'VERIFIED') {
      notifications.push({
        userId: capa.assignedToId,
        title: `CAPA Verified: ${capa.capaNumber}`,
        message: `Your CAPA ${capa.capaNumber} has been verified and closed`,
        type: 'SYSTEM_ALERT',
        entityType: 'corrective_actions',
        entityId: capa.id,
      });
    }

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications,
      });
    }
  }

  /**
   * Log audit trail
   */
  private async logAudit(
    userId: string,
    action: string,
    resource: string,
    resourceId: string,
    changes?: any
  ) {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        changes,
      },
    });
  }
}
