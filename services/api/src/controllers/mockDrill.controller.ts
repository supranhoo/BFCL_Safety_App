// Mock Drill Controller Stub
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';

export const createMockDrill = async (req: AuthRequest, res: Response, next: NextFunction) => {
  res.status(501).json({ message: 'Not implemented yet' });
};

export const getAllMockDrills = async (req: AuthRequest, res: Response, next: NextFunction) => {
  res.status(501).json({ message: 'Not implemented yet' });
};

export const getMockDrillById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  res.status(501).json({ message: 'Not implemented yet' });
};

export const updateMockDrill = async (req: AuthRequest, res: Response, next: NextFunction) => {
  res.status(501).json({ message: 'Not implemented yet' });
};

export const completeMockDrill = async (req: AuthRequest, res: Response, next: NextFunction) => {
  res.status(501).json({ message: 'Not implemented yet' });
};

export const recordParticipation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  res.status(501).json({ message: 'Not implemented yet' });
};
