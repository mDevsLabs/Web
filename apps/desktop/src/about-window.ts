import path from "node:path";
import {
  app,
  BrowserWindow,
  type IpcMainInvokeEvent,
  ipcMain,
  shell,
} from "electron";
import {
  checkForUpdates,
  downloadAndInstallUpdate,
  getPendingUpdate,
  isManagedInstallerPath,
} from "./updater";

let aboutWindow: BrowserWindow | null = null;
let ipcRegistered = false;

/**
 * Vrai si l'émetteur IPC est bien la fenêtre À propos, sur son document
 * principal (issue #28). Une frame tierce ou un expéditeur quelconque ne doit
 * jamais pouvoir piloter un téléchargement ni ouvrir un fichier.
 */
function isTrustedAboutSender(event: IpcMainInvokeEvent): boolean {
  if (!aboutWindow || aboutWindow.isDestroyed()) return false;
  return event.senderFrame === aboutWindow.webContents.mainFrame;
}

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
    return checkForUpdates();
  });

  // Le renderer ne transmet qu'un identifiant opaque : l'URL, le nom de
  // fichier et l'empreinte sont résolus côté Main (issue #28).
  ipcMain.handle(
    "about:download-update",
    async (event, args: { updateId?: string }) => {
      if (!isTrustedAboutSender(event)) {
        return { error: "Requête refusée.", success: false };
      }
      const updateId = typeof args?.updateId === "string" ? args.updateId : "";
      const pending = getPendingUpdate(updateId);
      if (!pending) {
        return {
          error: "Mise à jour inconnue : relancez la vérification.",
          success: false,
        };
      }
      return downloadAndInstallUpdate(pending, (percent, received, total) => {
        if (aboutWindow && !aboutWindow.isDestroyed()) {
          aboutWindow.webContents.send("about:download-progress", {
            percent,
            received,
            total,
          });
        }
      });
    }
  );

  // Seul l'installeur téléchargé et vérifié par le Main peut être ouvert.
  ipcMain.handle("about:open-installer", async (event, filePath: string) => {
    if (!isTrustedAboutSender(event)) return false;
    if (typeof filePath !== "string" || !isManagedInstallerPath(filePath)) {
      return false;
    }
    const openError = await shell.openPath(filePath);
    return !openError;
  });

  ipcMain.handle("about:open-external", async (event, url: string) => {
    if (!isTrustedAboutSender(event)) return;
    if (typeof url === "string" && url.startsWith("https://")) {
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
