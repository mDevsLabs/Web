"use client";

import { useCallback, useEffect, useState } from "react";

export interface MaiDesktopBridge {
  getCoderStatus?: () => Promise<{
    installed?: boolean;
    running?: boolean;
    activeWorkspace?: string | null;
  }>;
  hasCoder?: boolean;
  isElectron?: boolean;
  openCli?: () => Promise<{ success: boolean; error?: string }>;
  openCoder?: (opts?: {
    workspacePath?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  platform?: string;
  version?: string;
}

declare global {
  interface Window {
    maiDesktop?: MaiDesktopBridge;
    maiShell?: unknown;
  }
}

/**
 * Hook détectant si l'application s'exécute dans l'application de bureau native mAI Desktop (Electron).
 */
export function useIsDesktopApp(): {
  isDesktop: boolean;
  isChecking: boolean;
  platform?: string;
  version?: string;
  hasCoder: boolean;
  openCoder: (opts?: {
    workspacePath?: string;
  }) => Promise<{ success: boolean; error?: string }>;
} {
  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [platform, setPlatform] = useState<string | undefined>(undefined);
  const [version, setVersion] = useState<string | undefined>(undefined);
  const [hasCoder, setHasCoder] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    if (typeof window !== "undefined") {
      const desktop = window.maiDesktop;
      const shell = window.maiShell;
      const detected = Boolean(desktop?.isElectron || shell);
      setIsDesktop(detected);
      setPlatform(desktop?.platform);
      setVersion(desktop?.version);
      setHasCoder(Boolean(desktop?.hasCoder || shell));
      if (desktop?.getCoderStatus) {
        void desktop
          .getCoderStatus()
          .then((status) => {
            if (active && typeof status.installed === "boolean")
              setHasCoder(status.installed);
          })
          .catch(() => {});
      }
      setIsChecking(false);
    }
    return () => {
      active = false;
    };
  }, []);

  const openCoder = useCallback(async (opts?: { workspacePath?: string }) => {
    try {
      if (typeof window !== "undefined" && window.maiDesktop?.openCoder) {
        return await window.maiDesktop.openCoder(opts);
      }
      return {
        error: "Environnement de bureau non disponible",
        success: false,
      };
    } catch {
      return {
        error:
          "Le lancement de Coder a échoué. Réessayez depuis l’application de bureau.",
        success: false,
      };
    }
  }, []);

  return {
    hasCoder,
    isChecking,
    isDesktop,
    openCoder,
    platform,
    version,
  };
}
