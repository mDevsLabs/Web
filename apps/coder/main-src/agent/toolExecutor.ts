/**
 * 工具执行引擎 — 接收工具调用并在工作区内安全执行。
 */

import { execFile } from "node:child_process";
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as http from "node:http";
import * as https from "node:https";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL, URL } from "node:url";
import { promisify } from "node:util";
import { HttpsProxyAgent } from "https-proxy-agent";
import { minimatch } from "minimatch";
import {
  clearBrowserCaptureDataForHostId,
  getBrowserCaptureRequestForHostId,
  getBrowserCaptureStateForHostId,
  listBrowserCaptureRequestsForHostId,
  startBrowserCaptureForHostId,
  stopBrowserCaptureForHostId,
} from "../browser/browserCapture.js";
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
} from "../browser/browserController.js";
import { normalizeBrowserFingerprintSpoof } from "../browser/browserFingerprintNormalize.js";
import { executePlaywrightTool } from "../browser/playwrightTool.js";
import * as gitService from "../gitService.js";
import type { NestedAgentStreamEmit } from "../ipc/nestedAgentStream.js";
import type { AnthropicToolResultContent } from "../llm/anthropicBeta.js";
import type { WorkspaceLspManager } from "../lsp/workspaceLspManager.js";
import type { McpToolResult } from "../mcp";
import { getMcpManager } from "../mcp";
import type { ShellSettings } from "../settingsStore.js";
import { executeShellCommand } from "../shell/commandExecutor.js";
import {
  isProbablyTextBuffer,
  readTextFileIfExistsSync,
  readTextFileSyncWithMetadata,
  type TextEncoding,
  writeTextFileAtomicSync,
} from "../textEncoding.js";
import { getThread } from "../threadStore.js";
import { isPathInsideRoot, resolveWorkspacePath } from "../workspace.js";
import {
  ensureSymbolIndexLoaded,
  formatSymbolSearchResults,
  searchWorkspaceSymbols,
} from "../workspaceSymbolIndex.js";
import { shouldRunAgentInBackground } from "./agentForkPolicy.js";
import type { AgentLoopOptions } from "./agentLoop.js";
import type { ToolCall, ToolResult } from "./agentTools.js";
import {
  closeManagedAgent,
  getManagedAgentSession,
  type ManagedAgentUiEvent,
  resumeManagedAgent,
  sendInputToManagedAgent,
  spawnManagedAgent,
  startManagedAgent,
  waitForManagedAgents,
} from "./managedSubagents.js";
import { executePlanSubmitDraftTool } from "./planDraftTool.js";
import {
  executeAskPlanQuestionTool,
  type TeamPlanQuestionRoleScope,
} from "./planQuestionTool.js";
import { executeTeamEscalateToLeadTool } from "./teamEscalateTool.js";
import { executeTeamPeerRequestTool } from "./teamPeerRequestTool.js";
import { executeTeamPlanDecideTool } from "./teamPlanDecideTool.js";
import { executeTeamReplyToPeerTool } from "./teamReplyToPeerTool.js";
import { setTodos, type TodoItem } from "./todoStore.js";

const execFileAsync = promisify(execFile);

export type SubAgentBackgroundDonePayload = {
  parentToolCallId: string;
  agentId: string;
  result: string;
  success: boolean;
};

/** Agent / Task 嵌套子循环上下文（由 register.ts 注入）。 */
let _delegateContext: {
  settings: ShellSettings;
  options: Omit<AgentLoopOptions, "signal">;
  parentSignal: AbortSignal;
  nestedEmit?: (evt: NestedAgentStreamEmit) => void;
  threadId: string | null;
  managedEmit?: (evt: ManagedAgentUiEvent) => void;
  onSubAgentBackgroundDone?: (payload: SubAgentBackgroundDonePayload) => void;
  parentMessages?: import("../threadStore.js").ChatMessage[];
} | null = null;

export function setDelegateContext(
  settings: ShellSettings,
  options: Omit<AgentLoopOptions, "signal">,
  parentSignal: AbortSignal,
  nestedEmit?: (evt: NestedAgentStreamEmit) => void,
  threadId?: string | null,
  managedEmit?: (evt: ManagedAgentUiEvent) => void,
  onSubAgentBackgroundDone?: (payload: SubAgentBackgroundDonePayload) => void,
  parentMessages?: import("../threadStore.js").ChatMessage[]
): void {
  _delegateContext = {
    managedEmit,
    nestedEmit,
    onSubAgentBackgroundDone,
    options,
    parentMessages,
    parentSignal,
    settings,
    threadId: threadId ?? null,
  };
}

export function clearDelegateContext(): void {
  _delegateContext = null;
}
new Set(["Agent", "Task"]);
function coerceAgentDelegateArgs(call: ToolCall): {
  task: string;
  context: string;
  subagentType?: string;
  runInBackground: boolean;
  forkContext: boolean;
} {
  const a = call.arguments;
  const task = String(a.prompt ?? a.task ?? a.description ?? "").trim();
  const context = String(a.context ?? "").trim();
  const subagentType =
    typeof a.subagent_type === "string" && a.subagent_type.trim()
      ? a.subagent_type.trim()
      : undefined;
  const runInBackground =
    a.run_in_background === true || a.run_in_background === "true";
  const forkContext = a.fork_context === true || a.fork_context === "true";
  return { context, forkContext, runInBackground, subagentType, task };
}

const BACKGROUND_AGENT_TOOL_RESULT =
  "[Background] Sub-agent started. Its task card opens the right sidebar; do not paste the sub-agent reply into the main chat unless the user asks. / 后台子 Agent 已启动，可从任务卡片打开右侧栏查看；除非用户要求，不要把子 Agent 回复原样贴回主聊天。";

/** Single Read call: max lines returned. */
const MAX_READ_LINES_PER_CALL = 2000;
/** Refuse to load extremely large text files into memory in one shot. */
const MAX_READ_FILE_BYTES = 2 * 1024 * 1024;

const GLOB_MAX_RESULTS = 100;
const GLOB_IGNORE_DIR_NAMES = new Set([
  ".git",
  "node_modules",
  ".hg",
  ".svn",
  ".jj",
]);
const MAX_SYMBOL_SEARCH_RESULTS = 80;
const DEFAULT_GREP_HEAD_LIMIT = 250;
const VCS_GREP_EXCLUDES = [
  ".git",
  ".svn",
  ".hg",
  ".bzr",
  ".jj",
  ".sl",
] as const;
const VIEW_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const VIEW_IMAGE_MEDIA_TYPE_BY_EXT = new Map<
  string,
  "image/jpeg" | "image/png" | "image/gif" | "image/webp"
>([
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".gif", "image/gif"],
  [".webp", "image/webp"],
]);

export type ToolWriteSnapshot = {
  path: string;
  previousContent: string | null;
};

export type ToolAfterWriteSnapshot = {
  path: string;
  previousContent: string | null;
  nextContent: string;
};

export type ToolExecutionHooks = {
  beforeWrite?: (snapshot: ToolWriteSnapshot) => void | Promise<void>;
  afterWrite?: (snapshot: ToolAfterWriteSnapshot) => void | Promise<void>;
};

function formatMcpToolResultForAgent(result: McpToolResult): string {
  const parts: string[] = [];
  for (const block of result.content ?? []) {
    if (block.type === "text" && block.text != null && block.text !== "") {
      parts.push(block.text);
    } else if (block.type === "image") {
      parts.push(
        block.data
          ? `[image${block.mimeType ? ` ${block.mimeType}` : ""}, base64 ${Math.min(block.data.length, 64)} chars…]`
          : "[image]"
      );
    } else if (block.type === "resource") {
      parts.push("[resource]");
    } else {
      parts.push(JSON.stringify(block));
    }
  }
  const text = parts.join("\n\n").trim();
  return text || "(empty MCP result)";
}

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

async function executeBrowserTool(
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

function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtmlEntities(text: string): string {
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

function parseDuckDuckGoHtml(
  html: string
): Array<{ title: string; url: string; snippet: string }> {
  const results: Array<{ title: string; url: string; snippet: string }> = [];
  // DuckDuckGo HTML results: each result block starts with <div class="result ...">
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
      // DuckDuckGo sometimes wraps external links via their redirect endpoint
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

const WEB_SEARCH_TIMEOUT_MS = 15_000;

type WindowsProxySettings = {
  enabled: boolean;
  server: string;
  override: string;
};

function getEnvValue(names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name];
    if (value?.trim()) {
      return value.trim();
    }
  }
}

function normalizeProxyUrl(rawProxy: string): string | null {
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

function wildcardToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`, "i");
}

function shouldBypassProxy(
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

function parseWindowsProxyServer(
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

async function readWindowsProxySettings(): Promise<WindowsProxySettings | null> {
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

async function getProxyUrlForRequest(targetUrl: URL): Promise<string | null> {
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

async function performWebSearch(
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

async function executeWebSearchTool(
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

type FetchResult = {
  status: number;
  statusText: string;
  headers: Record<string, string | string[]>;
  body: string;
  truncated: boolean;
};

function performFetch(
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

async function executeFetchTool(
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

async function executeBrowserCaptureTool(
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

async function executeListMcpResources(call: ToolCall): Promise<ToolResult> {
  const filter = String(call.arguments.server ?? "").trim();
  const mgr = getMcpManager();
  const clients = mgr.getConnectedClients();
  let targets = clients;
  if (filter) {
    targets = clients.filter(
      (c) => c.config.id === filter || c.config.name === filter
    );
    if (targets.length === 0) {
      return {
        content: `No connected MCP server matches "${filter}".`,
        isError: true,
        name: call.name,
        toolCallId: call.id,
      };
    }
  }
  const rows: Array<{
    uri: string;
    name: string;
    server: string;
    mimeType?: string;
    description?: string;
  }> = [];
  for (const c of targets) {
    const st = c.getServerStatus();
    for (const r of st.resources) {
      rows.push({
        description: r.description,
        mimeType: r.mimeType,
        name: r.name,
        server: c.config.name,
        uri: r.uri,
      });
    }
  }
  const text = JSON.stringify(rows, null, 2);
  return {
    content: text || "[]",
    isError: false,
    name: call.name,
    toolCallId: call.id,
  };
}

async function executeReadMcpResource(
  call: ToolCall,
  execCtx: ToolExecutionContext
): Promise<ToolResult> {
  throwIfToolAbortRequested(execCtx.signal, call.name, "readMcpResource:start");
  const server = String(call.arguments.server ?? "").trim();
  const uri = String(call.arguments.uri ?? "").trim();
  if (!server || !uri) {
    return {
      content: "Error: server and uri are required",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const client = getMcpManager().getClientByServerRef(server);
  if (!client) {
    return {
      content: `MCP server not found: ${server}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  if (client.getServerStatus().status !== "connected") {
    return {
      content: `MCP server not connected: ${server}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  try {
    const raw = await client.readResource(uri, execCtx.signal);
    const text = typeof raw === "string" ? raw : JSON.stringify(raw, null, 2);
    return {
      content: text,
      isError: false,
      name: call.name,
      toolCallId: call.id,
    };
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw e;
    }
    const msg = e instanceof Error ? e.message : String(e);
    return {
      content: `MCP resources/read failed: ${msg}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
}

async function executeMcpAgentTool(
  call: ToolCall,
  execCtx: ToolExecutionContext
): Promise<ToolResult> {
  try {
    throwIfToolAbortRequested(execCtx.signal, call.name, "mcpTool:start");
    const raw = await getMcpManager().callTool(
      call.name,
      call.arguments,
      execCtx.signal
    );
    const content = formatMcpToolResultForAgent(raw);
    return {
      content,
      isError: !!raw.isError,
      name: call.name,
      toolCallId: call.id,
    };
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw e;
    }
    const msg = e instanceof Error ? e.message : String(e);
    return {
      content: `MCP tool error: ${msg}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
}

export type ToolExecutionContext = {
  delegateExecutionDepth?: number;
  workspaceRoot?: string | null;
  extraReadableRoots?: string[];
  workspaceLspManager?: WorkspaceLspManager | null;
  threadId?: string | null;
  hostWebContentsId?: number | null;
  signal?: AbortSignal;
  /** Team 子循环：随 ask_plan_question 一并下发，供聊天区挂到对应角色 */
  teamToolRoleScope?: TeamPlanQuestionRoleScope;
  customToolHandlers?: Record<
    string,
    (
      call: ToolCall,
      hooks: ToolExecutionHooks,
      execCtx: ToolExecutionContext
    ) => Promise<ToolResult> | ToolResult
  >;
};

function throwIfToolAbortRequested(
  signal: AbortSignal | undefined,
  toolName: string,
  phase: string
): void {
  if (!signal?.aborted) {
    return;
  }
  throw new DOMException(
    `Tool ${toolName} aborted during ${phase}`,
    "AbortError"
  );
}

export async function executeTool(
  call: ToolCall,
  hooks: ToolExecutionHooks = {},
  execCtx: ToolExecutionContext = {}
): Promise<ToolResult> {
  try {
    throwIfToolAbortRequested(execCtx.signal, call.name, "executeTool:start");
    const customHandler = execCtx.customToolHandlers?.[call.name];
    if (customHandler) {
      return await customHandler(call, hooks, execCtx);
    }
    switch (call.name) {
      case "Read":
        return executeReadFile(call, execCtx);
      case "view_image":
        return executeViewImage(call, execCtx);
      case "Write":
        return executeWriteToFile(call, hooks, execCtx);
      case "Edit":
        return executeStrReplace(call, hooks, execCtx);
      case "Glob":
        return executeGlob(call, execCtx);
      case "list_dir":
        return executeListDir(call, execCtx);
      case "Grep":
        return await executeGrepTool(call, execCtx);
      case "Bash":
        return await executeCommand(call, hooks, execCtx);
      case "Terminal":
        return await executeTerminalTool(call, execCtx);
      case "Browser":
        return await executeBrowserTool(call, execCtx);
      case "BrowserCapture":
        return await executeBrowserCaptureTool(call, execCtx);
      case "Playwright": {
        const hostId = execCtx.hostWebContentsId ?? null;
        if (!hostId) {
          return {
            content:
              "Playwright tool is unavailable because this run is not attached to an app window.",
            isError: true,
            name: call.name,
            toolCallId: call.id,
          };
        }
        return await executePlaywrightTool(call, {
          hostId,
          workspaceRoot: execCtx.workspaceRoot ?? null,
        });
      }
      case "WebSearch":
        return await executeWebSearchTool(call, execCtx);
      case "Fetch":
        return await executeFetchTool(call, execCtx);
      case "LSP":
        return await executeLspTool(call, execCtx);
      case "Agent":
      case "Task":
        return await executeAgentDelegate(call, execCtx);
      case "send_input":
        return await executeAgentSendInput(call, execCtx);
      case "wait_agent":
        return await executeAgentWait(call, execCtx);
      case "resume_agent":
        return await executeAgentResume(call, execCtx);
      case "close_agent":
        return await executeAgentClose(call, execCtx);
      case "request_user_input":
        return {
          content: "request_user_input is not available in this context.",
          isError: true,
          name: call.name,
          toolCallId: call.id,
        };
      case "ListMcpResourcesTool":
        return await executeListMcpResources(call);
      case "ReadMcpResourceTool":
        return await executeReadMcpResource(call, execCtx);
      case "begin_outcome":
        return {
          content: "outcome phase started",
          isError: false,
          name: call.name,
          toolCallId: call.id,
        };
      case "TodoWrite":
        return executeTodoWrite(call, execCtx);
      case "TaskCreate":
        return await executeAgentDelegate(
          {
            ...call,
            arguments: {
              ...call.arguments,
              // TaskCreate 始终异步：把 run_in_background 强制为 true，模型再用
              // TaskList / TaskGet / TaskOutput 取状态，TaskUpdate / TaskStop 操作进度。
              run_in_background: true,
            },
          },
          execCtx
        );
      case "TaskUpdate":
        return await executeAgentSendInput(
          {
            ...call,
            arguments: {
              ...call.arguments,
              target:
                call.arguments.target ??
                call.arguments.taskId ??
                call.arguments.id,
            },
          },
          execCtx
        );
      case "TaskList":
        return executeTaskList(call, execCtx);
      case "TaskGet":
        return executeTaskGet(call, execCtx);
      case "TaskOutput":
        return executeTaskOutput(call, execCtx);
      case "TaskStop":
        return await executeAgentClose(
          {
            ...call,
            arguments: {
              ...call.arguments,
              target:
                call.arguments.target ??
                call.arguments.taskId ??
                call.arguments.id,
            },
          },
          execCtx
        );
      case "ask_plan_question":
        return await executeAskPlanQuestionTool(
          call,
          execCtx.teamToolRoleScope
            ? { teamRoleScope: execCtx.teamToolRoleScope }
            : undefined
        );
      case "plan_submit_draft":
        return await executePlanSubmitDraftTool(call, execCtx.threadId);
      case "team_plan_decide":
        return await executeTeamPlanDecideTool(
          call,
          execCtx.teamToolRoleScope?.teamTaskId
        );
      case "team_escalate_to_lead":
        return await executeTeamEscalateToLeadTool(
          call,
          execCtx.teamToolRoleScope?.teamTaskId
        );
      case "team_request_from_peer":
        return await executeTeamPeerRequestTool(
          call,
          execCtx.teamToolRoleScope?.teamTaskId
        );
      case "team_reply_to_peer":
        return await executeTeamReplyToPeerTool(
          call,
          execCtx.teamToolRoleScope?.teamTaskId
        );
      default:
        if (getMcpManager().isMcpTool(call.name)) {
          return await executeMcpAgentTool(call, execCtx);
        }
        return {
          content: `Unknown tool: ${call.name}`,
          isError: true,
          name: call.name,
          toolCallId: call.id,
        };
    }
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw e;
    }
    return {
      content: `Error: ${e instanceof Error ? e.message : String(e)}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
}

function requireWorkspace(execCtx: ToolExecutionContext): string {
  const root = execCtx.workspaceRoot ?? null;
  if (!root) throw new Error("No workspace folder open.");
  return root;
}

type ExpectedReadablePath = "any" | "file" | "directory";

type ResolvedReadablePath = {
  full: string;
  display: string;
  root: string;
  isWorkspace: boolean;
};

function pathKey(filePath: string): string {
  const resolved = path.resolve(filePath);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function normalizeToolPath(filePath: string): string {
  const resolved = path.resolve(filePath);
  return process.platform === "win32" ? resolved.replace(/\\/g, "/") : resolved;
}

function getExtraReadableRoots(execCtx: ToolExecutionContext): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of execCtx.extraReadableRoots ?? []) {
    if (!raw?.trim()) {
      continue;
    }
    const resolved = path.resolve(raw);
    const key = pathKey(resolved);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(resolved);
  }
  return out;
}

function pathMatchesExpected(
  full: string,
  expected: ExpectedReadablePath
): boolean {
  if (!fs.existsSync(full)) {
    return false;
  }
  const stat = fs.statSync(full);
  if (expected === "file") {
    return stat.isFile();
  }
  if (expected === "directory") {
    return stat.isDirectory();
  }
  return true;
}

function makeReadablePath(
  full: string,
  root: string,
  isWorkspace: boolean
): ResolvedReadablePath {
  const normalizedFull = path.resolve(full);
  const normalizedRoot = path.resolve(root);
  const rel =
    path.relative(normalizedRoot, normalizedFull).replace(/\\/g, "/") || ".";
  return {
    display: isWorkspace ? rel : normalizeToolPath(normalizedFull),
    full: normalizedFull,
    isWorkspace,
    root: normalizedRoot,
  };
}

function readableRootCandidates(
  execCtx: ToolExecutionContext
): Array<{ root: string; isWorkspace: boolean }> {
  const roots: Array<{ root: string; isWorkspace: boolean }> = [];
  const workspaceRoot = execCtx.workspaceRoot
    ? path.resolve(execCtx.workspaceRoot)
    : "";
  if (workspaceRoot) {
    roots.push({ isWorkspace: true, root: workspaceRoot });
  }
  for (const root of getExtraReadableRoots(execCtx)) {
    if (workspaceRoot && pathKey(root) === pathKey(workspaceRoot)) {
      continue;
    }
    roots.push({ isWorkspace: false, root });
  }
  return roots;
}

function resolveReadablePath(
  raw: string,
  execCtx: ToolExecutionContext,
  expected: ExpectedReadablePath = "any"
): ResolvedReadablePath {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("file_path is required");
  const roots = readableRootCandidates(execCtx);
  if (roots.length === 0) {
    throw new Error(
      "No workspace folder open and no skill/plugin readable roots registered."
    );
  }

  const candidates: ResolvedReadablePath[] = [];
  const addRelativeCandidates = (rel: string): void => {
    const cleaned = rel.replace(/^[/\\]+/, "");
    for (const rootInfo of roots) {
      const full = path.resolve(rootInfo.root, cleaned);
      if (!isPathInsideRoot(full, rootInfo.root)) {
        continue;
      }
      candidates.push(
        makeReadablePath(full, rootInfo.root, rootInfo.isWorkspace)
      );
    }
  };

  if (path.isAbsolute(trimmed)) {
    const full = path.resolve(trimmed);
    const allowedRoot = roots.find((rootInfo) =>
      isPathInsideRoot(full, rootInfo.root)
    );
    if (allowedRoot) {
      return makeReadablePath(full, allowedRoot.root, allowedRoot.isWorkspace);
    }
    if (/^[/\\]+(?![/\\])/.test(trimmed)) {
      addRelativeCandidates(trimmed);
    }
  } else {
    addRelativeCandidates(trimmed);
  }

  const existing = candidates.find((candidate) =>
    pathMatchesExpected(candidate.full, expected)
  );
  if (existing) {
    return existing;
  }
  const anyExisting = candidates.find((candidate) =>
    fs.existsSync(candidate.full)
  );
  if (anyExisting) {
    return anyExisting;
  }
  if (candidates.length > 0) {
    return candidates[0]!;
  }
  throw new Error("Path escapes workspace and registered skill/plugin roots.");
}

function resolveAgentFilePath(
  raw: string,
  execCtx: ToolExecutionContext
): { rel: string; full: string } {
  const root = requireWorkspace(execCtx);
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("file_path is required");
  const full = path.isAbsolute(trimmed)
    ? path.normalize(trimmed)
    : resolveWorkspacePath(trimmed.replace(/^[/\\]+/, ""), root);
  if (!isPathInsideRoot(full, root))
    throw new Error("Path escapes workspace boundary.");
  const rel = path.relative(root, full).replace(/\\/g, "/") || ".";
  return { full, rel };
}

function readToolFileArg(call: ToolCall): string {
  return String(call.arguments.file_path ?? call.arguments.path ?? "").trim();
}

function resolveViewImageMediaType(
  filePath: string
): "image/jpeg" | "image/png" | "image/gif" | "image/webp" | null {
  return (
    VIEW_IMAGE_MEDIA_TYPE_BY_EXT.get(path.extname(filePath).toLowerCase()) ??
    null
  );
}

function executeViewImage(
  call: ToolCall,
  execCtx: ToolExecutionContext
): ToolResult {
  const rawPath = String(
    call.arguments.path ?? call.arguments.file_path ?? ""
  ).trim();
  if (!rawPath) {
    return {
      content: "Error: path is required",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const detailRaw = call.arguments.detail;
  if (
    detailRaw != null &&
    String(detailRaw).trim() !== "" &&
    String(detailRaw).trim() !== "original"
  ) {
    return {
      content: `Error: view_image.detail only supports "original"; omit it for default behavior, got "${String(detailRaw)}"`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  let resolved: ResolvedReadablePath;
  try {
    resolved = resolveReadablePath(rawPath, execCtx, "file");
  } catch (error) {
    return {
      content: `Error: ${error instanceof Error ? error.message : String(error)}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  if (!fs.existsSync(resolved.full) || !fs.statSync(resolved.full).isFile()) {
    return {
      content: `Error: image not found or not a regular file: ${resolved.display}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const mediaType = resolveViewImageMediaType(resolved.full);
  if (!mediaType) {
    return {
      content:
        "Error: view_image only supports PNG, JPG, JPEG, GIF, and WEBP files.",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const bytes = fs.readFileSync(resolved.full);
  if (bytes.length === 0) {
    return {
      content: `Error: image file is empty: ${resolved.display}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  if (bytes.length > VIEW_IMAGE_MAX_BYTES) {
    return {
      content: `Error: image is too large for view_image (${bytes.length} bytes). Maximum supported size is ${VIEW_IMAGE_MAX_BYTES} bytes.`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const diskSha = crypto.createHash("sha256").update(bytes).digest("hex");
  const threadId = execCtx.threadId ?? null;
  if (threadId) {
    const thread = getThread(threadId);
    const alreadyAttached = !!thread?.messages?.some(
      (m) =>
        m.role === "user" &&
        !!m.parts?.some(
          (p) =>
            p.kind === "image_ref" &&
            typeof p.sha256 === "string" &&
            p.sha256.length > 0 &&
            p.sha256 === diskSha
        )
    );
    if (alreadyAttached) {
      return {
        content: JSON.stringify(
          {
            deduped: true,
            mediaType,
            note: "Image already attached to this conversation by the user (sha256 match). Reference it directly by relPath instead of reloading.",
            path: resolved.full,
            relPath: resolved.display,
            sha256: diskSha,
            sizeBytes: bytes.length,
          },
          null,
          2
        ),
        isError: false,
        name: call.name,
        toolCallId: call.id,
      };
    }
  }

  const structuredContent: AnthropicToolResultContent = [
    {
      text: `Loaded local image ${resolved.display}.`,
      type: "text",
    },
    {
      source: {
        data: bytes.toString("base64"),
        media_type: mediaType,
        type: "base64",
      },
      type: "image",
    },
  ];

  return {
    content: JSON.stringify(
      {
        detail: detailRaw === "original" ? "original" : null,
        mediaType,
        note: "Local image loaded for inspection. Prefer this tool over Browser for workspace image files.",
        path: resolved.full,
        relPath: resolved.display,
        sizeBytes: bytes.length,
      },
      null,
      2
    ),
    isError: false,
    name: call.name,
    structuredContent,
    toolCallId: call.id,
  };
}

function executeReadFile(
  call: ToolCall,
  execCtx: ToolExecutionContext
): ToolResult {
  const rawPath = readToolFileArg(call);
  if (!rawPath)
    return {
      content: "Error: file_path is required",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };

  let display: string;
  let full: string;
  try {
    const resolved = resolveReadablePath(rawPath, execCtx, "file");
    ({ display, full } = resolved);
  } catch (e) {
    return {
      content: `Error: ${e instanceof Error ? e.message : String(e)}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  if (!fs.existsSync(full)) {
    return {
      content: `File not found: ${display}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  if (!fs.statSync(full).isFile()) {
    return {
      content: `Not a file: ${display}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const st = fs.statSync(full);
  if (st.size > MAX_READ_FILE_BYTES) {
    return {
      content: `File too large (${st.size} bytes). Use Read with offset and limit to read a portion, or use Grep.`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const buf = fs.readFileSync(full);
  if (!isProbablyTextBuffer(buf)) {
    return {
      content: `Skipped binary file: ${display}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const text = readTextFileSyncWithMetadata(full).text.replace(/\r\n/g, "\n");
  const lines = text.split("\n");

  let offset = Math.max(1, Number(call.arguments.offset) || 1);
  let limit: number | undefined;
  if (
    call.arguments.limit !== undefined &&
    call.arguments.limit !== null &&
    String(call.arguments.limit) !== ""
  ) {
    const l = Number(call.arguments.limit);
    if (Number.isFinite(l) && l > 0)
      limit = Math.min(Math.floor(l), MAX_READ_LINES_PER_CALL);
  }
  const sl = call.arguments.start_line;
  const el = call.arguments.end_line;
  if (
    (call.arguments.offset === undefined ||
      call.arguments.offset === null ||
      !Number.isFinite(Number(call.arguments.offset))) &&
    Number(sl) > 0
  ) {
    offset = Math.max(1, Math.floor(Number(sl)));
    if (Number(el) > 0) {
      const endL = Math.floor(Number(el));
      limit = Math.min(Math.max(1, endL - offset + 1), MAX_READ_LINES_PER_CALL);
    }
  }

  if (offset > lines.length) {
    return {
      content: `offset ${offset} is past end of file (${lines.length} lines).`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const effectiveLimit =
    limit ?? Math.min(MAX_READ_LINES_PER_CALL, lines.length - offset + 1);
  const slice = lines.slice(offset - 1, offset - 1 + effectiveLimit);
  const numbered = slice
    .map((l, i) => `${String(offset + i).padStart(6)}|${l}`)
    .join("\n");

  const totalLines = lines.length;
  const footer =
    offset + slice.length - 1 < totalLines
      ? `\n\n(${totalLines} lines total; use offset=${offset + slice.length} to read more.)`
      : "";
  const header =
    effectiveLimit >= MAX_READ_LINES_PER_CALL &&
    offset === 1 &&
    totalLines > MAX_READ_LINES_PER_CALL
      ? `(First ${MAX_READ_LINES_PER_CALL} of ${totalLines} lines; use offset and limit to paginate.)\n\n`
      : "";

  return {
    content: header + numbered + footer,
    isError: false,
    name: call.name,
    toolCallId: call.id,
  };
}

function executeWriteToFile(
  call: ToolCall,
  hooks: ToolExecutionHooks,
  execCtx: ToolExecutionContext
): ToolResult {
  const rawPath = readToolFileArg(call);
  const content = String(call.arguments.content ?? "");
  if (!rawPath)
    return {
      content: "Error: file_path is required",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };

  let relPath: string;
  let full: string;
  try {
    ({ rel: relPath, full } = resolveAgentFilePath(rawPath, execCtx));
  } catch (e) {
    return {
      content: `Error: ${e instanceof Error ? e.message : String(e)}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const existed = fs.existsSync(full);
  if (existed && !fs.statSync(full).isFile()) {
    return {
      content: `Not a file: ${relPath}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  let previousContent: string | null = null;
  let encoding: TextEncoding = "utf8";
  if (existed) {
    try {
      const meta = readTextFileSyncWithMetadata(full);
      previousContent = meta.text;
      encoding = meta.encoding;
    } catch (e) {
      return {
        content: `Error: cannot safely overwrite ${relPath}: ${e instanceof Error ? e.message : String(e)}`,
        isError: true,
        name: call.name,
        toolCallId: call.id,
      };
    }
  }
  void hooks.beforeWrite?.({ path: relPath, previousContent });
  writeTextFileAtomicSync(full, content, encoding);
  void hooks.afterWrite?.({
    nextContent: content,
    path: relPath,
    previousContent,
  });

  const lineCount = content.split("\n").length;
  return {
    content: `${existed ? "Updated" : "Created"} ${relPath} (${lineCount} lines)`,
    isError: false,
    name: call.name,
    toolCallId: call.id,
  };
}

function executeStrReplace(
  call: ToolCall,
  hooks: ToolExecutionHooks,
  execCtx: ToolExecutionContext
): ToolResult {
  const rawPath = readToolFileArg(call);
  const rawOldStr = String(
    call.arguments.old_string ?? call.arguments.old_str ?? ""
  );
  const rawNewStr = String(
    call.arguments.new_string ?? call.arguments.new_str ?? ""
  );
  const replaceAll =
    call.arguments.replace_all === true ||
    call.arguments.replace_all === "true" ||
    call.arguments.replace_all === 1;
  if (!rawPath)
    return {
      content: "Error: file_path is required",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  if (!rawOldStr) {
    return {
      content: "Error: old_string is required and must not be empty",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  if (rawOldStr === rawNewStr && !replaceAll) {
    return {
      content:
        "Error: old_string and new_string are identical; nothing to change.",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  let relPath: string;
  let full: string;
  try {
    ({ rel: relPath, full } = resolveAgentFilePath(rawPath, execCtx));
  } catch (e) {
    return {
      content: `Error: ${e instanceof Error ? e.message : String(e)}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  if (!fs.existsSync(full)) {
    return {
      content: `File not found: ${relPath}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const buf = fs.readFileSync(full);
  if (!isProbablyTextBuffer(buf)) {
    return {
      content: `Skipped binary file: ${relPath}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const meta = readTextFileSyncWithMetadata(full);
  const source = meta.text;
  const fileHasCRLF = source.includes("\r\n");

  const oldStr = fileHasCRLF
    ? rawOldStr.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n")
    : rawOldStr.replace(/\r\n/g, "\n");
  const newStr = fileHasCRLF
    ? rawNewStr.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n")
    : rawNewStr.replace(/\r\n/g, "\n");

  if (replaceAll) {
    let patchedAll = source;
    let pos = 0;
    let count = 0;
    let firstLineNo = 1;
    while (true) {
      const found = patchedAll.indexOf(oldStr, pos);
      if (found === -1) break;
      if (count === 0)
        firstLineNo = patchedAll.slice(0, found).split("\n").length;
      patchedAll =
        patchedAll.slice(0, found) +
        newStr +
        patchedAll.slice(found + oldStr.length);
      pos = found + newStr.length;
      count++;
    }
    if (count === 0) {
      const preview =
        rawOldStr.length > 200 ? rawOldStr.slice(0, 200) + "..." : rawOldStr;
      const hint = fileHasCRLF ? " (note: file uses CRLF line endings)" : "";
      return {
        content: `old_string not found in ${relPath}${hint}. Make sure the string matches exactly including whitespace and indentation.\nSearched for: ${preview}`,
        isError: true,
        name: call.name,
        toolCallId: call.id,
      };
    }
    void hooks.beforeWrite?.({ path: relPath, previousContent: source });
    writeTextFileAtomicSync(full, patchedAll, meta.encoding);
    void hooks.afterWrite?.({
      nextContent: patchedAll,
      path: relPath,
      previousContent: source,
    });
    return {
      content: `Applied ${count} replacement(s) in ${relPath} (first at line ${firstLineNo})`,
      isError: false,
      name: call.name,
      toolCallId: call.id,
    };
  }

  let idx = source.indexOf(oldStr);
  let matchLen = oldStr.length;

  // Fallback 1: strip trailing whitespace per line
  if (idx === -1) {
    const stripped = stripTrailingSpacesPerLine(oldStr);
    const sourceStripped = stripTrailingSpacesPerLine(source);
    const fallbackIdx = sourceStripped.indexOf(stripped);
    if (fallbackIdx !== -1) {
      const secondFb = sourceStripped.indexOf(stripped, fallbackIdx + 1);
      if (secondFb === -1) {
        const origSlice = source.slice(
          fallbackIdx,
          fallbackIdx + stripped.length
        );
        const charDelta = source.length - sourceStripped.length;
        const adjustedIdx =
          charDelta === 0 ? fallbackIdx : source.indexOf(origSlice);
        if (adjustedIdx !== -1) idx = adjustedIdx;
      }
    }
  }

  // Fallback 2: LF-normalized search — handles CRLF/LF/mixed-ending mismatches
  if (idx === -1) {
    const srcLF = source.replace(/\r\n/g, "\n");
    const oldLF = rawOldStr.replace(/\r\n/g, "\n");
    const lfIdx = srcLF.indexOf(oldLF);
    if (lfIdx !== -1 && srcLF.indexOf(oldLF, lfIdx + 1) === -1) {
      idx = lfPosToOriginal(source, lfIdx);
      matchLen = lfPosToOriginal(source, lfIdx + oldLF.length) - idx;
    }
  }

  if (idx === -1) {
    const preview =
      rawOldStr.length > 200 ? rawOldStr.slice(0, 200) + "..." : rawOldStr;
    const hint = fileHasCRLF ? " (note: file uses CRLF line endings)" : "";
    return {
      content: `old_string not found in ${relPath}${hint}. Make sure the string matches exactly including whitespace and indentation.\nSearched for: ${preview}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const verifySecond = source.indexOf(oldStr, idx + 1);
  if (verifySecond !== -1) {
    return {
      content: `old_string appears multiple times in ${relPath}. Set replace_all to true to replace every occurrence, or include more surrounding context to make a single match unique.`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const lineNumber = source.slice(0, idx).split("\n").length;
  const patched = source.slice(0, idx) + newStr + source.slice(idx + matchLen);
  void hooks.beforeWrite?.({ path: relPath, previousContent: source });
  writeTextFileAtomicSync(full, patched, meta.encoding);
  void hooks.afterWrite?.({
    nextContent: patched,
    path: relPath,
    previousContent: source,
  });

  return {
    content: `Applied edit to ${relPath} at line ${lineNumber}`,
    isError: false,
    name: call.name,
    toolCallId: call.id,
  };
}

function stripTrailingSpacesPerLine(s: string): string {
  return s.replace(/[ \t]+(\r?\n)/g, "$1").replace(/[ \t]+$/, "");
}

/** Map a position in the LF-normalized string back to the original (potentially CRLF) string. */
function lfPosToOriginal(original: string, lfPos: number): number {
  let origIdx = 0;
  let lfIdx = 0;
  while (lfIdx < lfPos && origIdx < original.length) {
    if (original[origIdx] === "\r" && original[origIdx + 1] === "\n") {
      origIdx += 2;
    } else {
      origIdx += 1;
    }
    lfIdx += 1;
  }
  return origIdx;
}

function collectGlobFileDisplayPaths(
  scanRoot: string,
  matchRoot: string,
  displayRoot: string,
  isWorkspace: boolean,
  out: Array<{ matchPath: string; displayPath: string }>
): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(scanRoot, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(scanRoot, e.name);
    if (e.isDirectory()) {
      if (GLOB_IGNORE_DIR_NAMES.has(e.name)) continue;
      collectGlobFileDisplayPaths(
        full,
        matchRoot,
        displayRoot,
        isWorkspace,
        out
      );
    } else {
      out.push({
        displayPath: isWorkspace
          ? path.relative(displayRoot, full).replace(/\\/g, "/")
          : normalizeToolPath(full),
        matchPath: path.relative(matchRoot, full).replace(/\\/g, "/"),
      });
    }
  }
}

function executeGlob(
  call: ToolCall,
  execCtx: ToolExecutionContext
): ToolResult {
  const pattern = String(call.arguments.pattern ?? "").trim();
  if (!pattern) {
    return {
      content: "Error: pattern is required",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const sub = String(call.arguments.path ?? "").trim();
  let resolvedRoot: ResolvedReadablePath;
  try {
    if (sub) {
      resolvedRoot = resolveReadablePath(sub, execCtx, "directory");
    } else if (execCtx.workspaceRoot) {
      const root = path.resolve(execCtx.workspaceRoot);
      resolvedRoot = makeReadablePath(root, root, true);
    } else {
      const extraRoot = getExtraReadableRoots(execCtx)[0];
      if (!extraRoot)
        throw new Error(
          "No workspace folder open and no skill/plugin readable roots registered."
        );
      resolvedRoot = makeReadablePath(extraRoot, extraRoot, false);
    }
  } catch (e) {
    return {
      content: `Error: ${e instanceof Error ? e.message : String(e)}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const scanRoot = resolvedRoot.full;
  if (!fs.existsSync(scanRoot) || !fs.statSync(scanRoot).isDirectory()) {
    return {
      content: `Not a directory: ${sub || "."}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const allFiles: Array<{ matchPath: string; displayPath: string }> = [];
  collectGlobFileDisplayPaths(
    scanRoot,
    resolvedRoot.isWorkspace ? resolvedRoot.root : scanRoot,
    resolvedRoot.isWorkspace ? resolvedRoot.root : scanRoot,
    resolvedRoot.isWorkspace,
    allFiles
  );
  const mmOpts = { dot: true, nocase: process.platform === "win32" } as const;
  const matched = allFiles
    .filter((item) => minimatch(item.matchPath, pattern, mmOpts))
    .map((item) => item.displayPath)
    .filter((displayPath, index, arr) => arr.indexOf(displayPath) === index)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  const truncated = matched.length > GLOB_MAX_RESULTS;
  const shown = truncated ? matched.slice(0, GLOB_MAX_RESULTS) : matched;
  if (shown.length === 0) {
    return {
      content: "No files found",
      isError: false,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const header = truncated
    ? `Found at least ${matched.length} files (showing first ${GLOB_MAX_RESULTS})\n`
    : `Found ${shown.length} file${shown.length === 1 ? "" : "s"}\n`;
  return {
    content: header + shown.join("\n"),
    isError: false,
    name: call.name,
    toolCallId: call.id,
  };
}

function executeListDir(
  call: ToolCall,
  execCtx: ToolExecutionContext
): ToolResult {
  const relPath = String(call.arguments.path ?? "").trim();
  let resolved: ResolvedReadablePath;
  try {
    if (relPath) {
      resolved = resolveReadablePath(relPath, execCtx, "directory");
    } else if (execCtx.workspaceRoot) {
      const root = path.resolve(execCtx.workspaceRoot);
      resolved = makeReadablePath(root, root, true);
    } else {
      const extraRoot = getExtraReadableRoots(execCtx)[0];
      if (!extraRoot)
        throw new Error(
          "No workspace folder open and no skill/plugin readable roots registered."
        );
      resolved = makeReadablePath(extraRoot, extraRoot, false);
    }
  } catch (e) {
    return {
      content: `Error: ${e instanceof Error ? e.message : String(e)}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const full = resolved.full;

  if (!fs.existsSync(full) || !fs.statSync(full).isDirectory()) {
    return {
      content: `Not a directory: ${relPath || resolved.display}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const entries = fs.readdirSync(full, { withFileTypes: true });
  const sorted = entries
    .filter((e) => e.name !== "." && e.name !== "..")
    .sort((a, b) => {
      if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });

  const lines = sorted.map((e) =>
    e.isDirectory() ? `[dir]  ${e.name}/` : `[file] ${e.name}`
  );
  return {
    content: lines.join("\n") || "(empty directory)",
    isError: false,
    name: call.name,
    toolCallId: call.id,
  };
}

function grepFormatLimitInfo(
  appliedLimit: number | undefined,
  appliedOffset: number | undefined
): string {
  const parts: string[] = [];
  if (appliedLimit !== undefined) parts.push(`limit: ${appliedLimit}`);
  if (appliedOffset) parts.push(`offset: ${appliedOffset}`);
  return parts.join(", ");
}

function applyGrepHeadLimit<T>(
  items: T[],
  headLimit: number | undefined,
  offset: number
): { items: T[]; appliedLimit?: number; appliedOffset?: number } {
  const off = Math.max(0, Math.floor(Number(offset) || 0));
  if (headLimit === 0) {
    return {
      appliedOffset: off > 0 ? off : undefined,
      items: items.slice(off),
    };
  }
  const effective = headLimit ?? DEFAULT_GREP_HEAD_LIMIT;
  const sliced = items.slice(off, off + effective);
  const truncated = items.length - off > effective;
  return {
    appliedLimit: truncated ? effective : undefined,
    appliedOffset: off > 0 ? off : undefined,
    items: sliced,
  };
}

function expandUserGlobPatterns(globField: string): string[] {
  const rawPatterns = globField.trim().split(/\s+/);
  const out: string[] = [];
  for (const raw of rawPatterns) {
    if (!raw) continue;
    if (raw.includes("{") && raw.includes("}")) {
      out.push(raw);
    } else {
      out.push(
        ...raw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      );
    }
  }
  return out;
}

async function runRipgrep(
  rgArgs: string[],
  cwd: string,
  signal?: AbortSignal
): Promise<{ stdout: string; stderr: string; code: number }> {
  try {
    const r = await execFileAsync("rg", rgArgs, {
      cwd,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      signal,
      timeout: 30_000,
      windowsHide: true,
    });
    return {
      code: 0,
      stderr: (r.stderr as string) || "",
      stdout: (r.stdout as string) || "",
    };
  } catch (e: unknown) {
    if (e instanceof Error && e.name === "AbortError") {
      throw e;
    }
    const err = e as { stdout?: string; stderr?: string; code?: number };
    const code = typeof err.code === "number" ? err.code : -1;
    return {
      code,
      stderr: err.stderr || "",
      stdout: err.stdout || "",
    };
  }
}

function sortGrepFilePathsByMtime(
  relPaths: string[],
  baseDir: string
): string[] {
  const withT = relPaths.map((f) => {
    const full = path.join(baseDir, f);
    try {
      const st = fs.statSync(full);
      return { f, t: st.mtimeMs };
    } catch {
      return { f, t: 0 };
    }
  });
  withT.sort(
    (a, b) =>
      b.t - a.t || a.f.localeCompare(b.f, undefined, { sensitivity: "base" })
  );
  return withT.map((x) => x.f);
}

function formatRipgrepPath(
  filePath: string,
  searchDirAbs: string,
  useAbsolute: boolean
): string {
  const normalized = filePath.replace(/\\/g, "/");
  if (!useAbsolute) {
    return normalized;
  }
  const full = path.isAbsolute(filePath)
    ? filePath
    : path.join(searchDirAbs, filePath);
  return normalizeToolPath(full);
}

function formatRipgrepContentLine(
  line: string,
  searchDirAbs: string,
  useAbsolute: boolean
): string {
  if (!useAbsolute) {
    return line.replace(/\\/g, "/");
  }
  const i = line.indexOf(":");
  if (i <= 0) {
    return line;
  }
  return (
    formatRipgrepPath(line.slice(0, i), searchDirAbs, true) + line.slice(i)
  );
}

function formatRipgrepCountLine(
  line: string,
  searchDirAbs: string,
  useAbsolute: boolean
): string {
  const i = line.lastIndexOf(":");
  if (i <= 0) {
    return useAbsolute
      ? formatRipgrepPath(line, searchDirAbs, true)
      : line.replace(/\\/g, "/");
  }
  return (
    formatRipgrepPath(line.slice(0, i), searchDirAbs, useAbsolute) +
    line.slice(i)
  );
}

async function executeGrepTool(
  call: ToolCall,
  execCtx: ToolExecutionContext
): Promise<ToolResult> {
  throwIfToolAbortRequested(execCtx.signal, call.name, "grep:start");
  const root = execCtx.workspaceRoot
    ? path.resolve(execCtx.workspaceRoot)
    : null;
  const pattern = String(call.arguments.pattern ?? "");
  if (!pattern)
    return {
      content: "Error: pattern is required",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };

  const symbolMode =
    call.arguments.symbol === true ||
    call.arguments.search_symbols === true ||
    call.arguments.mode === "symbol";
  if (symbolMode) {
    if (!root) {
      return {
        content: "Error: symbol search requires an open workspace.",
        isError: true,
        name: call.name,
        toolCallId: call.id,
      };
    }
    const rootNorm = path.resolve(root);
    await ensureSymbolIndexLoaded(rootNorm);
    const hits = searchWorkspaceSymbols(
      pattern,
      MAX_SYMBOL_SEARCH_RESULTS,
      rootNorm
    );
    return {
      content: formatSymbolSearchResults(hits),
      isError: false,
      name: call.name,
      toolCallId: call.id,
    };
  }

  let searchDirAbs: string;
  let searchRoot: ResolvedReadablePath;
  try {
    const subPath = String(call.arguments.path ?? "").trim();
    if (subPath) {
      searchRoot = resolveReadablePath(subPath, execCtx, "directory");
    } else if (root) {
      searchRoot = makeReadablePath(root, root, true);
    } else {
      const extraRoot = getExtraReadableRoots(execCtx)[0];
      if (!extraRoot)
        throw new Error(
          "No workspace folder open and no skill/plugin readable roots registered."
        );
      searchRoot = makeReadablePath(extraRoot, extraRoot, false);
    }
    searchDirAbs = searchRoot.full;
  } catch (e) {
    return {
      content: `Error: ${e instanceof Error ? e.message : String(e)}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const outputModeRaw = call.arguments.output_mode;
  const output_mode =
    outputModeRaw === "content" ||
    outputModeRaw === "files_with_matches" ||
    outputModeRaw === "count"
      ? outputModeRaw
      : "files_with_matches";

  const multiline = call.arguments.multiline === true;
  const caseInsensitive = call.arguments["-i"] === true;
  const ctxNum = (k: string) => {
    const v = call.arguments[k];
    if (typeof v === "number" && Number.isFinite(v))
      return Math.max(0, Math.floor(v));
  };
  const contextBefore = ctxNum("-B");
  const contextAfter = ctxNum("-A");
  const contextC = ctxNum("-C");
  const contextUnified = ctxNum("context");
  const showLineNumbers = call.arguments["-n"] !== false;
  const typeFilter =
    typeof call.arguments.type === "string" && call.arguments.type.trim()
      ? call.arguments.type.trim()
      : "";
  const globField =
    typeof call.arguments.glob === "string" ? call.arguments.glob : "";
  const globPatterns = globField ? expandUserGlobPatterns(globField) : [];

  let headLimit: number | undefined;
  if (call.arguments.head_limit === 0) headLimit = 0;
  else if (
    typeof call.arguments.head_limit === "number" &&
    Number.isFinite(call.arguments.head_limit)
  ) {
    headLimit = Math.max(0, Math.floor(call.arguments.head_limit));
  } else headLimit = undefined;

  let offset = 0;
  if (
    typeof call.arguments.offset === "number" &&
    Number.isFinite(call.arguments.offset)
  ) {
    offset = Math.max(0, Math.floor(call.arguments.offset));
  }

  const rgArgs: string[] = ["--hidden"];
  for (const d of VCS_GREP_EXCLUDES) {
    rgArgs.push("--glob", `!${d}`);
  }
  rgArgs.push("--max-columns", "500", "--color=never");
  if (multiline) rgArgs.push("-U", "--multiline-dotall");
  if (caseInsensitive) rgArgs.push("-i");

  if (output_mode === "files_with_matches") rgArgs.push("-l");
  else if (output_mode === "count") rgArgs.push("-c");

  if (output_mode === "content") {
    if (showLineNumbers) rgArgs.push("-n");
    else rgArgs.push("--no-line-number");
    rgArgs.push("--no-heading");
    const ctxU = contextUnified;
    if (ctxU !== undefined) rgArgs.push("-C", String(ctxU));
    else if (contextC === undefined) {
      if (contextBefore !== undefined) rgArgs.push("-B", String(contextBefore));
      if (contextAfter !== undefined) rgArgs.push("-A", String(contextAfter));
    } else rgArgs.push("-C", String(contextC));
  }

  if (pattern.startsWith("-")) rgArgs.push("-e", pattern);
  else rgArgs.push(pattern);

  if (typeFilter) rgArgs.push("--type", typeFilter);
  for (const g of globPatterns) {
    rgArgs.push("--glob", g);
  }
  rgArgs.push(".");

  const { stdout, stderr, code } = await runRipgrep(
    rgArgs,
    searchDirAbs,
    execCtx.signal
  );
  if (code === 2 || (code !== 0 && code !== 1)) {
    return {
      content: `Search failed: ${stderr || `exit ${code}`}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const rawLines = stdout.split("\n").filter(Boolean);
  const useAbsolutePaths = !searchRoot.isWorkspace;

  if (output_mode === "count" && rawLines.length === 0) {
    return {
      content: "No matches found.",
      isError: false,
      name: call.name,
      toolCallId: call.id,
    };
  }

  if (output_mode === "content") {
    const formattedLines = rawLines.map((line) =>
      formatRipgrepContentLine(line, searchDirAbs, useAbsolutePaths)
    );
    const { items, appliedLimit, appliedOffset } = applyGrepHeadLimit(
      formattedLines,
      headLimit,
      offset
    );
    const body = items.join("\n") || "No matches found";
    const lim = grepFormatLimitInfo(appliedLimit, appliedOffset);
    const content = lim
      ? `${body}\n\n[Showing results with pagination = ${lim}]`
      : body;
    return { content, isError: false, name: call.name, toolCallId: call.id };
  }

  if (output_mode === "count") {
    const normalized = rawLines.map((line) =>
      formatRipgrepCountLine(line, searchDirAbs, useAbsolutePaths)
    );
    const { items, appliedLimit, appliedOffset } = applyGrepHeadLimit(
      normalized,
      headLimit,
      offset
    );
    let totalMatches = 0;
    let fileCount = 0;
    for (const line of items) {
      const i = line.lastIndexOf(":");
      if (i <= 0) continue;
      const n = Number.parseInt(line.slice(i + 1), 10);
      if (!Number.isNaN(n)) {
        totalMatches += n;
        fileCount += 1;
      }
    }
    const rawContent = items.join("\n") || "No matches found";
    const lim = grepFormatLimitInfo(appliedLimit, appliedOffset);
    const occ = totalMatches === 1 ? "occurrence" : "occurrences";
    const fs_ = fileCount === 1 ? "file" : "files";
    const summary = `\n\nFound ${totalMatches} total ${occ} across ${fileCount} ${fs_}.${lim ? ` with pagination = ${lim}` : ""}`;
    return {
      content: rawContent + summary,
      isError: false,
      name: call.name,
      toolCallId: call.id,
    };
  }

  let files = rawLines.map((f) => f.replace(/\\/g, "/"));
  files = sortGrepFilePathsByMtime(files, searchDirAbs);
  files = files.map((f) =>
    formatRipgrepPath(f, searchDirAbs, useAbsolutePaths)
  );
  const { items, appliedLimit, appliedOffset } = applyGrepHeadLimit(
    files,
    headLimit,
    offset
  );
  const lim = grepFormatLimitInfo(appliedLimit, appliedOffset);
  if (items.length === 0) {
    return {
      content: "No files found",
      isError: false,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const fw = items.length === 1 ? "file" : "files";
  const prefix = `Found ${items.length} ${fw}${lim ? ` ${lim}` : ""}`;
  return {
    content: `${prefix}\n${items.join("\n")}`,
    isError: false,
    name: call.name,
    toolCallId: call.id,
  };
}

type BashGitDirtyState = {
  topLevel: string;
  orderedEntries: Array<{ repoRel: string; wsRel: string }>;
  dirtyContentByWsPath: Map<string, string | null>;
};

function decodeGitPorcelainPath(raw: string): string {
  let value = raw.trim();
  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  return value.replace(/\\/g, "/").replace(/^\.\/+/, "");
}

function parseGitPorcelainEntriesForWorkspace(
  raw: string,
  workspaceRoot: string,
  gitTopLevel: string
): Array<{ repoRel: string; wsRel: string }> {
  const line = raw.trimEnd();
  if (line.length < 4 || line[2] !== " ") {
    return [];
  }
  const rest = line.slice(3).trimEnd();
  const repoPaths = rest.includes(" -> ")
    ? (() => {
        const idx = rest.lastIndexOf(" -> ");
        return [
          decodeGitPorcelainPath(rest.slice(0, idx)),
          decodeGitPorcelainPath(rest.slice(idx + 4)),
        ];
      })()
    : [decodeGitPorcelainPath(rest)];
  const out: Array<{ repoRel: string; wsRel: string }> = [];
  for (const repoRel of repoPaths) {
    if (!repoRel) {
      continue;
    }
    const wsRel = gitService.workspaceRelativeFromRepoRelative(
      repoRel,
      workspaceRoot,
      gitTopLevel
    );
    if (wsRel) {
      out.push({ repoRel, wsRel });
    }
  }
  return out;
}

function readUtf8TextFileIfExists(fullPath: string): string | null {
  return readTextFileIfExistsSync(fullPath);
}

async function captureBashGitDirtyState(
  workspaceRoot: string
): Promise<BashGitDirtyState | null> {
  try {
    const { stdout: gitRootStdout } = await execFileAsync(
      "git",
      ["-c", "core.quotepath=false", "rev-parse", "--show-toplevel"],
      {
        cwd: workspaceRoot,
        encoding: "utf8",
        maxBuffer: 1024 * 1024,
        windowsHide: true,
      }
    );
    const topLevel = path.resolve(String(gitRootStdout ?? "").trim());
    if (!topLevel) {
      return null;
    }
    const { stdout } = await execFileAsync(
      "git",
      ["-c", "core.quotepath=false", "status", "--porcelain=v1"],
      {
        cwd: workspaceRoot,
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024,
        windowsHide: true,
      }
    );
    const orderedEntries: Array<{ repoRel: string; wsRel: string }> = [];
    const seen = new Set<string>();
    for (const line of String(stdout ?? "").split(/\r?\n/)) {
      for (const entry of parseGitPorcelainEntriesForWorkspace(
        line,
        workspaceRoot,
        topLevel
      )) {
        if (seen.has(entry.wsRel)) {
          continue;
        }
        seen.add(entry.wsRel);
        orderedEntries.push(entry);
      }
    }
    const dirtyContentByWsPath = new Map<string, string | null>();
    for (const entry of orderedEntries) {
      const fullPath = resolveWorkspacePath(entry.wsRel, workspaceRoot);
      dirtyContentByWsPath.set(entry.wsRel, readUtf8TextFileIfExists(fullPath));
    }
    return { dirtyContentByWsPath, orderedEntries, topLevel };
  } catch {
    return null;
  }
}

async function readGitHeadTextOrNull(
  gitTopLevel: string,
  repoRel: string
): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["-c", "core.quotepath=false", "show", `HEAD:${repoRel}`],
      {
        cwd: gitTopLevel,
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024,
        windowsHide: true,
      }
    );
    const content = String(stdout ?? "");
    return content.includes("\u0000") ? null : content;
  } catch {
    return null;
  }
}

async function recordBashWorkspaceSnapshots(
  workspaceRoot: string,
  hooks: ToolExecutionHooks,
  beforeState: BashGitDirtyState | null
): Promise<void> {
  if (!hooks.beforeWrite && !hooks.afterWrite) {
    return;
  }
  const afterState = await captureBashGitDirtyState(workspaceRoot);
  const gitTopLevel = afterState?.topLevel ?? beforeState?.topLevel;
  if (!gitTopLevel) {
    return;
  }
  const orderedEntries: Array<{ repoRel: string; wsRel: string }> = [];
  const seen = new Set<string>();
  const pushUnique = (entry: { repoRel: string; wsRel: string }) => {
    if (seen.has(entry.wsRel)) {
      return;
    }
    seen.add(entry.wsRel);
    orderedEntries.push(entry);
  };
  for (const entry of afterState?.orderedEntries ?? []) {
    pushUnique(entry);
  }
  for (const entry of beforeState?.orderedEntries ?? []) {
    pushUnique(entry);
  }
  for (const entry of orderedEntries) {
    const previousContent = beforeState?.dirtyContentByWsPath.has(entry.wsRel)
      ? (beforeState.dirtyContentByWsPath.get(entry.wsRel) ?? null)
      : await readGitHeadTextOrNull(gitTopLevel, entry.repoRel);
    const fullPath = resolveWorkspacePath(entry.wsRel, workspaceRoot);
    const nextContent = readUtf8TextFileIfExists(fullPath);
    if ((previousContent ?? null) === (nextContent ?? null)) {
      continue;
    }
    await hooks.beforeWrite?.({ path: entry.wsRel, previousContent });
    if (nextContent !== null) {
      await hooks.afterWrite?.({
        nextContent,
        path: entry.wsRel,
        previousContent,
      });
    } else if (previousContent !== null) {
      await hooks.afterWrite?.({
        nextContent: "",
        path: entry.wsRel,
        previousContent,
      });
    }
  }
}

function maskShellQuotedText(command: string): string {
  let out = "";
  let quote: '"' | "'" | null = null;
  let escaped = false;
  for (const ch of command) {
    if (escaped) {
      out += " ";
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      out += quote ? " " : ch;
      escaped = quote !== "'";
      continue;
    }
    if (quote) {
      if (ch === quote) {
        quote = null;
        out += ch;
      } else {
        out += " ";
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      out += ch;
      continue;
    }
    out += ch;
  }
  return out;
}

function validateBashCommandDoesNotDirectlyWriteFiles(
  command: string
): string | null {
  const inspected = maskShellQuotedText(command);
  const allowedRedirectTarget = String.raw`(?:&?\d\b|/dev/null\b|/dev/fd/\d+\b|nul\b)`;
  const fileRedirect = new RegExp(
    String.raw`(?:^|[^&])(?:\d*>>?|\d*>\||&>)\s*(?!${allowedRedirectTarget})`,
    "i"
  );
  if (fileRedirect.test(inspected)) {
    return "Bash is not allowed to write files with shell redirection. Use Write/Edit for source files, or let the command output be captured by the tool.";
  }
  if (
    /(?:^|[;&|()]\s*)tee(?:\s+-[a-zA-Z]+)*\s+(?!\/dev\/null\b|nul\b|-($|\s))/i.test(
      inspected
    )
  ) {
    return "Bash is not allowed to write files with tee. Use Write/Edit for source files.";
  }
  if (/(?:^|[;&|()]\s*)sed\b[^;&|]*\s-i(?:\s|$)/i.test(inspected)) {
    return "Bash is not allowed to edit files with sed -i. Use Edit instead.";
  }
  if (/(?:^|[;&|()]\s*)perl\b[^;&|]*\s-pi(?:\s|$)/i.test(inspected)) {
    return "Bash is not allowed to edit files with perl -pi. Use Edit instead.";
  }
  if (/\b(?:Set-Content|Add-Content|Out-File|Export-Csv)\b/i.test(inspected)) {
    return "Bash is not allowed to call PowerShell file-writing cmdlets. Use Write/Edit so the app controls encoding.";
  }
  if (/(?:^|[;&|()]\s*)(?:rm|rmdir|mv|cp|touch|mkdir)\b/i.test(inspected)) {
    return "Bash is not allowed to directly create, remove, copy, or move files. Use workspace tools for file changes.";
  }
  return null;
}

async function executeCommand(
  call: ToolCall,
  hooks: ToolExecutionHooks,
  execCtx: ToolExecutionContext
): Promise<ToolResult> {
  throwIfToolAbortRequested(execCtx.signal, call.name, "command:start");
  const root = requireWorkspace(execCtx);
  const command = String(call.arguments.command ?? "").trim();
  if (!command)
    return {
      content: "Error: command is required",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  const blockedReason = validateBashCommandDoesNotDirectlyWriteFiles(command);
  if (blockedReason) {
    return {
      content: `Blocked unsafe Bash command: ${blockedReason}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const timeoutMsRaw = Number(call.arguments.timeout_ms);
  const timeoutMs =
    Number.isFinite(timeoutMsRaw) && timeoutMsRaw > 0
      ? Math.max(1000, Math.min(Math.floor(timeoutMsRaw), 600_000))
      : 120_000;
  const beforeGitState = await captureBashGitDirtyState(root);

  try {
    const res = await executeShellCommand(command, {
      cwd: root,
      signal: execCtx.signal,
      timeoutMs,
    });
    await recordBashWorkspaceSnapshots(root, hooks, beforeGitState);
    let output = res.output;
    if (!output.trim()) output = "(command completed with no output)";
    const header = res.truncated ? "[output truncated]\n" : "";
    return {
      content: header + output,
      isError: res.timedOut || (res.exitCode !== 0 && res.exitCode !== null),
      name: call.name,
      toolCallId: call.id,
    };
  } catch (e: unknown) {
    if (e instanceof Error && e.name === "AbortError") {
      throw e;
    }
    await recordBashWorkspaceSnapshots(root, hooks, beforeGitState);
    const output = e instanceof Error ? e.message : String(e);
    return {
      content: output,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
}

function parseTerminalRunInBackground(args: Record<string, unknown>): boolean {
  return args.run_in_background === true || args.run_in_background === "true";
}

function parseTerminalTimeoutMs(
  args: Record<string, unknown>
): number | undefined {
  const raw = Number(args.timeout_ms);
  if (!Number.isFinite(raw) || raw <= 0) {
    return;
  }
  return Math.max(500, Math.min(Math.floor(raw), 600_000));
}

function formatBackgroundTerminalSessionResult(opts: {
  sessionId: string;
  command: string;
  profileName?: string;
}): string {
  const lines = [
    `session_id=${opts.sessionId} background=true`,
    "---",
    opts.profileName
      ? `Started background terminal command via profile "${opts.profileName}".`
      : "Started background terminal command.",
    `Command: ${opts.command}`,
    "Use Terminal read with this session_id to inspect output, and close when finished.",
  ];
  return lines.join("\n");
}

function resolveTerminalCwd(
  raw: unknown,
  execCtx: ToolExecutionContext
): string | undefined {
  if (typeof raw !== "string" || !raw.trim()) {
    return execCtx.workspaceRoot ?? undefined;
  }
  const trimmed = raw.trim();
  if (path.isAbsolute(trimmed)) {
    if (
      execCtx.workspaceRoot &&
      !isPathInsideRoot(trimmed, execCtx.workspaceRoot)
    ) {
      throw new Error("cwd escapes workspace boundary.");
    }
    if (!fs.existsSync(trimmed)) {
      throw new Error(`cwd does not exist: ${trimmed}`);
    }
    return trimmed;
  }
  if (!execCtx.workspaceRoot) {
    throw new Error("cwd is relative but no workspace is open.");
  }
  const full = resolveWorkspacePath(trimmed, execCtx.workspaceRoot);
  if (!isPathInsideRoot(full, execCtx.workspaceRoot)) {
    throw new Error("cwd escapes workspace boundary.");
  }
  if (!fs.existsSync(full)) {
    throw new Error(`cwd does not exist: ${full}`);
  }
  return full;
}

async function executeTerminalTool(
  call: ToolCall,
  execCtx: ToolExecutionContext
): Promise<ToolResult> {
  throwIfToolAbortRequested(execCtx.signal, call.name, "terminal:start");
  const args = call.arguments;
  const action = String(args.action ?? "").trim();
  if (!action) {
    return {
      content: "Error: action is required",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const svc = await import("../terminalSessionService.js");
  const runInBackground = parseTerminalRunInBackground(args);
  const timeoutMs = parseTerminalTimeoutMs(args);
  try {
    switch (action) {
      case "list_profiles": {
        const profileStore = await import("../terminalProfileStore.js");
        const profiles = profileStore.listTerminalToolProfiles();
        return {
          content: JSON.stringify(profiles, null, 2),
          isError: false,
          name: call.name,
          toolCallId: call.id,
        };
      }
      case "open": {
        const profileNeedle =
          typeof args.profile_id === "string" ? args.profile_id.trim() : "";
        let createOpts: Parameters<typeof svc.createTerminalSession>[0];
        let profileMeta: unknown = null;
        if (profileNeedle) {
          const profileStore = await import("../terminalProfileStore.js");
          const resolved =
            profileStore.resolveTerminalToolCreateOpts(profileNeedle);
          if (!resolved) {
            return {
              content: `Error: terminal profile not found: ${profileNeedle}`,
              isError: true,
              name: call.name,
              toolCallId: call.id,
            };
          }
          createOpts = {
            ...resolved.createOpts,
            cols:
              typeof args.cols === "number"
                ? args.cols
                : resolved.createOpts.cols,
            cwd: resolved.createOpts.cwd
              ? resolveTerminalCwd(resolved.createOpts.cwd, execCtx)
              : resolved.createOpts.cwd,
            rows:
              typeof args.rows === "number"
                ? args.rows
                : resolved.createOpts.rows,
            title:
              typeof args.title === "string" && args.title.trim()
                ? args.title
                : resolved.createOpts.title,
          };
          profileMeta = resolved.profile;
        } else {
          createOpts = {
            cols: typeof args.cols === "number" ? args.cols : undefined,
            cwd: resolveTerminalCwd(args.cwd, execCtx),
            rows: typeof args.rows === "number" ? args.rows : undefined,
            shell:
              typeof args.shell === "string" && args.shell.trim()
                ? args.shell.trim()
                : undefined,
            title: typeof args.title === "string" ? args.title : undefined,
          };
        }
        const info = svc.createTerminalSession(createOpts);
        return {
          content: JSON.stringify(
            profileMeta ? { profile: profileMeta, session: info } : info,
            null,
            2
          ),
          isError: false,
          name: call.name,
          toolCallId: call.id,
        };
      }
      case "write": {
        const id = String(args.session_id ?? "").trim();
        const data = typeof args.data === "string" ? args.data : "";
        if (!id) {
          return {
            content: "Error: session_id is required",
            isError: true,
            name: call.name,
            toolCallId: call.id,
          };
        }
        if (!data) {
          return {
            content: "Error: data is required (include \\r or \\n to submit)",
            isError: true,
            name: call.name,
            toolCallId: call.id,
          };
        }
        const ok = svc.writeTerminalSession(id, data);
        return {
          content: ok ? "ok" : "write failed (session missing or exited)",
          isError: !ok,
          name: call.name,
          toolCallId: call.id,
        };
      }
      case "read": {
        const id = String(args.session_id ?? "").trim();
        if (!id) {
          return {
            content: "Error: session_id is required",
            isError: true,
            name: call.name,
            toolCallId: call.id,
          };
        }
        const maxBytes =
          typeof args.max_bytes === "number" ? args.max_bytes : undefined;
        const slice = svc.getTerminalBuffer(id, maxBytes);
        if (!slice) {
          return {
            content: "Error: session not found",
            isError: true,
            name: call.name,
            toolCallId: call.id,
          };
        }
        const header = `# session ${slice.id}\nalive=${slice.alive} exit_code=${
          slice.exitCode ?? "null"
        } buffer_bytes=${slice.bufferBytes} seq=${slice.seq}\n---\n`;
        return {
          content: header + slice.content,
          isError: false,
          name: call.name,
          toolCallId: call.id,
        };
      }
      case "list": {
        const list = svc.listTerminalSessions();
        return {
          content: JSON.stringify(list, null, 2),
          isError: false,
          name: call.name,
          toolCallId: call.id,
        };
      }
      case "resize": {
        const id = String(args.session_id ?? "").trim();
        const cols = typeof args.cols === "number" ? args.cols : 0;
        const rows = typeof args.rows === "number" ? args.rows : 0;
        if (!id || !cols || !rows) {
          return {
            content: "Error: session_id, cols, rows are required",
            isError: true,
            name: call.name,
            toolCallId: call.id,
          };
        }
        const ok = svc.resizeTerminalSession(id, cols, rows);
        return {
          content: ok ? "ok" : "resize failed",
          isError: !ok,
          name: call.name,
          toolCallId: call.id,
        };
      }
      case "close": {
        const id = String(args.session_id ?? "").trim();
        if (!id) {
          return {
            content: "Error: session_id is required",
            isError: true,
            name: call.name,
            toolCallId: call.id,
          };
        }
        const ok = svc.killTerminalSession(id);
        return {
          content: ok ? "ok" : "close failed",
          isError: !ok,
          name: call.name,
          toolCallId: call.id,
        };
      }
      case "run": {
        if (typeof args.profile_id === "string" && args.profile_id.trim()) {
          return {
            content:
              "Error: run does not support profile_id. Use exec for one-shot SSH profile commands, or use list_profiles + open + write/read for a persistent interactive session.",
            isError: true,
            name: call.name,
            toolCallId: call.id,
          };
        }
        const command = String(args.command ?? "").trim();
        if (!command) {
          return {
            content: "Error: command is required for run",
            isError: true,
            name: call.name,
            toolCallId: call.id,
          };
        }
        if (runInBackground) {
          const info = svc.startOneShotCommandSession({
            cols: typeof args.cols === "number" ? args.cols : undefined,
            command,
            cwd: resolveTerminalCwd(args.cwd, execCtx),
            rows: typeof args.rows === "number" ? args.rows : undefined,
            shell:
              typeof args.shell === "string" && args.shell.trim()
                ? args.shell.trim()
                : undefined,
          });
          return {
            content: formatBackgroundTerminalSessionResult({
              command,
              sessionId: info.id,
            }),
            isError: false,
            name: call.name,
            toolCallId: call.id,
          };
        }
        const res = await executeShellCommand(command, {
          cwd: resolveTerminalCwd(args.cwd, execCtx),
          shell:
            typeof args.shell === "string" && args.shell.trim()
              ? args.shell.trim()
              : undefined,
          signal: execCtx.signal,
          timeoutMs,
        });
        const header = `exit_code=${res.exitCode ?? "null"} timed_out=${res.timedOut}\n---\n`;
        return {
          content:
            header + (res.truncated ? "[output truncated]\n" : "") + res.output,
          isError:
            res.timedOut || (res.exitCode !== 0 && res.exitCode !== null),
          name: call.name,
          toolCallId: call.id,
        };
      }
      case "exec": {
        const profileNeedle =
          typeof args.profile_id === "string" ? args.profile_id.trim() : "";
        if (!profileNeedle) {
          return {
            content: "Error: profile_id is required for exec",
            isError: true,
            name: call.name,
            toolCallId: call.id,
          };
        }
        const command = String(args.command ?? "").trim();
        if (!command) {
          return {
            content: "Error: command is required for exec",
            isError: true,
            name: call.name,
            toolCallId: call.id,
          };
        }
        const profileStore = await import("../terminalProfileStore.js");
        const resolved = profileStore.resolveTerminalToolExecCreateOpts(
          profileNeedle,
          command
        );
        if (!resolved) {
          return {
            content: `Error: terminal profile not found: ${profileNeedle}`,
            isError: true,
            name: call.name,
            toolCallId: call.id,
          };
        }
        if ("error" in resolved) {
          return {
            content: `Error: ${resolved.error}`,
            isError: true,
            name: call.name,
            toolCallId: call.id,
          };
        }
        if (runInBackground) {
          const info = svc.createTerminalSession({
            ...resolved.createOpts,
            cols:
              typeof args.cols === "number"
                ? args.cols
                : resolved.createOpts.cols,
            cwd: resolved.createOpts.cwd
              ? resolveTerminalCwd(resolved.createOpts.cwd, execCtx)
              : resolved.createOpts.cwd,
            rows:
              typeof args.rows === "number"
                ? args.rows
                : resolved.createOpts.rows,
            title:
              typeof args.title === "string" && args.title.trim()
                ? args.title
                : resolved.createOpts.title,
          });
          return {
            content: formatBackgroundTerminalSessionResult({
              command,
              profileName: resolved.profile.name,
              sessionId: info.id,
            }),
            isError: false,
            name: call.name,
            toolCallId: call.id,
          };
        }
        const res = await executeShellCommand(command, {
          args: resolved.createOpts.args,
          cwd: resolved.createOpts.cwd
            ? resolveTerminalCwd(resolved.createOpts.cwd, execCtx)
            : resolved.createOpts.cwd,
          env: resolved.createOpts.env,
          shell: resolved.createOpts.shell,
          signal: execCtx.signal,
          timeoutMs,
        });
        const header = `profile=${resolved.profile.name} exit_code=${res.exitCode ?? "null"} timed_out=${res.timedOut}\n---\n`;
        return {
          content:
            header + (res.truncated ? "[output truncated]\n" : "") + res.output,
          isError:
            res.timedOut || (res.exitCode !== 0 && res.exitCode !== null),
          name: call.name,
          toolCallId: call.id,
        };
      }
      default:
        return {
          content: `Error: unknown action "${action}"`,
          isError: true,
          name: call.name,
          toolCallId: call.id,
        };
    }
  } catch (e) {
    return {
      content: `Error: ${e instanceof Error ? e.message : String(e)}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
}

const SEVERITY_LABEL: Record<number, string> = {
  1: "error",
  2: "warning",
  3: "info",
  4: "hint",
};

async function executeAgentDelegate(
  call: ToolCall,
  execCtx: ToolExecutionContext = {}
): Promise<ToolResult> {
  throwIfToolAbortRequested(execCtx.signal, call.name, "delegate:start");
  const { task, context, subagentType, runInBackground, forkContext } =
    coerceAgentDelegateArgs(call);
  if (!task) {
    return {
      content: "Error: `prompt` is required for the Agent tool.",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  if (!_delegateContext) {
    return {
      content: "Agent tool is not available in this context.",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const depth = execCtx.delegateExecutionDepth ?? 0;
  if (depth >= 1) {
    return {
      content: "Nested Agent calls are not allowed (max nesting depth: 1).",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const prevCtx = _delegateContext!;
  const useBackgroundFork = shouldRunAgentInBackground({
    backgroundForkAgentSetting: prevCtx.settings.agent?.backgroundForkAgent,
    envAsyncAgentBackgroundFork:
      process.env.MAI_CODER_AGENT_BACKGROUND_FORK ??
      process.env.ASYNC_AGENT_BACKGROUND_FORK,
    runInBackground,
    subagentType,
  });
  const runtime = spawnManagedAgent({
    background: useBackgroundFork,
    context,
    emit: prevCtx.managedEmit,
    forkContext,
    nestedEmit: prevCtx.nestedEmit,
    options: prevCtx.options,
    parentAgentId: null,
    parentMessages: prevCtx.parentMessages,
    parentToolCallId: call.id,
    settings: prevCtx.settings,
    subagentType,
    task,
    threadId: prevCtx.threadId ?? execCtx.threadId ?? "_default",
    toolHooks: prevCtx.options.toolHooks,
  });
  if (useBackgroundFork) {
    void startManagedAgent(runtime);
    return {
      content: `${BACKGROUND_AGENT_TOOL_RESULT}\nAgent ID: ${runtime.agentId}`,
      isError: false,
      name: call.name,
      toolCallId: call.id,
    };
  }
  await startManagedAgent(runtime);
  const snapshot = getManagedAgentSession(runtime.threadId)?.agents[
    runtime.agentId
  ];
  const finalOutput =
    runtime.messages
      .filter((message) => message.role === "assistant")
      .map((message) => message.content)
      .slice(-1)[0] ?? "";
  if (snapshot?.lastError) {
    return {
      content: `Sub-agent error (${runtime.agentId}): ${snapshot.lastError}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  return {
    content:
      finalOutput || `(sub-agent ${runtime.agentId} completed with no output)`,
    isError: false,
    name: call.name,
    toolCallId: call.id,
  };
}

async function executeAgentSendInput(
  call: ToolCall,
  execCtx: ToolExecutionContext = {}
): Promise<ToolResult> {
  if (!_delegateContext) {
    return {
      content: "send_input is not available in this context.",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const target = String(call.arguments.target ?? "").trim();
  const message = String(call.arguments.message ?? "").trim();
  const interrupt =
    call.arguments.interrupt === true || call.arguments.interrupt === "true";
  if (!target || !message) {
    return {
      content: "Error: send_input requires both target and message.",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const result = await sendInputToManagedAgent({
    agentId: target,
    emit: _delegateContext.managedEmit,
    interrupt,
    message,
    options: _delegateContext.options,
    settings: _delegateContext.settings,
    threadId: _delegateContext.threadId ?? execCtx.threadId ?? "_default",
  });
  return {
    content: result.ok ? `Queued message for agent ${target}.` : result.error,
    isError: !result.ok,
    name: call.name,
    toolCallId: call.id,
  };
}

async function executeAgentWait(
  call: ToolCall,
  execCtx: ToolExecutionContext = {}
): Promise<ToolResult> {
  const rawTargets = Array.isArray(call.arguments.targets)
    ? call.arguments.targets
    : [];
  const targets = rawTargets
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);
  if (targets.length === 0) {
    return {
      content: "Error: wait_agent requires at least one target.",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const timeoutMsRaw = Number(call.arguments.timeout_ms ?? 30_000);
  const timeoutMs =
    Number.isFinite(timeoutMsRaw) && timeoutMsRaw > 0 ? timeoutMsRaw : 30_000;
  const statuses = await waitForManagedAgents(
    execCtx.threadId ?? _delegateContext?.threadId ?? "_default",
    targets,
    timeoutMs
  );
  return {
    content: JSON.stringify(
      {
        statuses,
        timedOut: Object.keys(statuses).length < targets.length,
      },
      null,
      2
    ),
    isError: false,
    name: call.name,
    toolCallId: call.id,
  };
}

async function executeAgentResume(
  call: ToolCall,
  execCtx: ToolExecutionContext = {}
): Promise<ToolResult> {
  if (!_delegateContext) {
    return {
      content: "resume_agent is not available in this context.",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const agentId = String(call.arguments.id ?? "").trim();
  if (!agentId) {
    return {
      content: "Error: resume_agent requires id.",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const result = await resumeManagedAgent({
    agentId,
    emit: _delegateContext.managedEmit,
    options: _delegateContext.options,
    settings: _delegateContext.settings,
    threadId: _delegateContext.threadId ?? execCtx.threadId ?? "_default",
  });
  return {
    content: result.ok ? `Resumed agent ${agentId}.` : result.error,
    isError: !result.ok,
    name: call.name,
    toolCallId: call.id,
  };
}

async function executeAgentClose(
  call: ToolCall,
  execCtx: ToolExecutionContext = {}
): Promise<ToolResult> {
  const agentId = String(call.arguments.target ?? "").trim();
  if (!agentId) {
    return {
      content: "Error: close_agent requires target.",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const result = closeManagedAgent({
    agentId,
    emit: _delegateContext?.managedEmit,
    threadId: execCtx.threadId ?? _delegateContext?.threadId ?? "_default",
  });
  return {
    content: result.ok ? `Closed agent ${agentId}.` : result.error,
    isError: !result.ok,
    name: call.name,
    toolCallId: call.id,
  };
}

function summarizeManagedAgentForTaskList(agent: {
  id: string;
  title: string;
  status: string;
  subagentType?: string;
  background: boolean;
  parentAgentId: string | null;
  updatedAt: number;
  closedAt: number | null;
  lastError: string | null;
}): string {
  const parts = [
    `#${agent.id}`,
    `[${agent.status}]`,
    agent.background ? "(bg)" : "",
    agent.subagentType ? `<${agent.subagentType}>` : "",
    agent.title,
  ].filter(Boolean);
  if (agent.lastError) parts.push(`error="${agent.lastError}"`);
  return parts.join(" ");
}

function executeTaskList(
  call: ToolCall,
  execCtx: ToolExecutionContext = {}
): ToolResult {
  const threadId = execCtx.threadId ?? _delegateContext?.threadId ?? "_default";
  const session = getManagedAgentSession(threadId);
  if (!session) {
    return {
      content: "No tasks. Use TaskCreate to spawn a sub-agent task.",
      isError: false,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const filter =
    typeof call.arguments.status === "string"
      ? String(call.arguments.status)
      : null;
  const all = Object.values(session.agents);
  const filtered = filter ? all.filter((a) => a.status === filter) : all;
  if (filtered.length === 0) {
    return {
      content: filter ? `No tasks with status "${filter}".` : "No tasks.",
      isError: false,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const lines = filtered
    .sort((a, b) => a.startedAt - b.startedAt)
    .map((a) => summarizeManagedAgentForTaskList(a));
  return {
    content: lines.join("\n"),
    isError: false,
    name: call.name,
    toolCallId: call.id,
  };
}

function executeTaskGet(
  call: ToolCall,
  execCtx: ToolExecutionContext = {}
): ToolResult {
  const id = String(call.arguments.taskId ?? call.arguments.id ?? "").trim();
  if (!id) {
    return {
      content: "Error: taskId is required",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const threadId = execCtx.threadId ?? _delegateContext?.threadId ?? "_default";
  const session = getManagedAgentSession(threadId);
  const agent = session?.agents[id];
  if (!agent) {
    return {
      content: `Error: task ${id} not found in this session.`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const meta = {
    background: agent.background,
    childAgentIds: agent.childAgentIds,
    closedAt: agent.closedAt,
    id: agent.id,
    lastError: agent.lastError,
    lastInputSummary: agent.lastInputSummary,
    lastOutputSummary: agent.lastOutputSummary,
    lastResultSummary: agent.lastResultSummary,
    parentAgentId: agent.parentAgentId,
    parentToolCallId: agent.parentToolCallId,
    runProfile: agent.runProfile,
    startedAt: agent.startedAt,
    status: agent.status,
    subagentType: agent.subagentType ?? null,
    title: agent.title,
    updatedAt: agent.updatedAt,
  };
  return {
    content: JSON.stringify(meta, null, 2),
    isError: false,
    name: call.name,
    toolCallId: call.id,
  };
}

function executeTaskOutput(
  call: ToolCall,
  execCtx: ToolExecutionContext = {}
): ToolResult {
  const id = String(call.arguments.taskId ?? call.arguments.id ?? "").trim();
  if (!id) {
    return {
      content: "Error: taskId is required",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const threadId = execCtx.threadId ?? _delegateContext?.threadId ?? "_default";
  const session = getManagedAgentSession(threadId);
  const agent = session?.agents[id];
  if (!agent) {
    return {
      content: `Error: task ${id} not found in this session.`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const last = call.arguments.last;
  const tail =
    typeof last === "number" && Number.isFinite(last) && last > 0
      ? Math.floor(last)
      : null;
  const messages = tail ? agent.messages.slice(-tail) : agent.messages;
  if (messages.length === 0) {
    return {
      content: `(task ${id} has no output yet; current status=${agent.status})`,
      isError: false,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const formatted = messages
    .map((m) => `[${m.role}] ${m.content}`)
    .join("\n\n---\n\n");
  const header = `Task #${id} status=${agent.status}\n\n`;
  return {
    content: header + formatted,
    isError: false,
    name: call.name,
    toolCallId: call.id,
  };
}

function executeTodoWrite(
  call: ToolCall,
  execCtx: ToolExecutionContext
): ToolResult {
  const rawTodos = call.arguments.todos;
  if (!Array.isArray(rawTodos)) {
    return {
      content: "Error: todos must be an array",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const todos = rawTodos.map((t: Record<string, unknown>) => ({
    activeForm: String(t.activeForm ?? t.content ?? ""),
    content: String(t.content ?? ""),
    status: (["pending", "in_progress", "completed"].includes(String(t.status))
      ? String(t.status)
      : "pending") as TodoItem["status"],
  }));

  const key = execCtx.threadId ?? execCtx.workspaceRoot ?? "_default";
  const { newTodos } = setTodos(key, todos);

  const completed = newTodos.filter((t) => t.status === "completed").length;
  const inProgress = newTodos.filter((t) => t.status === "in_progress").length;
  const pending = newTodos.filter((t) => t.status === "pending").length;

  return {
    content: `Todo list updated: ${newTodos.length} tasks (${completed} done, ${inProgress} in progress, ${pending} pending)`,
    isError: false,
    name: call.name,
    toolCallId: call.id,
  };
}

const LSP_OPERATION_SET = new Set([
  "goToDefinition",
  "findReferences",
  "hover",
  "documentSymbol",
  "workspaceSymbol",
  "goToImplementation",
  "prepareCallHierarchy",
  "incomingCalls",
  "outgoingCalls",
  "getDiagnostics",
]);

const LSP_POSITION_OPTIONAL = new Set(["getDiagnostics", "workspaceSymbol"]);

function lspRelUriPath(uri: string, workspaceRoot: string): string {
  if (!uri.startsWith("file:")) return uri;
  try {
    const p = fileURLToPath(uri);
    return path.relative(workspaceRoot, p).replace(/\\/g, "/") || ".";
  } catch {
    return uri;
  }
}

function formatLspLocationish(res: unknown, workspaceRoot: string): string {
  if (res == null) return "(no results)";
  const arr = Array.isArray(res) ? res : [res];
  const lines: string[] = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const uri = (o.uri ?? o.targetUri) as string | undefined;
    const range = (o.range ?? o.targetSelectionRange ?? o.targetRange) as
      | { start?: { line: number; character: number } }
      | undefined;
    if (uri && range?.start) {
      const rel = lspRelUriPath(uri, workspaceRoot);
      const line = (range.start.line ?? 0) + 1;
      const col = (range.start.character ?? 0) + 1;
      lines.push(`${rel}:${line}:${col}`);
    }
  }
  if (lines.length === 0)
    return typeof res === "object"
      ? JSON.stringify(res).slice(0, 12_000)
      : String(res);
  const cap = 500;
  return (
    lines.slice(0, cap).join("\n") +
    (lines.length > cap ? `\n... (${lines.length - cap} more locations)` : "")
  );
}

function formatLspHover(raw: unknown): string {
  if (raw == null) return "(no hover)";
  if (typeof raw !== "object") return String(raw);
  const c = (raw as { contents?: unknown }).contents;
  if (typeof c === "string") return c;
  if (c && typeof c === "object" && "value" in (c as object)) {
    return String((c as { value?: string }).value ?? "");
  }
  if (Array.isArray(c)) {
    return c
      .map((x) => (typeof x === "string" ? x : JSON.stringify(x)))
      .join("\n");
  }
  return JSON.stringify(raw).slice(0, 12_000);
}

function formatLspDocumentSymbolsNode(
  s: unknown,
  indent: number,
  workspaceRoot: string
): string[] {
  if (!s || typeof s !== "object") return [];
  const o = s as Record<string, unknown>;
  const lines: string[] = [];
  const name = String(o.name ?? "?");
  const kind = o.kind == null ? "" : String(o.kind);
  let suffix = "";
  if (o.range && typeof o.range === "object") {
    const st = (o.range as { start?: { line: number } }).start;
    if (st) suffix = ` L${(st.line ?? 0) + 1}`;
  }
  if (o.location && typeof o.location === "object") {
    const loc = o.location as {
      uri: string;
      range?: { start: { line: number } };
    };
    const rel = lspRelUriPath(loc.uri, workspaceRoot);
    const ln = (loc.range?.start?.line ?? 0) + 1;
    suffix = ` ${rel}:${ln}`;
  }
  lines.push(
    `${"  ".repeat(indent)}${name}${kind ? ` [${kind}]` : ""}${suffix}`
  );
  const ch = o.children;
  if (Array.isArray(ch)) {
    for (const c of ch)
      lines.push(...formatLspDocumentSymbolsNode(c, indent + 1, workspaceRoot));
  }
  return lines;
}

function formatLspDocumentSymbolsResult(
  res: unknown,
  workspaceRoot: string
): string {
  if (!Array.isArray(res) || res.length === 0) return "(no symbols)";
  const parts: string[] = [];
  for (const s of res)
    parts.push(...formatLspDocumentSymbolsNode(s, 0, workspaceRoot));
  const cap = 400;
  return (
    parts.slice(0, cap).join("\n") +
    (parts.length > cap ? "\n... (truncated)" : "")
  );
}

function formatLspWorkspaceSymbols(
  res: unknown,
  workspaceRoot: string
): string {
  if (!Array.isArray(res) || res.length === 0) return "(no symbols)";
  const lines: string[] = [];
  for (const s of res as Array<{
    name?: string;
    location?: { uri: string; range?: { start: { line: number } } };
  }>) {
    if (!s?.location?.uri) continue;
    const rel = lspRelUriPath(s.location.uri, workspaceRoot);
    const line = (s.location.range?.start?.line ?? 0) + 1;
    lines.push(`${s.name ?? "?"} — ${rel}:${line}`);
    if (lines.length >= 300) break;
  }
  return lines.join("\n") || "(no symbols)";
}

function formatLspCallHierarchyPrepare(
  res: unknown,
  workspaceRoot: string
): string {
  if (res == null) return "(no items)";
  const arr = Array.isArray(res) ? res : [res];
  const lines: string[] = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const name = String(o.name ?? "?");
    const uri = o.uri as string | undefined;
    const range = o.range as { start?: { line: number } } | undefined;
    if (!uri) continue;
    const rel = lspRelUriPath(uri, workspaceRoot);
    const ln = (range?.start?.line ?? 0) + 1;
    lines.push(`${name} — ${rel}:${ln}`);
  }
  return lines.join("\n") || "(no items)";
}

function formatLspCallHierarchyCalls(
  res: unknown,
  workspaceRoot: string,
  op: "incomingCalls" | "outgoingCalls"
): string {
  if (res == null || (Array.isArray(res) && res.length === 0))
    return "(no calls)";
  if (!Array.isArray(res)) return JSON.stringify(res).slice(0, 12_000);
  const lines: string[] = [];
  if (op === "incomingCalls") {
    for (const row of res as Array<{
      from?: {
        name?: string;
        uri?: string;
        range?: { start: { line: number } };
      };
    }>) {
      const from = row.from;
      if (!from?.uri) continue;
      const rel = lspRelUriPath(from.uri, workspaceRoot);
      const ln = (from.range?.start?.line ?? 0) + 1;
      lines.push(`from ${from.name ?? "?"} @ ${rel}:${ln}`);
    }
  } else {
    for (const row of res as Array<{
      to?: { name?: string; uri?: string; range?: { start: { line: number } } };
    }>) {
      const to = row.to;
      if (!to?.uri) continue;
      const rel = lspRelUriPath(to.uri, workspaceRoot);
      const ln = (to.range?.start?.line ?? 0) + 1;
      lines.push(`to ${to.name ?? "?"} @ ${rel}:${ln}`);
    }
  }
  return lines.slice(0, 400).join("\n") || JSON.stringify(res).slice(0, 12_000);
}

async function executeLspTool(
  call: ToolCall,
  execCtx: ToolExecutionContext
): Promise<ToolResult> {
  throwIfToolAbortRequested(execCtx.signal, call.name, "lsp:start");
  const args = call.arguments;
  const op = String(args.operation ?? "").trim();
  const filePathRaw = String(args.filePath ?? args.path ?? "").trim();
  if (!op) {
    return {
      content: "Error: operation is required",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  if (!LSP_OPERATION_SET.has(op)) {
    return {
      content: `Error: unknown LSP operation "${op}"`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  if (!filePathRaw) {
    return {
      content: "Error: filePath is required",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  let line = typeof args.line === "number" ? args.line : Number(args.line);
  let character =
    typeof args.character === "number"
      ? args.character
      : Number(args.character);
  if (LSP_POSITION_OPTIONAL.has(op)) {
    if (!Number.isFinite(line) || line < 1) line = 1;
    if (!Number.isFinite(character) || character < 1) character = 1;
  } else if (
    !Number.isFinite(line) ||
    !Number.isFinite(character) ||
    line < 1 ||
    character < 1
  ) {
    return {
      content:
        "Error: line and character must be positive integers (1-based, as shown in the editor).",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const root = requireWorkspace(execCtx);
  let rel: string;
  let full: string;
  try {
    ({ rel, full } = resolveAgentFilePath(filePathRaw, execCtx));
  } catch (e) {
    return {
      content: `Error: ${e instanceof Error ? e.message : String(e)}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) {
    return {
      content: `File not found or not a regular file: ${rel}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const mgr = execCtx.workspaceLspManager;
  if (!mgr) {
    return {
      content: "LSP manager is not available in this context.",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  let session: Awaited<ReturnType<WorkspaceLspManager["sessionForFile"]>>;
  try {
    session = await mgr.sessionForFile(full, root);
  } catch (e) {
    return {
      content: `Could not start language server: ${e instanceof Error ? e.message : String(e)}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  if (!session) {
    const ext = path.extname(rel).toLowerCase() || "(none)";
    return {
      content: `No LSP server handles extension "${ext}". Add a plugin under <maiData>/plugins/<name>/ or <workspace>/.mai/plugins/<name>/ with .lsp.json (command + extensionToLanguage), or use legacy settings.json "lsp.servers". For TS/JS, install typescript-language-server in the project or register it explicitly.`,
      isError: false,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const text = fs.readFileSync(full, "utf-8");
  const uri = pathToFileURL(full).href;

  try {
    let out = "";
    switch (op) {
      case "getDiagnostics": {
        const items = await session.diagnostics(uri, text);
        if (items === null) {
          out =
            "Pull diagnostics not supported by the current language server. Try running tsc manually.";
        } else if (items.length === 0) {
          out = `No diagnostics in ${rel}.`;
        } else {
          out = items
            .map((d) => {
              const sev = SEVERITY_LABEL[d.severity ?? 1] ?? "error";
              const ln = (d.range.start.line ?? 0) + 1;
              const col = (d.range.start.character ?? 0) + 1;
              return `[${sev}] ${rel}:${ln}:${col} — ${d.message}`;
            })
            .join("\n");
        }
        break;
      }
      case "goToDefinition":
        out = formatLspLocationish(
          await session.definition(uri, line, character, text),
          root
        );
        break;
      case "findReferences":
        out = formatLspLocationish(
          await session.references(uri, line, character, text),
          root
        );
        break;
      case "hover":
        out = formatLspHover(await session.hover(uri, line, character, text));
        break;
      case "documentSymbol":
        out = formatLspDocumentSymbolsResult(
          await session.documentSymbols(uri, text),
          root
        );
        break;
      case "workspaceSymbol":
        await session.syncDocument(uri, text);
        out = formatLspWorkspaceSymbols(
          await session.workspaceSymbol(""),
          root
        );
        break;
      case "goToImplementation":
        out = formatLspLocationish(
          await session.implementation(uri, line, character, text),
          root
        );
        break;
      case "prepareCallHierarchy":
        out = formatLspCallHierarchyPrepare(
          await session.prepareCallHierarchy(uri, line, character, text),
          root
        );
        break;
      case "incomingCalls": {
        const items = await session.prepareCallHierarchy(
          uri,
          line,
          character,
          text
        );
        const arr = Array.isArray(items) ? items : items ? [items] : [];
        if (arr.length === 0) out = "No call hierarchy item at this position.";
        else
          out = formatLspCallHierarchyCalls(
            await session.incomingCalls(arr[0]),
            root,
            "incomingCalls"
          );
        break;
      }
      case "outgoingCalls": {
        const items = await session.prepareCallHierarchy(
          uri,
          line,
          character,
          text
        );
        const arr = Array.isArray(items) ? items : items ? [items] : [];
        if (arr.length === 0) out = "No call hierarchy item at this position.";
        else
          out = formatLspCallHierarchyCalls(
            await session.outgoingCalls(arr[0]),
            root,
            "outgoingCalls"
          );
        break;
      }
      default:
        out = `Unsupported operation: ${op}`;
    }
    return {
      content: out,
      isError: false,
      name: call.name,
      toolCallId: call.id,
    };
  } catch (e) {
    return {
      content: `LSP error (${op}): ${e instanceof Error ? e.message : String(e)}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
}
