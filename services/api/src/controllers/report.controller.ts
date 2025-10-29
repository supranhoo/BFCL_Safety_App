// Reports Controller
import { Response, NextFunction } from 'express';
import { PrismaClient, CAPAStatus, IncidentStatus, Severity, TrainingSessionStatus, HazardStatus } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

// Dashboard summary with lightweight KPIs used on the home screen
export const getDashboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      incidentsTotal,
      incidentsClosed,
      highSeverityOpen,
      capaOpen,
      capaOverdue,
      hazardsOpen,
      trainingsUpcoming,
      recentIncidents,
    ] = await Promise.all([
      prisma.incident.count(),
      prisma.incident.count({ where: { status: IncidentStatus.CLOSED } }),
      prisma.incident.count({
        where: {
          status: { not: IncidentStatus.CLOSED },
          severity: { in: [Severity.HIGH, Severity.CRITICAL] },
        },
      }),
      prisma.correctiveAction.count({
        where: { status: { in: [CAPAStatus.PENDING, CAPAStatus.IN_PROGRESS, CAPAStatus.OVERDUE] } },
      }),
      prisma.correctiveAction.count({ where: { status: CAPAStatus.OVERDUE } }),
      prisma.hazard.count({ where: { status: { not: HazardStatus.CLOSED } } }),
      prisma.trainingSession.count({
        where: {
          status: TrainingSessionStatus.SCHEDULED,
          scheduledDate: { gte: startOfMonth },
        },
      }),
      prisma.incident.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          incidentNumber: true,
          description: true,
          severity: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    const incidentsOpen = incidentsTotal - incidentsClosed;

    return res.json({
      incidents: {
        total: incidentsTotal,
        open: incidentsOpen,
        closed: incidentsClosed,
        highSeverityOpen,
        recent: recentIncidents,
      },
      capa: {
        open: capaOpen,
        overdue: capaOverdue,
      },
      hazards: {
        open: hazardsOpen,
      },
      training: {
        upcoming: trainingsUpcoming,
      },
      generatedAt: now.toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

export const getIncidentReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  res.status(501).json({ message: 'Not implemented yet' });
};

export const getOSHALog = async (req: AuthRequest, res: Response, next: NextFunction) => {
  res.status(501).json({ message: 'Not implemented yet' });
};

export const getCAPAAgeing = async (req: AuthRequest, res: Response, next: NextFunction) => {
  res.status(501).json({ message: 'Not implemented yet' });
};

export const getKPIReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  res.status(501).json({ message: 'Not implemented yet' });
};

export const getComplianceReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  res.status(501).json({ message: 'Not implemented yet' });
};
