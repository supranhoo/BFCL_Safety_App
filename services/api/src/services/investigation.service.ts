import { PrismaClient, InvestigationStatus, Priority, CAPAStatus, CAPASourceType } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware';

const prisma = new PrismaClient();

interface CreateInvestigationData {
  incidentId: string;
  investigationDate: string;
  findings: string;
  rootCause: string;
  fiveWhys?: any; // JSON structure
  contributingFactors?: string;
  recommendations?: string;
  coInvestigators?: string[]; // Array of user IDs
}

interface UpdateInvestigationData {
  investigationDate?: string;
  findings?: string;
  rootCause?: string;
  fiveWhys?: any;
  contributingFactors?: string;
  recommendations?: string;
  coInvestigators?: string[];
}

interface CreateCAPAData {
  title: string;
  description: string;
  assignedToId: string;
  dueDate: string;
  priority: Priority;
}

interface GetAllFilters {
  page: number;
  limit: number;
  status?: string;
  incidentId?: string;
}

export class InvestigationService {
  /**
   * Create a new investigation linked to an incident
   * Auto-assigns investigator based on incident severity
   */
  async create(data: CreateInvestigationData, investigatorId: string) {
    // Check if incident exists and doesn't already have an investigation
    const incident = await prisma.incident.findUnique({
      where: { id: data.incidentId },
      include: {
        investigation: true,
        reportedBy: true,
      },
    });

    if (!incident) {
      throw new AppError('Incident not found', 404);
    }

    if (incident.investigation) {
      throw new AppError('Investigation already exists for this incident', 400);
    }

    // Generate investigation number
    const year = new Date().getFullYear();
    const count = await prisma.investigation.count({
      where: {
        investigationNumber: {
          startsWith: `INV-${year}`,
        },
      },
    });
    const investigationNumber = `INV-${year}-${String(count + 1).padStart(4, '0')}`;

    // Create investigation
    const investigation = await prisma.investigation.create({
      data: {
        investigationNumber,
        incidentId: data.incidentId,
        investigatorId,
        investigationDate: new Date(data.investigationDate),
        findings: data.findings,
        rootCause: data.rootCause,
        fiveWhys: data.fiveWhys,
        contributingFactors: data.contributingFactors,
        recommendations: data.recommendations,
        coInvestigators: data.coInvestigators || [],
      },
      include: {
        investigator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
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
            department: true,
          },
        },
      },
    });

    // Update incident status
    await prisma.incident.update({
      where: { id: data.incidentId },
      data: {
        status: 'UNDER_INVESTIGATION',
      },
    });

    // TODO: Create notification for assigned investigator
    // TODO: Create notifications for co-investigators

    return investigation;
  }

  /**
   * Get all investigations with filters and pagination
   */
  async getAll(filters: GetAllFilters) {
    const { page, limit, status, incidentId } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) where.status = status;
    if (incidentId) where.incidentId = incidentId;

    // TODO: Apply role-based filtering
    // If user is not Safety Head/ASM, only show investigations they're involved in

    const [investigations, total] = await Promise.all([
      prisma.investigation.findMany({
        where,
        skip,
        take: limit,
        include: {
          investigator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
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
              department: true,
            },
          },
          correctiveActions: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.investigation.count({ where }),
    ]);

    return {
      data: investigations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get investigation by ID with full details
   */
  async getById(id: string) {
    const investigation = await prisma.investigation.findUnique({
      where: { id },
      include: {
        investigator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
            role: true,
          },
        },
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
            department: true,
            attachments: true,
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
   * Update investigation (only allowed in DRAFT status)
   */
  async update(id: string, data: UpdateInvestigationData) {
    const existing = await prisma.investigation.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError('Investigation not found', 404);
    }

    if (existing.status !== 'DRAFT') {
      throw new AppError('Cannot update submitted investigation', 400);
    }

    const investigation = await prisma.investigation.update({
      where: { id },
      data: {
        investigationDate: data.investigationDate
          ? new Date(data.investigationDate)
          : undefined,
        findings: data.findings,
        rootCause: data.rootCause,
        fiveWhys: data.fiveWhys,
        contributingFactors: data.contributingFactors,
        recommendations: data.recommendations,
        coInvestigators: data.coInvestigators,
      },
      include: {
        investigator: true,
        incident: true,
        correctiveActions: true,
      },
    });

    return investigation;
  }

  /**
   * Submit investigation for review
   */
  async submit(id: string) {
    const existing = await prisma.investigation.findUnique({
      where: { id },
      include: {
        incident: true,
        correctiveActions: true,
      },
    });

    if (!existing) {
      throw new AppError('Investigation not found', 404);
    }

    if (existing.status !== 'DRAFT') {
      throw new AppError('Investigation already submitted', 400);
    }

    // Validate that HIGH/CRITICAL incidents have at least one CAPA
    if (
      (existing.incident.severity === 'HIGH' || existing.incident.severity === 'CRITICAL') &&
      existing.correctiveActions.length === 0
    ) {
      throw new AppError(
        'At least one corrective action required for HIGH/CRITICAL incidents',
        400
      );
    }

    const investigation = await prisma.investigation.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
      include: {
        investigator: true,
        incident: true,
        correctiveActions: true,
      },
    });

    // TODO: Send notification to approver (ASM or Safety Head based on severity)

    return investigation;
  }

  /**
   * Approve investigation (only for authorized users)
   */
  async approve(id: string, approverId: string) {
    const existing = await prisma.investigation.findUnique({
      where: { id },
      include: {
        incident: true,
      },
    });

    if (!existing) {
      throw new AppError('Investigation not found', 404);
    }

    if (existing.status !== 'SUBMITTED' && existing.status !== 'UNDER_REVIEW') {
      throw new AppError('Investigation not in a state to be approved', 400);
    }

    const investigation = await prisma.investigation.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: approverId,
      },
      include: {
        investigator: true,
        incident: true,
        correctiveActions: true,
      },
    });

    // Update incident status
    await prisma.incident.update({
      where: { id: existing.incidentId },
      data: {
        status: 'CLOSED',
      },
    });

    // TODO: Send notification to investigator and reporter

    return investigation;
  }

  /**
   * Create a corrective action (CAPA) linked to investigation
   */
  async createCorrectiveAction(investigationId: string, data: CreateCAPAData, createdById: string) {
    const investigation = await prisma.investigation.findUnique({
      where: { id: investigationId },
      include: { incident: true },
    });

    if (!investigation) {
      throw new AppError('Investigation not found', 404);
    }

    // Generate CAPA number
    const year = new Date().getFullYear();
    const count = await prisma.correctiveAction.count({
      where: {
        capaNumber: {
          startsWith: `CAPA-${year}`,
        },
      },
    });
    const capaNumber = `CAPA-${year}-${String(count + 1).padStart(4, '0')}`;

    const capa = await prisma.correctiveAction.create({
      data: {
        capaNumber,
        title: data.title,
        description: data.description,
        sourceType: 'INVESTIGATION' as CAPASourceType,
        sourceId: investigationId,
        investigationId,
        assignedToId: data.assignedToId,
        createdById,
        dueDate: new Date(data.dueDate),
        priority: data.priority,
        status: 'PENDING' as CAPAStatus,
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
            email: true,
          },
        },
        investigation: {
          select: {
            id: true,
            investigationNumber: true,
          },
        },
      },
    });

    // TODO: Create notification for assigned user

    return capa;
  }

  /**
   * Delete investigation (only allowed in DRAFT status)
   */
  async delete(id: string) {
    const existing = await prisma.investigation.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError('Investigation not found', 404);
    }

    if (existing.status !== 'DRAFT') {
      throw new AppError('Cannot delete submitted investigation', 400);
    }

    await prisma.investigation.delete({ where: { id } });

    // Reset incident status
    await prisma.incident.update({
      where: { id: existing.incidentId },
      data: {
        status: 'UNDER_REVIEW',
      },
    });
  }

  /**
   * Get investigation statistics
   */
  async getStatistics() {
    const [
      totalInvestigations,
      draftCount,
      submittedCount,
      approvedCount,
      avgDaysToComplete,
    ] = await Promise.all([
      prisma.investigation.count(),
      prisma.investigation.count({ where: { status: 'DRAFT' } }),
      prisma.investigation.count({ where: { status: 'SUBMITTED' } }),
      prisma.investigation.count({ where: { status: 'APPROVED' } }),
      prisma.$queryRaw<Array<{ avg_days: number }>>`
        SELECT AVG(EXTRACT(DAY FROM (approved_at - created_at))) as avg_days
        FROM investigations
        WHERE status = 'APPROVED'
      `,
    ]);

    return {
      total: totalInvestigations,
      byStatus: {
        draft: draftCount,
        submitted: submittedCount,
        approved: approvedCount,
      },
      avgDaysToComplete: (avgDaysToComplete[0]?.avg_days as number) || 0,
    };
  }
}
