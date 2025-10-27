import { PrismaClient, MockDrillType, MockDrillStatus } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware';

const prisma = new PrismaClient();

export class MockDrillService {
  /**
   * Schedule mock drill
   */
  async scheduleDrill(data: any, scheduledById: string) {
    const drillNumber = await this.generateDrillNumber(data.type);

    const drill = await prisma.mockDrill.create({
      data: {
        drillNumber,
        ...data,
        status: MockDrillStatus.SCHEDULED,
      },
      include: {
        department: true,
        scheduledBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.notifyParticipants(drill.id, drill.scheduledDate);
    await this.logAudit(scheduledById, 'SCHEDULE', 'mock_drills', drill.id);

    return drill;
  }

  /**
   * Conduct drill and record observations
   */
  async conductDrill(
    id: string,
    data: {
      participants: string[];
      observations: string;
      gapsIdentified?: string;
      performanceRating: number;
      conductedById: string;
    }
  ) {
    const drill = await prisma.mockDrill.findUnique({ where: { id } });
    if (!drill) throw new AppError('Mock drill not found', 404);

    const updated = await prisma.mockDrill.update({
      where: { id },
      data: {
        actualDate: new Date(),
        participants: data.participants,
        observations: data.observations,
        gapsIdentified: data.gapsIdentified,
        performanceRating: data.performanceRating,
        conductedById: data.conductedById,
        status: MockDrillStatus.COMPLETED,
      },
      include: {
        department: true,
        conductedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Create CAPAs for gaps
    if (data.gapsIdentified && data.gapsIdentified.trim()) {
      await this.createGapCAPAs(id, data.gapsIdentified, data.conductedById);
    }

    await this.logAudit(data.conductedById, 'CONDUCT', 'mock_drills', id);
    return updated;
  }

  /**
   * Get drills by filters
   */
  async getDrills(filters: { type?: MockDrillType; status?: MockDrillStatus; departmentId?: string }) {
    const where: any = {};
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.departmentId) where.departmentId = filters.departmentId;

    return await prisma.mockDrill.findMany({
      where,
      include: {
        department: true,
        scheduledBy: { select: { id: true, firstName: true, lastName: true } },
        conductedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { scheduledDate: 'desc' },
    });
  }

  /**
   * Get upcoming drills
   */
  async getUpcomingDrills(daysAhead: number = 30) {
    const futureDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);

    return await prisma.mockDrill.findMany({
      where: {
        scheduledDate: { gte: new Date(), lte: futureDate },
        status: MockDrillStatus.SCHEDULED,
      },
      include: {
        department: true,
        scheduledBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { scheduledDate: 'asc' },
    });
  }

  /**
   * Get drill statistics
   */
  async getDrillStatistics(startDate?: Date, endDate?: Date) {
    const where: any = { status: MockDrillStatus.COMPLETED };
    if (startDate) where.actualDate = { gte: startDate };
    if (endDate) where.actualDate = { ...where.actualDate, lte: endDate };

    const drills = await prisma.mockDrill.findMany({ where });

    const stats = {
      totalDrills: drills.length,
      byType: {} as Record<string, number>,
      averagePerformance: 0,
      gapsIdentifiedCount: drills.filter((d) => d.gapsIdentified && d.gapsIdentified.trim()).length,
    };

    drills.forEach((drill) => {
      stats.byType[drill.type] = (stats.byType[drill.type] || 0) + 1;
    });

    if (drills.length > 0) {
      const totalRating = drills.reduce((sum, d) => sum + (d.performanceRating || 0), 0);
      stats.averagePerformance = Math.round((totalRating / drills.length) * 10) / 10;
    }

    return stats;
  }

  private async createGapCAPAs(drillId: string, gaps: string, userId: string) {
    const drill = await prisma.mockDrill.findUnique({ where: { id: drillId } });
    if (!drill) return;

    const safetyHead = await prisma.user.findFirst({
      where: { role: { name: 'Safety Head' }, isActive: true },
    });

    if (!safetyHead) return;

    const capaNumber = await this.generateCAPANumber();

    await prisma.correctiveAction.create({
      data: {
        capaNumber,
        description: `Mock Drill Gaps: ${drill.type}`,
        rootCause: gaps,
        correctiveAction: 'To be determined',
        sourceType: 'MOCK_DRILL',
        sourceId: drillId,
        assignedToId: safetyHead.id,
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'OPEN',
        priority: 'MEDIUM',
      },
    });

    await prisma.notification.create({
      data: {
        userId: safetyHead.id,
        title: `CAPA Created from Mock Drill: ${drill.drillNumber}`,
        message: `Gaps identified during ${drill.type} drill require corrective action`,
        type: 'TASK_ASSIGNED',
        entityType: 'mock_drills',
        entityId: drillId,
      },
    });
  }

  private async notifyParticipants(drillId: string, scheduledDate: Date) {
    const drill = await prisma.mockDrill.findUnique({
      where: { id: drillId },
      include: { department: true },
    });

    if (!drill) return;

    const users = await prisma.user.findMany({
      where: { departmentId: drill.departmentId, isActive: true },
    });

    const notifications = users.map((user) => ({
      userId: user.id,
      title: `Mock Drill Scheduled: ${drill.type}`,
      message: `${drill.type} drill scheduled for ${scheduledDate.toLocaleDateString()} - ${drill.objectives}`,
      type: 'SYSTEM_ALERT' as const,
      entityType: 'mock_drills' as const,
      entityId: drillId,
    }));

    await prisma.notification.createMany({ data: notifications });
  }

  private async generateDrillNumber(type: MockDrillType): Promise<string> {
    const year = new Date().getFullYear();
    const typeCode = type.substring(0, 3).toUpperCase();
    const prefix = `DRL-${typeCode}-${year}-`;
    const last = await prisma.mockDrill.findFirst({
      where: { drillNumber: { startsWith: prefix } },
      orderBy: { createdAt: 'desc' },
    });
    const nextNumber = last ? parseInt(last.drillNumber.split('-')[3]) + 1 : 1;
    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  private async generateCAPANumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CAPA-${year}-`;
    const last = await prisma.correctiveAction.findFirst({
      where: { capaNumber: { startsWith: prefix } },
      orderBy: { createdAt: 'desc' },
    });
    const nextNumber = last ? parseInt(last.capaNumber.split('-')[2]) + 1 : 1;
    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  private async logAudit(userId: string, action: string, resource: string, resourceId: string) {
    await prisma.auditLog.create({
      data: { userId, action, resource, resourceId, changes: null },
    });
  }
}
