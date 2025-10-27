import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

interface DashboardStats {
  incidents: {
    total: number;
    open: number;
    closed: number;
    byType: any[];
    bySeverity: any[];
  };
  investigations: {
    total: number;
    pending: number;
    completed: number;
  };
  hazards: {
    total: number;
    open: number;
    byRiskLevel: any[];
  };
  capa: {
    total: number;
    pending: number;
    overdue: number;
    completed: number;
  };
  training: {
    upcomingSessions: number;
    certificationsDueSoon: number;
  };
}

export class ReportService {
  async getDashboard(dateFilter?: DateRangeFilter): Promise<DashboardStats> {
    const dateWhere = this.buildDateFilter(dateFilter);

    // Fetch all statistics in parallel
    const [
      totalIncidents,
      openIncidents,
      closedIncidents,
      incidentsByType,
      incidentsBySeverity,
      totalInvestigations,
      pendingInvestigations,
      completedInvestigations,
      totalHazards,
      openHazards,
      hazardsByRiskLevel,
      totalCAPA,
      pendingCAPA,
      overdueCAPA,
      completedCAPA,
      upcomingTrainingSessions,
      certificationsDueSoon,
    ] = await Promise.all([
      prisma.incident.count({ where: dateWhere }),
      prisma.incident.count({ where: { ...dateWhere, status: { in: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'] } } }),
      prisma.incident.count({ where: { ...dateWhere, status: 'CLOSED' } }),
      prisma.incident.groupBy({
        by: ['incidentType'],
        where: dateWhere,
        _count: true,
      }),
      prisma.incident.groupBy({
        by: ['severity'],
        where: dateWhere,
        _count: true,
      }),
      prisma.investigation.count({ where: dateWhere }),
      prisma.investigation.count({
        where: { ...dateWhere, status: { in: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'] } },
      }),
      prisma.investigation.count({ where: { ...dateWhere, status: { in: ['APPROVED', 'CLOSED'] } } }),
      prisma.hazard.count({ where: dateWhere }),
      prisma.hazard.count({ where: { ...dateWhere, status: 'OPEN' } }),
      prisma.hazard.groupBy({
        by: ['riskLevel'],
        where: dateWhere,
        _count: true,
      }),
      prisma.correctiveAction.count({ where: dateWhere }),
      prisma.correctiveAction.count({ where: { ...dateWhere, status: 'PENDING' } }),
      prisma.correctiveAction.count({
        where: {
          ...dateWhere,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          dueDate: { lt: new Date() },
        },
      }),
      prisma.correctiveAction.count({ where: { ...dateWhere, status: { in: ['COMPLETED', 'VERIFIED'] } } }),
      prisma.trainingSession.count({
        where: {
          status: 'SCHEDULED',
          scheduledDate: { gte: new Date() },
        },
      }),
      prisma.certification.count({
        where: {
          isValid: true,
          expiryDate: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            gte: new Date(),
          },
        },
      }),
    ]);

    return {
      incidents: {
        total: totalIncidents,
        open: openIncidents,
        closed: closedIncidents,
        byType: incidentsByType.map((item) => ({
          type: item.incidentType,
          count: item._count,
        })),
        bySeverity: incidentsBySeverity.map((item) => ({
          severity: item.severity,
          count: item._count,
        })),
      },
      investigations: {
        total: totalInvestigations,
        pending: pendingInvestigations,
        completed: completedInvestigations,
      },
      hazards: {
        total: totalHazards,
        open: openHazards,
        byRiskLevel: hazardsByRiskLevel.map((item) => ({
          riskLevel: item.riskLevel,
          count: item._count,
        })),
      },
      capa: {
        total: totalCAPA,
        pending: pendingCAPA,
        overdue: overdueCAPA,
        completed: completedCAPA,
      },
      training: {
        upcomingSessions: upcomingTrainingSessions,
        certificationsDueSoon: certificationsDueSoon,
      },
    };
  }

  async getIncidentReport(filters?: DateRangeFilter & { departmentId?: string }) {
    const where = this.buildDateFilter(filters);
    if (filters?.departmentId) {
      where.departmentId = filters.departmentId;
    }

    const incidents = await prisma.incident.findMany({
      where,
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
            code: true,
          },
        },
        investigation: {
          select: {
            investigationNumber: true,
            status: true,
          },
        },
      },
      orderBy: {
        incidentDate: 'desc',
      },
    });

    return incidents;
  }

  async getOSHALog(year: number) {
    // OSHA 300 Log - Records of Work-Related Injuries and Illnesses
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);

    const incidents = await prisma.incident.findMany({
      where: {
        incidentDate: {
          gte: startDate,
          lte: endDate,
        },
        incidentType: {
          in: ['INJURY', 'ILLNESS'],
        },
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
      year,
      totalRecordable: incidents.length,
      injuries: incidents.filter((i) => i.incidentType === 'INJURY').length,
      illnesses: incidents.filter((i) => i.incidentType === 'ILLNESS').length,
      records: incidents,
    };
  }

  async getCAPAAgeing(filters?: { status?: string; departmentId?: string }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;

    const capas = await prisma.correctiveAction.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true,
            department: {
              select: {
                name: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    // Calculate age in days for each CAPA
    const now = new Date();
    const agedCapas = capas.map((capa) => {
      const createdDate = new Date(capa.createdAt);
      const ageDays = Math.floor(
        (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      const dueDate = new Date(capa.dueDate);
      const daysUntilDue = Math.floor(
        (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        ...capa,
        ageDays,
        daysUntilDue,
        isOverdue: daysUntilDue < 0,
      };
    });

    return {
      total: agedCapas.length,
      overdue: agedCapas.filter((c) => c.isOverdue).length,
      capas: agedCapas,
    };
  }

  async getKPIReport(year: number) {
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);

    // Get total hours worked (this would typically come from HR system)
    // For now, use a placeholder calculation
    const totalEmployees = await prisma.user.count({ where: { isActive: true } });
    const workingHoursPerYear = 2080; // Standard full-time hours
    const totalHoursWorked = totalEmployees * workingHoursPerYear;

    // Get incidents
    const [totalIncidents, lostTimeInjuries, recordableIncidents] =
      await Promise.all([
        prisma.incident.count({
          where: {
            incidentDate: { gte: startDate, lte: endDate },
          },
        }),
        prisma.incident.count({
          where: {
            incidentDate: { gte: startDate, lte: endDate },
            incidentType: 'INJURY',
            // In production, add field for lost time days > 0
          },
        }),
        prisma.incident.count({
          where: {
            incidentDate: { gte: startDate, lte: endDate },
            incidentType: { in: ['INJURY', 'ILLNESS'] },
          },
        }),
      ]);

    // Calculate KPIs
    const ltifr = (lostTimeInjuries * 1000000) / totalHoursWorked;
    const trir = (recordableIncidents * 200000) / totalHoursWorked;

    // Get training completion rate
    const [totalScheduledTraining, completedTraining] = await Promise.all([
      prisma.trainingSession.count({
        where: {
          scheduledDate: { gte: startDate, lte: endDate },
        },
      }),
      prisma.trainingSession.count({
        where: {
          scheduledDate: { gte: startDate, lte: endDate },
          status: 'COMPLETED',
        },
      }),
    ]);

    const trainingCompletionRate =
      totalScheduledTraining > 0
        ? (completedTraining / totalScheduledTraining) * 100
        : 0;

    // Get CAPA closure rate
    // Note: In production, this would need a more sophisticated approach
    // to compare completionDate against dueDate field
    const [totalCAPAs, closedOnTimeCAPAs] = await Promise.all([
      prisma.correctiveAction.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.correctiveAction.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: { in: ['COMPLETED', 'VERIFIED'] },
        },
      }),
    ]);

    const capaClosureRate = totalCAPAs > 0 ? (closedOnTimeCAPAs / totalCAPAs) * 100 : 0;

    return {
      year,
      totalHoursWorked,
      totalIncidents,
      lostTimeInjuries,
      recordableIncidents,
      ltifr: Number(ltifr.toFixed(2)),
      trir: Number(trir.toFixed(2)),
      trainingCompletionRate: Number(trainingCompletionRate.toFixed(2)),
      capaClosureRate: Number(capaClosureRate.toFixed(2)),
      targets: {
        ltifr: 0.5,
        trir: 2.0,
        trainingCompletionRate: 95,
        capaClosureRate: 90,
      },
    };
  }

  async getComplianceReport(filters?: DateRangeFilter) {
    const dateWhere = this.buildDateFilter(filters);

    const [totalAudits, completedAudits, passedAudits, auditsByType] =
      await Promise.all([
        prisma.audit.count({ where: dateWhere }),
        prisma.audit.count({ where: { ...dateWhere, status: 'COMPLETED' } }),
        prisma.audit.count({
          where: { ...dateWhere, status: 'COMPLETED', passed: true },
        }),
        prisma.audit.groupBy({
          by: ['auditType'],
          where: { ...dateWhere, status: 'COMPLETED' },
          _count: true,
          _avg: {
            overallScore: true,
          },
        }),
      ]);

    const complianceScore =
      completedAudits > 0 ? (passedAudits / completedAudits) * 100 : 0;

    return {
      totalAudits,
      completedAudits,
      passedAudits,
      complianceScore: Number(complianceScore.toFixed(2)),
      auditsByType: auditsByType.map((item) => ({
        auditType: item.auditType,
        count: item._count,
        averageScore: item._avg.overallScore
          ? Number(item._avg.overallScore.toFixed(2))
          : 0,
      })),
    };
  }

  private buildDateFilter(filters?: DateRangeFilter) {
    const where: any = {};

    if (filters?.startDate && filters?.endDate) {
      where.createdAt = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    } else if (filters?.startDate) {
      where.createdAt = {
        gte: new Date(filters.startDate),
      };
    } else if (filters?.endDate) {
      where.createdAt = {
        lte: new Date(filters.endDate),
      };
    }

    return where;
  }
}
