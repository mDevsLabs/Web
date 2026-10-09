import { RefreshCwIcon as RefreshCw } from "@mdevs/icons";
import { useEffect, useState } from "react";
import { haptics } from "@/lib/vibe/services/haptics";
import { applyUpdate, onUpdateAvailable } from "@/lib/vibe/services/pwa";

/** Bannière discrète proposée quand une nouvelle version du service worker est prête. */
export function PWAUpdatePrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => onUpdateAvailable(() => setVisible(true)), []);

  if (!visible) return null;

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] sm:bottom-6 z-[95] flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-zinc-950/95 border border-zinc-700 shadow-2xl backdrop-blur-md animate-fadeIn">
      <span className="text-[11px] text-zinc-300 font-medium whitespace-nowrap">
        Nouvelle version disponible
      </span>
      <button
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-black text-[11px] font-bold active:scale-95 transition-all shrink-0"
        onClick={() => {
          haptics.success();
          applyUpdate();
        }}
        type="button"
      >
        <RefreshCw className="w-3 h-3" />
        Recharger
      </button>
    </div>
  );
}
