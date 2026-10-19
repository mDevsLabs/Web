import type { BrowserSidebarSettingsConfig } from "../browserSidebarConfig";

export type AgentRightSidebarView =
  | "git"
  | "plan"
  | "file"
  | "team"
  | "browser"
  | "agents";

export const BROWSER_HOME_URL = "about:blank";
export const BROWSER_CAPTURE_DOCK_EXPANDED_KEY =
  "async.browser.captureDock.expanded.v1";
export const BROWSER_CAPTURE_DOCK_HEIGHT_KEY =
  "async.browser.captureDock.height.v1";
export const BROWSER_CAPTURE_DOCK_TAB_KEY =
  "async.browser.captureDock.tab.v1";
export const BROWSER_CAPTURE_DETAIL_VISIBLE_KEY =
  "async.browser.captureDock.detailVisible.v1";
export const BROWSER_CAPTURE_DOCK_DEFAULT_HEIGHT = 320;
export const BROWSER_CAPTURE_DOCK_MIN_HEIGHT = 190;
export const BROWSER_CAPTURE_DOCK_MAX_HEIGHT = 560;
export const BROWSER_CAPTURE_REQUEST_PAGE_SIZE = 80;

export type BrowserCapturePanelTab =
  | "requests"
  | "hooks"
  | "storage"
  | "devices";
export type BrowserCaptureDetailTab = "headers" | "request" | "response";
export type BrowserCaptureStatusFilter =
  | "all"
  | "pending"
  | "2xx"
  | "3xx"
  | "4xx"
  | "5xx"
  | "error";
export type BrowserCaptureSourceFilter = "all" | "browser" | "proxy";
export type BrowserCaptureMethodFilter =
  | "all"
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "OPTIONS"
  | "OTHER";
export type BrowserCaptureResourceFilter =
  | "all"
  | "document"
  | "xhr"
  | "fetch"
  | "script"
  | "stylesheet"
  | "image"
  | "other";
export type BrowserCaptureExportAction = "curl" | "json" | "har" | "agent";
export type BrowserCaptureProxyBusy = "start" | "stop" | "ca" | "refresh";

export type BrowserCaptureHookEventUi = {
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

export type BrowserCaptureStorageEntryUi = { key: string; value: string };

export type BrowserCaptureStorageSnapshotUi = {
  id: string;
  tabId: string | null;
  host: string;
  url: string;
  ts: number;
  cookies: string;
  localStorage: BrowserCaptureStorageEntryUi[];
  sessionStorage: BrowserCaptureStorageEntryUi[];
};

export type BrowserCaptureSessionSummaryUi = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  requestCount: number;
  hookEventCount: number;
  storageHostCount: number;
  note: string | null;
};

export type BrowserCaptureAnalysisRecordUi = {
  id: string;
  threadId: string;
  mode: string;
  title: string;
  sourceUrl: string;
  createdAt: number;
};

export type BrowserNavEvent = Event & { url?: string; isMainFrame?: boolean };
export type BrowserTitleEvent = Event & { title?: string };
export type BrowserFailEvent = Event & {
  errorCode?: number;
  errorDescription?: string;
  validatedURL?: string;
  isMainFrame?: boolean;
};

export type BrowserControlPayload =
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

export type BrowserCommandResultPayload =
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

export type BrowserCaptureUiState = {
  capturing: boolean;
  requestCount: number;
  pendingRequestCount: number;
  hookEventCount: number;
  storageHostCount: number;
  tabs: Array<{ attached: boolean; lastError: string | null }>;
  note?: string;
};

export type BrowserCaptureRequestSummaryUi = {
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

export type BrowserCaptureRequestDetailUi = BrowserCaptureRequestSummaryUi & {
  requestHeaders: Record<string, string>;
  requestBody: string | null;
  responseHeaders: Record<string, string>;
  responseBody: string | null;
};

export type BrowserCaptureListUi = {
  total: number;
  offset: number;
  limit: number;
  items: BrowserCaptureRequestSummaryUi[];
};

export type BrowserCaptureProxyStatusUi = {
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

export function isBrowserControlPayload(
  raw: unknown
): raw is BrowserControlPayload {
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
