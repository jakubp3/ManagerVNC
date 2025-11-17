import { useState, useEffect } from 'react';
import { VncMachine } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface MachineModalProps {
  machine?: VncMachine | null;
  isShared?: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    host: string;
    port: number;
    password?: string;
    isShared: boolean;
  }) => Promise<void>;
}

export const MachineModal: React.FC<MachineModalProps> = ({
  machine,
  isShared = false,
  onClose,
  onSave,
}) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState(5900);
  const [password, setPassword] = useState('');
  const [shared, setShared] = useState(isShared);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (machine) {
      setName(machine.name);
      setHost(machine.host);
      setPort(machine.port);
      setPassword(machine.password || '');
      setShared(machine.ownerId === null);
    }
  }, [machine]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSave({
        name,
        host,
        port,
        password: password || undefined,
        isShared: shared,
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save machine');
    } finally {
      setLoading(false);
    }
  };

  const canSetShared = user?.role === 'ADMIN';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {machine ? 'Edit Machine' : 'Create Machine'}
        </h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
              Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="host">
              Host *
            </label>
            <input
              id="host"
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              required
              placeholder="192.168.1.100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="port">
              Port *
            </label>
            <input
              id="port"
              type="number"
              value={port}
              onChange={(e) => setPort(parseInt(e.target.value) || 5900)}
              required
              min="1"
              max="65535"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password (optional)
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {canSetShared && (
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={shared}
                  onChange={(e) => setShared(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Shared machine (visible to all users)</span>
              </label>
            </div>
          )}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

