import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export const toggleFavorite = async (req: Request, res: Response) => {
  const { machineId } = req.params;

  // Check if machine exists and user has access
  const machine = await prisma.vncMachine.findUnique({
    where: { id: machineId },
  });

  if (!machine) {
    throw new AppError(404, 'VNC machine not found');
  }

  // Check access: user can favorite if it's shared or if they own it
  if (machine.ownerId !== null && machine.ownerId !== req.userId) {
    throw new AppError(403, 'Access denied');
  }

  // Check if already favorited
  const existing = await prisma.userFavorite.findUnique({
    where: {
      userId_machineId: {
        userId: req.userId!,
        machineId: machineId,
      },
    },
  });

  if (existing) {
    // Remove favorite
    await prisma.userFavorite.delete({
      where: {
        userId_machineId: {
          userId: req.userId!,
          machineId: machineId,
        },
      },
    });
    res.json({ isFavorite: false });
  } else {
    // Add favorite
    await prisma.userFavorite.create({
      data: {
        userId: req.userId!,
        machineId: machineId,
      },
    });
    res.json({ isFavorite: true });
  }
};

export const getFavorites = async (req: Request, res: Response) => {
  const favorites = await prisma.userFavorite.findMany({
    where: { userId: req.userId! },
    include: {
      machine: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const machines = favorites.map(f => ({
    ...f.machine,
    tags: f.machine.tags ? JSON.parse(f.machine.tags) : [],
    isFavorite: true,
  }));

  res.json({ machines });
};

