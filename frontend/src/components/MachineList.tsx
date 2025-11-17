import { VncMachine } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface MachineListProps {
  machines: VncMachine[];
  onOpen: (machine: VncMachine) => void;
  onEdit: (machine: VncMachine) => void;
  onDelete: (machine: VncMachine) => void;
  title: string;
  canEdit: boolean;
}

export const MachineList: React.FC<MachineListProps> = ({
  machines,
  onOpen,
  onEdit,
  onDelete,
  title,
  canEdit,
}) => {
  const { user } = useAuth();

  if (machines.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <p className="text-gray-500 text-sm">No machines available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="space-y-3">
        {machines.map((machine) => {
          const isOwner = machine.ownerId === user?.id;
          const isShared = machine.ownerId === null;
          const canEditThis = canEdit && (isOwner || (isShared && user?.role === 'ADMIN'));

          return (
            <div
              key={machine.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium">{machine.name}</h4>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        isShared
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {isShared ? 'Shared' : 'Personal'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {machine.host}:{machine.port}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onOpen(machine)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition"
                  >
                    Open
                  </button>
                  {canEditThis && (
                    <>
                      <button
                        onClick={() => onEdit(machine)}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(machine)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

