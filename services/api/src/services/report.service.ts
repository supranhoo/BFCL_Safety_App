import { PrismaClient, Severity } from '@prisma/client';

const prisma = new PrismaClient();

export class ReportService {
  /**
   * Dashboard statistics
   */
  async getDashboardStats() {
    const [
      totalIncidents,
      openIncidents,
      openCAPAs,
      overdueCAPAs,
      openHazards,
      upcomingAudits,
      expiringCerts,
      activeUsers,
    ] = await Promise.all([
      prisma.incident.count(),
      prisma.incident.count({ where: { status: { in: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'] } } }),
      prisma.correctiveAction.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.correctiveAction.count({
        where: {
          status: { in: ['OPEN', 'IN_PROGRESS'] },
          targetDate: { lt: new Date() },
        },
      }),
      prisma.hazard.count({ where: { status: { in: ['IDENTIFIED', 'UNDER_REVIEW', 'MITIGATED'] } } }),
      prisma.audit.count({
        where: {
          status: 'SCHEDULED',
          scheduledDate: { gte: new Date(), lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.certification.count({
        where: {
          expiryDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), gte: new Date() },
        },
      }),
      prisma.user.count({ where: { isActive: true } }),
    ]);

    return {
      totalIncidents,
      openIncidents,
      openCAPAs,
      overdueCAPAs,
      openHazards,
      upcomingAudits,
      expiringCerts,
      activeUsers,
    };
  }

  /**
   * Calculate LTIFR (Lost Time Injury Frequency Rate)
   * Formula: (Number of Lost Time Injuries × 200,000) / Total Hours Worked
   */
  async calculateLTIFR(startDate: Date, endDate: Date, totalHoursWorked: number) {
    const lostTimeInjuries = await prisma.incident.count({
      where: {
        incidentDate: { gte: startDate, lte: endDate },
        type: 'INJURY',
        severity: { in: [Severity.HIGH, Severity.CRITICAL] },
      },
    });

    const ltifr = totalHoursWorked > 0 ? (lostTimeInjuries * 200000) / totalHoursWorked : 0;
    return { lostTimeInjuries, totalHoursWorked, ltifr: Math.round(ltifr * 100) / 100 };
  }

  /**
   * Calculate TRIR (Total Recordable Incident Rate)
   * Formula: (Number of Recordable Incidents × 200,000) / Total Hours Worked
   */
  async calculateTRIR(startDate: Date, endDate: Date, totalHoursWorked: number) {
    const recordableIncidents = await prisma.incident.count({
      where: {
        incidentDate: { gte: startDate, lte: endDate },
        status: { not: 'DRAFT' },
      },
    });

    const trir = totalHoursWorked > 0 ? (recordableIncidents * 200000) / totalHoursWorked : 0;
    return { recordableIncidents, totalHoursWorked, trir: Math.round(trir * 100) / 100 };
  }

  /**
   * Incident trends by month
   */
  async getIncidentTrends(startDate: Date, endDate: Date) {
    const incidents = await prisma.incident.findMany({
      where: { incidentDate: { gte: startDate, lte: endDate } },
      orderBy: { incidentDate: 'asc' },
    });

    const trendsByMonth: Record<string, { total: number; bySeverity: Record<string, number> }> = {};

    incidents.forEach((inc) => {
      const monthKey = `${inc.incidentDate.getFullYear()}-${String(inc.incidentDate.getMonth() + 1).padStart(2, '0')}`;
      if (!trendsByMonth[monthKey]) {
        trendsByMonth[monthKey] = { total: 0, bySeverity: {} };
      }
      trendsByMonth[monthKey].total++;
      trendsByMonth[monthKey].bySeverity[inc.severity] =
        (trendsByMonth[monthKey].bySeverity[inc.severity] || 0) + 1;
    });

    return trendsByMonth;
  }

  /**
   * OSHA 300 Log (injury and illness log)
   */
  async getOSHA300Log(year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const incidents = await prisma.incident.findMany({
      where: {
        incidentDate: { gte: startDate, lte: endDate },
        type: { in: ['INJURY', 'ILLNESS'] },
      },
      include: {
        reportedBy: { select: { firstName: true, lastName: true, employeeId: true } },
        department: { select: { name: true } },
      },
      orderBy: { incidentDate: 'asc' },
    });

    return incidents.map((inc) => ({
      caseNumber: inc.incidentNumber,
      date: inc.incidentDate,
      employee: `${inc.reportedBy?.firstName} ${inc.reportedBy?.lastName}`,
      employeeId: inc.reportedBy?.employeeId,
      location: inc.location,
      description: inc.description,
      type: inc.type,
      severity: inc.severity,
      department: inc.department?.name,
    }));
  }

  /**
   * OSHA 301 Log (injury and illness incident report)
   */
  async getOSHA301Report(incidentId: string) {
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      include: {
        reportedBy: { select: { firstName: true, lastName: true, employeeId: true } },
        department: { select: { name: true } },
        investigation: {
          include: {
            investigator: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!incident) return null;

    return {
      caseNumber: incident.incidentNumber,
      incidentDate: incident.incidentDate,
      employee: {
        name: `${incident.reportedBy?.firstName} ${incident.reportedBy?.lastName}`,
        employeeId: incident.reportedBy?.employeeId,
      },
      location: incident.location,
      description: incident.description,
      type: incident.type,
      severity: incident.severity,
      immediateAction: incident.immediateAction,
      department: incident.department?.name,
      investigation: incident.investigation
        ? {
            investigator: `${incident.investigation.investigator?.firstName} ${incident.investigation.investigator?.lastName}`,
            findings: incident.investigation.findings,
            rootCause: incident.investigation.rootCause,
            recommendations: incident.investigation.recommendations,
          }
        : null,
    };
  }

  /**
   * CAPA effectiveness report
   */
  async getCAPAEffectiveness(startDate: Date, endDate: Date) {
    const capas = await prisma.correctiveAction.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    const stats = {
      total: capas.length,
      byStatus: {} as Record<string, number>,
      onTime: 0,
      overdue: 0,
      averageCompletionDays: 0,
    };

    let totalDays = 0;
    let completedCount = 0;

    capas.forEach((capa) => {
      stats.byStatus[capa.status] = (stats.byStatus[capa.status] || 0) + 1;

      if (capa.status === 'CLOSED' && capa.completionDate) {
        completedCount++;
        const days = Math.floor(
          (capa.completionDate.getTime() - capa.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        totalDays += days;

        if (capa.completionDate <= capa.targetDate) {
          stats.onTime++;
        } else {
          stats.overdue++;
        }
      }
    });

    if (completedCount > 0) {
      stats.averageCompletionDays = Math.round(totalDays / completedCount);
    }

    return stats;
  }

  /**
   * Training compliance report
   */
  async getTrainingCompliance() {
    const [totalUsers, certifiedUsers, expiringCerts, expiredCerts] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.certification.groupBy({
        by: ['userId'],
        where: { expiryDate: { gte: new Date() } },
      }),
      prisma.certification.count({
        where: {
          expiryDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), gte: new Date() },
        },
      }),
      prisma.certification.count({
        where: { expiryDate: { lt: new Date() } },
      }),
    ]);

    const complianceRate = totalUsers > 0 ? Math.round((certifiedUsers.length / totalUsers) * 100) : 0;

    return {
      totalUsers,
      certifiedUsers: certifiedUsers.length,
      complianceRate,
      expiringCerts,
      expiredCerts,
    };
  }

  /**
   * Hazard risk distribution
   */
  async getHazardRiskDistribution() {
    const hazards = await prisma.hazard.findMany({
      where: { status: { not: 'CLOSED' } },
    });

    const distribution = {
      EXTREME: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };

    hazards.forEach((hazard) => {
      if (hazard.riskLevel) {
        distribution[hazard.riskLevel as keyof typeof distribution]++;
      }
    });

    return distribution;
  }
}
