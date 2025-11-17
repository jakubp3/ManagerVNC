import React from 'react';
import { VncMachine } from '../types';

interface VncTabProps {
  machine: VncMachine;
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
}

export const VncTab: React.FC<VncTabProps> = ({ machine, isActive }) => {
  // Generate noVNC URL using the same hostname as the page
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const novncUrl = `${protocol}//${hostname}:6080/vnc.html?host=${encodeURIComponent(machine.host)}&port=${machine.port}&password=${encodeURIComponent(machine.password || '')}&autoconnect=true&resize=scale&reconnect=true`;

  // Always render the iframe but hide it when not active to prevent disconnection
  return (
    <div className={`flex flex-col h-full w-full ${isActive ? '' : 'hidden'}`}>
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

