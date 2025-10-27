import { PrismaClient, IncidentType, Severity, IncidentStatus } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware';

const prisma = new PrismaClient();

interface CreateIncidentData {
  incidentDate: string;
  incidentTime: string;
  location: string;
  geoLocation?: string;
  departmentId?: string;
  incidentType: IncidentType;
  severity: Severity;
  injuryType?: string;
  bodyPartAffected?: string;
  witnessName?: string;
  witnessContact?: string;
  propertyDamage: boolean;
  damageDescription?: string;
  description: string;
  immediateAction?: string;
}

interface GetAllFilters {
  page: number;
  limit: number;
  status?: string;
  severity?: string;
  departmentId?: string;
  userId?: string;
  userRole?: string;
}

export class IncidentService {
  async create(data: CreateIncidentData, reportedById: string) {
    // Generate incident number
    const year = new Date().getFullYear();
    const count = await prisma.incident.count({
      where: {
        incidentNumber: {
          startsWith: `INC-${year}`,
        },
      },
    });
    const incidentNumber = `INC-${year}-${String(count + 1).padStart(4, '0')}`;

    // Determine if investigation is required
    const investigationRequired = data.severity === 'HIGH' || data.severity === 'CRITICAL';

    const incident = await prisma.incident.create({
      data: {
        ...data,
        incidentNumber,
        reportedById,
        investigationRequired,
        incidentDate: new Date(data.incidentDate),
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

    // TODO: Create notification for relevant users
    // TODO: If investigation required, assign investigator based on severity

    return incident;
  }

  async getAll(filters: GetAllFilters) {
    const { page, limit, status, severity, departmentId } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (departmentId) where.departmentId = departmentId;

    // TODO: Apply role-based filtering
    // If user is not Safety Head/ASM, only show incidents they can access

    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
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
          investigation: {
            select: {
              id: true,
              investigationNumber: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.incident.count({ where }),
    ]);

    return {
      data: incidents,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string) {
    const incident = await prisma.incident.findUnique({
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
        investigation: {
          include: {
            investigator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            correctiveActions: true,
          },
        },
        attachments: true,
      },
    });

    return incident;
  }

  async update(id: string, data: Partial<CreateIncidentData>) {
    const existing = await prisma.incident.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError('Incident not found', 404);
    }

    if (existing.status !== 'DRAFT') {
      throw new AppError('Cannot update submitted incident', 400);
    }

    const incident = await prisma.incident.update({
      where: { id },
      data: {
        ...data,
        incidentDate: data.incidentDate ? new Date(data.incidentDate) : undefined,
      },
      include: {
        reportedBy: true,
        department: true,
      },
    });

    return incident;
  }

  async delete(id: string) {
    const existing = await prisma.incident.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError('Incident not found', 404);
    }

    if (existing.status !== 'DRAFT') {
      throw new AppError('Cannot delete submitted incident', 400);
    }

    await prisma.incident.delete({ where: { id } });
  }

  async submit(id: string) {
    const existing = await prisma.incident.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError('Incident not found', 404);
    }

    if (existing.status !== 'DRAFT') {
      throw new AppError('Incident already submitted', 400);
    }

    const incident = await prisma.incident.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
      },
      include: {
        reportedBy: true,
        department: true,
      },
    });

    // TODO: Send notifications
    // TODO: If investigation required, create investigation record

    return incident;
  }
}
