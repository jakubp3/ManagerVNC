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
    notes?: string;
    tags?: string[];
    groups?: string[];
  }) => Promise<void>;
  availableGroups?: string[];
}

export const MachineModal: React.FC<MachineModalProps> = ({
  machine,
  isShared = false,
  onClose,
  onSave,
  availableGroups = [],
}) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState(5900);
  const [password, setPassword] = useState('');
  const [shared, setShared] = useState(isShared);
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [groups, setGroups] = useState<string[]>([]);
  const [groupInput, setGroupInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (machine) {
      setName(machine.name);
      setHost(machine.host);
      setPort(machine.port);
      setPassword(machine.password || '');
      setShared(machine.ownerId === null);
      setNotes(machine.notes || '');
      setTags(machine.tags || []);
      setGroups(machine.groups || []);
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
        notes: notes || undefined,
        tags: tags.length > 0 ? tags : undefined,
        groups: groups.length > 0 ? groups : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save machine');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleAddGroup = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && groupInput.trim()) {
      e.preventDefault();
      if (!groups.includes(groupInput.trim())) {
        setGroups([...groups, groupInput.trim()]);
      }
      setGroupInput('');
    }
  };

  const handleRemoveGroup = (groupToRemove: string) => {
    setGroups(groups.filter(g => g !== groupToRemove));
  };

  const canSetShared = user?.role === 'ADMIN' || user?.canManageSharedMachines || false;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 dark:text-gray-100">
          {machine ? 'Edit Session' : 'Create Session'}
        </h2>
        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="name">
              Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="host">
              Host *
            </label>
            <input
              id="host"
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              required
              placeholder="192.168.1.100"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="port">
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="password">
              Password (optional)
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="notes">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Add notes or description..."
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="tags">
              Tags (optional)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              id="tags"
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Type tag and press Enter"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="groups">
              Groups (optional)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {groups.map((group) => (
                <span
                  key={group}
                  className="inline-flex items-center px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs"
                >
                  {group}
                  <button
                    type="button"
                    onClick={() => handleRemoveGroup(group)}
                    className="ml-1 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              {unselectedGroups.length > 0 ? (
                <select
                  onChange={handleSelectGroup}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                >
                  <option value="">Select existing group...</option>
                  {unselectedGroups.map((group) => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              ) : null}
              <input
                type="text"
                value={groupInput}
                onChange={(e) => setGroupInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && groupInput.trim()) {
                    e.preventDefault();
                    handleAddGroup(groupInput);
                  }
                }}
                placeholder={unselectedGroups.length > 0 ? "Or type new group name" : "Type group name and press Enter"}
                className={`px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm ${unselectedGroups.length > 0 ? 'flex-1' : 'w-full'}`}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Select from existing groups or create a new one</p>
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
                <span className="text-sm text-gray-700 dark:text-gray-300">Shared session (visible to all users)</span>
              </label>
            </div>
          )}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition dark:text-gray-200"
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

