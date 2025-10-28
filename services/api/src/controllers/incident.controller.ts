import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { IncidentService, CreateIncidentData } from '../services/incident.service';
import { AppError } from '../middlewares/error.middleware';
import { z } from 'zod';

const incidentService = new IncidentService();

const createIncidentSchema = z.object({
  incidentDate: z.string().datetime(),
  incidentTime: z.string(),
  location: z.string(),
  geoLocation: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  incidentType: z.enum(['INJURY', 'ILLNESS', 'NEAR_MISS', 'PROPERTY_DAMAGE', 'ENVIRONMENTAL']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  injuryType: z.string().optional(),
  bodyPartAffected: z.string().optional(),
  witnessName: z.string().optional(),
  witnessContact: z.string().optional(),
  propertyDamage: z.boolean().default(false),
  damageDescription: z.string().optional(),
  description: z.string(),
  immediateAction: z.string().optional(),
});

export const createIncident = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('User not authenticated', 401);
    
    const validatedData = createIncidentSchema.parse(req.body) as CreateIncidentData;
    const incident = await incidentService.create(validatedData, req.user.id);
    
    res.status(201).json(incident);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(error.errors[0].message, 400));
    }
    next(error);
  }
};

export const getAllIncidents = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, status, severity, departmentId } = req.query;
    
    const incidents = await incidentService.getAll({
      page: Number(page),
      limit: Number(limit),
      status: status as string,
      severity: severity as string,
      departmentId: departmentId as string,
      userId: req.user?.id,
      userRole: req.user?.role,
    });
    
    res.json(incidents);
  } catch (error) {
    next(error);
  }
};

export const getIncidentById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const incident = await incidentService.getById(id);
    
    if (!incident) {
      throw new AppError('Incident not found', 404);
    }
    
    res.json(incident);
  } catch (error) {
    next(error);
  }
};

export const updateIncident = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const incident = await incidentService.update(id, req.body);
    
    res.json(incident);
  } catch (error) {
    next(error);
  }
};

export const deleteIncident = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await incidentService.delete(id);
    
    res.json({ message: 'Incident deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const submitIncident = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const incident = await incidentService.submit(id);
    
    res.json(incident);
  } catch (error) {
    next(error);
  }
};
