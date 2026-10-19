import { contextBridge, ipcRenderer } from "electron";
import type { IpcRendererEvent } from "electron";

export interface AboutBridge {
  getInfo: () => Promise<{
    version: string;
    appName: string;
    channel: string;
    electronVersion: string;
    nodeVersion: string;
    chromiumVersion: string;
    platform: string;
    arch: string;
  }>;
  checkUpdates: () => Promise<any>;
  downloadUpdate: (downloadUrl: string, fileName: string) => Promise<any>;
  openInstaller: (filePath: string) => Promise<boolean>;
  openExternal: (url: string) => Promise<void>;
  onDownloadProgress: (
    callback: (data: { percent: number; received: number; total: number }) => void
  ) => () => void;
}

const bridge: AboutBridge = {
  getInfo: () => ipcRenderer.invoke("about:get-info"),
  checkUpdates: () => ipcRenderer.invoke("about:check-updates"),
  downloadUpdate: (downloadUrl: string, fileName: string) =>
    ipcRenderer.invoke("about:download-update", { downloadUrl, fileName }),
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
