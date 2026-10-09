/**
 * 在把对话发给 LLM 之前做磁盘侧配对修复。
 *
 * - **Legacy XML**：移除无法按 FIFO 与 `<tool_call>` 配对的孤儿 `<tool_result>`。
 * - **结构化 JSON**：对重复 `toolUseId` 去重（对齐 CC 对重复 tool_use id 的防御）。
 *
 * 消息展开为 OpenAI/Anthropic 原生 tool 序列后的跨消息配对（孤儿 tool、缺结果补全等）
 * 由 `apiConversationRepair.ts` 在 `agentLoop` 内处理。
 *
 * @see D:/WebstormProjects/claude-code/claude-code-2.1.88/src/utils/messages.ts ensureToolResultPairing
 */

import {
  dedupeStructuredAssistantToolUseIds,
  isStructuredAssistantMessage,
} from "../../src/agentStructuredMessage.js";
import type { ChatMessage } from "../threadStore.js";

const TOOL_CALL_OPEN = '<tool_call tool="';
const TOOL_RESULT_OPEN = '<tool_result tool="';
const SUCCESS_MID = '" success="';

type ToolResultSpan = { index: number; name: string; fullEnd: number };

function findAllToolResultSpans(content: string): ToolResultSpan[] {
  const out: ToolResultSpan[] = [];
  let from = 0;
  while (from < content.length) {
    const start = content.indexOf(TOOL_RESULT_OPEN, from);
    if (start === -1) break;
    const nameStart = start + TOOL_RESULT_OPEN.length;
    const nameEnd = content.indexOf(SUCCESS_MID, nameStart);
    if (nameEnd === -1) break;
    const successStart = nameEnd + SUCCESS_MID.length;
    const successEnd = content.indexOf('">', successStart);
    if (successEnd === -1) break;
    const successRaw = content.slice(successStart, successEnd);
    if (successRaw !== "true" && successRaw !== "false") {
      from = successEnd + 2;
      continue;
    }
    const bodyStart = successEnd + 2;
    const closeTag = "</tool_result>";
    const closeIdx = content.indexOf(closeTag, bodyStart);
    if (closeIdx === -1) break;
    const name = content.slice(nameStart, nameEnd);
    out.push({ fullEnd: closeIdx + closeTag.length, index: start, name });
    from = closeIdx + closeTag.length;
  }
  return out;
}

function findResultSpanContaining(
  resultSpans: ToolResultSpan[],
  index: number
): ToolResultSpan | null {
  for (const r of resultSpans) {
    if (index >= r.index && index < r.fullEnd) return r;
  }
  return null;
}

function skipJsonObject(s: string, i: number): number {
  if (s[i] !== "{") return -1;
  let depth = 0;
  let state: "normal" | "string" | "escape" = "normal";
  for (let p = i; p < s.length; p++) {
    const ch = s[p]!;
    if (state === "escape") {
      state = "string";
      continue;
    }
    if (state === "string") {
      if (ch === "\\") state = "escape";
      else if (ch === '"') state = "normal";
      continue;
    }
    if (ch === '"') {
      state = "string";
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return p + 1;
    }
  }
  return -1;
}

type ToolCallSpan = { start: number; end: number; name: string };

function parseToolCallHeaderForRepair(
  content: string,
  absStart: number
): { name: string; jsonStart: number } | null {
  if (!content.startsWith(TOOL_CALL_OPEN, absStart)) return null;
  const nameStart = absStart + TOOL_CALL_OPEN.length;
  const nameQuote = content.indexOf('"', nameStart);
  if (nameQuote === -1) return null;
  const name = content.slice(nameStart, nameQuote);
  let pos = nameQuote + 1;
  while (pos < content.length && /\s/.test(content[pos]!)) pos++;
  while (pos < content.length && content[pos] !== ">") {
    if (content.startsWith('sub_parent="', pos)) {
      pos += 'sub_parent="'.length;
      const eq = content.indexOf('"', pos);
      if (eq === -1) return null;
      pos = eq + 1;
      while (pos < content.length && /\s/.test(content[pos]!)) pos++;
      continue;
    }
    if (content.startsWith('sub_depth="', pos)) {
      pos += 'sub_depth="'.length;
      const eq = content.indexOf('"', pos);
      if (eq === -1) return null;
      pos = eq + 1;
      while (pos < content.length && /\s/.test(content[pos]!)) pos++;
      continue;
    }
    return null;
  }
  if (pos >= content.length || content[pos] !== ">") return null;
  return { jsonStart: pos + 1, name };
}

function findAllCompleteToolCallSpans(
  content: string,
  resultSpans: ToolResultSpan[]
): ToolCallSpan[] {
  const out: ToolCallSpan[] = [];
  const close = "</tool_call>";
  let from = 0;
  while (from < content.length) {
    const start = content.indexOf(TOOL_CALL_OPEN, from);
    if (start === -1) break;
    if (findResultSpanContaining(resultSpans, start)) {
      from = start + TOOL_CALL_OPEN.length;
      continue;
    }
    const hdr = parseToolCallHeaderForRepair(content, start);
    if (!hdr) break;
    const { name, jsonStart } = hdr;
    const jsonEnd = skipJsonObject(content, jsonStart);
    if (jsonEnd === -1) break;
    const closeIdx = content.indexOf(close, jsonEnd);
    if (closeIdx === -1) break;
    out.push({ end: closeIdx + close.length, name, start });
    from = closeIdx + close.length;
  }
  return out;
}

/**
 * 从单条助手正文中移除无法与 tool_call 按 FIFO 配对的 tool_result 块。
 */
export function stripOrphanToolResultsFromAssistantContent(
  content: string
): string {
  if (!content.includes(TOOL_RESULT_OPEN)) return content;

  const resultSpans = findAllToolResultSpans(content);
  if (resultSpans.length === 0) return content;

  const callSpans = findAllCompleteToolCallSpans(content, resultSpans);

  type Ev = {
    kind: "call" | "result";
    name: string;
    start: number;
    end: number;
  };
  const events: Ev[] = [
    ...callSpans.map((c) => ({
      end: c.end,
      kind: "call" as const,
      name: c.name,
      start: c.start,
    })),
    ...resultSpans.map((r) => ({
      end: r.fullEnd,
      kind: "result" as const,
      name: r.name,
      start: r.index,
    })),
  ].sort((a, b) => a.start - b.start);

  const pending: string[] = [];
  const orphanRanges: Array<{ start: number; end: number }> = [];

  for (const ev of events) {
    if (ev.kind === "call") {
      pending.push(ev.name);
    } else if (pending.length > 0 && pending[0] === ev.name) {
      pending.shift();
    } else {
      orphanRanges.push({ end: ev.end, start: ev.start });
    }
  }

  if (orphanRanges.length === 0) return content;

  orphanRanges.sort((a, b) => b.start - a.start);
  let out = content;
  for (const r of orphanRanges) {
    out = out.slice(0, r.start) + out.slice(r.end);
  }
  return out;
}

/**
 * 修复 thread 中所有助手消息里的孤儿 tool_result（发 API 前调用）。
 */
export function repairAgentThreadMessagesForApi(
  messages: ChatMessage[]
): ChatMessage[] {
  return messages.map((m) => {
    if (m.role !== "assistant") return m;
    if (isStructuredAssistantMessage(m.content)) {
      const deduped = dedupeStructuredAssistantToolUseIds(m.content);
      return deduped === m.content ? m : { ...m, content: deduped };
    }
    const next = stripOrphanToolResultsFromAssistantContent(m.content);
    return next === m.content ? m : { ...m, content: next };
  });
}
