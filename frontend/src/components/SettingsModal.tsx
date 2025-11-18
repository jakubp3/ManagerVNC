import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { VncMachine } from '../types';

// Group Manager Component
const GroupManager: React.FC<{ machines: VncMachine[] }> = ({ machines }) => {
  const [allGroups, setAllGroups] = useState<string[]>([]);
  const [newGroupName, setNewGroupName] = useState('');

  useEffect(() => {
    const groups = new Set<string>();
    machines.forEach(m => {
      if (m.groups && m.groups.length > 0) {
        m.groups.forEach(g => groups.add(g));
      }
    });
    setAllGroups(Array.from(groups).sort());
  }, [machines]);

  const handleAddGroup = () => {
    if (newGroupName.trim() && !allGroups.includes(newGroupName.trim())) {
      setAllGroups([...allGroups, newGroupName.trim()].sort());
      setNewGroupName('');
    }
  };

  const handleDeleteGroup = (groupName: string) => {
    if (window.confirm(`Delete group "${groupName}"? This will remove it from all sessions.`)) {
      // Remove group from all machines
      machines.forEach(async (machine) => {
        if (machine.groups && machine.groups.includes(groupName)) {
          const updatedGroups = machine.groups.filter(g => g !== groupName);
          try {
            await api.patch(`/vnc-machines/${machine.id}`, {
              groups: updatedGroups.length > 0 ? updatedGroups : undefined,
            });
          } catch (err) {
            console.error('Failed to update machine:', machine.name);
          }
        }
      });
      setAllGroups(allGroups.filter(g => g !== groupName));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddGroup();
            }
          }}
          placeholder="New group name"
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
        />
        <button
          onClick={handleAddGroup}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition text-sm font-medium"
        >
          Add Group
        </button>
      </div>
      {allGroups.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">Existing groups:</p>
          <div className="flex flex-wrap gap-2">
            {allGroups.map((group) => (
              <div
                key={group}
                className="inline-flex items-center px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-lg text-sm"
              >
                <span>{group}</span>
                <button
                  onClick={() => handleDeleteGroup(group)}
                  className="ml-2 text-purple-600 dark:text-purple-400 hover:text-red-600 dark:hover:text-red-400 transition"
                  title="Delete group"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">No groups created yet</p>
      )}
    </div>
  );
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  machines: VncMachine[];
  onExportComplete?: () => void;
  onDarkModeChange?: (enabled: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  machines,
  onExportComplete,
  onDarkModeChange,
}) => {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('dark_mode');
    return saved === 'true';
  });
  const [defaultPort, setDefaultPort] = useState(() => {
    const saved = localStorage.getItem('default_vnc_port');
    return saved ? parseInt(saved) : 5900;
  });
  const [autoReconnect, setAutoReconnect] = useState(() => {
    const saved = localStorage.getItem('auto_reconnect');
    return saved !== 'false';
  });
  const [sessionTimeout, setSessionTimeout] = useState(() => {
    const saved = localStorage.getItem('session_timeout_minutes');
    return saved ? parseInt(saved) : 0; // 0 = no timeout
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDarkModeToggle = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('dark_mode', String(newMode));
    if (onDarkModeChange) {
      onDarkModeChange(newMode);
    }
  };

  const handleDefaultPortChange = (port: number) => {
    setDefaultPort(port);
    localStorage.setItem('default_vnc_port', String(port));
  };

  const handleAutoReconnectToggle = () => {
    const newValue = !autoReconnect;
    setAutoReconnect(newValue);
    localStorage.setItem('auto_reconnect', String(newValue));
  };

  const handleSessionTimeoutChange = (minutes: number) => {
    setSessionTimeout(minutes);
    localStorage.setItem('session_timeout_minutes', String(minutes));
  };

  const handleExportSessions = () => {
    const dataStr = JSON.stringify(machines, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vnc-sessions-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    if (onExportComplete) {
      onExportComplete();
    }
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
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const session of imported) {
        try {
          await api.post('/vnc-machines', {
            name: session.name,
            host: session.host,
            port: session.port || defaultPort,
            password: session.password,
            notes: session.notes,
            tags: session.tags,
            group: session.group,
            isShared: false, // Import as personal
          });
          successCount++;
        } catch (err) {
          errorCount++;
          console.error('Failed to import session:', session.name);
        }
      }
      
      alert(`Import complete: ${successCount} sessions imported${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
      if (successCount > 0 && onExportComplete) {
        onExportComplete();
      }
    } catch (err) {
      alert('Failed to import sessions. Please check the file format.');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExportActivityLogs = async () => {
    try {
      const response = await api.get('/activity-logs?limit=1000');
      const logs = response.data.logs || [];
      const dataStr = JSON.stringify(logs, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `activity-logs-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export activity logs');
    }
  };

  const handleClearLocalStorage = () => {
    if (window.confirm('Are you sure you want to clear all local preferences? This will reset your settings to defaults.')) {
      localStorage.removeItem('dark_mode');
      localStorage.removeItem('default_vnc_port');
      localStorage.removeItem('auto_reconnect');
      localStorage.removeItem('session_timeout_minutes');
      localStorage.removeItem('sidebar_open');
      localStorage.removeItem('shared_sessions_expanded');
      localStorage.removeItem('my_sessions_expanded');
      // Keep sessions and active session
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* User Info */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">User Information</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Email:</span>
                <span className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100">{user?.email}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Role:</span>
                <span className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100">{user?.role}</span>
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Appearance</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Toggle dark theme</p>
                </div>
                <button
                  onClick={handleDarkModeToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    darkMode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      darkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Connection Settings */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Connection Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default VNC Port
                </label>
                <input
                  type="number"
                  value={defaultPort}
                  onChange={(e) => handleDefaultPortChange(parseInt(e.target.value) || 5900)}
                  min="1"
                  max="65535"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Default port for new connections</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto Reconnect</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Automatically reconnect on disconnect</p>
                </div>
                <button
                  onClick={handleAutoReconnectToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoReconnect ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoReconnect ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  value={sessionTimeout}
                  onChange={(e) => handleSessionTimeoutChange(parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">0 = no timeout</p>
              </div>
            </div>
          </div>

          {/* Group Management */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Group Management</h3>
            <GroupManager machines={machines} />
          </div>

          {/* Data Management */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Data Management</h3>
            <div className="space-y-3">
              <button
                onClick={handleExportSessions}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium"
              >
                Export Sessions
              </button>
              <label className="block w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm font-medium text-center cursor-pointer">
                Import Sessions
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportSessions}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleExportActivityLogs}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition text-sm font-medium"
              >
                Export Activity Logs
              </button>
            </div>
          </div>

          {/* Advanced */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Advanced</h3>
            <button
              onClick={handleClearLocalStorage}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium"
            >
              Reset All Settings
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              This will clear all local preferences and reload the page
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

