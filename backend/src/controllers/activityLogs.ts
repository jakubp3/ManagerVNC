import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export const getActivityLogs = async (req: Request, res: Response) => {
  const { limit = 50, machineId } = req.query;

  const where: any = { userId: req.userId! };
  if (machineId) {
    where.machineId = machineId as string;
  }

  const logs = await prisma.activityLog.findMany({
    where,
    include: {
      machine: {
        select: {
          id: true,
          name: true,
          host: true,
          port: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: Number(limit),
  });

  res.json({ logs });
};

export const logActivity = async (req: Request, res: Response) => {
  const { machineId, action } = req.body;

  // Verify machine access
  const machine = await prisma.vncMachine.findUnique({
    where: { id: machineId },
  });

  if (!machine) {
    throw new AppError(404, 'VNC machine not found');
  }

  if (machine.ownerId !== null && machine.ownerId !== req.userId) {
    throw new AppError(403, 'Access denied');
  }

  // Update lastAccessed
  await prisma.vncMachine.update({
    where: { id: machineId },
    data: { lastAccessed: new Date() },
  });

  // Create activity log
  const log = await prisma.activityLog.create({
    data: {
      userId: req.userId!,
      machineId: machineId,
      action: action || 'connect',
    },
    include: {
      machine: {
        select: {
          id: true,
          name: true,
          host: true,
          port: true,
        },
      },
    },
  });

  res.json({ log });
};

