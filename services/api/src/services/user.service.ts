import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AppError } from '../middlewares/error.middleware';

const prisma = new PrismaClient();

export class UserService {
  /**
   * Get all users
   */
  async getUsers(filters?: { isActive?: boolean; roleId?: string; departmentId?: string }) {
    const where: any = {};
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.roleId) where.roleId = filters.roleId;
    if (filters?.departmentId) where.departmentId = filters.departmentId;

    return await prisma.user.findMany({
      where,
      include: {
        role: true,
        department: true,
      },
      orderBy: { lastName: 'asc' },
    });
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        department: true,
      },
    });

    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  /**
   * Create user
   */
  async createUser(data: {
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    employeeId?: string;
    roleId: string;
    departmentId?: string;
  }) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
      },
    });

    if (existingUser) {
      throw new AppError('Email or username already exists', 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        isActive: true,
      },
      include: {
        role: true,
        department: true,
      },
    });

    await this.logAudit(user.id, 'CREATE', 'users', user.id);
    return user;
  }

  /**
   * Update user
   */
  async updateUser(
    id: string,
    data: {
      email?: string;
      username?: string;
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
      employeeId?: string;
      roleId?: string;
      departmentId?: string;
    }
  ) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError('User not found', 404);

    if (data.email || data.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          id: { not: id },
          OR: [{ email: data.email }, { username: data.username }],
        },
      });

      if (existingUser) {
        throw new AppError('Email or username already exists', 400);
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      include: {
        role: true,
        department: true,
      },
    });

    await this.logAudit(id, 'UPDATE', 'users', id);
    return updated;
  }

  /**
   * Change password
   */
  async changePassword(id: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError('User not found', 404);

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) throw new AppError('Current password is incorrect', 400);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    await this.logAudit(id, 'CHANGE_PASSWORD', 'users', id);
    return { message: 'Password changed successfully' };
  }

  /**
   * Deactivate user
   */
  async deactivateUser(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError('User not found', 404);

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    await this.logAudit(id, 'DEACTIVATE', 'users', id);
    return { message: 'User deactivated successfully' };
  }

  /**
   * Reactivate user
   */
  async reactivateUser(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError('User not found', 404);

    await prisma.user.update({
      where: { id },
      data: { isActive: true },
    });

    await this.logAudit(id, 'REACTIVATE', 'users', id);
    return { message: 'User reactivated successfully' };
  }

  /**
   * Get roles
   */
  async getRoles() {
    return await prisma.role.findMany({
      orderBy: { level: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        level: true,
        createdAt: true,
      },
    });
  }

  /**
   * Get departments
   */
  async getDepartments() {
    return await prisma.department.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        headId: true,
        createdAt: true,
      },
    });
  }

  /**
   * Create department
   */
  async createDepartment(data: { name: string; code: string; headId?: string }) {
    const existing = await prisma.department.findFirst({
      where: {
        OR: [{ name: data.name }, { code: data.code }],
      },
    });

    if (existing) {
      throw new AppError('Department name or code already exists', 400);
    }

    return await prisma.department.create({
      data,
    });
  }

  /**
   * Update department
   */
  async updateDepartment(id: string, data: { name?: string; code?: string; headId?: string }) {
    const dept = await prisma.department.findUnique({ where: { id } });
    if (!dept) throw new AppError('Department not found', 404);

    if (data.name || data.code) {
      const existing = await prisma.department.findFirst({
        where: {
          id: { not: id },
          OR: [{ name: data.name }, { code: data.code }],
        },
      });

      if (existing) {
        throw new AppError('Department name or code already exists', 400);
      }
    }

    return await prisma.department.update({
      where: { id },
      data,
    });
  }

  private async logAudit(userId: string, action: string, resource: string, resourceId: string) {
    await prisma.auditLog.create({
      data: { userId, action, resource, resourceId, changes: null },
    });
  }
}
