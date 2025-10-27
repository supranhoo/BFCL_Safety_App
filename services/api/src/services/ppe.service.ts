import { PrismaClient, PPECategory, PPEIssuanceStatus, CalibrationStatus } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware';

const prisma = new PrismaClient();

export class PPEService {
  /**
   * Create PPE item
   */
  async createItem(data: any, createdById: string) {
    const item = await prisma.pPEItem.create({
      data: {
        ...data,
        isActive: true,
      },
    });

    await this.logAudit(createdById, 'CREATE', 'ppe_items', item.id);
    return item;
  }

  /**
   * Get all PPE items
   */
  async getItems(filters: { category?: PPECategory; isActive?: boolean; lowStock?: boolean }) {
    const where: any = {};
    if (filters.category) where.category = filters.category;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    const items = await prisma.pPEItem.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    if (filters.lowStock) {
      return items.filter((item) => item.stockQuantity <= item.reorderLevel);
    }

    return items;
  }

  /**
   * Issue PPE
   */
  async issuePPE(data: any, issuedById: string) {
    const item = await prisma.pPEItem.findUnique({ where: { id: data.ppeItemId } });
    if (!item) throw new AppError('PPE item not found', 404);

    if (item.stockQuantity < data.quantity) {
      throw new AppError('Insufficient stock', 400);
    }

    const issuanceNumber = await this.generateIssuanceNumber();

    const issuance = await prisma.pPEIssuance.create({
      data: {
        issuanceNumber,
        ...data,
        status: PPEIssuanceStatus.ACTIVE,
      },
      include: {
        ppeItem: true,
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Update stock
    await prisma.pPEItem.update({
      where: { id: data.ppeItemId },
      data: { stockQuantity: { decrement: data.quantity } },
    });

    await this.logAudit(issuedById, 'ISSUE', 'ppe_issuances', issuance.id);
    await this.checkStockLevels(data.ppeItemId);

    return issuance;
  }

  /**
   * Return PPE
   */
  async returnPPE(id: string, returnCondition: string, remarks: string, userId: string) {
    const issuance = await prisma.pPEIssuance.findUnique({ where: { id } });
    if (!issuance) throw new AppError('Issuance not found', 404);

    const updated = await prisma.pPEIssuance.update({
      where: { id },
      data: {
        status: returnCondition === 'Damaged' ? PPEIssuanceStatus.DAMAGED : PPEIssuanceStatus.RETURNED,
        returnDate: new Date(),
        returnCondition,
        remarks,
      },
    });

    // Return to stock if in good condition
    if (returnCondition === 'Good') {
      await prisma.pPEItem.update({
        where: { id: issuance.ppeItemId },
        data: { stockQuantity: { increment: issuance.quantity } },
      });
    }

    await this.logAudit(userId, 'RETURN', 'ppe_issuances', id);
    return updated;
  }

  /**
   * Get analyzer calibrations
   */
  async getCalibrations(status?: CalibrationStatus) {
    const where = status ? { status } : {};
    return await prisma.analyzerCalibration.findMany({
      where,
      orderBy: { nextCalibration: 'asc' },
    });
  }

  /**
   * Record calibration
   */
  async recordCalibration(data: any, userId: string) {
    const calibration = await prisma.analyzerCalibration.create({
      data: {
        ...data,
        status: CalibrationStatus.VALID,
      },
    });

    await this.logAudit(userId, 'CALIBRATE', 'analyzer_calibrations', calibration.id);
    return calibration;
  }

  /**
   * Check due calibrations
   */
  async getDueCalibrations(daysAhead: number = 30) {
    const futureDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);

    const due = await prisma.analyzerCalibration.findMany({
      where: {
        nextCalibration: { lte: futureDate },
        status: { in: [CalibrationStatus.VALID, CalibrationStatus.DUE_SOON] },
      },
    });

    // Update status
    for (const cal of due) {
      const daysUntil = Math.floor((cal.nextCalibration.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      let newStatus = CalibrationStatus.VALID;

      if (daysUntil < 0) newStatus = CalibrationStatus.OVERDUE;
      else if (daysUntil <= 7) newStatus = CalibrationStatus.DUE_SOON;

      if (newStatus !== cal.status) {
        await prisma.analyzerCalibration.update({
          where: { id: cal.id },
          data: { status: newStatus },
        });
      }
    }

    return due;
  }

  private async checkStockLevels(itemId: string) {
    const item = await prisma.pPEItem.findUnique({ where: { id: itemId } });
    if (!item) return;

    if (item.stockQuantity <= item.reorderLevel) {
      // Notify procurement/safety head
      const safetyHead = await prisma.user.findFirst({
        where: { role: { name: 'Safety Head' }, isActive: true },
      });

      if (safetyHead) {
        await prisma.notification.create({
          data: {
            userId: safetyHead.id,
            title: `Low Stock Alert: ${item.name}`,
            message: `Stock level (${item.stockQuantity}) has reached reorder point (${item.reorderLevel})`,
            type: 'SYSTEM_ALERT',
            entityType: 'ppe_items',
            entityId: itemId,
          },
        });
      }
    }
  }

  private async generateIssuanceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PPE-${year}-`;
    const last = await prisma.pPEIssuance.findFirst({
      where: { issuanceNumber: { startsWith: prefix } },
      orderBy: { createdAt: 'desc' },
    });
    const nextNumber = last ? parseInt(last.issuanceNumber.split('-')[2]) + 1 : 1;
    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  private async logAudit(userId: string, action: string, resource: string, resourceId: string) {
    await prisma.auditLog.create({
      data: { userId, action, resource, resourceId, changes: null },
    });
  }
}
