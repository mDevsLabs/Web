/**
 * Agent 实时回合的块级状态：避免依赖整条 streaming 字符串反复 segmentAssistantContentUnified。
 */

import {
  type AssistantSegment,
  buildStreamingToolSegments,
  finalizeAssistantSegmentsForRender,
  type StreamingToolPreview,
  segmentsFromClosedToolRound,
  segmentsFromPendingToolCall,
} from "./agentChatSegments";
import type { TFunction } from "./i18n";

let blockSeq = 0;
function nextId(prefix: string): string {
  blockSeq += 1;
  return `${prefix}-${blockSeq}`;
}

export type LiveToolPhase = "streaming_args" | "running" | "done";

export type LiveToolBlock = {
  id: string;
  type: "tool";
  /** OpenAI/Anthropic tool_use id；流式参数阶段可能为空串 */
  toolUseId: string;
  streamIndex: number;
  name: string;
  partialJson: string;
  argsJson: string;
  phase: LiveToolPhase;
  success?: boolean;
  resultText?: string;
};

export type LiveAgentBlock =
  | { id: string; type: "text"; text: string }
  | {
      id: string;
      type: "thinking";
      text: string;
      sealed?: boolean;
      startedAt: number;
      endedAt?: number;
    }
  | LiveToolBlock
  | {
      id: string;
      type: "tool_progress";
      toolName: string;
      phase: string;
      detail?: string;
    };

export type LiveAgentBlocksState = {
  blocks: LiveAgentBlock[];
};

export function createEmptyLiveAgentBlocks(): LiveAgentBlocksState {
  return { blocks: [] };
}

/** 块列表中 afterIndex 之后是否仅有根级 thinking（无工具/子 Agent 等），用于正文与思考交错流式时合并到同一段正文。 */
function onlyThinkingSuffixAfter(
  blocks: LiveAgentBlock[],
  afterIndex: number
): boolean {
  for (let k = afterIndex + 1; k < blocks.length; k++) {
    if (blocks[k]!.type !== "thinking") {
      return false;
    }
  }
  return true;
}

function appendRootText(
  blocks: LiveAgentBlock[],
  piece: string
): LiveAgentBlock[] {
  if (!piece) return blocks;
  const last = blocks[blocks.length - 1];
  if (last?.type === "text") {
    const copy = blocks.slice(0, -1);
    copy.push({ ...last, text: last.text + piece });
    return copy;
  }
  /**
   * 思考与正文 IPC 交错时，若仅在「某段正文」与当前末尾之间插入了 thinking 块，
   * 原先会把后续 delta 落成新的 text 块。每个 text 对应独立 ReactMarkdown + flex 子项，
   * 在「平滑流式」逐字揭示时会出现一字一行。此处把新正文合并回仍被尾部 thinking「挡住」的上一段 text。
   */
  for (let i = blocks.length - 1; i >= 0; i--) {
    const b = blocks[i]!;
    if (b.type !== "text") {
      continue;
    }
    if (!onlyThinkingSuffixAfter(blocks, i)) {
      continue;
    }
    const copy = blocks.slice();
    copy[i] = { ...b, text: b.text + piece };
    return copy;
  }
  return [...blocks, { id: nextId("txt"), text: piece, type: "text" }];
}

const THINKING_SOFT_CHUNK = 180;
const THINKING_HARD_CHUNK = 260;

function shouldSealThinkingChunk(text: string): boolean {
  if (!text.trim()) {
    return false;
  }
  if (text.endsWith("\n\n")) {
    return true;
  }
  const trimmed = text.trimEnd();
  if (trimmed.length < THINKING_SOFT_CHUNK) {
    return false;
  }
  if (/[。！？.!?]$/.test(trimmed)) {
    return true;
  }
  if (/\n$/.test(text)) {
    return true;
  }
  return text.length >= THINKING_HARD_CHUNK && /[\s)]$/.test(text);
}

function appendRootThinking(
  blocks: LiveAgentBlock[],
  piece: string
): LiveAgentBlock[] {
  if (!piece) return blocks;
  const base = blocks.slice();
  const stamp = Date.now();
  const lastBlock = base[base.length - 1];
  let current =
    lastBlock?.type === "thinking" && !lastBlock.sealed
      ? ({ ...lastBlock } as Extract<LiveAgentBlock, { type: "thinking" }>)
      : null;

  if (current) {
    base[base.length - 1] = current;
  }

  for (const char of piece) {
    if (!current) {
      current = {
        id: nextId("think"),
        sealed: false,
        startedAt: stamp,
        text: "",
        type: "thinking",
      };
      base.push(current);
    }
    current.text += char;
    if (shouldSealThinkingChunk(current.text)) {
      current.sealed = true;
      current.endedAt = stamp;
      current = null;
    }
  }

  return base;
}

function closeTrailingRootThinking(
  blocks: LiveAgentBlock[],
  endedAt = Date.now()
): LiveAgentBlock[] {
  let changed = false;
  const copy = blocks.slice();
  for (let i = copy.length - 1; i >= 0; i -= 1) {
    const block = copy[i];
    if (block?.type !== "thinking") {
      break;
    }
    if (block.sealed && block.endedAt != null) {
      continue;
    }
    copy[i] = {
      ...block,
      endedAt: block.endedAt ?? endedAt,
      sealed: true,
    };
    changed = true;
  }
  return changed ? copy : blocks;
}

function upsertToolStreaming(
  blocks: LiveAgentBlock[],
  index: number,
  name: string,
  partialJson: string
): LiveAgentBlock[] {
  const i = blocks.findIndex(
    (b): b is LiveToolBlock =>
      b.type === "tool" &&
      b.streamIndex === index &&
      b.phase === "streaming_args"
  );
  if (i >= 0) {
    const copy = blocks.slice();
    const cur = copy[i] as LiveToolBlock;
    copy[i] = { ...cur, name, partialJson };
    return copy;
  }
  return [
    ...blocks,
    {
      argsJson: "",
      id: nextId("tool"),
      name,
      partialJson,
      phase: "streaming_args" as const,
      streamIndex: index,
      toolUseId: "",
      type: "tool",
    },
  ];
}

function findToolBlockIndexByUseId(
  blocks: LiveAgentBlock[],
  toolUseId: string
): number {
  if (!toolUseId) {
    return -1;
  }
  return blocks.findIndex(
    (b): b is LiveToolBlock => b.type === "tool" && b.toolUseId === toolUseId
  );
}

function applyToolCallRoot(
  blocks: LiveAgentBlock[],
  name: string,
  argsJson: string,
  toolUseId: string
): LiveAgentBlock[] {
  const existingIdx = findToolBlockIndexByUseId(blocks, toolUseId);
  if (existingIdx >= 0) {
    const copy = blocks.slice();
    const cur = copy[existingIdx] as LiveToolBlock;
    copy[existingIdx] = {
      ...cur,
      argsJson,
      name,
      partialJson: argsJson,
      phase: cur.phase === "done" ? "done" : "running",
      toolUseId: toolUseId || cur.toolUseId,
    };
    return copy;
  }

  let idx = -1;
  for (let j = blocks.length - 1; j >= 0; j--) {
    const b = blocks[j];
    if (b?.type === "tool" && b.phase === "streaming_args") {
      idx = j;
      break;
    }
  }
  if (idx >= 0) {
    const cur = blocks[idx] as LiveToolBlock;
    const copy = blocks.slice();
    copy[idx] = {
      ...cur,
      argsJson,
      name,
      partialJson: argsJson,
      phase: "running",
      toolUseId: toolUseId || cur.toolUseId,
    };
    return copy;
  }
  return [
    ...blocks,
    {
      argsJson,
      id: nextId("tool"),
      name,
      partialJson: argsJson,
      phase: "running" as const,
      streamIndex: -1,
      toolUseId,
      type: "tool",
    },
  ];
}

function applyToolResultRoot(
  blocks: LiveAgentBlock[],
  toolUseId: string,
  name: string,
  result: string,
  success: boolean
): LiveAgentBlock[] {
  const copy = blocks.slice();
  let j = findToolBlockIndexByUseId(copy, toolUseId);
  if (j < 0) {
    j = copy.findIndex(
      (b): b is LiveToolBlock =>
        b.type === "tool" && b.phase === "running" && b.name === name
    );
  }
  if (j < 0) {
    j = copy.findIndex(
      (b): b is LiveToolBlock => b.type === "tool" && b.phase === "running"
    );
  }
  if (j >= 0) {
    const cur = copy[j] as LiveToolBlock;
    copy[j] = {
      ...cur,
      name: cur.name || name,
      phase: "done",
      resultText: result,
      success,
      toolUseId: toolUseId || cur.toolUseId,
    };
    return copy;
  }
  return [
    ...copy,
    {
      argsJson: "{}",
      id: nextId("tool"),
      name,
      partialJson: "",
      phase: "done",
      resultText: result,
      streamIndex: -2,
      success,
      toolUseId: toolUseId || nextId("orphan"),
      type: "tool",
    },
  ];
}

export type LiveAgentChatPayload =
  | {
      type: "delta";
      text: string;
      parentToolCallId?: string;
      nestingDepth?: number;
    }
  | {
      type: "thinking_delta";
      text: string;
      parentToolCallId?: string;
      nestingDepth?: number;
    }
  | {
      type: "tool_input_delta";
      name: string;
      partialJson: string;
      index: number;
      parentToolCallId?: string;
    }
  | {
      type: "tool_call";
      name: string;
      args: string;
      toolCallId: string;
      parentToolCallId?: string;
    }
  | {
      type: "tool_result";
      name: string;
      result: string;
      success: boolean;
      toolCallId: string;
      parentToolCallId?: string;
    }
  | {
      type: "tool_progress";
      name: string;
      phase: string;
      detail?: string;
      parentToolCallId?: string;
    };

/** 将 IPC 流事件折叠进块列表；子 Agent 流由 Agent session 侧栏承载，不写入主聊天块。 */
export function applyLiveAgentChatPayload(
  state: LiveAgentBlocksState,
  payload: LiveAgentChatPayload
): LiveAgentBlocksState {
  let { blocks } = state;
  if (payload.type !== "thinking_delta" || payload.parentToolCallId) {
    blocks = closeTrailingRootThinking(blocks);
  }

  if (payload.type === "delta") {
    if (payload.parentToolCallId) {
      return state;
    }
    blocks = appendRootText(blocks, payload.text);
    return { blocks };
  }

  if (payload.type === "thinking_delta") {
    if (!payload.parentToolCallId) {
      blocks = appendRootThinking(blocks, payload.text);
      return { blocks };
    }
    return state;
  }

  if (payload.type === "tool_input_delta") {
    if (payload.parentToolCallId) return state;
    blocks = upsertToolStreaming(
      blocks,
      payload.index,
      payload.name,
      payload.partialJson
    );
    return { blocks };
  }

  if (payload.type === "tool_call") {
    if (payload.parentToolCallId) return state;
    blocks = applyToolCallRoot(
      blocks,
      payload.name,
      payload.args,
      payload.toolCallId
    );
    return { blocks };
  }

  if (payload.type === "tool_result") {
    if (payload.parentToolCallId) return state;
    blocks = applyToolResultRoot(
      blocks,
      payload.toolCallId,
      payload.name,
      payload.result,
      payload.success
    );
    return { blocks };
  }

  if (payload.type === "tool_progress") {
    if (payload.parentToolCallId) return state;
    blocks = [
      ...blocks,
      {
        detail: payload.detail,
        id: nextId("prog"),
        phase: payload.phase,
        toolName: payload.name,
        type: "tool_progress",
      },
    ];
    return { blocks };
  }

  return state;
}

export function getActiveStreamingToolPreviewFromBlocks(
  blocks: LiveAgentBlock[]
): StreamingToolPreview | null {
  for (let i = blocks.length - 1; i >= 0; i--) {
    const b = blocks[i];
    if (b?.type === "tool" && b.phase === "streaming_args" && b.partialJson) {
      return { index: b.streamIndex, name: b.name, partialJson: b.partialJson };
    }
  }
  return null;
}

/**
 * Extract the latest TodoWrite todos from live agent blocks.
 *
 * Legacy TodoWrite-only — Task* tools are sub-agent management, not todos,
 * so they are intentionally NOT folded in.
 */
export function extractTodosFromLiveBlocks(blocks: LiveAgentBlock[]): Array<{
  id: string;
  content: string;
  status: "pending" | "in_progress" | "completed";
  activeForm?: string;
}> | null {
  let lastTodos: Array<{
    id: string;
    content: string;
    status: "pending" | "in_progress" | "completed";
    activeForm?: string;
  }> | null = null;
  for (const b of blocks) {
    if (b.type !== "tool" || b.name !== "TodoWrite") continue;
    // streaming_args 阶段的 partialJson 常会间歇性 parse 成功但语义错误（误显示已完成等）；只信 tool_call 落盘后的完整 args。
    if (b.phase === "streaming_args") continue;

    let parsedArgs: Record<string, unknown> = {};
    try {
      parsedArgs = JSON.parse(b.argsJson || b.partialJson || "{}");
    } catch {
      /* ignore */
    }
    const todosRaw = Array.isArray(parsedArgs.todos) ? parsedArgs.todos : [];
    if (todosRaw.length > 0) {
      lastTodos = todosRaw.map(
        (item: Record<string, unknown>, idx: number) => ({
          activeForm:
            typeof item.activeForm === "string" ? item.activeForm : undefined,
          content: String(item.content ?? ""),
          id: `live-todo-${idx}`,
          status: (["pending", "in_progress", "completed"].includes(
            String(item.status)
          )
            ? String(item.status)
            : "pending") as "pending" | "in_progress" | "completed",
        })
      );
    }
  }
  return lastTodos;
}

/** 块列表 → 与 ChatMarkdown 一致的 AssistantSegment[]（不经由整段 content 解析） */
export function liveBlocksToAssistantSegments(
  blocks: LiveAgentBlock[],
  t: TFunction
): AssistantSegment[] {
  const out: AssistantSegment[] = [];

  for (const b of blocks) {
    if (b.type === "text" && b.text.trim()) {
      out.push({ text: b.text, type: "markdown" });
    } else if (b.type === "thinking") {
      out.push({
        endedAt: b.endedAt,
        id: b.id,
        startedAt: b.startedAt,
        text: b.text,
        type: "thinking",
      });
    } else if (b.type === "tool_progress") {
      const text =
        b.detail != null && b.detail !== ""
          ? t("agent.toolProgress.detail", {
              detail: b.detail,
              name: b.toolName,
            })
          : b.phase === "executing"
            ? t("agent.toolProgress.executing", { name: b.toolName })
            : `${b.toolName} (${b.phase})`;
      out.push({
        status: "info",
        text,
        type: "activity",
      });
    } else if (b.type === "tool") {
      if (b.name === "TodoWrite") {
        if (b.phase === "streaming_args") {
          out.push({
            status: "pending",
            text: t("agent.toolPending", { name: t("agent.tool.TodoWrite") }),
            type: "activity",
          });
          continue;
        }
        let parsedArgs: Record<string, unknown> = {};
        try {
          parsedArgs = JSON.parse(b.argsJson || b.partialJson || "{}");
        } catch {
          /* ignore */
        }
        const todosRaw = Array.isArray(parsedArgs.todos)
          ? parsedArgs.todos
          : [];
        const todos = todosRaw.map(
          (item: Record<string, unknown>, idx: number) => ({
            activeForm:
              typeof item.activeForm === "string" ? item.activeForm : undefined,
            content: String(item.content ?? ""),
            id: `live-todo-${idx}`,
            status: (["pending", "in_progress", "completed"].includes(
              String(item.status)
            )
              ? String(item.status)
              : "pending") as "pending" | "in_progress" | "completed",
          })
        );
        if (todos.length > 0) {
          out.push({ todos, type: "plan_todo" });
        } else {
          out.push({
            status: b.phase === "running" ? "pending" : "success",
            text:
              b.phase === "running"
                ? t("agent.toolPending", { name: t("agent.tool.TodoWrite") })
                : t("agent.todoWrite.updated"),
            type: "activity",
          });
        }
        continue;
      }
      if (b.phase === "streaming_args") {
        out.push(
          ...buildStreamingToolSegments(
            { index: b.streamIndex, name: b.name, partialJson: b.partialJson },
            { t }
          )
        );
      } else if (b.phase === "running") {
        out.push(
          ...segmentsFromPendingToolCall(
            b.name,
            b.argsJson || b.partialJson || "{}",
            t
          )
        );
      } else if (b.phase === "done") {
        out.push(
          ...segmentsFromClosedToolRound(
            b.name,
            b.argsJson || "{}",
            b.resultText ?? "",
            b.success !== false,
            t
          )
        );
      }
    }
  }

  return finalizeAssistantSegmentsForRender(out);
}
