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
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebar_open');
    return saved !== 'false'; // Default to open
  });
  const [sharedSessionsExpanded, setSharedSessionsExpanded] = useState(() => {
    const saved = localStorage.getItem('shared_sessions_expanded');
    return saved !== 'false'; // Default to expanded
  });
  const [mySessionsExpanded, setMySessionsExpanded] = useState(() => {
    const saved = localStorage.getItem('my_sessions_expanded');
    return saved !== 'false'; // Default to expanded
  });

  // Update localStorage when sessions change
  const setSessions = (newSessions: Array<{ id: string; machine: VncMachine }>) => {
    setSessionsState(newSessions);
    saveSessions(newSessions);
  };

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('sidebar_open', String(newState));
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
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <Header />
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Sidebar Toggle Button - Mobile (when closed) */}
        {!sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="lg:hidden absolute top-2 left-2 z-50 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg shadow-lg hover:shadow-xl transition font-medium"
            title="Show Sidebar"
          >
            →
          </button>
        )}

        {/* Sidebar Toggle Button - Desktop (when closed, no sessions) */}
        {!sidebarOpen && sessions.length === 0 && (
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex absolute top-4 left-4 z-50 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl shadow-xl hover:shadow-2xl transition-all font-semibold items-center gap-3 text-lg"
            title="Show Sidebar"
          >
            <span className="text-2xl">→</span>
            <span>Show Sessions</span>
          </button>
        )}

        {/* Session Cards Bar - Desktop (when sidebar is closed and sessions exist) */}
        {!sidebarOpen && sessions.length > 0 && (
          <div className="hidden lg:block absolute top-0 left-0 right-0 z-50 bg-gray-200 border-b border-gray-300">
            <div className="flex flex-1 overflow-x-auto items-center h-12">
              {/* Show Menu button as first card */}
              <button
                onClick={toggleSidebar}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-2.5 border-r border-gray-300 transition font-semibold flex-shrink-0 h-full flex items-center"
                title="Show menu"
              >
                <span className="mr-2">☰</span>
                <span>Menu</span>
              </button>
              {/* Session name cards with close button */}
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`flex items-center border-r border-gray-300 flex-shrink-0 h-full ${
                    activeSessionId === session.id
                      ? 'bg-white border-b-2 border-b-blue-500'
                      : 'bg-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <button
                    onClick={() => {
                      setActiveSessionId(session.id);
                      localStorage.setItem('active_vnc_session', session.id);
                    }}
                    className="px-4 py-2 cursor-pointer transition h-full flex items-center"
                    title={`Switch to ${session.machine.name}`}
                  >
                    <span className="text-sm font-medium whitespace-nowrap text-gray-800">
                      {session.machine.name}
                    </span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseSession(session.id);
                    }}
                    className="px-2 py-2 text-gray-500 hover:text-red-600 transition h-full flex items-center"
                    title="Close session"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:opacity-0 lg:pointer-events-none'
          } fixed lg:static inset-y-0 left-0 w-80 bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-40 lg:z-auto`}
          style={{ top: '64px', height: 'calc(100vh - 64px)' }}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <button
              onClick={toggleSidebar}
              className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition cursor-pointer"
              title="Click to hide/show sidebar"
            >
              Sessions
            </button>
            <button
              onClick={toggleSidebar}
              className="text-gray-500 hover:text-gray-700 p-1.5 hover:bg-gray-200 rounded transition"
              title="Hide Sidebar"
            >
              ←
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-4">
              <button
                onClick={handleCreateMachine}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition mb-2 font-medium shadow-sm hover:shadow-md"
              >
                + Create Personal Session
              </button>
              {(user?.role === 'ADMIN' || user?.canManageSharedMachines) && (
                <button
                  onClick={handleCreateSharedMachine}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg transition font-medium shadow-sm hover:shadow-md"
                >
                  + Create Shared Session
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
              <div className="space-y-4">
                {sharedMachines.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <button
                      onClick={() => {
                        const newState = !sharedSessionsExpanded;
                        setSharedSessionsExpanded(newState);
                        localStorage.setItem('shared_sessions_expanded', String(newState));
                      }}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition rounded-t-lg"
                    >
                      <h3 className="text-base font-semibold text-gray-800">Shared Sessions</h3>
                      <span className="text-gray-500 text-lg">
                        {sharedSessionsExpanded ? '▼' : '▶'}
                      </span>
                    </button>
                    {sharedSessionsExpanded && (
                      <div className="px-4 pb-4">
                        <MachineList
                          machines={sharedMachines}
                          onOpen={handleOpenMachine}
                          onEdit={handleEditMachine}
                          onDelete={handleDeleteMachine}
                          title=""
                          canEdit={user?.role === 'ADMIN' || user?.canManageSharedMachines || false}
                        />
                      </div>
                    )}
                  </div>
                )}
                {personalMachines.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <button
                      onClick={() => {
                        const newState = !mySessionsExpanded;
                        setMySessionsExpanded(newState);
                        localStorage.setItem('my_sessions_expanded', String(newState));
                      }}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition rounded-t-lg"
                    >
                      <h3 className="text-base font-semibold text-gray-800">My Sessions</h3>
                      <span className="text-gray-500 text-lg">
                        {mySessionsExpanded ? '▼' : '▶'}
                      </span>
                    </button>
                    {mySessionsExpanded && (
                      <div className="px-4 pb-4">
                        <MachineList
                          machines={personalMachines}
                          onOpen={handleOpenMachine}
                          onEdit={handleEditMachine}
                          onDelete={handleDeleteMachine}
                          title=""
                          canEdit={true}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Overlay for Mobile */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={toggleSidebar}
            style={{ top: '64px' }}
          />
        )}

        {/* Main content area with VNC tabs */}
        <div className={`flex-1 flex flex-col min-w-0 ${!sidebarOpen ? 'lg:ml-0' : ''}`}>
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

