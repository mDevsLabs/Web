import { randomUUID } from "node:crypto";
import type {
  AgentContextMode,
  AgentLifecycleStatus,
  AgentRunProfile,
  AgentSessionMessage,
  AgentSessionSnapshot,
  AgentSessionSnapshotAgent,
  AgentUserInputRequest,
} from "../../src/agentSessionTypes.js";
import {
  parseAgentAssistantPayload,
  toolCallMarkerLegacy,
  toolResultMarkerLegacy,
} from "../../src/agentStructuredMessage.js";
import { resolveProviderIdentityWithOverride } from "../../src/providerIdentitySettings.js";
import type { NestedAgentStreamEmit } from "../ipc/nestedAgentStream.js";
import { buildRelevantMemoryContextBlock } from "../memdir/findRelevantMemories.js";
import { extractMemoriesToDir } from "../services/extractMemories/extractMemories.js";
import type { ShellSettings } from "../settingsStore.js";
import type { ChatMessage } from "../threadStore.js";
import {
  appendAgentTranscript,
  getAgentSession,
  getAgentTranscriptPath,
  saveAgentSession,
  type ThreadTokenUsage,
} from "../threadStore.js";
import type { AgentLoopHandlers, AgentLoopOptions } from "./agentLoop.js";
import { runAgentLoop } from "./agentLoop.js";
import {
  ensureAgentMemoryDirExists,
  loadAgentMemoryPrompt,
} from "./agentMemory.js";
import { assembleAgentToolPool } from "./agentToolPool.js";
import { createRequestUserInputToolHandler } from "./requestUserInputTool.js";
import {
  buildSubagentSystemAppend,
  findConfiguredSubagent,
  resolveSubagentProfile,
} from "./subagentProfile.js";
import type { ToolExecutionHooks } from "./toolExecutor.js";

export type ManagedAgentUiEvent =
  | {
      threadId: string;
      type: "agent_session_sync";
      session: AgentSessionSnapshot;
    }
  | {
      threadId: string;
      type: "sub_agent_background_done";
      parentToolCallId: string;
      agentId: string;
      result: string;
      success: boolean;
    }
  | {
      threadId: string;
      type: "user_input_request";
      request: AgentUserInputRequest;
    };

type ManagedAgentEmitter = (evt: ManagedAgentUiEvent) => void;

type ManagedAgentRuntime = {
  threadId: string;
  agentId: string;
  parentAgentId: string | null;
  parentToolCallId: string;
  title: string;
  subagentType?: string;
  runProfile: AgentRunProfile;
  background: boolean;
  contextMode: AgentContextMode;
  contextTurns: number | null;
  settings: ShellSettings;
  options: Omit<AgentLoopOptions, "signal">;
  toolHooks?: ToolExecutionHooks;
  baseMessages: ChatMessage[];
  messages: ChatMessage[];
  queuedInputs: ChatMessage[];
  liveThinking: string;
  liveOutput: string;
  liveAssistantContent: string;
  lastAssistantFullContent: string;
  nestedEmit?: (evt: NestedAgentStreamEmit) => void;
  emit?: ManagedAgentEmitter;
  runAbortController: AbortController | null;
  runPromise: Promise<void> | null;
  pendingUserInput: AgentUserInputRequest | null;
  lastUsage?: ThreadTokenUsage;
  lastError: string | null;
  suppressCompletionEmit: boolean;
  closedAt: number | null;
  startedAt: number;
  updatedAt: number;
};

export type ManagedAgentSpawnContext = {
  threadId: string;
  parentToolCallId: string;
  parentAgentId?: string | null;
  task: string;
  context: string;
  subagentType?: string;
  background: boolean;
  settings: ShellSettings;
  options: Omit<AgentLoopOptions, "signal">;
  toolHooks?: ToolExecutionHooks;
  nestedEmit?: (evt: NestedAgentStreamEmit) => void;
  emit?: ManagedAgentEmitter;
  parentMessages?: ChatMessage[];
  forkContext?: boolean;
};

type ManagedAgentWaitStatus = {
  agentId: string;
  status: AgentLifecycleStatus | "not_found";
  lastResultSummary: string;
};

const runtimes = new Map<string, ManagedAgentRuntime>();
const threadAgentIds = new Map<string, Set<string>>();
const waitersByAgentId = new Map<
  string,
  Set<(status: ManagedAgentWaitStatus) => void>
>();
const MAX_LIVE_AGENT_SIDEBAR_CHARS = 20_000;

function ensureThreadAgentIds(threadId: string): Set<string> {
  const current = threadAgentIds.get(threadId);
  if (current) {
    return current;
  }
  const next = new Set<string>();
  threadAgentIds.set(threadId, next);
  return next;
}

function toSessionMessage(message: ChatMessage): AgentSessionMessage {
  return { content: message.content, role: message.role };
}

function summaryText(raw: string): string {
  const text = String(raw ?? "")
    .replace(/\r/g, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
  if (!text) {
    return "";
  }
  const first = text.split("\n")[0]?.trim() ?? "";
  return first.length > 160 ? `${first.slice(0, 160)}…` : first;
}

function tailText(raw: string): string {
  const text = String(raw ?? "");
  return text.length > MAX_LIVE_AGENT_SIDEBAR_CHARS
    ? text.slice(-MAX_LIVE_AGENT_SIDEBAR_CHARS)
    : text;
}

function hasAssistantFullContent(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) {
    return false;
  }
  const payload = parseAgentAssistantPayload(trimmed);
  return payload ? payload.parts.length > 0 : true;
}

function agentTitleForTask(task: string, subagentType?: string): string {
  const first =
    String(task ?? "")
      .replace(/\r/g, "")
      .split("\n")[0]
      ?.trim() ?? "";
  if (first) {
    return first.length > 72 ? `${first.slice(0, 72)}…` : first;
  }
  return subagentType?.trim() || "Agent";
}

function snapshotFromRuntime(
  runtime: ManagedAgentRuntime
): AgentSessionSnapshotAgent {
  const lastAssistantContent =
    runtime.messages
      .filter((message) => message.role === "assistant")
      .map((message) => message.content)
      .slice(-1)[0] ?? "";
  const exposeLiveTail = Boolean(runtime.runPromise);
  const liveThinking = exposeLiveTail ? tailText(runtime.liveThinking) : "";
  const liveOutput = exposeLiveTail ? tailText(runtime.liveOutput) : "";
  const liveAssistantContent = exposeLiveTail
    ? tailText(runtime.liveAssistantContent)
    : "";
  const fallbackResultSource =
    liveOutput ||
    liveThinking ||
    runtime.messages[runtime.messages.length - 1]?.content ||
    "";
  const lastResultSource = runtime.lastError ?? fallbackResultSource;
  return {
    background: runtime.background,
    childAgentIds: collectChildAgentIds(runtime.threadId, runtime.agentId),
    closedAt: runtime.closedAt,
    contextMode: runtime.contextMode,
    contextTurns: runtime.contextTurns,
    id: runtime.agentId,
    lastAssistantFullContent: runtime.lastAssistantFullContent,
    lastError: runtime.lastError,
    lastInputSummary: summaryText(
      runtime.messages
        .filter((message) => message.role === "user")
        .map((message) => message.content)
        .slice(-1)[0] ?? ""
    ),
    lastOutputSummary: summaryText(lastAssistantContent || liveOutput),
    lastResultSummary: summaryText(lastResultSource),
    liveAssistantContent,
    liveOutput,
    liveThinking,
    messages: runtime.messages.map(toSessionMessage),
    parentAgentId: runtime.parentAgentId,
    parentToolCallId: runtime.parentToolCallId,
    runProfile: runtime.runProfile,
    startedAt: runtime.startedAt,
    status: runtime.closedAt
      ? "closed"
      : runtime.pendingUserInput
        ? "waiting_input"
        : runtime.runPromise
          ? "running"
          : inferStoppedStatus(runtime),
    subagentType: runtime.subagentType,
    title: runtime.title,
    transcriptPath: getAgentTranscriptPath(runtime.threadId, runtime.agentId),
    updatedAt: runtime.updatedAt,
  };
}

function inferStoppedStatus(
  runtime: ManagedAgentRuntime
): AgentLifecycleStatus {
  if (runtime.closedAt) {
    return "closed";
  }
  if (runtime.pendingUserInput) {
    return "waiting_input";
  }
  if (runtime.lastError) {
    return "failed";
  }
  const last = runtime.messages[runtime.messages.length - 1];
  return last?.role === "assistant" ? "completed" : "completed";
}

function findPendingUserInput(threadId: string): AgentUserInputRequest | null {
  for (const agentId of ensureThreadAgentIds(threadId)) {
    const runtime = runtimes.get(agentId);
    if (runtime?.pendingUserInput) {
      return {
        ...runtime.pendingUserInput,
        questions: runtime.pendingUserInput.questions.map((question) => ({
          ...question,
          options: question.options.map((option) => ({ ...option })),
        })),
      };
    }
  }
  return null;
}

function getPersistedSession(threadId: string): AgentSessionSnapshot {
  return (
    getAgentSession(threadId) ?? {
      agents: {},
      pendingUserInput: null,
    }
  );
}

function collectChildAgentIds(
  threadId: string,
  parentAgentId: string
): string[] {
  const ids = ensureThreadAgentIds(threadId);
  const persistedAgents = getPersistedSession(threadId).agents;
  const out: string[] = [];
  for (const agentId of ids) {
    const runtime = runtimes.get(agentId);
    const childParentAgentId = runtime
      ? runtime.parentAgentId
      : persistedAgents[agentId]?.parentAgentId;
    if (childParentAgentId === parentAgentId) {
      out.push(agentId);
    }
  }
  return out;
}

function persistThreadSession(
  threadId: string,
  emit?: ManagedAgentEmitter
): AgentSessionSnapshot {
  const next: AgentSessionSnapshot = {
    agents: { ...getPersistedSession(threadId).agents },
    pendingUserInput: findPendingUserInput(threadId),
  };
  for (const agentId of ensureThreadAgentIds(threadId)) {
    const runtime = runtimes.get(agentId);
    if (!runtime) {
      continue;
    }
    next.agents[agentId] = snapshotFromRuntime(runtime);
  }
  saveAgentSession(threadId, next);
  emit?.({ session: next, threadId, type: "agent_session_sync" });
  return next;
}

function notifyWaiters(agentId: string): void {
  const listeners = waitersByAgentId.get(agentId);
  if (!listeners || listeners.size === 0) {
    return;
  }
  const runtime = runtimes.get(agentId);
  const status: ManagedAgentWaitStatus = runtime
    ? {
        agentId,
        lastResultSummary: snapshotFromRuntime(runtime).lastResultSummary,
        status: snapshotFromRuntime(runtime).status,
      }
    : {
        agentId,
        lastResultSummary: "",
        status: "not_found",
      };
  for (const listener of [...listeners]) {
    listener(status);
  }
}

function buildInitialMessages(
  task: string,
  context: string,
  parentMessages: ChatMessage[] | undefined,
  forkContext: boolean
): ChatMessage[] {
  const next: ChatMessage[] = [];
  if (
    forkContext &&
    Array.isArray(parentMessages) &&
    parentMessages.length > 0
  ) {
    next.push(
      ...parentMessages.filter(
        (message) => message.role === "user" || message.role === "assistant"
      )
    );
  }
  next.push({
    content: context ? `${task}\n\nContext:\n${context}` : task,
    role: "user",
  });
  return next;
}

export function spawnManagedAgent(
  ctx: ManagedAgentSpawnContext
): ManagedAgentRuntime {
  const agentId = randomUUID();
  const runProfile = resolveSubagentProfile(ctx.subagentType);
  const messages = buildInitialMessages(
    ctx.task,
    ctx.context,
    ctx.parentMessages,
    Boolean(ctx.forkContext)
  );
  const runtime: ManagedAgentRuntime = {
    agentId,
    background: ctx.background,
    baseMessages: messages.map((message) => ({ ...message })),
    closedAt: null,
    contextMode: ctx.forkContext ? "full" : "none",
    contextTurns: null,
    emit: ctx.emit,
    lastAssistantFullContent: "",
    lastError: null,
    lastUsage: undefined,
    liveAssistantContent: "",
    liveOutput: "",
    liveThinking: "",
    messages: messages.map((message) => ({ ...message })),
    nestedEmit: ctx.nestedEmit,
    options: ctx.options,
    parentAgentId: ctx.parentAgentId ?? null,
    parentToolCallId: ctx.parentToolCallId,
    pendingUserInput: null,
    queuedInputs: [],
    runAbortController: null,
    runProfile,
    runPromise: null,
    settings: ctx.settings,
    startedAt: Date.now(),
    subagentType: ctx.subagentType,
    suppressCompletionEmit: false,
    threadId: ctx.threadId,
    title: agentTitleForTask(ctx.task, ctx.subagentType),
    toolHooks: ctx.toolHooks,
    updatedAt: Date.now(),
  };
  runtimes.set(agentId, runtime);
  ensureThreadAgentIds(ctx.threadId).add(agentId);
  persistThreadSession(ctx.threadId, ctx.emit);
  return runtime;
}

async function runManagedAgent(runtime: ManagedAgentRuntime): Promise<void> {
  if (runtime.runPromise || runtime.closedAt) {
    return;
  }

  const abortController = new AbortController();
  runtime.runAbortController = abortController;
  runtime.lastError = null;
  runtime.liveThinking = "";
  runtime.liveOutput = "";
  runtime.liveAssistantContent = "";
  runtime.lastAssistantFullContent = "";
  const wsRootForSubagent = runtime.options.workspaceRoot ?? null;
  const matchedSubagent = findConfiguredSubagent(
    runtime.settings,
    runtime.subagentType,
    wsRootForSubagent
  );
  const subAppend = buildSubagentSystemAppend(
    runtime.settings,
    runtime.subagentType,
    wsRootForSubagent
  );
  const inheritedExploreToolDefs =
    runtime.runProfile === "explore"
      ? assembleAgentToolPool("plan", {
          mcpToolDenyPrefixes: runtime.settings.mcpToolDenyPrefixes,
        })
      : undefined;

  const runPromise = (async () => {
    let output = "";
    let errorMsg = "";
    let sessionSyncTimer: NodeJS.Timeout | null = null;
    const flushSessionSync = () => {
      if (sessionSyncTimer) {
        clearTimeout(sessionSyncTimer);
        sessionSyncTimer = null;
      }
      persistThreadSession(runtime.threadId, runtime.emit);
    };
    const scheduleSessionSync = () => {
      if (sessionSyncTimer) {
        return;
      }
      sessionSyncTimer = setTimeout(() => {
        sessionSyncTimer = null;
        persistThreadSession(runtime.threadId, runtime.emit);
      }, 250);
    };
    let agentMemoryAppend = "";
    let agentMemoryDir: string | null = null;
    if (matchedSubagent?.memoryScope && runtime.subagentType) {
      try {
        const subWs = runtime.options.workspaceRoot ?? null;
        agentMemoryDir = await ensureAgentMemoryDirExists(
          runtime.subagentType,
          matchedSubagent.memoryScope,
          subWs
        );
        agentMemoryAppend =
          loadAgentMemoryPrompt(
            runtime.subagentType,
            matchedSubagent.memoryScope,
            subWs
          )?.trim() ?? "";
      } catch {
        agentMemoryAppend = "";
        agentMemoryDir = null;
      }
    }
    let relevantAgentMemories = "";
    if (agentMemoryDir) {
      try {
        const query = runtime.messages
          .filter((message) => message.role !== "system")
          .map((message) => message.content)
          .slice(-3)
          .join("\n\n")
          .trim();
        relevantAgentMemories =
          (await buildRelevantMemoryContextBlock({
            label: "Relevant agent memories",
            memoryDirOverride: agentMemoryDir,
            modelSelection: runtime.options.modelSelection ?? "",
            query,
            settings: runtime.settings,
            signal: abortController.signal,
          })) ?? "";
      } catch {
        relevantAgentMemories = "";
      }
    }
    const mergedAppend = [
      runtime.options.agentSystemAppend?.trim(),
      subAppend?.trim(),
      agentMemoryAppend,
      relevantAgentMemories.trim(),
    ]
      .filter(Boolean)
      .join("\n\n");
    const customToolHandlers = {
      ...runtime.options.customToolHandlers,
      request_user_input: createRequestUserInputToolHandler({
        agentId: runtime.agentId,
        agentTitle: runtime.title,
        emit: (evt) => {
          if (evt.type === "user_input_request" && evt.request) {
            runtime.emit?.({
              request: evt.request as AgentUserInputRequest,
              threadId: runtime.threadId,
              type: "user_input_request",
            });
          }
        },
        onPendingChange: (request) => {
          runtime.pendingUserInput = request;
          runtime.updatedAt = Date.now();
          persistThreadSession(runtime.threadId, runtime.emit);
        },
        signal: abortController.signal,
        threadId: runtime.threadId,
      }),
    };
    const handlers: AgentLoopHandlers = {
      onDone: (fullContent, usage) => {
        runtime.lastAssistantFullContent = hasAssistantFullContent(fullContent)
          ? fullContent
          : "";
        runtime.lastUsage = usage
          ? {
              totalInput: usage.inputTokens ?? 0,
              totalOutput: usage.outputTokens ?? 0,
            }
          : runtime.lastUsage;
      },
      onError: (message) => {
        errorMsg = message;
      },
      onTextDelta: (text) => {
        output += text;
        runtime.liveOutput += text;
        runtime.liveAssistantContent += text;
        runtime.updatedAt = Date.now();
        appendAgentTranscript(runtime.threadId, runtime.agentId, text);
        scheduleSessionSync();
        runtime.nestedEmit?.({
          nestingDepth: 1,
          parentToolCallId: runtime.parentToolCallId,
          text,
          type: "delta",
        });
      },
      onThinkingDelta: (text) => {
        runtime.liveThinking += text;
        runtime.updatedAt = Date.now();
        appendAgentTranscript(runtime.threadId, runtime.agentId, text);
        scheduleSessionSync();
        runtime.nestedEmit?.({
          nestingDepth: 1,
          parentToolCallId: runtime.parentToolCallId,
          text,
          type: "thinking_delta",
        });
      },
      onToolCall: (name, args, toolUseId) => {
        runtime.updatedAt = Date.now();
        runtime.liveAssistantContent += toolCallMarkerLegacy(name, args);
        appendAgentTranscript(
          runtime.threadId,
          runtime.agentId,
          `\n[tool] ${name} ${JSON.stringify(args).slice(0, 200)}\n`
        );
        scheduleSessionSync();
        runtime.nestedEmit?.({
          args: JSON.stringify(args),
          name,
          nestingDepth: 1,
          parentToolCallId: runtime.parentToolCallId,
          toolCallId: toolUseId,
          type: "tool_call",
        });
      },
      onToolInputDelta: (payload) => {
        runtime.nestedEmit?.({
          index: payload.index,
          name: payload.name,
          nestingDepth: 1,
          parentToolCallId: runtime.parentToolCallId,
          partialJson: payload.partialJson,
          type: "tool_input_delta",
        });
      },
      onToolProgress: (payload) => {
        runtime.updatedAt = Date.now();
        scheduleSessionSync();
        runtime.nestedEmit?.({
          detail: payload.detail,
          name: payload.name,
          nestingDepth: 1,
          parentToolCallId: runtime.parentToolCallId,
          phase: payload.phase,
          type: "tool_progress",
        });
      },
      onToolResult: (name, result, success, toolUseId) => {
        runtime.updatedAt = Date.now();
        runtime.liveAssistantContent += toolResultMarkerLegacy(
          name,
          result,
          success
        );
        appendAgentTranscript(
          runtime.threadId,
          runtime.agentId,
          `\n[result] ${name} success=${success}\n`
        );
        scheduleSessionSync();
        runtime.nestedEmit?.({
          name,
          nestingDepth: 1,
          parentToolCallId: runtime.parentToolCallId,
          result,
          success,
          toolCallId: toolUseId,
          type: "tool_result",
        });
      },
    };

    try {
      await runAgentLoop(
        runtime.settings,
        runtime.messages,
        {
          ...runtime.options,
          composerMode:
            runtime.runProfile === "explore"
              ? "plan"
              : runtime.options.composerMode,
          signal: abortController.signal,
          ...(inheritedExploreToolDefs
            ? { toolPoolOverride: inheritedExploreToolDefs }
            : {}),
          customToolHandlers,
          delegateExecutionDepth: 1,
          toolHooks:
            runtime.runProfile === "full" || !runtime.toolHooks
              ? runtime.toolHooks
              : { ...runtime.toolHooks, afterWrite: undefined },
          ...(mergedAppend ? { agentSystemAppend: mergedAppend } : {}),
        },
        handlers
      );
      if (output) {
        runtime.messages.push({
          content: output || "(sub-agent completed with no output)",
          role: "assistant",
        });
      }
      runtime.updatedAt = Date.now();
      if (!errorMsg && agentMemoryDir && !abortController.signal.aborted) {
        await extractMemoriesToDir({
          memoryDir: agentMemoryDir,
          messages: runtime.messages,
          runtimeModel: {
            paradigm: runtime.options.paradigm,
            providerIdentity: resolveProviderIdentityWithOverride(
              runtime.settings.providerIdentity,
              runtime.options.requestProviderIdentity
            ),
            requestApiKey: runtime.options.requestApiKey,
            requestBaseURL: runtime.options.requestBaseURL,
            requestModelId: runtime.options.requestModelId,
            requestProxyUrl: runtime.options.requestProxyUrl,
            thinkingLevel: runtime.options.thinkingLevel,
          },
          workspaceRootForEntrypoint: null,
        });
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        errorMsg = runtime.closedAt ? "Closed by user." : "Interrupted.";
      } else {
        errorMsg = error instanceof Error ? error.message : String(error);
      }
    } finally {
      flushSessionSync();
      runtime.runAbortController = null;
      runtime.runPromise = null;
      if (errorMsg) {
        runtime.lastError = errorMsg;
      }
      if (!runtime.closedAt && runtime.queuedInputs.length === 0 && !errorMsg) {
        runtime.lastError = null;
      }
      persistThreadSession(runtime.threadId, runtime.emit);
      notifyWaiters(runtime.agentId);

      if (runtime.queuedInputs.length > 0 && !runtime.closedAt) {
        runtime.messages.push(
          ...runtime.queuedInputs.splice(0, runtime.queuedInputs.length)
        );
        persistThreadSession(runtime.threadId, runtime.emit);
        void runManagedAgent(runtime);
        return;
      }

      if (runtime.background && !runtime.suppressCompletionEmit) {
        runtime.emit?.({
          agentId: runtime.agentId,
          parentToolCallId: runtime.parentToolCallId,
          result: errorMsg
            ? `Sub-agent error: ${errorMsg}`
            : output || "(sub-agent completed with no output)",
          success: !errorMsg,
          threadId: runtime.threadId,
          type: "sub_agent_background_done",
        });
      }
    }
  })();

  runtime.runPromise = runPromise;
  persistThreadSession(runtime.threadId, runtime.emit);
  notifyWaiters(runtime.agentId);
  await runPromise;
}

export async function startManagedAgent(
  runtime: ManagedAgentRuntime
): Promise<void> {
  await runManagedAgent(runtime);
}

function getRuntime(agentId: string): ManagedAgentRuntime | null {
  return runtimes.get(agentId) ?? null;
}

function hydrateRuntimeFromSnapshot(
  threadId: string,
  agentId: string,
  settings: ShellSettings,
  options: Omit<AgentLoopOptions, "signal">,
  emit?: ManagedAgentEmitter
): ManagedAgentRuntime | null {
  const snapshot = getPersistedSession(threadId).agents[agentId];
  if (!snapshot) {
    return null;
  }
  const persistedSession = getPersistedSession(threadId);
  const runtime: ManagedAgentRuntime = {
    agentId,
    background: snapshot.background,
    baseMessages: snapshot.messages.map((message) => ({ ...message })),
    closedAt: snapshot.closedAt,
    contextMode: snapshot.contextMode,
    contextTurns: snapshot.contextTurns,
    emit,
    lastAssistantFullContent: snapshot.lastAssistantFullContent ?? "",
    lastError: snapshot.lastError,
    lastUsage: undefined,
    liveAssistantContent: snapshot.liveAssistantContent ?? "",
    liveOutput: snapshot.liveOutput ?? "",
    liveThinking: snapshot.liveThinking ?? "",
    messages: snapshot.messages.map((message) => ({ ...message })),
    nestedEmit: undefined,
    options,
    parentAgentId: snapshot.parentAgentId,
    parentToolCallId: snapshot.parentToolCallId,
    pendingUserInput:
      persistedSession.pendingUserInput?.agentId === agentId
        ? persistedSession.pendingUserInput
        : null,
    queuedInputs: [],
    runAbortController: null,
    runProfile: snapshot.runProfile,
    runPromise: null,
    settings,
    startedAt: snapshot.startedAt,
    subagentType: snapshot.subagentType,
    suppressCompletionEmit: false,
    threadId,
    title: snapshot.title,
    toolHooks: options.toolHooks,
    updatedAt: snapshot.updatedAt,
  };
  runtimes.set(agentId, runtime);
  ensureThreadAgentIds(threadId).add(agentId);
  return runtime;
}

export async function sendInputToManagedAgent(params: {
  threadId: string;
  agentId: string;
  message: string;
  interrupt?: boolean;
  settings: ShellSettings;
  options: Omit<AgentLoopOptions, "signal">;
  emit?: ManagedAgentEmitter;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const text = params.message.trim();
  if (!text) {
    return { error: "Message is required.", ok: false };
  }
  let runtime = getRuntime(params.agentId);
  if (!runtime) {
    runtime = hydrateRuntimeFromSnapshot(
      params.threadId,
      params.agentId,
      params.settings,
      params.options,
      params.emit
    );
  }
  if (!runtime) {
    return { error: "Agent not found.", ok: false };
  }
  runtime.emit = params.emit ?? runtime.emit;
  if (runtime.closedAt) {
    return { error: "Agent is closed.", ok: false };
  }
  runtime.pendingUserInput = null;
  const nextMessage: ChatMessage = { content: text, role: "user" };
  if (runtime.runPromise) {
    if (params.interrupt) {
      runtime.queuedInputs.push(nextMessage);
      runtime.runAbortController?.abort();
    } else {
      runtime.queuedInputs.push(nextMessage);
    }
    persistThreadSession(runtime.threadId, runtime.emit);
    return { ok: true };
  }
  runtime.messages.push(nextMessage);
  runtime.updatedAt = Date.now();
  persistThreadSession(runtime.threadId, runtime.emit);
  void runManagedAgent(runtime);
  return { ok: true };
}

export async function resumeManagedAgent(params: {
  threadId: string;
  agentId: string;
  settings: ShellSettings;
  options: Omit<AgentLoopOptions, "signal">;
  emit?: ManagedAgentEmitter;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  let runtime = getRuntime(params.agentId);
  if (!runtime) {
    runtime = hydrateRuntimeFromSnapshot(
      params.threadId,
      params.agentId,
      params.settings,
      params.options,
      params.emit
    );
  }
  if (!runtime) {
    return { error: "Agent not found.", ok: false };
  }
  runtime.emit = params.emit ?? runtime.emit;
  runtime.closedAt = null;
  runtime.pendingUserInput = null;
  runtime.updatedAt = Date.now();
  if (runtime.runPromise) {
    return { ok: true };
  }
  void runManagedAgent(runtime);
  return { ok: true };
}

export function closeManagedAgent(params: {
  threadId: string;
  agentId: string;
  emit?: ManagedAgentEmitter;
  suppressCompletionEmit?: boolean;
}): { ok: true } | { ok: false; error: string } {
  const runtime = getRuntime(params.agentId);
  if (!runtime) {
    return { error: "Agent not found.", ok: false };
  }
  runtime.emit = params.emit ?? runtime.emit;
  if (params.suppressCompletionEmit) {
    runtime.suppressCompletionEmit = true;
  }
  runtime.closedAt = Date.now();
  runtime.updatedAt = runtime.closedAt;
  runtime.pendingUserInput = null;
  runtime.queuedInputs.length = 0;
  runtime.runAbortController?.abort();
  persistThreadSession(runtime.threadId, runtime.emit);
  notifyWaiters(runtime.agentId);
  for (const childId of collectChildAgentIds(params.threadId, params.agentId)) {
    closeManagedAgent({
      agentId: childId,
      emit: params.emit,
      suppressCompletionEmit: params.suppressCompletionEmit,
      threadId: params.threadId,
    });
  }
  return { ok: true };
}

export function closeManagedAgentsForThread(params: {
  threadId: string;
  emit?: ManagedAgentEmitter;
  suppressCompletionEmit?: boolean;
}): { ok: true; closed: number } {
  let closed = 0;
  for (const agentId of [...ensureThreadAgentIds(params.threadId)]) {
    const runtime = getRuntime(agentId);
    if (!runtime || runtime.closedAt) {
      continue;
    }
    const result = closeManagedAgent({
      agentId,
      emit: params.emit,
      suppressCompletionEmit: params.suppressCompletionEmit,
      threadId: params.threadId,
    });
    if (result.ok) {
      closed += 1;
    }
  }
  return { closed, ok: true };
}

export function clearManagedAgentsForThread(params: {
  threadId: string;
  emit?: ManagedAgentEmitter;
}): { ok: true; cleared: number } {
  const ids = [...ensureThreadAgentIds(params.threadId)];
  closeManagedAgentsForThread({
    emit: params.emit,
    suppressCompletionEmit: true,
    threadId: params.threadId,
  });
  for (const agentId of ids) {
    runtimes.delete(agentId);
    waitersByAgentId.delete(agentId);
  }
  threadAgentIds.delete(params.threadId);
  const session: AgentSessionSnapshot = {
    agents: {},
    pendingUserInput: null,
  };
  saveAgentSession(params.threadId, session);
  params.emit?.({
    session,
    threadId: params.threadId,
    type: "agent_session_sync",
  });
  return { cleared: ids.length, ok: true };
}

export async function waitForManagedAgents(
  threadId: string,
  agentIds: string[],
  timeoutMs: number
): Promise<Record<string, ManagedAgentWaitStatus>> {
  const out: Record<string, ManagedAgentWaitStatus> = {};
  const pending = agentIds.filter(Boolean);
  if (pending.length === 0) {
    return out;
  }
  const settled = new Set<string>();
  for (const agentId of pending) {
    const runtime = getRuntime(agentId);
    const status = runtime
      ? snapshotFromRuntime(runtime).status
      : getPersistedSession(threadId).agents[agentId]?.status;
    if (
      !runtime ||
      !runtime.runPromise ||
      status === "completed" ||
      status === "failed" ||
      status === "closed"
    ) {
      const snapshot = runtime
        ? snapshotFromRuntime(runtime)
        : getPersistedSession(threadId).agents[agentId];
      out[agentId] = snapshot
        ? {
            agentId,
            lastResultSummary: snapshot.lastResultSummary,
            status: snapshot.status,
          }
        : { agentId, lastResultSummary: "", status: "not_found" };
      settled.add(agentId);
    }
  }
  if (settled.size === pending.length) {
    return out;
  }
  await new Promise<void>((resolve) => {
    const cleanup = () => {
      for (const agentId of pending) {
        const listeners = waitersByAgentId.get(agentId);
        if (!listeners) {
          continue;
        }
        for (const listener of [...listeners]) {
          if (
            (listener as unknown as { __wait_marker?: string })
              .__wait_marker === marker
          ) {
            listeners.delete(listener);
          }
        }
        if (listeners.size === 0) {
          waitersByAgentId.delete(agentId);
        }
      }
    };
    const finish = () => {
      cleanup();
      resolve();
    };
    const timer = setTimeout(finish, Math.max(1000, timeoutMs));
    const marker = randomUUID();
    for (const agentId of pending) {
      if (settled.has(agentId)) {
        continue;
      }
      const listener = ((status: ManagedAgentWaitStatus) => {
        out[agentId] = status;
        settled.add(agentId);
        if (settled.size === pending.length) {
          clearTimeout(timer);
          finish();
        }
      }) as ((status: ManagedAgentWaitStatus) => void) & {
        __wait_marker?: string;
      };
      listener.__wait_marker = marker;
      const listeners = waitersByAgentId.get(agentId) ?? new Set();
      listeners.add(listener);
      waitersByAgentId.set(agentId, listeners);
    }
  });
  return out;
}

export function getManagedAgentSession(
  threadId: string
): AgentSessionSnapshot | null {
  const ids = ensureThreadAgentIds(threadId);
  if (ids.size === 0) {
    return getAgentSession(threadId);
  }
  return persistThreadSession(threadId);
}

export function attachManagedAgentEmitter(
  threadId: string,
  emit: ManagedAgentEmitter
): void {
  for (const agentId of ensureThreadAgentIds(threadId)) {
    const runtime = runtimes.get(agentId);
    if (runtime) {
      runtime.emit = emit;
    }
  }
  const snapshot = getManagedAgentSession(threadId);
  if (snapshot) {
    emit({ session: snapshot, threadId, type: "agent_session_sync" });
  }
}

export function getManagedAgentTranscriptPath(
  threadId: string,
  agentId: string
): string | null {
  return getAgentTranscriptPath(threadId, agentId);
}
