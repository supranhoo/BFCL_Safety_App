import { PrismaClient, AuditType, AuditStatus, AuditItemStatus } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware';

const prisma = new PrismaClient();

interface CreateAuditData {
  title: string;
  auditType: AuditType;
  scheduledDate: string;
  location: string;
  departmentId?: string;
  scope: string;
  checklistId?: string;
}

interface GetAllFilters {
  page: number;
  limit: number;
  status?: string;
  auditType?: string;
  departmentId?: string;
}

export class AuditService {
  async create(data: CreateAuditData, auditorId: string) {
    // Generate audit number
    const year = new Date().getFullYear();
    const count = await prisma.audit.count({
      where: {
        auditNumber: {
          startsWith: `AUD-${year}`,
        },
      },
    });
    const auditNumber = `AUD-${year}-${String(count + 1).padStart(4, '0')}`;

    const audit = await prisma.audit.create({
      data: {
        ...data,
        auditNumber,
        auditorId,
        scheduledDate: new Date(data.scheduledDate),
      },
      include: {
        auditor: {
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

    return audit;
  }

  async getAll(filters: GetAllFilters) {
    const { page, limit, status, auditType, departmentId } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) where.status = status;
    if (auditType) where.auditType = auditType;
    if (departmentId) where.departmentId = departmentId;

    const [audits, total] = await Promise.all([
      prisma.audit.findMany({
        where,
        skip,
        take: limit,
        include: {
          auditor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          department: true,
          auditItems: {
            select: {
              id: true,
              status: true,
            },
          },
        },
        orderBy: {
          scheduledDate: 'desc',
        },
      }),
      prisma.audit.count({ where }),
    ]);

    return {
      data: audits,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string) {
    const audit = await prisma.audit.findUnique({
      where: { id },
      include: {
        auditor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
          },
        },
        department: true,
        auditItems: {
          orderBy: {
            checkpointNumber: 'asc',
          },
        },
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

    return audit;
  }

  async update(id: string, data: Partial<CreateAuditData>) {
    const existing = await prisma.audit.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError('Audit not found', 404);
    }

    if (existing.status === 'COMPLETED' || existing.status === 'CLOSED') {
      throw new AppError('Cannot update completed or closed audit', 400);
    }

    const audit = await prisma.audit.update({
      where: { id },
      data: {
        ...data,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
      },
      include: {
        auditor: true,
        department: true,
      },
    });

    return audit;
  }

  async complete(id: string) {
    const existing = await prisma.audit.findUnique({
      where: { id },
      include: {
        auditItems: true,
      },
    });

    if (!existing) {
      throw new AppError('Audit not found', 404);
    }

    if (existing.status === 'COMPLETED') {
      throw new AppError('Audit already completed', 400);
    }

    // Calculate overall score and counts
    const totalItems = existing.auditItems.length;
    const compliantItems = existing.auditItems.filter(
      (item) => item.status === 'COMPLIANT'
    ).length;
    const nonConformances = existing.auditItems.filter(
      (item) => item.status === 'NON_COMPLIANT'
    ).length;
    const observations = existing.auditItems.filter(
      (item) => item.status === 'OBSERVATION'
    ).length;

    const overallScore = totalItems > 0 ? (compliantItems / totalItems) * 100 : 0;
    const passed = overallScore >= 70; // Configurable threshold

    const audit = await prisma.audit.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedDate: new Date(),
        overallScore,
        passed,
        nonConformances,
        observations,
      },
      include: {
        auditor: true,
        department: true,
        auditItems: true,
      },
    });

    // TODO: Generate CAPAs for non-conformances

    return audit;
  }

  async getAuditCheckpoints(auditType: AuditType) {
    // This would typically fetch from a checklist template table
    // For now, return a placeholder structure
    // In production, create a separate ChecklistTemplate model
    return {
      auditType,
      checkpoints: [],
      message: 'Checklist templates not yet implemented',
    };
  }
}
