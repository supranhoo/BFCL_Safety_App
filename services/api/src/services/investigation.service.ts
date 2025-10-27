import { PrismaClient, InvestigationStatus } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware';

const prisma = new PrismaClient();

interface CreateInvestigationData {
  incidentId: string;
  investigatorId: string;
  investigationDate: string;
  coInvestigators?: string[];
  findings: string;
  rootCause: string;
  fiveWhys?: any;
  contributingFactors?: string;
  recommendations?: string;
}

interface GetAllFilters {
  page: number;
  limit: number;
  status?: string;
  userId?: string;
  userRole?: string;
}

export class InvestigationService {
  async create(data: CreateInvestigationData) {
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

    const investigation = await prisma.investigation.create({
      data: {
        ...data,
        investigationNumber,
        investigationDate: new Date(data.investigationDate),
      },
      include: {
        incident: true,
        investigator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return investigation;
  }

  async getAll(filters: GetAllFilters) {
    const { page, limit, status } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) where.status = status;

    const [investigations, total] = await Promise.all([
      prisma.investigation.findMany({
        where,
        skip,
        take: limit,
        include: {
          incident: {
            select: {
              id: true,
              incidentNumber: true,
              incidentType: true,
              severity: true,
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

  async getById(id: string) {
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
            employeeId: true,
          },
        },
        correctiveActions: true,
        attachments: true,
      },
    });

    return investigation;
  }

  async update(id: string, data: Partial<CreateInvestigationData>) {
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
        ...data,
        investigationDate: data.investigationDate
          ? new Date(data.investigationDate)
          : undefined,
      },
      include: {
        incident: true,
        investigator: true,
      },
    });

    return investigation;
  }

  async submit(id: string) {
    const existing = await prisma.investigation.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError('Investigation not found', 404);
    }

    if (existing.status !== 'DRAFT') {
      throw new AppError('Investigation already submitted', 400);
    }

    const investigation = await prisma.investigation.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
      include: {
        incident: true,
        investigator: true,
      },
    });

    return investigation;
  }

  async approve(id: string, approvedBy: string) {
    const existing = await prisma.investigation.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError('Investigation not found', 404);
    }

    if (existing.status !== 'SUBMITTED' && existing.status !== 'UNDER_REVIEW') {
      throw new AppError('Investigation not in valid state for approval', 400);
    }

    const investigation = await prisma.investigation.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy,
      },
      include: {
        incident: true,
        investigator: true,
      },
    });

    return investigation;
  }
}
