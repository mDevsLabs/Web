// Le bureau charge le site officiel à jour et réserve les accès locaux aux ponts IPC.
import { app, BrowserWindow, Menu, shell, dialog, nativeImage, ipcMain } from "electron";
import fs from "node:fs";
import path from "node:path";
import { openCliWindow } from "./cli-window";
import {
  launchCoder,
  readEmbeddedCoderVersion,
  resolveCoderExecutable,
} from "./coder-launcher";
import { openAboutWindow } from "./about-window";

// L'URL est résolue au démarrage, jamais figée : voir `resolveAppUrl`.
const DEFAULT_APP_URL = process.env.MAI_DESKTOP_APP_URL || "https://mai-officiel.vercel.app";
const DESKTOP_CHANNEL = (process.env.MAI_DESKTOP_CHANNEL || "").toLowerCase().trim();
const APP_TITLE = DESKTOP_CHANNEL === "beta" ? "mAI (Bêta)" : "mAI";
const PREFERENCES_FILE = "preferences.json";

// Isoler le dossier de profil et de cache disque entre la version portable et la version installée
// pour éviter le blocage « Unable to move the cache: Accès refusé (0x5) ».
const isPortable = Boolean(process.env.PORTABLE_EXECUTABLE_DIR);
if (isPortable) {
  const portableData = path.join(process.env.PORTABLE_EXECUTABLE_DIR!, "data");
  app.setPath("userData", portableData);
  app.commandLine.appendSwitch("disk-cache-dir", path.join(portableData, "Cache"));
} else {
  const baseUserData = app.getPath("userData");
  app.commandLine.appendSwitch("disk-cache-dir", path.join(baseUserData, "Cache"));
}
// Neutraliser l'erreur cosmétique du client Crashpad s'il n'a pas de serveur
app.commandLine.appendSwitch("disable-crashpad");

let APP_URL = DEFAULT_APP_URL;

// Empêche plusieurs instances
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let currentWebBuildId: string | null = null;
let pendingWebBuildId: string | null = null;
let reloadTargetBuildId: string | null = null;
let webReloadInProgress = false;
let reloadSafetyCheckInProgress = false;
let versionCheckInProgress = false;
let lastUserActivityAt = Date.now();
let safePageSince: number | null = null;
let pendingUpdateTimer: NodeJS.Timeout | null = null;

const WEB_VERSION_POLL_INTERVAL_MS = 60_000;
const PENDING_UPDATE_RETRY_INTERVAL_MS = 10_000;
const USER_IDLE_BEFORE_RELOAD_MS = 30_000;
const SAFE_PAGE_GRACE_MS = 20_000;

async function readLastAppUrl(): Promise<string | null> {
  try {
    const preferencesPath = path.join(app.getPath("userData"), PREFERENCES_FILE);
    const raw = fs.readFileSync(preferencesPath, "utf8");
    const parsed = JSON.parse(raw) as { appUrl?: unknown };
    const value = typeof parsed?.appUrl === "string" ? parsed.appUrl.trim() : "";
    if (!value) return null;
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function persistAppUrl(url: string): void {
  try {
    const preferencesPath = path.join(app.getPath("userData"), PREFERENCES_FILE);
    fs.writeFileSync(preferencesPath, JSON.stringify({ appUrl: url }, null, 2), "utf8");
  } catch (error) {
    console.error("[mAI] persistAppUrl failed:", error);
  }
}

function isValidAppUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function askAppUrl(prefill: string): Promise<string | null> {
  // Electron n'a pas de dialogue de saisie natif : on ouvre une petite fenêtre
  // autonome et on récupère la valeur via executeJavaScript (Promise).
  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<style>
  :root { color-scheme: dark; }
  body { margin:0; font-family: system-ui, -apple-system, sans-serif; background:#0d0d10; color:#e4e4e7; display:flex; align-items:center; justify-content:center; height:100vh; }
  .card { background:#17171a; border:1px solid #2a2a30; border-radius:14px; padding:18px; width:360px; max-width:92vw; }
  h1 { font-size:15px; margin:0 0 6px; font-weight:600; }
  p { margin:0 0 12px; font-size:12px; color:#a1a1aa; line-height:1.5; }
  input { width:100%; box-sizing:border-box; padding:9px 11px; border-radius:9px; border:1px solid #2a2a30; background:#0c0c0e; color:#e4e4e7; font-size:13px; }
  input:focus { outline:2px solid #7f92de; outline-offset:1px; }
  .actions { display:flex; gap:8px; justify-content:flex-end; margin-top:12px; }
  button { padding:7px 14px; border-radius:9px; border:1px solid #2a2a30; background:#0c0c0e; color:#e4e4e7; cursor:pointer; font-size:13px; }
  button.primary { background:#7f92de; color:#0c0c0e; border-color:#7f92de; }
</style>
</head>
<body>
  <div class="card">
    <h1>Adresse du serveur mAI</h1>
    <p>Saisissez l'URL du serveur à charger au démarrage. La valeur précédente est préremplie.</p>
    <input id="u" type="url" value="${prefill.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;")}">
    <div class="actions">
      <button id="cancel">Annuler</button>
      <button class="primary" id="ok">Charger</button>
    </div>
  </div>
  <script>
    const u = document.getElementById("u");
    if (u) { u.focus(); u.select(); }
  </script>
</body>
</html>`;
  const window = new BrowserWindow({
    width: 420,
    height: 210,
    resizable: false,
    minimizable: false,
    maximizable: false,
    closable: true,
    alwaysOnTop: true,
    title: "mAI — serveur",
    backgroundColor: "#0d0d10",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  const tempHtmlPath = path.join(app.getPath("temp"), `mai-ask-url-${Date.now()}.html`);
  fs.writeFileSync(tempHtmlPath, html, "utf8");
  try {
    await window.loadFile(tempHtmlPath);
  } finally {
    try { fs.unlinkSync(tempHtmlPath); } catch {}
  }

  try {
    const value = await window.webContents.executeJavaScript(
      `new Promise((resolve) => {
        const u=document.getElementById("u");
        const ok=document.getElementById("ok");
        const cancel=document.getElementById("cancel");
        const done=(v)=>resolve(v);
        if (ok) ok.onclick=()=>done(u.value);
        if (cancel) cancel.onclick=()=>done(null);
        if (u) {
          u.addEventListener("keydown",(e)=>{
            if (e.key==="Enter") done(u.value);
            if (e.key==="Escape") done(null);
          });
          u.focus(); u.select();
        }
      })`,
    );
    try { if (!window.isDestroyed()) window.close(); } catch {}
    return typeof value === "string" ? value : null;
  } catch {
    try { if (!window.isDestroyed()) window.close(); } catch {}
    return null;
  }
}

async function resolveAppUrl(): Promise<string> {
  const last = await readLastAppUrl();
  if (last && isValidAppUrl(last)) {
    return last;
  }
  const prefill = last || DEFAULT_APP_URL;
  const chosen = await askAppUrl(prefill);
  const candidate = chosen && chosen.trim() ? chosen.trim() : prefill;
  if (isValidAppUrl(candidate)) {
    persistAppUrl(candidate);
    return candidate;
  }
  persistAppUrl(prefill);
  return prefill;
}

async function readWebBuildId(): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${APP_URL}/api/app-version`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) return null;

    const data: unknown = await response.json();
    if (!data || typeof data !== "object" || !("buildId" in data)) {
      return null;
    }
    const buildId = (data as { buildId?: unknown }).buildId;
    return typeof buildId === "string" && buildId.trim() ? buildId : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function isWebPageSafeToReload(window: BrowserWindow): Promise<boolean> {
  if (
    window.isDestroyed() ||
    window.webContents.isDestroyed() ||
    !window.isFocused() ||
    window.webContents.isLoadingMainFrame()
  ) {
    return false;
  }

  try {
    return await window.webContents.executeJavaScript(`
      (() => {
        if (document.visibilityState !== "visible") return false;

        const blocked = [...document.querySelectorAll("[data-app-update-blocked]")]
          .some((element) => {
            const value = element.getAttribute("data-app-update-blocked");
            return value !== null && !["false", "0", ""].includes(value.toLowerCase());
          });
        if (blocked) return false;

        const hasUnsavedFormValue = [...document.querySelectorAll(
          'input:not([type="file"]):not([type="hidden"]), textarea, select'
        )].some((field) => {
          if (field instanceof HTMLInputElement) {
            if (field.readOnly || field.disabled) return false;
            if (["checkbox", "radio"].includes(field.type)) {
              return field.checked !== field.defaultChecked;
            }
            return field.value !== field.defaultValue;
          }
          if (field instanceof HTMLTextAreaElement) {
            return !field.readOnly && !field.disabled && field.value !== field.defaultValue;
          }
          if (field instanceof HTMLSelectElement) {
            return !field.disabled && [...field.options].some(
              (option) => option.selected !== option.defaultSelected
            );
          }
          return false;
        });
        if (hasUnsavedFormValue) return false;

        if (document.querySelector(
          '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], dialog[open]'
        )) return false;

        const active = document.activeElement;
        if (active instanceof HTMLElement) {
          const editable = active.matches(
            'input:not([type="file"]):not([type="hidden"]), textarea, select'
          ) || active.isContentEditable;
          if (editable) {
            const isEmptyComposer = active instanceof HTMLTextAreaElement &&
              active.closest("[data-app-update-blocked]")?.getAttribute("data-app-update-blocked") === "false" &&
              !active.value.trim();
            if (!isEmptyComposer) return false;
          }
        }

        return true;
      })()
    `);
  } catch {
    return false;
  }
}

function stopPendingUpdateChecks(): void {
  if (pendingUpdateTimer) {
    clearInterval(pendingUpdateTimer);
    pendingUpdateTimer = null;
  }
}

function schedulePendingUpdateChecks(): void {
  if (pendingUpdateTimer) return;
  pendingUpdateTimer = setInterval(() => {
    void tryReloadForPendingWebUpdate();
  }, PENDING_UPDATE_RETRY_INTERVAL_MS);
  pendingUpdateTimer.unref();
}

async function tryReloadForPendingWebUpdate(): Promise<void> {
  const window = mainWindow;
  if (
    !window ||
    !pendingWebBuildId ||
    webReloadInProgress ||
    reloadSafetyCheckInProgress
  ) {
    return;
  }

  reloadSafetyCheckInProgress = true;
  try {
    if (!(await isWebPageSafeToReload(window))) {
      safePageSince = null;
      return;
    }

    const now = Date.now();
    safePageSince ??= now;
    if (
      now - lastUserActivityAt < USER_IDLE_BEFORE_RELOAD_MS ||
      now - safePageSince < SAFE_PAGE_GRACE_MS
    ) {
      return;
    }

    reloadTargetBuildId = pendingWebBuildId;
    webReloadInProgress = true;
    window.webContents.reload();
  } finally {
    reloadSafetyCheckInProgress = false;
  }
}

async function checkForWebUpdate(): Promise<void> {
  if (versionCheckInProgress || !mainWindow || mainWindow.isDestroyed()) return;
  versionCheckInProgress = true;

  try {
    const buildId = await readWebBuildId();
    if (!buildId) return;

    if (currentWebBuildId === null) {
      currentWebBuildId = buildId;
      return;
    }

    if (buildId === currentWebBuildId) {
      pendingWebBuildId = null;
      safePageSince = null;
      stopPendingUpdateChecks();
      return;
    }

    pendingWebBuildId = buildId;
    schedulePendingUpdateChecks();
    await tryReloadForPendingWebUpdate();
  } finally {
    versionCheckInProgress = false;
  }
}

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

  mainWindow.webContents.on("did-finish-load", () => {
    if (reloadTargetBuildId) {
      currentWebBuildId = reloadTargetBuildId;
      pendingWebBuildId = null;
      reloadTargetBuildId = null;
      safePageSince = null;
      stopPendingUpdateChecks();
    }
    webReloadInProgress = false;
    void checkForWebUpdate();
  });

  mainWindow.on("focus", () => {
    lastUserActivityAt = Date.now();
    void checkForWebUpdate();
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
  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    if (isMainFrame && webReloadInProgress) {
      webReloadInProgress = false;
      reloadTargetBuildId = null;
    }
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
              {
                label: "À propos de mAI",
                click: () => {
                  openAboutWindow();
                },
              },
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
          click: () => {
            openAboutWindow();
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

app.whenReady().then(async () => {
  try {
    APP_URL = await resolveAppUrl();
  } catch (error) {
    console.error("[mAI] resolveAppUrl failed:", error);
  }
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

  const versionPoll = setInterval(() => {
    void checkForWebUpdate();
  }, WEB_VERSION_POLL_INTERVAL_MS);
  versionPoll.unref();

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
function trustedSender(
  event: Electron.IpcMainEvent | Electron.IpcMainInvokeEvent
): boolean {
  try {
    return event.sender === mainWindow?.webContents &&
      event.senderFrame === event.sender.mainFrame &&
      new URL(event.senderFrame?.url || "about:blank").origin === new URL(APP_URL).origin;
  } catch {
    return false;
  }
}

ipcMain.on("desktop:user-activity", (event) => {
  if (trustedSender(event)) {
    lastUserActivityAt = Date.now();
  }
});

ipcMain.handle("desktop:open-cli", async (event) => {
  if (!trustedSender(event)) return { success: false, error: "Ouverture du CLI refusée depuis cette fenêtre." };
  return openCliWindow();
});

ipcMain.handle("desktop:open-coder", async (event, opts) => {
  if (!trustedSender(event)) return { success: false, error: "Ouverture de Coder refusée depuis cette fenêtre." };
  // Le cookie de session mAI est httpOnly : seul le Main peut le lire. Il est
  // transmis à Coder par l environnement du processus enfant, jamais par un
  // argument de ligne de commande ni par le renderer.
  let sessionToken: string | undefined;
  try {
    const origin = new URL(event.senderFrame?.url || APP_URL).origin;
    // Nom historique prioritaire ; variantes sécurisées et ancien alias
    // `mai_token` pour ne pas rater le handoff si le web change de cookie.
    const cookies = await event.sender.session.cookies.get({ url: origin });
    const preference = [
      "mai_session_token",
      "__Secure-mai_session_token",
      "mai_token",
    ];
    const ordered = [...cookies].sort((left, right) =>
      preference.indexOf(left.name) - preference.indexOf(right.name)
    );
    const value =
      ordered
        .map((cookie) => cookie.value?.trim() ?? "")
        .find(
          (candidate) =>
            candidate.split(".").length === 3 && candidate.length <= 8192
        ) ?? "";
    if (value) {
      sessionToken = value;
    }
  } catch {
    // Un cookie illisible ne doit pas empêcher d ouvrir Coder : il retombera
    // sur son propre compte local.
  }
  return launchCoder({ ...(opts ?? {}), sessionToken });
});

ipcMain.handle("desktop:get-coder-status", (event) => {
  if (!trustedSender(event)) return { installed: false };
  const embedded = readEmbeddedCoderVersion();
  return {
    installed: Boolean(resolveCoderExecutable()),
    version: embedded?.version,
  };
});
