import { PrismaClient, PPECategory } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware';

const prisma = new PrismaClient();

interface CreatePPEItemData {
  name: string;
  category: PPECategory;
  description?: string;
  stockQuantity: number;
  reorderLevel: number;
  unitPrice?: number;
  size?: string;
  manufacturer?: string;
  model?: string;
  hasExpiry: boolean;
  shelfLife?: number;
}

interface CreatePPEIssuanceData {
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
  userId?: string;
  userRole?: string;
}

export class PPEService {
  // PPE Items
  async createItem(data: CreatePPEItemData) {
    const item = await prisma.pPEItem.create({
      data,
    });

    return item;
  }

  async getAllItems(filters: GetAllFilters) {
    const { page, limit, category, isActive = true } = filters;
    const skip = (page - 1) * limit;

    const where: any = { isActive };

    if (category) where.category = category;

    const [items, total] = await Promise.all([
      prisma.pPEItem.findMany({
        where,
        skip,
        take: limit,
        include: {
          issuances: {
            select: {
              id: true,
              quantity: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
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

  async getItemById(id: string) {
    const item = await prisma.pPEItem.findUnique({
      where: { id },
      include: {
        issuances: {
          include: {
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
        },
      },
    });

    return item;
  }

  async updateItem(id: string, data: Partial<CreatePPEItemData>) {
    const existing = await prisma.pPEItem.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError('PPE item not found', 404);
    }

    const item = await prisma.pPEItem.update({
      where: { id },
      data,
    });

    return item;
  }

  async deleteItem(id: string) {
    const existing = await prisma.pPEItem.findUnique({
      where: { id },
      include: {
        issuances: true,
      },
    });

    if (!existing) {
      throw new AppError('PPE item not found', 404);
    }

    const activeIssuances = existing.issuances.filter(
      (issuance) => issuance.status === 'ACTIVE'
    );

    if (activeIssuances.length > 0) {
      throw new AppError('Cannot delete item with active issuances', 400);
    }

    await prisma.pPEItem.delete({ where: { id } });
  }

  // PPE Issuances
  async createIssuance(data: CreatePPEIssuanceData) {
    // Check if item exists and has sufficient stock
    const item = await prisma.pPEItem.findUnique({
      where: { id: data.ppeItemId },
    });

    if (!item) {
      throw new AppError('PPE item not found', 404);
    }

    if (item.stockQuantity < data.quantity) {
      throw new AppError('Insufficient stock available', 400);
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

    // Create issuance and update stock in a transaction
    const issuance = await prisma.$transaction(async (tx) => {
      const newIssuance = await tx.pPEIssuance.create({
        data: {
          ...data,
          issuanceNumber,
          expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
        },
        include: {
          ppeItem: true,
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

      await tx.pPEItem.update({
        where: { id: data.ppeItemId },
        data: {
          stockQuantity: {
            decrement: data.quantity,
          },
        },
      });

      return newIssuance;
    });

    return issuance;
  }

  async getAllIssuances(filters: GetAllFilters) {
    const { page, limit, userId } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId) where.userId = userId;

    const [issuances, total] = await Promise.all([
      prisma.pPEIssuance.findMany({
        where,
        skip,
        take: limit,
        include: {
          ppeItem: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
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
        orderBy: {
          issuedDate: 'desc',
        },
      }),
      prisma.pPEIssuance.count({ where }),
    ]);

    return {
      data: issuances,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getIssuanceById(id: string) {
    const issuance = await prisma.pPEIssuance.findUnique({
      where: { id },
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
    });

    return issuance;
  }

  async returnIssuance(id: string, returnCondition: string) {
    const existing = await prisma.pPEIssuance.findUnique({
      where: { id },
      include: { ppeItem: true },
    });

    if (!existing) {
      throw new AppError('PPE issuance not found', 404);
    }

    if (existing.status !== 'ACTIVE') {
      throw new AppError('PPE issuance is not active', 400);
    }

    // Update issuance and stock in a transaction
    const issuance = await prisma.$transaction(async (tx) => {
      const updatedIssuance = await tx.pPEIssuance.update({
        where: { id },
        data: {
          status: 'RETURNED',
          returnDate: new Date(),
          returnCondition,
        },
        include: {
          ppeItem: true,
          user: true,
        },
      });

      // Add quantity back to stock only if returned in good condition
      if (returnCondition.toLowerCase().includes('good')) {
        await tx.pPEItem.update({
          where: { id: existing.ppeItemId },
          data: {
            stockQuantity: {
              increment: existing.quantity,
            },
          },
        });
      }

      return updatedIssuance;
    });

    return issuance;
  }
}
