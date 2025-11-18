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
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGroup, setFilterGroup] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showQuickConnect, setShowQuickConnect] = useState(false);
  const [quickConnectHost, setQuickConnectHost] = useState('');
  const [quickConnectPort, setQuickConnectPort] = useState(5900);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('dark_mode');
    return saved === 'true';
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
    notes?: string;
    tags?: string[];
    group?: string;
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

  const handleOpenMachine = async (machine: VncMachine) => {
    // Log activity
    try {
      await api.post('/activity-logs', {
        machineId: machine.id,
        action: 'connect',
      });
    } catch (e) {
      // Ignore activity log errors
    }

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
    // If no sessions left
    if (updatedSessions.length === 0) {
      // Exit fullscreen if active
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      // If sidebar is closed, open it automatically
      if (!sidebarOpen) {
        setSidebarOpen(true);
        localStorage.setItem('sidebar_open', 'true');
      }
    }
  };

  // Apply filters
  const filterMachines = (machines: VncMachine[]) => {
    return machines.filter((m) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          m.name.toLowerCase().includes(query) ||
          m.host.toLowerCase().includes(query) ||
          m.notes?.toLowerCase().includes(query) ||
          m.tags?.some(tag => tag.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }
      // Group filter
      if (filterGroup) {
        if (m.group !== filterGroup) return false;
      }
      // Favorites filter
      if (showFavoritesOnly && !m.isFavorite) return false;
      return true;
    });
  };

  const allMachines = machines.filter((m) => m.ownerId === null || m.ownerId === user?.id);
  const sharedMachines = filterMachines(machines.filter((m) => m.ownerId === null));
  const personalMachines = filterMachines(machines.filter((m) => m.ownerId === user?.id));
  const favoriteMachines = filterMachines(machines.filter((m) => m.isFavorite));
  
  // Get unique groups
  const groups = Array.from(new Set(allMachines.map(m => m.group).filter(Boolean))) as string[];

  const handleQuickConnect = () => {
    if (!quickConnectHost.trim()) return;
    const tempMachine: VncMachine = {
      id: `quick-${Date.now()}`,
      name: `Quick: ${quickConnectHost}:${quickConnectPort}`,
      host: quickConnectHost.trim(),
      port: quickConnectPort,
      ownerId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    handleOpenMachine(tempMachine);
    setShowQuickConnect(false);
    setQuickConnectHost('');
    setQuickConnectPort(5900);
  };

  const toggleFavorite = async (machine: VncMachine) => {
    try {
      await api.post(`/favorites/${machine.id}`);
      await fetchMachines();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to toggle favorite');
    }
  };

  const exportSessions = () => {
    const dataStr = JSON.stringify(allMachines, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vnc-sessions-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSessions = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      if (!Array.isArray(imported)) {
        alert('Invalid file format');
        return;
      }
      
      for (const session of imported) {
        try {
          await api.post('/vnc-machines', {
            name: session.name,
            host: session.host,
            port: session.port,
            password: session.password,
            notes: session.notes,
            tags: session.tags,
            group: session.group,
            isShared: false, // Import as personal
          });
        } catch (err) {
          console.error('Failed to import session:', session.name);
        }
      }
      await fetchMachines();
      alert('Sessions imported successfully');
    } catch (err) {
      alert('Failed to import sessions. Please check the file format.');
    }
    e.target.value = ''; // Reset input
  };

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('dark_mode', String(darkMode));
  }, [darkMode]);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
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
              {/* Show Sessions button as first card */}
              <button
                onClick={toggleSidebar}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-2.5 border-r border-gray-300 transition font-semibold flex-shrink-0 h-full flex items-center"
                title="Show sessions"
              >
                <span className="mr-2">☰</span>
                <span>Show Sessions</span>
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
              {/* Fullscreen button */}
              <button
                onClick={() => {
                  const vncTabsContainer = document.querySelector('.vnc-tabs-container') as HTMLElement;
                  if (vncTabsContainer) {
                    if (!document.fullscreenElement) {
                      vncTabsContainer.requestFullscreen().catch(() => {});
                    } else {
                      document.exitFullscreen().catch(() => {});
                    }
                  }
                }}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white transition flex-shrink-0 h-full flex items-center ml-auto"
                title="Toggle Fullscreen"
              >
                ⤢
              </button>
            </div>
          </div>
        )}

        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:opacity-0 lg:pointer-events-none'
          } fixed lg:static inset-y-0 left-0 w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 z-40 lg:z-auto`}
          style={{ top: '64px', height: 'calc(100vh - 64px)' }}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800">
            <button
              onClick={toggleSidebar}
              className="text-lg font-semibold text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
              title="Click to hide/show sidebar"
            >
              Sessions
            </button>
            <button
              onClick={toggleSidebar}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
              title="Hide Sidebar"
            >
              ←
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 dark:bg-gray-900">
            {/* Search and Filters */}
            <div className="mb-4 space-y-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search sessions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                />
                <span className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500">🔍</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <select
                  value={filterGroup || ''}
                  onChange={(e) => setFilterGroup(e.target.value || null)}
                  className="flex-1 min-w-[120px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                >
                  <option value="">All Groups</option>
                  {groups.map((group) => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
                <button
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    showFavoritesOnly
                      ? 'bg-yellow-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  ⭐
                </button>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                  title="Toggle dark mode"
                >
                  {darkMode ? '☀️' : '🌙'}
                </button>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setShowQuickConnect(true)}
                  className="flex-1 min-w-[140px] bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition"
                >
                  ⚡ Quick
                </button>
                <button
                  onClick={exportSessions}
                  className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition"
                  title="Export sessions"
                >
                  📥
                </button>
                <label className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition cursor-pointer">
                  📤
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportSessions}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Action Buttons */}
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
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
            ) : error ? (
              <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
                {error}
              </div>
            ) : (
              <div className="space-y-4">
                {showFavoritesOnly && favoriteMachines.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="w-full px-4 py-3 flex items-center justify-between">
                      <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">⭐ Favorites</h3>
                      <span className="text-yellow-500">⭐</span>
                    </div>
                    <div className="px-4 pb-4">
                      <MachineList
                        machines={favoriteMachines}
                        onOpen={handleOpenMachine}
                        onEdit={handleEditMachine}
                        onDelete={handleDeleteMachine}
                        onToggleFavorite={toggleFavorite}
                        title=""
                        canEdit={true}
                      />
                    </div>
                  </div>
                )}
                {!showFavoritesOnly && (
                  <>
                    {sharedMachines.length > 0 && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => {
                            const newState = !sharedSessionsExpanded;
                            setSharedSessionsExpanded(newState);
                            localStorage.setItem('shared_sessions_expanded', String(newState));
                          }}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition rounded-t-lg"
                        >
                          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">Shared Sessions</h3>
                          <span className="text-gray-500 dark:text-gray-400 text-lg">
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
                              onToggleFavorite={toggleFavorite}
                              title=""
                              canEdit={user?.role === 'ADMIN' || user?.canManageSharedMachines || false}
                            />
                          </div>
                        )}
                      </div>
                    )}
                    {personalMachines.length > 0 && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => {
                            const newState = !mySessionsExpanded;
                            setMySessionsExpanded(newState);
                            localStorage.setItem('my_sessions_expanded', String(newState));
                          }}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition rounded-t-lg"
                        >
                          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">My Sessions</h3>
                          <span className="text-gray-500 dark:text-gray-400 text-lg">
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
                              onToggleFavorite={toggleFavorite}
                              title=""
                              canEdit={true}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
                {sharedMachines.length === 0 && personalMachines.length === 0 && favoriteMachines.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {searchQuery || filterGroup || showFavoritesOnly
                      ? 'No sessions match your filters'
                      : 'No sessions available'}
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

      {/* Quick Connect Modal */}
      {showQuickConnect && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 dark:text-gray-200">Quick Connect</h2>
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                Host/IP *
              </label>
              <input
                type="text"
                value={quickConnectHost}
                onChange={(e) => setQuickConnectHost(e.target.value)}
                placeholder="192.168.1.100"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                autoFocus
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                Port *
              </label>
              <input
                type="number"
                value={quickConnectPort}
                onChange={(e) => setQuickConnectPort(parseInt(e.target.value) || 5900)}
                min="1"
                max="65535"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowQuickConnect(false);
                  setQuickConnectHost('');
                  setQuickConnectPort(5900);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition dark:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleQuickConnect}
                disabled={!quickConnectHost.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition disabled:opacity-50"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

