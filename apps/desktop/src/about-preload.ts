import { contextBridge, ipcRenderer } from "electron";
import type { IpcRendererEvent } from "electron";

export interface AboutInfo {
  version: string;
  appName: string;
  channel: string;
  electronVersion: string;
  nodeVersion: string;
  chromiumVersion: string;
  platform: string;
  arch: string;
}

/** Résultat du contrôle de mise à jour — jamais l'URL du binaire (issue #28). */
export interface AboutUpdateResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion?: string;
  releaseName?: string;
  releaseNotes?: string;
  publishedAt?: string;
  fileName?: string;
  fileSize?: number;
  updateId?: string;
  error?: string;
}

export interface AboutDownloadResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export interface AboutBridge {
  getInfo: () => Promise<AboutInfo>;
  checkUpdates: () => Promise<AboutUpdateResult>;
  /** Le renderer ne transmet qu'un identifiant opaque, jamais une URL. */
  downloadUpdate: (updateId: string) => Promise<AboutDownloadResult>;
  openInstaller: (filePath: string) => Promise<boolean>;
  openExternal: (url: string) => Promise<void>;
  onDownloadProgress: (
    callback: (data: { percent: number; received: number; total: number }) => void
  ) => () => void;
}

const bridge: AboutBridge = {
  getInfo: () => ipcRenderer.invoke("about:get-info"),
  checkUpdates: () => ipcRenderer.invoke("about:check-updates"),
  downloadUpdate: (updateId: string) =>
    ipcRenderer.invoke("about:download-update", { updateId }),
  openInstaller: (filePath: string) => ipcRenderer.invoke("about:open-installer", filePath),
  openExternal: (url: string) => ipcRenderer.invoke("about:open-external", url),
  onDownloadProgress: (callback) => {
    const handler = (
      _event: IpcRendererEvent,
      data: { percent: number; received: number; total: number }
    ) => callback(data);
    ipcRenderer.on("about:download-progress", handler);
    return () => {
      ipcRenderer.removeListener("about:download-progress", handler);
    };
  },
};

contextBridge.exposeInMainWorld("maiAbout", bridge);
