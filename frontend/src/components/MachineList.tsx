import { VncMachine } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface MachineListProps {
  machines: VncMachine[];
  onOpen: (machine: VncMachine) => void;
  onEdit: (machine: VncMachine) => void;
  onDelete: (machine: VncMachine) => void;
  onToggleFavorite?: (machine: VncMachine) => void;
  title: string;
  canEdit: boolean;
}

export const MachineList: React.FC<MachineListProps> = ({
  machines,
  onOpen,
  onEdit,
  onDelete,
  onToggleFavorite,
  title,
  canEdit,
}) => {
  const { user } = useAuth();

  if (machines.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{title}</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">No sessions available</p>
      </div>
    );
  }

  return (
    <div className={title ? "bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4" : ""}>
      {title && <h3 className="text-base font-semibold mb-3 text-gray-800 dark:text-gray-200">{title}</h3>}
      <div className="space-y-2">
        {machines.map((machine) => {
          const isOwner = machine.ownerId === user?.id;
          const isShared = machine.ownerId === null;
          const canEditThis = canEdit && (isOwner || (isShared && user?.role === 'ADMIN'));

          return (
            <div
              key={machine.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md transition bg-gray-50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {onToggleFavorite && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(machine);
                          }}
                          className={`text-sm transition ${
                            machine.isFavorite
                              ? 'text-yellow-500 hover:text-yellow-600 dark:text-yellow-400'
                              : 'text-gray-400 dark:text-gray-500 hover:text-yellow-500 dark:hover:text-yellow-400'
                          }`}
                          title={machine.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          {machine.isFavorite ? '★' : '☆'}
                        </button>
                      )}
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 break-words">{machine.name}</h4>
                      {machine.groups && machine.groups.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {machine.groups.map((group) => (
                            <span
                              key={group}
                              className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 flex-shrink-0 font-medium"
                            >
                              {group}
                            </span>
                          ))}
                        </div>
                      )}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${
                          isShared
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                        }`}
                      >
                        {isShared ? 'Shared' : 'Personal'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 break-all">
                      {machine.host}:{machine.port}
                    </p>
                    {machine.lastAccessed && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Last accessed: {new Date(machine.lastAccessed).toLocaleString()}
                      </p>
                    )}
                    {machine.notes && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 italic line-clamp-2">
                        {machine.notes}
                      </p>
                    )}
                    {machine.tags && machine.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {machine.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
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
                      // Open direct VNC connection to the VNC server IP (not through manager)
                      // Assumes noVNC is running on the VNC server at port 6080
                      const url = `${window.location.protocol}//${machine.host}:6080/vnc.html?host=${encodeURIComponent(machine.host)}&port=${machine.port}&autoconnect=true&resize=scale&reconnect=true&compression=0&quality=6&show_dot=true`;
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

