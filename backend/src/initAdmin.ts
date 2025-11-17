import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function initAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' },
    });

    if (existingAdmin) {
      console.log('Admin account already exists: admin@example.com');
      return;
    }

    // Create admin account with static password
    const adminPassword = await bcrypt.hash('admin123', 10);

    await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: adminPassword,
        role: 'ADMIN',
        canManageSharedMachines: true,
      },
    });

    console.log('\n========================================');
    console.log('ADMIN ACCOUNT CREATED (TEST MODE)');
    console.log('========================================');
    console.log('Email:    admin@example.com');
    console.log('Password: admin123');
    console.log('========================================\n');
  } catch (error) {
    console.error('Error initializing admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

