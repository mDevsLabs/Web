import type { BrowserWindow, WebContents } from "electron";
import { flattenAssistantTextPartsForSearch } from "../../src/agentStructuredMessage.js";
import { type AgentLoopOptions, runAgentLoop } from "../agent/agentLoop.js";
import { flushThreadSnapshots } from "../agent/agentSnapshotStore.js";
import { listAgentDiffChunks } from "../agent/applyAgentDiffs.js";
import { compressForSend } from "../agent/conversationCompress.js";
import {
  createMistakeLimitReachedHandler,
  type MistakeLimitDecision,
} from "../agent/mistakeLimitGate.js";
import { setPlanDraftRuntime } from "../agent/planDraftTool.js";
import { setPlanQuestionRuntime } from "../agent/planQuestionRuntime.js";
import { createRequestUserInputToolHandler } from "../agent/requestUserInputTool.js";
import { runTeamSession } from "../agent/teamOrchestrator.js";
import { createToolApprovalBeforeExecute } from "../agent/toolApprovalGate.js";
import {
  clearDelegateContext,
  setDelegateContext,
} from "../agent/toolExecutor.js";
import { countLineChangesBetweenTexts } from "../diffLineCount.js";
import { preconnectLlmBaseUrlIfEligible } from "../llm/apiPreconnect.js";
import type { ComposerMode, parseComposerMode } from "../llm/composerMode.js";
import { formatLlmSdkError } from "../llm/formatLlmSdkError.js";
import { streamChatUnified } from "../llm/llmRouter.js";
import { scheduleRefreshOpenAiModelCapabilitiesIfStale } from "../llm/modelContext.js";
import {
  resolveModelRequest,
  resolveThinkingLevelForSelection,
} from "../llm/modelResolve.js";
import { resolveMessagesForSend } from "../llm/sendResolved.js";
import { modeExpandsWorkspaceFileContext } from "../llm/workspaceContextExpand.js";
import { getWorkspaceLspManagerForWebContents } from "../lspSessionsByWebContents.js";
import {
  checkMaiQuotaAvailable,
  recordMaiTokenUsage,
  syncMaiAccountWithToken,
} from "../maiAccountStore.js";
import { queueExtractMemories } from "../services/extractMemories/extractMemories.js";
import { getSettings, resolveUsageStatsDataDir } from "../settingsStore.js";
import {
  accumulateTokenUsage,
  appendMessage,
  type ChatMessage,
  getContextCompactState,
  getDeferredToolState,
  getThread,
  getToolResultReplacementState,
  incrementThreadAgentToolCallCount,
  saveContextCompactState,
  saveDeferredToolState,
  saveSummary,
  saveTeamSession,
  saveToolResultReplacementState,
  setThreadGeneratedTitle,
  touchFileInThread,
  updateLastAssistant,
} from "../threadStore.js";
import { generateThreadTitle } from "../threadTitle.js";
import { getWorkspaceRootForWebContents } from "../workspace.js";
import {
  recordAgentLineDelta,
  recordTokenUsageEvent,
} from "../workspaceUsageStats.js";

/**
 * 主进程聊天运行时单例：把原 register.ts 里跨 IPC handler 共享的可变状态
 * （abort controllers、agent 写文件 snapshot、工具审批 / mistake 恢复 waiter、
 * thread 标题生成版本号）以及主管线 `runChatStream` 集中在一处。
 *
 * 拆分原则：
 *  - 这些状态都是"按 threadId 索引、跨多个 IPC handler 共享"的；放到模块顶层
 *    是最简单的单例形式，与原 register.ts 的语义完全一致。
 *  - `runChatStream` 是 `chat:sendMessage` / `chat:resend` / 三个 creator 模式
 *    （skill / rule / subagent）共用的同一段管线，故一并搬出。
 *
 * 不在这里：
 *  - preflight 流程的 abort 控制器（`preflightAbortByThread`）— 仅在 chat:* 几个
 *    handler 之间共享，等那几个 handler 一起迁移时再搬。
 */

export const abortByThread = new Map<string, AbortController>();
export const preflightAbortByThread = new Map<string, AbortController>();
export const agentRevertSnapshotsByThread = new Map<
  string,
  Map<string, string | null>
>();
const threadTitleGenerationVersion = new Map<string, number>();

/** 工具执行前用户确认：approvalId → resolve(allowed) */
export const toolApprovalWaiters = new Map<
  string,
  (approved: boolean) => void
>();
/** 连续失败后恢复：recoveryId → resolve(decision) */
export const mistakeLimitWaiters = new Map<
  string,
  (d: MistakeLimitDecision) => void
>();

export function activeUsageStatsDir(): string | null {
  return resolveUsageStatsDataDir(getSettings());
}

export function recordTurnTokenUsageStats(
  modelSelection: string,
  mode: ComposerMode,
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    cacheReadTokens?: number;
    cacheWriteTokens?: number;
  }
): void {
  recordTokenUsageEvent(activeUsageStatsDir(), {
    cacheRead: usage?.cacheReadTokens,
    cacheWrite: usage?.cacheWriteTokens,
    input: usage?.inputTokens,
    mode,
    modelId: modelSelection,
    output: usage?.outputTokens,
  });
}

export function triggerMaiUsageRefresh(): void {
  try {
    const s = getSettings();
    if (s.maiAccount?.jwtToken) {
      void syncMaiAccountWithToken(s.maiAccount.jwtToken).catch(() => {});
    }
  } catch {
    /* ignore */
  }
}

export function persistAssistantStreamError(
  threadId: string,
  message: string
): void {
  try {
    const lang = getSettings().language;
    const prefix =
      lang === "en" ? "Error: " : lang === "zh-CN" ? "错误：" : "Erreur : ";
    appendMessage(threadId, {
      content: `${prefix}${message}`,
      role: "assistant",
    });
  } catch (e) {
    console.warn(
      "[chat:stream] persist assistant error failed:",
      e instanceof Error ? e.message : e
    );
  }
}

export function appendSystemBlock(
  base: string | undefined,
  block: string
): string {
  const trimmed = block.trim();
  if (!trimmed) {
    return base ?? "";
  }
  return base && base.trim() ? `${base}\n\n---\n${trimmed}` : trimmed;
}

export function queueThreadTitleGeneration(params: {
  sender: WebContents;
  threadId: string;
  description: string;
  settings: ReturnType<typeof getSettings>;
  modelSelection: string;
  ruleContext?: string;
}): void {
  const description = String(params.description ?? "").trim();
  if (!description) {
    return;
  }
  const version = (threadTitleGenerationVersion.get(params.threadId) ?? 0) + 1;
  threadTitleGenerationVersion.set(params.threadId, version);
  void generateThreadTitle(
    params.settings,
    params.modelSelection,
    description,
    params.ruleContext ?? ""
  )
    .then((title) => {
      if (!title) {
        return;
      }
      if (threadTitleGenerationVersion.get(params.threadId) !== version) {
        return;
      }
      if (!setThreadGeneratedTitle(params.threadId, title)) {
        return;
      }
      try {
        params.sender.send("mai-coder:chat", {
          threadId: params.threadId,
          title,
          type: "thread_title_updated",
        });
      } catch {
        /* ignore */
      }
    })
    .catch(() => {
      /* ignore */
    })
    .finally(() => {
      if (threadTitleGenerationVersion.get(params.threadId) === version) {
        threadTitleGenerationVersion.delete(params.threadId);
      }
    });
}

export function resolveManagedAgentLoopOptions(
  settings: ReturnType<typeof getSettings>,
  workspaceRoot: string | null,
  workspaceLspManager: ReturnType<typeof getWorkspaceLspManagerForWebContents>,
  hostWebContentsId: number | null
): Omit<AgentLoopOptions, "signal"> | null {
  const modelSelection = String(settings.defaultModel ?? "").trim();
  if (!modelSelection) {
    return null;
  }
  const resolved = resolveModelRequest(settings, modelSelection);
  if (!resolved.ok) {
    return null;
  }
  const thinkingLevel = resolveThinkingLevelForSelection(
    settings,
    modelSelection
  );
  return {
    maxOutputTokens: resolved.maxOutputTokens,
    modelSelection,
    paradigm: resolved.paradigm,
    requestApiKey: resolved.apiKey,
    requestBaseURL: resolved.baseURL,
    requestModelId: resolved.requestModelId,
    requestOAuthAuth: resolved.oauthAuth,
    requestProviderId: resolved.providerId,
    requestProviderIdentity: resolved.providerIdentity,
    requestProxyUrl: resolved.proxyUrl,
    ...(resolved.contextWindowTokens == null
      ? {}
      : { contextWindowTokens: resolved.contextWindowTokens }),
    temperatureMode: resolved.temperatureMode,
    ...(resolved.temperature == null
      ? {}
      : { temperature: resolved.temperature }),
    composerMode: "agent",
    hostWebContentsId,
    thinkingLevel,
    workspaceLspManager,
    workspaceRoot,
  };
}

/**
 * 主聊天管线：根据 mode 选择 team / agent (含 plan) / 普通 streaming chat 三条路径。
 * 与原 register.ts:runChatStream 行为完全一致；abort、snapshot、approval waiter
 * 等共享状态也保持原语义。
 */
export function runChatStream(
  win: BrowserWindow,
  threadId: string,
  messages: ChatMessage[],
  mode: ReturnType<typeof parseComposerMode>,
  modelSelection: string,
  agentSystemAppend?: string,
  streamNonce?: number,
  extraReadableRoots?: string[]
): void {
  const send = (obj: unknown) => {
    const o = (typeof obj === "object" && obj !== null ? obj : {}) as Record<
      string,
      unknown
    >;
    win.webContents.send(
      "mai-coder:chat",
      streamNonce === undefined ? o : { ...o, streamNonce }
    );
  };
  const emitStreamError = (message: string) => {
    console.error("[chat:stream]", threadId, message);
    persistAssistantStreamError(threadId, message);
    send({ message, threadId, type: "error" });
  };
  const prev = abortByThread.get(threadId);
  prev?.abort();
  agentRevertSnapshotsByThread.set(threadId, new Map());
  // 新一轮开始：把上一轮残留的磁盘快照清掉，否则旧文件会和本轮 beforeWrite 写进来的内容混在一起。
  flushThreadSnapshots(threadId, null);
  const ac = new AbortController();
  abortByThread.set(threadId, ac);

  void (async () => {
    try {
      const settings = getSettings();
      const workspaceRoot = getWorkspaceRootForWebContents(win.webContents);
      const workspaceLspManager = getWorkspaceLspManagerForWebContents(
        win.webContents
      );
      const thinkingLevel = resolveThinkingLevelForSelection(
        settings,
        modelSelection
      );
      const resolved = resolveModelRequest(settings, modelSelection);
      if (!resolved.ok) {
        emitStreamError(resolved.message);
        return;
      }

      // Vérification du quota disponible avant de lancer la requête
      if (
        resolved.providerId === "mai" ||
        resolved.baseURL?.includes("mai.val.run")
      ) {
        const quota = await checkMaiQuotaAvailable(settings, true);
        if (!quota.available) {
          emitStreamError(
            quota.message || "Votre quota hebdomadaire mAI est épuisé."
          );
          return;
        }
      }

      // 首条对话前预热到当前模型 API 基址的 TCP/TLS（无代理时）
      preconnectLlmBaseUrlIfEligible({
        appProxyUrl:
          resolved.proxyUrl?.trim() ||
          settings.openAI?.proxyUrl?.trim() ||
          undefined,
        baseURL: resolved.baseURL,
        paradigm: resolved.paradigm,
      });

      // 发送端压缩：超长线程仅压缩发给 LLM 的副本，磁盘保留完整历史
      const thread = getThread(threadId);
      if (
        resolved.paradigm === "openai-compatible" &&
        resolved.oauthAuth?.provider !== "codex"
      ) {
        scheduleRefreshOpenAiModelCapabilitiesIfStale({
          apiKey: resolved.apiKey,
          baseURL: resolved.baseURL,
          providerIdentity: resolved.providerIdentity,
          proxyUrl: resolved.proxyUrl,
        });
      }
      const compressOptions = {
        maxOutputTokens: resolved.maxOutputTokens,
        mode: mode as ComposerMode,
        paradigm: resolved.paradigm,
        requestApiKey: resolved.apiKey,
        requestBaseURL: resolved.baseURL,
        requestModelId: resolved.requestModelId,
        requestOAuthAuth: resolved.oauthAuth,
        requestProviderId: resolved.providerId,
        requestProviderIdentity: resolved.providerIdentity,
        requestProxyUrl: resolved.proxyUrl,
        signal: ac.signal,
        ...(resolved.contextWindowTokens == null
          ? {}
          : { contextWindowTokens: resolved.contextWindowTokens }),
        temperatureMode: resolved.temperatureMode,
        ...(resolved.temperature == null
          ? {}
          : { temperature: resolved.temperature }),
        thinkingLevel,
      };
      if (mode === "team") {
        setPlanQuestionRuntime({
          emit: (evt) => send({ threadId, ...evt }),
          signal: ac.signal,
          threadId,
        });
        try {
          await runTeamSession({
            agentSystemAppend,
            deferredToolState: getDeferredToolState(threadId),
            emit: (evt) => send(evt),
            extraReadableRoots,
            hostWebContentsId: win.webContents.id,
            messages,
            modelSelection,
            onDeferredToolStateChange: (state) =>
              saveDeferredToolState(threadId, state),
            onDone: (full, usage, teamSnapshot) => {
              updateLastAssistant(threadId, full);
              accumulateTokenUsage(
                threadId,
                usage?.inputTokens,
                usage?.outputTokens
              );
              recordTurnTokenUsageStats(modelSelection, mode, usage);
              const turnTokens =
                (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0);
              if (turnTokens > 0) {
                void recordMaiTokenUsage(turnTokens);
              }
              if (teamSnapshot) {
                saveTeamSession(threadId, teamSnapshot);
              }
              queueExtractMemories({
                modelSelection,
                settings,
                threadId,
                workspaceRoot,
              });
              triggerMaiUsageRefresh();
              send({ text: full, threadId, type: "done", usage });
            },
            onError: (message) => emitStreamError(message),
            onToolResultReplacementStateChange: (state) =>
              saveToolResultReplacementState(threadId, state),
            resolvedModel: resolved,
            settings,
            signal: ac.signal,
            thinkingLevel,
            threadId,
            toolResultReplacementState: getToolResultReplacementState(threadId),
            workspaceLspManager,
            workspaceRoot,
          });
        } finally {
          setPlanQuestionRuntime(null);
        }
        return;
      }

      const compressResult = await compressForSend(
        messages,
        settings,
        compressOptions,
        thread?.summary,
        thread?.summaryCoversMessageCount
      );
      const sendMessages = compressResult.messages;
      if (
        compressResult.newSummary &&
        compressResult.newSummaryCoversCount !== undefined
      ) {
        saveSummary(
          threadId,
          compressResult.newSummary,
          compressResult.newSummaryCoversCount
        );
      }

      if (
        (mode === "agent" || mode === "plan") &&
        resolved.paradigm !== "gemini"
      ) {
        const beforeExecuteTool = createToolApprovalBeforeExecute(
          send,
          threadId,
          ac.signal,
          () => getSettings().agent,
          toolApprovalWaiters
        );
        const onMistakeLimitReached = createMistakeLimitReachedHandler(
          send,
          threadId,
          ac.signal,
          mistakeLimitWaiters
        );
        const ag = getSettings().agent;
        const deferredToolState = getDeferredToolState(threadId);
        const toolResultReplacementState =
          getToolResultReplacementState(threadId);
        const customToolHandlers = {
          request_user_input: createRequestUserInputToolHandler({
            agentId: "root",
            agentTitle: mode === "plan" ? "Plan Assistant" : "Root Agent",
            emit: (evt) => send({ threadId, ...evt }),
            signal: ac.signal,
            threadId,
          }),
        };
        const agentOptions = {
          maxOutputTokens: resolved.maxOutputTokens,
          modelSelection,
          paradigm: resolved.paradigm,
          requestApiKey: resolved.apiKey,
          requestBaseURL: resolved.baseURL,
          requestModelId: resolved.requestModelId,
          requestOAuthAuth: resolved.oauthAuth,
          requestProviderId: resolved.providerId,
          requestProviderIdentity: resolved.providerIdentity,
          requestProxyUrl: resolved.proxyUrl,
          ...(resolved.contextWindowTokens == null
            ? {}
            : { contextWindowTokens: resolved.contextWindowTokens }),
          temperatureMode: resolved.temperatureMode,
          ...(resolved.temperature == null
            ? {}
            : { temperature: resolved.temperature }),
          beforeExecuteTool,
          composerMode: mode,
          customToolHandlers,
          deferredToolState,
          extraReadableRoots,
          hostWebContentsId: win.webContents.id,
          maxConsecutiveMistakes: ag?.maxConsecutiveMistakes,
          mistakeLimitEnabled: ag?.mistakeLimitEnabled,
          onDeferredToolStateChange: (
            state: ReturnType<typeof getDeferredToolState>
          ) => saveDeferredToolState(threadId, state),
          onMistakeLimitReached,
          onToolResultReplacementStateChange: (
            state: ReturnType<typeof getToolResultReplacementState>
          ) => saveToolResultReplacementState(threadId, state),
          signal: ac.signal,
          thinkingLevel,
          toolResultReplacementState,
          workspaceLspManager,
          workspaceRoot,
        };
        try {
          setDelegateContext(
            settings,
            agentOptions,
            ac.signal,
            (evt) => send({ threadId, ...evt }),
            threadId,
            (evt) => send(evt),
            (payload) =>
              send({
                agentId: payload.agentId,
                parentToolCallId: payload.parentToolCallId,
                result: payload.result,
                success: payload.success,
                threadId,
                type: "sub_agent_background_done",
              }),
            messages
          );
          setPlanQuestionRuntime({
            emit: (evt) => send({ threadId, ...evt }),
            signal: ac.signal,
            threadId,
          });
          if (mode === "plan") {
            setPlanDraftRuntime(threadId, {
              onDraft: () => {
                // Renderer persists the visible draft from tool arguments and keeps the review UI in sync.
              },
            });
          }
          const expandMode = mode as ComposerMode;
          const doAtExpand = modeExpandsWorkspaceFileContext(expandMode);
          const messagesForAgent = doAtExpand
            ? await resolveMessagesForSend(sendMessages, workspaceRoot)
            : sendMessages;
          await runAgentLoop(
            settings,
            messagesForAgent,
            {
              maxOutputTokens: resolved.maxOutputTokens,
              modelSelection,
              paradigm: resolved.paradigm,
              requestApiKey: resolved.apiKey,
              requestBaseURL: resolved.baseURL,
              requestModelId: resolved.requestModelId,
              requestOAuthAuth: resolved.oauthAuth,
              requestProviderId: resolved.providerId,
              requestProviderIdentity: resolved.providerIdentity,
              requestProxyUrl: resolved.proxyUrl,
              ...(resolved.contextWindowTokens == null
                ? {}
                : { contextWindowTokens: resolved.contextWindowTokens }),
              temperatureMode: resolved.temperatureMode,
              ...(resolved.temperature == null
                ? {}
                : { temperature: resolved.temperature }),
              beforeExecuteTool,
              composerMode: mode,
              contextCompactState: getContextCompactState(threadId),
              customToolHandlers,
              deferredToolState,
              extraReadableRoots,
              hostWebContentsId: win.webContents.id,
              maxConsecutiveMistakes: ag?.maxConsecutiveMistakes,
              mistakeLimitEnabled: ag?.mistakeLimitEnabled,
              onContextCompactStateChange: (state) =>
                saveContextCompactState(threadId, state),
              onDeferredToolStateChange: (state) =>
                saveDeferredToolState(threadId, state),
              onMistakeLimitReached,
              onToolResultReplacementStateChange: (state) =>
                saveToolResultReplacementState(threadId, state),
              signal: ac.signal,
              thinkingLevel,
              threadId,
              toolHooks: {
                beforeWrite: ({ path, previousContent }) => {
                  const snapshots = agentRevertSnapshotsByThread.get(threadId);
                  if (!snapshots || snapshots.has(path)) {
                    touchFileInThread(threadId, path, "modified", false);
                    return;
                  }
                  snapshots.set(path, previousContent);
                  flushThreadSnapshots(threadId, snapshots);
                  touchFileInThread(
                    threadId,
                    path,
                    previousContent === null ? "created" : "modified",
                    previousContent === null
                  );
                },
                ...(mode === "agent" && activeUsageStatsDir()
                  ? {
                      afterWrite: ({ previousContent, nextContent }) => {
                        const { additions, deletions } =
                          countLineChangesBetweenTexts(
                            previousContent,
                            nextContent
                          );
                        recordAgentLineDelta(activeUsageStatsDir(), {
                          add: additions,
                          del: deletions,
                        });
                      },
                    }
                  : {}),
              },
              toolResultReplacementState,
              workspaceLspManager,
              workspaceRoot,
              ...(agentSystemAppend?.trim()
                ? { agentSystemAppend: agentSystemAppend.trim() }
                : {}),
            },
            {
              onDone: (full, usage) => {
                updateLastAssistant(threadId, full);
                accumulateTokenUsage(
                  threadId,
                  usage?.inputTokens,
                  usage?.outputTokens
                );
                recordTurnTokenUsageStats(modelSelection, mode, usage);
                const turnTokens =
                  (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0);
                if (turnTokens > 0) {
                  void recordMaiTokenUsage(turnTokens);
                }
                queueExtractMemories({
                  modelSelection,
                  settings,
                  threadId,
                  workspaceRoot,
                });
                triggerMaiUsageRefresh();
                send({ text: full, threadId, type: "done", usage });
              },
              onError: (message) => emitStreamError(message),
              onTextDelta: (piece) =>
                send({ text: piece, threadId, type: "delta" }),
              onThinkingDelta: (text) =>
                send({ text, threadId, type: "thinking_delta" }),
              onToolCall: (name, args, toolCallId) =>
                send({
                  args: JSON.stringify(args),
                  name,
                  threadId,
                  toolCallId,
                  type: "tool_call",
                }),
              onToolInputDelta: (p) =>
                send({
                  index: p.index,
                  name: p.name,
                  partialJson: p.partialJson,
                  threadId,
                  type: "tool_input_delta",
                }),
              onToolProgress: (p) =>
                send({
                  detail: p.detail,
                  name: p.name,
                  phase: p.phase,
                  threadId,
                  type: "tool_progress",
                }),
              onToolResult: (name, result, success, toolCallId) => {
                incrementThreadAgentToolCallCount(threadId);
                send({
                  name,
                  result,
                  success,
                  threadId,
                  toolCallId,
                  type: "tool_result",
                });
              },
            }
          );
        } finally {
          clearDelegateContext();
          setPlanQuestionRuntime(null);
          if (mode === "plan") {
            setPlanDraftRuntime(threadId, null);
          }
        }
        return;
      }

      await streamChatUnified(
        settings,
        sendMessages,
        {
          maxOutputTokens: resolved.maxOutputTokens,
          mode,
          paradigm: resolved.paradigm,
          requestApiKey: resolved.apiKey,
          requestBaseURL: resolved.baseURL,
          requestModelId: resolved.requestModelId,
          requestOAuthAuth: resolved.oauthAuth,
          requestProviderId: resolved.providerId,
          requestProviderIdentity: resolved.providerIdentity,
          requestProxyUrl: resolved.proxyUrl,
          signal: ac.signal,
          temperatureMode: resolved.temperatureMode,
          ...(resolved.temperature == null
            ? {}
            : { temperature: resolved.temperature }),
          thinkingLevel,
          workspaceRoot,
          ...(agentSystemAppend?.trim()
            ? { agentSystemAppend: agentSystemAppend.trim() }
            : {}),
        },
        {
          onDelta: (piece) => send({ text: piece, threadId, type: "delta" }),
          onDone: (full, usage) => {
            updateLastAssistant(threadId, full);
            accumulateTokenUsage(
              threadId,
              usage?.inputTokens,
              usage?.outputTokens
            );
            recordTurnTokenUsageStats(modelSelection, mode, usage);
            const turnTokens =
              (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0);
            if (turnTokens > 0) {
              void recordMaiTokenUsage(turnTokens);
            }
            queueExtractMemories({
              modelSelection,
              settings,
              threadId,
              workspaceRoot,
            });
            triggerMaiUsageRefresh();
            if (mode === "agent") {
              const listed = listAgentDiffChunks(
                flattenAssistantTextPartsForSearch(full)
              );
              if (listed.length > 0) {
                send({
                  pendingAgentPatches: listed.map((p, i) => ({
                    chunk: p.chunk,
                    id: `p-${i}`,
                    relPath: p.relPath,
                  })),
                  text: full,
                  threadId,
                  type: "done",
                  usage,
                });
                return;
              }
            }
            send({ text: full, threadId, type: "done", usage });
          },
          onError: (message) => emitStreamError(message),
          onThinkingDelta: (text) =>
            send({ text, threadId, type: "thinking_delta" }),
        }
      );
    } catch (e) {
      try {
        emitStreamError(formatLlmSdkError(e));
      } catch {
        /* window may be destroyed */
      }
    } finally {
      abortByThread.delete(threadId);
    }
  })();
}
