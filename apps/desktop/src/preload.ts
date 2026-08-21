import { contextBridge, ipcRenderer } from "electron";

// Expose une API minimale et sécurisée au renderer (si besoin futur)
// L'app charge directement https://mai-officiel.vercel.app donc peu de bridge nécessaire
contextBridge.exposeInMainWorld("maiDesktop", {
  version: process.env.npm_package_version ?? "3.1.0",
  platform: process.platform,
  // Permet au site de détecter qu'il tourne dans Electron si besoin
  isElectron: true,
  // Exemple d'IPC générique (non utilisé pour l'instant)
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    const validChannels = ["update-available", "update-downloaded"];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_event, ...args) => callback(...args));
    }
  },
});
