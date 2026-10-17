import type OpenAI from "openai";
import type {
  MessageParam,
  ToolResultBlockParam,
} from "@anthropic-ai/sdk/resources/messages";
import { parseAgentAssistantPayload } from "../../../src/agentStructuredMessage.js";
import type { ComposerMode } from "../../llm/composerMode.js";
import {
  buildAnthropicUserBlocks,
  buildOpenAIUserContent,
} from "../../llm/resolvedUserSerialize.js";
import type { SendableMessage } from "../../llm/sendResolved.js";
import { userMessageTextForSend } from "../../llm/sendResolved.js";
import { getMcpManager } from "../../mcp/index.js";
import { getEffectiveMcpServerConfigs } from "../../plugins/pluginRuntimeService.js";
import type { ShellSettings } from "../../settingsStore.js";
import type { DeferredToolState } from "../../threadStore.js";
import {
  assembleAgentToolPool,
  assembleVisibleAgentToolPool,
  filterMcpToolsByDenyPrefixes,
} from "../agentToolPool.js";
import type { AgentToolDef, ToolResult } from "../agentTools.js";
import {
  mergeAdjacentAnthropicUserMessages,
  mergeAdjacentOpenAIUserMessages,
} from "../messageNormalizeForApi.js";
import {
  expandStructuredAssistantPayloadToAnthropic,
  expandStructuredAssistantPayloadToOpenAI,
} from "../structuredAssistantToApi.js";
import type { AgentLoopOptions, OAIMsg, ToolInputDeltaPayload } from "./agentLoopTypes.js";

export const DEFAULT_MAX_CONSECUTIVE_MISTAKES = 5;

/** 只读类工具：不向 UI 发送 tool_input_delta，避免参数 JSON 流式刷新；完成后由活动行渐入展示 */
export const READ_TOOLS_SKIP_INPUT_DELTA = new Set([
  "Read",
  "view_image",
  "Glob",
  "Grep",
  "list_dir",
  "LSP",
  "ToolSearch",
  "ListMcpResourcesTool",
  "ReadMcpResourceTool",
  "ask_plan_question",
  "request_user_input",
  "plan_submit_draft",
  "team_plan_decide",
  "team_escalate_to_lead",
  "team_request_from_peer",
  "team_reply_to_peer",
  "Agent",
  "Task",
]);

export function shouldEmitToolInputDelta(toolName: string): boolean {
  return !READ_TOOLS_SKIP_INPUT_DELTA.has(toolName);
}

/** 写入类工具：每发一帧参数增量后让出 Node 事件循环，便于 Electron 先把 IPC 交给渲染进程绘制 */
export const WRITE_TOOLS_STREAM_YIELD = new Set(["Edit", "Write"]);

export function yieldForToolInputStreamUi(toolName: string): Promise<void> {
  if (!WRITE_TOOLS_STREAM_YIELD.has(toolName)) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    setImmediate(resolve);
  });
}

export const DEFAULT_MAX_STREAMING_TOOL_ARG_CHARS = 2_000_000;

export function maxStreamingToolArgChars(): number {
  const raw = (
    process.env.MAI_CODER_MAX_STREAMING_TOOL_ARG_CHARS ??
    process.env.ASYNC_MAX_STREAMING_TOOL_ARG_CHARS
  )?.trim();
  const n = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(n) && n > 10_000
    ? n
    : DEFAULT_MAX_STREAMING_TOOL_ARG_CHARS;
}

/**
 * 未配置时为 `null`（不限制）。
 */
export function resolveAgentMaxRounds(settings: ShellSettings): number | null {
  const raw = (
    process.env.MAI_CODER_AGENT_MAX_ROUNDS ?? process.env.ASYNC_AGENT_MAX_ROUNDS
  )?.trim();
  if (raw !== undefined && raw !== "") {
    const lower = raw.toLowerCase();
    if (
      lower === "0" ||
      lower === "unlimited" ||
      lower === "off" ||
      lower === "infinity"
    ) {
      return null;
    }
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n) && n > 0) {
      return n;
    }
  }
  const s = settings.agent?.maxToolRounds;
  if (typeof s === "number" && Number.isFinite(s) && s > 0) {
    return Math.floor(s);
  }
  return null;
}

/**
 * tool_input_delta 即时下发。
 */
export function createToolInputDeltaBatcher(
  emit: (p: ToolInputDeltaPayload) => void
): { queue: (p: ToolInputDeltaPayload) => void; flush: () => void } {
  return {
    flush() {
      // 兼容流结束处仍调用 flush；即时模式下已无挂起帧
    },
    queue(p: ToolInputDeltaPayload) {
      emit(p);
    },
  };
}

export function unwrapAssistantContentEnvelope(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
    return text;
  }
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return text;
    }
    const content = (parsed as { content?: unknown }).content;
    if (typeof content !== "string" || !content.trim()) {
      return text;
    }
    return content;
  } catch {
    return text;
  }
}

export function inferOpenAIToolNameFromPartialArguments(partial: string): string {
  const c = partial.replace(/\s+/g, "");
  if (!c) return "";
  if (
    c.includes('"old_str"') ||
    c.includes('"new_str"') ||
    c.includes('"old_string"') ||
    c.includes('"new_string"')
  )
    return "Edit";
  if (c.includes('"content"')) return "Write";
  if (c.includes('"pattern"')) return "Grep";
  if (
    /"operation"\s*:\s*"(goToDefinition|findReferences|hover|documentSymbol|workspaceSymbol|goToImplementation|prepareCallHierarchy|incomingCalls|outgoingCalls|getDiagnostics)"/.test(
      c
    )
  )
    return "LSP";
  if (c.includes('"filePath"')) return "LSP";
  if (c.includes('"command"')) return "Bash";
  if (c.includes('"run_in_background"')) return "Agent";
  if (c.includes('"prompt"') || c.includes('"subagent_type"')) return "Agent";
  if (
    c.includes('"questions"') &&
    c.includes('"header"') &&
    c.includes('"description"')
  )
    return "request_user_input";
  if (
    c.includes('"offset"') ||
    c.includes('"limit"') ||
    c.includes('"start_line"') ||
    c.includes('"end_line"')
  )
    return "Read";
  if (c.includes('"file_path"')) return "Read";
  if (c.includes('"path"')) return "Read";
  if (c.includes('"question"') && c.includes('"options"'))
    return "ask_plan_question";
  return "";
}

export function agentToolDefsForLoop(
  composerMode: ComposerMode,
  settings: ShellSettings,
  override?: AgentToolDef[]
): AgentToolDef[] {
  if (override && override.length > 0) {
    return override;
  }
  return assembleAgentToolPool(composerMode, {
    mcpToolDenyPrefixes: settings.mcpToolDenyPrefixes,
  });
}

export function normalizeToolNameList(values: Iterable<string>): string[] {
  return [
    ...new Set(
      Array.from(values)
        .map((value) => String(value ?? "").trim())
        .filter(Boolean)
    ),
  ].sort((a, b) => a.localeCompare(b));
}

export function normalizeDeferredToolStateForLoop(
  state?: DeferredToolState | null,
  discoveredDeferredToolNames?: string[]
): DeferredToolState {
  return {
    discoveredToolNames: normalizeToolNameList([
      ...(state?.discoveredToolNames ?? []),
      ...(discoveredDeferredToolNames ?? []),
    ]),
    ...(state?.providerLoadedToolNames
      ? {
          providerLoadedToolNames: {
            ...(state.providerLoadedToolNames.anthropic?.length
              ? {
                  anthropic: normalizeToolNameList(
                    state.providerLoadedToolNames.anthropic
                  ),
                }
              : {}),
            ...(state.providerLoadedToolNames.openai?.length
              ? {
                  openai: normalizeToolNameList(
                    state.providerLoadedToolNames.openai
                  ),
                }
              : {}),
          },
        }
      : {}),
  };
}

export function emitDeferredToolStateChange(
  options: AgentLoopOptions,
  state: DeferredToolState
): void {
  options.onDeferredToolStateChange?.(state);
  options.onDiscoveredDeferredToolsChange?.(state.discoveredToolNames);
}

export function visibleAgentToolDefsForLoop(
  composerMode: ComposerMode,
  settings: ShellSettings,
  discoveredDeferredToolNames: Iterable<string>,
  override?: AgentToolDef[],
  nativeDeferEnabled?: boolean
): AgentToolDef[] {
  return assembleVisibleAgentToolPool(composerMode, {
    discoveredDeferredToolNames,
    mcpToolDenyPrefixes: settings.mcpToolDenyPrefixes,
    nativeDeferEnabled,
    override,
  });
}

export function appendMcpToolsSystemHint(
  systemContent: string,
  composerMode: ComposerMode,
  settings: ShellSettings
): string {
  if (composerMode !== "agent" && composerMode !== "team") {
    return systemContent;
  }
  const mcpTools = filterMcpToolsByDenyPrefixes(
    getMcpManager().getAgentTools(),
    settings.mcpToolDenyPrefixes
  );
  const n = mcpTools.length;
  if (n === 0) {
    return systemContent;
  }
  const hint = [
    `## MCP tools (${n})`,
    "Additional tools from configured Model Context Protocol servers use names prefixed `mcp__`.",
    "Most MCP tools are loaded on demand. Use `ToolSearch` to discover and load the relevant MCP tool before calling it directly.",
    "Use `ListMcpResourcesTool` / `ReadMcpResourceTool` to browse MCP resources when needed.",
    "Use them when the user needs integrations beyond the built-in workspace tools (e.g. web, APIs, databases). Follow each tool's description and parameter schema.",
  ].join("\n");
  if (!systemContent.trim()) {
    return hint;
  }
  return [systemContent, "", hint].join("\n");
}

export function appendMessagesToOpenAIConversation(
  conversation: OAIMsg[],
  messages: SendableMessage[]
): OAIMsg[] {
  const next = [...conversation];
  for (const message of messages) {
    if (message.role === "system") {
      continue;
    }
    if (message.role === "assistant") {
      const payload = parseAgentAssistantPayload(message.content);
      if (payload) {
        next.push(...expandStructuredAssistantPayloadToOpenAI(payload));
      } else {
        next.push({ content: message.content, role: "assistant" });
      }
      continue;
    }
    next.push({
      content:
        message.resolved && message.resolved.hasImages
          ? buildOpenAIUserContent(message.resolved)
          : userMessageTextForSend(message),
      role: "user",
    });
  }
  return mergeAdjacentOpenAIUserMessages(next);
}

export function appendMessagesToAnthropicConversation(
  conversation: MessageParam[],
  messages: SendableMessage[]
): MessageParam[] {
  const next = [...conversation];
  for (const message of messages) {
    if (message.role === "system") {
      continue;
    }
    if (message.role === "assistant") {
      const payload = parseAgentAssistantPayload(message.content);
      if (payload) {
        next.push(...expandStructuredAssistantPayloadToAnthropic(payload));
      } else {
        next.push({ content: message.content, role: "assistant" });
      }
      continue;
    }
    next.push({
      content:
        message.resolved && message.resolved.hasImages
          ? buildAnthropicUserBlocks(message.resolved)
          : userMessageTextForSend(message),
      role: "user",
    });
  }
  return mergeAdjacentAnthropicUserMessages(next);
}

export async function prepareMcpConnectionsForSession(
  composerMode: ComposerMode,
  userMcpServers: ShellSettings["mcpServers"],
  workspaceRoot: string | null
): Promise<void> {
  if (
    composerMode !== "agent" &&
    composerMode !== "plan" &&
    composerMode !== "team"
  ) {
    return;
  }
  const mcpT0 = Date.now();
  const mgr = getMcpManager();
  mgr.loadConfigs(getEffectiveMcpServerConfigs(userMcpServers, workspaceRoot));
  console.log(
    `[AgentLoop] MCP prepare done (${Date.now() - mcpT0}ms) mode=${composerMode} connected=${mgr.getConnectedClients().length} — disconnected MCP servers are not auto-started during send`
  );
}

/** 最大只读工具并发数，避免大批量 Read/Glob 同时打盘 */
export const MAX_TOOL_CONCURRENCY = 10;

/**
 * 带并发上限的批量执行，保证结果顺序与输入一致。
 */
export async function runBatchWithLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let nextIdx = 0;
  async function worker(): Promise<void> {
    while (nextIdx < tasks.length) {
      const i = nextIdx++;
      results[i] = await tasks[i]!();
    }
  }
  const workerCount = Math.min(limit, tasks.length);
  await Promise.all(Array.from({ length: workerCount }, worker));
  return results;
}

export function synthesizeMissingOpenAIToolResults(
  conversation: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  turnToolCalls: { id: string; name: string; arguments: string }[],
  reason: string
): void {
  const named = turnToolCalls.filter((tc) => tc.name && tc.id);
  if (named.length === 0) return;
  const last = conversation[conversation.length - 1];
  if (!last || last.role !== "assistant") return;
  for (const tc of named) {
    conversation.push({
      content: `Tool execution aborted: ${reason}`,
      role: "tool",
      tool_call_id: tc.id,
    });
  }
}

export function synthesizeMissingAnthropicToolResults(
  conversation: MessageParam[],
  turnToolUses: { id: string; name: string; input: string }[],
  reason: string
): void {
  if (turnToolUses.length === 0) return;
  const last = conversation[conversation.length - 1];
  if (!last || last.role !== "assistant") return;
  const results: ToolResultBlockParam[] = turnToolUses.map((tu) => ({
    content: `Tool execution aborted: ${reason}`,
    is_error: true,
    tool_use_id: tu.id,
    type: "tool_result" as const,
  }));
  conversation.push({ content: results, role: "user" });
}

export function anthropicImageDataUrlFromStructuredToolResult(
  content: ToolResult["structuredContent"]
): string | null {
  if (!Array.isArray(content)) {
    return null;
  }
  for (const block of content) {
    if (
      block &&
      typeof block === "object" &&
      (block as { type?: unknown }).type === "image"
    ) {
      const source = (
        block as {
          source?: { type?: unknown; media_type?: unknown; data?: unknown };
        }
      ).source;
      if (
        source?.type === "base64" &&
        typeof source.media_type === "string" &&
        typeof source.data === "string" &&
        source.data.length > 0
      ) {
        return `data:${source.media_type};base64,${source.data}`;
      }
    }
  }
  return null;
}

export function buildOpenAIViewImageFollowupMessage(
  results: ToolResult[]
): OAIMsg | null {
  const imageUrls = results
    .map((result) =>
      anthropicImageDataUrlFromStructuredToolResult(result.structuredContent)
    )
    .filter(
      (value): value is string => typeof value === "string" && value.length > 0
    );
  if (imageUrls.length === 0) {
    return null;
  }
  return {
    content: [
      {
        text: "[Tool context] The previous view_image tool loaded local workspace image(s) for inspection. Use them as tool context, not as a new user request.",
        type: "text",
      },
      ...imageUrls.map((url) => ({
        image_url: { url },
        type: "image_url" as const,
      })),
    ],
    role: "user",
  };
}
