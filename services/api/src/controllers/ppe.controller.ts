import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { PPEService } from '../services/ppe.service';
import { AppError } from '../middlewares/error.middleware';
import { z } from 'zod';

const ppeService = new PPEService();

const createItemSchema = z.object({
  name: z.string(),
  category: z.enum([
    'HEAD_PROTECTION',
    'EYE_PROTECTION',
    'HEARING_PROTECTION',
    'RESPIRATORY_PROTECTION',
    'HAND_PROTECTION',
    'FOOT_PROTECTION',
    'BODY_PROTECTION',
    'FALL_PROTECTION',
    'SAFETY_EQUIPMENT',
  ]),
  description: z.string().optional(),
  stockQuantity: z.number().min(0),
  reorderLevel: z.number().min(0),
  unitPrice: z.number().optional(),
  size: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  hasExpiry: z.boolean(),
  shelfLife: z.number().optional(),
});

const createIssuanceSchema = z.object({
  ppeItemId: z.string().uuid(),
  userId: z.string().uuid(),
  quantity: z.number().min(1),
  expiryDate: z.string().datetime().optional(),
  remarks: z.string().optional(),
});

export const createPPEItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = createItemSchema.parse(req.body);
    const item = await ppeService.createItem(validatedData);
    res.status(201).json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(error.errors[0].message, 400));
    }
    next(error);
  }
};

export const getAllPPEItems = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, category, isActive } = req.query;
    const items = await ppeService.getAllItems({
      page: Number(page),
      limit: Number(limit),
      category: category as string,
      isActive: isActive === 'true',
      userId: req.user?.id,
      userRole: req.user?.role,
    });
    res.json(items);
  } catch (error) {
    next(error);
  }
};

export const issuePPE = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = createIssuanceSchema.parse(req.body);
    const issuance = await ppeService.createIssuance(validatedData);
    res.status(201).json(issuance);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(error.errors[0].message, 400));
    }
    next(error);
  }
};

export const returnPPE = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { returnCondition } = req.body;
    if (!returnCondition) {
      throw new AppError('Return condition is required', 400);
    }
    const issuance = await ppeService.returnIssuance(id, returnCondition);
    res.json(issuance);
  } catch (error) {
    next(error);
  }
};

export const getLowStockItems = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const items = await ppeService.getAllItems({
      page: 1,
      limit: 100,
      isActive: true,
      userId: req.user?.id,
      userRole: req.user?.role,
    });
    
    const lowStock = items.data.filter(
      (item: any) => item.stockQuantity <= item.reorderLevel
    );
    
    res.json({ data: lowStock, count: lowStock.length });
  } catch (error) {
    next(error);
  }
};

export const getCalibrationDue = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.status(501).json({ message: 'Calibration tracking not yet implemented in service' });
  } catch (error) {
    next(error);
  }
};
