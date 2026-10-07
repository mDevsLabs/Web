import {
  type BrowserFingerprintSpoofSettings,
  normalizeBrowserFingerprintSpoof as normalizeBrowserFingerprintSpoofImpl,
} from "../main-src/browser/browserFingerprintNormalize.js";
import { getDefaultBrowserFingerprintForPlatform } from "../main-src/browser/browserStealthDefaults.js";

export function normalizeBrowserFingerprintSpoof(
  raw?: unknown
): BrowserFingerprintSpoofSettings {
  return normalizeBrowserFingerprintSpoofImpl(raw);
}

export function applyBrowserFingerprintPatch(
  current: BrowserFingerprintSpoofSettings,
  patch: Partial<
    Record<
      keyof BrowserFingerprintSpoofSettings,
      string | number | boolean | undefined
    >
  >
): BrowserFingerprintSpoofSettings {
  const merged: Record<string, unknown> = { ...current };
  for (const [key, raw] of Object.entries(patch)) {
    if (raw === "" || raw === undefined) {
      delete merged[key];
    } else {
      merged[key] = raw;
    }
  }
  return normalizeBrowserFingerprintSpoof(merged);
}

/** 主窗口侧栏/独立窗口内置浏览器与 `browser:setConfig` 共用的配置形态（不含主进程解析后的 `extraHeaders` 数组）。 */
export type BrowserSidebarSettingsConfig = {
  userAgent: string;
  acceptLanguage: string;
  extraHeadersText: string;
  blockTrackers: boolean;
  proxyMode: "system" | "direct" | "custom";
  proxyRules: string;
  proxyBypassRules: string;
  /** 页面内指纹伪装；空对象表示全部走浏览器默认 */
  fingerprint: BrowserFingerprintSpoofSettings;
};

export const BROWSER_SIDEBAR_CONFIG_SYNC_EVENT =
  "mai-coder:browser-sidebar-config-sync";

export type BrowserSidebarConfigSyncDetail = {
  config: Partial<BrowserSidebarSettingsConfig>;
  defaultUserAgent?: string;
};

export function browserSidebarConfigSyncDetail(
  event: Event
): BrowserSidebarConfigSyncDetail | null {
  if (!(event instanceof CustomEvent)) {
    return null;
  }
  const d = event.detail;
  if (!d || typeof d !== "object") {
    return null;
  }
  const o = d as Record<string, unknown>;
  const config = o.config;
  if (!config || typeof config !== "object") {
    return null;
  }
  return {
    config: config as Partial<BrowserSidebarSettingsConfig>,
    defaultUserAgent:
      typeof o.defaultUserAgent === "string" ? o.defaultUserAgent : undefined,
  };
}

export const DEFAULT_BROWSER_SIDEBAR_CONFIG: BrowserSidebarSettingsConfig = {
  acceptLanguage: "",
  blockTrackers: true,
  extraHeadersText: "",
  fingerprint: getDefaultBrowserFingerprintForPlatform(),
  proxyBypassRules: "",
  proxyMode: "system",
  proxyRules: "",
  userAgent: "",
};

export function normalizeBrowserSidebarConfig(
  raw?: Partial<BrowserSidebarSettingsConfig> | null,
  base?: BrowserSidebarSettingsConfig | null
): BrowserSidebarSettingsConfig {
  const b = base ?? DEFAULT_BROWSER_SIDEBAR_CONFIG;
  return {
    acceptLanguage:
      raw?.acceptLanguage === undefined
        ? b.acceptLanguage
        : String(raw.acceptLanguage).trim(),
    blockTrackers:
      raw?.blockTrackers === undefined
        ? b.blockTrackers
        : raw.blockTrackers !== false,
    extraHeadersText:
      raw?.extraHeadersText === undefined
        ? b.extraHeadersText
        : String(raw.extraHeadersText).replace(/\r/g, ""),
    fingerprint:
      raw?.fingerprint === undefined
        ? { ...b.fingerprint }
        : normalizeBrowserFingerprintSpoofImpl(raw.fingerprint),
    proxyBypassRules:
      raw?.proxyBypassRules === undefined
        ? b.proxyBypassRules
        : String(raw.proxyBypassRules).trim(),
    proxyMode:
      raw?.proxyMode === "direct" ||
      raw?.proxyMode === "custom" ||
      raw?.proxyMode === "system"
        ? raw.proxyMode
        : raw?.proxyMode === undefined
          ? b.proxyMode
          : "system",
    proxyRules:
      raw?.proxyRules === undefined
        ? b.proxyRules
        : String(raw.proxyRules).trim(),
    userAgent:
      raw?.userAgent === undefined ? b.userAgent : String(raw.userAgent).trim(),
  };
}

export function parseBrowserExtraHeadersText(
  raw: string
):
  | { ok: true; headers: Array<[string, string]> }
  | { ok: false; line: number } {
  const text = String(raw ?? "").replace(/\r/g, "");
  const lines = text.split("\n");
  const headers: Array<[string, string]> = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) {
      continue;
    }
    const sep = line.indexOf(":");
    if (sep <= 0) {
      return { line: i + 1, ok: false };
    }
    const name = line.slice(0, sep).trim();
    const value = line.slice(sep + 1).trim();
    if (!name) {
      return { line: i + 1, ok: false };
    }
    headers.push([name, value]);
  }
  return { headers, ok: true };
}

export type { BrowserFingerprintSpoofSettings } from "../main-src/browser/browserFingerprintNormalize.js";
