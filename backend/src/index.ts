import express from 'express';
import cors from 'cors';
import 'express-async-errors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { vncMachineRoutes } from './routes/vncMachines';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vnc-machines', vncMachineRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // Display admin credentials if admin user exists
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' },
      select: { id: true, email: true, role: true },
    });
    
    if (admin) {
      console.log('\n========================================');
      console.log('Admin account exists:');
      console.log('Email: admin@example.com');
      console.log('(Password was set during database seed)');
      console.log('Run: npm run prisma:seed to see password');
      console.log('========================================\n');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    // Ignore errors - database might not be ready yet
  }
});

