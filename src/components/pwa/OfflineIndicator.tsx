import React from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { WifiOff, HardDrive } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500 text-black text-xs font-semibold shadow-xl border border-amber-300 animate-in slide-in-from-top-2 duration-300">
      <WifiOff className="w-3.5 h-3.5" />
      <span>Offline Mode — Cached App Shell &amp; Library Active</span>
    </div>
  );
};
