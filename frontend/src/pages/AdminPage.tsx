import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { MachineModal } from '../components/MachineModal';
import { api } from '../services/api';
import { User, VncMachine } from '../types';

export const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [sharedMachines, setSharedMachines] = useState<VncMachine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'machines'>('users');
  const [showModal, setShowModal] = useState(false);
  const [editingMachine, setEditingMachine] = useState<VncMachine | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, machinesRes] = await Promise.all([
        api.get('/users'),
        api.get('/vnc-machines/shared'),
      ]);
      setUsers(usersRes.data.users);
      setSharedMachines(machinesRes.data.machines);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: 'USER' | 'ADMIN') => {
    try {
      await api.patch(`/users/${userId}`, { role: newRole });
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }
    try {
      await api.delete(`/users/${userId}`);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleDeleteMachine = async (machineId: string) => {
    if (!window.confirm('Are you sure you want to delete this session?')) {
      return;
    }
    try {
      await api.delete(`/vnc-machines/${machineId}`);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete session');
    }
  };

  const handleCreateMachine = () => {
    setEditingMachine(null);
    setShowModal(true);
  };

  const handleEditMachine = (machine: VncMachine) => {
    setEditingMachine(machine);
    setShowModal(true);
  };

  const handleSaveMachine = async (data: {
    name: string;
    host: string;
    port: number;
    password?: string;
    isShared: boolean;
  }) => {
    try {
      if (editingMachine) {
        await api.patch(`/vnc-machines/${editingMachine.id}`, data);
      } else {
        // Always create as shared in admin panel
        await api.post('/vnc-machines', { ...data, isShared: true });
      }
      await fetchData();
      setShowModal(false);
      setEditingMachine(null);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save session');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'users'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('machines')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'machines'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Shared Sessions
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : (
          <>
            {activeTab === 'users' && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Admin View
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              user.role === 'ADMIN'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={async () => {
                              try {
                                await api.patch(`/users/${user.id}`, {
                                  canManageSharedMachines: !user.canManageSharedMachines,
                                });
                                await fetchData();
                              } catch (err: any) {
                                alert(err.response?.data?.error || 'Failed to update permission');
                              }
                            }}
                            className={`px-2 py-1 text-xs rounded transition ${
                              user.canManageSharedMachines
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {user.canManageSharedMachines ? 'Yes' : 'No'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() =>
                              handleUpdateUserRole(user.id, user.role === 'ADMIN' ? 'USER' : 'ADMIN')
                            }
                            className="text-blue-600 hover:text-blue-900"
                          >
                            {user.role === 'ADMIN' ? 'Demote' : 'Promote'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'machines' && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="mb-4">
                  <button
                    onClick={handleCreateMachine}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition font-medium shadow-sm hover:shadow-md"
                  >
                    + Create Shared Session
                  </button>
                </div>
                <div className="space-y-3">
                  {sharedMachines.length === 0 ? (
                    <p className="text-gray-500 text-sm">No shared sessions</p>
                  ) : (
                    sharedMachines.map((machine) => (
                      <div
                        key={machine.id}
                        className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:shadow-md transition"
                      >
                        <div>
                          <h4 className="font-medium">{machine.name}</h4>
                          <p className="text-sm text-gray-600">
                            {machine.host}:{machine.port}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditMachine(machine)}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteMachine(machine.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {showModal && (
          <MachineModal
            machine={editingMachine}
            isShared={true}
            onClose={() => {
              setShowModal(false);
              setEditingMachine(null);
            }}
            onSave={handleSaveMachine}
          />
        )}
      </div>
    </div>
  );
};

