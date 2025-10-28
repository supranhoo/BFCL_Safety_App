
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { InvestigationService } from '../services/investigation.service';
import { AppError } from '../middlewares/error.middleware';
import { z } from 'zod';

const investigationService = new InvestigationService();

// Validation schemas
const createInvestigationSchema = z.object({
  incidentId: z.string().uuid(),
  investigatorId: z.string().uuid(),
  investigationDate: z.string().or(z.date()),
  findings: z.string().min(10),
  rootCause: z.string().min(10),
  fiveWhys: z.object({
    why1: z.string().optional(),
    why2: z.string().optional(),
    why3: z.string().optional(),
    why4: z.string().optional(),
    why5: z.string().optional(),
  }).optional(),
  contributingFactors: z.string().optional(),
  recommendations: z.string().optional(),
  coInvestigators: z.array(z.string().uuid()).optional(),
});

const updateInvestigationSchema = createInvestigationSchema.partial();

export const createInvestigation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = createInvestigationSchema.parse(req.body);
    
    const investigation = await investigationService.createInvestigation(
      {
        ...validatedData,
        investigationDate: new Date(validatedData.investigationDate),
      },
      req.user!.id
    );
    
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
    const { page, limit, status, investigatorId, incidentId, dateFrom, dateTo } = req.query;
    
    const result = await investigationService.getInvestigations({
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      status: status as any,
      investigatorId: investigatorId as string,
      incidentId: incidentId as string,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
    });
    
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getInvestigationById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const investigation = await investigationService.getInvestigationById(id);
    res.json(investigation);
  } catch (error) {
    next(error);
  }
};

export const updateInvestigation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = updateInvestigationSchema.parse(req.body);
    
    const investigation = await investigationService.updateInvestigation(
      id,
      req.user!.id,
      {
        ...validatedData,
        investigationDate: validatedData.investigationDate 
          ? new Date(validatedData.investigationDate)
          : undefined,
      }
    );
    
    res.json(investigation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(error.errors[0].message, 400));
    }
    next(error);
  }
};

export const submitInvestigation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const investigation = await investigationService.submitInvestigation(id, req.user!.id);
    res.json(investigation);
  } catch (error) {
    next(error);
  }
};

export const approveInvestigation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const investigation = await investigationService.approveInvestigation(
      id,
      req.user!.id,
      req.user!.role
    );
    res.json(investigation);
  } catch (error) {
    next(error);
  }
};

export const closeInvestigation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const investigation = await investigationService.closeInvestigation(id, req.user!.id);
    res.json(investigation);
  } catch (error) {
    next(error);
  }
};

export const deleteInvestigation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await investigationService.deleteInvestigation(id, req.user!.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getInvestigationStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { dateFrom, dateTo, departmentId } = req.query;
    
    const stats = await investigationService.getInvestigationStats({
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
      departmentId: departmentId as string,
    });
    
    res.json(stats);
  } catch (error) {
    next(error);
  }
};
