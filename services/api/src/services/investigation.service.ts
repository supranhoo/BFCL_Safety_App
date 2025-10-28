import { PrismaClient, Investigation, InvestigationStatus, Severity } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware';

const prisma = new PrismaClient();

export interface CreateInvestigationData {
  incidentId: string;
  investigatorId: string;
  investigationDate: Date;
  findings: string;
  rootCause: string;
  fiveWhys?: {
    why1?: string;
    why2?: string;
    why3?: string;
    why4?: string;
    why5?: string;
  };
  contributingFactors?: string;
  recommendations?: string;
  coInvestigators?: string[]; // Array of user IDs
}

interface UpdateInvestigationData extends Partial<CreateInvestigationData> {
  status?: InvestigationStatus;
}

export class InvestigationService {
  /**
   * Create a new investigation
   */
  async createInvestigation(data: CreateInvestigationData, createdById: string) {
    // Check if incident exists and doesn't already have an investigation
    const incident = await prisma.incident.findUnique({
      where: { id: data.incidentId },
      include: { investigation: true, department: true },
    });

    if (!incident) {
      throw new AppError('Incident not found', 404);
    }

    if (incident.investigation) {
      throw new AppError('Investigation already exists for this incident', 409);
    }

    // Generate investigation number: INV-YYYY-XXXX
    const investigationNumber = await this.generateInvestigationNumber();

    // Determine co-investigators based on severity
    const coInvestigators = await this.determineCoInvestigators(
      incident.severity,
      incident.departmentId,
      data.coInvestigators
    );

    const investigation = await prisma.investigation.create({
      data: {
        investigationNumber,
        incidentId: data.incidentId,
        investigatorId: data.investigatorId,
        investigationDate: data.investigationDate,
        findings: data.findings,
        rootCause: data.rootCause,
        fiveWhys: data.fiveWhys || {},
        contributingFactors: data.contributingFactors,
        recommendations: data.recommendations,
        coInvestigators: coInvestigators,
        status: InvestigationStatus.DRAFT,
      },
      include: {
        incident: {
          include: {
            reportedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        investigator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Update incident status
    await prisma.incident.update({
      where: { id: data.incidentId },
      data: { status: 'UNDER_INVESTIGATION' },
    });

    // Log audit
    await this.logAudit(createdById, 'CREATE', 'investigations', investigation.id);

    // Create notifications
    await this.createInvestigationNotifications(investigation, 'CREATED');

    return investigation;
  }

  /**
   * Get investigation by ID
   */
  async getInvestigationById(id: string) {
    const investigation = await prisma.investigation.findUnique({
      where: { id },
      include: {
        incident: {
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
          },
        },
        investigator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
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

    if (!investigation) {
      throw new AppError('Investigation not found', 404);
    }

    return investigation;
  }

  /**
   * Get all investigations with filters
   */
  async getInvestigations(filters: {
    status?: InvestigationStatus;
    investigatorId?: string;
    incidentId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20, dateFrom, dateTo, ...where } = filters;
    const skip = (page - 1) * limit;

    const whereClause: any = { ...where };

    if (dateFrom || dateTo) {
      whereClause.investigationDate = {
        ...(dateFrom && { gte: dateFrom }),
        ...(dateTo && { lte: dateTo }),
      };
    }

    const [investigations, total] = await Promise.all([
      prisma.investigation.findMany({
        where: whereClause,
        include: {
          incident: {
            select: {
              id: true,
              incidentNumber: true,
              incidentType: true,
              severity: true,
              location: true,
            },
          },
          investigator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.investigation.count({ where: whereClause }),
    ]);

    return {
      data: investigations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update investigation
   */
  async updateInvestigation(id: string, userId: string, data: UpdateInvestigationData) {
    const existing = await prisma.investigation.findUnique({
      where: { id },
      include: { incident: true },
    });

    if (!existing) {
      throw new AppError('Investigation not found', 404);
    }

    // Only allow updates if in DRAFT status
    if (existing.status !== InvestigationStatus.DRAFT) {
      throw new AppError('Cannot update investigation that has been submitted', 400);
    }

    const investigation = await prisma.investigation.update({
      where: { id },
      data: {
        ...data,
        investigationDate: data.investigationDate,
        fiveWhys: data.fiveWhys ? data.fiveWhys : undefined,
        coInvestigators: data.coInvestigators ? data.coInvestigators : undefined,
      },
      include: {
        incident: true,
        investigator: true,
        correctiveActions: true,
      },
    });

    // Log audit
    await this.logAudit(userId, 'UPDATE', 'investigations', id, data);

    return investigation;
  }

  /**
   * Submit investigation for review
   */
  async submitInvestigation(id: string, userId: string) {
    const investigation = await prisma.investigation.findUnique({
      where: { id },
      include: {
        incident: {
          include: {
            department: true,
          },
        },
        investigator: true,
      },
    });

    if (!investigation) {
      throw new AppError('Investigation not found', 404);
    }

    if (investigation.status !== InvestigationStatus.DRAFT) {
      throw new AppError('Investigation has already been submitted', 400);
    }

    // Validate required fields
    if (!investigation.findings || !investigation.rootCause) {
      throw new AppError('Findings and root cause are required before submission', 400);
    }

    const updated = await prisma.investigation.update({
      where: { id },
      data: {
        status: InvestigationStatus.SUBMITTED,
        submittedAt: new Date(),
      },
      include: {
        incident: true,
        investigator: true,
      },
    });

    // Update incident status
    await prisma.incident.update({
      where: { id: investigation.incidentId },
      data: { status: 'UNDER_REVIEW' },
    });

    // Log audit
    await this.logAudit(userId, 'SUBMIT', 'investigations', id);

    // Notify approvers
    await this.createInvestigationNotifications(updated, 'SUBMITTED');

    return updated;
  }

  /**
   * Approve investigation
   */
  async approveInvestigation(id: string, userId: string, approverRole: string) {
    const investigation = await prisma.investigation.findUnique({
      where: { id },
      include: { incident: true, investigator: true },
    });

    if (!investigation) {
      throw new AppError('Investigation not found', 404);
    }

    if (investigation.status !== InvestigationStatus.SUBMITTED) {
      throw new AppError('Investigation must be submitted before approval', 400);
    }

    // Check if user has approval authority (Safety Head, ASM, etc.)
    // This would be enhanced with actual role checking

    const updated = await prisma.investigation.update({
      where: { id },
      data: {
        status: InvestigationStatus.APPROVED,
        approvedAt: new Date(),
        approvedBy: userId,
      },
      include: {
        incident: true,
        investigator: true,
        correctiveActions: true,
      },
    });

    // Log audit
    await this.logAudit(userId, 'APPROVE', 'investigations', id);

    // Notify investigator
    await this.createInvestigationNotifications(updated, 'APPROVED');

    return updated;
  }

  /**
   * Close investigation (only if all CAPAs are completed)
   */
  async closeInvestigation(id: string, userId: string) {
    const investigation = await prisma.investigation.findUnique({
      where: { id },
      include: {
        correctiveActions: true,
        incident: true,
      },
    });

    if (!investigation) {
      throw new AppError('Investigation not found', 404);
    }

    if (investigation.status !== InvestigationStatus.APPROVED) {
      throw new AppError('Investigation must be approved before closing', 400);
    }

    // Check if all CAPAs are completed/verified
    const pendingCapas = investigation.correctiveActions.filter(
      (capa) => !['COMPLETED', 'VERIFIED', 'CANCELLED'].includes(capa.status)
    );

    if (pendingCapas.length > 0) {
      throw new AppError(
        `Cannot close investigation. ${pendingCapas.length} CAPA(s) still pending.`,
        400
      );
    }

    const updated = await prisma.investigation.update({
      where: { id },
      data: {
        status: InvestigationStatus.CLOSED,
      },
      include: {
        incident: true,
        investigator: true,
        correctiveActions: true,
      },
    });

    // Close the incident
    await prisma.incident.update({
      where: { id: investigation.incidentId },
      data: { status: 'CLOSED' },
    });

    // Log audit
    await this.logAudit(userId, 'CLOSE', 'investigations', id);

    return updated;
  }

  /**
   * Delete investigation (only DRAFT status)
   */
  async deleteInvestigation(id: string, userId: string) {
    const investigation = await prisma.investigation.findUnique({
      where: { id },
    });

    if (!investigation) {
      throw new AppError('Investigation not found', 404);
    }

    if (investigation.status !== InvestigationStatus.DRAFT) {
      throw new AppError('Cannot delete investigation that has been submitted', 403);
    }

    await prisma.investigation.delete({
      where: { id },
    });

    // Revert incident status
    await prisma.incident.update({
      where: { id: investigation.incidentId },
      data: { status: 'SUBMITTED' },
    });

    // Log audit
    await this.logAudit(userId, 'DELETE', 'investigations', id);

    return { message: 'Investigation deleted successfully' };
  }

  /**
   * Get investigation statistics
   */
  async getInvestigationStats(filters: {
    dateFrom?: Date;
    dateTo?: Date;
    departmentId?: string;
  }) {
    const where: any = {};

    if (filters.dateFrom || filters.dateTo) {
      where.investigationDate = {
        ...(filters.dateFrom && { gte: filters.dateFrom }),
        ...(filters.dateTo && { lte: filters.dateTo }),
      };
    }

    if (filters.departmentId) {
      where.incident = {
        departmentId: filters.departmentId,
      };
    }

    const [total, byStatus, avgDuration] = await Promise.all([
      prisma.investigation.count({ where }),
      prisma.investigation.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.investigation.aggregate({
        where: {
          ...where,
          status: InvestigationStatus.CLOSED,
          approvedAt: { not: null },
          submittedAt: { not: null },
        },
        _avg: {
          id: true, // Placeholder - would calculate actual duration
        },
      }),
    ]);

    return {
      total,
      byStatus,
      avgDuration,
    };
  }

  /**
   * Generate unique investigation number
   */
  private async generateInvestigationNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;

    const lastInvestigation = await prisma.investigation.findFirst({
      where: {
        investigationNumber: {
          startsWith: prefix,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let nextNumber = 1;
    if (lastInvestigation) {
      const lastNumber = parseInt(lastInvestigation.investigationNumber.split('-')[2]);
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Determine co-investigators based on severity
   */
  private async determineCoInvestigators(
    severity: Severity,
    departmentId: string | null,
    providedCoInvestigators?: string[]
  ): Promise<string[]> {
    const coInvestigators: string[] = providedCoInvestigators || [];

    // MEDIUM: Add Department Head
    if (severity === Severity.MEDIUM && departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: departmentId },
      });
      if (department?.headId && !coInvestigators.includes(department.headId)) {
        coInvestigators.push(department.headId);
      }
    }

    // HIGH/CRITICAL: Add BU Head + Safety Head
    if ([Severity.HIGH, Severity.CRITICAL].includes(severity)) {
      // Get Safety Head
      const safetyHead = await prisma.user.findFirst({
        where: {
          role: { name: 'Safety Head' },
          isActive: true,
        },
      });

      if (safetyHead && !coInvestigators.includes(safetyHead.id)) {
        coInvestigators.push(safetyHead.id);
      }

      // Add Department Head if applicable
      if (departmentId) {
        const department = await prisma.department.findUnique({
          where: { id: departmentId },
        });
        if (department?.headId && !coInvestigators.includes(department.headId)) {
          coInvestigators.push(department.headId);
        }
      }
    }

    return coInvestigators;
  }

  /**
   * Create notifications for investigation
   */
  private async createInvestigationNotifications(
    investigation: any,
    event: 'CREATED' | 'SUBMITTED' | 'APPROVED'
  ) {
    const notifications: any[] = [];

    if (event === 'CREATED') {
      // Notify investigator
      notifications.push({
        userId: investigation.investigatorId,
        title: `Investigation Assigned: ${investigation.investigationNumber}`,
        message: `You have been assigned to investigate incident ${investigation.incident.incidentNumber}`,
        type: 'INVESTIGATION_REQUIRED',
        entityType: 'investigations',
        entityId: investigation.id,
      });

      // Notify co-investigators
      if (investigation.coInvestigators && Array.isArray(investigation.coInvestigators)) {
        for (const coInvestigatorId of investigation.coInvestigators) {
          notifications.push({
            userId: coInvestigatorId,
            title: `Co-Investigator Assignment: ${investigation.investigationNumber}`,
            message: `You have been assigned as a co-investigator for incident ${investigation.incident.incidentNumber}`,
            type: 'INVESTIGATION_REQUIRED',
            entityType: 'investigations',
            entityId: investigation.id,
          });
        }
      }
    }

    if (event === 'SUBMITTED') {
      // Notify Safety Head for approval
      const safetyHead = await prisma.user.findFirst({
        where: { role: { name: 'Safety Head' }, isActive: true },
      });

      if (safetyHead) {
        notifications.push({
          userId: safetyHead.id,
          title: `Investigation Ready for Approval: ${investigation.investigationNumber}`,
          message: `Investigation for incident ${investigation.incident.incidentNumber} requires your approval`,
          type: 'APPROVAL_REQUIRED',
          entityType: 'investigations',
          entityId: investigation.id,
        });
      }
    }

    if (event === 'APPROVED') {
      // Notify investigator
      notifications.push({
        userId: investigation.investigatorId,
        title: `Investigation Approved: ${investigation.investigationNumber}`,
        message: `Your investigation for incident ${investigation.incident.incidentNumber} has been approved`,
        type: 'SYSTEM_ALERT',
        entityType: 'investigations',
        entityId: investigation.id,
      });
    }

    // Create all notifications
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
