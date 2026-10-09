import { DownloadIcon as Download, ShareIcon as Share } from "@mdevs/icons";
import { useEffect, useState } from "react";
import { haptics } from "@/lib/vibe/services/haptics";
import {
  canInstall,
  isIOS,
  isStandalone,
  onInstallAvailable,
  promptInstall,
} from "@/lib/vibe/services/pwa";

/** Aide à l'installation de la PWA (Android/desktop : bouton natif ; iOS : instructions). */
export function InstallAppHint() {
  const [installReady, setInstallReady] = useState(() => canInstall());

  useEffect(() => onInstallAvailable(() => setInstallReady(canInstall())), []);

  if (isStandalone()) {
    return (
      <p className="text-emerald-400 text-[11px] pt-3 border-t border-zinc-900">
        Application installée — vous profitez de l'expérience plein écran.
      </p>
    );
  }

  if (installReady) {
    return (
      <div className="pt-3 border-t border-zinc-900 flex items-center justify-between gap-3">
        <div>
          <div className="font-semibold text-white text-xs">
            Installer l'application
          </div>
          <p className="text-zinc-500 text-[11px] mt-0.5">
            Accès rapide depuis l'écran d'accueil, plein écran et démarrage
            instantané.
          </p>
        </div>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-black text-xs font-bold active:scale-95 transition-all shrink-0"
          onClick={async () => {
            const accepted = await promptInstall();
            if (accepted) haptics.success();
          }}
          type="button"
        >
          <Download className="w-3.5 h-3.5" />
          Installer
        </button>
      </div>
    );
  }

  if (isIOS()) {
    return (
      <p className="text-zinc-500 text-[11px] pt-3 border-t border-zinc-900 flex items-center gap-1.5 flex-wrap">
        <Share className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
        Pour installer l'app sur iPhone/iPad : Partager → « Sur l'écran
        d'accueil ».
      </p>
    );
  }

  return null;
}
