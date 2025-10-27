import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AppError } from '../middlewares/error.middleware';

const prisma = new PrismaClient();

interface CreateUserData {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  employeeId?: string;
  roleId: string;
  departmentId?: string;
}

interface GetAllFilters {
  page: number;
  limit: number;
  roleId?: string;
  departmentId?: string;
  isActive?: boolean;
  search?: string;
}

export class UserService {
  async getAll(filters: GetAllFilters) {
    const { page, limit, roleId, departmentId, isActive, search } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (roleId) where.roleId = roleId;
    if (departmentId) where.departmentId = departmentId;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          employeeId: true,
          isActive: true,
          lastLogin: true,
          role: {
            select: {
              id: true,
              name: true,
              level: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        employeeId: true,
        isActive: true,
        lastLogin: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
            level: true,
            permissions: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  async create(data: CreateUserData) {
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
      },
    });

    if (existingUser) {
      throw new AppError('User with this email or username already exists', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        employeeId: true,
        isActive: true,
        role: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        createdAt: true,
      },
    });

    return user;
  }

  async update(id: string, data: Partial<CreateUserData>) {
    const existing = await prisma.user.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError('User not found', 404);
    }

    // If updating email or username, check uniqueness
    if (data.email || data.username) {
      const duplicateCheck = await prisma.user.findFirst({
        where: {
          id: { not: id },
          OR: [
            data.email ? { email: data.email } : {},
            data.username ? { username: data.username } : {},
          ],
        },
      });

      if (duplicateCheck) {
        throw new AppError('Email or username already in use', 409);
      }
    }

    // Hash password if provided
    let updateData: any = { ...data };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        employeeId: true,
        isActive: true,
        role: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return user;
  }

  async deactivate(id: string) {
    const existing = await prisma.user.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError('User not found', 404);
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    return user;
  }

  async assignRole(userId: string, roleId: string) {
    const [user, role] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.role.findUnique({ where: { id: roleId } }),
    ]);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!role) {
      throw new AppError('Role not found', 404);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { roleId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
            level: true,
          },
        },
      },
    });

    return updatedUser;
  }
}
