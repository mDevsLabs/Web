import { existsSync, readFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import { app, BrowserWindow, nativeTheme } from "electron";
import {
  nativeWindowChromeFromAppearance,
  normalizeAppearanceSettings,
} from "../src/appearanceSettings.js";
import { initAgentSnapshotStore } from "./agent/agentSnapshotStore.js";
import { disposeAppTray, initAppTray } from "./appTray.js";
import {
  configureAppWindowIcon,
  createAppWindow,
  getAppWindowSurfaceForWebContents,
} from "./appWindow.js";
import { initAutoUpdate } from "./autoUpdate.js";
import {
  disposeBotController,
  initBotController,
  syncBotControllerFromSettings,
} from "./bots/botController.js";
import {
  flushBotSessionStore,
  initBotSessionStore,
} from "./bots/botSessionStore.js";
import { applyAiBrowserStartupSwitches } from "./browser/aiBrowserFlag.js";
import { disposeBrowserCaptureProxy } from "./browser/browserMitmProxy.js";
import { SystemProxy as BrowserSystemProxy } from "./browser/browserSystemProxy.js";
import {
  handleGoogleLoginWindowOpen,
  installGoogleLoginWebviewPolicy,
} from "./browser/googleLoginPolicy.js";
import { disposePlaywrightBridge } from "./browser/playwrightBridge.js";
import { agentRevertSnapshotsByThread } from "./ipc/chatRuntime.js";
import { registerIpc } from "./ipc/register.js";
import { isUsableMaiSessionToken } from "./maiSessionToken.js";
import { getMcpManager } from "./mcp/index.js";
import { getEffectiveMcpServerConfigs } from "./plugins/pluginRuntimeService.js";
import {
  getMcpServerConfigs,
  getRestorableWorkspace,
  getSettings,
  initSettingsStore,
} from "./settingsStore.js";
import {
  ensureDefaultThread,
  flushPendingSave,
  initThreadStore,
} from "./threadStore.js";
import { initWindowsConsoleUtf8 } from "./winUtf8.js";

function resolveAppIconPath(): string | undefined {
  const iconSearchRoots = [
    path.join(app.getAppPath(), "resources", "icons"),
    path.join(process.resourcesPath, "resources", "icons"),
    path.join(process.resourcesPath, "icons"),
    path.join(process.resourcesPath),
    path.join(process.cwd(), "resources", "icons"),
    path.join(import.meta.dirname, "..", "resources", "icons"),
    path.join(import.meta.dirname, "..", "..", "resources", "icons"),
  ];
  const names =
    process.platform === "win32"
      ? ["icon.ico", "icon.png"]
      : process.platform === "darwin"
        ? ["icon.icns", "icon.png"]
        : ["icon.png", "icon.ico"];
  for (const root of iconSearchRoots) {
    for (const name of names) {
      const full = path.join(root, name);
      if (existsSync(full)) {
        return full;
      }
    }
  }
}

// Handoff de session depuis mAI Desktop. Le jeton n'apparaît jamais dans les
// arguments : argv porte un chemin de fichier éphémère, lu puis supprimé.
function readSessionHandoffFile(file: string): string | undefined {
  try {
    const value = readFileSync(file, "utf8").trim();
    try {
      unlinkSync(file);
    } catch {
      /* déjà supprimé */
    }
    return isUsableMaiSessionToken(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

function sessionTokenFromArgs(argv: string[]): string | undefined {
  const prefix = "--mai-session-token-file=";
  const arg = argv.find((item) => item.startsWith(prefix));
  return arg ? readSessionHandoffFile(arg.slice(prefix.length)) : undefined;
}

// Le handoff peut arriver avant la fin de l'initialisation du stockage quand
// une seconde instance est lancée très tôt : attendre le settingsStore évite de
// perdre le jeton dans une écriture prématurée.
let resolveMaiSettingsReady: (() => void) | null = null;
const maiSettingsReady = new Promise<void>((resolve) => {
  resolveMaiSettingsReady = resolve;
});

// Applique un jeton de session mAI : remplace immédiatement le compte local
// puis synchronise profil et modèles, sans bloquer l'ouverture de l'éditeur.
async function applyMaiHandoffToken(token: string): Promise<void> {
  const value = token.trim();
  if (!isUsableMaiSessionToken(value)) {
    return;
  }
  await maiSettingsReady;
  try {
    const { markMaiAccountSyncPending, syncMaiAccountWithToken } = await import(
      "./maiAccountStore.js"
    );
    markMaiAccountSyncPending(value);
    await Promise.race([
      syncMaiAccountWithToken(value).catch((e) => {
        console.warn("[mAI] handoff sync failed", e);
        return null;
      }),
      new Promise((resolve) => setTimeout(resolve, 4_000)),
    ]);
  } catch (e) {
    console.warn("[mAI] handoff token illisible", e);
  }
}

const handoffToken =
  process.env.MAI_SESSION_TOKEN?.trim() || sessionTokenFromArgs(process.argv);
delete (process.env as NodeJS.ProcessEnv).MAI_SESSION_TOKEN;

initWindowsConsoleUtf8();

// Single-instance: second launch focuses existing window instead of opening
// a second SQLite writer (prevents SQLITE_BUSY/corruption of session.db).
const gotLock = app.requestSingleInstanceLock(
  handoffToken ? { maiSessionToken: handoffToken } : {}
);
if (gotLock) {
  app.on("second-instance", (_event, argv, _cwd, additionalData) => {
    const wins = BrowserWindow.getAllWindows();
    const first = wins[0];
    if (first && !first.isDestroyed()) {
      if (first.isMinimized()) first.restore();
      first.show();
      first.focus();
    }
    const incoming =
      (additionalData as { maiSessionToken?: string } | undefined)
        ?.maiSessionToken || sessionTokenFromArgs(argv);
    if (incoming && isUsableMaiSessionToken(incoming)) {
      void applyMaiHandoffToken(incoming);
    }
  });
} else {
  app.quit();
}

// 必须在 app.whenReady 之前调用 —— Chromium 命令行开关只在初始化前生效。
applyAiBrowserStartupSwitches();
installGoogleLoginWebviewPolicy();

// Intercept webview new-window requests and forward to host renderer
// (Electron 12+ deprecated the new-window event; use setWindowOpenHandler instead)
// + hardening: deny navigation to file://, restrict permissions, validate webview attachments.
app.on("web-contents-created", (_event, contents) => {
  if (contents.getType() === "webview") {
    contents.setWindowOpenHandler(({ url, disposition }) => {
      if (handleGoogleLoginWindowOpen(contents, url).handled) {
        return { action: "deny" };
      }
      const host = contents.hostWebContents;
      if (host && !host.isDestroyed()) {
        host.send("mai-coder:browserNewWindow", { disposition, url });
      }
      return { action: "deny" };
    });
    return;
  }
  // Main windows: deny all popups, block file:// navigation, no permissions by default.
  contents.setWindowOpenHandler(() => ({ action: "deny" }));
  contents.on("will-navigate", (e, url) => {
    try {
      const parsed = new URL(url);
      // Allow only app origins: file:// dist + vite dev server.
      const isFileApp = parsed.protocol === "file:";
      const isDevServer =
        parsed.protocol === "http:" &&
        (parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost") &&
        parsed.port === "5173";
      if (!isFileApp && !isDevServer) {
        e.preventDefault();
      }
    } catch {
      e.preventDefault();
    }
  });
});

let quittingAfterThreadStoreFlush = false;
let forceQuitFromTray = false;
let appIsQuitting = false;

function requestAppQuit(): void {
  forceQuitFromTray = true;
  app.quit();
}

app.on("before-quit", (e) => {
  appIsQuitting = true;
  if (quittingAfterThreadStoreFlush) {
    return;
  }
  quittingAfterThreadStoreFlush = true;
  e.preventDefault();
  flushBotSessionStore();
  void Promise.allSettled([
    flushPendingSave(),
    disposeBotController(),
    disposeBrowserCaptureProxy(),
    disposePlaywrightBridge(),
    BrowserSystemProxy.hasSavedState()
      ? BrowserSystemProxy.disable()
      : Promise.resolve(),
  ]).finally(() => {
    app.quit();
  });
});

app.on("browser-window-created", (_event, win) => {
  // Harden: no autoplay permissions, no media/device access by default.
  try {
    win.webContents.session.setPermissionRequestHandler(
      (_wc, _permission, callback) => callback(false)
    );
  } catch {
    /* ignore */
  }
  win.on("close", (event) => {
    if (getAppWindowSurfaceForWebContents(win.webContents) === "browser") {
      return;
    }
    if (forceQuitFromTray || appIsQuitting || process.platform === "darwin") {
      return;
    }
    event.preventDefault();
    win.hide();
  });
});

app.whenReady().then(async () => {
  // Recover from a previous run that did not get to restore the system proxy.
  if (BrowserSystemProxy.hasSavedState()) {
    void BrowserSystemProxy.disable().catch(() => {
      /* best-effort restore */
    });
  }
  // 仅在显式 debug 开关下安装 React DevTools，保持 dev / dev:debug 语义与现有脚本一致。
  const installReactDevTools =
    process.env.MAI_CODER_DEVTOOLS === "1" ||
    process.env.ASYNC_SHELL_DEVTOOLS === "1" ||
    process.env.VOID_SHELL_DEVTOOLS === "1";
  if (installReactDevTools) {
    const {
      default: installExtension,
      REACT_DEVELOPER_TOOLS,
    } = require("electron-devtools-installer");

    installExtension(REACT_DEVELOPER_TOOLS, { loadExtension: true })
      .then(() => console.log("✅ React DevTools 已安装"))
      .catch((err: unknown) => console.log("安装失败:", err));
  }

  const t0 = Date.now();
  const lap = (label: string) =>
    console.log(`[startup] ${label}: +${Date.now() - t0}ms`);

  const appIconPath = resolveAppIconPath();
  configureAppWindowIcon(appIconPath);
  initAppTray(appIconPath, requestAppQuit);
  if (process.platform === "darwin" && appIconPath) {
    try {
      app.dock?.setIcon(appIconPath);
    } catch (error) {
      console.warn("[startup] failed to set dock icon:", error);
    }
  }
  lap("icon configured");

  const userData = app.getPath("userData");
  initSettingsStore(userData);
  resolveMaiSettingsReady?.();
  resolveMaiSettingsReady = null;
  lap("settingsStore init");
  // Handoff depuis mAI Desktop : jeton lu depuis l'environnement ou le fichier
  // transmis par argv, déjà retiré de l'environnement au démarrage.
  if (handoffToken) {
    await applyMaiHandoffToken(handoffToken);
  } else {
    // Au lancement, si un compte mAI est déjà connecté, rafraîchir le profil
    // et le catalogue depuis `MAI_API_V1_BASE` (jamais une URL en dur).
    try {
      const s0 = getSettings();
      if (s0.maiAccount?.jwtToken) {
        const { syncMaiAccountWithToken } = await import(
          "./maiAccountStore.js"
        );
        void syncMaiAccountWithToken(s0.maiAccount.jwtToken).catch((e) =>
          console.warn("[mAI] auto-sync failed", e)
        );
      }
    } catch (_) {}
  }
  initBotSessionStore(userData);
  lap("botSessionStore init");
  initBotController(getSettings);
  void syncBotControllerFromSettings(getSettings());
  lap("botController init");

  // L'application mAI peut ouvrir directement un espace local, sans shell.
  const workspaceArg = process.argv.find((arg) => arg.startsWith("--workspace="));
  const restored = workspaceArg?.slice("--workspace=".length) || getRestorableWorkspace();
  lap("restorableWorkspace resolved");

  const restoredUsable = restored && existsSync(restored) ? restored : null;
  initThreadStore(userData, restoredUsable);
  lap("threadStore init");

  ensureDefaultThread(restoredUsable);
  lap("defaultThread ensured");

  initAgentSnapshotStore(userData, agentRevertSnapshotsByThread);
  lap("agentSnapshotStore init");

  registerIpc();
  lap("IPC registered");

  // 自动启动已启用且 autoStart 的 MCP 服务器
  const mcpManager = getMcpManager();
  mcpManager.loadConfigs(
    getEffectiveMcpServerConfigs(getMcpServerConfigs(), restoredUsable)
  );
  void mcpManager.startAll().then(() => {
    lap("MCP auto-start done");
  });

  const settings = getSettings();
  const ui = (settings.ui ?? {}) as Partial<Record<string, unknown>>;
  const colorMode =
    ui.colorMode === "light" ||
    ui.colorMode === "dark" ||
    ui.colorMode === "system"
      ? ui.colorMode
      : "system";
  const scheme =
    colorMode === "system"
      ? nativeTheme.shouldUseDarkColors
        ? "dark"
        : "light"
      : colorMode;
  const appearance = normalizeAppearanceSettings(ui, scheme);
  const chromeOverride = nativeWindowChromeFromAppearance(appearance, scheme);

  createAppWindow({
    initialThemeChrome: { override: chromeOverride, scheme },
    initialWorkspace: restoredUsable,
    surface: "agent",
  });
  lap("window created");

  // 初始化自动更新（获取刚创建的窗口）
  const [mainWin] = BrowserWindow.getAllWindows();
  if (mainWin) {
    initAutoUpdate(mainWin);
    lap("autoUpdate initialized");
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const schemeNow = nativeTheme.shouldUseDarkColors ? "dark" : "light";
      const appearanceNow = normalizeAppearanceSettings(ui, schemeNow);
      const chromeNow = nativeWindowChromeFromAppearance(
        appearanceNow,
        schemeNow
      );
      createAppWindow({
        initialThemeChrome: { override: chromeNow, scheme: schemeNow },
        surface: "agent",
      });
    }
  });
});

app.on("window-all-closed", () => {
  if ((forceQuitFromTray || appIsQuitting) && process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  disposeAppTray();
});
