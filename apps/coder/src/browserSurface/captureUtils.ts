import type { TFunction } from "../i18n";
import {
  BROWSER_CAPTURE_DOCK_DEFAULT_HEIGHT,
  BROWSER_CAPTURE_DOCK_MAX_HEIGHT,
  BROWSER_CAPTURE_DOCK_MIN_HEIGHT,
  BROWSER_HOME_URL,
  type BrowserCaptureListUi,
  type BrowserCaptureProxyStatusUi,
  type BrowserCaptureRequestDetailUi,
  type BrowserCaptureRequestSummaryUi,
  type BrowserCaptureUiState,
  type BrowserCommandResultPayload,
} from "./types";

export function safeGetWebviewUrl(
  node: MaiShellWebviewElement | null
): string {
  if (!node) {
    return "";
  }
  try {
    return String(node.getURL?.() ?? "").trim();
  } catch {
    return "";
  }
}

export function looksLikeLocalFilesystemPath(raw: string): boolean {
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

export function looksLikeDirectUrl(raw: string): boolean {
  if (/^[a-zA-Z][a-zA-Z\d+\-.]+:/.test(raw)) {
    return true;
  }
  return /^(localhost|(?:\d{1,3}\.){3}\d{1,3}|(?:[\w-]+\.)+[a-z]{2,})(?::\d+)?(?:[/?#].*)?$/i.test(
    raw
  );
}

export function normalizeBrowserTarget(raw: string): string {
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

export function normalizeBrowserExtractedText(
  raw: string,
  maxChars: number
): string {
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

export function normalizeBrowserCaptureUiState(
  raw: unknown
): BrowserCaptureUiState {
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

export function normalizeHeaderRecord(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object") {
    return {};
  }
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    out[key] = typeof value === "string" ? value : String(value ?? "");
  }
  return out;
}

export function normalizeBrowserCaptureRequestSummary(
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

export function normalizeBrowserCaptureProxyStatus(
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

export function normalizeBrowserCaptureList(raw: unknown): BrowserCaptureListUi {
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

export function normalizeBrowserCaptureRequestDetail(
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

export function normalizeBrowserCaptureRequestDetails(
  raw: unknown
): BrowserCaptureRequestDetailUi[] {
  return Array.isArray(raw)
    ? raw
        .map(normalizeBrowserCaptureRequestDetail)
        .filter((item): item is BrowserCaptureRequestDetailUi => Boolean(item))
    : [];
}

export function mergeBrowserCaptureRequestSummaries(
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

export function browserCaptureUrlHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
}

export function browserCaptureUrlPath(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

export function browserCaptureFormatDuration(ms: number | null): string {
  if (ms == null) {
    return "--";
  }
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
}

export function browserCaptureFormatBody(raw: string | null): string {
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

export function browserCaptureFormatHeaders(
  headers: Record<string, string>
): string {
  return Object.entries(headers)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

export function browserCaptureHeaderValue(
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

export function browserCaptureHarHeaders(
  headers: Record<string, string>
): Array<{ name: string; value: string }> {
  return Object.entries(headers)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, value]) => ({ name, value }));
}

export function browserCaptureHarQueryString(
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

export function browserCaptureQuoteCurlArg(value: string): string {
  return `'${String(value ?? "").replace(/'/g, "'\\''")}'`;
}

export function browserCaptureBuildCurl(
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

export const BROWSER_CAPTURE_AGENT_REQUEST_LIMIT = 16;
export const BROWSER_CAPTURE_AGENT_BODY_LIMIT = 1200;

export function browserCaptureTrimForAgent(
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

export function browserCaptureBuildAgentDraft(
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

export function browserCaptureBuildJsonExport(
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

export function browserCaptureBuildHarExport(
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

export function browserCaptureDownloadTextFile(
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

export function browserCaptureExportFileName(format: "json" | "har"): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `async-browser-capture-${stamp}.${format}`;
}

export function clampBrowserCaptureDockHeight(
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

export async function notifyBrowserCommandResult(
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
