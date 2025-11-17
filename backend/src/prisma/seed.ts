import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Static test password for admin (for testing only)
  const adminPlainPassword = 'admin123';
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
  console.log('ADMIN ACCOUNT CREATED (TEST MODE)');
  console.log('========================================');
  console.log('Email:    admin@example.com');
  console.log('Password: admin123');
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

