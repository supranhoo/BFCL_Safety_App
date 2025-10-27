import { PrismaClient, PPECategory, PPEIssuanceStatus } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware';

const prisma = new PrismaClient();

interface CreatePPEItemData {
  name: string;
  category: PPECategory;
  description?: string;
  stockQuantity: number;
  reorderLevel?: number;
  unitPrice?: number;
  size?: string;
  manufacturer?: string;
  model?: string;
  hasExpiry?: boolean;
  shelfLife?: number;
}

interface IssuePPEData {
  ppeItemId: string;
  userId: string;
  quantity: number;
  expiryDate?: string;
  remarks?: string;
}

interface GetAllFilters {
  page: number;
  limit: number;
  category?: string;
  isActive?: boolean;
}

export class PPEService {
  async createItem(data: CreatePPEItemData) {
    const item = await prisma.pPEItem.create({
      data,
    });

    return item;
  }

  async getAllItems(filters: GetAllFilters) {
    const { page, limit, category, isActive } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive;

    const [items, total] = await Promise.all([
      prisma.pPEItem.findMany({
        where,
        skip,
        take: limit,
        include: {
          issuances: {
            where: {
              status: 'ACTIVE',
            },
            select: {
              id: true,
              quantity: true,
              userId: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      }),
      prisma.pPEItem.count({ where }),
    ]);

    return {
      data: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async issuePPE(data: IssuePPEData) {
    // Check if item exists and has sufficient stock
    const item = await prisma.pPEItem.findUnique({
      where: { id: data.ppeItemId },
    });

    if (!item) {
      throw new AppError('PPE item not found', 404);
    }

    if (!item.isActive) {
      throw new AppError('PPE item is inactive', 400);
    }

    if (item.stockQuantity < data.quantity) {
      throw new AppError('Insufficient stock quantity', 400);
    }

    // Generate issuance number
    const year = new Date().getFullYear();
    const count = await prisma.pPEIssuance.count({
      where: {
        issuanceNumber: {
          startsWith: `PPE-${year}`,
        },
      },
    });
    const issuanceNumber = `PPE-${year}-${String(count + 1).padStart(4, '0')}`;

    // Calculate expiry date if item has shelf life
    let expiryDate: Date | undefined = undefined;
    if (data.expiryDate) {
      expiryDate = new Date(data.expiryDate);
    } else if (item.hasExpiry && item.shelfLife) {
      expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + item.shelfLife);
    }

    // Create issuance and update stock
    const [issuance] = await prisma.$transaction([
      prisma.pPEIssuance.create({
        data: {
          issuanceNumber,
          ppeItemId: data.ppeItemId,
          userId: data.userId,
          quantity: data.quantity,
          expiryDate,
          remarks: data.remarks,
        },
        include: {
          ppeItem: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              employeeId: true,
            },
          },
        },
      }),
      prisma.pPEItem.update({
        where: { id: data.ppeItemId },
        data: {
          stockQuantity: {
            decrement: data.quantity,
          },
        },
      }),
    ]);

    // TODO: Create low stock alert if below reorder level

    return issuance;
  }

  async returnPPE(
    issuanceId: string,
    returnCondition: string,
    returnQuantity?: number
  ) {
    const issuance = await prisma.pPEIssuance.findUnique({
      where: { id: issuanceId },
      include: { ppeItem: true },
    });

    if (!issuance) {
      throw new AppError('PPE issuance not found', 404);
    }

    if (issuance.status !== 'ACTIVE') {
      throw new AppError('PPE issuance is not active', 400);
    }

    const actualReturnQuantity = returnQuantity || issuance.quantity;

    // Determine status based on condition
    let status: PPEIssuanceStatus = 'RETURNED';
    if (returnCondition.toLowerCase().includes('damaged')) {
      status = 'DAMAGED';
    } else if (returnCondition.toLowerCase().includes('lost')) {
      status = 'LOST';
    }

    // Update issuance and restore stock if applicable
    const updates: any[] = [
      prisma.pPEIssuance.update({
        where: { id: issuanceId },
        data: {
          status,
          returnDate: new Date(),
          returnCondition,
        },
        include: {
          ppeItem: true,
          user: true,
        },
      }),
    ];

    // Only restore stock if returned in good condition
    if (status === 'RETURNED') {
      updates.push(
        prisma.pPEItem.update({
          where: { id: issuance.ppeItemId },
          data: {
            stockQuantity: {
              increment: actualReturnQuantity,
            },
          },
        })
      );
    }

    const [updatedIssuance] = await prisma.$transaction(updates);

    return updatedIssuance;
  }

  async getLowStockItems(threshold?: number) {
    const items = await prisma.pPEItem.findMany({
      where: {
        isActive: true,
        stockQuantity: {
          lte: threshold
            ? threshold
            : prisma.pPEItem.fields.reorderLevel,
        },
      },
      orderBy: {
        stockQuantity: 'asc',
      },
    });

    return items;
  }

  async getCalibrationDue(days: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const calibrations = await prisma.analyzerCalibration.findMany({
      where: {
        nextCalibration: {
          lte: futureDate,
          gte: new Date(),
        },
        status: {
          not: 'EXPIRED',
        },
      },
      orderBy: {
        nextCalibration: 'asc',
      },
    });

    // TODO: Send calibration due notifications

    return calibrations;
  }
}
