import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  // Generate a random password for admin
  const adminPlainPassword = crypto.randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 12);
  const adminPassword = await bcrypt.hash(adminPlainPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: adminPassword,
      role: 'ADMIN',
      canManageSharedMachines: true, // Admin can always manage shared machines
    },
  });

  console.log('\n========================================');
  console.log('ADMIN ACCOUNT CREATED');
  console.log('========================================');
  console.log('Email:    admin@example.com');
  console.log('Password: ' + adminPlainPassword);
  console.log('========================================\n');

  // Create a test regular user
  // Email: user@example.com
  // Password: user123
  const userPassword = await bcrypt.hash('user123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: userPassword,
      role: 'USER',
      canManageSharedMachines: false,
    },
  });

  console.log('Created test user:', user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

