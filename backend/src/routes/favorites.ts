import { Router } from 'express';
import { toggleFavorite, getFavorites } from '../controllers/favorites';
import { authenticate } from '../middleware/auth';

export const favoriteRoutes = Router();

favoriteRoutes.use(authenticate);

favoriteRoutes.post('/:machineId', toggleFavorite);
favoriteRoutes.get('/', getFavorites);

