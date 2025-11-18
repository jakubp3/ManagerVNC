import express from 'express';
import cors from 'cors';
import 'express-async-errors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { vncMachineRoutes } from './routes/vncMachines';
import { favoriteRoutes } from './routes/favorites';
import { activityLogRoutes } from './routes/activityLogs';
import { initAdmin } from './initAdmin';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || true, // Allow all origins in development, or set specific origin in production
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
app.use('/api/favorites', favoriteRoutes);
app.use('/api/activity-logs', activityLogRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  
  // Initialize admin account if it doesn't exist
  setTimeout(() => {
    initAdmin();
  }, 2000); // Wait 2 seconds for database to be ready
});

