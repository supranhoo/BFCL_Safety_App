import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { InvestigationService } from '../services/investigation.service';
import { AppError } from '../middlewares/error.middleware';
import { z } from 'zod';

const investigationService = new InvestigationService();

const createInvestigationSchema = z.object({
  incidentId: z.string().uuid(),
  investigatorId: z.string().uuid(),
  investigationDate: z.string().datetime(),
  coInvestigators: z.array(z.string().uuid()).optional(),
  findings: z.string(),
  rootCause: z.string(),
  fiveWhys: z.any().optional(),
  contributingFactors: z.string().optional(),
  recommendations: z.string().optional(),
});

export const createInvestigation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = createInvestigationSchema.parse(req.body);
    const investigation = await investigationService.create(validatedData);
    res.status(201).json(investigation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(error.errors[0].message, 400));
    }
    next(error);
  }
};

export const getAllInvestigations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const investigations = await investigationService.getAll({
      page: Number(page),
      limit: Number(limit),
      status: status as string,
      userId: req.user?.id,
      userRole: req.user?.role,
    });
    res.json(investigations);
  } catch (error) {
    next(error);
  }
};

export const getInvestigationById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const investigation = await investigationService.getById(id);
    if (!investigation) {
      throw new AppError('Investigation not found', 404);
    }
    res.json(investigation);
  } catch (error) {
    next(error);
  }
};

export const updateInvestigation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const investigation = await investigationService.update(id, req.body);
    res.json(investigation);
  } catch (error) {
    next(error);
  }
};

export const submitInvestigation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const investigation = await investigationService.submit(id);
    res.json(investigation);
  } catch (error) {
    next(error);
  }
};

export const approveInvestigation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('User not authenticated', 401);
    const { id } = req.params;
    const investigation = await investigationService.approve(id, req.user.id);
    res.json(investigation);
  } catch (error) {
    next(error);
  }
};
