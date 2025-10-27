import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { HazardService } from '../services/hazard.service';
import { AppError } from '../middlewares/error.middleware';
import { z } from 'zod';

const hazardService = new HazardService();

const createHazardSchema = z.object({
  location: z.string(),
  geoLocation: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  category: z.enum([
    'MECHANICAL',
    'ELECTRICAL',
    'CHEMICAL',
    'BIOLOGICAL',
    'ERGONOMIC',
    'PHYSICAL',
    'ENVIRONMENTAL',
    'BEHAVIORAL',
  ]),
  description: z.string(),
  potentialImpact: z.string(),
  likelihood: z.number().min(1).max(5),
  consequence: z.number().min(1).max(5),
  existingControls: z.string().optional(),
  suggestedControls: z.string().optional(),
});

export const createHazard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('User not authenticated', 401);
    const validatedData = createHazardSchema.parse(req.body);
    const hazard = await hazardService.create(validatedData, req.user.id);
    res.status(201).json(hazard);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(error.errors[0].message, 400));
    }
    next(error);
  }
};

export const getAllHazards = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, status, category, departmentId, riskLevel } = req.query;
    const hazards = await hazardService.getAll({
      page: Number(page),
      limit: Number(limit),
      status: status as string,
      category: category as string,
      departmentId: departmentId as string,
      riskLevel: riskLevel as string,
      userId: req.user?.id,
      userRole: req.user?.role,
    });
    res.json(hazards);
  } catch (error) {
    next(error);
  }
};

export const getHazardById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const hazard = await hazardService.getById(id);
    if (!hazard) {
      throw new AppError('Hazard not found', 404);
    }
    res.json(hazard);
  } catch (error) {
    next(error);
  }
};

export const updateHazard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const hazard = await hazardService.update(id, req.body);
    res.json(hazard);
  } catch (error) {
    next(error);
  }
};

export const closeHazard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { closureRemarks } = req.body;
    if (!closureRemarks) {
      throw new AppError('Closure remarks are required', 400);
    }
    const hazard = await hazardService.close(id, closureRemarks);
    res.json(hazard);
  } catch (error) {
    next(error);
  }
};

export const getHazardRegister = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const hazards = await hazardService.getAll({
      page: Number(page),
      limit: Number(limit),
      userId: req.user?.id,
      userRole: req.user?.role,
    });
    res.json(hazards);
  } catch (error) {
    next(error);
  }
};
