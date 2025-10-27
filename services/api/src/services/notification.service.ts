import { PrismaClient, NotificationType } from '@prisma/client';

const prisma = new PrismaClient();

export class NotificationService {
  /**
   * Create notification
   */
  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    entityType?: string;
    entityId?: string;
  }) {
    return await prisma.notification.create({
      data: {
        ...data,
        isRead: false,
      },
    });
  }

  /**
   * Create bulk notifications
   */
  async createBulkNotifications(
    userIds: string[],
    data: {
      title: string;
      message: string;
      type: NotificationType;
      entityType?: string;
      entityId?: string;
    }
  ) {
    const notifications = userIds.map((userId) => ({
      userId,
      ...data,
      isRead: false,
    }));

    return await prisma.notification.createMany({ data: notifications });
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string, filters?: { isRead?: boolean; type?: NotificationType }) {
    const where: any = { userId };
    if (filters?.isRead !== undefined) where.isRead = filters.isRead;
    if (filters?.type) where.type = filters.type;

    return await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Mark as read
   */
  async markAsRead(id: string, userId: string) {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) return null;

    return await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  /**
   * Mark all as read
   */
  async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  /**
   * Delete notification
   */
  async deleteNotification(id: string, userId: string) {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) return null;

    return await prisma.notification.delete({ where: { id } });
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string) {
    return await prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Notify safety officers about high severity incidents
   */
  async notifySafetyOfficers(incidentId: string, severity: string) {
    const safetyOfficers = await prisma.user.findMany({
      where: {
        role: { name: { in: ['Safety Head', 'BU Head'] } },
        isActive: true,
      },
    });

    const incident = await prisma.incident.findUnique({ where: { id: incidentId } });
    if (!incident) return;

    const notifications = safetyOfficers.map((officer) => ({
      userId: officer.id,
      title: `${severity} Severity Incident Reported`,
      message: `Incident ${incident.incidentNumber} requires immediate attention`,
      type: NotificationType.SYSTEM_ALERT,
      entityType: 'incidents',
      entityId: incidentId,
    }));

    await prisma.notification.createMany({ data: notifications });
  }

  /**
   * Send overdue CAPA reminders
   */
  async sendOverdueCAPAReminders() {
    const overdueCAPAs = await prisma.correctiveAction.findMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        dueDate: { lt: new Date() },
      },
      include: { assignedTo: true },
    });

    const notifications = overdueCAPAs.map((capa) => ({
      userId: capa.assignedToId,
      title: 'Overdue CAPA',
      message: `CAPA ${capa.capaNumber} is overdue (Target: ${capa.dueDate.toLocaleDateString()})`,
      type: NotificationType.CAPA_OVERDUE,
      entityType: 'corrective_actions',
      entityId: capa.id,
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
    }

    return { remindersSent: notifications.length };
  }

  /**
   * Send training expiry alerts
   */
  async sendTrainingExpiryAlerts() {
    const expiringCerts = await prisma.certification.findMany({
      where: {
        expiryDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
      include: { user: true },
    });

    const notifications = expiringCerts.map((cert) => ({
      userId: cert.userId,
      title: 'Training Certification Expiring',
      message: `Your certification ${cert.certNumber} expires on ${cert.expiryDate!.toLocaleDateString()}`,
      type: NotificationType.CERTIFICATION_EXPIRING,
      entityType: 'certifications',
      entityId: cert.id,
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
    }

    return { alertsSent: notifications.length };
  }
}
