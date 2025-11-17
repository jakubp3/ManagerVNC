import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

const createVncMachineSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  host: z.string().min(1, 'Host is required'),
  port: z.number().int().min(1).max(65535).default(5900),
  password: z.string().optional(),
  isShared: z.boolean().optional().default(false), // Frontend sends this flag
});

const updateVncMachineSchema = createVncMachineSchema.partial();

export const getVncMachines = async (req: Request, res: Response) => {
  // Return both shared machines (ownerId = null) and user's personal machines
  const machines = await prisma.vncMachine.findMany({
    where: {
      OR: [
        { ownerId: null }, // Shared machines
        { ownerId: req.userId! }, // User's personal machines
      ],
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json({ machines });
};

export const getSharedMachines = async (req: Request, res: Response) => {
  const machines = await prisma.vncMachine.findMany({
    where: {
      ownerId: null, // Shared machines have null ownerId
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json({ machines });
};

export const getPersonalMachines = async (req: Request, res: Response) => {
  const machines = await prisma.vncMachine.findMany({
    where: {
      ownerId: req.userId!,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json({ machines });
};

export const getVncMachine = async (req: Request, res: Response) => {
  const { id } = req.params;

  const machine = await prisma.vncMachine.findUnique({
    where: { id },
  });

  if (!machine) {
    throw new AppError(404, 'VNC machine not found');
  }

  // Check access: user can access if it's shared or if they own it
  if (machine.ownerId !== null && machine.ownerId !== req.userId) {
    throw new AppError(403, 'Access denied');
  }

  res.json({ machine });
};

export const createVncMachine = async (req: Request, res: Response) => {
  const validated = createVncMachineSchema.parse(req.body);

  // Only admins can create shared machines
  if (validated.isShared && req.userRole !== 'ADMIN') {
    throw new AppError(403, 'Only admins can create shared machines');
  }

  const machine = await prisma.vncMachine.create({
    data: {
      name: validated.name,
      host: validated.host,
      port: validated.port,
      password: validated.password,
      ownerId: validated.isShared ? null : req.userId!, // null = shared, userId = personal
    },
  });

  res.status(201).json({ machine });
};

export const updateVncMachine = async (req: Request, res: Response) => {
  const { id } = req.params;
  const validated = updateVncMachineSchema.parse(req.body);

  const existingMachine = await prisma.vncMachine.findUnique({
    where: { id },
  });

  if (!existingMachine) {
    throw new AppError(404, 'VNC machine not found');
  }

  // Authorization checks
  if (existingMachine.ownerId === null) {
    // Shared machine - only admin can edit
    if (req.userRole !== 'ADMIN') {
      throw new AppError(403, 'Only admins can edit shared machines');
    }
  } else {
    // Personal machine - only owner can edit
    if (existingMachine.ownerId !== req.userId) {
      throw new AppError(403, 'Access denied');
    }
  }

  // If trying to change isShared, validate permissions
  if (validated.isShared !== undefined) {
    if (validated.isShared && req.userRole !== 'ADMIN') {
      throw new AppError(403, 'Only admins can create shared machines');
    }
  }

  const updateData: any = {};
  if (validated.name !== undefined) updateData.name = validated.name;
  if (validated.host !== undefined) updateData.host = validated.host;
  if (validated.port !== undefined) updateData.port = validated.port;
  if (validated.password !== undefined) updateData.password = validated.password;
  if (validated.isShared !== undefined) {
    updateData.ownerId = validated.isShared ? null : req.userId!;
  }

  const machine = await prisma.vncMachine.update({
    where: { id },
    data: updateData,
  });

  res.json({ machine });
};

export const deleteVncMachine = async (req: Request, res: Response) => {
  const { id } = req.params;

  const existingMachine = await prisma.vncMachine.findUnique({
    where: { id },
  });

  if (!existingMachine) {
    throw new AppError(404, 'VNC machine not found');
  }

  // Authorization checks
  if (existingMachine.ownerId === null) {
    // Shared machine - only admin can delete
    if (req.userRole !== 'ADMIN') {
      throw new AppError(403, 'Only admins can delete shared machines');
    }
  } else {
    // Personal machine - only owner can delete
    if (existingMachine.ownerId !== req.userId) {
      throw new AppError(403, 'Access denied');
    }
  }

  await prisma.vncMachine.delete({
    where: { id },
  });

  res.json({ message: 'VNC machine deleted successfully' });
};

