import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AuditService } from '../services/audit.service';
import { AppError } from '../middlewares/error.middleware';
import { z } from 'zod';

const auditService = new AuditService();

const createAuditSchema = z.object({
  title: z.string(),
  auditType: z.enum([
    'PPE_INSPECTION',
    'FIVE_S',
    'FIRE_SAFETY',
    'ELECTRICAL_SAFETY',
    'MACHINE_SAFETY',
    'HOUSEKEEPING',
    'INTERNAL_AUDIT',
    'EXTERNAL_AUDIT',
    'COMPLIANCE_CHECK',
  ]),
  scheduledDate: z.string().datetime(),
  location: z.string(),
  departmentId: z.string().uuid().optional(),
  scope: z.string(),
  checklistId: z.string().optional(),
});

export const createAudit = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('User not authenticated', 401);
    const validatedData = createAuditSchema.parse(req.body);
    const audit = await auditService.create(validatedData, req.user.id);
    res.status(201).json(audit);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(error.errors[0].message, 400));
    }
    next(error);
  }
};

export const getAllAudits = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, status, auditType, departmentId } = req.query;
    const audits = await auditService.getAll({
      page: Number(page),
      limit: Number(limit),
      status: status as string,
      auditType: auditType as string,
      departmentId: departmentId as string,
      userId: req.user?.id,
      userRole: req.user?.role,
    });
    res.json(audits);
  } catch (error) {
    next(error);
  }
};

export const getAuditById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const audit = await auditService.getById(id);
    if (!audit) {
      throw new AppError('Audit not found', 404);
    }
    res.json(audit);
  } catch (error) {
    next(error);
  }
};

export const updateAudit = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const audit = await auditService.update(id, req.body);
    res.json(audit);
  } catch (error) {
    next(error);
  }
};

export const completeAudit = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const audit = await auditService.complete(id);
    res.json(audit);
  } catch (error) {
    next(error);
  }
};

export const getAuditCheckpoints = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const audit = await auditService.getById(id);
    if (!audit) {
      throw new AppError('Audit not found', 404);
    }
    res.json({ checkpoints: audit.auditItems });
  } catch (error) {
    next(error);
  }
};
