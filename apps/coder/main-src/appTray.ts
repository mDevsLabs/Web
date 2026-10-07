import { BrowserWindow, Menu, Tray } from "electron";
import {
  createAppWindow,
  focusAppWindow,
  getAppWindowSurfaceForWebContents,
} from "./appWindow.js";
import { checkForUpdates } from "./autoUpdate.js";

let tray: Tray | null = null;

function getMainWindow(): BrowserWindow | null {
  const windows = BrowserWindow.getAllWindows().filter(
    (win) => !win.isDestroyed()
  );
  const agentWindow = windows.find(
    (win) => getAppWindowSurfaceForWebContents(win.webContents) === "agent"
  );
  if (agentWindow) {
    return agentWindow;
  }
  return (
    windows.find(
      (win) => getAppWindowSurfaceForWebContents(win.webContents) === "editor"
    ) ?? null
  );
}

function ensureMainWindow(): BrowserWindow {
  const existing = getMainWindow();
  if (existing) {
    return existing;
  }
  return createAppWindow({ surface: "agent" });
}

function showMainWindow(): BrowserWindow {
  const win = ensureMainWindow();
  focusAppWindow(win);
  return win;
}

function sendTrayCommand(command: "newThread" | "openSettings"): void {
  const win = showMainWindow();
  win.webContents.once("did-finish-load", () => {
    if (!win.isDestroyed()) {
      win.webContents.send("mai-coder:trayCommand", { command });
    }
  });
  if (!win.webContents.isLoading()) {
    win.webContents.send("mai-coder:trayCommand", { command });
  }
}

export function initAppTray(
  iconPath: string | undefined,
  quitApp: () => void
): void {
  if (tray || process.platform === "darwin") {
    return;
  }
  if (!iconPath) {
    return;
  }
  tray = new Tray(iconPath);
  tray.setToolTip("mAI Coder");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        click: () => showMainWindow(),
        label: "Ouvrir mAI Coder",
      },
      {
        click: () => sendTrayCommand("newThread"),
        label: "Nouvelle conversation",
      },
      {
        click: () => sendTrayCommand("openSettings"),
        label: "Ouvrir les paramètres",
      },
      {
        click: () => {
          showMainWindow();
          void checkForUpdates();
        },
        label: "Vérifier les mises à jour",
      },
      { type: "separator" },
      {
        click: () => quitApp(),
        label: "Quitter",
      },
    ])
  );
  tray.on("click", () => showMainWindow());
}

export function disposeAppTray(): void {
  tray?.destroy();
  tray = null;
}
