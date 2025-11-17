import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

const updateUserSchema = z.object({
  role: z.enum(['USER', 'ADMIN']).optional(),
  canManageSharedMachines: z.boolean().optional(),
});

export const getUsers = async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      canManageSharedMachines: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json({ users });
};

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const validated = updateUserSchema.parse(req.body);

  // Prevent admin from changing their own role (safety check)
  if (id === req.userId && validated.role) {
    throw new AppError(400, 'Cannot change your own role');
  }

  const user = await prisma.user.update({
    where: { id },
    data: validated,
    select: {
      id: true,
      email: true,
      role: true,
      canManageSharedMachines: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  res.json({ user });
};

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  // Prevent admin from deleting themselves
  if (id === req.userId) {
    throw new AppError(400, 'Cannot delete your own account');
  }

  await prisma.user.delete({
    where: { id },
  });

  res.json({ message: 'User deleted successfully' });
};

