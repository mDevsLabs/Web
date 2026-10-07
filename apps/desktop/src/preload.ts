import { contextBridge, ipcRenderer } from "electron";

// Expose une API minimale et sécurisée au renderer mAI Web
contextBridge.exposeInMainWorld("maiDesktop", {
  getCoderStatus: () => ipcRenderer.invoke("desktop:get-coder-status"),
  openCli: () => ipcRenderer.invoke("desktop:open-cli"),
  hasCoder: true,
  // Permet au site de détecter qu'il tourne dans Electron
  isElectron: true,
  // Gestion d'événements IPC autorisés
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    const validChannels = [
      "update-available",
      "update-downloaded",
      "coder-status",
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_event, ...args) => callback(...args));
    }
  },
  openCoder: (opts?: { workspacePath?: string }) =>
    ipcRenderer.invoke("desktop:open-coder", opts),
  platform: process.platform,
  targetApp: (() => {
    const arg = process.argv.find((a) => a.startsWith("--app="));
    if (arg) return arg.split("=")[1].toLowerCase().trim();
    return process.env.MAI_APP?.toLowerCase().trim() || null;
  })(),
  version: process.env.npm_package_version ?? "3.1.0",
});
