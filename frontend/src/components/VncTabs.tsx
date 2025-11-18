import { useState, useEffect, useRef } from 'react';
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      // Request fullscreen on the VNC tabs container
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (sessions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-gray-500 text-lg">No VNC sessions open</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`flex-1 flex flex-col min-h-0 ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Tab bar - always visible, even in fullscreen */}
      <div className="bg-gray-200 border-b border-gray-300 flex overflow-x-auto flex-shrink-0 items-center h-12">
        <div className="flex flex-1 overflow-x-auto h-full">
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
                onClick={() => onSelectSession(session.id)}
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
                  onCloseSession(session.id);
                }}
                className="px-2 py-2 text-gray-500 hover:text-red-600 transition h-full flex items-center"
                title="Close session"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        {/* Fullscreen button */}
        <button
          onClick={toggleFullscreen}
          className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white transition flex-shrink-0 h-full flex items-center"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? '⤓' : '⤢'}
        </button>
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

