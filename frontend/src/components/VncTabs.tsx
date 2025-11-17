import { VncMachine } from '../types';
import { VncTab } from './VncTab';

interface VncTabsProps {
  sessions: Array<{ id: string; machine: VncMachine }>;
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCloseSession: (id: string) => void;
}

export const VncTabs: React.FC<VncTabsProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onCloseSession,
}) => {
  if (sessions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-gray-500 text-lg">No VNC sessions open</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Tab bar */}
      <div className="bg-gray-200 border-b border-gray-300 flex overflow-x-auto flex-shrink-0">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`flex items-center px-4 py-2 border-r border-gray-300 cursor-pointer transition ${
              activeSessionId === session.id
                ? 'bg-white border-b-2 border-b-blue-500'
                : 'bg-gray-100 hover:bg-gray-50'
            }`}
            onClick={() => onSelectSession(session.id)}
          >
            <span className="text-sm font-medium mr-2 whitespace-nowrap">
              {session.machine.name}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseSession(session.id);
              }}
              className="text-gray-500 hover:text-red-600 transition ml-1"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Active tab content */}
      <div className="flex-1 relative min-h-0">
        {sessions.map((session) => (
          <VncTab
            key={session.id}
            machine={session.machine}
            isActive={activeSessionId === session.id}
            onSelect={() => onSelectSession(session.id)}
            onClose={() => onCloseSession(session.id)}
          />
        ))}
      </div>
    </div>
  );
};

