import path from "node:path";
import { app, BrowserWindow, ipcMain, shell } from "electron";
import { checkForUpdates, downloadAndInstallUpdate } from "./updater";

let aboutWindow: BrowserWindow | null = null;
let ipcRegistered = false;

function registerAboutIpc(): void {
  if (ipcRegistered) return;
  ipcRegistered = true;

  ipcMain.handle("about:get-info", () => {
    const channel = (process.env.MAI_DESKTOP_CHANNEL || "").toLowerCase().trim();
    return {
      version: app.getVersion(),
      appName: channel === "beta" ? "mAI (Bêta)" : "mAI",
      channel: channel || "stable",
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node,
      chromiumVersion: process.versions.chrome,
      platform: process.platform,
      arch: process.arch,
    };
  });

  ipcMain.handle("about:check-updates", async () => {
    const channel = (process.env.MAI_DESKTOP_CHANNEL || "").toLowerCase().trim();
    const isBeta = channel === "beta" || app.getVersion().includes("beta") || app.getVersion().includes("pr");
    return checkForUpdates(isBeta);
  });

  ipcMain.handle("about:download-update", async (event, args: { downloadUrl: string; fileName: string }) => {
    return downloadAndInstallUpdate(args.downloadUrl, args.fileName, (percent, received, total) => {
      if (aboutWindow && !aboutWindow.isDestroyed()) {
        aboutWindow.webContents.send("about:download-progress", { percent, received, total });
      }
    });
  });

  ipcMain.handle("about:open-installer", async (_event, filePath: string) => {
    if (filePath) {
      await shell.openPath(filePath);
      return true;
    }
    return false;
  });

  ipcMain.handle("about:open-external", async (_event, url: string) => {
    if (url && (url.startsWith("https://") || url.startsWith("http://"))) {
      await shell.openExternal(url);
    }
  });
}

export function openAboutWindow(): BrowserWindow {
  registerAboutIpc();

  if (aboutWindow && !aboutWindow.isDestroyed()) {
    if (aboutWindow.isMinimized()) aboutWindow.restore();
    aboutWindow.show();
    aboutWindow.focus();
    return aboutWindow;
  }

  aboutWindow = new BrowserWindow({
    width: 440,
    height: 520,
    minWidth: 400,
    minHeight: 480,
    resizable: false,
    minimizable: false,
    maximizable: false,
    title: "À propos de mAI",
    backgroundColor: "#ffffff",
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "about-preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  aboutWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  aboutWindow.webContents.on("will-navigate", (event) => {
    event.preventDefault();
  });

  aboutWindow.once("ready-to-show", () => {
    aboutWindow?.show();
    aboutWindow?.focus();
  });

  aboutWindow.on("closed", () => {
    aboutWindow = null;
  });

  const aboutHtmlPath = path.join(__dirname, "about/index.html");
  void aboutWindow.loadFile(aboutHtmlPath);

  return aboutWindow;
}
