// Le bureau charge le site officiel à jour et réserve les accès locaux aux ponts IPC.
import { app, BrowserWindow, Menu, shell, dialog, nativeImage, ipcMain } from "electron";
import path from "node:path";
import { openCliWindow } from "./cli-window";
import { launchCoder, resolveCoderExecutable } from "./coder-launcher";

const APP_URL = "https://mai-officiel.vercel.app";
const APP_TITLE = "mAI";

// Empêche plusieurs instances
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

function getIconPath(): string | undefined {
  if (process.platform === "win32") {
    return path.join(__dirname, "../build/icon.ico");
  }
  if (process.platform === "darwin") {
    return path.join(__dirname, "../build/icon.icns");
  }
  return path.join(__dirname, "../build/icon.png");
}

function createWindow(): void {
  const iconPath = getIconPath();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: APP_TITLE,
    backgroundColor: "#0a0a0a",
    icon: iconPath,
    show: false, // on montre après ready-to-show pour éviter flash blanc
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      additionalArguments: [`--mai-version=${app.getVersion()}`],
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  // Affiche quand le contenu est prêt
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  // Charge l'URL officielle (iframe = loadURL en Electron)
  const targetAppArg = process.argv.find((a) => a.startsWith("--app="));
  const targetApp = targetAppArg
    ? targetAppArg.split("=")[1].toLowerCase().trim()
    : (process.env.MAI_APP || "").toLowerCase().trim();
  const launchUrl = targetApp
    ? `${APP_URL}/?app=${encodeURIComponent(targetApp)}`
    : APP_URL;

  mainWindow.loadURL(launchUrl, { extraHeaders: "pragma: no-cache\n" }).catch((err) => {
    console.error("[mAI] loadURL failed:", err);
    dialog.showErrorBox(
      "Erreur de chargement",
      `Impossible de charger ${launchUrl}\n\nVérifiez votre connexion internet.`
    );
  });

  // Gestion des liens externes : ouvrir dans le navigateur système
  const handleExternal = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      const isInternal = parsed.origin === new URL(APP_URL).origin;
      if (isInternal) return false; // laisse Electron naviguer
      if (["https:", "http:", "mailto:"].includes(parsed.protocol)) {
        void shell.openExternal(url).catch(() => {
          dialog.showErrorBox("Lien inaccessible", "Impossible d’ouvrir ce lien dans votre navigateur.");
        });
      }
      return true;
    } catch {
      return true;
    }
  };

  // Intercepte les tentatives d'ouverture de nouvelle fenêtre (target=_blank, window.open)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!handleExternal(url)) {
      void mainWindow?.loadURL(url, { extraHeaders: "pragma: no-cache\n" }).catch(() => {
        dialog.showErrorBox("Page inaccessible", "Impossible de charger cette page. Vérifiez votre connexion puis réessayez.");
      });
    }
    return { action: "deny" };
  });

  // Intercepte la navigation dans la même fenêtre vers un domaine externe
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (handleExternal(url)) {
      event.preventDefault();
    }
  });

  // Gestion des erreurs de chargement (offline)
  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    // Ignore les erreurs d'abandon (ex: navigation interrompue)
    if (errorCode === -3) return; // ERR_ABORTED
    console.error(`[mAI] did-fail-load ${errorCode} ${errorDescription} @ ${validatedURL}`);
    if (mainWindow && validatedURL === APP_URL) {
      // On pourrait afficher une page offline, mais on garde simple : dialogue + retry
      dialog
        .showMessageBox(mainWindow, {
          type: "error",
          title: "Hors ligne",
          message: "Connexion impossible",
          detail: `Impossible de joindre ${APP_URL} (${errorDescription}). Vérifiez votre connexion puis réessayez.`,
          buttons: ["Réessayer", "Quitter"],
          defaultId: 0,
        })
        .then(({ response }) => {
          if (response === 0) {
            mainWindow?.loadURL(launchUrl, { extraHeaders: "pragma: no-cache\n" });
          } else {
            app.quit();
          }
        });
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  createMenu();
}

function createMenu(): void {
  const isMac = process.platform === "darwin";
  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: APP_TITLE,
            submenu: [
              { role: "about" as const },
              { type: "separator" as const },
              { role: "services" as const },
              { type: "separator" as const },
              { role: "hide" as const },
              { role: "hideOthers" as const },
              { role: "unhide" as const },
              { type: "separator" as const },
              { role: "quit" as const },
            ],
          },
        ]
      : []),
    {
      label: "Fichier",
      submenu: [isMac ? { role: "close" as const } : { role: "quit" as const }],
    },
    {
      label: "Édition",
      submenu: [
        { role: "undo" as const },
        { role: "redo" as const },
        { type: "separator" as const },
        { role: "cut" as const },
        { role: "copy" as const },
        { role: "paste" as const },
        { role: "selectAll" as const },
      ],
    },
    {
      label: "Affichage",
      submenu: [
        { role: "reload" as const },
        { role: "forceReload" as const },
        { role: "toggleDevTools" as const },
        { type: "separator" as const },
        { role: "resetZoom" as const },
        { role: "zoomIn" as const },
        { role: "zoomOut" as const },
        { type: "separator" as const },
        { role: "togglefullscreen" as const },
      ],
    },
    {
      label: "Fenêtre",
      submenu: [
        { role: "minimize" as const },
        { role: "zoom" as const },
        ...(isMac
          ? [
              { type: "separator" as const },
              { role: "front" as const },
              { type: "separator" as const },
              { role: "window" as const },
            ]
          : [{ role: "close" as const }]),
      ],
    },
    {
      role: "help",
      submenu: [
        {
          label: `Ouvrir ${APP_URL}`,
          click: async () => {
            await shell.openExternal(APP_URL);
          },
        },
        {
          label: "À propos de mAI",
          click: async () => {
            await shell.openExternal(APP_URL);
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Seconde instance : focus la fenêtre existante
app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  // Sur macOS, icône dock (si png disponible)
  if (process.platform === "darwin") {
    try {
      const icon = nativeImage.createFromPath(path.join(__dirname, "../build/icon.png"));
      if (!icon.isEmpty()) app.dock?.setIcon(icon);
    } catch {
      // ignore
    }
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// Sécurité : désactive la navigation vers file:// etc
app.on("web-contents-created", (_event, contents) => {
  contents.on("will-attach-webview", (event) => {
    event.preventDefault();
  });
});

// Les fonctions locales sont réservées au frame principal du site officiel.
function trustedSender(event: Electron.IpcMainInvokeEvent): boolean {
  try {
    return event.sender === mainWindow?.webContents &&
      event.senderFrame === event.sender.mainFrame &&
      new URL(event.senderFrame?.url || "about:blank").origin === new URL(APP_URL).origin;
  } catch {
    return false;
  }
}

ipcMain.handle("desktop:open-cli", async (event) => {
  if (!trustedSender(event)) return { success: false, error: "Ouverture du CLI refusée depuis cette fenêtre." };
  return openCliWindow();
});

ipcMain.handle("desktop:open-coder", async (event, opts) => {
  if (!trustedSender(event)) return { success: false, error: "Ouverture de Coder refusée depuis cette fenêtre." };
  return launchCoder(opts);
});

ipcMain.handle("desktop:get-coder-status", (event) => {
  if (!trustedSender(event)) return { installed: false };
  return { installed: Boolean(resolveCoderExecutable()) };
});
