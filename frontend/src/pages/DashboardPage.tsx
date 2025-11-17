import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { MachineList } from '../components/MachineList';
import { MachineModal } from '../components/MachineModal';
import { VncTabs } from '../components/VncTabs';
import { api } from '../services/api';
import { VncMachine } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [machines, setMachines] = useState<VncMachine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMachine, setEditingMachine] = useState<VncMachine | null>(null);
  const [isSharedModal, setIsSharedModal] = useState(false);
  
  // Load sessions from localStorage on mount
  const loadSessions = (): Array<{ id: string; machine: VncMachine }> => {
    try {
      const saved = localStorage.getItem('vnc_sessions');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load sessions:', e);
    }
    return [];
  };

  const saveSessions = (sessions: Array<{ id: string; machine: VncMachine }>) => {
    try {
      localStorage.setItem('vnc_sessions', JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save sessions:', e);
    }
  };

  const [sessions, setSessionsState] = useState<Array<{ id: string; machine: VncMachine }>>(loadSessions);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    const saved = localStorage.getItem('active_vnc_session');
    return saved || null;
  });

  // Update localStorage when sessions change
  const setSessions = (newSessions: Array<{ id: string; machine: VncMachine }>) => {
    setSessionsState(newSessions);
    saveSessions(newSessions);
  };

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const response = await api.get('/vnc-machines');
      setMachines(response.data.machines);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load machines');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMachine = () => {
    setEditingMachine(null);
    setIsSharedModal(false);
    setShowModal(true);
  };

  const handleCreateSharedMachine = () => {
    setEditingMachine(null);
    setIsSharedModal(true);
    setShowModal(true);
  };

  const handleEditMachine = (machine: VncMachine) => {
    setEditingMachine(machine);
    setIsSharedModal(machine.ownerId === null);
    setShowModal(true);
  };

  const handleSaveMachine = async (data: {
    name: string;
    host: string;
    port: number;
    password?: string;
    isShared: boolean;
  }) => {
    if (editingMachine) {
      await api.patch(`/vnc-machines/${editingMachine.id}`, data);
    } else {
      await api.post('/vnc-machines', data);
    }
    await fetchMachines();
  };

  const handleDeleteMachine = async (machine: VncMachine) => {
    if (!window.confirm(`Are you sure you want to delete "${machine.name}"?`)) {
      return;
    }
    try {
      await api.delete(`/vnc-machines/${machine.id}`);
      await fetchMachines();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete machine');
    }
  };

  const handleOpenMachine = (machine: VncMachine) => {
    // Check if session already exists for this machine
    const existingSession = sessions.find(s => s.machine.id === machine.id);
    if (existingSession) {
      setActiveSessionId(existingSession.id);
      return;
    }

    const sessionId = `session-${Date.now()}-${machine.id}`;
    const newSession = { id: sessionId, machine };
    const updatedSessions = [...sessions, newSession];
    setSessions(updatedSessions);
    setActiveSessionId(sessionId);
    localStorage.setItem('active_vnc_session', sessionId);
  };

  const handleCloseSession = (sessionId: string) => {
    const updatedSessions = sessions.filter((s) => s.id !== sessionId);
    setSessions(updatedSessions);
    if (activeSessionId === sessionId) {
      const remaining = updatedSessions;
      const newActiveId = remaining.length > 0 ? remaining[0].id : null;
      setActiveSessionId(newActiveId);
      if (newActiveId) {
        localStorage.setItem('active_vnc_session', newActiveId);
      } else {
        localStorage.removeItem('active_vnc_session');
      }
    }
  };

  const sharedMachines = machines.filter((m) => m.ownerId === null);
  const personalMachines = machines.filter((m) => m.ownerId === user?.id);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Sidebar */}
        <div className="w-full lg:w-80 bg-white border-r border-gray-200 overflow-y-auto p-4 flex-shrink-0">
          <div className="mb-4">
            <button
              onClick={handleCreateMachine}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition mb-2"
            >
              + Create Personal Machine
            </button>
            {(user?.role === 'ADMIN' || user?.canManageSharedMachines) && (
              <button
                onClick={handleCreateSharedMachine}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
              >
                + Create Shared Machine
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          ) : (
            <div className="space-y-6">
              {sharedMachines.length > 0 && (
                <MachineList
                  machines={sharedMachines}
                  onOpen={handleOpenMachine}
                  onEdit={handleEditMachine}
                  onDelete={handleDeleteMachine}
                  title="Shared Machines"
                  canEdit={user?.role === 'ADMIN' || user?.canManageSharedMachines || false}
                />
              )}
              {personalMachines.length > 0 && (
                <MachineList
                  machines={personalMachines}
                  onOpen={handleOpenMachine}
                  onEdit={handleEditMachine}
                  onDelete={handleDeleteMachine}
                  title="My Machines"
                  canEdit={true}
                />
              )}
            </div>
          )}
        </div>

        {/* Main content area with VNC tabs */}
        <div className="flex-1 flex flex-col min-w-0">
          <VncTabs
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={(id) => {
              setActiveSessionId(id);
              localStorage.setItem('active_vnc_session', id);
            }}
            onCloseSession={handleCloseSession}
          />
        </div>
      </div>

      {showModal && (
        <MachineModal
          machine={editingMachine}
          isShared={isSharedModal}
          onClose={() => {
            setShowModal(false);
            setEditingMachine(null);
          }}
          onSave={handleSaveMachine}
        />
      )}
    </div>
  );
};

