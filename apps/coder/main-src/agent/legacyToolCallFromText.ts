/**
 * 部分 OpenAI 兼容网关（如小米）在 content 里输出 legacy `<tool_call>` XML，
 * 而不填充 `delta.tool_calls`。Agent / Ask 需从正文解析或剥离这些标记。
 */

import { randomUUID } from "node:crypto";

const TOOL_CALL_OPEN = '<tool_call tool="';
const TOOL_CALL_CLOSE = "</tool_call>";

export type LegacyToolCallFromText = {
  id: string;
  name: string;
  arguments: string;
};

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

function parseToolCallHeader(
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

/**
 * 从助手正文中提取完整 `<tool_call>` 块，返回剥离后的文本与可执行的 tool_calls。
 */
export function extractLegacyToolCallsFromAssistantText(
  text: string,
  idPrefix = "legacy_tc_"
): { text: string; toolCalls: LegacyToolCallFromText[] } {
  if (!text.includes(TOOL_CALL_OPEN)) {
    return { text, toolCalls: [] };
  }

  const toolCalls: LegacyToolCallFromText[] = [];
  const removeRanges: Array<{ start: number; end: number }> = [];
  let from = 0;

  while (from < text.length) {
    const start = text.indexOf(TOOL_CALL_OPEN, from);
    if (start === -1) break;
    const hdr = parseToolCallHeader(text, start);
    if (!hdr) break;
    const jsonEnd = skipJsonObject(text, hdr.jsonStart);
    if (jsonEnd === -1) break;
    const closeIdx = text.indexOf(TOOL_CALL_CLOSE, jsonEnd);
    if (closeIdx === -1) break;
    const argsRaw = text.slice(hdr.jsonStart, jsonEnd);
    try {
      JSON.parse(argsRaw || "{}");
    } catch {
      from = closeIdx + TOOL_CALL_CLOSE.length;
      continue;
    }
    toolCalls.push({
      arguments: argsRaw || "{}",
      id: `${idPrefix}${toolCalls.length}_${randomUUID()}`,
      name: hdr.name,
    });
    removeRanges.push({ end: closeIdx + TOOL_CALL_CLOSE.length, start });
    from = closeIdx + TOOL_CALL_CLOSE.length;
  }

  if (removeRanges.length === 0) {
    return { text, toolCalls: [] };
  }

  let cleaned = text;
  for (let i = removeRanges.length - 1; i >= 0; i--) {
    const r = removeRanges[i]!;
    cleaned = cleaned.slice(0, r.start) + cleaned.slice(r.end);
  }
  return { text: cleaned, toolCalls };
}

/** Ask 等无工具模式：仅移除完整 legacy tool_call 块，避免原始 XML 展示给用户。 */
export function stripLegacyToolCallMarkup(text: string): string {
  return extractLegacyToolCallsFromAssistantText(text).text;
}

const PARTIAL_TOOL_CALL_PREFIXES = [
  "<",
  "<t",
  "<to",
  "<too",
  "<tool",
  "<tool_",
  "<tool_c",
  "<tool_ca",
  "<tool_cal",
  "<tool_call",
  "<tool_call ",
  "<tool_call t",
  "<tool_call to",
  "<tool_call too",
  "<tool_call tool",
  "<tool_call tool=",
  '<tool_call tool="',
];

function trailingPartialToolCallPrefix(s: string): string {
  for (let len = PARTIAL_TOOL_CALL_PREFIXES.length - 1; len >= 0; len--) {
    const p = PARTIAL_TOOL_CALL_PREFIXES[len]!;
    if (s.endsWith(p)) return p;
  }
  return "";
}

/**
 * 流式过滤：不把 `<tool_call>…</tool_call>` 正文增量下发给 UI，结束时再解析工具调用。
 */
export function createLegacyToolCallStreamFilter(idPrefix = "legacy_tc_") {
  let pending = "";
  const toolCalls: LegacyToolCallFromText[] = [];

  const feed = (chunk: string): string => {
    if (!chunk) return "";
    pending += chunk;
    let visible = "";

    while (pending.length > 0) {
      const start = pending.indexOf(TOOL_CALL_OPEN);
      if (start === -1) {
        const partial = trailingPartialToolCallPrefix(pending);
        visible += pending.slice(0, pending.length - partial.length);
        pending = partial;
        break;
      }
      visible += pending.slice(0, start);
      pending = pending.slice(start);

      const hdr = parseToolCallHeader(pending, 0);
      if (!hdr) {
        const partial = trailingPartialToolCallPrefix(pending);
        if (partial) {
          pending = partial;
        }
        break;
      }
      const jsonEnd = skipJsonObject(pending, hdr.jsonStart);
      if (jsonEnd === -1) break;
      const closeIdx = pending.indexOf(TOOL_CALL_CLOSE, jsonEnd);
      if (closeIdx === -1) break;

      const argsRaw = pending.slice(hdr.jsonStart, jsonEnd);
      try {
        JSON.parse(argsRaw || "{}");
      } catch {
        pending = pending.slice(closeIdx + TOOL_CALL_CLOSE.length);
        continue;
      }

      toolCalls.push({
        arguments: argsRaw || "{}",
        id: `${idPrefix}${toolCalls.length}_${randomUUID()}`,
        name: hdr.name,
      });
      pending = pending.slice(closeIdx + TOOL_CALL_CLOSE.length);
    }

    return visible;
  };

  const finish = (): string => {
    const extracted = extractLegacyToolCallsFromAssistantText(
      pending,
      idPrefix
    );
    for (const tc of extracted.toolCalls) {
      toolCalls.push(tc);
    }
    pending = "";
    return extracted.text;
  };

  return {
    feed,
    finish,
    get toolCalls() {
      return toolCalls;
    },
  };
}
