import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { MockDrillService } from '../services/mockDrill.service';
import { AppError } from '../middlewares/error.middleware';
import { z } from 'zod';

const mockDrillService = new MockDrillService();

const createDrillSchema = z.object({
  drillType: z.enum([
    'FIRE_DRILL',
    'EARTHQUAKE_DRILL',
    'CHEMICAL_SPILL',
    'MEDICAL_EMERGENCY',
    'EVACUATION',
    'LOCKDOWN',
  ]),
  scheduledDate: z.string().datetime(),
  startTime: z.string(),
  endTime: z.string().optional(),
  location: z.string(),
  scenario: z.string(),
  observers: z.array(z.string().uuid()),
});

export const createMockDrill = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = createDrillSchema.parse(req.body);
    const drill = await mockDrillService.create(validatedData);
    res.status(201).json(drill);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(error.errors[0].message, 400));
    }
    next(error);
  }
};

export const getAllMockDrills = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, status, drillType } = req.query;
    const drills = await mockDrillService.getAll({
      page: Number(page),
      limit: Number(limit),
      status: status as string,
      drillType: drillType as string,
      userId: req.user?.id,
      userRole: req.user?.role,
    });
    res.json(drills);
  } catch (error) {
    next(error);
  }
};

export const getMockDrillById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const drill = await mockDrillService.getById(id);
    if (!drill) {
      throw new AppError('Mock drill not found', 404);
    }
    res.json(drill);
  } catch (error) {
    next(error);
  }
};

export const updateMockDrill = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const drill = await mockDrillService.update(id, req.body);
    res.json(drill);
  } catch (error) {
    next(error);
  }
};

export const completeMockDrill = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { duration, overallRating, gaps, observations, recommendations } = req.body;
    
    if (!duration || !overallRating) {
      throw new AppError('Duration and overall rating are required', 400);
    }
    
    const drill = await mockDrillService.complete(id, {
      duration,
      overallRating,
      gaps,
      observations,
      recommendations,
    });
    res.json(drill);
  } catch (error) {
    next(error);
  }
};

export const recordParticipation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.status(501).json({ message: 'Participation recording not yet implemented in service' });
  } catch (error) {
    next(error);
  }
};
