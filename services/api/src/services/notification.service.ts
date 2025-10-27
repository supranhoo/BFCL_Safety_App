import { PrismaClient, NotificationType } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware';

const prisma = new PrismaClient();

interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  actionUrl?: string;
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
    });

    // TODO: Send push notification or email based on user preferences

    return notification;
  }

  async createBulk(notifications: CreateNotificationData[]) {
    const created = await prisma.notification.createMany({
      data: notifications,
    });

    return created;
  }

  async getUserNotifications(filters: GetAllFilters) {
    const { page, limit, userId, isRead, type } = filters;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (isRead !== undefined) where.isRead = isRead;
    if (type) where.type = type;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      }),
    ]);

    return {
      data: notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    };
  }

  async markAsRead(id: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    if (notification.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return updated;
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

  async delete(id: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    if (notification.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    await prisma.notification.delete({
      where: { id },
    });
  }

  // Helper methods to create specific notification types

  async notifyIncidentSubmission(incidentId: string, reporterId: string) {
    // Notify safety officers about new incident
    const safetyOfficers = await this.getSafetyOfficers();

    const notifications = safetyOfficers.map((officer) => ({
      userId: officer.id,
      type: 'INCIDENT_ASSIGNED' as NotificationType,
      title: 'New Incident Reported',
      message: 'A new incident has been submitted for review',
      relatedEntityType: 'incident',
      relatedEntityId: incidentId,
      actionUrl: `/incidents/${incidentId}`,
    }));

    await this.createBulk(notifications);
  }

  async notifyInvestigationAssignment(
    investigationId: string,
    investigatorId: string
  ) {
    await this.create({
      userId: investigatorId,
      type: 'INVESTIGATION_REQUIRED' as NotificationType,
      title: 'Investigation Assigned',
      message: 'You have been assigned as investigator for an incident',
      relatedEntityType: 'investigation',
      relatedEntityId: investigationId,
      actionUrl: `/investigations/${investigationId}`,
    });
  }

  async notifyCAPAAssignment(capaId: string, assignedToId: string) {
    await this.create({
      userId: assignedToId,
      type: 'CAPA_ASSIGNED' as NotificationType,
      title: 'Corrective Action Assigned',
      message: 'A corrective action has been assigned to you',
      relatedEntityType: 'capa',
      relatedEntityId: capaId,
      actionUrl: `/capa/${capaId}`,
    });
  }

  async notifyTrainingScheduled(sessionId: string, userIds: string[]) {
    const notifications = userIds.map((userId) => ({
      userId,
      type: 'TRAINING_SCHEDULED' as NotificationType,
      title: 'Training Session Scheduled',
      message: 'A training session has been scheduled for you',
      relatedEntityType: 'training',
      relatedEntityId: sessionId,
      actionUrl: `/training/sessions/${sessionId}`,
    }));

    await this.createBulk(notifications);
  }

  async notifyCertificationExpiring(certificationId: string, userId: string) {
    await this.create({
      userId,
      type: 'CERTIFICATION_EXPIRING' as NotificationType,
      title: 'Certification Expiring Soon',
      message: 'Your certification is expiring in 30 days',
      relatedEntityType: 'certification',
      relatedEntityId: certificationId,
      actionUrl: `/certifications`,
    });
  }

  private async getSafetyOfficers() {
    // Get users with safety officer roles
    const officers = await prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          name: {
            in: ['Safety Head', 'Assistant Safety Manager', 'Senior Safety Officer'],
          },
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    return officers;
  }
}
