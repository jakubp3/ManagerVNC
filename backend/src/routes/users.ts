import { Router } from 'express';
import { getUsers, updateUser, deleteUser } from '../controllers/users';
import { authenticate, requireAdmin } from '../middleware/auth';

export const userRoutes = Router();

// All user routes require authentication and admin role
userRoutes.use(authenticate);
userRoutes.use(requireAdmin);

userRoutes.get('/', getUsers);
userRoutes.patch('/:id', updateUser);
userRoutes.delete('/:id', deleteUser);

