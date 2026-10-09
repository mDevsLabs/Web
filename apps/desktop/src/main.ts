import { app, BrowserWindow, Menu, shell, dialog, nativeImage, ipcMain } from "electron";
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { openCliWindow } from "./cli-window";

const APP_URL = "https://mai-officiel.vercel.app";
const APP_TITLE = "mAI";

// Empêche plusieurs instances
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let coderWindow: BrowserWindow | null = null;

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

  mainWindow.loadURL(launchUrl).catch((err) => {
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
      const appHost = new URL(APP_URL).host;
      // Autorise la navigation interne au domaine mai-officiel.vercel.app et mai-officiel.* si besoin
      const isInternal =
        parsed.host === appHost ||
        parsed.host.endsWith("mai-officiel.vercel.app") ||
        (parsed.protocol === "https:" && parsed.hostname === "mai-officiel.vercel.app");
      if (isInternal) return false; // laisse Electron naviguer
      shell.openExternal(url);
      return true;
    } catch {
      shell.openExternal(url);
      return true;
    }
  };

  // Intercepte les tentatives d'ouverture de nouvelle fenêtre (target=_blank, window.open)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    handleExternal(url);
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
            mainWindow?.loadURL(APP_URL);
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

/**
 * Recherche les chemins d'accès au runtime Coder (bundle HTML et preload)
 */
function resolveCoderPaths(): { htmlPath: string | null; preloadPath: string | null } {
  const candidatePreloads = [
    path.resolve(__dirname, "../../coder/electron/preload.cjs"),
    path.resolve(__dirname, "../coder/electron/preload.cjs"),
    path.resolve(process.resourcesPath, "coder/electron/preload.cjs"),
    path.resolve(app.getAppPath(), "../coder/electron/preload.cjs"),
  ];

  const candidateHtmls = [
    path.resolve(__dirname, "../../coder/dist/index.html"),
    path.resolve(__dirname, "../coder/dist/index.html"),
    path.resolve(process.resourcesPath, "coder/dist/index.html"),
    path.resolve(app.getAppPath(), "../coder/dist/index.html"),
  ];

  const preloadPath = candidatePreloads.find((p) => existsSync(p)) ?? null;
  const htmlPath = candidateHtmls.find((p) => existsSync(p)) ?? null;

  return { htmlPath, preloadPath };
}

/**
 * Crée ou met au premier plan la fenêtre dédiée mAI Coder
 */
async function createOrFocusCoderWindow(opts?: { workspacePath?: string }): Promise<{ success: boolean; error?: string }> {
  try {
    if (coderWindow && !coderWindow.isDestroyed()) {
      if (coderWindow.isMinimized()) coderWindow.restore();
      coderWindow.show();
      coderWindow.focus();
      return { success: true };
    }

    const { htmlPath, preloadPath } = resolveCoderPaths();
    const isDev = !app.isPackaged;
    const devUrl = process.env.VITE_DEV_SERVER_URL ?? "http://127.0.0.1:5173";

    const titleBarOptions =
      process.platform === "darwin"
        ? { titleBarStyle: "hiddenInset" as const }
        : process.platform === "win32"
          ? {
              titleBarStyle: "hidden" as const,
              titleBarOverlay: {
                color: "#0a0c10",
                symbolColor: "#c9d1d9",
                height: 36,
              },
            }
          : {};

    coderWindow = new BrowserWindow({
      width: 1440,
      height: 900,
      minWidth: 900,
      minHeight: 600,
      title: "mAI Coder",
      backgroundColor: "#0d0f12",
      icon: getIconPath(),
      show: false,
      ...titleBarOptions,
      webPreferences: {
        preload: preloadPath ?? path.join(__dirname, "preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webviewTag: true,
      },
    });

    // SSO : Synchroniser les cookies de session mAI depuis la fenêtre principale
    if (mainWindow && !mainWindow.isDestroyed()) {
      try {
        const cookies = await mainWindow.webContents.session.cookies.get({});
        for (const cookie of cookies) {
          const scheme = cookie.secure ? "https://" : "http://";
          const domain = cookie.domain?.startsWith(".") ? cookie.domain.slice(1) : (cookie.domain ?? "mai-officiel.vercel.app");
          const url = `${scheme}${domain}${cookie.path ?? "/"}`;
          await coderWindow.webContents.session.cookies.set({
            url,
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path,
            secure: cookie.secure,
            httpOnly: cookie.httpOnly,
            expirationDate: cookie.expirationDate,
          }).catch(() => {
            // Ignorer les erreurs silencieuses sur certains cookies système
          });
        }
      } catch (_err) {
        console.warn("[mAI Desktop] Impossible de synchroniser les cookies de session vers Coder:", _err);
      }
    }

    coderWindow.once("ready-to-show", () => {
      coderWindow?.show();
      coderWindow?.focus();
    });

    coderWindow.on("closed", () => {
      coderWindow = null;
    });

    const params = new URLSearchParams();
    if (opts?.workspacePath) {
      params.set("workspace", opts.workspacePath);
    }
    const query = params.toString() ? `?${params.toString()}` : "";

    if (isDev && process.env.MAI_CODER_DEV === "1") {
      await coderWindow.loadURL(`${devUrl}${query}`);
    } else if (htmlPath) {
      const fileUrl = pathToFileURL(htmlPath).href + query;
      await coderWindow.loadURL(fileUrl);
    } else {
      await coderWindow.loadURL(`${APP_URL}/coder${query}`);
    }

    return { success: true };
  } catch (error) {
    console.error("[mAI Desktop] Erreur lors de l'ouverture de mAI Coder:", error);
    return { success: false, error: String(error) };
  }
}

// Seule la fenêtre web officielle peut demander l'ouverture du terminal local.
ipcMain.handle("desktop:open-cli", async (event) => {
  if (event.sender !== mainWindow?.webContents || event.senderFrame !== event.sender.mainFrame ||
      new URL(event.senderFrame?.url || "about:blank").origin !== new URL(APP_URL).origin) {
    return { success: false, error: "Ouverture du CLI refusée depuis cette fenêtre." };
  }
  return openCliWindow();
});

// Handlers IPC pour la communication entre la fenêtre web et le système desktop
ipcMain.handle("desktop:open-coder", async (_event, opts) => {
  return await createOrFocusCoderWindow(opts);
});

ipcMain.handle("desktop:get-coder-status", () => {
  return {
    running: Boolean(coderWindow && !coderWindow.isDestroyed()),
  };
});

