import { PrismaClient, NotificationType } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware';

const prisma = new PrismaClient();

interface CreateNotificationData {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  entityType?: string;
  entityId?: string;
}

interface GetAllFilters {
  page: number;
  limit: number;
  userId: string;
  isRead?: boolean;
  type?: string;
}

export class NotificationService {
  async create(data: CreateNotificationData) {
    const notification = await prisma.notification.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return notification;
  }

  async createBulk(notifications: CreateNotificationData[]) {
    const created = await prisma.notification.createMany({
      data: notifications,
    });

    return created;
  }

  async getAll(filters: GetAllFilters) {
    const { page, limit, userId, isRead, type } = filters;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (isRead !== undefined) where.isRead = isRead;
    if (type) where.type = type;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      data: notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string) {
    const notification = await prisma.notification.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    return notification;
  }

  async markAsRead(id: string) {
    const existing = await prisma.notification.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError('Notification not found', 404);
    }

    if (existing.isRead) {
      return existing;
    }

    const notification = await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return notification;
  }

  async markAllAsRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return result;
  }

  async delete(id: string) {
    const existing = await prisma.notification.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError('Notification not found', 404);
    }

    await prisma.notification.delete({ where: { id } });
  }

  async deleteAll(userId: string) {
    const result = await prisma.notification.deleteMany({
      where: { userId },
    });

    return result;
  }

  async getUnreadCount(userId: string) {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return { count };
  }

  // Helper methods for creating specific notification types
  async notifyIncidentAssigned(userId: string, incidentId: string, incidentNumber: string) {
    return this.create({
      userId,
      title: 'New Incident Assigned',
      message: `You have been assigned to incident ${incidentNumber}`,
      type: 'INCIDENT_ASSIGNED',
      entityType: 'incident',
      entityId: incidentId,
    });
  }

  async notifyInvestigationRequired(
    userId: string,
    incidentId: string,
    incidentNumber: string
  ) {
    return this.create({
      userId,
      title: 'Investigation Required',
      message: `Incident ${incidentNumber} requires investigation`,
      type: 'INVESTIGATION_REQUIRED',
      entityType: 'incident',
      entityId: incidentId,
    });
  }

  async notifyCAPAAssigned(userId: string, capaId: string, capaNumber: string) {
    return this.create({
      userId,
      title: 'New CAPA Assigned',
      message: `You have been assigned CAPA ${capaNumber}`,
      type: 'CAPA_ASSIGNED',
      entityType: 'capa',
      entityId: capaId,
    });
  }

  async notifyCAPAOverdue(userId: string, capaId: string, capaNumber: string) {
    return this.create({
      userId,
      title: 'CAPA Overdue',
      message: `CAPA ${capaNumber} is overdue`,
      type: 'CAPA_OVERDUE',
      entityType: 'capa',
      entityId: capaId,
    });
  }

  async notifyTrainingScheduled(
    userId: string,
    sessionId: string,
    sessionNumber: string,
    programTitle: string
  ) {
    return this.create({
      userId,
      title: 'Training Scheduled',
      message: `You have been scheduled for training: ${programTitle} (${sessionNumber})`,
      type: 'TRAINING_SCHEDULED',
      entityType: 'training_session',
      entityId: sessionId,
    });
  }

  async notifyCertificationExpiring(
    userId: string,
    certId: string,
    certTitle: string,
    daysLeft: number
  ) {
    return this.create({
      userId,
      title: 'Certification Expiring',
      message: `Your certification "${certTitle}" will expire in ${daysLeft} days`,
      type: 'CERTIFICATION_EXPIRING',
      entityType: 'certification',
      entityId: certId,
    });
  }

  async notifyAuditScheduled(userId: string, auditId: string, auditNumber: string) {
    return this.create({
      userId,
      title: 'Audit Scheduled',
      message: `Audit ${auditNumber} has been scheduled`,
      type: 'AUDIT_SCHEDULED',
      entityType: 'audit',
      entityId: auditId,
    });
  }

  async notifyDrillScheduled(userId: string, drillId: string, drillNumber: string) {
    return this.create({
      userId,
      title: 'Mock Drill Scheduled',
      message: `Mock drill ${drillNumber} has been scheduled`,
      type: 'DRILL_SCHEDULED',
      entityType: 'mock_drill',
      entityId: drillId,
    });
  }

  async notifyHazardReported(userId: string, hazardId: string, hazardNumber: string) {
    return this.create({
      userId,
      title: 'New Hazard Reported',
      message: `A new hazard has been reported: ${hazardNumber}`,
      type: 'HAZARD_REPORTED',
      entityType: 'hazard',
      entityId: hazardId,
    });
  }

  async notifyApprovalRequired(
    userId: string,
    entityType: string,
    entityId: string,
    entityNumber: string
  ) {
    return this.create({
      userId,
      title: 'Approval Required',
      message: `${entityType} ${entityNumber} requires your approval`,
      type: 'APPROVAL_REQUIRED',
      entityType,
      entityId,
    });
  }
}
