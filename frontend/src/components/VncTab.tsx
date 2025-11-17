import { VncMachine } from '../types';

interface VncTabProps {
  machine: VncMachine;
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
}

export const VncTab: React.FC<VncTabProps> = ({ machine, isActive, onSelect, onClose }) => {
  // Generate noVNC URL
  // The noVNC container should be configured to proxy VNC connections
  // This URL format works with standard noVNC installations
  // In production, you might need to adjust the URL format based on your noVNC setup
  const novncUrl = `http://localhost:6080/vnc.html?host=${encodeURIComponent(machine.host)}&port=${machine.port}&password=${encodeURIComponent(machine.password || '')}&autoconnect=true&resize=scale&reconnect=true`;

  if (!isActive) {
    return null;
  }

  return (
    <div className="flex flex-col h-full w-full">
      <iframe
        src={novncUrl}
        className="w-full h-full border-0"
        title={`VNC: ${machine.name}`}
        allow="clipboard-read; clipboard-write"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
};

