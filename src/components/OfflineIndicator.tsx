'use client';

import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const updateStatus = () => setIsOffline(!navigator.onLine);
    updateStatus();
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      className="fixed bottom-6 left-6 z-50 bg-[#111] border border-white/10 px-4 py-2 rounded-full flex items-center gap-2 shadow-xl animate-in slide-in-from-bottom-4 duration-300"
      role="status"
      aria-live="polite"
    >
      <WifiOff size={14} className="text-gray-500 shrink-0" />
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        Çevrimdışı Mod
      </span>
      <span
        className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse ml-1 shrink-0"
        aria-hidden
      />
    </div>
  );
}
