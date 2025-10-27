import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { NotificationService } from '../services/notification.service';
import { AppError } from '../middlewares/error.middleware';

const notificationService = new NotificationService();

export const getUserNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('User not authenticated', 401);
    const { page = 1, limit = 10, isRead, type } = req.query;
    const notifications = await notificationService.getAll({
      page: Number(page),
      limit: Number(limit),
      userId: req.user.id,
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
      type: type as string,
    });
    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const notification = await notificationService.markAsRead(id);
    res.json(notification);
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('User not authenticated', 401);
    const result = await notificationService.markAllAsRead(req.user.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await notificationService.delete(id);
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    next(error);
  }
};
