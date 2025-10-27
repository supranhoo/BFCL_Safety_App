import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { TrainingService } from '../services/training.service';
import { AppError } from '../middlewares/error.middleware';
import { z } from 'zod';

const trainingService = new TrainingService();

const createProgramSchema = z.object({
  title: z.string(),
  description: z.string(),
  trainingType: z.enum([
    'INDUCTION',
    'REFRESHER',
    'SKILL_BASED',
    'COMPLIANCE',
    'EMERGENCY_RESPONSE',
    'EQUIPMENT_OPERATION',
  ]),
  duration: z.number().min(1),
  validityPeriod: z.number().optional(),
  syllabus: z.string().optional(),
  videoUrl: z.string().optional(),
  documentUrl: z.string().optional(),
  isMandatory: z.boolean(),
  targetRoles: z.array(z.string()).optional(),
  hasQuiz: z.boolean(),
  passingScore: z.number().min(0).max(100).optional(),
});

const createSessionSchema = z.object({
  programId: z.string().uuid(),
  scheduledDate: z.string().datetime(),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string(),
  trainerName: z.string(),
  trainerId: z.string().optional(),
  maxParticipants: z.number().optional(),
});

export const createTrainingProgram = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = createProgramSchema.parse(req.body);
    const program = await trainingService.createProgram(validatedData);
    res.status(201).json(program);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(error.errors[0].message, 400));
    }
    next(error);
  }
};

export const getAllTrainingPrograms = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, trainingType } = req.query;
    const programs = await trainingService.getAllPrograms({
      page: Number(page),
      limit: Number(limit),
      trainingType: trainingType as string,
      userId: req.user?.id,
      userRole: req.user?.role,
    });
    res.json(programs);
  } catch (error) {
    next(error);
  }
};

export const createTrainingSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = createSessionSchema.parse(req.body);
    const session = await trainingService.createSession(validatedData);
    res.status(201).json(session);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(error.errors[0].message, 400));
    }
    next(error);
  }
};

export const getAllTrainingSessions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const sessions = await trainingService.getAllSessions({
      page: Number(page),
      limit: Number(limit),
      status: status as string,
      userId: req.user?.id,
      userRole: req.user?.role,
    });
    res.json(sessions);
  } catch (error) {
    next(error);
  }
};

export const recordAttendance = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.status(501).json({ message: 'Attendance recording not yet implemented in service' });
  } catch (error) {
    next(error);
  }
};

export const getCertifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.status(501).json({ message: 'Certification retrieval not yet implemented in service' });
  } catch (error) {
    next(error);
  }
};

export const getExpiringCertifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.status(501).json({ message: 'Expiring certifications not yet implemented in service' });
  } catch (error) {
    next(error);
  }
};
