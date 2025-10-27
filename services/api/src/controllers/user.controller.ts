import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { UserService } from '../services/user.service';
import { AppError } from '../middlewares/error.middleware';

const userService = new UserService();

export const getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, roleId, departmentId, isActive } = req.query;
    const users = await userService.getAll({
      page: Number(page),
      limit: Number(limit),
      roleId: roleId as string,
      departmentId: departmentId as string,
      isActive: isActive === 'true',
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = await userService.getById(id);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.status(501).json({ message: 'User creation should be done through auth service' });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = await userService.update(id, req.body);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const deactivateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = await userService.deactivate(id);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const assignRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { roleId } = req.body;
    if (!roleId) {
      throw new AppError('Role ID is required', 400);
    }
    const user = await userService.update(id, { roleId });
    res.json(user);
  } catch (error) {
    next(error);
  }
};
