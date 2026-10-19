import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  clearBrowserCaptureDataForHostId,
  getBrowserCaptureRequestForHostId,
  getBrowserCaptureStateForHostId,
  listBrowserCaptureRequestsForHostId,
  startBrowserCaptureForHostId,
  stopBrowserCaptureForHostId,
} from "../../browser/browserCapture.js";
import {
  awaitBrowserCommandResult,
  type BrowserControlCommand,
  type BrowserSidebarConfigPayload,
  browserSidebarConfigToPayload,
  dispatchBrowserControlToHostId,
  getBrowserRuntimeStateForHostId,
  getBrowserSidebarConfigPayloadForHostId,
  getDefaultBrowserSidebarConfig,
  getOrCreateBrowserSidebarConfigForHostId,
  setBrowserSidebarConfigForHostId,
} from "../../browser/browserController.js";
import { normalizeBrowserFingerprintSpoof } from "../../browser/browserFingerprintNormalize.js";
import { resolveWorkspacePath } from "../../workspace.js";
import type { ToolCall, ToolResult } from "../agentTools.js";
import {
  resolveAgentFilePath,
  throwIfToolAbortRequested,
  type ToolExecutionContext,
} from "./toolContext.js";

function makeBrowserCommandId(): string {
  return `browser-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function looksLikeLocalFilesystemPath(raw: string): boolean {
  // Windows drive path: C:\foo, d:/bar
  if (/^[a-zA-Z]:[\\/]/.test(raw)) {
    return true;
  }
  // UNC path: \\server\share
  if (/^\\\\/.test(raw)) {
    return true;
  }
  // POSIX absolute path: /foo/bar (but not //host which could be protocol-relative)
  if (/^\/[^/]/.test(raw)) {
    return true;
  }
  // Relative path with backslashes
  if (/\\/.test(raw) && !/^[a-zA-Z][a-zA-Z\d+\-.]+:\/\//.test(raw)) {
    return true;
  }
  return false;
}

function looksLikeBrowserDirectUrl(raw: string): boolean {
  // Require scheme to be at least 2 chars to avoid matching Windows drive letters (C:, D:)
  if (/^[a-zA-Z][a-zA-Z\d+\-.]+:/.test(raw)) {
    return true;
  }
  return /^(localhost|(?:\d{1,3}\.){3}\d{1,3}|(?:[\w-]+\.)+[a-z]{2,})(?::\d+)?(?:[/?#].*)?$/i.test(
    raw
  );
}

function normalizeBrowserNavigateTarget(raw: string): string {
  const text = raw.trim();
  if (!text) {
    return "https://www.bing.com/";
  }
  if (looksLikeLocalFilesystemPath(text)) {
    return `https://www.bing.com/search?q=${encodeURIComponent(text)}`;
  }
  if (looksLikeBrowserDirectUrl(text)) {
    return /^[a-zA-Z][a-zA-Z\d+\-.]+:/.test(text) ? text : `https://${text}`;
  }
  return `https://www.bing.com/search?q=${encodeURIComponent(text)}`;
}

function browserControlDeliveryNote(
  sent: boolean,
  mode: "command-only" | "config-persisted"
): string {
  if (sent) {
    return "";
  }
  return mode === "config-persisted"
    ? " The browser UI was not live in this window, but the config was saved and will apply next time the built-in browser opens."
    : " The browser UI was not live in this window, so the command could not be delivered.";
}

function hasOwnBrowserArg(args: Record<string, unknown>, key: string): boolean {
  return Object.hasOwn(args, key);
}

function firstBrowserArg(
  args: Record<string, unknown>,
  ...keys: string[]
): unknown {
  for (const key of keys) {
    if (hasOwnBrowserArg(args, key)) {
      return args[key];
    }
  }
}

function parseDataUrlPng(dataUrl: string): Buffer {
  const match = /^data:image\/png;base64,(.+)$/i.exec(dataUrl.trim());
  if (!match?.[1]) {
    throw new Error("Browser screenshot did not return a PNG data URL.");
  }
  return Buffer.from(match[1], "base64");
}

function buildDefaultBrowserScreenshotPath(execCtx: ToolExecutionContext): {
  full: string;
  rel: string | null;
} {
  const fileName = `browser-${new Date().toISOString().replace(/[:.]/g, "-").replace(/Z$/, "Z")}.png`;
  if (execCtx.workspaceRoot) {
    const rel = path.posix.join(".mai", "browser-captures", fileName);
    const full = resolveWorkspacePath(rel, execCtx.workspaceRoot);
    return { full, rel };
  }
  const full = path.join(os.tmpdir(), "async-browser-captures", fileName);
  return { full, rel: null };
}


export async function executeBrowserTool(
  call: ToolCall,
  execCtx: ToolExecutionContext
): Promise<ToolResult> {
  throwIfToolAbortRequested(execCtx.signal, call.name, "browser:start");
  const hostId = execCtx.hostWebContentsId ?? null;
  if (!hostId) {
    return {
      content:
        "Browser tool is unavailable because this run is not attached to an app window.",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const action = String(call.arguments.action ?? "").trim();
  if (!action) {
    return {
      content: "Error: action is required",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const dispatch = async (command: BrowserControlCommand): Promise<boolean> =>
    await dispatchBrowserControlToHostId(hostId, command);

  switch (action) {
    case "get_config": {
      const payload = await getBrowserSidebarConfigPayloadForHostId(hostId);
      return {
        content: JSON.stringify(
          {
            config: payload.config,
            defaultUserAgent: payload.defaultUserAgent,
            partition: payload.partition,
          },
          null,
          2
        ),
        isError: false,
        name: call.name,
        toolCallId: call.id,
      };
    }
    case "get_state": {
      const state = getBrowserRuntimeStateForHostId(hostId);
      return {
        content: JSON.stringify(
          state ?? {
            activeTabId: null,
            note: "No live browser state has been synced yet. Open or use the built-in browser first.",
            tabs: [],
          },
          null,
          2
        ),
        isError: false,
        name: call.name,
        toolCallId: call.id,
      };
    }
    case "navigate": {
      const target = String(
        call.arguments.url ?? call.arguments.target ?? ""
      ).trim();
      if (!target) {
        return {
          content: "Error: url is required for navigate",
          isError: true,
          name: call.name,
          toolCallId: call.id,
        };
      }
      const resolvedUrl = normalizeBrowserNavigateTarget(target);
      const sent = await dispatch({
        commandId: makeBrowserCommandId(),
        newTab:
          call.arguments.new_tab === true || call.arguments.newTab === true,
        target,
        type: "navigate",
      });
      return {
        content:
          `Opened built-in browser at ${resolvedUrl}.${browserControlDeliveryNote(sent, "command-only")}`.trim(),
        isError: false,
        name: call.name,
        toolCallId: call.id,
      };
    }
    case "read_page": {
      const timeoutMsRaw = Number(
        firstBrowserArg(call.arguments, "timeout_ms", "timeoutMs")
      );
      const timeoutMs =
        Number.isFinite(timeoutMsRaw) && timeoutMsRaw > 0
          ? timeoutMsRaw
          : 20_000;
      const result = await awaitBrowserCommandResult(
        hostId,
        {
          commandId: makeBrowserCommandId(),
          includeHtml:
            firstBrowserArg(call.arguments, "include_html", "includeHtml") ===
              true ||
            firstBrowserArg(call.arguments, "include_html", "includeHtml") ===
              "true",
          maxChars:
            Number(firstBrowserArg(call.arguments, "max_chars", "maxChars")) ||
            undefined,
          selector:
            typeof firstBrowserArg(call.arguments, "selector") === "string"
              ? String(firstBrowserArg(call.arguments, "selector"))
              : undefined,
          tabId:
            typeof firstBrowserArg(call.arguments, "tab_id", "tabId") ===
            "string"
              ? String(firstBrowserArg(call.arguments, "tab_id", "tabId"))
              : undefined,
          type: "readPage",
          waitForLoad:
            firstBrowserArg(call.arguments, "wait_for_load", "waitForLoad") ===
            undefined
              ? true
              : firstBrowserArg(
                  call.arguments,
                  "wait_for_load",
                  "waitForLoad"
                ) === true ||
                firstBrowserArg(
                  call.arguments,
                  "wait_for_load",
                  "waitForLoad"
                ) === "true",
        },
        timeoutMs
      );
      if (!result.ok) {
        return {
          content: `Browser read_page failed: ${result.error}`,
          isError: true,
          name: call.name,
          toolCallId: call.id,
        };
      }
      return {
        content: JSON.stringify(result.result, null, 2),
        isError: false,
        name: call.name,
        toolCallId: call.id,
      };
    }
    case "screenshot_page": {
      const timeoutMsRaw = Number(
        firstBrowserArg(call.arguments, "timeout_ms", "timeoutMs")
      );
      const timeoutMs =
        Number.isFinite(timeoutMsRaw) && timeoutMsRaw > 0
          ? timeoutMsRaw
          : 25_000;
      const result = await awaitBrowserCommandResult(
        hostId,
        {
          commandId: makeBrowserCommandId(),
          tabId:
            typeof firstBrowserArg(call.arguments, "tab_id", "tabId") ===
            "string"
              ? String(firstBrowserArg(call.arguments, "tab_id", "tabId"))
              : undefined,
          type: "screenshotPage",
          waitForLoad:
            firstBrowserArg(call.arguments, "wait_for_load", "waitForLoad") ===
            undefined
              ? true
              : firstBrowserArg(
                  call.arguments,
                  "wait_for_load",
                  "waitForLoad"
                ) === true ||
                firstBrowserArg(
                  call.arguments,
                  "wait_for_load",
                  "waitForLoad"
                ) === "true",
        },
        timeoutMs
      );
      if (!result.ok) {
        return {
          content: `Browser screenshot_page failed: ${result.error}`,
          isError: true,
          name: call.name,
          toolCallId: call.id,
        };
      }
      const payload =
        result.result && typeof result.result === "object"
          ? (result.result as Record<string, unknown>)
          : {};
      const png = parseDataUrlPng(String(payload.dataUrl ?? ""));
      let saveTarget: { full: string; rel: string | null };
      const rawFilePath = String(
        firstBrowserArg(call.arguments, "file_path", "filePath") ?? ""
      ).trim();
      if (rawFilePath) {
        const resolved = resolveAgentFilePath(rawFilePath, execCtx);
        saveTarget = { full: resolved.full, rel: resolved.rel };
      } else {
        saveTarget = buildDefaultBrowserScreenshotPath(execCtx);
      }
      fs.mkdirSync(path.dirname(saveTarget.full), { recursive: true });
      fs.writeFileSync(saveTarget.full, png);
      return {
        content: JSON.stringify(
          {
            capture: "viewport",
            format: "png",
            height: Number(payload.height ?? 0) || 0,
            path: saveTarget.full,
            relPath: saveTarget.rel,
            sizeBytes: png.length,
            title: String(payload.title ?? ""),
            url: String(payload.url ?? ""),
            width: Number(payload.width ?? 0) || 0,
          },
          null,
          2
        ),
        isError: false,
        name: call.name,
        toolCallId: call.id,
      };
    }
    case "click_element": {
      const selector =
        typeof firstBrowserArg(call.arguments, "selector") === "string"
          ? String(firstBrowserArg(call.arguments, "selector"))
          : "";
      if (!selector.trim()) {
        return {
          content: "Error: selector is required for click_element",
          isError: true,
          name: call.name,
          toolCallId: call.id,
        };
      }
      const timeoutMsRaw = Number(
        firstBrowserArg(call.arguments, "timeout_ms", "timeoutMs")
      );
      const timeoutMs =
        Number.isFinite(timeoutMsRaw) && timeoutMsRaw > 0
          ? timeoutMsRaw
          : 20_000;
      const result = await awaitBrowserCommandResult(
        hostId,
        {
          commandId: makeBrowserCommandId(),
          selector: selector.trim(),
          tabId:
            typeof firstBrowserArg(call.arguments, "tab_id", "tabId") ===
            "string"
              ? String(firstBrowserArg(call.arguments, "tab_id", "tabId"))
              : undefined,
          type: "clickElement",
          waitForLoad:
            firstBrowserArg(call.arguments, "wait_for_load", "waitForLoad") ===
            undefined
              ? true
              : firstBrowserArg(
                  call.arguments,
                  "wait_for_load",
                  "waitForLoad"
                ) === true ||
                firstBrowserArg(
                  call.arguments,
                  "wait_for_load",
                  "waitForLoad"
                ) === "true",
        },
        timeoutMs
      );
      if (!result.ok) {
        return {
          content: `Browser click_element failed: ${result.error}`,
          isError: true,
          name: call.name,
          toolCallId: call.id,
        };
      }
      return {
        content: JSON.stringify(result.result, null, 2),
        isError: false,
        name: call.name,
        toolCallId: call.id,
      };
    }
    case "input_text": {
      const selector =
        typeof firstBrowserArg(call.arguments, "selector") === "string"
          ? String(firstBrowserArg(call.arguments, "selector"))
          : "";
      if (!selector.trim()) {
        return {
          content: "Error: selector is required for input_text",
          isError: true,
          name: call.name,
          toolCallId: call.id,
        };
      }
      const text =
        typeof firstBrowserArg(call.arguments, "text", "value") === "string"
          ? String(firstBrowserArg(call.arguments, "text", "value"))
          : "";
      const timeoutMsRaw = Number(
        firstBrowserArg(call.arguments, "timeout_ms", "timeoutMs")
      );
      const timeoutMs =
        Number.isFinite(timeoutMsRaw) && timeoutMsRaw > 0
          ? timeoutMsRaw
          : 20_000;
      const result = await awaitBrowserCommandResult(
        hostId,
        {
          commandId: makeBrowserCommandId(),
          pressEnter:
            firstBrowserArg(call.arguments, "press_enter", "pressEnter") ===
              true ||
            firstBrowserArg(call.arguments, "press_enter", "pressEnter") ===
              "true",
          selector: selector.trim(),
          tabId:
            typeof firstBrowserArg(call.arguments, "tab_id", "tabId") ===
            "string"
              ? String(firstBrowserArg(call.arguments, "tab_id", "tabId"))
              : undefined,
          text,
          type: "inputText",
          waitForLoad:
            firstBrowserArg(call.arguments, "wait_for_load", "waitForLoad") ===
            undefined
              ? true
              : firstBrowserArg(
                  call.arguments,
                  "wait_for_load",
                  "waitForLoad"
                ) === true ||
                firstBrowserArg(
                  call.arguments,
                  "wait_for_load",
                  "waitForLoad"
                ) === "true",
        },
        timeoutMs
      );
      if (!result.ok) {
        return {
          content: `Browser input_text failed: ${result.error}`,
          isError: true,
          name: call.name,
          toolCallId: call.id,
        };
      }
      return {
        content: JSON.stringify(result.result, null, 2),
        isError: false,
        name: call.name,
        toolCallId: call.id,
      };
    }
    case "wait_for_selector": {
      const selector =
        typeof firstBrowserArg(call.arguments, "selector") === "string"
          ? String(firstBrowserArg(call.arguments, "selector"))
          : "";
      if (!selector.trim()) {
        return {
          content: "Error: selector is required for wait_for_selector",
          isError: true,
          name: call.name,
          toolCallId: call.id,
        };
      }
      const timeoutMsRaw = Number(
        firstBrowserArg(call.arguments, "timeout_ms", "timeoutMs")
      );
      const timeoutMs =
        Number.isFinite(timeoutMsRaw) && timeoutMsRaw > 0
          ? timeoutMsRaw
          : 20_000;
      const result = await awaitBrowserCommandResult(
        hostId,
        {
          commandId: makeBrowserCommandId(),
          selector: selector.trim(),
          tabId:
            typeof firstBrowserArg(call.arguments, "tab_id", "tabId") ===
            "string"
              ? String(firstBrowserArg(call.arguments, "tab_id", "tabId"))
              : undefined,
          timeoutMs,
          type: "waitForSelector",
          visible:
            firstBrowserArg(call.arguments, "visible") === true ||
            firstBrowserArg(call.arguments, "visible") === "true",
          waitForLoad:
            firstBrowserArg(call.arguments, "wait_for_load", "waitForLoad") ===
            undefined
              ? true
              : firstBrowserArg(
                  call.arguments,
                  "wait_for_load",
                  "waitForLoad"
                ) === true ||
                firstBrowserArg(
                  call.arguments,
                  "wait_for_load",
                  "waitForLoad"
                ) === "true",
        },
        timeoutMs + 2000
      );
      if (!result.ok) {
        return {
          content: `Browser wait_for_selector failed: ${result.error}`,
          isError: true,
          name: call.name,
          toolCallId: call.id,
        };
      }
      return {
        content: JSON.stringify(result.result, null, 2),
        isError: false,
        name: call.name,
        toolCallId: call.id,
      };
    }
    case "close_sidebar": {
      const sent = await dispatch({
        commandId: makeBrowserCommandId(),
        type: "closeSidebar",
      });
      return {
        content:
          `Browser command "${action}" dispatched.${browserControlDeliveryNote(sent, "command-only")}`.trim(),
        isError: false,
        name: call.name,
        toolCallId: call.id,
      };
    }
    case "reload":
    case "stop":
    case "go_back":
    case "go_forward":
    case "close_tab": {
      const commandType =
        action === "go_back"
          ? "goBack"
          : action === "go_forward"
            ? "goForward"
            : action === "close_tab"
              ? "closeTab"
              : (action as "reload" | "stop");
      const sent = await dispatch({
        commandId: makeBrowserCommandId(),
        tabId:
          typeof firstBrowserArg(call.arguments, "tab_id", "tabId") === "string"
            ? String(firstBrowserArg(call.arguments, "tab_id", "tabId"))
            : undefined,
        type: commandType,
      });
      return {
        content:
          `Browser command "${action}" dispatched.${browserControlDeliveryNote(sent, "command-only")}`.trim(),
        isError: false,
        name: call.name,
        toolCallId: call.id,
      };
    }
    case "reset_config": {
      const nextConfig = browserSidebarConfigToPayload(
        getDefaultBrowserSidebarConfig()
      );
      const result = await setBrowserSidebarConfigForHostId(hostId, nextConfig);
      if (!result.ok) {
        return {
          content:
            result.error === "invalid-header-line"
              ? `Invalid extra header format on line ${result.line}.`
              : "Proxy rules are required when proxyMode is custom.",
          isError: true,
          name: call.name,
          toolCallId: call.id,
        };
      }
      const sent = await dispatch({
        commandId: makeBrowserCommandId(),
        config: result.config,
        defaultUserAgent: result.defaultUserAgent,
        type: "applyConfig",
      });
      return {
        content:
          `Browser config reset to defaults.${browserControlDeliveryNote(sent, "config-persisted")}`.trim(),
        isError: false,
        name: call.name,
        toolCallId: call.id,
      };
    }
    case "set_config": {
      const current = browserSidebarConfigToPayload(
        getOrCreateBrowserSidebarConfigForHostId(hostId)
      );
      const next: BrowserSidebarConfigPayload = {
        ...current,
      };
      if (
        hasOwnBrowserArg(call.arguments, "userAgent") ||
        hasOwnBrowserArg(call.arguments, "user_agent")
      ) {
        next.userAgent = String(
          firstBrowserArg(call.arguments, "userAgent", "user_agent") ?? ""
        ).trim();
      }
      if (
        hasOwnBrowserArg(call.arguments, "acceptLanguage") ||
        hasOwnBrowserArg(call.arguments, "accept_language")
      ) {
        next.acceptLanguage = String(
          firstBrowserArg(
            call.arguments,
            "acceptLanguage",
            "accept_language"
          ) ?? ""
        ).trim();
      }
      if (
        hasOwnBrowserArg(call.arguments, "extraHeadersText") ||
        hasOwnBrowserArg(call.arguments, "extra_headers_text")
      ) {
        next.extraHeadersText = String(
          firstBrowserArg(
            call.arguments,
            "extraHeadersText",
            "extra_headers_text"
          ) ?? ""
        ).replace(/\r/g, "");
      }
      if (
        hasOwnBrowserArg(call.arguments, "blockTrackers") ||
        hasOwnBrowserArg(call.arguments, "block_trackers")
      ) {
        next.blockTrackers =
          firstBrowserArg(call.arguments, "blockTrackers", "block_trackers") ===
            true ||
          firstBrowserArg(call.arguments, "blockTrackers", "block_trackers") ===
            "true";
      }
      if (
        hasOwnBrowserArg(call.arguments, "proxyMode") ||
        hasOwnBrowserArg(call.arguments, "proxy_mode")
      ) {
        const proxyMode = String(
          firstBrowserArg(call.arguments, "proxyMode", "proxy_mode") ?? ""
        ).trim();
        next.proxyMode =
          proxyMode === "direct" ||
          proxyMode === "custom" ||
          proxyMode === "system"
            ? proxyMode
            : current.proxyMode;
      }
      if (
        hasOwnBrowserArg(call.arguments, "proxyRules") ||
        hasOwnBrowserArg(call.arguments, "proxy_rules")
      ) {
        next.proxyRules = String(
          firstBrowserArg(call.arguments, "proxyRules", "proxy_rules") ?? ""
        ).trim();
      }
      if (
        hasOwnBrowserArg(call.arguments, "proxyBypassRules") ||
        hasOwnBrowserArg(call.arguments, "proxy_bypass_rules")
      ) {
        next.proxyBypassRules = String(
          firstBrowserArg(
            call.arguments,
            "proxyBypassRules",
            "proxy_bypass_rules"
          ) ?? ""
        ).trim();
      }
      if (hasOwnBrowserArg(call.arguments, "fingerprint")) {
        const fpArg = call.arguments.fingerprint;
        if (
          fpArg === null ||
          (typeof fpArg === "object" &&
            !Array.isArray(fpArg) &&
            Object.keys(fpArg as Record<string, unknown>).length === 0)
        ) {
          next.fingerprint = {};
        } else if (typeof fpArg === "object" && !Array.isArray(fpArg)) {
          next.fingerprint = normalizeBrowserFingerprintSpoof({
            ...current.fingerprint,
            ...(fpArg as Record<string, unknown>),
          });
        }
      }
      const result = await setBrowserSidebarConfigForHostId(hostId, next);
      if (!result.ok) {
        return {
          content:
            result.error === "invalid-header-line"
              ? `Invalid extra header format on line ${result.line}.`
              : "Proxy rules are required when proxyMode is custom.",
          isError: true,
          name: call.name,
          toolCallId: call.id,
        };
      }
      const sent = await dispatch({
        commandId: makeBrowserCommandId(),
        config: result.config,
        defaultUserAgent: result.defaultUserAgent,
        type: "applyConfig",
      });
      return {
        content: `Browser config updated:\n${JSON.stringify(result.config, null, 2)}${browserControlDeliveryNote(sent, "config-persisted")}`,
        isError: false,
        name: call.name,
        toolCallId: call.id,
      };
    }
    default:
      return {
        content:
          "Unknown Browser action. Supported actions: get_config, get_state, navigate, read_page, screenshot_page, click_element, input_text, wait_for_selector, close_sidebar, reload, stop, go_back, go_forward, close_tab, set_config, reset_config.",
        isError: true,
        name: call.name,
        toolCallId: call.id,
      };
  }
}

export async function executeBrowserCaptureTool(
  call: ToolCall,
  execCtx: ToolExecutionContext
): Promise<ToolResult> {
  throwIfToolAbortRequested(execCtx.signal, call.name, "browser-capture:start");
  const hostId = execCtx.hostWebContentsId ?? null;
  if (!hostId) {
    return {
      content:
        "BrowserCapture tool is unavailable because this run is not attached to an app window.",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const action = String(call.arguments.action ?? "").trim();
  if (!action) {
    return {
      content: "Error: action is required",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  switch (action) {
    case "get_state":
      return {
        content: JSON.stringify(
          getBrowserCaptureStateForHostId(hostId),
          null,
          2
        ),
        isError: false,
        name: call.name,
        toolCallId: call.id,
      };
    case "start": {
      const clearExisting =
        call.arguments.clear_existing === undefined &&
        call.arguments.clearExisting === undefined
          ? true
          : call.arguments.clear_existing === true ||
            call.arguments.clear_existing === "true" ||
            call.arguments.clearExisting === true ||
            call.arguments.clearExisting === "true";
      const state = await startBrowserCaptureForHostId(hostId, {
        clear: clearExisting,
      });
      return {
        content: JSON.stringify(state, null, 2),
        isError: false,
        name: call.name,
        toolCallId: call.id,
      };
    }
    case "stop": {
      const state = await stopBrowserCaptureForHostId(hostId);
      return {
        content: JSON.stringify(state, null, 2),
        isError: false,
        name: call.name,
        toolCallId: call.id,
      };
    }
    case "clear":
      return {
        content: JSON.stringify(
          clearBrowserCaptureDataForHostId(hostId),
          null,
          2
        ),
        isError: false,
        name: call.name,
        toolCallId: call.id,
      };
    case "list_requests": {
      const statusRaw = Number(call.arguments.status);
      const result = listBrowserCaptureRequestsForHostId(hostId, {
        limit: Number(call.arguments.limit ?? 50),
        offset: Number(call.arguments.offset ?? 0),
        query:
          typeof call.arguments.query === "string"
            ? call.arguments.query
            : undefined,
        status: Number.isFinite(statusRaw) ? statusRaw : null,
        tabId:
          typeof firstBrowserArg(call.arguments, "tab_id", "tabId") === "string"
            ? String(firstBrowserArg(call.arguments, "tab_id", "tabId"))
            : undefined,
      });
      return {
        content: JSON.stringify(result, null, 2),
        isError: false,
        name: call.name,
        toolCallId: call.id,
      };
    }
    case "get_request": {
      const request = getBrowserCaptureRequestForHostId(hostId, {
        requestId:
          typeof firstBrowserArg(call.arguments, "request_id", "requestId") ===
          "string"
            ? String(firstBrowserArg(call.arguments, "request_id", "requestId"))
            : undefined,
        seq: Number(call.arguments.seq ?? 0),
      });
      if (!request) {
        return {
          content:
            "BrowserCapture request not found. Provide a valid request_id or seq from list_requests.",
          isError: true,
          name: call.name,
          toolCallId: call.id,
        };
      }
      return {
        content: JSON.stringify(request, null, 2),
        isError: false,
        name: call.name,
        toolCallId: call.id,
      };
    }
    default:
      return {
        content:
          "Unknown BrowserCapture action. Supported actions: get_state, start, stop, clear, list_requests, get_request.",
        isError: true,
        name: call.name,
        toolCallId: call.id,
      };
  }
}

