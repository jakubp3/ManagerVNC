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
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  groups: z.array(z.string()).optional(),
});

const updateVncMachineSchema = createVncMachineSchema.partial();

export const getVncMachines = async (req: Request, res: Response) => {
  // Get user's favorites
  const userFavorites = await prisma.userFavorite.findMany({
    where: { userId: req.userId! },
    select: { machineId: true },
  });
  const favoriteIds = new Set(userFavorites.map(f => f.machineId));

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

  // Add isFavorite flag and parse tags/groups
  const machinesWithFavorites = machines.map(machine => {
    const tags = machine.tags ? JSON.parse(machine.tags) : [];
    const groups = machine.groups ? JSON.parse(machine.groups) : [];
    return {
      ...machine,
      tags,
      groups,
      isFavorite: favoriteIds.has(machine.id),
    };
  });

  res.json({ machines: machinesWithFavorites });
};

export const getSharedMachines = async (req: Request, res: Response) => {
  const userFavorites = await prisma.userFavorite.findMany({
    where: { userId: req.userId! },
    select: { machineId: true },
  });
  const favoriteIds = new Set(userFavorites.map(f => f.machineId));

  const machines = await prisma.vncMachine.findMany({
    where: {
      ownerId: null, // Shared machines have null ownerId
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const machinesWithFavorites = machines.map(machine => {
    const tags = machine.tags ? JSON.parse(machine.tags) : [];
    return {
      ...machine,
      tags,
      isFavorite: favoriteIds.has(machine.id),
    };
  });

  res.json({ machines: machinesWithFavorites });
};

export const getPersonalMachines = async (req: Request, res: Response) => {
  const userFavorites = await prisma.userFavorite.findMany({
    where: { userId: req.userId! },
    select: { machineId: true },
  });
  const favoriteIds = new Set(userFavorites.map(f => f.machineId));

  const machines = await prisma.vncMachine.findMany({
    where: {
      ownerId: req.userId!,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const machinesWithFavorites = machines.map(machine => {
    const tags = machine.tags ? JSON.parse(machine.tags) : [];
    return {
      ...machine,
      tags,
      isFavorite: favoriteIds.has(machine.id),
    };
  });

  res.json({ machines: machinesWithFavorites });
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

  // Check if favorited
  const isFavorite = await prisma.userFavorite.findUnique({
    where: {
      userId_machineId: {
        userId: req.userId!,
        machineId: id,
      },
    },
  });

  const tags = machine.tags ? JSON.parse(machine.tags) : [];
  const groups = machine.groups ? JSON.parse(machine.groups) : [];
  res.json({ machine: { ...machine, tags, groups, isFavorite: !!isFavorite } });
};

export const createVncMachine = async (req: Request, res: Response) => {
  const validated = createVncMachineSchema.parse(req.body);

  // Only users with canManageSharedMachines permission can create shared machines
  if (validated.isShared && !req.canManageSharedMachines) {
    throw new AppError(403, 'You do not have permission to create shared machines');
  }

  const machine = await prisma.vncMachine.create({
    data: {
      name: validated.name,
      host: validated.host,
      port: validated.port,
      password: validated.password,
      ownerId: validated.isShared ? null : req.userId!, // null = shared, userId = personal
      notes: validated.notes,
      tags: validated.tags ? JSON.stringify(validated.tags) : null,
      groups: validated.groups ? JSON.stringify(validated.groups) : null,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.userId!,
      machineId: machine.id,
      action: 'create',
    },
  });

  const tags = machine.tags ? JSON.parse(machine.tags) : [];
  const groups = machine.groups ? JSON.parse(machine.groups) : [];
  res.status(201).json({ machine: { ...machine, tags, groups } });
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
    // Shared machine - only users with canManageSharedMachines permission can edit
    if (!req.canManageSharedMachines) {
      throw new AppError(403, 'You do not have permission to edit shared machines');
    }
  } else {
    // Personal machine - only owner can edit
    if (existingMachine.ownerId !== req.userId) {
      throw new AppError(403, 'Access denied');
    }
  }

  // If trying to change isShared, validate permissions
  if (validated.isShared !== undefined) {
    if (validated.isShared && !req.canManageSharedMachines) {
      throw new AppError(403, 'You do not have permission to create shared machines');
    }
  }

  const updateData: any = {};
  if (validated.name !== undefined) updateData.name = validated.name;
  if (validated.host !== undefined) updateData.host = validated.host;
  if (validated.port !== undefined) updateData.port = validated.port;
  if (validated.password !== undefined) updateData.password = validated.password;
  if (validated.notes !== undefined) updateData.notes = validated.notes;
  if (validated.tags !== undefined) updateData.tags = validated.tags ? JSON.stringify(validated.tags) : null;
  if (validated.groups !== undefined) updateData.groups = validated.groups ? JSON.stringify(validated.groups) : null;
  if (validated.isShared !== undefined) {
    updateData.ownerId = validated.isShared ? null : req.userId!;
  }

  const machine = await prisma.vncMachine.update({
    where: { id },
    data: updateData,
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.userId!,
      machineId: machine.id,
      action: 'update',
    },
  });

  const tags = machine.tags ? JSON.parse(machine.tags) : [];
  const groups = machine.groups ? JSON.parse(machine.groups) : [];
  res.json({ machine: { ...machine, tags, groups } });
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
    // Shared machine - only users with canManageSharedMachines permission can delete
    if (!req.canManageSharedMachines) {
      throw new AppError(403, 'You do not have permission to delete shared machines');
    }
  } else {
    // Personal machine - only owner can delete
    if (existingMachine.ownerId !== req.userId) {
      throw new AppError(403, 'Access denied');
    }
  }

  // Log activity before deletion
  await prisma.activityLog.create({
    data: {
      userId: req.userId!,
      machineId: id,
      action: 'delete',
    },
  });

  await prisma.vncMachine.delete({
    where: { id },
  });

  res.json({ message: 'VNC machine deleted successfully' });
};

