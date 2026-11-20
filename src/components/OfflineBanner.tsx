import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-1/2 z-40 -translate-x-1/2 md:bottom-5 md:left-6 md:translate-x-0 flex items-center gap-2 rounded-xl border border-[#D4AF37]/30 bg-[#240B12]/95 px-3.5 py-2 text-xs font-medium text-[#E5C158] shadow-xl backdrop-blur-md"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="whitespace-nowrap">Offline mode · Drafting locally</span>
    </div>
  );
};
