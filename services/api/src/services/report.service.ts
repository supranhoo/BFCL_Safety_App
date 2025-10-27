import { PrismaClient } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware';

const prisma = new PrismaClient();

export class ReportService {
  async getDashboard() {
    // Get incident statistics
    const totalIncidents = await prisma.incident.count();
    const openIncidents = await prisma.incident.count({
      where: { status: 'SUBMITTED' },
    });
    const closedIncidents = await prisma.incident.count({
      where: { status: 'CLOSED' },
    });

    // Get investigation statistics
    const openInvestigations = await prisma.investigation.count({
      where: { status: { in: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'] } },
    });

    // Get hazard statistics
    const openHazards = await prisma.hazard.count({
      where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } },
    });
    const highRiskHazards = await prisma.hazard.count({
      where: { riskLevel: { in: ['HIGH', 'EXTREME'] } },
    });

    // Get CAPA statistics
    const openCapas = await prisma.correctiveAction.count({
      where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
    });
    const overdueCapas = await prisma.correctiveAction.count({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        dueDate: { lt: new Date() },
      },
    });

    // Get training statistics
    const upcomingTrainings = await prisma.trainingSession.count({
      where: {
        status: 'SCHEDULED',
        scheduledDate: { gte: new Date() },
      },
    });

    // Get audit statistics
    const upcomingAudits = await prisma.audit.count({
      where: {
        status: 'SCHEDULED',
        scheduledDate: { gte: new Date() },
      },
    });

    return {
      incidents: {
        total: totalIncidents,
        open: openIncidents,
        closed: closedIncidents,
      },
      investigations: {
        open: openInvestigations,
      },
      hazards: {
        open: openHazards,
        highRisk: highRiskHazards,
      },
      capas: {
        open: openCapas,
        overdue: overdueCapas,
      },
      trainings: {
        upcoming: upcomingTrainings,
      },
      audits: {
        upcoming: upcomingAudits,
      },
    };
  }

  async getIncidentReport(filters: {
    startDate?: string;
    endDate?: string;
    departmentId?: string;
    incidentType?: string;
    severity?: string;
  }) {
    const where: any = {};

    if (filters.startDate && filters.endDate) {
      where.incidentDate = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    }

    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.incidentType) where.incidentType = filters.incidentType;
    if (filters.severity) where.severity = filters.severity;

    const incidents = await prisma.incident.findMany({
      where,
      include: {
        reportedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        department: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        incidentDate: 'desc',
      },
    });

    // Calculate statistics
    const byType = incidents.reduce((acc: any, inc) => {
      acc[inc.incidentType] = (acc[inc.incidentType] || 0) + 1;
      return acc;
    }, {});

    const bySeverity = incidents.reduce((acc: any, inc) => {
      acc[inc.severity] = (acc[inc.severity] || 0) + 1;
      return acc;
    }, {});

    return {
      incidents,
      statistics: {
        total: incidents.length,
        byType,
        bySeverity,
      },
    };
  }

  async getOSHALog(filters: { year: number }) {
    const startDate = new Date(filters.year, 0, 1);
    const endDate = new Date(filters.year, 11, 31);

    const incidents = await prisma.incident.findMany({
      where: {
        incidentDate: {
          gte: startDate,
          lte: endDate,
        },
        incidentType: { in: ['INJURY', 'ILLNESS'] },
      },
      include: {
        reportedBy: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true,
          },
        },
        department: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        incidentDate: 'asc',
      },
    });

    return {
      year: filters.year,
      incidents,
      summary: {
        totalInjuries: incidents.filter((i) => i.incidentType === 'INJURY').length,
        totalIllnesses: incidents.filter((i) => i.incidentType === 'ILLNESS').length,
      },
    };
  }

  async getKPIReport() {
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31);

    // Get total incidents
    const totalIncidents = await prisma.incident.count({
      where: {
        incidentDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Get recordable incidents (excluding near misses)
    const recordableIncidents = await prisma.incident.count({
      where: {
        incidentDate: {
          gte: startDate,
          lte: endDate,
        },
        incidentType: { in: ['INJURY', 'ILLNESS'] },
      },
    });

    // Get lost time injuries
    const lostTimeInjuries = await prisma.incident.count({
      where: {
        incidentDate: {
          gte: startDate,
          lte: endDate,
        },
        incidentType: 'INJURY',
        severity: { in: ['HIGH', 'CRITICAL'] },
      },
    });

    // Get CAPA statistics
    const totalCapas = await prisma.correctiveAction.count();
    const completedCapas = await prisma.correctiveAction.count({
      where: { status: 'VERIFIED' },
    });
    const onTimeCapas = await prisma.correctiveAction.count({
      where: {
        status: 'VERIFIED',
        completionDate: { lte: prisma.correctiveAction.fields.dueDate },
      },
    });

    // Get training statistics
    const totalSessions = await prisma.trainingSession.count({
      where: { status: 'COMPLETED' },
    });
    const totalAttendances = await prisma.trainingAttendance.count({
      where: { attended: true },
    });

    // Get audit statistics
    const completedAudits = await prisma.audit.count({
      where: { status: 'COMPLETED' },
    });
    const passedAudits = await prisma.audit.count({
      where: { status: 'COMPLETED', passed: true },
    });

    // Calculate KPIs (using example values for working hours)
    const totalWorkingHours = 2000000; // Example: 1000 employees * 2000 hours
    const ltifr = (lostTimeInjuries / totalWorkingHours) * 1000000;
    const trir = (recordableIncidents / totalWorkingHours) * 200000;
    const capaClosureRate = totalCapas > 0 ? (onTimeCapas / totalCapas) * 100 : 0;
    const trainingCompletionRate =
      totalSessions > 0 ? (totalAttendances / totalSessions) * 100 : 0;
    const auditComplianceRate =
      completedAudits > 0 ? (passedAudits / completedAudits) * 100 : 0;

    return {
      period: {
        year: currentYear,
        startDate,
        endDate,
      },
      kpis: {
        ltifr: Number(ltifr.toFixed(2)),
        trir: Number(trir.toFixed(2)),
        capaClosureRate: Number(capaClosureRate.toFixed(2)),
        trainingCompletionRate: Number(trainingCompletionRate.toFixed(2)),
        auditComplianceRate: Number(auditComplianceRate.toFixed(2)),
      },
      statistics: {
        incidents: {
          total: totalIncidents,
          recordable: recordableIncidents,
          lostTime: lostTimeInjuries,
        },
        capas: {
          total: totalCapas,
          completed: completedCapas,
          onTime: onTimeCapas,
        },
        trainings: {
          sessions: totalSessions,
          attendances: totalAttendances,
        },
        audits: {
          completed: completedAudits,
          passed: passedAudits,
        },
      },
    };
  }

  async getHazardReport(filters: {
    startDate?: string;
    endDate?: string;
    departmentId?: string;
    category?: string;
    riskLevel?: string;
  }) {
    const where: any = {};

    if (filters.startDate && filters.endDate) {
      where.reportedAt = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    }

    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.category) where.category = filters.category;
    if (filters.riskLevel) where.riskLevel = filters.riskLevel;

    const hazards = await prisma.hazard.findMany({
      where,
      include: {
        reportedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        department: {
          select: {
            name: true,
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
      orderBy: {
        reportedAt: 'desc',
      },
    });

    // Calculate statistics
    const byCategory = hazards.reduce((acc: any, haz) => {
      acc[haz.category] = (acc[haz.category] || 0) + 1;
      return acc;
    }, {});

    const byRiskLevel = hazards.reduce((acc: any, haz) => {
      acc[haz.riskLevel] = (acc[haz.riskLevel] || 0) + 1;
      return acc;
    }, {});

    return {
      hazards,
      statistics: {
        total: hazards.length,
        byCategory,
        byRiskLevel,
      },
    };
  }

  async getCAPAReport(filters: {
    startDate?: string;
    endDate?: string;
    status?: string;
    sourceType?: string;
    assignedToId?: string;
  }) {
    const where: any = {};

    if (filters.startDate && filters.endDate) {
      where.createdAt = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    }

    if (filters.status) where.status = filters.status;
    if (filters.sourceType) where.sourceType = filters.sourceType;
    if (filters.assignedToId) where.assignedToId = filters.assignedToId;

    const capas = await prisma.correctiveAction.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate aging
    const capasWithAging = capas.map((capa) => ({
      ...capa,
      ageDays: Math.floor(
        (new Date().getTime() - new Date(capa.createdAt).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
      isOverdue: capa.dueDate < new Date() && capa.status !== 'VERIFIED',
    }));

    const byStatus = capas.reduce((acc: any, capa) => {
      acc[capa.status] = (acc[capa.status] || 0) + 1;
      return acc;
    }, {});

    return {
      capas: capasWithAging,
      statistics: {
        total: capas.length,
        byStatus,
        overdue: capasWithAging.filter((c) => c.isOverdue).length,
      },
    };
  }
}
