/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — OFFLINE BANNER (src/components/common/OfflineBanner.tsx)
 * Bannière d'état réseau non intrusive pour Web & Mobile (Capacitor)
 * ============================================================================
 */

import React from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export const OfflineBanner: React.FC = () => {
  const { isOnline, wasOffline } = useNetworkStatus();

  if (isOnline && !wasOffline) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] sm:w-auto animate-fadeIn select-none pointer-events-auto">
      {!isOnline ? (
        <div className="px-4 py-2.5 rounded-2xl bg-zinc-950/95 border border-amber-500/40 text-amber-200 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span className="font-medium">
              Mode hors-ligne • Consultation du cache local
            </span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="py-1 px-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[11px] flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Réessayer</span>
          </button>
        </div>
      ) : (
        <div className="px-4 py-2.5 rounded-2xl bg-emerald-950/95 border border-emerald-500/40 text-emerald-200 shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs">
          <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">
            Connexion rétablie • Flux synchronisé !
          </span>
        </div>
      )}
    </div>
  );
};
