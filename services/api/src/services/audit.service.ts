import { PrismaClient, AuditType, AuditStatus, ChecklistItemStatus } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware';

const prisma = new PrismaClient();

export class AuditService {
  /**
   * Schedule audit
   */
  async scheduleAudit(data: any, scheduledById: string) {
    const auditNumber = await this.generateAuditNumber(data.auditType);

    const audit = await prisma.audit.create({
      data: {
        auditNumber,
        ...data,
        status: AuditStatus.SCHEDULED,
      },
      include: {
        department: true,
        scheduledBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.logAudit(scheduledById, 'SCHEDULE', 'audits', audit.id);
    return audit;
  }

  /**
   * Conduct audit with checklist
   */
  async conductAudit(
    id: string,
    data: {
      checklistItems: Array<{
        item: string;
        status: ChecklistItemStatus;
        remarks?: string;
      }>;
      findings: string;
      conductedById: string;
    }
  ) {
    const audit = await prisma.audit.findUnique({ where: { id } });
    if (!audit) throw new AppError('Audit not found', 404);

    // Calculate score
    const totalItems = data.checklistItems.length;
    const compliantItems = data.checklistItems.filter((i) => i.status === ChecklistItemStatus.COMPLIANT).length;
    const score = totalItems > 0 ? Math.round((compliantItems / totalItems) * 100) : 0;

    const updated = await prisma.audit.update({
      where: { id },
      data: {
        actualDate: new Date(),
        checklistItems: JSON.stringify(data.checklistItems),
        findings: data.findings,
        score,
        conductedById: data.conductedById,
        status: AuditStatus.COMPLETED,
      },
      include: {
        department: true,
        conductedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Create CAPAs for non-compliances
    const nonCompliant = data.checklistItems.filter((i) => i.status === ChecklistItemStatus.NON_COMPLIANT);
    if (nonCompliant.length > 0) {
      await this.createNCRCAPAs(id, nonCompliant, data.conductedById);
    }

    await this.logAudit(data.conductedById, 'CONDUCT', 'audits', id);
    return updated;
  }

  /**
   * Get audits by filters
   */
  async getAudits(filters: { auditType?: AuditType; status?: AuditStatus; departmentId?: string }) {
    const where: any = {};
    if (filters.auditType) where.auditType = filters.auditType;
    if (filters.status) where.status = filters.status;
    if (filters.departmentId) where.departmentId = filters.departmentId;

    return await prisma.audit.findMany({
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
   * Get audit statistics
   */
  async getAuditStatistics(startDate?: Date, endDate?: Date) {
    const where: any = { status: AuditStatus.COMPLETED };
    if (startDate) where.actualDate = { gte: startDate };
    if (endDate) where.actualDate = { ...where.actualDate, lte: endDate };

    const audits = await prisma.audit.findMany({ where });

    const stats = {
      totalAudits: audits.length,
      byType: {} as Record<string, number>,
      averageScore: 0,
      scores: {
        excellent: 0, // >= 90
        good: 0, // 75-89
        fair: 0, // 60-74
        poor: 0, // < 60
      },
    };

    audits.forEach((audit) => {
      stats.byType[audit.auditType] = (stats.byType[audit.auditType] || 0) + 1;

      if (audit.score !== null) {
        if (audit.score >= 90) stats.scores.excellent++;
        else if (audit.score >= 75) stats.scores.good++;
        else if (audit.score >= 60) stats.scores.fair++;
        else stats.scores.poor++;
      }
    });

    if (audits.length > 0) {
      const totalScore = audits.reduce((sum, a) => sum + (a.score || 0), 0);
      stats.averageScore = Math.round((totalScore / audits.length) * 10) / 10;
    }

    return stats;
  }

  private async createNCRCAPAs(
    auditId: string,
    nonCompliantItems: Array<{ item: string; status: ChecklistItemStatus; remarks?: string }>,
    userId: string
  ) {
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      include: { department: true },
    });
    if (!audit) return;

    const deptHead = await prisma.user.findFirst({
      where: {
        departmentId: audit.departmentId,
        role: { name: 'Department Head' },
        isActive: true,
      },
    });

    if (!deptHead) return;

    for (const item of nonCompliantItems) {
      const capaNumber = await this.generateCAPANumber();

      await prisma.correctiveAction.create({
        data: {
          capaNumber,
          description: `NCR from ${audit.auditType} Audit: ${item.item}`,
          rootCause: item.remarks || 'To be analyzed',
          correctiveAction: 'To be determined',
          sourceType: 'AUDIT',
          sourceId: auditId,
          assignedToId: deptHead.id,
          targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'OPEN',
          priority: 'HIGH',
        },
      });
    }

    await prisma.notification.create({
      data: {
        userId: deptHead.id,
        title: `NCRs Created from Audit: ${audit.auditNumber}`,
        message: `${nonCompliantItems.length} non-compliances found in ${audit.auditType} audit`,
        type: 'TASK_ASSIGNED',
        entityType: 'audits',
        entityId: auditId,
      },
    });
  }

  private async generateAuditNumber(type: AuditType): Promise<string> {
    const year = new Date().getFullYear();
    const typeCode = type.substring(0, 3).toUpperCase();
    const prefix = `AUD-${typeCode}-${year}-`;
    const last = await prisma.audit.findFirst({
      where: { auditNumber: { startsWith: prefix } },
      orderBy: { createdAt: 'desc' },
    });
    const nextNumber = last ? parseInt(last.auditNumber.split('-')[3]) + 1 : 1;
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
