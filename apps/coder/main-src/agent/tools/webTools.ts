import { execFile } from "node:child_process";
import * as http from "node:http";
import * as https from "node:https";
import { URL } from "node:url";
import { promisify } from "node:util";
import { HttpsProxyAgent } from "https-proxy-agent";
import type { ToolCall, ToolResult } from "../agentTools.js";
import {
  throwIfToolAbortRequested,
  type ToolExecutionContext,
} from "./toolContext.js";

const execFileAsync = promisify(execFile);

export function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#\d+;/g, (m) => {
      try {
        return String.fromCharCode(Number.parseInt(m.slice(2, -1), 10));
      } catch {
        return m;
      }
    });
}

export function parseDuckDuckGoHtml(
  html: string
): Array<{ title: string; url: string; snippet: string }> {
  const results: Array<{ title: string; url: string; snippet: string }> = [];
  const blocks = html.split(/<div[^>]*class=["']result[^"']*["'][^>]*>/i);
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i]!;
    const titleMatch = block.match(
      /<a[^>]*class=["']result__a["'][^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/i
    );
    const snippetMatch = block.match(
      /<a[^>]*class=["']result__snippet["'][^>]*>([\s\S]*?)<\/a>/i
    );
    if (titleMatch) {
      const rawUrl = decodeHtmlEntities(stripHtmlTags(titleMatch[1]!)).trim();
      const title = decodeHtmlEntities(stripHtmlTags(titleMatch[2]!)).trim();
      const snippet = snippetMatch
        ? decodeHtmlEntities(stripHtmlTags(snippetMatch[1]!)).trim()
        : "";
      const url = rawUrl.startsWith("http")
        ? rawUrl
        : `https://duckduckgo.com${rawUrl}`;
      if (title) {
        results.push({ snippet, title, url });
      }
    }
  }
  return results.slice(0, 8);
}

export const WEB_SEARCH_TIMEOUT_MS = 15_000;

export type WindowsProxySettings = {
  enabled: boolean;
  server: string;
  override: string;
};

export function getEnvValue(names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name];
    if (value?.trim()) {
      return value.trim();
    }
  }
}

export function normalizeProxyUrl(rawProxy: string): string | null {
  const value = rawProxy.trim().replace(/^"|"$/g, "");
  if (!value || /^direct$/i.test(value)) {
    return null;
  }
  const withScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(value)
    ? value
    : `http://${value}`;
  try {
    const parsed = new URL(withScheme);
    if (
      (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
      !parsed.hostname
    ) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function wildcardToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`, "i");
}

export function shouldBypassProxy(
  hostname: string,
  rules: string | undefined
): boolean {
  if (!rules?.trim()) {
    return false;
  }
  const host = hostname.toLowerCase();
  for (const rawRule of rules.split(/[;,]/)) {
    const rule = rawRule.trim().toLowerCase();
    if (!rule) {
      continue;
    }
    if (rule === "*") {
      return true;
    }
    if (rule === "<local>" && !host.includes(".")) {
      return true;
    }
    const hostRule = rule.replace(/:\d+$/, "");
    if (hostRule.startsWith("*.")) {
      const suffix = hostRule.slice(1);
      if (host.endsWith(suffix) || host === suffix.slice(1)) {
        return true;
      }
      continue;
    }
    if (hostRule.startsWith(".")) {
      if (host.endsWith(hostRule) || host === hostRule.slice(1)) {
        return true;
      }
      continue;
    }
    if (hostRule.includes("*")) {
      if (wildcardToRegex(hostRule).test(host)) {
        return true;
      }
      continue;
    }
    if (host === hostRule) {
      return true;
    }
  }
  return false;
}

export function parseWindowsProxyServer(
  proxyServer: string,
  targetProtocol: string
): string | null {
  const entries = proxyServer
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const perProtocol = new Map<string, string>();
  for (const entry of entries) {
    const separatorIndex = entry.indexOf("=");
    if (separatorIndex > 0) {
      perProtocol.set(
        entry.slice(0, separatorIndex).trim().toLowerCase(),
        entry.slice(separatorIndex + 1).trim()
      );
    }
  }
  if (perProtocol.size > 0) {
    const preferred =
      perProtocol.get(targetProtocol) ??
      perProtocol.get("http") ??
      perProtocol.get("https");
    return preferred ? normalizeProxyUrl(preferred) : null;
  }
  return normalizeProxyUrl(proxyServer);
}

export async function readWindowsProxySettings(): Promise<WindowsProxySettings | null> {
  if (process.platform !== "win32") {
    return null;
  }
  try {
    const { stdout } = await execFileAsync("reg", [
      "query",
      "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings",
      "/v",
      "ProxyEnable",
    ]);
    const { stdout: serverStdout } = await execFileAsync("reg", [
      "query",
      "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings",
      "/v",
      "ProxyServer",
    ]);
    const { stdout: overrideStdout } = await execFileAsync("reg", [
      "query",
      "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings",
      "/v",
      "ProxyOverride",
    ]).catch(() => ({ stdout: "" }));
    const parseRegistryValue = (output: string | Buffer): string => {
      const line = String(output)
        .split(/\r?\n/)
        .find((candidate) => /\s+REG_\w+\s+/i.test(candidate));
      return line?.replace(/^.*?\s+REG_\w+\s+/i, "").trim() ?? "";
    };
    const enabledRaw = parseRegistryValue(stdout);
    const enabled =
      Number.parseInt(
        enabledRaw,
        enabledRaw.toLowerCase().startsWith("0x") ? 16 : 10
      ) !== 0;
    return {
      enabled,
      override: parseRegistryValue(overrideStdout),
      server: parseRegistryValue(serverStdout),
    };
  } catch {
    return null;
  }
}

export async function getProxyUrlForRequest(targetUrl: URL): Promise<string | null> {
  const envBypass = getEnvValue(["NO_PROXY", "no_proxy"]);
  if (shouldBypassProxy(targetUrl.hostname, envBypass)) {
    return null;
  }
  const envProxyNames =
    targetUrl.protocol === "https:"
      ? [
          "HTTPS_PROXY",
          "https_proxy",
          "ALL_PROXY",
          "all_proxy",
          "HTTP_PROXY",
          "http_proxy",
        ]
      : ["HTTP_PROXY", "http_proxy", "ALL_PROXY", "all_proxy"];
  const envProxy = getEnvValue(envProxyNames);
  const normalizedEnvProxy = envProxy ? normalizeProxyUrl(envProxy) : null;
  if (normalizedEnvProxy) {
    return normalizedEnvProxy;
  }

  const windowsProxy = await readWindowsProxySettings();
  if (!windowsProxy?.enabled || !windowsProxy.server) {
    return null;
  }
  if (shouldBypassProxy(targetUrl.hostname, windowsProxy.override)) {
    return null;
  }
  return parseWindowsProxyServer(
    windowsProxy.server,
    targetUrl.protocol.replace(":", "")
  );
}

export async function performWebSearch(
  query: string,
  signal?: AbortSignal
): Promise<Array<{ title: string; url: string; snippet: string }>> {
  const url = new URL(
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
  );
  const proxyUrl = await getProxyUrlForRequest(url);
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        agent: proxyUrl ? (new HttpsProxyAgent(proxyUrl) as any) : undefined,
        headers: {
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        timeout: WEB_SEARCH_TIMEOUT_MS,
      },
      (res) => {
        if (signal?.aborted) {
          reject(new DOMException("Aborted", "AbortError"));
          return;
        }
        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          reject(
            new Error(`Search request failed with status ${res.statusCode}`)
          );
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          if (signal?.aborted) {
            reject(new DOMException("Aborted", "AbortError"));
            return;
          }
          const html = Buffer.concat(chunks).toString("utf8");
          try {
            resolve(parseDuckDuckGoHtml(html));
          } catch (e) {
            reject(
              new Error(
                `Failed to parse search results: ${e instanceof Error ? e.message : String(e)}`
              )
            );
          }
        });
      }
    );
    req.on("error", (err) => reject(err));
    req.on("timeout", () => {
      req.destroy();
      reject(
        new Error(
          `Search request timed out after ${WEB_SEARCH_TIMEOUT_MS / 1000}s`
        )
      );
    });
    signal?.addEventListener("abort", () => {
      req.destroy();
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
}

export async function executeWebSearchTool(
  call: ToolCall,
  execCtx: ToolExecutionContext
): Promise<ToolResult> {
  throwIfToolAbortRequested(execCtx.signal, call.name, "websearch:start");

  const query = String(call.arguments.query ?? "").trim();
  if (!query) {
    return {
      content: "Error: query is required for WebSearch",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  try {
    const results = await performWebSearch(query, execCtx.signal);
    if (results.length === 0) {
      return {
        content: `No search results found for "${query}".`,
        isError: false,
        name: call.name,
        toolCallId: call.id,
      };
    }

    const formatted = results
      .map((r, i) => `${i + 1}. ${r.title}\n   URL: ${r.url}\n   ${r.snippet}`)
      .join("\n\n");

    return {
      content: `Search results for "${query}":\n\n${formatted}`,
      isError: false,
      name: call.name,
      toolCallId: call.id,
    };
  } catch (error) {
    return {
      content: `WebSearch failed: ${error instanceof Error ? error.message : String(error)}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
}

export type FetchResult = {
  status: number;
  statusText: string;
  headers: Record<string, string | string[]>;
  body: string;
  truncated: boolean;
};

export function performFetch(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    signal?: AbortSignal;
    maxBodyLength?: number;
  }
): Promise<FetchResult> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const isHttps = parsed.protocol === "https:";
    const client = isHttps ? https : http;
    const maxBodyLength = options.maxBodyLength ?? 200_000;

    const req = client.request(
      url,
      {
        headers: {
          Accept: "*/*",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          ...options.headers,
        },
        method: options.method || "GET",
        timeout: 30_000,
      },
      (res) => {
        if (options.signal?.aborted) {
          reject(new DOMException("Aborted", "AbortError"));
          return;
        }

        const chunks: Buffer[] = [];
        let totalLength = 0;
        let truncated = false;

        res.on("data", (chunk: Buffer) => {
          if (truncated) return;
          totalLength += chunk.length;
          if (totalLength > maxBodyLength) {
            chunks.push(
              chunk.slice(0, maxBodyLength - (totalLength - chunk.length))
            );
            truncated = true;
            res.destroy();
          } else {
            chunks.push(chunk);
          }
        });

        res.on("end", () => {
          if (options.signal?.aborted) {
            reject(new DOMException("Aborted", "AbortError"));
            return;
          }
          const body = Buffer.concat(chunks).toString("utf8");
          const headers: Record<string, string | string[]> = {};
          for (const [key, value] of Object.entries(res.headers)) {
            headers[key] = value ?? "";
          }
          resolve({
            body,
            headers,
            status: res.statusCode ?? 0,
            statusText: res.statusMessage ?? "",
            truncated,
          });
        });

        res.on("error", (err) => reject(err));
      }
    );

    req.on("error", (err) => reject(err));
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out after 30s"));
    });

    options.signal?.addEventListener("abort", () => {
      req.destroy();
      reject(new DOMException("Aborted", "AbortError"));
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

export async function executeFetchTool(
  call: ToolCall,
  execCtx: ToolExecutionContext
): Promise<ToolResult> {
  throwIfToolAbortRequested(execCtx.signal, call.name, "fetch:start");

  const url = String(call.arguments.url ?? "").trim();
  if (!url) {
    return {
      content: "Error: url is required for Fetch",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return {
        content: `Error: only HTTP and HTTPS URLs are supported, got "${parsed.protocol}"`,
        isError: true,
        name: call.name,
        toolCallId: call.id,
      };
    }
  } catch {
    return {
      content: `Error: invalid URL "${url}"`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const method = String(call.arguments.method ?? "GET").toUpperCase();
  const allowedMethods = [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "HEAD",
    "OPTIONS",
  ];
  if (!allowedMethods.includes(method)) {
    return {
      content: `Error: unsupported HTTP method "${method}". Allowed: ${allowedMethods.join(", ")}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const rawHeaders = call.arguments.headers;
  const headers: Record<string, string> = {};
  if (rawHeaders && typeof rawHeaders === "object") {
    for (const [key, value] of Object.entries(rawHeaders)) {
      if (value !== undefined && value !== null) {
        headers[key] = String(value);
      }
    }
  }

  const body =
    call.arguments.body !== undefined && call.arguments.body !== null
      ? String(call.arguments.body)
      : undefined;

  try {
    const result = await performFetch(url, {
      body,
      headers,
      method,
      signal: execCtx.signal,
    });

    const headerLines = Object.entries(result.headers)
      .map(([k, v]) => `  ${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
      .join("\n");

    const truncatedNote = result.truncated
      ? "\n\n[Response body truncated at 200 KB]"
      : "";

    return {
      content: `HTTP ${result.status} ${result.statusText}\nHeaders:\n${headerLines}\n\nBody:\n${result.body}${truncatedNote}`,
      isError: result.status >= 400,
      name: call.name,
      toolCallId: call.id,
    };
  } catch (error) {
    return {
      content: `Fetch failed: ${error instanceof Error ? error.message : String(error)}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
}
