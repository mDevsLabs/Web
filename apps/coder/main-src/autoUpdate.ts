import { app, type BrowserWindow, shell } from "electron";
import {
  autoUpdater,
  type ProgressInfo,
  type UpdateInfo,
} from "electron-updater";
import { copyFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import {
  MAI_BUILD_SHA,
  MAI_BUILD_TIME,
  MAI_RELEASES_API,
  MAI_RELEASES_URL,
} from "./buildInfo.js";
import { getSettings } from "./settingsStore.js";

/** 自动更新状态 */
export type AutoUpdateStatus =
  | { state: "idle" }
  | { state: "checking" }
  | {
      state: "available";
      info: UpdateInfo;
      /** Renseigné quand la build est plus récente que la version sémantique. */
      releaseUrl?: string;
    }
  | { state: "not-available" }
  | { state: "downloading"; progress: ProgressInfo }
  | {
      state: "downloaded";
      platform: NodeJS.Platform;
      isSigned: boolean;
      downloadPath?: string;
    }
  | { state: "error"; message: string };

let currentStatus: AutoUpdateStatus = { state: "idle" };
let updateCheckPromise: Promise<void> | null = null;
let mainWindow: BrowserWindow | null = null;
let isConfigured = false;

/** 设置主窗口引用，用于发送更新事件 */
export function setMainWindow(win: BrowserWindow | null): void {
  mainWindow = win;
}

/** 向渲染进程发送更新状态 */
function sendStatusToRenderer(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("auto-update:status", currentStatus);
  }
}

/**
 * Coder embarqué dans mAI Desktop : la version est livrée avec mAI et ne doit
 * jamais être remplacée par une release GitHub autonome. Les mises à jour
 * passent par mAI Desktop, qui embarque la version correspondante.
 */
export function isEmbeddedInMai(): boolean {
  return (
    process.env.MAI_CODER_EMBEDDED === "1" ||
    Boolean(process.env.MAI_CODER_EMBEDDED_VERSION?.trim())
  );
}

/** 检查是否启用自动更新 */
function isAutoUpdateEnabled(): boolean {
  if (isEmbeddedInMai()) {
    return false;
  }
  const settings = getSettings();
  return settings.autoUpdate?.enabled !== false; // 默认开启
}

/** 检查是否允许差异化更新 */
function isDifferentialAllowed(): boolean {
  const settings = getSettings();
  return settings.autoUpdate?.allowDifferential !== false; // 默认允许
}

function syncDifferentialDownloadSetting(): void {
  autoUpdater.disableDifferentialDownload = !isDifferentialAllowed();
}

/** 配置 autoUpdater */
function configureUpdater(): void {
  if (isConfigured) {
    return;
  }
  isConfigured = true;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  // Les builds de ce dépôt sont publiés en préversion (tags beta/pr).
  // electron-updater ignore ces releases par défaut : sans ce drapeau, il ne
  // voit jamais les versions réellement installées par les utilisateurs.
  autoUpdater.allowPrerelease = true;
  syncDifferentialDownloadSetting();

  // Dépôt des releases (doit rester aligné avec le workflow de publication :
  // les installateurs Coder sont attachés aux releases de `mDevsLabs/Web`, pas
  // au dépôt historique `mDevsLabs/Coder` resté en 0.5.5). Une URL obsolète fait
  // télécharger des 404 HTML à la place de l'installateur, que le système
  // exécute ensuite — d'où « Error launching installer » côté NSIS.
  autoUpdater.setFeedURL({
    owner: "mDevsLabs",
    provider: "github",
    repo: "Web",
  });

  autoUpdater.on("checking-for-update", () => {
    console.log("[AutoUpdate] Checking for updates...");
    currentStatus = { state: "checking" };
    sendStatusToRenderer();
  });

  autoUpdater.on("update-available", (info: UpdateInfo) => {
    console.log("[AutoUpdate] Update available:", info.version);
    currentStatus = { info, state: "available" };
    sendStatusToRenderer();
  });

  autoUpdater.on("update-not-available", () => {
    console.log("[AutoUpdate] Update not available");
    currentStatus = { state: "not-available" };
    sendStatusToRenderer();
  });

  autoUpdater.on("error", (err: Error) => {
    console.error("[AutoUpdate] Error:", err.message);
    currentStatus = { message: err.message, state: "error" };
    sendStatusToRenderer();
  });

  autoUpdater.on("download-progress", (progress: ProgressInfo) => {
    console.log(
      "[AutoUpdate] Download progress:",
      progress.percent.toFixed(2) + "%"
    );
    currentStatus = { progress, state: "downloading" };
    sendStatusToRenderer();
  });

  autoUpdater.on("update-downloaded", (info: UpdateInfo) => {
    console.log("[AutoUpdate] Update downloaded:", info.version);

    const platform = process.platform;
    const signed = isAppSigned();

    if (platform === "darwin" && !signed) {
      // macOS 无签名：将更新包复制到 Downloads，提示用户手动安装
      const downloadedFile = getDownloadedUpdatePath();
      if (downloadedFile) {
        const downloadsDir = join(app.getPath("home"), "Downloads");
        const dest = join(
          downloadsDir,
          `mAI-Coder-${info.version}-mac-update.zip`
        );
        try {
          if (!existsSync(downloadsDir)) {
            mkdirSync(downloadsDir, { recursive: true });
          }
          copyFileSync(downloadedFile, dest);
          console.log("[AutoUpdate] Copied update to Downloads:", dest);
          currentStatus = {
            downloadPath: dest,
            isSigned: false,
            platform,
            state: "downloaded",
          };
        } catch (e) {
          console.error("[AutoUpdate] Failed to copy update to Downloads:", e);
          currentStatus = { isSigned: false, platform, state: "downloaded" };
        }
      } else {
        currentStatus = { isSigned: false, platform, state: "downloaded" };
      }
    } else {
      currentStatus = { isSigned: signed, platform, state: "downloaded" };
    }
    sendStatusToRenderer();
  });
}

type GithubRelease = {
  assets?: { name?: string }[];
  body?: string;
  html_url?: string;
  name?: string;
  published_at?: string;
  tag_name?: string;
};

// Une release du dépôt principal peut ne contenir que le Web ou le mobile.
// Sans installateur Coder joint, proposer « mise à jour disponible » enverrait
// l'utilisateur vers une page sans fichier à installer.
function releaseHasCoderAssets(release: GithubRelease): boolean {
  return (release.assets ?? []).some((asset) =>
    (asset.name ?? "").toLowerCase().startsWith("mai-coder-")
  );
}

function commitFromReleaseBody(body: string | undefined): string {
  if (!body) {
    return "";
  }
  const explicit = /\*\*Commit\*\*\s*:\s*`([0-9a-f]{7,40})`/i.exec(body);
  if (explicit) {
    return explicit[1]!.toLowerCase();
  }
  // Anciennes releases : premier SHA entre backticks.
  const loose = /`([0-9a-f]{7,40})`/i.exec(body);
  return loose ? loose[1]!.toLowerCase() : "";
}

/**
 * Les préversions gardent le même `version` (0.9.1) et n'avancent que par tag.
 * electron-updater compare des versions sémantiques et conclut donc à tort
 * « à jour ». On compare le commit publié dans la dernière release au SHA
 * compilé dans cette build pour afficher malgré tout la mise à jour.
 */
async function checkBuildShaUpdate(): Promise<boolean> {
  if (!MAI_BUILD_SHA) {
    return false;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(MAI_RELEASES_API, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "mAI-Coder",
      },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));
    if (!response.ok) {
      return false;
    }
    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload)) {
      return false;
    }
    const releases = payload as GithubRelease[];
    const release = releases.find((item) => {
      if (!(commitFromReleaseBody(item.body) && releaseHasCoderAssets(item))) {
        return false;
      }
      const releaseSha = commitFromReleaseBody(item.body);
      const sameBuild =
        releaseSha.startsWith(MAI_BUILD_SHA) ||
        MAI_BUILD_SHA.startsWith(releaseSha);
      if (sameBuild) {
        return false;
      }
      // Un SHA différent ne dit pas dans quel sens : sans date, une release
      // plus ancienne que la build installée serait présentée comme neuve.
      const publishedAt = Date.parse(item.published_at ?? "");
      return (
        MAI_BUILD_TIME <= 0 ||
        !Number.isFinite(publishedAt) ||
        publishedAt > MAI_BUILD_TIME
      );
    });
    if (!release) {
      return false;
    }
    currentStatus = {
      info: {
        releaseDate: release.published_at,
        releaseNotes: release.body,
        version: release.tag_name || release.name || "nouvelle build",
      } as UpdateInfo,
      releaseUrl: release.html_url || MAI_RELEASES_URL,
      state: "available",
    };
    sendStatusToRenderer();
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

/** 检查更新 */
export async function checkForUpdates(): Promise<AutoUpdateStatus> {
  if (isEmbeddedInMai()) {
    console.log(
      "[AutoUpdate] Désactivé : Coder est embarqué dans mAI Desktop."
    );
    currentStatus = { state: "idle" };
    return currentStatus;
  }
  if (!isAutoUpdateEnabled()) {
    console.log("[AutoUpdate] Auto-update is disabled");
    currentStatus = { state: "idle" };
    return currentStatus;
  }

  // 如果正在检查，返回现有 promise
  if (updateCheckPromise) {
    return currentStatus;
  }

  configureUpdater();
  syncDifferentialDownloadSetting();

  updateCheckPromise = (async () => {
    try {
      await autoUpdater.checkForUpdates();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[AutoUpdate] Check failed:", message);
      currentStatus = { message, state: "error" };
      sendStatusToRenderer();
    } finally {
      updateCheckPromise = null;
    }
    // Repli build-par-build quand la version sémantique n'a pas changé.
    if (
      currentStatus.state === "not-available" ||
      currentStatus.state === "error"
    ) {
      await checkBuildShaUpdate();
    }
  })();

  await updateCheckPromise;
  return currentStatus;
}

/** 下载更新 */
export async function downloadUpdate(): Promise<void> {
  if (!isAutoUpdateEnabled()) {
    throw new Error("Auto-update is disabled");
  }

  if (currentStatus.state !== "available") {
    throw new Error("No update available to download");
  }

  // Mise à jour détectée par commit (même version sémantique) : on ne peut pas
  // la télécharger via electron-updater, on ouvre la release officielle.
  if (currentStatus.releaseUrl) {
    await shell.openExternal(currentStatus.releaseUrl);
    return;
  }

  // 如果禁用差异化更新，强制全量下载；每次下载前同步，避免设置切回后沿用旧状态。
  syncDifferentialDownloadSetting();
  await autoUpdater.downloadUpdate();
}

/** 检测应用是否被代码签名 */
function isAppSigned(): boolean {
  if (process.platform !== "darwin") {
    return true; // 非 macOS 无需检测
  }
  try {
    const { execSync } = require("child_process");
    const appPath = app.getPath("exe");
    // codesign -dv 会输出签名信息；未签名时返回非零退出码
    execSync(`codesign -dv "${appPath}"`, { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

/** 获取已下载的更新包路径（electron-updater 内部属性） */
function getDownloadedUpdatePath(): string | undefined {
  try {
    const updater = autoUpdater as any;
    return updater.downloadedUpdateHelper?.file;
  } catch {}
}

/** 重启并安装更新 */
export function quitAndInstall(): void {
  if (currentStatus.state !== "downloaded") {
    throw new Error("Update not downloaded yet");
  }

  // macOS 无签名：无法自动安装，打开下载文件夹
  if (currentStatus.platform === "darwin" && !currentStatus.isSigned) {
    const downloadPath = currentStatus.downloadPath;
    if (downloadPath) {
      shell.showItemInFolder(downloadPath);
    } else {
      shell.openPath(join(app.getPath("home"), "Downloads"));
    }
    return;
  }

  autoUpdater.quitAndInstall();
}

/** 打开更新包所在文件夹 */
export function openUpdateFolder(): void {
  if (currentStatus.state !== "downloaded") {
    return;
  }
  const downloadPath = currentStatus.downloadPath;
  if (downloadPath) {
    shell.showItemInFolder(downloadPath);
  } else {
    shell.openPath(join(app.getPath("home"), "Downloads"));
  }
}

/** 获取当前状态 */
export function getStatus(): AutoUpdateStatus {
  return currentStatus;
}

/** 初始化自动更新（在 app.ready 后调用） */
export function initAutoUpdate(win: BrowserWindow): void {
  setMainWindow(win);
  if (isEmbeddedInMai()) {
    console.log(
      "[AutoUpdate] Désactivé : Coder est embarqué dans mAI Desktop."
    );
    return;
  }

  // Vérification immédiate au lancement : l'utilisateur doit voir une mise à
  // jour disponible sans attendre une demi-minute ni ouvrir les paramètres.
  if (isAutoUpdateEnabled()) {
    checkForUpdates().catch((err) => {
      console.error("[AutoUpdate] Initial check failed:", err);
    });
  }

  // Timers trackés + nettoyés à la fermeture (évite closure win 1h après close).
  const initialTimer = setTimeout(() => {
    if (isAutoUpdateEnabled()) {
      checkForUpdates().catch((err) => {
        console.error("[AutoUpdate] Initial check failed:", err);
      });
    }
  }, 30_000);

  // 每小时检查一次更新
  const interval = setInterval(
    () => {
      if (isAutoUpdateEnabled()) {
        checkForUpdates().catch((err) => {
          console.error("[AutoUpdate] Periodic check failed:", err);
        });
      }
    },
    60 * 60 * 1000
  );
  // unref: ne retient pas le process en test.
  try {
    (initialTimer as unknown as { unref?: () => void }).unref?.();
    (interval as unknown as { unref?: () => void }).unref?.();
  } catch {
    /* ignore */
  }
  try {
    win.once("closed", () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      setMainWindow(null);
    });
  } catch {
    /* ignore */
  }
}
