import { Router } from 'express';
import {
  getVncMachines,
  getVncMachine,
  createVncMachine,
  updateVncMachine,
  deleteVncMachine,
  getSharedMachines,
  getPersonalMachines,
} from '../controllers/vncMachines';
import { authenticate } from '../middleware/auth';

export const vncMachineRoutes = Router();

// All VNC machine routes require authentication
vncMachineRoutes.use(authenticate);

vncMachineRoutes.get('/', getVncMachines);
vncMachineRoutes.get('/shared', getSharedMachines);
vncMachineRoutes.get('/personal', getPersonalMachines);
vncMachineRoutes.get('/:id', getVncMachine);
vncMachineRoutes.post('/', createVncMachine);
vncMachineRoutes.patch('/:id', updateVncMachine);
vncMachineRoutes.delete('/:id', deleteVncMachine);

