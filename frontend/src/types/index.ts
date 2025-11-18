export interface User {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  canManageSharedMachines?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface VncMachine {
  id: string;
  name: string;
  host: string;
  port: number;
  password?: string;
  ownerId: string | null;
  notes?: string;
  tags?: string[];
  group?: string;
  lastAccessed?: string;
  isFavorite?: boolean; // Client-side computed
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  machineId: string;
  action: string;
  createdAt: string;
  machine?: VncMachine;
  user?: User;
}

export interface VncSession {
  id: string;
  machine: VncMachine;
  url: string;
}

