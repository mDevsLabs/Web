/**
 * Message normalization for Async API requests:
 * - Merge consecutive user turns (Bedrock-style constraint; harmless on 1P API).
 * - Hoist `tool_result` blocks before other user content blocks (API ordering).
 * - Join text seams with `\n` when merging user text blocks (avoid "2 + 23 + 3").
 * - Backward-style merge of consecutive plain-string assistant messages (same transcript split).
 * - Strip `server_tool_use` / `mcp_tool_use` in assistant content when no matching `tool_use_id`
 *   appears in the same message (aligns with ensureToolResultPairing server-side branch).
 *
 * @see D:/WebstormProjects/claude-code/claude-code-2.1.88/src/utils/messages.ts normalizeMessagesForAPI
 */

import type {
  ContentBlockParam,
  MessageParam,
} from "@anthropic-ai/sdk/resources/messages";
import type OpenAI from "openai";

export type OAIMsg = OpenAI.Chat.Completions.ChatCompletionMessageParam;

/** tool_result blocks must precede other user blocks for Anthropic API. */
function hoistToolResults(blocks: ContentBlockParam[]): ContentBlockParam[] {
  const toolResults: ContentBlockParam[] = [];
  const other: ContentBlockParam[] = [];
  for (const block of blocks) {
    if (block.type === "tool_result") {
      toolResults.push(block);
    } else {
      other.push(block);
    }
  }
  return [...toolResults, ...other];
}

function toContentBlocks(
  content: string | ContentBlockParam[]
): ContentBlockParam[] {
  if (typeof content === "string") {
    return [{ text: content, type: "text" }];
  }
  return content;
}

/** Join two user block arrays; insert `\n` between trailing/leading text blocks (CC joinTextAtSeam). */
function joinUserBlocksAtSeam(
  a: ContentBlockParam[],
  b: ContentBlockParam[]
): ContentBlockParam[] {
  const lastA = a.at(-1);
  const firstB = b[0];
  if (lastA?.type === "text" && firstB?.type === "text") {
    return [...a.slice(0, -1), { ...lastA, text: lastA.text + "\n" }, ...b];
  }
  return [...a, ...b];
}

function mergeAnthropicUserPair(
  prev: MessageParam,
  next: MessageParam
): MessageParam {
  const a = toContentBlocks(prev.content as string | ContentBlockParam[]);
  const b = toContentBlocks(next.content as string | ContentBlockParam[]);
  const merged = hoistToolResults(joinUserBlocksAtSeam(a, b));
  return { content: merged, role: "user" };
}

/**
 * Merge consecutive `user` messages (string or block arrays).
 */
export function mergeAdjacentAnthropicUserMessages(
  messages: MessageParam[]
): MessageParam[] {
  const out: MessageParam[] = [];
  for (const m of messages) {
    if (m.role === "user") {
      const prev = out.at(-1);
      if (prev?.role === "user") {
        out[out.length - 1] = mergeAnthropicUserPair(prev, m);
        continue;
      }
    }
    out.push(m);
  }
  return out;
}

/**
 * Merge consecutive `user` messages with string content (OpenAI chat completions).
 */
export function mergeAdjacentOpenAIUserMessages(messages: OAIMsg[]): OAIMsg[] {
  const out: OAIMsg[] = [];
  for (const m of messages) {
    if (m.role === "user") {
      const c = (m as { content?: unknown }).content;
      if (typeof c === "string") {
        const prev = out.at(-1) as
          | { role?: string; content?: unknown }
          | undefined;
        if (prev?.role === "user" && typeof prev.content === "string") {
          out[out.length - 1] = {
            content: `${prev.content}\n\n${c}`,
            role: "user",
          } as OAIMsg;
          continue;
        }
      }
    }
    out.push(m);
  }
  return out;
}

function isOpenAIPlainStringAssistant(
  m: OAIMsg
): m is OpenAI.Chat.ChatCompletionAssistantMessageParam {
  if (m.role !== "assistant") return false;
  const any = m as { content?: unknown; tool_calls?: unknown };
  return typeof any.content === "string" && !any.tool_calls;
}

/**
 * Merge consecutive assistant messages that are plain text only (no tool_calls), e.g. split transcript.
 */
export function mergeAdjacentOpenAIPlainStringAssistants(
  messages: OAIMsg[]
): OAIMsg[] {
  const out: OAIMsg[] = [];
  for (const m of messages) {
    if (isOpenAIPlainStringAssistant(m)) {
      const prev = out.at(-1);
      if (prev && isOpenAIPlainStringAssistant(prev)) {
        out[out.length - 1] = {
          content: `${prev.content}\n\n${m.content}`,
          role: "assistant",
        } as OAIMsg;
        continue;
      }
    }
    out.push(m);
  }
  return out;
}

/** Collect tool_use_id values from blocks in the same assistant message (results reference the use id). */
function collectToolResultIdsInAssistantBlocks(
  blocks: ContentBlockParam[]
): Set<string> {
  const s = new Set<string>();
  for (const b of blocks) {
    if (!b || typeof b !== "object") continue;
    const o = b as { type?: string; tool_use_id?: string };
    if (typeof o.tool_use_id === "string" && o.tool_use_id.length > 0) {
      s.add(o.tool_use_id);
    }
  }
  return s;
}

/**
 * Remove `server_tool_use` / `mcp_tool_use` blocks with no matching result id in the same message.
 */
export function stripOrphanAnthropicServerToolUsesInAssistant(
  content: ContentBlockParam[]
): ContentBlockParam[] {
  const resultIds = collectToolResultIdsInAssistantBlocks(content);
  return content.filter((b) => {
    const t = (b as { type?: string }).type;
    if (t === "server_tool_use" || t === "mcp_tool_use") {
      const id = (b as { id?: string }).id;
      if (!id) return false;
      return resultIds.has(id);
    }
    return true;
  });
}

function normalizeAnthropicAssistantBlocks(
  messages: MessageParam[]
): MessageParam[] {
  return messages.map((msg) => {
    if (msg.role === "assistant" && Array.isArray(msg.content)) {
      const next = stripOrphanAnthropicServerToolUsesInAssistant(msg.content);
      return next === msg.content ? msg : { ...msg, content: next };
    }
    return msg;
  });
}

/**
 * Merge consecutive plain-string assistant messages (array content unchanged).
 */
export function mergeAdjacentAnthropicPlainStringAssistants(
  messages: MessageParam[]
): MessageParam[] {
  const out: MessageParam[] = [];
  for (const m of messages) {
    if (m.role === "assistant" && typeof m.content === "string") {
      const prev = out.at(-1);
      if (prev?.role === "assistant" && typeof prev.content === "string") {
        out[out.length - 1] = {
          content: `${prev.content}\n\n${m.content}`,
          role: "assistant",
        };
        continue;
      }
    }
    out.push(m);
  }
  return out;
}

/**
 * Anthropic: strip orphan server/MCP tool uses → merge adjacent users → merge plain string assistants.
 * Call before `repairAnthropicToolPairing`; optionally run `mergeAdjacentAnthropicUserMessages` again after repair.
 */
export function normalizeAnthropicMessagesForApi(
  messages: MessageParam[]
): MessageParam[] {
  let m = normalizeAnthropicAssistantBlocks(messages);
  m = mergeAdjacentAnthropicUserMessages(m);
  m = mergeAdjacentAnthropicPlainStringAssistants(m);
  return m;
}

/**
 * OpenAI: merge adjacent string users → merge plain string assistants.
 */
export function normalizeOpenAIMessagesForApi(messages: OAIMsg[]): OAIMsg[] {
  let m = mergeAdjacentOpenAIUserMessages(messages);
  m = mergeAdjacentOpenAIPlainStringAssistants(m);
  return m;
}
