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
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <h3 className="text-base font-semibold mb-3 text-gray-800">{title}</h3>
      <div className="space-y-2">
        {machines.map((machine) => {
          const isOwner = machine.ownerId === user?.id;
          const isShared = machine.ownerId === null;
          const canEditThis = canEdit && (isOwner || (isShared && user?.role === 'ADMIN'));

          return (
            <div
              key={machine.id}
              className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition bg-gray-50 hover:bg-white"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-semibold text-sm text-gray-900 break-words">{machine.name}</h4>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${
                          isShared
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {isShared ? 'Shared' : 'Personal'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 break-all">
                      {machine.host}:{machine.port}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => onOpen(machine)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition shadow-sm hover:shadow"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => {
                      // Open direct VNC connection without password in URL
                      const url = `${window.location.protocol}//${window.location.hostname}:6080/vnc.html?host=${encodeURIComponent(machine.host)}&port=${machine.port}&autoconnect=true&resize=scale&reconnect=true&compression=0&quality=6&show_dot=true`;
                      window.open(url, '_blank');
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition shadow-sm hover:shadow"
                    title="Open in new tab"
                  >
                    ↗ New Tab
                  </button>
                  {canEditThis && (
                    <>
                      <button
                        onClick={() => onEdit(machine)}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded-md text-sm font-medium transition shadow-sm hover:shadow"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(machine)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition shadow-sm hover:shadow"
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

