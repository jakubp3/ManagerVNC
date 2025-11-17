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
  createdAt: string;
  updatedAt: string;
}

export interface VncSession {
  id: string;
  machine: VncMachine;
  url: string;
}

