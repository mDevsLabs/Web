import {
  type CSSProperties,
  type FormEvent,
  memo,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { fingerprintSettingsToInjectPatch } from "../main-src/browser/browserFingerprintNormalize.js";
import { isGoogleLoginUrl } from "../main-src/browser/googleLoginHosts.js";
import { humanCursorInitScript } from "../main-src/browser/humanCursor.js";
import { useAppShellChromeCore } from "./app/appShellContexts";
import { hideBootSplash } from "./bootSplash";
import { buildBrowserFingerprintStealthScript } from "./browserFingerprintStealth.js";
import { getBrowserHookScript } from "./browserHookScript.js";
import {
  BROWSER_SIDEBAR_CONFIG_SYNC_EVENT,
  type BrowserSidebarSettingsConfig,
  browserSidebarConfigSyncDetail,
  DEFAULT_BROWSER_SIDEBAR_CONFIG,
  normalizeBrowserSidebarConfig,
} from "./browserSidebarConfig";
import type { TFunction } from "./i18n";
import {
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconArrowUpRight,
  IconChevron,
  IconCloseSmall,
  IconCopy,
  IconDoc,
  IconDownload,
  IconGlobe,
  IconListFilter,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconSettings,
  IconStop,
  IconTrash,
} from "./icons";

type AgentRightSidebarView =
  | "git"
  | "plan"
  | "file"
  | "team"
  | "browser"
  | "agents";

const BROWSER_HOME_URL = "about:blank";
const BROWSER_CAPTURE_DOCK_EXPANDED_KEY =
  "async.browser.captureDock.expanded.v1";
const BROWSER_CAPTURE_DOCK_HEIGHT_KEY = "async.browser.captureDock.height.v1";
const BROWSER_CAPTURE_DOCK_TAB_KEY = "async.browser.captureDock.tab.v1";
const BROWSER_CAPTURE_DETAIL_VISIBLE_KEY =
  "async.browser.captureDock.detailVisible.v1";
const BROWSER_CAPTURE_DOCK_DEFAULT_HEIGHT = 320;
const BROWSER_CAPTURE_DOCK_MIN_HEIGHT = 190;
const BROWSER_CAPTURE_DOCK_MAX_HEIGHT = 560;
const BROWSER_CAPTURE_REQUEST_PAGE_SIZE = 80;

type BrowserCapturePanelTab = "requests" | "hooks" | "storage" | "devices";
type BrowserCaptureDetailTab = "headers" | "request" | "response";
type BrowserCaptureStatusFilter =
  | "all"
  | "pending"
  | "2xx"
  | "3xx"
  | "4xx"
  | "5xx"
  | "error";
type BrowserCaptureSourceFilter = "all" | "browser" | "proxy";
type BrowserCaptureMethodFilter =
  | "all"
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "OPTIONS"
  | "OTHER";
type BrowserCaptureResourceFilter =
  | "all"
  | "document"
  | "xhr"
  | "fetch"
  | "script"
  | "stylesheet"
  | "image"
  | "other";
type BrowserCaptureExportAction = "curl" | "json" | "har" | "agent";
type BrowserCaptureProxyBusy = "start" | "stop" | "ca" | "refresh";

type BrowserCaptureHookEventUi = {
  id: string;
  seq: number;
  tabId: string | null;
  ts: number;
  url: string;
  category: string;
  label: string;
  args: string;
  result: string | null;
  stack: string;
};

type BrowserCaptureStorageEntryUi = { key: string; value: string };

type BrowserCaptureStorageSnapshotUi = {
  id: string;
  tabId: string | null;
  host: string;
  url: string;
  ts: number;
  cookies: string;
  localStorage: BrowserCaptureStorageEntryUi[];
  sessionStorage: BrowserCaptureStorageEntryUi[];
};

type BrowserCaptureSessionSummaryUi = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  requestCount: number;
  hookEventCount: number;
  storageHostCount: number;
  note: string | null;
};

type BrowserCaptureAnalysisRecordUi = {
  id: string;
  threadId: string;
  mode: string;
  title: string;
  sourceUrl: string;
  createdAt: number;
};

function RightSidebarTabs({
  t,
  hasPlan,
  openView,
  closeSidebar,
  extraActions,
}: {
  t: TFunction;
  hasPlan: boolean;
  openView: (view: AgentRightSidebarView) => void;
  closeSidebar: () => void;
  extraActions?: ReactNode;
}) {
  return (
    <div
      aria-label={t("app.rightSidebarViews")}
      className="ref-right-icon-tabs"
    >
      {hasPlan ? (
        <button
          aria-label={t("app.tabPlan")}
          className="ref-right-icon-tab"
          onClick={() => openView("plan")}
          title={t("app.tabPlan")}
          type="button"
        >
          <IconDoc />
        </button>
      ) : null}
      {extraActions}
      <button
        aria-label={t("common.close")}
        className="ref-right-icon-tab"
        onClick={closeSidebar}
        title={t("common.close")}
        type="button"
      >
        <IconCloseSmall />
      </button>
    </div>
  );
}

type BrowserNavEvent = Event & { url?: string; isMainFrame?: boolean };
type BrowserTitleEvent = Event & { title?: string };
type BrowserFailEvent = Event & {
  errorCode?: number;
  errorDescription?: string;
  validatedURL?: string;
  isMainFrame?: boolean;
};
type BrowserControlPayload =
  | {
      commandId: string;
      type: "navigate";
      target: string;
      newTab?: boolean;
    }
  | {
      commandId: string;
      type: "closeSidebar";
    }
  | {
      commandId: string;
      type: "reload" | "stop" | "goBack" | "goForward" | "closeTab";
      tabId?: string;
    }
  | {
      commandId: string;
      type: "readPage";
      tabId?: string;
      selector?: string;
      includeHtml?: boolean;
      maxChars?: number;
      waitForLoad?: boolean;
    }
  | {
      commandId: string;
      type: "screenshotPage";
      tabId?: string;
      waitForLoad?: boolean;
    }
  | {
      commandId: string;
      type: "clickElement";
      tabId?: string;
      selector: string;
      waitForLoad?: boolean;
    }
  | {
      commandId: string;
      type: "inputText";
      tabId?: string;
      selector: string;
      text: string;
      pressEnter?: boolean;
      waitForLoad?: boolean;
    }
  | {
      commandId: string;
      type: "waitForSelector";
      tabId?: string;
      selector: string;
      visible?: boolean;
      waitForLoad?: boolean;
      timeoutMs?: number;
    }
  | {
      commandId: string;
      type: "applyConfig";
      config: Partial<BrowserSidebarSettingsConfig>;
      defaultUserAgent?: string;
    };

type BrowserCommandResultPayload =
  | {
      commandId: string;
      ok: true;
      result: unknown;
    }
  | {
      commandId: string;
      ok: false;
      error: string;
    };

type BrowserCaptureUiState = {
  capturing: boolean;
  requestCount: number;
  pendingRequestCount: number;
  hookEventCount: number;
  storageHostCount: number;
  tabs: Array<{ attached: boolean; lastError: string | null }>;
  note?: string;
};

type BrowserCaptureRequestSummaryUi = {
  id: string;
  seq: number;
  tabId: string;
  source: "browser" | "proxy";
  method: string;
  url: string;
  status: number | null;
  contentType: string | null;
  resourceType: string | null;
  startedAt: number;
  durationMs: number | null;
  hasRequestBody: boolean;
  requestBodyTruncated: boolean;
  hasResponseBody: boolean;
  responseBodyTruncated: boolean;
  responseBodyOmittedReason: string | null;
  errorText: string | null;
};

type BrowserCaptureRequestDetailUi = BrowserCaptureRequestSummaryUi & {
  requestHeaders: Record<string, string>;
  requestBody: string | null;
  responseHeaders: Record<string, string>;
  responseBody: string | null;
};

type BrowserCaptureListUi = {
  total: number;
  offset: number;
  limit: number;
  items: BrowserCaptureRequestSummaryUi[];
};

type BrowserCaptureProxyStatusUi = {
  running: boolean;
  port: number;
  ownerHostId: number | null;
  localAddresses: string[];
  primaryAddress: string;
  proxyUrl: string;
  caDownloadUrl: string;
  caCertPath: string;
  caReady: boolean;
  caInstalled: boolean;
  systemProxyEnabled: boolean;
  httpsMitm: boolean;
  startedAt: number | null;
  requestCount: number;
  lastError: string | null;
};

function isBrowserControlPayload(raw: unknown): raw is BrowserControlPayload {
  if (!raw || typeof raw !== "object") {
    return false;
  }
  const obj = raw as Record<string, unknown>;
  if (typeof obj.commandId !== "string" || typeof obj.type !== "string") {
    return false;
  }
  switch (obj.type) {
    case "navigate":
      return typeof obj.target === "string";
    case "closeSidebar":
      return true;
    case "reload":
    case "stop":
    case "goBack":
    case "goForward":
    case "closeTab":
      return obj.tabId === undefined || typeof obj.tabId === "string";
    case "readPage":
      return (
        (obj.tabId === undefined || typeof obj.tabId === "string") &&
        (obj.selector === undefined || typeof obj.selector === "string") &&
        (obj.includeHtml === undefined ||
          typeof obj.includeHtml === "boolean") &&
        (obj.maxChars === undefined || typeof obj.maxChars === "number") &&
        (obj.waitForLoad === undefined || typeof obj.waitForLoad === "boolean")
      );
    case "screenshotPage":
      return (
        (obj.tabId === undefined || typeof obj.tabId === "string") &&
        (obj.waitForLoad === undefined || typeof obj.waitForLoad === "boolean")
      );
    case "clickElement":
      return (
        (obj.tabId === undefined || typeof obj.tabId === "string") &&
        typeof obj.selector === "string" &&
        (obj.waitForLoad === undefined || typeof obj.waitForLoad === "boolean")
      );
    case "inputText":
      return (
        (obj.tabId === undefined || typeof obj.tabId === "string") &&
        typeof obj.selector === "string" &&
        typeof obj.text === "string" &&
        (obj.pressEnter === undefined || typeof obj.pressEnter === "boolean") &&
        (obj.waitForLoad === undefined || typeof obj.waitForLoad === "boolean")
      );
    case "waitForSelector":
      return (
        (obj.tabId === undefined || typeof obj.tabId === "string") &&
        typeof obj.selector === "string" &&
        (obj.visible === undefined || typeof obj.visible === "boolean") &&
        (obj.waitForLoad === undefined ||
          typeof obj.waitForLoad === "boolean") &&
        (obj.timeoutMs === undefined || typeof obj.timeoutMs === "number")
      );
    case "applyConfig":
      return Boolean(obj.config && typeof obj.config === "object");
    default:
      return false;
  }
}

function safeGetWebviewUrl(node: MaiShellWebviewElement | null): string {
  if (!node) {
    return "";
  }
  try {
    return String(node.getURL?.() ?? "").trim();
  } catch {
    return "";
  }
}

function looksLikeLocalFilesystemPath(raw: string): boolean {
  if (/^[a-zA-Z]:[\\/]/.test(raw)) {
    return true;
  }
  if (/^\\\\/.test(raw)) {
    return true;
  }
  if (/^\/[^/]/.test(raw)) {
    return true;
  }
  if (/\\/.test(raw) && !/^[a-zA-Z][a-zA-Z\d+\-.]+:\/\//.test(raw)) {
    return true;
  }
  return false;
}

function looksLikeDirectUrl(raw: string): boolean {
  if (/^[a-zA-Z][a-zA-Z\d+\-.]+:/.test(raw)) {
    return true;
  }
  return /^(localhost|(?:\d{1,3}\.){3}\d{1,3}|(?:[\w-]+\.)+[a-z]{2,})(?::\d+)?(?:[/?#].*)?$/i.test(
    raw
  );
}

function normalizeBrowserTarget(raw: string): string {
  const text = raw.trim();
  if (!text) {
    return BROWSER_HOME_URL;
  }
  if (looksLikeLocalFilesystemPath(text)) {
    return `https://www.bing.com/search?q=${encodeURIComponent(text)}`;
  }
  if (looksLikeDirectUrl(text)) {
    return /^[a-zA-Z][a-zA-Z\d+\-.]+:/.test(text) ? text : `https://${text}`;
  }
  return `https://www.bing.com/search?q=${encodeURIComponent(text)}`;
}

function normalizeBrowserExtractedText(raw: string, maxChars: number): string {
  const compact = String(raw ?? "")
    .replace(/\r/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  return compact.length > maxChars
    ? `${compact.slice(0, maxChars)}\n\n... (truncated)`
    : compact;
}

function normalizeBrowserCaptureUiState(raw: unknown): BrowserCaptureUiState {
  const obj =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const tabs = Array.isArray(obj.tabs)
    ? obj.tabs
        .map((tab) => {
          if (!tab || typeof tab !== "object") {
            return null;
          }
          const t = tab as Record<string, unknown>;
          return {
            attached: t.attached === true,
            lastError:
              typeof t.lastError === "string" && t.lastError
                ? t.lastError
                : null,
          };
        })
        .filter((tab): tab is { attached: boolean; lastError: string | null } =>
          Boolean(tab)
        )
    : [];
  return {
    capturing: obj.capturing === true,
    hookEventCount: Math.max(0, Math.floor(Number(obj.hookEventCount) || 0)),
    note: typeof obj.note === "string" ? obj.note : undefined,
    pendingRequestCount: Math.max(
      0,
      Math.floor(Number(obj.pendingRequestCount) || 0)
    ),
    requestCount: Math.max(0, Math.floor(Number(obj.requestCount) || 0)),
    storageHostCount: Math.max(
      0,
      Math.floor(Number(obj.storageHostCount) || 0)
    ),
    tabs,
  };
}

function normalizeHeaderRecord(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object") {
    return {};
  }
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    out[key] = typeof value === "string" ? value : String(value ?? "");
  }
  return out;
}

function normalizeBrowserCaptureRequestSummary(
  raw: unknown
): BrowserCaptureRequestSummaryUi | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const obj = raw as Record<string, unknown>;
  const id = typeof obj.id === "string" ? obj.id : "";
  if (!id) {
    return null;
  }
  const statusRaw = Number(obj.status);
  const durationRaw = Number(obj.durationMs);
  return {
    contentType:
      typeof obj.contentType === "string" && obj.contentType
        ? obj.contentType
        : null,
    durationMs: Number.isFinite(durationRaw) ? durationRaw : null,
    errorText:
      typeof obj.errorText === "string" && obj.errorText ? obj.errorText : null,
    hasRequestBody: obj.hasRequestBody === true,
    hasResponseBody: obj.hasResponseBody === true,
    id,
    method: (typeof obj.method === "string" && obj.method.trim()
      ? obj.method
      : "GET"
    ).toUpperCase(),
    requestBodyTruncated: obj.requestBodyTruncated === true,
    resourceType:
      typeof obj.resourceType === "string" && obj.resourceType
        ? obj.resourceType
        : null,
    responseBodyOmittedReason:
      typeof obj.responseBodyOmittedReason === "string" &&
      obj.responseBodyOmittedReason
        ? obj.responseBodyOmittedReason
        : null,
    responseBodyTruncated: obj.responseBodyTruncated === true,
    seq: Math.max(0, Math.floor(Number(obj.seq) || 0)),
    source: obj.source === "proxy" ? "proxy" : "browser",
    startedAt: Math.max(0, Math.floor(Number(obj.startedAt) || 0)),
    status: Number.isFinite(statusRaw) ? statusRaw : null,
    tabId: typeof obj.tabId === "string" ? obj.tabId : "",
    url: typeof obj.url === "string" ? obj.url : "",
  };
}

function normalizeBrowserCaptureProxyStatus(
  raw: unknown
): BrowserCaptureProxyStatusUi {
  const obj =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const localAddresses = Array.isArray(obj.localAddresses)
    ? obj.localAddresses.filter(
        (item): item is string =>
          typeof item === "string" && Boolean(item.trim())
      )
    : [];
  const portRaw = Number(obj.port);
  const startedAtRaw = Number(obj.startedAt);
  const requestCountRaw = Number(obj.requestCount);
  return {
    caCertPath: typeof obj.caCertPath === "string" ? obj.caCertPath : "",
    caDownloadUrl:
      typeof obj.caDownloadUrl === "string" ? obj.caDownloadUrl : "",
    caInstalled: obj.caInstalled === true,
    caReady: obj.caReady === true,
    httpsMitm: obj.httpsMitm !== false,
    lastError:
      typeof obj.lastError === "string" && obj.lastError ? obj.lastError : null,
    localAddresses,
    ownerHostId:
      typeof obj.ownerHostId === "number" && Number.isFinite(obj.ownerHostId)
        ? Math.floor(obj.ownerHostId)
        : null,
    port: Number.isFinite(portRaw) && portRaw > 0 ? Math.floor(portRaw) : 8888,
    primaryAddress:
      typeof obj.primaryAddress === "string" && obj.primaryAddress.trim()
        ? obj.primaryAddress.trim()
        : (localAddresses[0] ?? "127.0.0.1"),
    proxyUrl: typeof obj.proxyUrl === "string" ? obj.proxyUrl : "",
    requestCount:
      Number.isFinite(requestCountRaw) && requestCountRaw > 0
        ? Math.floor(requestCountRaw)
        : 0,
    running: obj.running === true,
    startedAt:
      Number.isFinite(startedAtRaw) && startedAtRaw > 0
        ? Math.floor(startedAtRaw)
        : null,
    systemProxyEnabled: obj.systemProxyEnabled === true,
  };
}

function normalizeBrowserCaptureList(raw: unknown): BrowserCaptureListUi {
  const obj =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const items = Array.isArray(obj.items)
    ? obj.items
        .map(normalizeBrowserCaptureRequestSummary)
        .filter((item): item is BrowserCaptureRequestSummaryUi => Boolean(item))
    : [];
  return {
    items,
    limit: Math.max(0, Math.floor(Number(obj.limit) || items.length)),
    offset: Math.max(0, Math.floor(Number(obj.offset) || 0)),
    total: Math.max(0, Math.floor(Number(obj.total) || items.length)),
  };
}

function normalizeBrowserCaptureRequestDetail(
  raw: unknown
): BrowserCaptureRequestDetailUi | null {
  const summary = normalizeBrowserCaptureRequestSummary(raw);
  if (!summary || !raw || typeof raw !== "object") {
    return null;
  }
  const obj = raw as Record<string, unknown>;
  return {
    ...summary,
    requestBody: typeof obj.requestBody === "string" ? obj.requestBody : null,
    requestHeaders: normalizeHeaderRecord(obj.requestHeaders),
    responseBody:
      typeof obj.responseBody === "string" ? obj.responseBody : null,
    responseHeaders: normalizeHeaderRecord(obj.responseHeaders),
  };
}

function normalizeBrowserCaptureRequestDetails(
  raw: unknown
): BrowserCaptureRequestDetailUi[] {
  return Array.isArray(raw)
    ? raw
        .map(normalizeBrowserCaptureRequestDetail)
        .filter((item): item is BrowserCaptureRequestDetailUi => Boolean(item))
    : [];
}

function mergeBrowserCaptureRequestSummaries(
  current: BrowserCaptureRequestSummaryUi[],
  next: BrowserCaptureRequestSummaryUi[]
): BrowserCaptureRequestSummaryUi[] {
  const byId = new Map<string, BrowserCaptureRequestSummaryUi>();
  for (const request of current) {
    byId.set(request.id, request);
  }
  for (const request of next) {
    byId.set(request.id, request);
  }
  return Array.from(byId.values()).sort((a, b) => a.seq - b.seq);
}

function browserCaptureUrlHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
}

function browserCaptureUrlPath(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

function browserCaptureFormatDuration(ms: number | null): string {
  if (ms == null) {
    return "--";
  }
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
}

function browserCaptureFormatBody(raw: string | null): string {
  if (!raw) {
    return "";
  }
  const text = raw.trim();
  if (!text) {
    return "";
  }
  if (text.startsWith("{") || text.startsWith("[")) {
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      return raw;
    }
  }
  return raw;
}

function browserCaptureFormatHeaders(headers: Record<string, string>): string {
  return Object.entries(headers)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

function browserCaptureHeaderValue(
  headers: Record<string, string>,
  name: string
): string {
  const lowerName = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }
  return "";
}

function browserCaptureHarHeaders(
  headers: Record<string, string>
): Array<{ name: string; value: string }> {
  return Object.entries(headers)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, value]) => ({ name, value }));
}

function browserCaptureHarQueryString(
  rawUrl: string
): Array<{ name: string; value: string }> {
  try {
    const parsed = new URL(rawUrl);
    return Array.from(parsed.searchParams.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  } catch {
    return [];
  }
}

function browserCaptureQuoteCurlArg(value: string): string {
  return `'${String(value ?? "").replace(/'/g, "'\\''")}'`;
}

function browserCaptureBuildCurl(
  request: BrowserCaptureRequestDetailUi
): string {
  const method = request.method.toUpperCase();
  const lines = [`curl ${browserCaptureQuoteCurlArg(request.url)}`];
  if (method && method !== "GET") {
    lines.push(`  -X ${method}`);
  }
  for (const [key, value] of Object.entries(request.requestHeaders).sort(
    ([left], [right]) => left.localeCompare(right)
  )) {
    if (key.toLowerCase() === "content-length") {
      continue;
    }
    lines.push(`  -H ${browserCaptureQuoteCurlArg(`${key}: ${value}`)}`);
  }
  if (request.requestBody) {
    lines.push(
      `  --data-raw ${browserCaptureQuoteCurlArg(request.requestBody)}`
    );
  }
  return lines.join(" \\\n");
}

const BROWSER_CAPTURE_AGENT_REQUEST_LIMIT = 16;
const BROWSER_CAPTURE_AGENT_BODY_LIMIT = 1200;

function browserCaptureTrimForAgent(
  text: string,
  maxChars: number = BROWSER_CAPTURE_AGENT_BODY_LIMIT
): string {
  const value = String(text ?? "").trim();
  if (!value) {
    return "";
  }
  if (value.length <= maxChars) {
    return value;
  }
  return `${value.slice(0, maxChars).trimEnd()}\n[truncated ${value.length - maxChars} chars]`;
}

function browserCaptureBuildAgentDraft(
  requests: BrowserCaptureRequestDetailUi[],
  scopeLabel: string,
  t: TFunction
): string {
  const visibleRequests = requests.slice(
    0,
    BROWSER_CAPTURE_AGENT_REQUEST_LIMIT
  );
  const lines = [
    t("app.browserCaptureAgentDraftIntro"),
    "",
    t("app.browserCaptureAgentDraftScope", { scope: scopeLabel }),
    t("app.browserCaptureAgentDraftTotal", { count: String(requests.length) }),
    "",
  ];
  visibleRequests.forEach((request, index) => {
    const status =
      request.status == null
        ? request.errorText
          ? "ERR"
          : "pending"
        : String(request.status);
    const contentType =
      request.contentType ??
      browserCaptureHeaderValue(request.responseHeaders, "content-type");
    const requestBody = browserCaptureTrimForAgent(
      browserCaptureFormatBody(request.requestBody),
      900
    );
    const responseBody = browserCaptureTrimForAgent(
      browserCaptureFormatBody(request.responseBody)
    );
    lines.push(
      `${index + 1}. #${request.seq} ${request.method.toUpperCase()} ${status} ${browserCaptureFormatDuration(
        request.durationMs
      )}`
    );
    lines.push(`   URL: ${request.url}`);
    lines.push(
      `   Source: ${request.source === "proxy" ? "external-device proxy" : "built-in browser"}; Type: ${
        request.resourceType ?? "--"
      }${contentType ? `; ${contentType}` : ""}`
    );
    if (request.errorText) {
      lines.push(`   Error: ${request.errorText}`);
    }
    if (requestBody) {
      lines.push(`   Request body:\n${requestBody}`);
    }
    if (responseBody) {
      lines.push(`   Response body:\n${responseBody}`);
    } else if (request.responseBodyOmittedReason) {
      lines.push(`   Response body: ${request.responseBodyOmittedReason}`);
    }
    lines.push("");
  });
  if (requests.length > visibleRequests.length) {
    lines.push(
      t("app.browserCaptureAgentDraftOmitted", {
        count: String(requests.length - visibleRequests.length),
      })
    );
  }
  return lines.join("\n").trim();
}

function browserCaptureBuildJsonExport(
  requests: BrowserCaptureRequestDetailUi[],
  scope: Record<string, unknown>
): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      requestCount: requests.length,
      requests,
      scope,
      source: "mAI Coder browser capture",
      version: 1,
    },
    null,
    2
  );
}

function browserCaptureBuildHarExport(
  requests: BrowserCaptureRequestDetailUi[]
): string {
  return JSON.stringify(
    {
      log: {
        creator: {
          name: "mAI Coder browser capture",
          version: "1.0",
        },
        entries: requests.map((request) => {
          const requestBody = request.requestBody ?? "";
          const responseBody = request.responseBody ?? "";
          const contentType =
            request.contentType ??
            browserCaptureHeaderValue(request.responseHeaders, "content-type");
          const requestContentType = browserCaptureHeaderValue(
            request.requestHeaders,
            "content-type"
          );
          const durationMs = request.durationMs ?? 0;
          return {
            cache: {},
            request: {
              bodySize: requestBody.length,
              cookies: [],
              headers: browserCaptureHarHeaders(request.requestHeaders),
              headersSize: -1,
              httpVersion: "HTTP/1.1",
              method: request.method,
              queryString: browserCaptureHarQueryString(request.url),
              url: request.url,
              ...(requestBody
                ? {
                    postData: {
                      mimeType: requestContentType,
                      text: requestBody,
                    },
                  }
                : {}),
            },
            response: {
              bodySize: responseBody.length,
              content: {
                mimeType: contentType,
                size: responseBody.length,
                ...(responseBody ? { text: responseBody } : {}),
              },
              cookies: [],
              headers: browserCaptureHarHeaders(request.responseHeaders),
              headersSize: -1,
              httpVersion: "HTTP/1.1",
              redirectURL: browserCaptureHeaderValue(
                request.responseHeaders,
                "location"
              ),
              status: request.status ?? 0,
              statusText: request.errorText ?? "",
            },
            startedDateTime: new Date(
              request.startedAt || Date.now()
            ).toISOString(),
            time: durationMs,
            timings: {
              blocked: -1,
              connect: -1,
              dns: -1,
              receive: 0,
              send: 0,
              ssl: -1,
              wait: durationMs,
            },
            ...(request.errorText ? { comment: request.errorText } : {}),
          };
        }),
        pages: [],
        version: "1.2",
      },
    },
    null,
    2
  );
}

function browserCaptureDownloadTextFile(
  fileName: string,
  mimeType: string,
  text: string
): void {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

function browserCaptureExportFileName(format: "json" | "har"): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `async-browser-capture-${stamp}.${format}`;
}

function clampBrowserCaptureDockHeight(
  value: number,
  maxHeight: number = BROWSER_CAPTURE_DOCK_MAX_HEIGHT
): number {
  const numeric = Number.isFinite(value)
    ? value
    : BROWSER_CAPTURE_DOCK_DEFAULT_HEIGHT;
  return Math.min(
    Math.max(Math.round(numeric), BROWSER_CAPTURE_DOCK_MIN_HEIGHT),
    maxHeight
  );
}

async function notifyBrowserCommandResult(
  shell: NonNullable<Window["maiShell"]> | undefined,
  payload: BrowserCommandResultPayload
): Promise<void> {
  if (!shell) {
    return;
  }
  try {
    await shell.invoke("browser:commandResult", payload);
  } catch {
    /* ignore */
  }
}

type BrowserTab = {
  id: string;
  requestedUrl: string;
  currentUrl: string;
  draftUrl: string;
  pageTitle: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  loadError: { message: string; url: string } | null;
};

let browserTabSeq = 0;
function createBrowserTab(url: string = BROWSER_HOME_URL): BrowserTab {
  browserTabSeq += 1;
  return {
    canGoBack: false,
    canGoForward: false,
    currentUrl: url,
    draftUrl: url,
    id: `browser-tab-${Date.now().toString(36)}-${browserTabSeq}`,
    isLoading: true,
    loadError: null,
    pageTitle: "",
    requestedUrl: url,
  };
}

const BrowserTabView = memo(
  function BrowserTabView({
    tab,
    partition,
    userAgent,
    fingerprintScript,
    active,
    hookEnabled,
    hookScript,
    onHookEvents,
    onStorageSnapshot,
    t,
    onNavigate,
    onTitle,
    onLoading,
    onFailLoad,
    onRegisterWebview,
  }: {
    tab: BrowserTab;
    partition: string;
    userAgent?: string;
    fingerprintScript: string | null;
    active: boolean;
    hookEnabled: boolean;
    hookScript: string;
    onHookEvents: (tabId: string, events: unknown[]) => void;
    onStorageSnapshot: (tabId: string, snapshot: unknown) => void;
    t: TFunction;
    onNavigate: (
      id: string,
      patch: { currentUrl: string; canGoBack: boolean; canGoForward: boolean }
    ) => void;
    onTitle: (id: string, title: string) => void;
    onLoading: (id: string, isLoading: boolean, currentUrl?: string) => void;
    onFailLoad: (id: string, error: { message: string; url: string }) => void;
    onRegisterWebview: (
      id: string,
      node: MaiShellWebviewElement | null
    ) => void;
  }) {
    const webviewRef = useRef<MaiShellWebviewElement | null>(null);
    const fingerprintScriptRef = useRef<string | null>(null);
    fingerprintScriptRef.current = fingerprintScript;
    const hookScriptRef = useRef<string>(hookScript);
    hookScriptRef.current = hookScript;
    const cursorScriptRef = useRef<string>(humanCursorInitScript());
    const hookEnabledRef = useRef<boolean>(hookEnabled);
    hookEnabledRef.current = hookEnabled;
    const onHookEventsRef =
      useRef<(tabId: string, events: unknown[]) => void>(onHookEvents);
    onHookEventsRef.current = onHookEvents;
    const onStorageSnapshotRef =
      useRef<(tabId: string, snapshot: unknown) => void>(onStorageSnapshot);
    onStorageSnapshotRef.current = onStorageSnapshot;
    const tabIdRef = useRef(tab.id);
    const [webviewSize, setWebviewSize] = useState<{
      width: number;
      height: number;
    } | null>(null);
    tabIdRef.current = tab.id;

    const syncWebviewSize = useCallback(() => {
      const node = webviewRef.current;
      const host = node?.parentElement;
      if (!node || !(host instanceof HTMLElement)) {
        return;
      }
      const nextWidth = Math.max(1, Math.round(host.clientWidth));
      const nextHeight = Math.max(1, Math.round(host.clientHeight));
      setWebviewSize((prev) => {
        if (prev && prev.width === nextWidth && prev.height === nextHeight) {
          return prev;
        }
        return { height: nextHeight, width: nextWidth };
      });
    }, []);

    const assignWebviewRef = useCallback(
      (node: MaiShellWebviewElement | null) => {
        webviewRef.current = node;
        try {
          onRegisterWebview(tabIdRef.current, node);
        } catch (err) {
          console.error("[BrowserTab] error in onRegisterWebview:", err);
        }
      },
      [onRegisterWebview]
    );

    useEffect(() => {
      const node = webviewRef.current;
      if (!node) {
        return;
      }

      const readNavState = () => {
        try {
          return {
            canGoBack: Boolean(node.canGoBack?.()),
            canGoForward: Boolean(node.canGoForward?.()),
          };
        } catch {
          return { canGoBack: false, canGoForward: false };
        }
      };

      const handleStartLoading = () => {
        onLoading(tabIdRef.current, true);
        // Pre-inject the fingerprint stealth as early as we can. dom-ready
        // runs after the parser meets <body>, which is too late for sites
        // that read navigator.platform / userAgent in their first inline
        // script. did-start-loading fires before the network request, so
        // the script runs in an isolated world and the next document load
        // inherits the patches via the webview's persistent JS context.
        const fpScript = fingerprintScriptRef.current;
        if (fpScript) {
          void node.executeJavaScript(fpScript, false).catch(() => {
            /* webview might not have a render frame yet on cold start */
          });
        }
        void node
          .executeJavaScript(cursorScriptRef.current, false)
          .catch(() => {
            /* cursor script is decorative, ignore failures */
          });
      };
      const handleStopLoading = () => {
        onLoading(tabIdRef.current, false, safeGetWebviewUrl(node));
      };
      const handleNavigate = (event: Event) => {
        const navEvent = event as BrowserNavEvent;
        if (navEvent.isMainFrame === false) {
          return;
        }
        const url = String(
          navEvent.url ?? safeGetWebviewUrl(node) ?? ""
        ).trim();
        const { canGoBack, canGoForward } = readNavState();
        onNavigate(tabIdRef.current, {
          canGoBack,
          canGoForward,
          currentUrl: url,
        });
      };
      const handleTitleUpdated = (event: Event) => {
        onTitle(
          tabIdRef.current,
          String((event as BrowserTitleEvent).title ?? "").trim()
        );
      };
      const handleDomReady = () => {
        const { canGoBack, canGoForward } = readNavState();
        onNavigate(tabIdRef.current, {
          canGoBack,
          canGoForward,
          currentUrl: safeGetWebviewUrl(node),
        });
        const fpScript = fingerprintScriptRef.current;
        if (fpScript) {
          void node.executeJavaScript(fpScript, false).catch(() => {
            /* ignore */
          });
        }
        void node
          .executeJavaScript(cursorScriptRef.current, false)
          .catch(() => {
            /* cursor script is decorative, ignore failures */
          });
        if (hookEnabledRef.current && hookScriptRef.current) {
          void node
            .executeJavaScript(hookScriptRef.current, false)
            .catch(() => {
              /* ignore */
            });
        }
      };
      const handleFailLoad = (event: Event) => {
        const failEvent = event as BrowserFailEvent;
        if (failEvent.isMainFrame === false || failEvent.errorCode === -3) {
          return;
        }
        const failedUrl = String(
          failEvent.validatedURL ?? safeGetWebviewUrl(node) ?? ""
        ).trim();
        onFailLoad(tabIdRef.current, {
          message: String(
            failEvent.errorDescription ?? t("app.browserLoadFailed")
          ),
          url: failedUrl,
        });
      };

      node.addEventListener("dom-ready", handleDomReady);
      node.addEventListener("did-start-loading", handleStartLoading);
      node.addEventListener("did-stop-loading", handleStopLoading);
      node.addEventListener("did-navigate", handleNavigate);
      node.addEventListener("did-navigate-in-page", handleNavigate);
      node.addEventListener("page-title-updated", handleTitleUpdated);
      node.addEventListener("did-fail-load", handleFailLoad);

      return () => {
        node.removeEventListener("dom-ready", handleDomReady);
        node.removeEventListener("did-start-loading", handleStartLoading);
        node.removeEventListener("did-stop-loading", handleStopLoading);
        node.removeEventListener("did-navigate", handleNavigate);
        node.removeEventListener("did-navigate-in-page", handleNavigate);
        node.removeEventListener("page-title-updated", handleTitleUpdated);
        node.removeEventListener("did-fail-load", handleFailLoad);
      };
    }, [partition, onLoading, onNavigate, onTitle, onFailLoad]);

    useEffect(() => {
      if (!hookEnabled) {
        return;
      }
      let cancelled = false;
      const drain = async () => {
        const node = webviewRef.current;
        if (!node || cancelled) {
          return;
        }
        try {
          const events = await node.executeJavaScript<unknown>(
            "(function(){ try { return window.__asyncDrainHooks ? window.__asyncDrainHooks() : []; } catch(_) { return []; } })()",
            false
          );
          if (cancelled) {
            return;
          }
          if (Array.isArray(events) && events.length > 0) {
            onHookEventsRef.current(tabIdRef.current, events as unknown[]);
          }
        } catch {
          /* page may not be ready */
        }
      };
      const interval = window.setInterval(drain, 1500);
      void drain();
      return () => {
        cancelled = true;
        window.clearInterval(interval);
      };
    }, [hookEnabled, tab.id]);

    useEffect(() => {
      if (!hookEnabled) {
        return;
      }
      let cancelled = false;
      const collectScript = `(function(){
			try {
				var url = location && location.href || '';
				var host = '';
				try { host = new URL(url).hostname; } catch(_) {}
				var collect = function(store) {
					var out = [];
					if (!store) return out;
					try {
						for (var i = 0; i < store.length; i++) {
							var key = store.key(i);
							if (!key) continue;
							var value = '';
							try { value = store.getItem(key) || ''; } catch(_) {}
							out.push({ key: key, value: value });
							if (out.length > 200) break;
						}
					} catch(_) {}
					return out;
				};
				return {
					url: url,
					host: host,
					ts: Date.now(),
					cookies: typeof document !== 'undefined' ? (document.cookie || '') : '',
					localStorage: collect(window.localStorage),
					sessionStorage: collect(window.sessionStorage),
				};
			} catch(_) { return null; }
		})()`;
      const collect = async () => {
        const node = webviewRef.current;
        if (!node || cancelled) return;
        try {
          const snapshot = await node.executeJavaScript<unknown>(
            collectScript,
            false
          );
          if (cancelled || !snapshot) return;
          onStorageSnapshotRef.current(tabIdRef.current, snapshot);
        } catch {
          /* page not ready or restricted */
        }
      };
      const interval = window.setInterval(collect, 5000);
      const initial = window.setTimeout(collect, 800);
      return () => {
        cancelled = true;
        window.clearInterval(interval);
        window.clearTimeout(initial);
      };
    }, [hookEnabled, tab.id]);

    useEffect(() => {
      const node = webviewRef.current;
      const host = node?.parentElement;
      if (!node || !(host instanceof HTMLElement)) {
        return;
      }
      syncWebviewSize();
      const frameId = window.requestAnimationFrame(() => {
        syncWebviewSize();
      });
      const observer =
        typeof ResizeObserver === "undefined"
          ? null
          : new ResizeObserver(() => {
              syncWebviewSize();
            });
      observer?.observe(host);
      const onWindowResize = () => {
        syncWebviewSize();
      };
      window.addEventListener("resize", onWindowResize);
      return () => {
        window.cancelAnimationFrame(frameId);
        observer?.disconnect();
        window.removeEventListener("resize", onWindowResize);
      };
    }, [active, syncWebviewSize, tab.id]);

    const webviewProps = {
      className: `ref-browser-webview${active ? "" : " is-hidden"}`,
      onLoad: () => console.log("[BrowserTab] webview onLoad event fired"),
      partition,
      ref: assignWebviewRef,
      src: tab.requestedUrl,
      style: webviewSize
        ? { height: `${webviewSize.height}px`, width: `${webviewSize.width}px` }
        : { height: "100%", width: "100%" },
      useragent: userAgent,
      // allowpopups retiré: les popups sont gérées via setWindowOpenHandler (deny + forward).
      // allowpopups=true laissait le contenu web ouvrir des fenêtres non filtrées.
    };
    return <webview {...webviewProps} />;
  },
  (prevProps, nextProps) => {
    // 自定义比较：忽略 t 的变化，只比较关键属性，防止频繁卸载
    const comparisons = {
      activeSame: prevProps.active === nextProps.active,
      canGoBackSame: prevProps.tab.canGoBack === nextProps.tab.canGoBack,
      canGoForwardSame:
        prevProps.tab.canGoForward === nextProps.tab.canGoForward,
      currentUrlSame: prevProps.tab.currentUrl === nextProps.tab.currentUrl,
      fingerprintScriptSame:
        prevProps.fingerprintScript === nextProps.fingerprintScript,
      isLoadingSame: prevProps.tab.isLoading === nextProps.tab.isLoading,
      partitionSame: prevProps.partition === nextProps.partition,
      requestedUrlSame:
        prevProps.tab.requestedUrl === nextProps.tab.requestedUrl,
      tabIdSame: prevProps.tab.id === nextProps.tab.id,
      userAgentSame: prevProps.userAgent === nextProps.userAgent,
    };

    const same = Object.values(comparisons).every(Boolean);

    return same;
  }
);

const AgentRightSidebarBrowserPanel = memo(
  function AgentRightSidebarBrowserPanel({
    hasAgentPlanSidebarContent,
    closeSidebar,
    openView,
    onOpenBrowserSettings,
    pendingCommand,
    onCommandHandled,
    variant = "sidebar",
  }: {
    hasAgentPlanSidebarContent: boolean;
    closeSidebar: () => void;
    openView: (view: AgentRightSidebarView) => void;
    onOpenBrowserSettings: () => void;
    pendingCommand: BrowserControlPayload | null;
    onCommandHandled: (commandId: string) => void;
    variant?: "sidebar" | "window";
  }) {
    const { t, shell } = useAppShellChromeCore();
    const webviewsRef = useRef<Map<string, MaiShellWebviewElement>>(new Map());
    const addressInputRef = useRef<HTMLInputElement | null>(null);
    const defaultUserAgentRef = useRef("");

    const initialTab = useMemo(() => createBrowserTab(), []);
    const [tabs, setTabs] = useState<BrowserTab[]>([initialTab]);
    const [activeTabId, setActiveTabId] = useState<string>(initialTab.id);
    const tabsRef = useRef(tabs);
    tabsRef.current = tabs;
    const activeTabIdRef = useRef(activeTabId);
    activeTabIdRef.current = activeTabId;

    const [browserPartition, setBrowserPartition] = useState("");
    const [browserConfigReady, setBrowserConfigReady] = useState(false);
    const [browserConfig, setBrowserConfig] =
      useState<BrowserSidebarSettingsConfig>(DEFAULT_BROWSER_SIDEBAR_CONFIG);
    const [captureState, setCaptureState] =
      useState<BrowserCaptureUiState | null>(null);
    const [captureBusy, setCaptureBusy] = useState<
      "start" | "stop" | "clear" | null
    >(null);
    const [captureError, setCaptureError] = useState<string | null>(null);
    const [googleLoginNotice, setGoogleLoginNotice] = useState<
      { kind: "info"; url: string } | { kind: "error"; message: string } | null
    >(null);
    const [capturePanelExpanded, setCapturePanelExpanded] = useState(() => {
      try {
        const stored = window.localStorage.getItem(
          BROWSER_CAPTURE_DOCK_EXPANDED_KEY
        );
        return stored == null ? false : stored !== "0";
      } catch {
        return false;
      }
    });
    const [captureDockHeight, setCaptureDockHeight] = useState(() => {
      try {
        return clampBrowserCaptureDockHeight(
          Number(window.localStorage.getItem(BROWSER_CAPTURE_DOCK_HEIGHT_KEY))
        );
      } catch {
        return BROWSER_CAPTURE_DOCK_DEFAULT_HEIGHT;
      }
    });
    const [capturePanelTab, setCapturePanelTab] =
      useState<BrowserCapturePanelTab>(() => {
        try {
          const stored = window.localStorage.getItem(
            BROWSER_CAPTURE_DOCK_TAB_KEY
          );
          return stored === "devices" ||
            stored === "hooks" ||
            stored === "storage"
            ? (stored as BrowserCapturePanelTab)
            : "requests";
        } catch {
          return "requests";
        }
      });
    const [captureQuery, setCaptureQuery] = useState("");
    const [captureStatusFilter, setCaptureStatusFilter] =
      useState<BrowserCaptureStatusFilter>("all");
    const [captureSourceFilter, setCaptureSourceFilter] =
      useState<BrowserCaptureSourceFilter>("all");
    const [captureMethodFilter, setCaptureMethodFilter] =
      useState<BrowserCaptureMethodFilter>("all");
    const [captureResourceFilter, setCaptureResourceFilter] =
      useState<BrowserCaptureResourceFilter>("all");
    const [captureRequests, setCaptureRequests] = useState<
      BrowserCaptureRequestSummaryUi[]
    >([]);
    const [captureRequestTotal, setCaptureRequestTotal] = useState(0);
    const [captureListBusy, setCaptureListBusy] = useState(false);
    const [captureListError, setCaptureListError] = useState<string | null>(
      null
    );
    const captureRequestsRef = useRef<BrowserCaptureRequestSummaryUi[]>([]);
    const captureListRequestSeqRef = useRef(0);
    const [selectedCaptureRequestIds, setSelectedCaptureRequestIds] = useState<
      Set<string>
    >(() => new Set());
    const [selectedCaptureRequestId, setSelectedCaptureRequestId] = useState<
      string | null
    >(null);
    const [selectedCaptureRequest, setSelectedCaptureRequest] =
      useState<BrowserCaptureRequestDetailUi | null>(null);
    const [selectedCaptureBusy, setSelectedCaptureBusy] = useState(false);
    const [captureDetailTab, setCaptureDetailTab] =
      useState<BrowserCaptureDetailTab>("headers");
    const [captureExportBusy, setCaptureExportBusy] =
      useState<BrowserCaptureExportAction | null>(null);
    const [captureExportError, setCaptureExportError] = useState<string | null>(
      null
    );
    const [copiedCaptureField, setCopiedCaptureField] = useState<string | null>(
      null
    );
    const copiedCaptureFieldTimerRef = useRef<number | null>(null);
    const captureSelectAllRef = useRef<HTMLInputElement | null>(null);
    const [captureProxyStatus, setCaptureProxyStatus] =
      useState<BrowserCaptureProxyStatusUi | null>(null);
    const [captureProxyBusy, setCaptureProxyBusy] =
      useState<BrowserCaptureProxyBusy | null>(null);
    const [captureProxyError, setCaptureProxyError] = useState<string | null>(
      null
    );
    const [captureDetailVisible, setCaptureDetailVisible] = useState<boolean>(
      () => {
        try {
          const stored = window.localStorage.getItem(
            BROWSER_CAPTURE_DETAIL_VISIBLE_KEY
          );
          return stored == null ? true : stored !== "0";
        } catch {
          return true;
        }
      }
    );
    const [captureExportMenuOpen, setCaptureExportMenuOpen] = useState(false);
    const captureExportMenuRef = useRef<HTMLDivElement | null>(null);
    const [captureHookEvents, setCaptureHookEvents] = useState<
      BrowserCaptureHookEventUi[]
    >([]);
    const [captureHookEventTotal, setCaptureHookEventTotal] = useState(0);
    const [captureHookCategoryFilter, setCaptureHookCategoryFilter] =
      useState<string>("all");
    const [captureHookQuery, setCaptureHookQuery] = useState("");
    const [captureStorageSnapshots, setCaptureStorageSnapshots] = useState<
      BrowserCaptureStorageSnapshotUi[]
    >([]);
    const [captureStorageActiveHost, setCaptureStorageActiveHost] = useState<
      string | null
    >(null);
    const [captureSessionsList, setCaptureSessionsList] = useState<
      BrowserCaptureSessionSummaryUi[]
    >([]);
    const [captureSessionsMenuOpen, setCaptureSessionsMenuOpen] =
      useState(false);
    const [captureSessionsSaveName, setCaptureSessionsSaveName] = useState("");
    const [captureSessionsBusy, setCaptureSessionsBusy] = useState<
      "save" | "load" | "delete" | null
    >(null);
    const captureSessionsMenuRef = useRef<HTMLDivElement | null>(null);
    const [captureAnalyzeMenuOpen, setCaptureAnalyzeMenuOpen] = useState(false);
    const [captureAnalyzeBusy, setCaptureAnalyzeBusy] = useState(false);
    const captureAnalyzeMenuRef = useRef<HTMLDivElement | null>(null);
    const [captureRecentAnalyses, setCaptureRecentAnalyses] = useState<
      BrowserCaptureAnalysisRecordUi[]
    >([]);
    const browserHookScript = useMemo(() => getBrowserHookScript(), []);
    const [clearDataConfirmOpen, setClearDataConfirmOpen] = useState(false);
    const [clearDataBusy, setClearDataBusy] = useState(false);
    const [clearDataError, setClearDataError] = useState<string | null>(null);
    const captureIsActive = captureState?.capturing === true;

    const applyBrowserConfigLocally = useCallback(
      (
        rawConfig: Partial<BrowserSidebarSettingsConfig>,
        defaultUserAgent?: string
      ) => {
        let nextConfig = DEFAULT_BROWSER_SIDEBAR_CONFIG;
        setBrowserConfig((prev) => {
          nextConfig = normalizeBrowserSidebarConfig(rawConfig, prev);
          return nextConfig;
        });
        if (typeof defaultUserAgent === "string") {
          defaultUserAgentRef.current = defaultUserAgent.trim();
        }
        const nextUserAgent =
          nextConfig.userAgent.trim() || defaultUserAgentRef.current;
        webviewsRef.current.forEach((node) => {
          if (nextUserAgent) {
            try {
              node.setUserAgent(nextUserAgent);
            } catch {
              /* ignore */
            }
          }
          try {
            node.reload();
          } catch {
            /* ignore */
          }
        });
        setTabs((prev) => prev.map((tab) => ({ ...tab, loadError: null })));
      },
      []
    );

    const refreshBrowserCaptureState = useCallback(async () => {
      if (!shell) {
        return;
      }
      try {
        const payload = (await shell.invoke("browserCapture:getState")) as {
          ok?: boolean;
          state?: unknown;
        };
        if (payload?.ok) {
          setCaptureState(normalizeBrowserCaptureUiState(payload.state));
          setCaptureError(null);
        }
      } catch (error) {
        setCaptureError(error instanceof Error ? error.message : String(error));
      }
    }, [shell]);

    const runBrowserCaptureAction = useCallback(
      async (action: "start" | "stop" | "clear") => {
        if (!shell || captureBusy) {
          return;
        }
        setCaptureBusy(action);
        setCaptureError(null);
        try {
          const channel =
            action === "start"
              ? "browserCapture:start"
              : action === "stop"
                ? "browserCapture:stop"
                : "browserCapture:clear";
          const payload = (await shell.invoke(
            channel,
            action === "start" ? { clear: true } : undefined
          )) as {
            ok?: boolean;
            state?: unknown;
            error?: unknown;
          };
          if (!payload?.ok) {
            throw new Error(
              String(payload?.error ?? t("app.browserCaptureFailed"))
            );
          }
          setCaptureState(normalizeBrowserCaptureUiState(payload.state));
          if (action === "start") {
            setCapturePanelExpanded(true);
          }
          if (action === "clear" || action === "start") {
            captureListRequestSeqRef.current += 1;
            captureRequestsRef.current = [];
            setCaptureRequests([]);
            setCaptureRequestTotal(0);
            setCaptureListBusy(false);
            setSelectedCaptureRequestIds(new Set());
            setSelectedCaptureRequestId(null);
            setSelectedCaptureRequest(null);
            setCaptureExportError(null);
          }
        } catch (error) {
          setCaptureError(
            error instanceof Error ? error.message : String(error)
          );
        } finally {
          setCaptureBusy(null);
        }
      },
      [captureBusy, shell, t]
    );

    const refreshBrowserCaptureProxyStatus = useCallback(async () => {
      if (!shell) {
        return;
      }
      try {
        // First refresh server-side hints (CA installed, system proxy enabled).
        await shell.invoke("browserCapture:proxyCaRefresh").catch(() => {
          /* refresh hints best-effort */
        });
        const payload = (await shell.invoke("browserCapture:proxyStatus")) as {
          ok?: boolean;
          status?: unknown;
          error?: unknown;
        };
        if (!payload?.ok) {
          throw new Error(
            String(payload?.error ?? t("app.browserCaptureProxyFailed"))
          );
        }
        setCaptureProxyStatus(
          normalizeBrowserCaptureProxyStatus(payload.status)
        );
        setCaptureProxyError(null);
      } catch (error) {
        setCaptureProxyError(
          error instanceof Error ? error.message : String(error)
        );
      }
    }, [shell, t]);

    const runBrowserCaptureProxyAction = useCallback(
      async (action: "start" | "stop", options?: { systemProxy?: boolean }) => {
        if (!shell || captureProxyBusy || captureBusy) {
          return;
        }
        setCaptureProxyBusy(action);
        setCaptureProxyError(null);
        try {
          if (action === "start" && !captureIsActive) {
            const capturePayload = (await shell.invoke("browserCapture:start", {
              clear: false,
            })) as {
              ok?: boolean;
              state?: unknown;
              error?: unknown;
            };
            if (!capturePayload?.ok) {
              throw new Error(
                String(capturePayload?.error ?? t("app.browserCaptureFailed"))
              );
            }
            setCaptureState(
              normalizeBrowserCaptureUiState(capturePayload.state)
            );
          }
          const payload = (await shell.invoke(
            action === "start"
              ? "browserCapture:proxyStart"
              : "browserCapture:proxyStop",
            action === "start"
              ? {
                  port: captureProxyStatus?.port ?? 8888,
                  systemProxy: options?.systemProxy === true,
                }
              : undefined
          )) as {
            ok?: boolean;
            status?: unknown;
            error?: unknown;
            systemProxyError?: string;
          };
          if (!payload?.ok) {
            throw new Error(
              String(payload?.error ?? t("app.browserCaptureProxyFailed"))
            );
          }
          setCaptureProxyStatus(
            normalizeBrowserCaptureProxyStatus(payload.status)
          );
          if (
            typeof payload.systemProxyError === "string" &&
            payload.systemProxyError
          ) {
            setCaptureProxyError(payload.systemProxyError);
          }
          setCapturePanelExpanded(true);
          await refreshBrowserCaptureState();
        } catch (error) {
          setCaptureProxyError(
            error instanceof Error ? error.message : String(error)
          );
        } finally {
          setCaptureProxyBusy(null);
        }
      },
      [
        captureBusy,
        captureIsActive,
        captureProxyBusy,
        captureProxyStatus?.port,
        refreshBrowserCaptureState,
        shell,
        t,
      ]
    );

    const toggleSystemProxy = useCallback(
      async (next: boolean) => {
        if (!shell || captureProxyBusy) {
          return;
        }
        setCaptureProxyBusy("refresh");
        setCaptureProxyError(null);
        try {
          const payload = (await shell.invoke(
            "browserCapture:proxySystemProxyToggle",
            { enable: next }
          )) as {
            ok?: boolean;
            status?: unknown;
            error?: unknown;
          };
          if (!payload?.ok) {
            throw new Error(
              String(payload?.error ?? t("app.browserCaptureProxyFailed"))
            );
          }
          if (payload.status) {
            setCaptureProxyStatus(
              normalizeBrowserCaptureProxyStatus(payload.status)
            );
          }
        } catch (error) {
          setCaptureProxyError(
            error instanceof Error ? error.message : String(error)
          );
        } finally {
          setCaptureProxyBusy(null);
        }
      },
      [captureProxyBusy, shell, t]
    );

    const installBrowserCaptureProxyCa = useCallback(
      async (uninstall = false, scope: "user" | "machine" = "user") => {
        if (!shell || captureProxyBusy) {
          return;
        }
        const confirmKey = uninstall
          ? "app.browserCaptureCaUninstallConfirm"
          : scope === "machine"
            ? "app.browserCaptureCaInstallMachineConfirm"
            : "app.browserCaptureCaInstallConfirm";
        const fallbackMsg = uninstall
          ? "Remove the mAI Coder capture root certificate from the trust store?"
          : scope === "machine"
            ? "Install the mAI Coder capture root CA system-wide? This requires administrator rights."
            : "Install the mAI Coder capture root CA into your user trust store? Windows/macOS will ask you to confirm.";
        const message = (() => {
          const localized = t(confirmKey);
          return localized && localized !== confirmKey
            ? localized
            : fallbackMsg;
        })();
        if (
          typeof window !== "undefined" &&
          typeof window.confirm === "function"
        ) {
          if (!window.confirm(message)) {
            return;
          }
        }
        setCaptureProxyBusy("ca");
        setCaptureProxyError(null);
        try {
          const channel = uninstall
            ? "browserCapture:proxyCaUninstall"
            : "browserCapture:proxyCaInstall";
          const payload = (await shell.invoke(channel, { scope })) as {
            ok?: boolean;
            installed?: boolean;
            error?: unknown;
          };
          if (!payload?.ok) {
            throw new Error(
              String(payload?.error ?? t("app.browserCaptureProxyCaFailed"))
            );
          }
          await refreshBrowserCaptureProxyStatus();
        } catch (error) {
          setCaptureProxyError(
            error instanceof Error ? error.message : String(error)
          );
        } finally {
          setCaptureProxyBusy(null);
        }
      },
      [captureProxyBusy, refreshBrowserCaptureProxyStatus, shell, t]
    );

    const copyBrowserCaptureProxySnippet = useCallback(
      async (kind: "curl" | "wget" | "python" | "node" | "env") => {
        if (!shell) {
          return;
        }
        try {
          const payload = (await shell.invoke(
            "browserCapture:proxyCopySnippet",
            { kind }
          )) as {
            ok?: boolean;
            snippet?: string;
            error?: unknown;
          };
          if (!payload?.ok) {
            throw new Error(String(payload?.error ?? "copy failed"));
          }
          setCopiedCaptureField(`snippet:${kind}`);
          if (copiedCaptureFieldTimerRef.current != null) {
            window.clearTimeout(copiedCaptureFieldTimerRef.current);
          }
          copiedCaptureFieldTimerRef.current = window.setTimeout(() => {
            setCopiedCaptureField(null);
            copiedCaptureFieldTimerRef.current = null;
          }, 1400);
        } catch (error) {
          setCaptureProxyError(
            error instanceof Error ? error.message : String(error)
          );
        }
      },
      [shell]
    );

    const exportBrowserCaptureProxyCa = useCallback(async () => {
      if (!shell || captureProxyBusy) {
        return;
      }
      setCaptureProxyBusy("ca");
      setCaptureProxyError(null);
      try {
        const payload = (await shell.invoke(
          "browserCapture:proxyExportCa"
        )) as {
          ok?: boolean;
          ca?: unknown;
          error?: unknown;
        };
        if (!payload?.ok || !payload.ca || typeof payload.ca !== "object") {
          throw new Error(
            String(payload?.error ?? t("app.browserCaptureProxyCaFailed"))
          );
        }
        const ca = payload.ca as Record<string, unknown>;
        const pem = typeof ca.pem === "string" ? ca.pem : "";
        if (!pem) {
          throw new Error(t("app.browserCaptureProxyCaFailed"));
        }
        browserCaptureDownloadTextFile(
          typeof ca.fileName === "string" && ca.fileName
            ? ca.fileName
            : "mai-coder-capture-ca.pem",
          typeof ca.mimeType === "string" && ca.mimeType
            ? ca.mimeType
            : "application/x-pem-file",
          pem
        );
        setCopiedCaptureField("ca");
        if (copiedCaptureFieldTimerRef.current != null) {
          window.clearTimeout(copiedCaptureFieldTimerRef.current);
        }
        copiedCaptureFieldTimerRef.current = window.setTimeout(() => {
          setCopiedCaptureField(null);
          copiedCaptureFieldTimerRef.current = null;
        }, 1400);
        await refreshBrowserCaptureProxyStatus();
      } catch (error) {
        setCaptureProxyError(
          error instanceof Error ? error.message : String(error)
        );
      } finally {
        setCaptureProxyBusy(null);
      }
    }, [captureProxyBusy, refreshBrowserCaptureProxyStatus, shell, t]);

    const handleHookEventsForTab = useCallback(
      (tabId: string, events: unknown[]) => {
        if (!shell || !events.length) {
          return;
        }
        void shell
          .invoke("browserCapture:hookIngest", { events, tabId })
          .catch(() => {
            /* ignore */
          });
      },
      [shell]
    );

    const handleStorageSnapshotForTab = useCallback(
      (tabId: string, snapshot: unknown) => {
        if (!shell || !snapshot || typeof snapshot !== "object") {
          return;
        }
        void shell
          .invoke("browserCapture:storageIngest", { snapshot, tabId })
          .catch(() => {
            /* ignore */
          });
      },
      [shell]
    );

    const refreshBrowserCaptureSessions = useCallback(async () => {
      if (!shell) {
        return;
      }
      try {
        const payload = (await shell.invoke("browserCapture:sessionsList")) as {
          ok?: boolean;
          sessions?: unknown[];
        };
        if (payload?.ok && Array.isArray(payload.sessions)) {
          setCaptureSessionsList(
            payload.sessions
              .filter((row): row is Record<string, unknown> =>
                Boolean(row && typeof row === "object")
              )
              .map(
                (row): BrowserCaptureSessionSummaryUi => ({
                  createdAt: Number(row.createdAt) || 0,
                  hookEventCount: Number(row.hookEventCount) || 0,
                  id: String(row.id ?? ""),
                  name: typeof row.name === "string" ? row.name : "(untitled)",
                  note: typeof row.note === "string" ? row.note : null,
                  requestCount: Number(row.requestCount) || 0,
                  storageHostCount: Number(row.storageHostCount) || 0,
                  updatedAt: Number(row.updatedAt) || 0,
                })
              )
          );
        }
      } catch {
        /* ignore */
      }
    }, [shell]);

    const saveBrowserCaptureSession = useCallback(async () => {
      if (!shell || captureSessionsBusy) {
        return;
      }
      setCaptureSessionsBusy("save");
      try {
        const fallbackName = `Capture ${new Date().toLocaleString()}`;
        const name = captureSessionsSaveName.trim() || fallbackName;
        const payload = (await shell.invoke("browserCapture:sessionsSave", {
          name,
        })) as { ok?: boolean; error?: unknown };
        if (payload?.ok) {
          setCaptureSessionsSaveName("");
          await refreshBrowserCaptureSessions();
        }
      } catch {
        /* ignore */
      } finally {
        setCaptureSessionsBusy(null);
      }
    }, [
      captureSessionsBusy,
      captureSessionsSaveName,
      refreshBrowserCaptureSessions,
      shell,
    ]);

    const loadBrowserCaptureSession = useCallback(
      async (id: string) => {
        if (!shell || captureSessionsBusy) {
          return;
        }
        setCaptureSessionsBusy("load");
        try {
          const payload = (await shell.invoke("browserCapture:sessionsLoad", {
            id,
          })) as { ok?: boolean; state?: unknown };
          if (payload?.ok) {
            if (payload.state) {
              setCaptureState(normalizeBrowserCaptureUiState(payload.state));
            }
            setCaptureSessionsMenuOpen(false);
            setCapturePanelExpanded(true);
          }
        } catch {
          /* ignore */
        } finally {
          setCaptureSessionsBusy(null);
        }
      },
      [captureSessionsBusy, shell]
    );

    const deleteBrowserCaptureSession = useCallback(
      async (id: string) => {
        if (!shell || captureSessionsBusy) {
          return;
        }
        setCaptureSessionsBusy("delete");
        try {
          await shell.invoke("browserCapture:sessionsDelete", { id });
          await refreshBrowserCaptureSessions();
        } catch {
          /* ignore */
        } finally {
          setCaptureSessionsBusy(null);
        }
      },
      [captureSessionsBusy, refreshBrowserCaptureSessions, shell]
    );

    const refreshBrowserCaptureStorage = useCallback(async () => {
      if (!shell) {
        return;
      }
      try {
        const payload = (await shell.invoke("browserCapture:storageList")) as {
          ok?: boolean;
          snapshots?: unknown[];
        };
        if (payload?.ok && Array.isArray(payload.snapshots)) {
          const next = payload.snapshots.map(
            (raw): BrowserCaptureStorageSnapshotUi => {
              const obj =
                raw && typeof raw === "object"
                  ? (raw as Record<string, unknown>)
                  : {};
              const localEntries = Array.isArray(obj.localStorage)
                ? (obj.localStorage as Record<string, unknown>[])
                : [];
              const sessionEntries = Array.isArray(obj.sessionStorage)
                ? (obj.sessionStorage as Record<string, unknown>[])
                : [];
              return {
                cookies: typeof obj.cookies === "string" ? obj.cookies : "",
                host: typeof obj.host === "string" ? obj.host : "",
                id:
                  typeof obj.id === "string"
                    ? obj.id
                    : `storage:${Math.random()}`,
                localStorage: localEntries
                  .filter((e) => e && typeof e === "object")
                  .map((e) => ({
                    key: typeof e.key === "string" ? e.key : "",
                    value: typeof e.value === "string" ? e.value : "",
                  })),
                sessionStorage: sessionEntries
                  .filter((e) => e && typeof e === "object")
                  .map((e) => ({
                    key: typeof e.key === "string" ? e.key : "",
                    value: typeof e.value === "string" ? e.value : "",
                  })),
                tabId: typeof obj.tabId === "string" ? obj.tabId : null,
                ts: typeof obj.ts === "number" ? obj.ts : 0,
                url: typeof obj.url === "string" ? obj.url : "",
              };
            }
          );
          setCaptureStorageSnapshots(next);
          if (
            next.length > 0 &&
            (!captureStorageActiveHost ||
              !next.some((entry) => entry.host === captureStorageActiveHost))
          ) {
            setCaptureStorageActiveHost(next[0].host);
          } else if (next.length === 0) {
            setCaptureStorageActiveHost(null);
          }
        }
      } catch {
        /* ignore */
      }
    }, [captureStorageActiveHost, shell]);

    const refreshBrowserCaptureHookEvents = useCallback(async () => {
      if (!shell) {
        return;
      }
      try {
        const payload = (await shell.invoke("browserCapture:hookList", {
          category: captureHookCategoryFilter,
          limit: 200,
          offset: 0,
          query: captureHookQuery.trim() || undefined,
        })) as { ok?: boolean; result?: { items?: unknown[]; total?: number } };
        if (payload?.ok && payload.result) {
          const items = Array.isArray(payload.result.items)
            ? payload.result.items
            : [];
          setCaptureHookEvents(
            items.map((raw): BrowserCaptureHookEventUi => {
              const obj =
                raw && typeof raw === "object"
                  ? (raw as Record<string, unknown>)
                  : {};
              return {
                args: typeof obj.args === "string" ? obj.args : "",
                category:
                  typeof obj.category === "string" ? obj.category : "unknown",
                id:
                  typeof obj.id === "string" ? obj.id : `hook-${Math.random()}`,
                label: typeof obj.label === "string" ? obj.label : "event",
                result: typeof obj.result === "string" ? obj.result : null,
                seq: typeof obj.seq === "number" ? obj.seq : 0,
                stack: typeof obj.stack === "string" ? obj.stack : "",
                tabId: typeof obj.tabId === "string" ? obj.tabId : null,
                ts: typeof obj.ts === "number" ? obj.ts : 0,
                url: typeof obj.url === "string" ? obj.url : "",
              };
            })
          );
          setCaptureHookEventTotal(
            typeof payload.result.total === "number"
              ? payload.result.total
              : items.length
          );
        }
      } catch {
        /* swallow */
      }
    }, [captureHookCategoryFilter, captureHookQuery, shell]);

    const refreshBrowserCaptureRequests = useCallback(
      async (mode: "replace" | "append" = "replace") => {
        if (!shell) {
          return;
        }
        const append = mode === "append";
        const requestSeq = ++captureListRequestSeqRef.current;
        const offset = append ? captureRequestsRef.current.length : 0;
        setCaptureListBusy(true);
        setCaptureListError(null);
        try {
          const payload = (await shell.invoke("browserCapture:listRequests", {
            limit: BROWSER_CAPTURE_REQUEST_PAGE_SIZE,
            method:
              captureMethodFilter === "all" ? undefined : captureMethodFilter,
            offset,
            query: captureQuery,
            resourceType:
              captureResourceFilter === "all"
                ? undefined
                : captureResourceFilter,
            source:
              captureSourceFilter === "all" ? undefined : captureSourceFilter,
            statusGroup:
              captureStatusFilter === "all" ? undefined : captureStatusFilter,
          })) as { ok?: boolean; result?: unknown; error?: unknown };
          if (!payload?.ok) {
            throw new Error(
              String(payload?.error ?? t("app.browserCaptureListFailed"))
            );
          }
          const list = normalizeBrowserCaptureList(payload.result);
          if (requestSeq !== captureListRequestSeqRef.current) {
            return;
          }
          const nextItems = append
            ? mergeBrowserCaptureRequestSummaries(
                captureRequestsRef.current,
                list.items
              )
            : list.items;
          captureRequestsRef.current = nextItems;
          setCaptureRequests(nextItems);
          setCaptureRequestTotal(list.total);
          setSelectedCaptureRequestIds((prev) => {
            if (prev.size <= 0) {
              return prev;
            }
            const visibleIds = new Set(nextItems.map((item) => item.id));
            const next = new Set(
              Array.from(prev).filter((id) => visibleIds.has(id))
            );
            return next.size === prev.size ? prev : next;
          });
          setSelectedCaptureRequestId((prev) => {
            if (prev && nextItems.some((item) => item.id === prev)) {
              return prev;
            }
            return nextItems[0]?.id ?? null;
          });
        } catch (error) {
          if (requestSeq === captureListRequestSeqRef.current) {
            setCaptureListError(
              error instanceof Error ? error.message : String(error)
            );
          }
        } finally {
          if (requestSeq === captureListRequestSeqRef.current) {
            setCaptureListBusy(false);
          }
        }
      },
      [
        captureMethodFilter,
        captureQuery,
        captureResourceFilter,
        captureSourceFilter,
        captureStatusFilter,
        shell,
        t,
      ]
    );

    const loadBrowserCaptureRequest = useCallback(
      async (requestId: string) => {
        if (!shell || !requestId) {
          setSelectedCaptureRequest(null);
          return;
        }
        setSelectedCaptureBusy(true);
        try {
          const payload = (await shell.invoke("browserCapture:getRequest", {
            requestId,
          })) as {
            ok?: boolean;
            request?: unknown;
            error?: unknown;
          };
          if (!payload?.ok) {
            throw new Error(
              String(payload?.error ?? t("app.browserCaptureRequestNotFound"))
            );
          }
          setSelectedCaptureRequest(
            normalizeBrowserCaptureRequestDetail(payload.request)
          );
        } catch {
          setSelectedCaptureRequest(null);
        } finally {
          setSelectedCaptureBusy(false);
        }
      },
      [shell, t]
    );

    const clearBrowserData = useCallback(async () => {
      if (!shell || clearDataBusy) {
        return;
      }
      setClearDataBusy(true);
      setClearDataError(null);
      try {
        const payload = (await shell.invoke("browser:clearData")) as {
          ok?: boolean;
          error?: unknown;
        };
        if (!payload?.ok) {
          throw new Error(
            String(payload?.error ?? t("app.browserClearDataFailed"))
          );
        }
        setClearDataConfirmOpen(false);
        setTabs((prev) =>
          prev.map((tab) => ({
            ...tab,
            isLoading: true,
            loadError: null,
          }))
        );
        webviewsRef.current.forEach((node) => {
          try {
            node.reload();
          } catch {
            /* ignore */
          }
        });
      } catch (error) {
        setClearDataError(
          error instanceof Error ? error.message : String(error)
        );
      } finally {
        setClearDataBusy(false);
      }
    }, [clearDataBusy, shell, t]);

    const waitForWebviewNode = useCallback(
      (
        tabId: string,
        timeoutMs = 10_000,
        signal?: AbortSignal
      ): Promise<MaiShellWebviewElement> => {
        const startedAt = Date.now();
        return new Promise((resolve, reject) => {
          let timer: number | null = null;
          const cleanup = () => {
            if (timer !== null) {
              clearTimeout(timer);
              timer = null;
            }
            signal?.removeEventListener("abort", onAbort);
          };
          const onAbort = () => {
            cleanup();
            reject(new DOMException("Aborted", "AbortError"));
          };
          if (signal?.aborted) {
            reject(new DOMException("Aborted", "AbortError"));
            return;
          }
          signal?.addEventListener("abort", onAbort, { once: true });
          const tick = () => {
            if (signal?.aborted) {
              cleanup();
              reject(new DOMException("Aborted", "AbortError"));
              return;
            }
            const node = webviewsRef.current.get(tabId);
            if (node) {
              cleanup();
              resolve(node);
              return;
            }
            if (Date.now() - startedAt >= timeoutMs) {
              cleanup();
              reject(
                new Error("Timed out waiting for browser tab to become ready.")
              );
              return;
            }
            timer = window.setTimeout(tick, 50);
          };
          tick();
        });
      },
      []
    );

    const waitForWebviewSettled = useCallback(
      (
        node: MaiShellWebviewElement,
        tabId: string,
        timeoutMs = 15_000
      ): Promise<void> => {
        const currentTab = tabsRef.current.find((tab) => tab.id === tabId);
        if (!currentTab?.isLoading) {
          return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
          const cleanup = () => {
            window.clearTimeout(timer);
            node.removeEventListener("did-stop-loading", handleStopLoading);
            node.removeEventListener("did-fail-load", handleFailLoad);
          };
          const handleStopLoading = () => {
            cleanup();
            resolve();
          };
          const handleFailLoad = (event: Event) => {
            const failEvent = event as BrowserFailEvent;
            if (failEvent.isMainFrame === false || failEvent.errorCode === -3) {
              return;
            }
            cleanup();
            reject(
              new Error(
                String(failEvent.errorDescription ?? t("app.browserLoadFailed"))
              )
            );
          };
          const timer = window.setTimeout(() => {
            cleanup();
            reject(new Error("Timed out waiting for page load to finish."));
          }, timeoutMs);
          node.addEventListener("did-stop-loading", handleStopLoading);
          node.addEventListener("did-fail-load", handleFailLoad);
        });
      },
      [t]
    );

    const readPageFromWebview = useCallback(
      async (
        node: MaiShellWebviewElement,
        options: { selector?: string; includeHtml?: boolean; maxChars?: number }
      ): Promise<Record<string, unknown>> => {
        const maxChars = Math.min(
          Math.max(500, Math.floor(options.maxChars ?? 12_000)),
          50_000
        );
        const script = `
				(() => {
					const args = ${JSON.stringify({
            includeHtml: options.includeHtml === true,
            maxChars,
            selector: options.selector ?? "",
          })};
					const root = args.selector ? document.querySelector(args.selector) : (document.body || document.documentElement);
					if (!root) {
						return {
							ok: false,
							error: args.selector ? 'Selector did not match any element.' : 'Page body is unavailable.',
						};
					}
					const rawText = String(root.innerText || root.textContent || '');
					const htmlText = args.includeHtml
						? String(root.outerHTML || root.innerHTML || '').slice(0, Math.min(args.maxChars, 30000))
						: '';
					const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
						.map((el) => String(el.textContent || '').trim())
						.filter(Boolean)
						.slice(0, 20);
					const links = Array.from(root.querySelectorAll('a[href]'))
						.map((el) => ({
							text: String(el.textContent || '').trim(),
							href: String(el.getAttribute('href') || '').trim(),
						}))
						.filter((item) => item.href)
						.slice(0, 20);
					const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
					return {
						ok: true,
						url: location.href,
						title: document.title || '',
						lang: document.documentElement?.lang || '',
						selector: args.selector || null,
						metaDescription: metaDescription || '',
						text: rawText,
						totalTextLength: rawText.length,
						headings,
						links,
						html: htmlText || undefined,
					};
				})()
			`;
        const result = await node.executeJavaScript<Record<string, unknown>>(
          script,
          true
        );
        if (result?.ok === false) {
          throw new Error(
            String(result.error ?? "Failed to read page content.")
          );
        }
        const text = normalizeBrowserExtractedText(
          String(result?.text ?? ""),
          maxChars
        );
        return {
          headings: Array.isArray(result?.headings) ? result.headings : [],
          lang: String(result?.lang ?? ""),
          links: Array.isArray(result?.links) ? result.links : [],
          metaDescription: String(result?.metaDescription ?? ""),
          selector: result?.selector ?? null,
          text,
          title: String(result?.title ?? ""),
          totalTextLength:
            Number(result?.totalTextLength ?? text.length) || text.length,
          url: String(result?.url ?? safeGetWebviewUrl(node)),
          ...(options.includeHtml ? { html: String(result?.html ?? "") } : {}),
        };
      },
      []
    );

    const clickElementInWebview = useCallback(
      async (
        node: MaiShellWebviewElement,
        options: { selector: string }
      ): Promise<Record<string, unknown>> => {
        // Phase 1（同步脚本）：定位元素、滚到视口、fire-and-forget 启动光标动画。
        // 不在脚本里 await 异步动画，避免 executeJavaScript 持有的 Promise 跨过
        // click 触发的页面导航后失效（GUEST_VIEW_MANAGER_CALL 错误根因）。
        const setupScript = `
				(() => {
					const args = ${JSON.stringify({ selector: options.selector })};
					const target = document.querySelector(args.selector);
					if (!target) {
						return { ok: false, error: 'Selector did not match any element.' };
					}
					if (!(target instanceof HTMLElement)) {
						return { ok: false, error: 'Matched node is not an HTMLElement.' };
					}
					target.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
					const rect = target.getBoundingClientRect();
					const cx = Math.round(rect.left + rect.width / 2);
					const cy = Math.round(rect.top + rect.height / 2);
					try {
						const cursor = window.__asyncAiCursor;
						if (cursor && typeof cursor.moveTo === 'function') {
							const labelText = String(target.innerText || target.textContent || target.getAttribute('aria-label') || target.tagName.toLowerCase()).trim().slice(0, 40);
							if (typeof cursor.label === 'function') cursor.label('点击 ' + (labelText || '元素'), 1800);
							cursor.show();
							// fire-and-forget; 渲染器侧 sleep 再发 click 脚本
							Promise.resolve(cursor.moveTo(cx, cy)).then(() => cursor.click(cx, cy)).catch(() => {});
						}
					} catch { /* decorative */ }
					return { ok: true, cx, cy };
				})()
			`;
        const setup = await node.executeJavaScript<Record<string, unknown>>(
          setupScript,
          false
        );
        if (setup?.ok === false) {
          throw new Error(String(setup.error ?? "Failed to locate element."));
        }
        // 等光标动画走完（缓动 ~500ms + hover ~200ms + click 闪 ~150ms）。
        await new Promise((r) => setTimeout(r, 850));

        // Phase 2（同步脚本）：真实点击 + 读取结果。executeJavaScript 同步返回，
        // 即便 click 触发了页面导航，这次 IPC 已经先完成了 send/return 周期。
        const clickScript = `
				(() => {
					const args = ${JSON.stringify({ selector: options.selector })};
					const target = document.querySelector(args.selector);
					if (!target || !(target instanceof HTMLElement)) {
						return { ok: false, error: 'Element no longer present.' };
					}
					target.focus?.();
					const rect = target.getBoundingClientRect();
					const cx = Math.round(rect.left + rect.width / 2);
					const cy = Math.round(rect.top + rect.height / 2);
					const beforeUrl = location.href;
					const beforeTitle = document.title || '';
					if (typeof target.click === 'function') {
						target.click();
					} else {
						target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
					}
					return {
						ok: true,
						selector: args.selector,
						tagName: target.tagName.toLowerCase(),
						text: String(target.innerText || target.textContent || '').trim().slice(0, 500),
						href: target instanceof HTMLAnchorElement ? target.href : '',
						x: cx,
						y: cy,
						urlBefore: beforeUrl,
						titleBefore: beforeTitle,
						urlAfter: location.href,
						titleAfter: document.title || '',
					};
				})()
			`;
        const result = await node.executeJavaScript<Record<string, unknown>>(
          clickScript,
          true
        );
        if (result?.ok === false) {
          throw new Error(String(result.error ?? "Failed to click element."));
        }
        return {
          clickPoint: {
            x: Number(result?.x ?? 0) || 0,
            y: Number(result?.y ?? 0) || 0,
          },
          href: String(result?.href ?? ""),
          selector: String(result?.selector ?? options.selector),
          tagName: String(result?.tagName ?? ""),
          text: String(result?.text ?? ""),
          title: String(result?.titleAfter ?? ""),
          url: String(result?.urlAfter ?? safeGetWebviewUrl(node)),
          urlAfter: String(result?.urlAfter ?? safeGetWebviewUrl(node)),
          urlBefore: String(result?.urlBefore ?? ""),
        };
      },
      []
    );

    const inputTextInWebview = useCallback(
      async (
        node: MaiShellWebviewElement,
        options: { selector: string; text: string; pressEnter?: boolean }
      ): Promise<Record<string, unknown>> => {
        // Phase 1（同步）：定位、滚动、fire-and-forget 启动光标动画
        const setupScript = `
				(() => {
					const args = ${JSON.stringify({ selector: options.selector })};
					const target = document.querySelector(args.selector);
					if (!target) return { ok: false, error: 'Selector did not match any element.' };
					if (!(target instanceof HTMLElement)) return { ok: false, error: 'Matched node is not an HTMLElement.' };
					target.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
					const rect = target.getBoundingClientRect();
					const cx = Math.round(rect.left + rect.width / 2);
					const cy = Math.round(rect.top + rect.height / 2);
					try {
						const cursor = window.__asyncAiCursor;
						if (cursor && typeof cursor.moveTo === 'function') {
							const labelHint = target.getAttribute('placeholder') || target.getAttribute('aria-label') || target.getAttribute('name') || target.tagName.toLowerCase();
							if (typeof cursor.label === 'function') cursor.label('填写 ' + String(labelHint).slice(0, 40), 2000);
							cursor.show();
							Promise.resolve(cursor.moveTo(cx, cy)).then(() => cursor.click(cx, cy)).catch(() => {});
						}
					} catch { /* decorative */ }
					return { ok: true, cx, cy };
				})()
			`;
        const setup = await node.executeJavaScript<Record<string, unknown>>(
          setupScript,
          false
        );
        if (setup?.ok === false) {
          throw new Error(String(setup.error ?? "Failed to locate input."));
        }
        await new Promise((r) => setTimeout(r, 850));

        // Phase 2（同步）：填值 + 逐字向 KeyCastr HUD 推送 + 可选回车
        const script = `
				(() => {
					const args = ${JSON.stringify({
            pressEnter: options.pressEnter === true,
            selector: options.selector,
            text: options.text,
          })};
					const target = document.querySelector(args.selector);
					if (!target) {
						return { ok: false, error: 'Selector did not match any element.' };
					}
					if (!(target instanceof HTMLElement)) {
						return { ok: false, error: 'Matched node is not an HTMLElement.' };
					}
					const dispatchInput = (el) => {
						el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
						el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
					};
					const setNativeValue = (el, value) => {
						const proto =
							el instanceof HTMLTextAreaElement
								? HTMLTextAreaElement.prototype
								: el instanceof HTMLInputElement
									? HTMLInputElement.prototype
									: el instanceof HTMLSelectElement
										? HTMLSelectElement.prototype
										: null;
						const descriptor = proto ? Object.getOwnPropertyDescriptor(proto, 'value') : null;
						if (descriptor?.set) {
							descriptor.set.call(el, value);
						} else {
							el.value = value;
						}
					};
					const cursor = window.__asyncAiCursor;
					target.focus?.();
					let mode = 'unknown';
					const isFormControl =
						target instanceof HTMLInputElement ||
						target instanceof HTMLTextAreaElement ||
						target instanceof HTMLSelectElement;
					const useEditable = !isFormControl && target.isContentEditable;
					mode = isFormControl
						? target instanceof HTMLTextAreaElement
							? 'textarea'
							: target instanceof HTMLSelectElement
								? 'select'
								: 'input'
						: useEditable
							? 'contenteditable'
							: 'value' in target
								? 'value-property'
								: 'textContent';
					if (isFormControl) {
						setNativeValue(target, args.text);
						dispatchInput(target);
					} else if (useEditable) {
						target.textContent = args.text;
						dispatchInput(target);
					} else if ('value' in target) {
						try { target.value = args.text; dispatchInput(target); }
						catch { target.textContent = args.text; dispatchInput(target); }
					} else {
						target.textContent = args.text;
						dispatchInput(target);
					}
					// HUD 逐字滚出来（annulable: limite à 200 chars, timers trackés).
					try {
						if (cursor && typeof cursor.key === 'function' && args.text.length > 0) {
							const slice = args.text.slice(0, 200);
							const stagger = args.text.length > 60 ? 35 : 70;
							const timers: number[] = [];
							for (let i = 0; i < slice.length; i++) {
								const ch = slice.charAt(i);
								timers.push(window.setTimeout(() => {
									try {
										if (cursor.isConnected) cursor.key(ch);
									} catch { /* */ }
								}, i * stagger));
							}
							// Annule si le noeud est détaché avant la fin.
							const total = slice.length * stagger + 50;
							window.setTimeout(() => {
								for (const id of timers) clearTimeout(id);
							}, total + 5000);
						}
					} catch { /* decorative */ }
					if (args.pressEnter) {
						const keyboardInit = {
							key: 'Enter',
							code: 'Enter',
							keyCode: 13,
							which: 13,
							bubbles: true,
							cancelable: true,
						};
						try {
							if (cursor && typeof cursor.key === 'function') {
								const enterDelay = Math.min(args.text.length, 200) * (args.text.length > 60 ? 35 : 70);
								window.setTimeout(() => {
									try {
										if (cursor.isConnected) cursor.key('Enter');
									} catch { /* */ }
								}, enterDelay);
							}
						} catch { /* decorative */ }
						target.dispatchEvent(new KeyboardEvent('keydown', keyboardInit));
						target.dispatchEvent(new KeyboardEvent('keypress', keyboardInit));
						target.dispatchEvent(new KeyboardEvent('keyup', keyboardInit));
						const form = target.closest('form');
						if (form instanceof HTMLFormElement) {
							if (typeof form.requestSubmit === 'function') {
								form.requestSubmit();
							} else {
								form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
							}
						}
					}
					const value =
						target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement
							? target.value
							: target.isContentEditable
								? String(target.textContent || '')
								: 'value' in target
									? String(target.value ?? '')
									: String(target.textContent || '');
					return {
						ok: true,
						selector: args.selector,
						mode,
						tagName: target.tagName.toLowerCase(),
						value,
						pressEnter: args.pressEnter,
						url: location.href,
						title: document.title || '',
					};
				})()
			`;
        const result = await node.executeJavaScript<Record<string, unknown>>(
          script,
          true
        );
        if (result?.ok === false) {
          throw new Error(String(result.error ?? "Failed to input text."));
        }
        return {
          mode: String(result?.mode ?? ""),
          pressEnter: result?.pressEnter === true,
          selector: String(result?.selector ?? options.selector),
          tagName: String(result?.tagName ?? ""),
          title: String(result?.title ?? ""),
          url: String(result?.url ?? safeGetWebviewUrl(node)),
          value: String(result?.value ?? options.text),
        };
      },
      []
    );

    const waitForSelectorInWebview = useCallback(
      async (
        node: MaiShellWebviewElement,
        options: { selector: string; visible?: boolean; timeoutMs?: number }
      ): Promise<Record<string, unknown>> => {
        const timeoutMs = Math.min(
          Math.max(500, Math.floor(options.timeoutMs ?? 20_000)),
          60_000
        );
        const script = `
				(() => {
					const args = ${JSON.stringify({
            selector: options.selector,
            timeoutMs,
            visible: options.visible === true,
          })};
					const root = document.documentElement || document.body;
					if (!root) {
						return Promise.resolve({
							ok: false,
							error: 'Document root is unavailable.',
						});
					}
					const isVisible = (el) => {
						if (!(el instanceof HTMLElement)) {
							return false;
						}
						const style = window.getComputedStyle(el);
						if (!style || style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
							return false;
						}
						const rect = el.getBoundingClientRect();
						return rect.width > 0 && rect.height > 0;
					};
					const snapshot = (el) => {
						const rect = el instanceof HTMLElement ? el.getBoundingClientRect() : { width: 0, height: 0 };
						return {
							ok: true,
							selector: args.selector,
							tagName: el instanceof Element ? el.tagName.toLowerCase() : '',
							text: el instanceof Element ? String(el.innerText || el.textContent || '').trim().slice(0, 500) : '',
							visible: isVisible(el),
							url: location.href,
							title: document.title || '',
							width: Math.round(rect.width || 0),
							height: Math.round(rect.height || 0),
						};
					};
					const findMatch = () => {
						const el = document.querySelector(args.selector);
						if (!el) {
							return null;
						}
						if (args.visible && !isVisible(el)) {
							return null;
						}
						return el;
					};
					const immediate = findMatch();
					if (immediate) {
						return Promise.resolve(snapshot(immediate));
					}
					return new Promise((resolve) => {
						const observer = new MutationObserver(() => {
							const match = findMatch();
							if (!match) {
								return;
							}
							cleanup();
							resolve(snapshot(match));
						});
						const cleanup = () => {
							window.clearTimeout(timer);
							observer.disconnect();
						};
						const timer = window.setTimeout(() => {
							cleanup();
							resolve({
								ok: false,
								error: args.visible
									? 'Timed out waiting for a visible element matching the selector.'
									: 'Timed out waiting for an element matching the selector.',
							});
						}, args.timeoutMs);
						observer.observe(root, {
							childList: true,
							subtree: true,
							attributes: true,
							attributeFilter: ['class', 'style', 'hidden', 'aria-hidden'],
						});
					});
				})()
			`;
        const result = await node.executeJavaScript<Record<string, unknown>>(
          script,
          true
        );
        if (result?.ok === false) {
          throw new Error(
            String(result.error ?? "Failed while waiting for selector.")
          );
        }
        return {
          selector: String(result?.selector ?? options.selector),
          size: {
            height: Number(result?.height ?? 0) || 0,
            width: Number(result?.width ?? 0) || 0,
          },
          tagName: String(result?.tagName ?? ""),
          text: String(result?.text ?? ""),
          timeoutMs,
          title: String(result?.title ?? ""),
          url: String(result?.url ?? safeGetWebviewUrl(node)),
          visible: result?.visible === true,
        };
      },
      []
    );

    const captureWebviewScreenshot = useCallback(
      async (
        node: MaiShellWebviewElement
      ): Promise<Record<string, unknown>> => {
        const image = await node.capturePage();
        const size = image.getSize();
        return {
          dataUrl: image.toDataURL(),
          height: size.height,
          title:
            tabsRef.current.find(
              (tab) => webviewsRef.current.get(tab.id) === node
            )?.pageTitle ?? "",
          url: safeGetWebviewUrl(node),
          width: size.width,
        };
      },
      []
    );

    useEffect(() => {
      let cancelled = false;
      if (!shell) {
        setBrowserPartition("async-agent-browser-fallback");
        setBrowserConfigReady(true);
        return () => {
          cancelled = true;
        };
      }
      void shell
        .invoke("browser:getConfig")
        .then((payload) => {
          if (cancelled) {
            return;
          }
          const response = payload as {
            ok?: boolean;
            partition?: string;
            config?: Partial<BrowserSidebarSettingsConfig>;
            defaultUserAgent?: string;
          };
          if (response.ok && response.partition) {
            const nextConfig = normalizeBrowserSidebarConfig(response.config);
            setBrowserPartition(response.partition);
            setBrowserConfig(nextConfig);
            defaultUserAgentRef.current = String(
              response.defaultUserAgent ?? ""
            ).trim();
          } else {
            setBrowserPartition("async-agent-browser-fallback");
          }
          setBrowserConfigReady(true);
        })
        .catch(() => {
          if (cancelled) {
            return;
          }
          setBrowserPartition("async-agent-browser-fallback");
          setBrowserConfigReady(true);
        });
      return () => {
        cancelled = true;
      };
    }, [shell]);

    useEffect(() => {
      void refreshBrowserCaptureState();
      const timer = window.setInterval(
        () => {
          void refreshBrowserCaptureState();
        },
        captureState?.capturing ? 1200 : 4000
      );
      return () => {
        window.clearInterval(timer);
      };
    }, [captureState?.capturing, refreshBrowserCaptureState]);

    useEffect(() => {
      // Initial refresh on mount; afterwards only poll while the proxy is running.
      // When the proxy is not running there's nothing whose state can usefully change
      // at a sub-minute granularity (CA trust + system proxy flags), and frequent
      // `certutil`/`reg query` spawns on Windows have caused user-visible churn —
      // so we either back off significantly or skip the timer entirely.
      void refreshBrowserCaptureProxyStatus();
      if (!captureProxyStatus?.running) {
        return;
      }
      const timer = window.setInterval(() => {
        void refreshBrowserCaptureProxyStatus();
      }, 15_000);
      return () => {
        window.clearInterval(timer);
      };
    }, [captureProxyStatus?.running, refreshBrowserCaptureProxyStatus]);

    useEffect(() => {
      try {
        window.localStorage.setItem(
          BROWSER_CAPTURE_DOCK_EXPANDED_KEY,
          capturePanelExpanded ? "1" : "0"
        );
      } catch {
        /* ignore */
      }
    }, [capturePanelExpanded]);

    useEffect(() => {
      try {
        window.localStorage.setItem(
          BROWSER_CAPTURE_DOCK_HEIGHT_KEY,
          String(captureDockHeight)
        );
      } catch {
        /* ignore */
      }
    }, [captureDockHeight]);

    useEffect(() => {
      try {
        window.localStorage.setItem(
          BROWSER_CAPTURE_DOCK_TAB_KEY,
          capturePanelTab
        );
      } catch {
        /* ignore */
      }
    }, [capturePanelTab]);

    useEffect(() => {
      try {
        window.localStorage.setItem(
          BROWSER_CAPTURE_DETAIL_VISIBLE_KEY,
          captureDetailVisible ? "1" : "0"
        );
      } catch {
        /* ignore */
      }
    }, [captureDetailVisible]);

    useEffect(() => {
      if (!captureExportMenuOpen) {
        return;
      }
      const handle = (event: MouseEvent) => {
        const node = captureExportMenuRef.current;
        if (
          node &&
          event.target instanceof Node &&
          !node.contains(event.target)
        ) {
          setCaptureExportMenuOpen(false);
        }
      };
      const handleKey = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setCaptureExportMenuOpen(false);
        }
      };
      window.addEventListener("mousedown", handle);
      window.addEventListener("keydown", handleKey);
      return () => {
        window.removeEventListener("mousedown", handle);
        window.removeEventListener("keydown", handleKey);
      };
    }, [captureExportMenuOpen]);

    useEffect(() => {
      if (!captureSessionsMenuOpen) {
        return;
      }
      const handle = (event: MouseEvent) => {
        const node = captureSessionsMenuRef.current;
        if (
          node &&
          event.target instanceof Node &&
          !node.contains(event.target)
        ) {
          setCaptureSessionsMenuOpen(false);
        }
      };
      const handleKey = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setCaptureSessionsMenuOpen(false);
        }
      };
      window.addEventListener("mousedown", handle);
      window.addEventListener("keydown", handleKey);
      return () => {
        window.removeEventListener("mousedown", handle);
        window.removeEventListener("keydown", handleKey);
      };
    }, [captureSessionsMenuOpen]);

    useEffect(() => {
      if (!captureAnalyzeMenuOpen) {
        return;
      }
      const handle = (event: MouseEvent) => {
        const node = captureAnalyzeMenuRef.current;
        if (
          node &&
          event.target instanceof Node &&
          !node.contains(event.target)
        ) {
          setCaptureAnalyzeMenuOpen(false);
        }
      };
      const handleKey = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setCaptureAnalyzeMenuOpen(false);
        }
      };
      window.addEventListener("mousedown", handle);
      window.addEventListener("keydown", handleKey);
      return () => {
        window.removeEventListener("mousedown", handle);
        window.removeEventListener("keydown", handleKey);
      };
    }, [captureAnalyzeMenuOpen]);

    useEffect(
      () => () => {
        if (copiedCaptureFieldTimerRef.current != null) {
          window.clearTimeout(copiedCaptureFieldTimerRef.current);
        }
      },
      []
    );

    useEffect(() => {
      if (!capturePanelExpanded || capturePanelTab !== "requests") {
        return;
      }
      const timer = window.setTimeout(
        () => {
          void refreshBrowserCaptureRequests();
        },
        captureQuery.trim() ? 180 : 0
      );
      return () => {
        window.clearTimeout(timer);
      };
    }, [
      capturePanelExpanded,
      capturePanelTab,
      captureQuery,
      captureState?.pendingRequestCount,
      captureState?.requestCount,
      refreshBrowserCaptureRequests,
    ]);

    useEffect(() => {
      if (!capturePanelExpanded || capturePanelTab !== "storage") {
        return;
      }
      void refreshBrowserCaptureStorage();
      const interval = window.setInterval(() => {
        void refreshBrowserCaptureStorage();
      }, 3000);
      return () => {
        window.clearInterval(interval);
      };
    }, [
      capturePanelExpanded,
      capturePanelTab,
      captureState?.storageHostCount,
      refreshBrowserCaptureStorage,
    ]);

    useEffect(() => {
      if (!capturePanelExpanded || capturePanelTab !== "hooks") {
        return;
      }
      const timer = window.setTimeout(
        () => {
          void refreshBrowserCaptureHookEvents();
        },
        captureHookQuery.trim() ? 180 : 0
      );
      const interval = window.setInterval(() => {
        void refreshBrowserCaptureHookEvents();
      }, 1500);
      return () => {
        window.clearTimeout(timer);
        window.clearInterval(interval);
      };
    }, [
      capturePanelExpanded,
      capturePanelTab,
      captureHookQuery,
      captureHookCategoryFilter,
      captureState?.hookEventCount,
      refreshBrowserCaptureHookEvents,
    ]);

    useEffect(() => {
      if (!selectedCaptureRequestId) {
        setSelectedCaptureRequest(null);
        return;
      }
      void loadBrowserCaptureRequest(selectedCaptureRequestId);
    }, [loadBrowserCaptureRequest, selectedCaptureRequestId]);

    const copyCaptureText = useCallback(
      async (field: string, text: string) => {
        const value = String(text ?? "").trim();
        if (!value) {
          return;
        }
        let copied = false;
        try {
          const payload = (await shell?.invoke("clipboard:writeText", value)) as
            | { ok?: boolean }
            | undefined;
          copied = payload?.ok === true;
        } catch {
          /* fall back to browser clipboard */
        }
        if (!copied) {
          try {
            await navigator.clipboard.writeText(value);
            copied = true;
          } catch {
            /* clipboard can be unavailable in restricted webview contexts */
          }
        }
        if (!copied) {
          return;
        }
        setCopiedCaptureField(field);
        if (copiedCaptureFieldTimerRef.current != null) {
          window.clearTimeout(copiedCaptureFieldTimerRef.current);
        }
        copiedCaptureFieldTimerRef.current = window.setTimeout(() => {
          setCopiedCaptureField(null);
          copiedCaptureFieldTimerRef.current = null;
        }, 1200);
      },
      [shell]
    );

    const loadBrowserCaptureExportRequests = useCallback(async (): Promise<{
      requests: BrowserCaptureRequestDetailUi[];
      scope: Record<string, unknown>;
    }> => {
      if (!shell) {
        return { requests: [], scope: {} };
      }
      const requestIds = Array.from(selectedCaptureRequestIds);
      const scope =
        requestIds.length > 0
          ? { requestIds }
          : {
              method:
                captureMethodFilter === "all" ? undefined : captureMethodFilter,
              query: captureQuery.trim(),
              resourceType:
                captureResourceFilter === "all"
                  ? undefined
                  : captureResourceFilter,
              source:
                captureSourceFilter === "all" ? undefined : captureSourceFilter,
              statusGroup:
                captureStatusFilter === "all" ? undefined : captureStatusFilter,
            };
      const payload = (await shell.invoke("browserCapture:exportRequests", {
        ...scope,
        limit: 500,
        offset: 0,
      })) as { ok?: boolean; requests?: unknown; error?: unknown };
      if (!payload?.ok) {
        throw new Error(
          String(payload?.error ?? t("app.browserCaptureExportFailed"))
        );
      }
      return {
        requests: normalizeBrowserCaptureRequestDetails(payload.requests),
        scope,
      };
    }, [
      captureMethodFilter,
      captureQuery,
      captureResourceFilter,
      captureSourceFilter,
      captureStatusFilter,
      selectedCaptureRequestIds,
      shell,
      t,
    ]);

    const copyBrowserCaptureCurl = useCallback(async () => {
      if (captureExportBusy) {
        return;
      }
      setCaptureExportBusy("curl");
      setCaptureExportError(null);
      try {
        const { requests } = await loadBrowserCaptureExportRequests();
        if (requests.length <= 0) {
          throw new Error(t("app.browserCaptureNoExportableRequests"));
        }
        await copyCaptureText(
          "curl",
          requests.map(browserCaptureBuildCurl).join("\n\n")
        );
      } catch (error) {
        setCaptureExportError(
          error instanceof Error ? error.message : String(error)
        );
      } finally {
        setCaptureExportBusy(null);
      }
    }, [
      captureExportBusy,
      copyCaptureText,
      loadBrowserCaptureExportRequests,
      t,
    ]);

    const exportBrowserCaptureRequests = useCallback(
      async (format: "json" | "har") => {
        if (captureExportBusy) {
          return;
        }
        setCaptureExportBusy(format);
        setCaptureExportError(null);
        try {
          const { requests, scope } = await loadBrowserCaptureExportRequests();
          if (requests.length <= 0) {
            throw new Error(t("app.browserCaptureNoExportableRequests"));
          }
          const text =
            format === "har"
              ? browserCaptureBuildHarExport(requests)
              : browserCaptureBuildJsonExport(requests, scope);
          browserCaptureDownloadTextFile(
            browserCaptureExportFileName(format),
            format === "har" ? "application/har+json" : "application/json",
            text
          );
        } catch (error) {
          setCaptureExportError(
            error instanceof Error ? error.message : String(error)
          );
        } finally {
          setCaptureExportBusy(null);
        }
      },
      [captureExportBusy, loadBrowserCaptureExportRequests, t]
    );

    const sendBrowserCaptureToAgentDraft = useCallback(async () => {
      if (captureExportBusy || !shell) {
        return;
      }
      setCaptureExportBusy("agent");
      setCaptureExportError(null);
      try {
        const { requests } = await loadBrowserCaptureExportRequests();
        if (requests.length <= 0) {
          throw new Error(t("app.browserCaptureNoExportableRequests"));
        }
        const scopeLabel =
          selectedCaptureRequestIds.size > 0
            ? t("app.browserCaptureSelectedCount", {
                count: String(selectedCaptureRequestIds.size),
              })
            : t("app.browserCaptureFilteredCount", {
                count: String(captureRequestTotal),
              });
        const text = browserCaptureBuildAgentDraft(requests, scopeLabel, t);
        const payload = (await shell.invoke("composer:appendDraft", {
          text,
        })) as { ok?: boolean; error?: unknown };
        if (!payload?.ok) {
          throw new Error(
            String(payload?.error ?? t("app.browserCaptureSendFailed"))
          );
        }
        setCopiedCaptureField("agent");
        if (copiedCaptureFieldTimerRef.current != null) {
          window.clearTimeout(copiedCaptureFieldTimerRef.current);
        }
        copiedCaptureFieldTimerRef.current = window.setTimeout(() => {
          setCopiedCaptureField(null);
          copiedCaptureFieldTimerRef.current = null;
        }, 1200);
      } catch (error) {
        setCaptureExportError(
          error instanceof Error ? error.message : String(error)
        );
      } finally {
        setCaptureExportBusy(null);
      }
    }, [
      captureExportBusy,
      captureRequestTotal,
      loadBrowserCaptureExportRequests,
      selectedCaptureRequestIds,
      shell,
      t,
    ]);

    const analyzeBrowserCapture = useCallback(
      async (
        mode:
          | "auto"
          | "api-reverse"
          | "security-audit"
          | "performance"
          | "crypto-reverse"
      ) => {
        if (!shell || captureAnalyzeBusy) {
          return;
        }
        setCaptureAnalyzeBusy(true);
        setCaptureExportError(null);
        try {
          const requestIds =
            selectedCaptureRequestIds.size > 0
              ? Array.from(selectedCaptureRequestIds)
              : undefined;
          const payload = (await shell.invoke("browserCapture:analyze", {
            deliver: true,
            mode,
            requestIds,
          })) as {
            ok?: boolean;
            error?: unknown;
          };
          if (!payload?.ok) {
            throw new Error(
              String(payload?.error ?? t("app.browserCaptureSendFailed"))
            );
          }
          setCaptureAnalyzeMenuOpen(false);
          setCopiedCaptureField(`analyze:${mode}`);
          if (copiedCaptureFieldTimerRef.current != null) {
            window.clearTimeout(copiedCaptureFieldTimerRef.current);
          }
          copiedCaptureFieldTimerRef.current = window.setTimeout(() => {
            setCopiedCaptureField(null);
            copiedCaptureFieldTimerRef.current = null;
          }, 1400);
          // Give the dispatch handler a beat to register the new thread, then refresh.
          window.setTimeout(() => {
            void refreshBrowserCaptureAnalyses();
          }, 600);
        } catch (error) {
          setCaptureExportError(
            error instanceof Error ? error.message : String(error)
          );
        } finally {
          setCaptureAnalyzeBusy(false);
        }
      },
      [captureAnalyzeBusy, selectedCaptureRequestIds, shell, t]
    );

    const refreshBrowserCaptureAnalyses = useCallback(async () => {
      if (!shell) {
        return;
      }
      try {
        const payload = (await shell.invoke("browserCapture:analysisList")) as {
          ok?: boolean;
          entries?: unknown[];
        };
        if (payload?.ok && Array.isArray(payload.entries)) {
          setCaptureRecentAnalyses(
            payload.entries
              .filter((row): row is Record<string, unknown> =>
                Boolean(row && typeof row === "object")
              )
              .map(
                (row): BrowserCaptureAnalysisRecordUi => ({
                  createdAt: Number(row.createdAt) || 0,
                  id: String(row.id ?? ""),
                  mode: typeof row.mode === "string" ? row.mode : "auto",
                  sourceUrl:
                    typeof row.sourceUrl === "string" ? row.sourceUrl : "",
                  threadId: String(row.threadId ?? ""),
                  title:
                    typeof row.title === "string"
                      ? row.title
                      : "Capture analysis",
                })
              )
          );
        }
      } catch {
        /* ignore */
      }
    }, [shell]);

    useEffect(() => {
      void refreshBrowserCaptureAnalyses();
    }, [refreshBrowserCaptureAnalyses]);

    const openCaptureAnalysisThread = useCallback(
      async (record: BrowserCaptureAnalysisRecordUi) => {
        if (!shell || !record.threadId) return;
        try {
          await shell.invoke("threads:select", record.threadId).catch(() => {});
          // Dispatch a window event so App.tsx (which owns currentId) can pick it up too.
          window.dispatchEvent(
            new CustomEvent("mai-coder:focusThread", {
              detail: { threadId: record.threadId },
            })
          );
        } catch {
          /* ignore */
        }
      },
      [shell]
    );

    const removeCaptureAnalysisRecord = useCallback(
      async (id: string) => {
        if (!shell || !id) return;
        try {
          await shell.invoke("browserCapture:analysisRemove", { id });
          await refreshBrowserCaptureAnalyses();
        } catch {
          /* ignore */
        }
      },
      [refreshBrowserCaptureAnalyses, shell]
    );

    const toggleCaptureRequestSelected = useCallback(
      (requestId: string, selected: boolean) => {
        setSelectedCaptureRequestIds((prev) => {
          const next = new Set(prev);
          if (selected) {
            next.add(requestId);
          } else {
            next.delete(requestId);
          }
          return next;
        });
      },
      []
    );

    const toggleVisibleCaptureRequestsSelected = useCallback(() => {
      setSelectedCaptureRequestIds((prev) => {
        const visibleIds = captureRequests.map((request) => request.id);
        if (visibleIds.length <= 0) {
          return prev;
        }
        const allVisibleSelected = visibleIds.every((id) => prev.has(id));
        const next = new Set(prev);
        for (const id of visibleIds) {
          if (allVisibleSelected) {
            next.delete(id);
          } else {
            next.add(id);
          }
        }
        return next;
      });
    }, [captureRequests]);

    const handleCaptureDockResizePointerDown = useCallback(
      (event: ReactPointerEvent<HTMLDivElement>) => {
        event.preventDefault();
        setCapturePanelExpanded(true);
        const startY = event.clientY;
        const startHeight = captureDockHeight;
        const panel = event.currentTarget.closest(".ref-browser-panel");
        const panelHeight =
          panel instanceof HTMLElement
            ? panel.clientHeight
            : window.innerHeight;
        const maxHeight = Math.min(
          BROWSER_CAPTURE_DOCK_MAX_HEIGHT,
          Math.max(
            BROWSER_CAPTURE_DOCK_MIN_HEIGHT,
            Math.round(panelHeight * 0.62)
          )
        );
        const handlePointerMove = (moveEvent: PointerEvent) => {
          const delta = startY - moveEvent.clientY;
          setCaptureDockHeight(
            clampBrowserCaptureDockHeight(startHeight + delta, maxHeight)
          );
        };
        const handlePointerUp = () => {
          window.removeEventListener("pointermove", handlePointerMove);
          window.removeEventListener("pointerup", handlePointerUp);
          document.body.classList.remove("is-resizing-browser-capture-dock");
        };
        document.body.classList.add("is-resizing-browser-capture-dock");
        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);
      },
      [captureDockHeight]
    );

    const handleRegisterWebview = useCallback(
      (id: string, node: MaiShellWebviewElement | null) => {
        if (node) {
          webviewsRef.current.set(id, node);
          if (!defaultUserAgentRef.current) {
            try {
              defaultUserAgentRef.current = String(
                node.getUserAgent?.() ?? ""
              ).trim();
            } catch {
              /* ignore */
            }
          }
        } else {
          webviewsRef.current.delete(id);
        }
      },
      []
    );

    const handleTabNavigate = useCallback(
      (
        id: string,
        patch: { currentUrl: string; canGoBack: boolean; canGoForward: boolean }
      ) => {
        const addressFocused =
          typeof document !== "undefined" &&
          document.activeElement === addressInputRef.current;
        const keepDraft = id === activeTabIdRef.current && addressFocused;
        setTabs((prev) =>
          prev.map((tab) => {
            if (tab.id !== id) {
              return tab;
            }
            const resolvedUrl = patch.currentUrl || tab.currentUrl;
            return {
              ...tab,
              canGoBack: patch.canGoBack,
              canGoForward: patch.canGoForward,
              currentUrl: resolvedUrl,
              draftUrl: keepDraft ? tab.draftUrl : resolvedUrl,
              loadError: null,
            };
          })
        );
      },
      []
    );

    const handleTabTitle = useCallback((id: string, title: string) => {
      setTabs((prev) =>
        prev.map((tab) => (tab.id === id ? { ...tab, pageTitle: title } : tab))
      );
    }, []);

    const handleTabLoading = useCallback(
      (id: string, isLoading: boolean, currentUrl?: string) => {
        setTabs((prev) =>
          prev.map((tab) => {
            if (tab.id !== id) {
              return tab;
            }
            const next: BrowserTab = { ...tab, isLoading };
            if (isLoading) {
              next.loadError = null;
            } else if (currentUrl && currentUrl !== tab.currentUrl) {
              const addressFocused =
                typeof document !== "undefined" &&
                document.activeElement === addressInputRef.current;
              const keepDraft = id === activeTabIdRef.current && addressFocused;
              next.currentUrl = currentUrl;
              if (!keepDraft) {
                next.draftUrl = currentUrl;
              }
            }
            return next;
          })
        );
      },
      []
    );

    const handleTabFailLoad = useCallback(
      (id: string, error: { message: string; url: string }) => {
        setTabs((prev) =>
          prev.map((tab) => {
            if (tab.id !== id) {
              return tab;
            }
            return {
              ...tab,
              currentUrl: error.url || tab.currentUrl,
              isLoading: false,
              loadError: error,
            };
          })
        );
      },
      []
    );

    const showGoogleLoginExternalNotice = useCallback(
      (payload: { url?: string; error?: string | null }) => {
        const error = String(payload.error ?? "").trim();
        if (error) {
          setGoogleLoginNotice({ kind: "error", message: error });
          return;
        }
        const url = String(payload.url ?? "").trim();
        if (url) {
          setGoogleLoginNotice({ kind: "info", url });
        }
      },
      []
    );

    const redirectGoogleLoginToSystemBrowser = useCallback(
      async (rawUrl: string): Promise<boolean> => {
        const url = normalizeBrowserTarget(String(rawUrl ?? "").trim());
        if (!isGoogleLoginUrl(url)) {
          return false;
        }
        if (!shell?.invoke) {
          setGoogleLoginNotice({
            kind: "error",
            message: t("app.browserGoogleLoginExternalFailed"),
          });
          return true;
        }
        try {
          const payload = (await shell.invoke("shell:openExternalUrl", url)) as
            | { ok?: boolean; error?: string }
            | undefined;
          if (!payload || payload.ok === false) {
            setGoogleLoginNotice({
              kind: "error",
              message: String(
                payload?.error ?? t("app.browserGoogleLoginExternalFailed")
              ),
            });
            return true;
          }
          setGoogleLoginNotice({ kind: "info", url });
          return true;
        } catch (error) {
          setGoogleLoginNotice({
            kind: "error",
            message:
              error instanceof Error
                ? error.message
                : t("app.browserGoogleLoginExternalFailed"),
          });
          return true;
        }
      },
      [shell, t]
    );

    const openInNewTab = useCallback(
      (url: string) => {
        const trimmed = String(url ?? "").trim();
        if (!trimmed) {
          return;
        }
        void (async () => {
          if (await redirectGoogleLoginToSystemBrowser(trimmed)) {
            return;
          }
          const tab = createBrowserTab(trimmed);
          setTabs((prev) => [...prev, tab]);
          setActiveTabId(tab.id);
        })();
      },
      [redirectGoogleLoginToSystemBrowser]
    );

    const navigateTab = useCallback(
      (tabId: string, rawTarget: string) => {
        void (async () => {
          const nextUrl = normalizeBrowserTarget(rawTarget);
          if (await redirectGoogleLoginToSystemBrowser(nextUrl)) {
            setTabs((prev) =>
              prev.map((tab) =>
                tab.id === tabId
                  ? {
                      ...tab,
                      draftUrl: tab.currentUrl || tab.draftUrl,
                      isLoading: false,
                      loadError: null,
                    }
                  : tab
              )
            );
            return;
          }
          const prevTab =
            tabsRef.current.find((tab) => tab.id === tabId) ?? null;
          const sameAsRequested = prevTab?.requestedUrl === nextUrl;
          setActiveTabId(tabId);
          setTabs((prev) =>
            prev.map((tab) => {
              if (tab.id !== tabId) {
                return tab;
              }
              return {
                ...tab,
                canGoBack: false,
                canGoForward: false,
                currentUrl: nextUrl,
                draftUrl: nextUrl,
                isLoading: true,
                loadError: null,
                pageTitle: "",
                requestedUrl: nextUrl,
              };
            })
          );
          if (sameAsRequested) {
            webviewsRef.current.get(tabId)?.reload();
          }
        })();
      },
      [redirectGoogleLoginToSystemBrowser]
    );

    // Subscribe to main-process forwarded new-window events for webview contents.
    // Electron 12+ deprecated the 'new-window' event; the host (this webContents)
    // receives 'mai-coder:browserNewWindow' from web-contents-created hook in main.
    useEffect(() => {
      const subscribe = shell?.subscribeBrowserNewWindow;
      if (!subscribe) {
        return;
      }
      const unsubscribe = subscribe((payload) => {
        openInNewTab(String(payload?.url ?? ""));
      });
      return () => {
        unsubscribe?.();
      };
    }, [shell, openInNewTab]);

    useEffect(() => {
      const subscribe = shell?.subscribeGoogleLoginExternal;
      if (!subscribe) {
        return;
      }
      const unsubscribe = subscribe((payload) => {
        showGoogleLoginExternalNotice({
          error: payload?.error ?? null,
          url: String(payload?.url ?? ""),
        });
      });
      return () => {
        unsubscribe?.();
      };
    }, [shell, showGoogleLoginExternalNotice]);

    const addNewTab = useCallback(() => {
      const tab = createBrowserTab();
      setTabs((prev) => [...prev, tab]);
      setActiveTabId(tab.id);
      window.setTimeout(() => {
        addressInputRef.current?.focus();
        addressInputRef.current?.select();
      }, 50);
    }, []);

    const closeTab = useCallback((id: string) => {
      const prev = tabsRef.current;
      const closedIndex = prev.findIndex((tab) => tab.id === id);
      if (closedIndex < 0) {
        return;
      }
      webviewsRef.current.delete(id);
      if (prev.length <= 1) {
        const fresh = createBrowserTab();
        setTabs([fresh]);
        setActiveTabId(fresh.id);
        window.setTimeout(() => {
          addressInputRef.current?.focus();
          addressInputRef.current?.select();
        }, 50);
        return;
      }
      const nextTabs = prev.filter((tab) => tab.id !== id);
      setTabs(nextTabs);
      if (activeTabIdRef.current === id) {
        const nextActive = nextTabs[Math.min(closedIndex, nextTabs.length - 1)];
        setActiveTabId(nextActive.id);
      }
    }, []);

    const activateTab = useCallback((id: string) => {
      setActiveTabId(id);
    }, []);

    const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];
    const activeWebview = () =>
      activeTab ? (webviewsRef.current.get(activeTab.id) ?? null) : null;

    const onAddressChange = useCallback(
      (value: string) => {
        setTabs((prev) =>
          prev.map((tab) =>
            tab.id === activeTabId ? { ...tab, draftUrl: value } : tab
          )
        );
      },
      [activeTabId]
    );

    const onAddressSubmit = useCallback(
      (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!activeTab) {
          return;
        }
        addressInputRef.current?.blur();
        navigateTab(activeTabId, activeTab.draftUrl);
      },
      [activeTab, activeTabId, navigateTab]
    );

    const onAddressKeyDown = useCallback(
      (event: ReactKeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Escape") {
          event.preventDefault();
          if (activeTab) {
            setTabs((prev) =>
              prev.map((tab) =>
                tab.id === activeTabId
                  ? { ...tab, draftUrl: tab.currentUrl }
                  : tab
              )
            );
          }
          event.currentTarget.blur();
        }
      },
      [activeTab, activeTabId]
    );

    useEffect(() => {
      const onKeyDown = (event: KeyboardEvent) => {
        const key = event.key.toLowerCase();
        const commandKey = event.ctrlKey || event.metaKey;
        if (commandKey && key === "l") {
          event.preventDefault();
          addressInputRef.current?.focus();
          addressInputRef.current?.select();
          return;
        }
        const target = event.target as HTMLElement | null;
        const editing =
          target instanceof HTMLElement &&
          (Boolean(target.closest("input, textarea, select")) ||
            target.isContentEditable);
        if (editing) {
          return;
        }
        if (commandKey && key === "t") {
          event.preventDefault();
          addNewTab();
          return;
        }
        if (commandKey && key === "w") {
          event.preventDefault();
          const id = activeTabIdRef.current;
          if (id) {
            closeTab(id);
          }
          return;
        }
        if ((commandKey && key === "r") || event.key === "F5") {
          event.preventDefault();
          const id = activeTabIdRef.current;
          if (!id) {
            return;
          }
          setTabs((prev) =>
            prev.map((tab) =>
              tab.id === id ? { ...tab, loadError: null } : tab
            )
          );
          webviewsRef.current.get(id)?.reload();
          return;
        }
        if (event.altKey && event.key === "ArrowLeft") {
          event.preventDefault();
          const node = webviewsRef.current.get(activeTabIdRef.current);
          if (node?.canGoBack()) {
            node.goBack();
          }
          return;
        }
        if (event.altKey && event.key === "ArrowRight") {
          event.preventDefault();
          const node = webviewsRef.current.get(activeTabIdRef.current);
          if (node?.canGoForward()) {
            node.goForward();
          }
        }
      };
      window.addEventListener("keydown", onKeyDown);
      return () => {
        window.removeEventListener("keydown", onKeyDown);
      };
    }, [addNewTab, closeTab]);

    useEffect(() => {
      const onSync = (event: Event) => {
        const detail = browserSidebarConfigSyncDetail(event);
        if (!detail) {
          return;
        }
        applyBrowserConfigLocally(detail.config, detail.defaultUserAgent);
      };
      window.addEventListener(BROWSER_SIDEBAR_CONFIG_SYNC_EVENT, onSync);
      return () => {
        window.removeEventListener(BROWSER_SIDEBAR_CONFIG_SYNC_EVENT, onSync);
      };
    }, [applyBrowserConfigLocally]);

    useEffect(() => {
      if (!shell) {
        return;
      }
      const payload = {
        activeTabId,
        guestBindings: tabs
          .map((tab) => {
            const node = webviewsRef.current.get(tab.id);
            if (!node?.getWebContentsId) {
              return null;
            }
            try {
              const webContentsId = Number(node.getWebContentsId());
              if (!Number.isInteger(webContentsId) || webContentsId <= 0) {
                return null;
              }
              return {
                tabId: tab.id,
                webContentsId,
              };
            } catch {
              return null;
            }
          })
          .filter(
            (binding): binding is { tabId: string; webContentsId: number } =>
              Boolean(binding)
          ),
        tabs: tabs.map((tab) => ({
          canGoBack: tab.canGoBack,
          canGoForward: tab.canGoForward,
          currentUrl: tab.currentUrl,
          id: tab.id,
          isLoading: tab.isLoading,
          loadError: tab.loadError,
          pageTitle: tab.pageTitle,
          requestedUrl: tab.requestedUrl,
        })),
        updatedAt: Date.now(),
      };
      const timer = window.setTimeout(() => {
        void shell.invoke("browser:syncState", payload).catch(() => {
          /* ignore */
        });
      }, 40);
      return () => {
        window.clearTimeout(timer);
      };
    }, [activeTabId, shell, tabs]);

    useEffect(() => {
      if (!pendingCommand) {
        return;
      }
      const command = pendingCommand;
      const finish = () => onCommandHandled(command.commandId);
      if (command.type === "navigate") {
        const activeId = activeTabIdRef.current;
        const hasActiveTab = Boolean(
          activeId && tabsRef.current.some((tab) => tab.id === activeId)
        );
        if (command.newTab || !hasActiveTab || !activeId) {
          openInNewTab(normalizeBrowserTarget(command.target));
        } else {
          navigateTab(activeId, command.target);
        }
        finish();
        return;
      }
      if (command.type === "applyConfig") {
        applyBrowserConfigLocally(command.config, command.defaultUserAgent);
        finish();
        return;
      }
      if (command.type === "closeSidebar") {
        finish();
        return;
      }
      void (async () => {
        const targetTabId =
          command.tabId &&
          tabsRef.current.some((tab) => tab.id === command.tabId)
            ? command.tabId
            : activeTabIdRef.current;
        if (!targetTabId) {
          if (
            command.type === "readPage" ||
            command.type === "screenshotPage" ||
            command.type === "clickElement" ||
            command.type === "inputText" ||
            command.type === "waitForSelector"
          ) {
            await notifyBrowserCommandResult(shell, {
              commandId: command.commandId,
              error: "No active browser tab is available.",
              ok: false,
            });
          }
          finish();
          return;
        }
        if (command.type === "closeTab") {
          closeTab(targetTabId);
          finish();
          return;
        }
        setActiveTabId(targetTabId);
        if (
          command.type === "readPage" ||
          command.type === "screenshotPage" ||
          command.type === "clickElement" ||
          command.type === "inputText" ||
          command.type === "waitForSelector"
        ) {
          try {
            const node = await waitForWebviewNode(targetTabId);
            if (command.waitForLoad !== false) {
              await waitForWebviewSettled(node, targetTabId);
            }
            if (command.type === "readPage") {
              const result = await readPageFromWebview(node, {
                includeHtml: command.includeHtml,
                maxChars: command.maxChars,
                selector: command.selector,
              });
              await notifyBrowserCommandResult(shell, {
                commandId: command.commandId,
                ok: true,
                result,
              });
            } else if (command.type === "clickElement") {
              const result = await clickElementInWebview(node, {
                selector: command.selector,
              });
              if (command.waitForLoad !== false) {
                await new Promise((resolve) => window.setTimeout(resolve, 60));
                await waitForWebviewSettled(node, targetTabId);
              }
              await notifyBrowserCommandResult(shell, {
                commandId: command.commandId,
                ok: true,
                result,
              });
            } else if (command.type === "inputText") {
              const result = await inputTextInWebview(node, {
                pressEnter: command.pressEnter,
                selector: command.selector,
                text: command.text,
              });
              if (command.waitForLoad !== false && command.pressEnter) {
                await new Promise((resolve) => window.setTimeout(resolve, 60));
                await waitForWebviewSettled(node, targetTabId);
              }
              await notifyBrowserCommandResult(shell, {
                commandId: command.commandId,
                ok: true,
                result,
              });
            } else if (command.type === "waitForSelector") {
              const result = await waitForSelectorInWebview(node, {
                selector: command.selector,
                timeoutMs: command.timeoutMs,
                visible: command.visible,
              });
              await notifyBrowserCommandResult(shell, {
                commandId: command.commandId,
                ok: true,
                result,
              });
            } else {
              const result = await captureWebviewScreenshot(node);
              await notifyBrowserCommandResult(shell, {
                commandId: command.commandId,
                ok: true,
                result,
              });
            }
          } catch (error) {
            await notifyBrowserCommandResult(shell, {
              commandId: command.commandId,
              error: error instanceof Error ? error.message : String(error),
              ok: false,
            });
          } finally {
            finish();
          }
          return;
        }
        const node = webviewsRef.current.get(targetTabId);
        if (command.type === "reload") {
          setTabs((prev) =>
            prev.map((tab) =>
              tab.id === targetTabId ? { ...tab, loadError: null } : tab
            )
          );
          node?.reload();
        } else if (command.type === "stop") {
          node?.stop();
        } else if (command.type === "goBack") {
          if (node?.canGoBack()) {
            node.goBack();
          }
        } else if (command.type === "goForward" && node?.canGoForward()) {
          node.goForward();
        }
        finish();
      })();
    }, [
      applyBrowserConfigLocally,
      captureWebviewScreenshot,
      clickElementInWebview,
      closeTab,
      inputTextInWebview,
      navigateTab,
      onCommandHandled,
      openInNewTab,
      pendingCommand,
      readPageFromWebview,
      shell,
      waitForSelectorInWebview,
      waitForWebviewNode,
      waitForWebviewSettled,
    ]);

    const headerLabel = activeTab
      ? activeTab.isLoading
        ? t("app.browserLoading")
        : activeTab.pageTitle ||
          activeTab.currentUrl.replace(/^https?:\/\//i, "") ||
          t("app.tabBrowser")
      : t("app.tabBrowser");
    const headerUrl = activeTab?.currentUrl ?? "";
    const userAgentProp = browserConfig.userAgent.trim() || undefined;
    const fingerprintPayloadKey = useMemo(
      () => JSON.stringify(browserConfig.fingerprint),
      [browserConfig.fingerprint]
    );
    const fingerprintScript = useMemo(() => {
      const patch = fingerprintSettingsToInjectPatch(browserConfig.fingerprint);
      return buildBrowserFingerprintStealthScript(patch);
    }, [fingerprintPayloadKey]);
    const captureRequestCount = captureState?.requestCount ?? 0;
    const capturePendingCount = captureState?.pendingRequestCount ?? 0;
    const captureTotalCount = captureRequestCount + capturePendingCount;
    const captureAttachedTabCount =
      captureState?.tabs.filter((tab) => tab.attached).length ?? 0;
    const captureKnownTabCount = captureState?.tabs.length ?? 0;
    const captureHasAttachError = Boolean(
      captureState?.tabs.some((tab) => tab.lastError)
    );
    const browserTabCountLabel = t("app.browserTabsCount", {
      count: String(tabs.length),
    });
    const captureProxyIsRunning = captureProxyStatus?.running === true;
    const captureProxyPrimaryAddress =
      captureProxyStatus?.primaryAddress || "127.0.0.1";
    const captureProxyPort = captureProxyStatus?.port ?? 8888;
    const captureProxyUrl =
      captureProxyStatus?.proxyUrl ||
      `http://${captureProxyPrimaryAddress}:${captureProxyPort}`;
    const captureProxyCaUrl =
      captureProxyStatus?.caDownloadUrl ||
      `${captureProxyUrl.replace(/\/$/, "")}/__async_capture/ca.pem`;
    const captureProxyStatusText = captureProxyError
      ? captureProxyError
      : captureProxyIsRunning
        ? t("app.browserCaptureProxyRunning")
        : t("app.browserCaptureProxyStopped");
    const captureProxyCaInstalled = captureProxyStatus?.caInstalled === true;
    const captureProxySystemEnabled =
      captureProxyStatus?.systemProxyEnabled === true;
    const clearDataTitle = clearDataError || t("app.browserClearData");
    const selectedCaptureSummary =
      (selectedCaptureRequestId
        ? captureRequests.find(
            (request) => request.id === selectedCaptureRequestId
          )
        : null) ?? null;
    const selectedCaptureView =
      selectedCaptureRequest ?? selectedCaptureSummary;
    const captureListCaption = captureListError
      ? captureListError
      : captureListBusy
        ? t("app.browserCaptureLoadingRequests")
        : t("app.browserCaptureShowingRequests", {
            count: String(captureRequests.length),
            total: String(captureRequestTotal),
          });
    const visibleCaptureSelectedCount = captureRequests.reduce(
      (count, request) =>
        count + (selectedCaptureRequestIds.has(request.id) ? 1 : 0),
      0
    );
    const captureSelectAllChecked =
      captureRequests.length > 0 &&
      visibleCaptureSelectedCount === captureRequests.length;
    const captureSelectedCount = selectedCaptureRequestIds.size;
    const captureBulkScopeLabel =
      captureSelectedCount > 0
        ? t("app.browserCaptureSelectedCount", {
            count: String(captureSelectedCount),
          })
        : t("app.browserCaptureFilteredCount", {
            count: String(captureRequestTotal),
          });
    const captureBulkStatusText = captureExportError || captureBulkScopeLabel;
    const captureBulkActionsDisabled =
      Boolean(captureExportBusy) ||
      (captureSelectedCount <= 0 && captureRequestTotal <= 0);
    const captureCanLoadMore = captureRequests.length < captureRequestTotal;
    const captureRemainingRequestCount = Math.max(
      0,
      captureRequestTotal - captureRequests.length
    );
    const captureStatusFilters = useMemo<
      Array<{ key: BrowserCaptureStatusFilter; label: string }>
    >(
      () => [
        { key: "all", label: t("app.browserCaptureFilterAll") },
        { key: "pending", label: t("app.browserCaptureFilterPending") },
        { key: "2xx", label: "2xx" },
        { key: "3xx", label: "3xx" },
        { key: "4xx", label: "4xx" },
        { key: "5xx", label: "5xx" },
        { key: "error", label: t("app.browserCaptureFilterError") },
      ],
      [t]
    );
    const captureMethodFilters = useMemo<
      Array<{ key: BrowserCaptureMethodFilter; label: string }>
    >(
      () => [
        { key: "all", label: t("app.browserCaptureFilterAll") },
        { key: "GET", label: "GET" },
        { key: "POST", label: "POST" },
        { key: "PUT", label: "PUT" },
        { key: "PATCH", label: "PATCH" },
        { key: "DELETE", label: "DELETE" },
        { key: "OPTIONS", label: "OPTIONS" },
        { key: "OTHER", label: t("app.browserCaptureFilterOther") },
      ],
      [t]
    );
    const captureSourceFilters = useMemo<
      Array<{ key: BrowserCaptureSourceFilter; label: string }>
    >(
      () => [
        { key: "all", label: t("app.browserCaptureFilterAll") },
        { key: "browser", label: t("app.browserCaptureSourceBrowserShort") },
        { key: "proxy", label: t("app.browserCaptureSourceProxyShort") },
      ],
      [t]
    );
    const captureResourceFilters = useMemo<
      Array<{ key: BrowserCaptureResourceFilter; label: string }>
    >(
      () => [
        { key: "all", label: t("app.browserCaptureFilterAll") },
        { key: "document", label: t("app.browserCaptureResourceDocument") },
        { key: "xhr", label: "XHR" },
        { key: "fetch", label: "Fetch" },
        { key: "script", label: t("app.browserCaptureResourceScript") },
        { key: "stylesheet", label: t("app.browserCaptureResourceStylesheet") },
        { key: "image", label: t("app.browserCaptureResourceImage") },
        { key: "other", label: t("app.browserCaptureFilterOther") },
      ],
      [t]
    );
    const captureDetailTabs = useMemo<
      Array<{ key: BrowserCaptureDetailTab; label: string }>
    >(
      () => [
        { key: "headers", label: t("app.browserCaptureTabHeaders") },
        { key: "request", label: t("app.browserCaptureTabRequest") },
        { key: "response", label: t("app.browserCaptureTabResponse") },
      ],
      [t]
    );
    const capturePanelTabs = useMemo<
      Array<{ key: BrowserCapturePanelTab; label: string }>
    >(
      () => [
        { key: "requests", label: t("app.browserCaptureTabRequests") },
        { key: "hooks", label: t("app.browserCaptureTabHooks") },
        { key: "storage", label: t("app.browserCaptureTabStorage") },
        { key: "devices", label: t("app.browserCaptureTabDevices") },
      ],
      [t]
    );
    useEffect(() => {
      if (!captureSelectAllRef.current) {
        return;
      }
      captureSelectAllRef.current.indeterminate =
        visibleCaptureSelectedCount > 0 &&
        visibleCaptureSelectedCount < captureRequests.length;
    }, [captureRequests.length, visibleCaptureSelectedCount]);
    const handleCaptureRowKeyDown = useCallback(
      (event: ReactKeyboardEvent<HTMLDivElement>, requestId: string) => {
        if (event.key === "Enter") {
          event.preventDefault();
          setSelectedCaptureRequestId(requestId);
          return;
        }
        if (event.key === " ") {
          event.preventDefault();
          toggleCaptureRequestSelected(
            requestId,
            !selectedCaptureRequestIds.has(requestId)
          );
        }
      },
      [selectedCaptureRequestIds, toggleCaptureRequestSelected]
    );
    const captureDockBodyStyle = {
      "--ref-browser-capture-dock-height": `${captureDockHeight}px`,
    } as CSSProperties;
    const selectedRequestHeaderEntries = selectedCaptureRequest
      ? Object.entries(selectedCaptureRequest.requestHeaders).sort(
          ([left], [right]) => left.localeCompare(right)
        )
      : [];
    const selectedResponseHeaderEntries = selectedCaptureRequest
      ? Object.entries(selectedCaptureRequest.responseHeaders).sort(
          ([left], [right]) => left.localeCompare(right)
        )
      : [];
    const selectedRequestBodyText = selectedCaptureRequest
      ? browserCaptureFormatBody(selectedCaptureRequest.requestBody)
      : "";
    const selectedResponseBodyText = selectedCaptureRequest
      ? browserCaptureFormatBody(selectedCaptureRequest.responseBody)
      : "";
    const selectedResponseOmissionText =
      selectedCaptureRequest?.responseBodyOmittedReason
        ? t("app.browserCaptureResponseBodyOmitted", {
            reason: selectedCaptureRequest.responseBodyOmittedReason,
          })
        : "";

    return (
      <div
        className={`ref-agent-review-shell ref-browser-shell ref-browser-shell--${variant}`}
      >
        <div className="ref-agent-review-head">
          <div className="ref-browser-head-main">
            <div className="ref-agent-review-title-stack ref-browser-title-stack">
              <span className="ref-agent-review-kicker">
                <span
                  aria-hidden="true"
                  className={`ref-browser-live-dot${activeTab?.isLoading ? " is-loading" : ""}`}
                />
                {t("app.tabBrowser")}
              </span>
              <span className="ref-agent-review-title" title={headerUrl}>
                {headerLabel}
              </span>
            </div>
            <div
              aria-label={t("app.tabBrowser")}
              className="ref-browser-head-meta"
            >
              <span className="ref-browser-status-chip">
                {browserTabCountLabel}
              </span>
              {variant === "window" ? null : (
                <span
                  className={`ref-browser-status-chip${captureIsActive ? " is-active" : ""}`}
                >
                  {captureIsActive
                    ? t("app.browserCaptureRequestsShort", {
                        count: String(captureTotalCount),
                      })
                    : t("app.browserCaptureReady")}
                </span>
              )}
            </div>
          </div>
          {variant === "window" ? (
            <div className="ref-agent-review-actions">
              <button
                aria-label={t("app.browserOpenSettingsInMain")}
                className="ref-right-icon-tab"
                onClick={onOpenBrowserSettings}
                title={t("app.browserOpenSettingsInMain")}
                type="button"
              >
                <IconSettings />
              </button>
            </div>
          ) : (
            <RightSidebarTabs
              closeSidebar={closeSidebar}
              extraActions={
                <button
                  aria-label={t("app.browserSettings")}
                  className="ref-right-icon-tab"
                  onClick={onOpenBrowserSettings}
                  title={t("app.browserSettings")}
                  type="button"
                >
                  <IconSettings />
                </button>
              }
              hasPlan={hasAgentPlanSidebarContent}
              openView={openView}
              t={t}
            />
          )}
        </div>
        <div className="ref-right-panel-stage">
          <div
            className={`ref-right-panel-view ref-right-panel-view--agent ref-browser-panel ref-browser-panel--${variant}`}
          >
            {browserConfigReady ? (
              <div
                aria-label={t("app.tabBrowser")}
                className="ref-browser-tabstrip"
                role="tablist"
              >
                <div className="ref-browser-tabstrip-scroll">
                  {tabs.map((tab) => {
                    const tabActive = tab.id === activeTabId;
                    const tabLabel =
                      (tab.pageTitle && tab.pageTitle.trim()) ||
                      (tab.currentUrl
                        ? tab.currentUrl.replace(/^https?:\/\//i, "")
                        : "") ||
                      t("app.browserUntitled");
                    return (
                      <div
                        aria-selected={tabActive}
                        className={`ref-browser-tab${tabActive ? " is-active" : ""}`}
                        key={tab.id}
                        onClick={() => activateTab(tab.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            activateTab(tab.id);
                          }
                        }}
                        onMouseDown={(event) => {
                          // middle-click closes tab, like real browsers
                          if (event.button === 1) {
                            event.preventDefault();
                            closeTab(tab.id);
                          }
                        }}
                        role="tab"
                        tabIndex={0}
                        title={tab.currentUrl || tabLabel}
                      >
                        <span
                          aria-hidden="true"
                          className="ref-browser-tab-indicator"
                        >
                          {tab.isLoading ? (
                            <span className="ref-browser-tab-spinner" />
                          ) : (
                            <IconGlobe className="ref-browser-tab-favicon" />
                          )}
                        </span>
                        <span className="ref-browser-tab-label">
                          {tabLabel}
                        </span>
                        <button
                          aria-label={t("app.browserCloseTab")}
                          className="ref-browser-tab-close"
                          onClick={(event) => {
                            event.stopPropagation();
                            closeTab(tab.id);
                          }}
                          title={t("app.browserCloseTab")}
                          type="button"
                        >
                          <IconCloseSmall />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <button
                  aria-label={t("app.browserNewTab")}
                  className="ref-browser-tabstrip-add"
                  onClick={addNewTab}
                  title={t("app.browserNewTab")}
                  type="button"
                >
                  <IconPlus />
                </button>
              </div>
            ) : null}
            <div className="ref-right-toolbar ref-browser-toolbar">
              <div className="ref-browser-toolbar-group ref-browser-toolbar-group--nav">
                <button
                  aria-label={t("common.back")}
                  className="ref-icon-tile ref-browser-tool-btn"
                  disabled={!activeTab?.canGoBack}
                  onClick={() => {
                    const node = activeWebview();
                    if (!node?.canGoBack()) {
                      return;
                    }
                    node.goBack();
                  }}
                  title={t("common.back")}
                  type="button"
                >
                  <IconArrowLeft />
                </button>
                <button
                  aria-label={t("app.browserForward")}
                  className="ref-icon-tile ref-browser-tool-btn"
                  disabled={!activeTab?.canGoForward}
                  onClick={() => {
                    const node = activeWebview();
                    if (!node?.canGoForward()) {
                      return;
                    }
                    node.goForward();
                  }}
                  title={t("app.browserForward")}
                  type="button"
                >
                  <IconArrowRight />
                </button>
                <button
                  aria-label={
                    activeTab?.isLoading
                      ? t("app.browserStop")
                      : t("common.refresh")
                  }
                  className="ref-icon-tile ref-browser-tool-btn"
                  onClick={() => {
                    const node = activeWebview();
                    if (!node) {
                      return;
                    }
                    if (activeTab?.isLoading) {
                      node.stop();
                      return;
                    }
                    setTabs((prev) =>
                      prev.map((tab) =>
                        tab.id === activeTabId
                          ? { ...tab, loadError: null }
                          : tab
                      )
                    );
                    node.reload();
                  }}
                  title={
                    activeTab?.isLoading
                      ? t("app.browserStop")
                      : t("common.refresh")
                  }
                  type="button"
                >
                  {activeTab?.isLoading ? <IconStop /> : <IconRefresh />}
                </button>
                <div className="ref-browser-clear-wrap">
                  <button
                    aria-label={clearDataTitle}
                    className="ref-icon-tile ref-browser-tool-btn"
                    disabled={clearDataBusy}
                    onClick={() => {
                      setClearDataConfirmOpen((open) => !open);
                      setClearDataError(null);
                    }}
                    title={clearDataTitle}
                    type="button"
                  >
                    <IconTrash />
                  </button>
                  {clearDataConfirmOpen ? (
                    <div
                      aria-label={t("app.browserClearData")}
                      className="ref-browser-clear-confirm"
                      role="dialog"
                    >
                      <span className="ref-browser-clear-confirm-copy">
                        {clearDataError || t("app.browserClearDataConfirm")}
                      </span>
                      <div className="ref-browser-clear-confirm-actions">
                        <button
                          className="ref-browser-mini-btn ref-browser-mini-btn--danger"
                          disabled={clearDataBusy}
                          onClick={() => void clearBrowserData()}
                          type="button"
                        >
                          {clearDataBusy
                            ? t("app.browserClearingData")
                            : t("app.browserClearDataAction")}
                        </button>
                        <button
                          className="ref-browser-mini-btn"
                          disabled={clearDataBusy}
                          onClick={() => {
                            setClearDataConfirmOpen(false);
                            setClearDataError(null);
                          }}
                          type="button"
                        >
                          {t("common.cancel")}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
              <form
                className="ref-browser-address-form"
                onSubmit={onAddressSubmit}
              >
                <IconGlobe className="ref-browser-address-icon" />
                <input
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="ref-browser-address-input"
                  onChange={(event) => onAddressChange(event.target.value)}
                  onFocus={(event) => event.currentTarget.select()}
                  onKeyDown={onAddressKeyDown}
                  placeholder={t("app.browserAddressPlaceholder")}
                  ref={addressInputRef}
                  spellCheck={false}
                  type="text"
                  value={activeTab?.draftUrl ?? ""}
                />
                <button
                  aria-label={t("app.browserGo")}
                  className="ref-browser-address-go"
                  disabled={!String(activeTab?.draftUrl ?? "").trim()}
                  title={t("app.browserGo")}
                  type="submit"
                >
                  <IconArrowUp />
                </button>
              </form>
            </div>
            {googleLoginNotice ? (
              <div
                className={`ref-browser-capture-banner ref-browser-google-login-notice${
                  googleLoginNotice.kind === "info"
                    ? " ref-browser-capture-banner--info"
                    : ""
                }`}
                role={googleLoginNotice.kind === "error" ? "alert" : "status"}
              >
                <span>
                  {googleLoginNotice.kind === "error"
                    ? googleLoginNotice.message
                    : `${t("app.browserGoogleLoginExternalTitle")} — ${t("app.browserGoogleLoginExternalBody")}`}
                </span>
                <button
                  aria-label={t("common.close")}
                  className="ref-browser-capture-banner-dismiss"
                  onClick={() => setGoogleLoginNotice(null)}
                  title={t("common.close")}
                  type="button"
                >
                  <IconCloseSmall />
                </button>
              </div>
            ) : null}
            <div className="ref-browser-webview-wrap">
              {browserConfigReady && browserPartition ? (
                tabs.map((tab) => (
                  <BrowserTabView
                    active={tab.id === activeTabId}
                    fingerprintScript={fingerprintScript}
                    hookEnabled={
                      captureIsActive &&
                      !isGoogleLoginUrl(tab.currentUrl || tab.requestedUrl)
                    }
                    hookScript={browserHookScript}
                    key={tab.id}
                    onFailLoad={handleTabFailLoad}
                    onHookEvents={handleHookEventsForTab}
                    onLoading={handleTabLoading}
                    onNavigate={handleTabNavigate}
                    onRegisterWebview={handleRegisterWebview}
                    onStorageSnapshot={handleStorageSnapshotForTab}
                    onTitle={handleTabTitle}
                    partition={browserPartition}
                    t={t}
                    tab={tab}
                    userAgent={userAgentProp}
                  />
                ))
              ) : (
                <div className="ref-browser-preparing">
                  <div className="ref-agent-plan-status-title">
                    {t("app.browserPreparing")}
                  </div>
                  <p className="ref-agent-plan-status-body">
                    {t("app.browserSettingsDescription")}
                  </p>
                </div>
              )}
              {activeTab?.loadError ? (
                <div className="ref-browser-error-card" role="status">
                  <div className="ref-browser-error-title">
                    {t("app.browserLoadFailed")}
                  </div>
                  <p className="ref-browser-error-body">
                    {activeTab.loadError.message}
                  </p>
                  {activeTab.loadError.url ? (
                    <p
                      className="ref-browser-error-url"
                      title={activeTab.loadError.url}
                    >
                      {activeTab.loadError.url}
                    </p>
                  ) : null}
                  <button
                    className="ref-browser-error-btn"
                    onClick={() => {
                      const tabId = activeTabId;
                      setTabs((prev) =>
                        prev.map((tab) =>
                          tab.id === tabId ? { ...tab, loadError: null } : tab
                        )
                      );
                      webviewsRef.current.get(tabId)?.reload();
                    }}
                    type="button"
                  >
                    {t("common.refresh")}
                  </button>
                </div>
              ) : null}
            </div>
            <div
              className={`ref-browser-capture-dock${capturePanelExpanded ? " is-expanded" : " is-collapsed"}${
                captureIsActive ? " is-active" : ""
              }`}
            >
              <div className="ref-browser-capture-dock-summary">
                <button
                  aria-expanded={capturePanelExpanded}
                  aria-label={
                    capturePanelExpanded
                      ? t("app.browserCaptureCollapse")
                      : t("app.browserCaptureExpand")
                  }
                  className="ref-browser-capture-dock-toggle"
                  onClick={() =>
                    setCapturePanelExpanded((expanded) => !expanded)
                  }
                  title={
                    capturePanelExpanded
                      ? t("app.browserCaptureCollapse")
                      : t("app.browserCaptureExpand")
                  }
                  type="button"
                >
                  <span
                    aria-hidden="true"
                    className="ref-browser-capture-dot"
                  />
                  <span className="ref-browser-capture-dock-title">
                    {captureIsActive
                      ? t("app.browserCaptureCapturing")
                      : t("app.browserCaptureReady")}
                  </span>
                  <span className="ref-browser-capture-dock-metric">
                    {t("app.browserCaptureRequestsShort", {
                      count: String(captureTotalCount),
                    })}
                  </span>
                  <span
                    className={`ref-browser-capture-dock-metric${captureHasAttachError ? " is-warning" : ""}`}
                  >
                    {t("app.browserCaptureTabsShort", {
                      attached: String(captureAttachedTabCount),
                      total: String(captureKnownTabCount || tabs.length),
                    })}
                  </span>
                  <span
                    className={`ref-browser-capture-dock-metric${captureProxyIsRunning ? " is-active" : ""}`}
                  >
                    {captureProxyIsRunning
                      ? t("app.browserCaptureProxyShortOn")
                      : t("app.browserCaptureProxyShortOff")}
                  </span>
                  <IconChevron className="ref-browser-capture-dock-chevron" />
                </button>
                <div
                  className="ref-browser-capture-dock-quick-actions"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    className={`ref-browser-capture-btn${captureIsActive ? " ref-browser-capture-btn--danger" : " ref-browser-capture-btn--primary"}`}
                    disabled={Boolean(captureBusy)}
                    onClick={() =>
                      void runBrowserCaptureAction(
                        captureIsActive ? "stop" : "start"
                      )
                    }
                    title={
                      captureIsActive
                        ? t("app.browserCaptureStop")
                        : t("app.browserCaptureStart")
                    }
                    type="button"
                  >
                    {captureBusy === "start"
                      ? t("app.browserCaptureStarting")
                      : captureBusy === "stop"
                        ? t("app.browserCaptureStopping")
                        : captureIsActive
                          ? t("app.browserCaptureStop")
                          : t("app.browserCaptureStart")}
                  </button>
                  <button
                    className={`ref-browser-capture-btn ref-browser-capture-btn--ghost${captureProxyIsRunning ? " is-active" : ""}`}
                    disabled={Boolean(captureProxyBusy || captureBusy)}
                    onClick={() =>
                      void runBrowserCaptureProxyAction(
                        captureProxyIsRunning ? "stop" : "start"
                      )
                    }
                    title={
                      captureProxyIsRunning
                        ? t("app.browserCaptureProxyStop")
                        : t("app.browserCaptureProxyStart")
                    }
                    type="button"
                  >
                    {captureProxyBusy === "start"
                      ? t("app.browserCaptureProxyStarting")
                      : captureProxyBusy === "stop"
                        ? t("app.browserCaptureProxyStopping")
                        : captureProxyIsRunning
                          ? t("app.browserCaptureProxyStop")
                          : t("app.browserCaptureProxyStart")}
                  </button>
                  <button
                    className="ref-browser-capture-btn ref-browser-capture-btn--ghost"
                    disabled={Boolean(captureBusy) || captureTotalCount <= 0}
                    onClick={() => void runBrowserCaptureAction("clear")}
                    title={t("app.browserCaptureClear")}
                    type="button"
                  >
                    {captureBusy === "clear"
                      ? t("app.browserCaptureClearing")
                      : t("app.browserCaptureClear")}
                  </button>
                  <div
                    className="ref-browser-capture-sessions-menu"
                    ref={captureSessionsMenuRef}
                  >
                    <button
                      aria-expanded={captureSessionsMenuOpen}
                      aria-haspopup="menu"
                      className="ref-browser-capture-btn ref-browser-capture-btn--ghost"
                      onClick={() => {
                        setCaptureSessionsMenuOpen((open) => {
                          const next = !open;
                          if (next) {
                            void refreshBrowserCaptureSessions();
                          }
                          return next;
                        });
                      }}
                      title={t("app.browserCaptureSessionsTitle")}
                      type="button"
                    >
                      {t("app.browserCaptureSessionsLabel")}
                    </button>
                    {captureSessionsMenuOpen ? (
                      <div
                        className="ref-browser-capture-sessions-popover"
                        role="menu"
                      >
                        <div className="ref-browser-capture-sessions-popover-head">
                          <input
                            aria-label={t(
                              "app.browserCaptureSessionsSavePlaceholder"
                            )}
                            className="ref-browser-capture-search"
                            onChange={(event) =>
                              setCaptureSessionsSaveName(event.target.value)
                            }
                            placeholder={t(
                              "app.browserCaptureSessionsSavePlaceholder"
                            )}
                            type="text"
                            value={captureSessionsSaveName}
                          />
                          <button
                            className="ref-browser-capture-mini-btn ref-browser-capture-mini-btn--primary"
                            disabled={
                              captureSessionsBusy === "save" ||
                              captureTotalCount <= 0
                            }
                            onClick={() => void saveBrowserCaptureSession()}
                            type="button"
                          >
                            {captureSessionsBusy === "save"
                              ? t("app.browserCaptureSendingToAgent")
                              : t("app.browserCaptureSessionsSave")}
                          </button>
                        </div>
                        <div className="ref-browser-capture-sessions-popover-list">
                          {captureSessionsList.length > 0 ? (
                            captureSessionsList.map((session) => (
                              <div
                                className="ref-browser-capture-sessions-row"
                                key={session.id}
                              >
                                <button
                                  className="ref-browser-capture-sessions-row-main"
                                  disabled={captureSessionsBusy === "load"}
                                  onClick={() =>
                                    void loadBrowserCaptureSession(session.id)
                                  }
                                  title={`${session.name}\n${new Date(session.updatedAt).toLocaleString()}`}
                                  type="button"
                                >
                                  <span className="ref-browser-capture-sessions-row-name">
                                    {session.name}
                                  </span>
                                  <span className="ref-browser-capture-sessions-row-meta">
                                    {t("app.browserCaptureRequestsShort", {
                                      count: String(session.requestCount),
                                    })}{" "}
                                    ·{" "}
                                    {new Date(
                                      session.updatedAt
                                    ).toLocaleDateString()}
                                  </span>
                                </button>
                                <button
                                  aria-label={t(
                                    "app.browserCaptureSessionsDelete"
                                  )}
                                  className="ref-browser-copy-icon-btn"
                                  onClick={() =>
                                    void deleteBrowserCaptureSession(session.id)
                                  }
                                  title={t("app.browserCaptureSessionsDelete")}
                                  type="button"
                                >
                                  <IconTrash />
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="ref-browser-capture-inline-empty">
                              {t("app.browserCaptureSessionsEmpty")}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
              {capturePanelExpanded ? (
                <>
                  <div
                    aria-orientation="horizontal"
                    className="ref-browser-capture-dock-resize"
                    onPointerDown={handleCaptureDockResizePointerDown}
                    role="separator"
                    title={t("app.browserCaptureResizeDock")}
                  >
                    <span aria-hidden="true" />
                  </div>
                  <div
                    className="ref-browser-capture-dock-body"
                    style={captureDockBodyStyle}
                  >
                    {captureError ? (
                      <div
                        className="ref-browser-capture-banner ref-browser-capture-banner--error"
                        role="alert"
                      >
                        <span>{captureError}</span>
                        <button
                          aria-label={t("common.close")}
                          className="ref-browser-capture-banner-dismiss"
                          onClick={() => setCaptureError(null)}
                          title={t("common.close")}
                          type="button"
                        >
                          <IconCloseSmall />
                        </button>
                      </div>
                    ) : null}
                    {captureProxyError ? (
                      <div
                        className="ref-browser-capture-banner ref-browser-capture-banner--error"
                        role="alert"
                      >
                        <span>{captureProxyError}</span>
                        <button
                          aria-label={t("common.close")}
                          className="ref-browser-capture-banner-dismiss"
                          onClick={() => setCaptureProxyError(null)}
                          title={t("common.close")}
                          type="button"
                        >
                          <IconCloseSmall />
                        </button>
                      </div>
                    ) : null}
                    <div
                      aria-label={t("app.browserCapturePanel")}
                      className="ref-browser-capture-mode-tabs"
                      role="tablist"
                    >
                      {capturePanelTabs.map((tab) => (
                        <button
                          aria-selected={capturePanelTab === tab.key}
                          className={`ref-browser-capture-mode-tab${capturePanelTab === tab.key ? " is-active" : ""}`}
                          key={tab.key}
                          onClick={() => setCapturePanelTab(tab.key)}
                          role="tab"
                          type="button"
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    {capturePanelTab === "requests" ? (
                      <div
                        className={`ref-browser-capture-network${captureDetailVisible ? "" : " is-detail-collapsed"}`}
                      >
                        <div className="ref-browser-capture-list">
                          <div className="ref-browser-capture-list-toolbar">
                            <div className="ref-browser-capture-list-toolbar-row">
                              <label className="ref-browser-capture-search-wrap">
                                <IconSearch className="ref-browser-capture-search-icon" />
                                <input
                                  aria-label={t(
                                    "app.browserCaptureSearchPlaceholder"
                                  )}
                                  className="ref-browser-capture-search"
                                  onChange={(event) =>
                                    setCaptureQuery(event.target.value)
                                  }
                                  placeholder={t(
                                    "app.browserCaptureSearchPlaceholder"
                                  )}
                                  type="search"
                                  value={captureQuery}
                                />
                              </label>
                              <div className="ref-browser-capture-bulk-actions">
                                <span
                                  className={`ref-browser-capture-bulk-status${captureExportError ? " has-error" : ""}`}
                                  title={captureBulkStatusText}
                                >
                                  {captureBulkStatusText}
                                </span>
                                <div
                                  className="ref-browser-capture-analyze-menu"
                                  ref={captureAnalyzeMenuRef}
                                >
                                  <button
                                    aria-expanded={captureAnalyzeMenuOpen}
                                    aria-haspopup="menu"
                                    className="ref-browser-capture-mini-btn ref-browser-capture-mini-btn--primary"
                                    disabled={
                                      captureBulkActionsDisabled ||
                                      !shell ||
                                      captureAnalyzeBusy
                                    }
                                    onClick={() =>
                                      setCaptureAnalyzeMenuOpen((open) => !open)
                                    }
                                    title={t("app.browserCaptureAnalyzeLabel")}
                                    type="button"
                                  >
                                    <IconArrowUpRight />
                                    <span>
                                      {captureAnalyzeBusy
                                        ? t("app.browserCaptureAnalyzing")
                                        : copiedCaptureField?.startsWith(
                                              "analyze:"
                                            )
                                          ? t("app.browserCaptureSentToAgent")
                                          : t("app.browserCaptureAnalyzeLabel")}
                                    </span>
                                  </button>
                                  {captureAnalyzeMenuOpen ? (
                                    <div
                                      className="ref-browser-capture-analyze-popover"
                                      role="menu"
                                    >
                                      <div className="ref-browser-capture-analyze-popover-head">
                                        {t("app.browserCaptureAnalyzeHeading")}
                                      </div>
                                      {(
                                        [
                                          [
                                            "auto",
                                            "app.browserCaptureAnalyzeAuto",
                                            "app.browserCaptureAnalyzeAutoHint",
                                          ],
                                          [
                                            "api-reverse",
                                            "app.browserCaptureAnalyzeApi",
                                            "app.browserCaptureAnalyzeApiHint",
                                          ],
                                          [
                                            "security-audit",
                                            "app.browserCaptureAnalyzeSecurity",
                                            "app.browserCaptureAnalyzeSecurityHint",
                                          ],
                                          [
                                            "performance",
                                            "app.browserCaptureAnalyzePerf",
                                            "app.browserCaptureAnalyzePerfHint",
                                          ],
                                          [
                                            "crypto-reverse",
                                            "app.browserCaptureAnalyzeCrypto",
                                            "app.browserCaptureAnalyzeCryptoHint",
                                          ],
                                        ] as const
                                      ).map(([key, labelKey, hintKey]) => (
                                        <button
                                          disabled={captureAnalyzeBusy}
                                          key={key}
                                          onClick={() =>
                                            void analyzeBrowserCapture(key)
                                          }
                                          role="menuitem"
                                          type="button"
                                        >
                                          <strong>{t(labelKey)}</strong>
                                          <span>{t(hintKey)}</span>
                                        </button>
                                      ))}
                                      <div className="ref-browser-capture-analyze-popover-divider" />
                                      <button
                                        disabled={
                                          captureBulkActionsDisabled || !shell
                                        }
                                        onClick={() => {
                                          setCaptureAnalyzeMenuOpen(false);
                                          void sendBrowserCaptureToAgentDraft();
                                        }}
                                        role="menuitem"
                                        type="button"
                                      >
                                        <strong>
                                          {t("app.browserCaptureSendToAgent")}
                                        </strong>
                                        <span>
                                          {t(
                                            "app.browserCaptureSendToAgentHint"
                                          )}
                                        </span>
                                      </button>
                                      {captureRecentAnalyses.length > 0 ? (
                                        <>
                                          <div className="ref-browser-capture-analyze-popover-divider" />
                                          <div className="ref-browser-capture-analyze-popover-head">
                                            {t(
                                              "app.browserCaptureRecentAnalyses"
                                            )}
                                          </div>
                                          <div className="ref-browser-capture-analyze-recents">
                                            {captureRecentAnalyses.map(
                                              (entry) => (
                                                <div
                                                  className="ref-browser-capture-analyze-recent"
                                                  key={entry.id}
                                                >
                                                  <button
                                                    className="ref-browser-capture-analyze-recent-main"
                                                    onClick={() => {
                                                      setCaptureAnalyzeMenuOpen(
                                                        false
                                                      );
                                                      void openCaptureAnalysisThread(
                                                        entry
                                                      );
                                                    }}
                                                    title={`${entry.title}\n${new Date(entry.createdAt).toLocaleString()}`}
                                                    type="button"
                                                  >
                                                    <strong>
                                                      {entry.title}
                                                    </strong>
                                                    <span>
                                                      {entry.mode} ·{" "}
                                                      {new Date(
                                                        entry.createdAt
                                                      ).toLocaleTimeString()}
                                                    </span>
                                                  </button>
                                                  <button
                                                    aria-label={t(
                                                      "app.browserCaptureSessionsDelete"
                                                    )}
                                                    className="ref-browser-copy-icon-btn"
                                                    onClick={() =>
                                                      void removeCaptureAnalysisRecord(
                                                        entry.id
                                                      )
                                                    }
                                                    title={t(
                                                      "app.browserCaptureSessionsDelete"
                                                    )}
                                                    type="button"
                                                  >
                                                    <IconTrash />
                                                  </button>
                                                </div>
                                              )
                                            )}
                                          </div>
                                        </>
                                      ) : null}
                                    </div>
                                  ) : null}
                                </div>
                                <button
                                  aria-label={t("app.browserCaptureCopyCurl")}
                                  className="ref-browser-capture-mini-btn ref-browser-capture-mini-btn--icon"
                                  disabled={captureBulkActionsDisabled}
                                  onClick={() => void copyBrowserCaptureCurl()}
                                  title={
                                    copiedCaptureField === "curl"
                                      ? t("app.browserCaptureCopied")
                                      : captureExportBusy === "curl"
                                        ? t("app.browserCaptureExporting")
                                        : t("app.browserCaptureCopyCurl")
                                  }
                                  type="button"
                                >
                                  <IconCopy />
                                </button>
                                <div
                                  className="ref-browser-capture-export-menu"
                                  ref={captureExportMenuRef}
                                >
                                  <button
                                    aria-expanded={captureExportMenuOpen}
                                    aria-haspopup="menu"
                                    className="ref-browser-capture-mini-btn ref-browser-capture-mini-btn--icon"
                                    disabled={captureBulkActionsDisabled}
                                    onClick={() =>
                                      setCaptureExportMenuOpen((open) => !open)
                                    }
                                    title={t(
                                      "app.browserCaptureExportMenuLabel"
                                    )}
                                    type="button"
                                  >
                                    <IconDownload />
                                  </button>
                                  {captureExportMenuOpen ? (
                                    <div
                                      className="ref-browser-capture-export-popover"
                                      role="menu"
                                    >
                                      <button
                                        disabled={captureBulkActionsDisabled}
                                        onClick={() => {
                                          setCaptureExportMenuOpen(false);
                                          void exportBrowserCaptureRequests(
                                            "json"
                                          );
                                        }}
                                        role="menuitem"
                                        type="button"
                                      >
                                        {captureExportBusy === "json"
                                          ? t("app.browserCaptureExporting")
                                          : t("app.browserCaptureExportJson")}
                                      </button>
                                      <button
                                        disabled={captureBulkActionsDisabled}
                                        onClick={() => {
                                          setCaptureExportMenuOpen(false);
                                          void exportBrowserCaptureRequests(
                                            "har"
                                          );
                                        }}
                                        role="menuitem"
                                        type="button"
                                      >
                                        {captureExportBusy === "har"
                                          ? t("app.browserCaptureExporting")
                                          : t("app.browserCaptureExportHar")}
                                      </button>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                            <div
                              aria-label={t("app.browserCaptureFilterLabel")}
                              className="ref-browser-capture-filter-row"
                            >
                              <div
                                aria-label={t(
                                  "app.browserCaptureStatusFilterLabel"
                                )}
                                className="ref-browser-capture-filter-strip"
                              >
                                <span className="ref-browser-capture-filter-label">
                                  <IconListFilter className="ref-browser-capture-filter-icon" />
                                  {t("app.browserCaptureStatus")}
                                </span>
                                {captureStatusFilters.map((filter) => (
                                  <button
                                    className={`ref-browser-capture-filter-chip${
                                      captureStatusFilter === filter.key
                                        ? " is-active"
                                        : ""
                                    }`}
                                    key={filter.key}
                                    onClick={() =>
                                      setCaptureStatusFilter(filter.key)
                                    }
                                    type="button"
                                  >
                                    {filter.label}
                                  </button>
                                ))}
                              </div>
                              <div
                                aria-label={t(
                                  "app.browserCaptureMethodFilterLabel"
                                )}
                                className="ref-browser-capture-filter-strip"
                              >
                                <span className="ref-browser-capture-filter-label">
                                  {t("app.browserCaptureColumnMethod")}
                                </span>
                                {captureMethodFilters.map((filter) => (
                                  <button
                                    className={`ref-browser-capture-filter-chip${
                                      captureMethodFilter === filter.key
                                        ? " is-active"
                                        : ""
                                    }`}
                                    key={filter.key}
                                    onClick={() =>
                                      setCaptureMethodFilter(filter.key)
                                    }
                                    type="button"
                                  >
                                    {filter.label}
                                  </button>
                                ))}
                              </div>
                              <div
                                aria-label={t(
                                  "app.browserCaptureSourceFilterLabel"
                                )}
                                className="ref-browser-capture-filter-strip"
                              >
                                <span className="ref-browser-capture-filter-label">
                                  {t("app.browserCaptureColumnSource")}
                                </span>
                                {captureSourceFilters.map((filter) => (
                                  <button
                                    className={`ref-browser-capture-filter-chip${
                                      captureSourceFilter === filter.key
                                        ? " is-active"
                                        : ""
                                    }`}
                                    key={filter.key}
                                    onClick={() =>
                                      setCaptureSourceFilter(filter.key)
                                    }
                                    type="button"
                                  >
                                    {filter.label}
                                  </button>
                                ))}
                              </div>
                              <div
                                aria-label={t(
                                  "app.browserCaptureResourceFilterLabel"
                                )}
                                className="ref-browser-capture-filter-strip"
                              >
                                <span className="ref-browser-capture-filter-label">
                                  {t("app.browserCaptureResourceType")}
                                </span>
                                {captureResourceFilters.map((filter) => (
                                  <button
                                    className={`ref-browser-capture-filter-chip${
                                      captureResourceFilter === filter.key
                                        ? " is-active"
                                        : ""
                                    }`}
                                    key={filter.key}
                                    onClick={() =>
                                      setCaptureResourceFilter(filter.key)
                                    }
                                    type="button"
                                  >
                                    {filter.label}
                                  </button>
                                ))}
                              </div>
                              <span
                                className="ref-browser-capture-list-count"
                                title={captureListCaption}
                              >
                                {captureListCaption}
                              </span>
                              <button
                                aria-pressed={captureDetailVisible}
                                className={`ref-browser-capture-detail-toggle${captureDetailVisible ? " is-active" : ""}`}
                                onClick={() =>
                                  setCaptureDetailVisible((v) => !v)
                                }
                                title={
                                  captureDetailVisible
                                    ? t("app.browserCaptureHideDetail")
                                    : t("app.browserCaptureShowDetail")
                                }
                                type="button"
                              >
                                {captureDetailVisible
                                  ? t("app.browserCaptureHideDetail")
                                  : t("app.browserCaptureShowDetail")}
                              </button>
                            </div>
                          </div>
                          <div
                            aria-label={t("app.browserCaptureRequests")}
                            className="ref-browser-capture-table"
                            role="table"
                          >
                            <div
                              className="ref-browser-capture-table-head"
                              role="row"
                            >
                              <label
                                className="ref-browser-capture-check-cell"
                                title={t("app.browserCaptureToggleVisible")}
                              >
                                <input
                                  aria-label={t(
                                    "app.browserCaptureToggleVisible"
                                  )}
                                  checked={captureSelectAllChecked}
                                  disabled={captureRequests.length <= 0}
                                  onChange={
                                    toggleVisibleCaptureRequestsSelected
                                  }
                                  ref={captureSelectAllRef}
                                  type="checkbox"
                                />
                              </label>
                              <span>{t("app.browserCaptureColumnSeq")}</span>
                              <span>{t("app.browserCaptureColumnSource")}</span>
                              <span>{t("app.browserCaptureColumnMethod")}</span>
                              <span>{t("app.browserCaptureColumnStatus")}</span>
                              <span>{t("app.browserCaptureColumnHost")}</span>
                              <span>{t("app.browserCaptureColumnPath")}</span>
                              <span>{t("app.browserCaptureColumnTime")}</span>
                            </div>
                            <div className="ref-browser-capture-table-body">
                              {captureRequests.length > 0 ? (
                                <>
                                  {captureRequests.map((request) => {
                                    const activeRequest =
                                      request.id === selectedCaptureRequestId;
                                    const checkedRequest =
                                      selectedCaptureRequestIds.has(request.id);
                                    return (
                                      <div
                                        className={`ref-browser-capture-row${activeRequest ? " is-selected" : ""}${
                                          request.errorText ? " has-error" : ""
                                        }${checkedRequest ? " is-checked" : ""}`}
                                        key={request.id}
                                        onClick={() =>
                                          setSelectedCaptureRequestId(
                                            request.id
                                          )
                                        }
                                        onKeyDown={(event) =>
                                          handleCaptureRowKeyDown(
                                            event,
                                            request.id
                                          )
                                        }
                                        role="row"
                                        tabIndex={0}
                                      >
                                        <label
                                          className="ref-browser-capture-check-cell"
                                          onClick={(event) =>
                                            event.stopPropagation()
                                          }
                                          title={t(
                                            "app.browserCaptureToggleRequest"
                                          )}
                                        >
                                          <input
                                            aria-label={t(
                                              "app.browserCaptureToggleRequest"
                                            )}
                                            checked={checkedRequest}
                                            onChange={(event) =>
                                              toggleCaptureRequestSelected(
                                                request.id,
                                                event.currentTarget.checked
                                              )
                                            }
                                            type="checkbox"
                                          />
                                        </label>
                                        <span className="ref-browser-capture-cell ref-browser-capture-seq">
                                          #{request.seq}
                                        </span>
                                        <span
                                          className={`ref-browser-capture-source ref-browser-capture-source--${request.source}`}
                                          title={
                                            request.source === "proxy"
                                              ? t(
                                                  "app.browserCaptureSourceProxy"
                                                )
                                              : t(
                                                  "app.browserCaptureSourceBrowser"
                                                )
                                          }
                                        >
                                          {request.source === "proxy"
                                            ? t(
                                                "app.browserCaptureSourceProxyShort"
                                              )
                                            : t(
                                                "app.browserCaptureSourceBrowserShort"
                                              )}
                                        </span>
                                        <span
                                          className="ref-browser-capture-method"
                                          data-method={request.method}
                                        >
                                          {request.method}
                                        </span>
                                        <span
                                          className="ref-browser-capture-status"
                                          data-status={
                                            request.status == null
                                              ? "pending"
                                              : String(
                                                  Math.floor(
                                                    request.status / 100
                                                  )
                                                )
                                          }
                                        >
                                          {request.status ?? "--"}
                                        </span>
                                        <span
                                          className="ref-browser-capture-host"
                                          title={browserCaptureUrlHost(
                                            request.url
                                          )}
                                        >
                                          {browserCaptureUrlHost(request.url) ||
                                            "--"}
                                        </span>
                                        <span
                                          className="ref-browser-capture-path"
                                          title={request.url}
                                        >
                                          {browserCaptureUrlPath(request.url)}
                                        </span>
                                        <span className="ref-browser-capture-time">
                                          {browserCaptureFormatDuration(
                                            request.durationMs
                                          )}
                                        </span>
                                      </div>
                                    );
                                  })}
                                  {captureCanLoadMore ? (
                                    <div className="ref-browser-capture-load-more">
                                      <button
                                        className="ref-browser-capture-load-more-btn"
                                        disabled={captureListBusy}
                                        onClick={() =>
                                          void refreshBrowserCaptureRequests(
                                            "append"
                                          )
                                        }
                                        type="button"
                                      >
                                        <span>
                                          {captureListBusy
                                            ? t(
                                                "app.browserCaptureLoadingRequests"
                                              )
                                            : t("app.browserCaptureLoadMore")}
                                        </span>
                                        <span className="ref-browser-capture-load-more-count">
                                          {t(
                                            "app.browserCaptureRemainingCount",
                                            {
                                              count: String(
                                                captureRemainingRequestCount
                                              ),
                                            }
                                          )}
                                        </span>
                                      </button>
                                    </div>
                                  ) : null}
                                </>
                              ) : (
                                <div className="ref-browser-capture-empty ref-browser-capture-empty--list">
                                  {captureListBusy ? (
                                    <span>
                                      {t("app.browserCaptureLoadingRequests")}
                                    </span>
                                  ) : (
                                    <>
                                      <div className="ref-browser-capture-empty-title">
                                        {t("app.browserCaptureNoRequests")}
                                      </div>
                                      <div className="ref-browser-capture-empty-hint">
                                        {captureIsActive
                                          ? t(
                                              "app.browserCaptureEmptyHintActive"
                                            )
                                          : t(
                                              "app.browserCaptureEmptyHintIdle"
                                            )}
                                      </div>
                                      <div className="ref-browser-capture-empty-actions">
                                        {captureIsActive ? null : (
                                          <button
                                            className="ref-browser-capture-btn ref-browser-capture-btn--primary"
                                            disabled={Boolean(captureBusy)}
                                            onClick={() =>
                                              void runBrowserCaptureAction(
                                                "start"
                                              )
                                            }
                                            type="button"
                                          >
                                            {captureBusy === "start"
                                              ? t("app.browserCaptureStarting")
                                              : t("app.browserCaptureStart")}
                                          </button>
                                        )}
                                        {captureProxyIsRunning ? null : (
                                          <button
                                            className="ref-browser-capture-btn ref-browser-capture-btn--ghost"
                                            disabled={Boolean(captureProxyBusy)}
                                            onClick={() =>
                                              void runBrowserCaptureProxyAction(
                                                "start"
                                              )
                                            }
                                            type="button"
                                          >
                                            {captureProxyBusy === "start"
                                              ? t(
                                                  "app.browserCaptureProxyStarting"
                                                )
                                              : t(
                                                  "app.browserCaptureProxyStart"
                                                )}
                                          </button>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {captureDetailVisible ? (
                          <div className="ref-browser-capture-detail">
                            {selectedCaptureView ? (
                              <>
                                <div className="ref-browser-capture-detail-head">
                                  <div className="ref-browser-capture-detail-meta">
                                    <span
                                      className="ref-browser-capture-method"
                                      data-method={selectedCaptureView.method}
                                    >
                                      {selectedCaptureView.method}
                                    </span>
                                    <span
                                      className="ref-browser-capture-status"
                                      data-status={
                                        selectedCaptureView.status == null
                                          ? "pending"
                                          : String(
                                              Math.floor(
                                                selectedCaptureView.status / 100
                                              )
                                            )
                                      }
                                    >
                                      {selectedCaptureView.status ?? "--"}
                                    </span>
                                    <span className="ref-browser-capture-detail-time">
                                      {browserCaptureFormatDuration(
                                        selectedCaptureView.durationMs
                                      )}
                                    </span>
                                  </div>
                                  <div className="ref-browser-capture-detail-actions">
                                    <button
                                      className="ref-browser-copy-btn"
                                      disabled={!selectedCaptureRequest}
                                      onClick={() => {
                                        if (selectedCaptureRequest) {
                                          void copyCaptureText(
                                            "curl",
                                            browserCaptureBuildCurl(
                                              selectedCaptureRequest
                                            )
                                          );
                                        }
                                      }}
                                      type="button"
                                    >
                                      <IconCopy />
                                      <span>
                                        {copiedCaptureField === "curl"
                                          ? t("app.browserCaptureCopied")
                                          : t("app.browserCaptureCopyCurl")}
                                      </span>
                                    </button>
                                    <button
                                      className="ref-browser-copy-btn"
                                      disabled={!selectedCaptureView.url}
                                      onClick={() =>
                                        void copyCaptureText(
                                          "url",
                                          selectedCaptureView.url
                                        )
                                      }
                                      type="button"
                                    >
                                      <IconCopy />
                                      <span>
                                        {copiedCaptureField === "url"
                                          ? t("app.browserCaptureCopied")
                                          : t("app.browserCaptureCopyUrl")}
                                      </span>
                                    </button>
                                  </div>
                                </div>
                                <div
                                  className="ref-browser-capture-detail-url"
                                  title={selectedCaptureView.url}
                                >
                                  {selectedCaptureView.url}
                                </div>
                                {selectedCaptureBusy ? (
                                  <div className="ref-browser-capture-empty">
                                    {t("app.browserCaptureLoadingRequest")}
                                  </div>
                                ) : selectedCaptureRequest ? (
                                  <>
                                    <div
                                      className="ref-browser-capture-detail-tabs"
                                      role="tablist"
                                    >
                                      {captureDetailTabs.map((tab) => (
                                        <button
                                          aria-selected={
                                            captureDetailTab === tab.key
                                          }
                                          className={`ref-browser-capture-detail-tab${
                                            captureDetailTab === tab.key
                                              ? " is-active"
                                              : ""
                                          }`}
                                          key={tab.key}
                                          onClick={() =>
                                            setCaptureDetailTab(tab.key)
                                          }
                                          role="tab"
                                          type="button"
                                        >
                                          {tab.label}
                                        </button>
                                      ))}
                                    </div>
                                    <div className="ref-browser-capture-detail-scroll">
                                      {captureDetailTab === "headers" ? (
                                        <>
                                          <div className="ref-browser-capture-detail-section">
                                            <div className="ref-browser-capture-section-head">
                                              <div className="ref-browser-capture-section-title">
                                                {t(
                                                  "app.browserCaptureRequestHeaders"
                                                )}
                                              </div>
                                              <button
                                                aria-label={t(
                                                  "app.browserCaptureCopyRequestHeaders"
                                                )}
                                                className="ref-browser-copy-icon-btn"
                                                disabled={
                                                  selectedRequestHeaderEntries.length <=
                                                  0
                                                }
                                                onClick={() =>
                                                  void copyCaptureText(
                                                    "requestHeaders",
                                                    browserCaptureFormatHeaders(
                                                      selectedCaptureRequest.requestHeaders
                                                    )
                                                  )
                                                }
                                                title={t(
                                                  "app.browserCaptureCopyRequestHeaders"
                                                )}
                                                type="button"
                                              >
                                                <IconCopy />
                                              </button>
                                            </div>
                                            <div className="ref-browser-capture-kv-list">
                                              {selectedRequestHeaderEntries.length >
                                              0 ? (
                                                selectedRequestHeaderEntries.map(
                                                  ([key, value]) => (
                                                    <div
                                                      className="ref-browser-capture-kv"
                                                      key={`req-${key}`}
                                                    >
                                                      <span>{key}</span>
                                                      <code>{value}</code>
                                                    </div>
                                                  )
                                                )
                                              ) : (
                                                <div className="ref-browser-capture-inline-empty">
                                                  {t(
                                                    "app.browserCaptureEmptyBody"
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                          <div className="ref-browser-capture-detail-section">
                                            <div className="ref-browser-capture-section-head">
                                              <div className="ref-browser-capture-section-title">
                                                {t(
                                                  "app.browserCaptureResponseHeaders"
                                                )}
                                              </div>
                                              <button
                                                aria-label={t(
                                                  "app.browserCaptureCopyResponseHeaders"
                                                )}
                                                className="ref-browser-copy-icon-btn"
                                                disabled={
                                                  selectedResponseHeaderEntries.length <=
                                                  0
                                                }
                                                onClick={() =>
                                                  void copyCaptureText(
                                                    "responseHeaders",
                                                    browserCaptureFormatHeaders(
                                                      selectedCaptureRequest.responseHeaders
                                                    )
                                                  )
                                                }
                                                title={t(
                                                  "app.browserCaptureCopyResponseHeaders"
                                                )}
                                                type="button"
                                              >
                                                <IconCopy />
                                              </button>
                                            </div>
                                            <div className="ref-browser-capture-kv-list">
                                              {selectedResponseHeaderEntries.length >
                                              0 ? (
                                                selectedResponseHeaderEntries.map(
                                                  ([key, value]) => (
                                                    <div
                                                      className="ref-browser-capture-kv"
                                                      key={`res-${key}`}
                                                    >
                                                      <span>{key}</span>
                                                      <code>{value}</code>
                                                    </div>
                                                  )
                                                )
                                              ) : (
                                                <div className="ref-browser-capture-inline-empty">
                                                  {t(
                                                    "app.browserCaptureEmptyBody"
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </>
                                      ) : captureDetailTab === "request" ? (
                                        <div className="ref-browser-capture-detail-section">
                                          <div className="ref-browser-capture-section-head">
                                            <div className="ref-browser-capture-section-title">
                                              {t(
                                                "app.browserCaptureRequestBody"
                                              )}
                                            </div>
                                            <button
                                              aria-label={t(
                                                "app.browserCaptureCopyRequestBody"
                                              )}
                                              className="ref-browser-copy-icon-btn"
                                              disabled={
                                                !selectedRequestBodyText
                                              }
                                              onClick={() =>
                                                void copyCaptureText(
                                                  "requestBody",
                                                  selectedRequestBodyText
                                                )
                                              }
                                              title={t(
                                                "app.browserCaptureCopyRequestBody"
                                              )}
                                              type="button"
                                            >
                                              <IconCopy />
                                            </button>
                                          </div>
                                          <pre className="ref-browser-capture-body-block ref-browser-capture-body-block--large">
                                            {selectedRequestBodyText ||
                                              t("app.browserCaptureEmptyBody")}
                                          </pre>
                                          {selectedCaptureRequest.requestBodyTruncated ? (
                                            <div className="ref-browser-capture-note">
                                              {t(
                                                "app.browserCaptureBodyTruncated"
                                              )}
                                            </div>
                                          ) : null}
                                        </div>
                                      ) : (
                                        <div className="ref-browser-capture-detail-section">
                                          <div className="ref-browser-capture-meta-grid">
                                            <span>
                                              {t(
                                                "app.browserCaptureColumnSource"
                                              )}
                                            </span>
                                            <strong>
                                              {selectedCaptureRequest.source ===
                                              "proxy"
                                                ? t(
                                                    "app.browserCaptureSourceProxy"
                                                  )
                                                : t(
                                                    "app.browserCaptureSourceBrowser"
                                                  )}
                                            </strong>
                                            <span>
                                              {t(
                                                "app.browserCaptureColumnStatus"
                                              )}
                                            </span>
                                            <strong>
                                              {selectedCaptureRequest.status ??
                                                "--"}
                                            </strong>
                                            <span>
                                              {t(
                                                "app.browserCaptureContentType"
                                              )}
                                            </span>
                                            <strong>
                                              {selectedCaptureRequest.contentType ??
                                                "--"}
                                            </strong>
                                            <span>
                                              {t(
                                                "app.browserCaptureResourceType"
                                              )}
                                            </span>
                                            <strong>
                                              {selectedCaptureRequest.resourceType ??
                                                "--"}
                                            </strong>
                                          </div>
                                          <div className="ref-browser-capture-section-head">
                                            <div className="ref-browser-capture-section-title">
                                              {t(
                                                "app.browserCaptureResponseBody"
                                              )}
                                            </div>
                                            <button
                                              aria-label={t(
                                                "app.browserCaptureCopyResponseBody"
                                              )}
                                              className="ref-browser-copy-icon-btn"
                                              disabled={
                                                !selectedResponseBodyText
                                              }
                                              onClick={() =>
                                                void copyCaptureText(
                                                  "responseBody",
                                                  selectedResponseBodyText
                                                )
                                              }
                                              title={t(
                                                "app.browserCaptureCopyResponseBody"
                                              )}
                                              type="button"
                                            >
                                              <IconCopy />
                                            </button>
                                          </div>
                                          <pre className="ref-browser-capture-body-block ref-browser-capture-body-block--large">
                                            {selectedResponseBodyText ||
                                              selectedResponseOmissionText ||
                                              t("app.browserCaptureEmptyBody")}
                                          </pre>
                                          {selectedCaptureRequest.responseBodyTruncated ? (
                                            <div className="ref-browser-capture-note">
                                              {t(
                                                "app.browserCaptureBodyTruncated"
                                              )}
                                            </div>
                                          ) : null}
                                        </div>
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  <div className="ref-browser-capture-empty">
                                    {t("app.browserCaptureRequestNotFound")}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="ref-browser-capture-empty">
                                {t("app.browserCaptureSelectRequest")}
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    ) : capturePanelTab === "hooks" ? (
                      <div className="ref-browser-capture-hooks-panel">
                        <div className="ref-browser-capture-list-toolbar">
                          <div className="ref-browser-capture-list-toolbar-row">
                            <label className="ref-browser-capture-search-wrap">
                              <IconSearch className="ref-browser-capture-search-icon" />
                              <input
                                aria-label={t(
                                  "app.browserCaptureHookSearchPlaceholder"
                                )}
                                className="ref-browser-capture-search"
                                onChange={(event) =>
                                  setCaptureHookQuery(event.target.value)
                                }
                                placeholder={t(
                                  "app.browserCaptureHookSearchPlaceholder"
                                )}
                                type="search"
                                value={captureHookQuery}
                              />
                            </label>
                            <span
                              className="ref-browser-capture-bulk-status"
                              title={t("app.browserCaptureHookCount", {
                                count: String(captureHookEventTotal),
                              })}
                            >
                              {t("app.browserCaptureHookCount", {
                                count: String(captureHookEventTotal),
                              })}
                            </span>
                          </div>
                          <div
                            aria-label={t(
                              "app.browserCaptureHookCategoryLabel"
                            )}
                            className="ref-browser-capture-filter-row"
                          >
                            <div
                              aria-label={t(
                                "app.browserCaptureHookCategoryLabel"
                              )}
                              className="ref-browser-capture-filter-strip"
                            >
                              <span className="ref-browser-capture-filter-label">
                                <IconListFilter className="ref-browser-capture-filter-icon" />
                                {t("app.browserCaptureHookCategoryLabel")}
                              </span>
                              {(
                                [
                                  "all",
                                  "fetch",
                                  "xhr",
                                  "crypto.subtle",
                                  "crypto.lib",
                                ] as const
                              ).map((key) => (
                                <button
                                  className={`ref-browser-capture-filter-chip${captureHookCategoryFilter === key ? " is-active" : ""}`}
                                  key={key}
                                  onClick={() =>
                                    setCaptureHookCategoryFilter(key)
                                  }
                                  type="button"
                                >
                                  {key === "all"
                                    ? t("app.browserCaptureFilterAll")
                                    : key}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="ref-browser-capture-hooks-list">
                          {captureHookEvents.length > 0 ? (
                            captureHookEvents
                              .slice()
                              .reverse()
                              .map((event) => (
                                <div
                                  className="ref-browser-capture-hook-row"
                                  data-category={event.category}
                                  key={event.id}
                                >
                                  <div className="ref-browser-capture-hook-row-head">
                                    <span className="ref-browser-capture-hook-category">
                                      {event.category}
                                    </span>
                                    <span className="ref-browser-capture-hook-label">
                                      {event.label}
                                    </span>
                                    <span className="ref-browser-capture-hook-time">
                                      {new Date(event.ts).toLocaleTimeString()}
                                    </span>
                                    <button
                                      aria-label={t("app.browserCaptureCopied")}
                                      className="ref-browser-copy-icon-btn"
                                      onClick={() => {
                                        const payload = `${event.label}\n${event.url}\nargs: ${event.args}\nresult: ${event.result ?? ""}\n${event.stack}`;
                                        void copyCaptureText(
                                          `hook:${event.id}`,
                                          payload
                                        );
                                      }}
                                      title={t("app.browserCaptureCopied")}
                                      type="button"
                                    >
                                      <IconCopy />
                                    </button>
                                  </div>
                                  {event.url ? (
                                    <div
                                      className="ref-browser-capture-hook-url"
                                      title={event.url}
                                    >
                                      {event.url}
                                    </div>
                                  ) : null}
                                  {event.args ? (
                                    <pre className="ref-browser-capture-hook-args">
                                      {event.args}
                                    </pre>
                                  ) : null}
                                  {event.result ? (
                                    <pre className="ref-browser-capture-hook-result">
                                      → {event.result}
                                    </pre>
                                  ) : null}
                                  {event.stack ? (
                                    <details className="ref-browser-capture-hook-stack">
                                      <summary>
                                        {t("app.browserCaptureHookStack")}
                                      </summary>
                                      <pre>{event.stack}</pre>
                                    </details>
                                  ) : null}
                                </div>
                              ))
                          ) : (
                            <div className="ref-browser-capture-empty ref-browser-capture-empty--list">
                              <div className="ref-browser-capture-empty-title">
                                {t("app.browserCaptureHookEmptyTitle")}
                              </div>
                              <div className="ref-browser-capture-empty-hint">
                                {captureIsActive
                                  ? t("app.browserCaptureHookEmptyHintActive")
                                  : t("app.browserCaptureHookEmptyHintIdle")}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : capturePanelTab === "storage" ? (
                      <div className="ref-browser-capture-storage-panel">
                        <div
                          className="ref-browser-capture-storage-host-list"
                          role="tablist"
                        >
                          {captureStorageSnapshots.length > 0 ? (
                            captureStorageSnapshots.map((snapshot) => (
                              <button
                                aria-selected={
                                  captureStorageActiveHost === snapshot.host
                                }
                                className={`ref-browser-capture-storage-host${captureStorageActiveHost === snapshot.host ? " is-active" : ""}`}
                                key={snapshot.id}
                                onClick={() =>
                                  setCaptureStorageActiveHost(snapshot.host)
                                }
                                role="tab"
                                type="button"
                              >
                                <span className="ref-browser-capture-storage-host-name">
                                  {snapshot.host}
                                </span>
                                <span className="ref-browser-capture-storage-host-meta">
                                  {snapshot.cookies
                                    ? `${snapshot.cookies.split(";").filter(Boolean).length}c`
                                    : "0c"}
                                  {" · "}
                                  {snapshot.localStorage.length}L ·{" "}
                                  {snapshot.sessionStorage.length}S
                                </span>
                              </button>
                            ))
                          ) : (
                            <div className="ref-browser-capture-empty ref-browser-capture-empty--list">
                              <div className="ref-browser-capture-empty-title">
                                {t("app.browserCaptureStorageEmptyTitle")}
                              </div>
                              <div className="ref-browser-capture-empty-hint">
                                {captureIsActive
                                  ? t(
                                      "app.browserCaptureStorageEmptyHintActive"
                                    )
                                  : t("app.browserCaptureStorageEmptyHintIdle")}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="ref-browser-capture-storage-detail">
                          {(() => {
                            const active =
                              captureStorageSnapshots.find(
                                (s) => s.host === captureStorageActiveHost
                              ) ?? captureStorageSnapshots[0];
                            if (!active) {
                              return (
                                <div className="ref-browser-capture-empty">
                                  {t("app.browserCaptureStorageSelect")}
                                </div>
                              );
                            }
                            return (
                              <>
                                <div className="ref-browser-capture-storage-section">
                                  <div className="ref-browser-capture-section-head">
                                    <div className="ref-browser-capture-section-title">
                                      {t("app.browserCaptureStorageCookies")}
                                    </div>
                                    <button
                                      aria-label={t("app.browserCaptureCopied")}
                                      className="ref-browser-copy-icon-btn"
                                      onClick={() =>
                                        void copyCaptureText(
                                          `storage:cookies:${active.host}`,
                                          active.cookies
                                        )
                                      }
                                      title={t("app.browserCaptureCopied")}
                                      type="button"
                                    >
                                      <IconCopy />
                                    </button>
                                  </div>
                                  {active.cookies ? (
                                    <pre className="ref-browser-capture-body-block">
                                      {active.cookies}
                                    </pre>
                                  ) : (
                                    <div className="ref-browser-capture-inline-empty">
                                      {t("app.browserCaptureEmptyBody")}
                                    </div>
                                  )}
                                </div>
                                <div className="ref-browser-capture-storage-section">
                                  <div className="ref-browser-capture-section-head">
                                    <div className="ref-browser-capture-section-title">
                                      localStorage ({active.localStorage.length}
                                      )
                                    </div>
                                    <button
                                      aria-label={t("app.browserCaptureCopied")}
                                      className="ref-browser-copy-icon-btn"
                                      onClick={() =>
                                        void copyCaptureText(
                                          `storage:local:${active.host}`,
                                          JSON.stringify(
                                            active.localStorage,
                                            null,
                                            2
                                          )
                                        )
                                      }
                                      title={t("app.browserCaptureCopied")}
                                      type="button"
                                    >
                                      <IconCopy />
                                    </button>
                                  </div>
                                  {active.localStorage.length > 0 ? (
                                    <div className="ref-browser-capture-kv-list">
                                      {active.localStorage.map((entry) => (
                                        <div
                                          className="ref-browser-capture-kv"
                                          key={`local-${entry.key}`}
                                        >
                                          <span>{entry.key}</span>
                                          <code>{entry.value}</code>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="ref-browser-capture-inline-empty">
                                      {t("app.browserCaptureEmptyBody")}
                                    </div>
                                  )}
                                </div>
                                <div className="ref-browser-capture-storage-section">
                                  <div className="ref-browser-capture-section-head">
                                    <div className="ref-browser-capture-section-title">
                                      sessionStorage (
                                      {active.sessionStorage.length})
                                    </div>
                                    <button
                                      aria-label={t("app.browserCaptureCopied")}
                                      className="ref-browser-copy-icon-btn"
                                      onClick={() =>
                                        void copyCaptureText(
                                          `storage:session:${active.host}`,
                                          JSON.stringify(
                                            active.sessionStorage,
                                            null,
                                            2
                                          )
                                        )
                                      }
                                      title={t("app.browserCaptureCopied")}
                                      type="button"
                                    >
                                      <IconCopy />
                                    </button>
                                  </div>
                                  {active.sessionStorage.length > 0 ? (
                                    <div className="ref-browser-capture-kv-list">
                                      {active.sessionStorage.map((entry) => (
                                        <div
                                          className="ref-browser-capture-kv"
                                          key={`session-${entry.key}`}
                                        >
                                          <span>{entry.key}</span>
                                          <code>{entry.value}</code>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="ref-browser-capture-inline-empty">
                                      {t("app.browserCaptureEmptyBody")}
                                    </div>
                                  )}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    ) : (
                      <div className="ref-browser-capture-device-panel">
                        <div className="ref-browser-capture-device-main">
                          <div className="ref-browser-capture-device-head">
                            <div className="ref-browser-capture-device-title">
                              <span
                                className={`ref-browser-capture-device-dot${captureProxyIsRunning ? " is-active" : ""}`}
                              />
                              <div>
                                <strong>
                                  {t("app.browserCaptureDeviceTitle")}
                                </strong>
                                <span>{captureProxyStatusText}</span>
                              </div>
                            </div>
                            <div className="ref-browser-capture-device-actions">
                              <button
                                className={`ref-browser-capture-btn${captureProxyIsRunning ? " ref-browser-capture-btn--danger" : " ref-browser-capture-btn--primary"}`}
                                disabled={Boolean(
                                  captureProxyBusy || captureBusy
                                )}
                                onClick={() =>
                                  void runBrowserCaptureProxyAction(
                                    captureProxyIsRunning ? "stop" : "start"
                                  )
                                }
                                type="button"
                              >
                                {captureProxyBusy === "start"
                                  ? t("app.browserCaptureProxyStarting")
                                  : captureProxyBusy === "stop"
                                    ? t("app.browserCaptureProxyStopping")
                                    : captureProxyIsRunning
                                      ? t("app.browserCaptureProxyStop")
                                      : t("app.browserCaptureProxyStart")}
                              </button>
                              <button
                                className="ref-browser-capture-btn ref-browser-capture-btn--ghost"
                                onClick={() => {
                                  setCaptureSourceFilter("proxy");
                                  setCapturePanelTab("requests");
                                }}
                                type="button"
                              >
                                {t("app.browserCaptureShowProxyRequests")}
                              </button>
                            </div>
                          </div>
                          <div className="ref-browser-capture-device-stepgrid">
                            <div
                              className={`ref-browser-capture-device-card${captureProxyIsRunning ? " is-done" : ""}`}
                            >
                              <div className="ref-browser-capture-device-card-head">
                                <span className="ref-browser-capture-device-card-step">
                                  1
                                </span>
                                <strong>
                                  {t("app.browserCaptureProxyAddress")}
                                </strong>
                                <span
                                  className={`ref-browser-capture-device-badge${captureProxyIsRunning ? " is-on" : ""}`}
                                >
                                  {captureProxyIsRunning
                                    ? t("app.browserCaptureProxyShortOn")
                                    : t("app.browserCaptureProxyShortOff")}
                                </span>
                              </div>
                              <div className="ref-browser-capture-device-fields">
                                <div className="ref-browser-capture-device-field">
                                  <span>
                                    {t("app.browserCaptureProxyHost")}
                                  </span>
                                  <code title={captureProxyPrimaryAddress}>
                                    {captureProxyPrimaryAddress}
                                  </code>
                                  <button
                                    aria-label={t(
                                      "app.browserCaptureCopyProxyHost"
                                    )}
                                    className="ref-browser-copy-icon-btn"
                                    onClick={() =>
                                      void copyCaptureText(
                                        "proxyHost",
                                        captureProxyPrimaryAddress
                                      )
                                    }
                                    title={t("app.browserCaptureCopyProxyHost")}
                                    type="button"
                                  >
                                    <IconCopy />
                                  </button>
                                </div>
                                <div className="ref-browser-capture-device-field">
                                  <span>
                                    {t("app.browserCaptureProxyPort")}
                                  </span>
                                  <code>{captureProxyPort}</code>
                                  <button
                                    aria-label={t(
                                      "app.browserCaptureCopyProxyPort"
                                    )}
                                    className="ref-browser-copy-icon-btn"
                                    onClick={() =>
                                      void copyCaptureText(
                                        "proxyPort",
                                        String(captureProxyPort)
                                      )
                                    }
                                    title={t("app.browserCaptureCopyProxyPort")}
                                    type="button"
                                  >
                                    <IconCopy />
                                  </button>
                                </div>
                                <div className="ref-browser-capture-device-field ref-browser-capture-device-field--wide">
                                  <span>
                                    {t("app.browserCaptureProxyAddress")}
                                  </span>
                                  <code title={captureProxyUrl}>
                                    {captureProxyUrl}
                                  </code>
                                  <button
                                    aria-label={t(
                                      "app.browserCaptureCopyProxyAddress"
                                    )}
                                    className="ref-browser-copy-icon-btn"
                                    onClick={() =>
                                      void copyCaptureText(
                                        "proxyUrl",
                                        captureProxyUrl
                                      )
                                    }
                                    title={t(
                                      "app.browserCaptureCopyProxyAddress"
                                    )}
                                    type="button"
                                  >
                                    <IconCopy />
                                  </button>
                                </div>
                              </div>
                              <p className="ref-browser-capture-device-card-hint">
                                {t("app.browserCaptureDeviceStepWifi")}
                              </p>
                            </div>
                            <div
                              className={`ref-browser-capture-device-card${captureProxySystemEnabled ? " is-done" : ""}`}
                            >
                              <div className="ref-browser-capture-device-card-head">
                                <span className="ref-browser-capture-device-card-step">
                                  2
                                </span>
                                <strong>
                                  {t("app.browserCaptureSystemProxy")}
                                </strong>
                                <span
                                  className={`ref-browser-capture-device-badge${captureProxySystemEnabled ? " is-on" : ""}`}
                                >
                                  {captureProxySystemEnabled
                                    ? t("app.browserCaptureSystemProxyOn")
                                    : t("app.browserCaptureSystemProxyOff")}
                                </span>
                              </div>
                              <p className="ref-browser-capture-device-card-hint">
                                {t("app.browserCaptureSystemProxyHint")}
                              </p>
                              <div className="ref-browser-capture-device-card-actions">
                                <button
                                  className={`ref-browser-capture-btn${captureProxySystemEnabled ? " ref-browser-capture-btn--ghost is-active" : " ref-browser-capture-btn--primary"}`}
                                  disabled={
                                    !captureProxyIsRunning ||
                                    Boolean(captureProxyBusy)
                                  }
                                  onClick={() =>
                                    void toggleSystemProxy(
                                      !captureProxySystemEnabled
                                    )
                                  }
                                  type="button"
                                >
                                  {captureProxyBusy === "refresh"
                                    ? t("app.browserCaptureProxyStarting")
                                    : captureProxySystemEnabled
                                      ? t(
                                          "app.browserCaptureSystemProxyDisable"
                                        )
                                      : t(
                                          "app.browserCaptureSystemProxyEnable"
                                        )}
                                </button>
                              </div>
                            </div>
                            <div
                              className={`ref-browser-capture-device-card${captureProxyCaInstalled ? " is-done" : ""}`}
                            >
                              <div className="ref-browser-capture-device-card-head">
                                <span className="ref-browser-capture-device-card-step">
                                  3
                                </span>
                                <strong>
                                  {t("app.browserCaptureCaTitle")}
                                </strong>
                                <span
                                  className={`ref-browser-capture-device-badge${captureProxyCaInstalled ? " is-on" : ""}`}
                                >
                                  {captureProxyCaInstalled
                                    ? t("app.browserCaptureCaInstalled")
                                    : t("app.browserCaptureCaNotInstalled")}
                                </span>
                              </div>
                              <p className="ref-browser-capture-device-card-hint">
                                {t("app.browserCaptureCaHint")}
                              </p>
                              <div className="ref-browser-capture-device-card-actions">
                                <button
                                  className={`ref-browser-capture-btn${captureProxyCaInstalled ? " ref-browser-capture-btn--ghost" : " ref-browser-capture-btn--primary"}`}
                                  disabled={Boolean(captureProxyBusy)}
                                  onClick={() =>
                                    void installBrowserCaptureProxyCa(
                                      captureProxyCaInstalled
                                    )
                                  }
                                  type="button"
                                >
                                  {captureProxyBusy === "ca"
                                    ? t("app.browserCaptureExporting")
                                    : captureProxyCaInstalled
                                      ? t("app.browserCaptureCaUninstall")
                                      : t("app.browserCaptureCaInstall")}
                                </button>
                                <button
                                  className="ref-browser-capture-btn ref-browser-capture-btn--ghost"
                                  disabled={captureProxyBusy === "ca"}
                                  onClick={() =>
                                    void exportBrowserCaptureProxyCa()
                                  }
                                  type="button"
                                >
                                  {copiedCaptureField === "ca"
                                    ? t("app.browserCaptureProxyCaDownloaded")
                                    : t("app.browserCaptureProxyDownloadCa")}
                                </button>
                                <button
                                  className="ref-browser-capture-btn ref-browser-capture-btn--ghost"
                                  onClick={() => {
                                    void shell
                                      ?.invoke("browserCapture:proxyOpenCaPath")
                                      .catch(() => {
                                        /* ignore */
                                      });
                                  }}
                                  type="button"
                                >
                                  {t("app.browserCaptureCaShowFile")}
                                </button>
                              </div>
                              <div className="ref-browser-capture-device-field ref-browser-capture-device-field--wide">
                                <span>{t("app.browserCaptureProxyCaUrl")}</span>
                                <code title={captureProxyCaUrl}>
                                  {captureProxyCaUrl}
                                </code>
                                <button
                                  aria-label={t(
                                    "app.browserCaptureCopyProxyCaUrl"
                                  )}
                                  className="ref-browser-copy-icon-btn"
                                  onClick={() =>
                                    void copyCaptureText(
                                      "proxyCaUrl",
                                      captureProxyCaUrl
                                    )
                                  }
                                  title={t("app.browserCaptureCopyProxyCaUrl")}
                                  type="button"
                                >
                                  <IconCopy />
                                </button>
                              </div>
                            </div>
                            <div className="ref-browser-capture-device-card">
                              <div className="ref-browser-capture-device-card-head">
                                <span className="ref-browser-capture-device-card-step">
                                  4
                                </span>
                                <strong>
                                  {t("app.browserCaptureSnippetsTitle")}
                                </strong>
                              </div>
                              <p className="ref-browser-capture-device-card-hint">
                                {t("app.browserCaptureSnippetsHint")}
                              </p>
                              <div className="ref-browser-capture-device-card-actions ref-browser-capture-device-card-actions--snippets">
                                {(
                                  [
                                    "curl",
                                    "wget",
                                    "python",
                                    "node",
                                    "env",
                                  ] as const
                                ).map((kind) => (
                                  <button
                                    className="ref-browser-capture-mini-btn"
                                    disabled={!captureProxyIsRunning}
                                    key={kind}
                                    onClick={() =>
                                      void copyBrowserCaptureProxySnippet(kind)
                                    }
                                    type="button"
                                  >
                                    <IconCopy />
                                    <span>
                                      {copiedCaptureField === `snippet:${kind}`
                                        ? t("app.browserCaptureCopied")
                                        : kind === "env"
                                          ? t("app.browserCaptureSnippetEnv")
                                          : kind.toUpperCase()}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="ref-browser-capture-device-note">
                            {t("app.browserCaptureDeviceLimit")}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export const AgentBrowserWindowSurface = memo(
  function AgentBrowserWindowSurface() {
    const { shell } = useAppShellChromeCore();
    const [pendingBrowserCommands, setPendingBrowserCommands] = useState<
      BrowserControlPayload[]
    >([]);

    const openBrowserSettingsInHost = useCallback(() => {
      void shell
        ?.invoke("app:requestOpenSettings", { nav: "browser" })
        .catch(() => {
          /* ignore */
        });
    }, [shell]);

    useEffect(() => {
      hideBootSplash();
    }, []);

    const closeWindow = useCallback(() => {
      void shell?.invoke("app:windowClose").catch(() => {
        /* ignore */
      });
    }, [shell]);

    useEffect(() => {
      const subscribe = shell?.subscribeBrowserControl;
      if (!subscribe) {
        return;
      }
      const unsubscribe = subscribe((payload) => {
        if (!isBrowserControlPayload(payload)) {
          return;
        }
        if (payload.type === "closeSidebar") {
          closeWindow();
          return;
        }
        setPendingBrowserCommands((prev) => [...prev, payload]);
      });
      return () => {
        unsubscribe?.();
      };
    }, [closeWindow, shell]);

    useEffect(() => {
      if (!shell) {
        return;
      }
      void shell.invoke("browser:windowReady").catch(() => {
        /* ignore */
      });
    }, [shell]);

    const handleBrowserCommandHandled = useCallback((commandId: string) => {
      setPendingBrowserCommands((prev) =>
        prev.filter((command) => command.commandId !== commandId)
      );
    }, []);

    return (
      <div className="ref-browser-window-root">
        <AgentRightSidebarBrowserPanel
          closeSidebar={closeWindow}
          hasAgentPlanSidebarContent={false}
          onCommandHandled={handleBrowserCommandHandled}
          onOpenBrowserSettings={openBrowserSettingsInHost}
          openView={() => {}}
          pendingCommand={pendingBrowserCommands[0] ?? null}
          variant="window"
        />
      </div>
    );
  }
);
