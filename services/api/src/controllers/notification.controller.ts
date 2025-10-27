// Notification Controller Stub
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getUserNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  res.status(501).json({ message: 'Not implemented yet' });
};

export const markAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  res.status(501).json({ message: 'Not implemented yet' });
};

export const markAllAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  res.status(501).json({ message: 'Not implemented yet' });
};

export const deleteNotification = async (req: AuthRequest, res: Response, next: NextFunction) => {
  res.status(501).json({ message: 'Not implemented yet' });
};
