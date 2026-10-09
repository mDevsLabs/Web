import { app, shell, type WebContents } from "electron";
import { isGoogleLoginUrl } from "./googleLoginHosts.js";

export { isGoogleLoginUrl, isGoogleSensitiveHost } from "./googleLoginHosts.js";

export const GOOGLE_LOGIN_EXTERNAL_CHANNEL = "mai-coder:googleLoginExternal";

const GOOGLE_LOGIN_OPEN_COOLDOWN_MS = 3000;

const recentGoogleLoginOpens = new Map<number, { url: string; at: number }>();

function shouldSkipDuplicateGoogleLoginOpen(
  contentsId: number,
  url: string
): boolean {
  const now = Date.now();
  const previous = recentGoogleLoginOpens.get(contentsId);
  if (
    previous &&
    previous.url === url &&
    now - previous.at < GOOGLE_LOGIN_OPEN_COOLDOWN_MS
  ) {
    return true;
  }
  recentGoogleLoginOpens.set(contentsId, { at: now, url });
  return false;
}

function notifyHostGoogleLoginExternal(
  contents: WebContents,
  url: string,
  error?: string
): void {
  const host = contents.hostWebContents;
  if (!host || host.isDestroyed()) {
    return;
  }
  host.send(GOOGLE_LOGIN_EXTERNAL_CHANNEL, { error: error ?? null, url });
}

export async function openGoogleLoginInSystemBrowser(
  url: string,
  contentsId?: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  const target = String(url ?? "").trim();
  if (!target || !isGoogleLoginUrl(target)) {
    return { error: "unsupported url", ok: false };
  }
  if (
    contentsId != null &&
    shouldSkipDuplicateGoogleLoginOpen(contentsId, target)
  ) {
    return { ok: true };
  }
  try {
    await shell.openExternal(target);
    return { ok: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      ok: false,
    };
  }
}

function redirectWebviewGoogleLogin(contents: WebContents, url: string): void {
  void (async () => {
    const result = await openGoogleLoginInSystemBrowser(url, contents.id);
    notifyHostGoogleLoginExternal(
      contents,
      url,
      result.ok ? undefined : result.error
    );
  })();
}

function shouldInterceptGoogleLoginNavigation(
  contents: WebContents,
  targetUrl: string
): boolean {
  if (!isGoogleLoginUrl(targetUrl)) {
    return false;
  }
  let currentUrl = "";
  try {
    currentUrl = contents.getURL();
  } catch {
    currentUrl = "";
  }
  if (!currentUrl || currentUrl === "about:blank") {
    return true;
  }
  try {
    const current = new URL(currentUrl);
    const target = new URL(targetUrl);
    if (current.origin === target.origin) {
      return false;
    }
  } catch {
    return true;
  }
  return !isGoogleLoginUrl(currentUrl);
}

/**
 * webview 访问 Google 账号页时改走系统浏览器（embedded WebView 常被 Google 拒绝）。
 */
export function installGoogleLoginWebviewPolicy(): void {
  app.on("web-contents-created", (_event, contents) => {
    if (contents.getType() !== "webview") {
      return;
    }

    contents.on("will-navigate", (event, url) => {
      if (!shouldInterceptGoogleLoginNavigation(contents, url)) {
        return;
      }
      event.preventDefault();
      redirectWebviewGoogleLogin(contents, url);
    });

    contents.on("will-redirect", (event, url) => {
      if (!shouldInterceptGoogleLoginNavigation(contents, url)) {
        return;
      }
      event.preventDefault();
      redirectWebviewGoogleLogin(contents, url);
    });

    contents.on("destroyed", () => {
      recentGoogleLoginOpens.delete(contents.id);
    });
  });
}

export function handleGoogleLoginWindowOpen(
  contents: WebContents,
  url: string
): { handled: boolean } {
  if (!isGoogleLoginUrl(url)) {
    return { handled: false };
  }
  redirectWebviewGoogleLogin(contents, url);
  return { handled: true };
}
