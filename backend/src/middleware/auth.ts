import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AppError } from './errorHandler';

const prisma = new PrismaClient();

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: 'USER' | 'ADMIN';
      canManageSharedMachines?: boolean;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'No token provided');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    req.userId = decoded.userId;
    req.userRole = decoded.role;
    
    // Fetch user's canManageSharedMachines permission from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { canManageSharedMachines: true, role: true },
    });
    
    // Admins always have this permission, otherwise use the user's permission
    req.canManageSharedMachines = user?.role === 'ADMIN' || user?.canManageSharedMachines || false;
    
    next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(401, 'Invalid token');
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.userRole !== 'ADMIN') {
    throw new AppError(403, 'Admin access required');
  }
  next();
};

