import { Router } from 'express';
import { getActivityLogs, logActivity } from '../controllers/activityLogs';
import { authenticate } from '../middleware/auth';

export const activityLogRoutes = Router();

activityLogRoutes.use(authenticate);

activityLogRoutes.get('/', getActivityLogs);
activityLogRoutes.post('/', logActivity);

