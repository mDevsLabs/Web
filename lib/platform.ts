import { useEffect, useState } from "react";

// Le preload Electron (apps/desktop/src/preload.ts) et le bridge Capacitor
// exposent des objets globaux ; on les type ici pour le web.
declare global {
  interface Window {
    Capacitor?: {
      getPlatform?: () => string;
      isNativePlatform?: () => boolean;
    };
    maiDesktop?: {
      isElectron?: boolean;
      platform?: string;
      version?: string;
    };
  }
}

export type PlatformKind = "web" | "electron" | "capacitor";

export function detectPlatform(): PlatformKind {
  if (typeof window === "undefined") {
    return "web";
  }
  if (window.maiDesktop?.isElectron) {
    return "electron";
  }
  const capacitor = window.Capacitor;
  if (capacitor) {
    const isNative =
      typeof capacitor.isNativePlatform === "function"
        ? capacitor.isNativePlatform()
        : false;
    if (isNative) {
      return "capacitor";
    }
  }
  return "web";
}

export function getDesktopInfo(): { platform?: string; version?: string } {
  if (typeof window === "undefined" || !window.maiDesktop?.isElectron) {
    return {};
  }
  return {
    platform: window.maiDesktop.platform,
    version: window.maiDesktop.version,
  };
}

export function platformLabel(platform: PlatformKind): string {
  switch (platform) {
    case "electron":
      return "Application de bureau";
    case "capacitor":
      return "Application mobile";
    default:
      return "Application web";
  }
}

export type PlatformInfo = {
  platform: PlatformKind;
  isElectron: boolean;
  isCapacitor: boolean;
  desktopPlatform?: string;
  desktopVersion?: string;
  label: string;
};

// Initialisé à "web" pour éviter tout mismatch d'hydratation, puis affiné
// côté client après le mount.
export function usePlatform(): PlatformInfo {
  const [platform, setPlatform] = useState<PlatformKind>("web");
  const [desktopPlatform, setDesktopPlatform] = useState<string>();
  const [desktopVersion, setDesktopVersion] = useState<string>();

  useEffect(() => {
    setPlatform(detectPlatform());
    const info = getDesktopInfo();
    setDesktopPlatform(info.platform);
    setDesktopVersion(info.version);
  }, []);

  return {
    desktopPlatform,
    desktopVersion,
    isCapacitor: platform === "capacitor",
    isElectron: platform === "electron",
    label: platformLabel(platform),
    platform,
  };
}
