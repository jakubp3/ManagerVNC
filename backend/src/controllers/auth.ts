import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler';
import { JWTPayload } from '../middleware/auth';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const register = async (req: Request, res: Response) => {
  const validated = registerSchema.parse(req.body);

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: validated.email },
  });

  if (existingUser) {
    throw new AppError(400, 'User with this email already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(validated.password, 10);

  // Create user (default role is USER)
  const user = await prisma.user.create({
    data: {
      email: validated.email,
      password: hashedPassword,
      role: 'USER',
      canManageSharedMachines: false,
    },
    select: {
      id: true,
      email: true,
      role: true,
      canManageSharedMachines: true,
      createdAt: true,
    },
  });

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    user,
    token,
  });
};

export const login = async (req: Request, res: Response) => {
  const validated = loginSchema.parse(req.body);

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: validated.email },
  });

  if (!user) {
    throw new AppError(401, 'Invalid email or password');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(validated.password, user.password);
  if (!isValidPassword) {
    throw new AppError(401, 'Invalid email or password');
  }

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      canManageSharedMachines: user.canManageSharedMachines,
      createdAt: user.createdAt,
    },
    token,
  });
};

export const getMe = async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: {
      id: true,
      email: true,
      role: true,
      canManageSharedMachines: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  res.json({ user });
};

