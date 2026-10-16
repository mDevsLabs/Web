import { HttpsProxyAgent } from "https-proxy-agent";
import OpenAI from "openai";
import { parseAgentAssistantPayload } from "../../../src/agentStructuredMessage.js";
import {
  resolveProviderIdentityWithOverride,
} from "../../../src/providerIdentitySettings.js";
import { streamCodexOAuth } from "../../llm/codexOAuthAdapter.js";
import { formatLlmSdkError } from "../../llm/formatLlmSdkError.js";
import { withLlmTransportRetry } from "../../llm/llmTransportRetry.js";
import {
  composeSystem,
  temperatureForMode,
} from "../../llm/modePrompts.js";
import {
  applyOpenAIProviderIdentity,
  prependProviderIdentitySystemPrompt,
} from "../../llm/providerIdentity.js";
import {
  buildOpenAIUserContent,
} from "../../llm/resolvedUserSerialize.js";
import { llmSdkResponseHeadTimeoutMs } from "../../llm/sdkResponseHeadTimeoutMs.js";
import type { SendableMessage } from "../../llm/sendResolved.js";
import { userMessageTextForSend } from "../../llm/sendResolved.js";
import {
  createStreamTimeoutManager,
  resolveStreamTimeouts,
} from "../../llm/streamTimeouts.js";
import {
  openAICompatibleEffectiveTemperature,
  openAIReasoningEffort,
  resolveRequestedTemperature,
} from "../../llm/thinkingLevel.js";
import type { TurnTokenUsage } from "../../llm/types.js";
import type { ShellSettings } from "../../settingsStore.js";
import {
  compactOpenAIConversationForContext,
} from "../agentConversationContext.js";
import {
  isReadOnlyAgentTool,
  type ToolCall,
  type ToolResult,
  toOpenAITools,
} from "../agentTools.js";
import { repairOpenAIToolPairing } from "../apiConversationRepair.js";
import {
  createLegacyToolCallStreamFilter,
  extractLegacyToolCallsFromAssistantText,
} from "../legacyToolCallFromText.js";
import {
  mergeAdjacentOpenAIUserMessages,
  normalizeOpenAIMessagesForApi,
} from "../messageNormalizeForApi.js";
import { StructuredAssistantBuilder } from "../structuredAssistantBuilder.js";
import { expandStructuredAssistantPayloadToOpenAI } from "../structuredAssistantToApi.js";
import {
  executeTool,
  type ToolExecutionContext,
} from "../toolExecutor.js";
import {
  applyTurnToolResultBudget,
  normalizeToolResultReplacementState,
} from "../toolResultBudget.js";
import { createToolSearchToolHandler } from "../toolSearchTool.js";
import type {
  AgentLoopHandlers,
  AgentLoopOptions,
  BeforeExecuteToolResult,
  OAIMsg,
} from "./agentLoopTypes.js";
import {
  DEFAULT_MAX_CONSECUTIVE_MISTAKES,
  MAX_TOOL_CONCURRENCY,
  agentToolDefsForLoop,
  appendMcpToolsSystemHint,
  appendMessagesToOpenAIConversation,
  buildOpenAIViewImageFollowupMessage,
  createToolInputDeltaBatcher,
  emitDeferredToolStateChange,
  inferOpenAIToolNameFromPartialArguments,
  maxStreamingToolArgChars,
  normalizeDeferredToolStateForLoop,
  normalizeToolNameList,
  resolveAgentMaxRounds,
  runBatchWithLimit,
  shouldEmitToolInputDelta,
  synthesizeMissingOpenAIToolResults,
  unwrapAssistantContentEnvelope,
  visibleAgentToolDefsForLoop,
  yieldForToolInputStreamUi,
} from "./agentLoopUtils.js";

export function threadToOpenAI(
  messages: SendableMessage[],
  systemContent: string
): OAIMsg[] {
  const out: OAIMsg[] = [{ content: systemContent, role: "system" }];
  for (const m of messages) {
    if (m.role === "system") continue;
    if (m.role === "assistant") {
      const p = parseAgentAssistantPayload(m.content);
      if (p) {
        out.push(...expandStructuredAssistantPayloadToOpenAI(p));
      } else {
        out.push({ content: m.content, role: "assistant" });
      }
    } else {
      out.push({
        content:
          m.resolved && m.resolved.hasImages
            ? buildOpenAIUserContent(m.resolved)
            : userMessageTextForSend(m),
        role: "user",
      });
    }
  }
  return out;
}

export async function runOpenAILoop(
  settings: ShellSettings,
  threadMessages: SendableMessage[],
  options: AgentLoopOptions,
  handlers: AgentLoopHandlers
): Promise<void> {
  if (options.requestOAuthAuth?.provider === "codex") {
    await streamCodexOAuth(
      settings,
      threadMessages,
      {
        agentSystemAppend: options.agentSystemAppend,
        contextWindowTokens: options.contextWindowTokens,
        maxOutputTokens: options.maxOutputTokens,
        mode: options.composerMode,
        paradigm: options.paradigm,
        requestApiKey: options.requestApiKey,
        requestBaseURL: options.requestBaseURL,
        requestModelId: options.requestModelId,
        requestOAuthAuth: options.requestOAuthAuth,
        requestProviderId: options.requestProviderId,
        requestProviderIdentity: options.requestProviderIdentity,
        requestProxyUrl: options.requestProxyUrl,
        signal: options.signal,
        temperature: options.temperature,
        temperatureMode: options.temperatureMode,
        thinkingLevel: options.thinkingLevel,
        workspaceRoot: options.workspaceRoot,
      },
      {
        onDelta: handlers.onTextDelta,
        onDone: handlers.onDone,
        onError: handlers.onError,
        onThinkingDelta: handlers.onThinkingDelta,
      },
      options.requestOAuthAuth
    );
    return;
  }

  const key = options.requestApiKey.trim();
  if (!key) {
    handlers.onError("未配置 OpenAI 兼容 API Key。请在设置 → 模型中填写。");
    return;
  }

  const baseURL = options.requestBaseURL?.trim() || undefined;
  const model = options.requestModelId.trim();
  if (!model) {
    handlers.onError(
      "模型请求名称为空。请在 Models 中编辑该模型的「请求名称」。"
    );
    return;
  }

  const openaiSyncPrepStart = Date.now();

  const proxyRaw =
    (options.requestProxyUrl?.trim() || settings.openAI?.proxyUrl?.trim()) ??
    "";
  let httpAgent: InstanceType<typeof HttpsProxyAgent> | undefined;
  if (proxyRaw) {
    try {
      httpAgent = new HttpsProxyAgent(proxyRaw);
    } catch {
      handlers.onError("代理地址无效。");
      return;
    }
  }

  const client = new OpenAI(
    applyOpenAIProviderIdentity(
      settings,
      {
        apiKey: key,
        baseURL,
        dangerouslyAllowBrowser: false,
        httpAgent,
        maxRetries: 0,
        timeout: llmSdkResponseHeadTimeoutMs(),
      },
      options.requestProviderIdentity
    )
  );
  const storedSystem = threadMessages.find((m) => m.role === "system");
  const systemContent = appendMcpToolsSystemHint(
    prependProviderIdentitySystemPrompt(
      settings,
      composeSystem(
        storedSystem?.content,
        options.composerMode,
        options.agentSystemAppend
      ),
      options.requestProviderIdentity
    ),
    options.composerMode,
    settings
  );
  const requestedTemperature = resolveRequestedTemperature(
    temperatureForMode(options.composerMode),
    options.temperatureMode,
    options.temperature
  );
  const temperature =
    options.temperatureMode === "custom" && options.temperature != null
      ? requestedTemperature
      : openAICompatibleEffectiveTemperature(model, requestedTemperature);
  let deferredToolState = normalizeDeferredToolStateForLoop(
    options.deferredToolState,
    options.discoveredDeferredToolNames
  );
  const discoveredDeferredToolNames = new Set(
    deferredToolState.discoveredToolNames
  );
  const markDeferredToolsDiscovered = (names: string[]): string[] => {
    const added: string[] = [];
    for (const name of names) {
      const trimmed = String(name ?? "").trim();
      if (!trimmed || discoveredDeferredToolNames.has(trimmed)) {
        continue;
      }
      discoveredDeferredToolNames.add(trimmed);
      added.push(trimmed);
    }
    if (added.length > 0) {
      deferredToolState = normalizeDeferredToolStateForLoop({
        ...deferredToolState,
        discoveredToolNames: [...discoveredDeferredToolNames],
        providerLoadedToolNames: {
          ...(deferredToolState.providerLoadedToolNames ?? {}),
          openai: normalizeToolNameList([
            ...(deferredToolState.providerLoadedToolNames?.openai ?? []),
            ...added,
          ]),
        },
      });
      emitDeferredToolStateChange(options, deferredToolState);
    }
    return added;
  };
  const resolveFullToolPool = () =>
    agentToolDefsForLoop(
      options.composerMode,
      settings,
      options.toolPoolOverride
    );
  const resolveVisibleToolPool = () =>
    visibleAgentToolDefsForLoop(
      options.composerMode,
      settings,
      discoveredDeferredToolNames,
      options.toolPoolOverride
    );
  const resolveToolDefsByName = () =>
    new Map(resolveFullToolPool().map((tool) => [tool.name, tool] as const));
  const mergedCustomToolHandlers = {
    ToolSearch: createToolSearchToolHandler({
      discoverTools: markDeferredToolsDiscovered,
      resolveFullToolPool,
    }),
    ...(options.customToolHandlers ?? {}),
  };

  let conversation: OAIMsg[] = normalizeOpenAIMessagesForApi(
    threadToOpenAI(threadMessages, systemContent)
  );
  conversation = repairOpenAIToolPairing(conversation);
  conversation = mergeAdjacentOpenAIUserMessages(conversation);
  const structured = new StructuredAssistantBuilder();
  const effort = openAIReasoningEffort(options.thinkingLevel ?? "off");
  let accUsage: TurnTokenUsage | undefined;

  const mistakeLimitEnabled = options.mistakeLimitEnabled !== false;
  const threshold =
    options.maxConsecutiveMistakes ?? DEFAULT_MAX_CONSECUTIVE_MISTAKES;
  let consecutiveToolFailures = 0;
  let toolResultReplacementState = normalizeToolResultReplacementState(
    options.toolResultReplacementState
  );

  const MAX_OUTPUT_RECOVERY_LIMIT = 3;
  let outputRecoveryCount = 0;

  type TurnTc = { id: string; name: string; arguments: string };
  type OpenAIToolExecution = {
    call: TurnTc;
    args: Record<string, unknown>;
    result: ToolResult;
  };

  const toolDeltaBatcher = createToolInputDeltaBatcher((p) =>
    handlers.onToolInputDelta?.(p)
  );
  const maxToolArgChars = maxStreamingToolArgChars();
  const toolExecCtx: ToolExecutionContext = {
    customToolHandlers: mergedCustomToolHandlers,
    delegateExecutionDepth: options.delegateExecutionDepth ?? 0,
    extraReadableRoots: options.extraReadableRoots,
    hostWebContentsId: options.hostWebContentsId ?? null,
    signal: options.signal,
    teamToolRoleScope: options.teamToolRoleScope,
    threadId: options.threadId ?? null,
    workspaceLspManager: options.workspaceLspManager ?? null,
    workspaceRoot: options.workspaceRoot ?? null,
  };
  async function handleMistakeLimitBeforeRound(): Promise<boolean> {
    if (!mistakeLimitEnabled || consecutiveToolFailures < threshold) {
      return false;
    }
    if (options.onMistakeLimitReached) {
      const d = await options.onMistakeLimitReached({
        consecutiveFailures: consecutiveToolFailures,
        threshold,
      });
      if (d.action === "stop") {
        handlers.onDone(structured.serialize());
        return true;
      }
      if (d.action === "continue") {
        consecutiveToolFailures = 0;
      } else if (d.action === "hint") {
        consecutiveToolFailures = 0;
        conversation.push({
          content: `[User feedback after repeated tool failures]\n${d.userText}`,
          role: "user",
        });
      }
      return false;
    }
    consecutiveToolFailures = 0;
    return false;
  }

  async function runOneOpenAITool(tc: TurnTc): Promise<OpenAIToolExecution> {
    let args: Record<string, unknown>;
    try {
      args = JSON.parse(tc.arguments || "{}");
    } catch (parseErr) {
      const msg = `工具参数 JSON 无效：${parseErr instanceof Error ? parseErr.message : String(parseErr)}。请提供合法的 JSON。`;
      if (mistakeLimitEnabled) consecutiveToolFailures++;
      return {
        args: {},
        call: tc,
        result: {
          content: msg,
          isError: true,
          name: tc.name,
          toolCallId: tc.id,
        },
      };
    }

    const toolCall: ToolCall = { arguments: args, id: tc.id, name: tc.name };

    handlers.onToolCall(tc.name, args, tc.id);
    await new Promise<void>((r) => setTimeout(r, 0));

    const gateStart = Date.now();
    console.log(`[AgentLoop] tool=${tc.name} — beforeExecuteTool start`);
    let gate: BeforeExecuteToolResult = { proceed: true };
    if (options.beforeExecuteTool) {
      try {
        gate = await options.beforeExecuteTool(toolCall);
      } catch (e) {
        gate = {
          proceed: false,
          rejectionMessage: e instanceof Error ? e.message : String(e),
        };
      }
    }
    console.log(
      `[AgentLoop] tool=${tc.name} — beforeExecuteTool done (${Date.now() - gateStart}ms, proceed=${gate.proceed})`
    );
    if (!gate.proceed) {
      const msg = gate.rejectionMessage;
      if (mistakeLimitEnabled) consecutiveToolFailures++;
      return {
        args,
        call: tc,
        result: {
          content: msg,
          isError: true,
          name: tc.name,
          toolCallId: tc.id,
        },
      };
    }

    handlers.onToolProgress?.({ name: tc.name, phase: "executing" });
    const execStart = Date.now();
    console.log(`[AgentLoop] tool=${tc.name} — executeTool start`);
    const result = await executeTool(toolCall, options.toolHooks, toolExecCtx);
    console.log(
      `[AgentLoop] tool=${tc.name} — executeTool done (${Date.now() - execStart}ms, error=${result.isError})`
    );
    if (mistakeLimitEnabled) {
      if (result.isError) {
        consecutiveToolFailures++;
      } else {
        consecutiveToolFailures = 0;
      }
    }

    return { args, call: tc, result };
  }

  async function flushOpenAIToolsInOrder(
    turnToolCalls: TurnTc[]
  ): Promise<OAIMsg[]> {
    const withNames = turnToolCalls.filter((tc) => tc.name);
    const executed: OpenAIToolExecution[] = [];
    let i = 0;
    while (i < withNames.length) {
      const cur = withNames[i]!;
      if (isReadOnlyAgentTool(cur.name)) {
        let j = i;
        while (
          j < withNames.length &&
          isReadOnlyAgentTool(withNames[j]!.name)
        ) {
          j++;
        }
        const batch = withNames.slice(i, j);
        const outs = await runBatchWithLimit(
          batch.map((b) => () => runOneOpenAITool(b)),
          MAX_TOOL_CONCURRENCY
        );
        executed.push(...outs);
        i = j;
      } else {
        executed.push(await runOneOpenAITool(cur));
        i++;
      }
    }
    if (executed.length === 0) {
      return [];
    }
    const budgeted = await applyTurnToolResultBudget(
      executed.map((item) => item.result),
      resolveToolDefsByName(),
      toolResultReplacementState,
      toolExecCtx
    );
    toolResultReplacementState = budgeted.state;
    options.onToolResultReplacementStateChange?.(toolResultReplacementState);
    const toolMessages: OAIMsg[] = executed.map((item, index) => {
      const adjusted = budgeted.results[index]!;
      structured.pushTool(
        item.call.id,
        item.call.name,
        item.args,
        adjusted.content,
        !adjusted.isError,
        adjusted.structuredContent
      );
      handlers.onToolResult(
        item.call.name,
        adjusted.content,
        !adjusted.isError,
        item.call.id
      );
      return {
        content: adjusted.content,
        role: "tool",
        tool_call_id: item.call.id,
      };
    });
    const followup = buildOpenAIViewImageFollowupMessage(budgeted.results);
    return followup ? [...toolMessages, followup] : toolMessages;
  }

  const streamTimeoutConfig = resolveStreamTimeouts(settings);
  const maxRounds = resolveAgentMaxRounds(settings);
  console.log(
    `[AgentLoop] OpenAI sync prep done (${Date.now() - openaiSyncPrepStart}ms) convMsgs=${conversation.length} deferredLoaded=${discoveredDeferredToolNames.size} thread=${options.threadId ?? "n/a"}`
  );
  console.log(
    `[AgentLoop] OpenAI loop start — idleMs=${streamTimeoutConfig.idleMs} hardMs=${streamTimeoutConfig.hardMs} watchdog=${streamTimeoutConfig.idleWatchdogEnabled} maxRounds=${maxRounds ?? "∞"}`
  );

  for (let round = 0; maxRounds == null || round < maxRounds; round++) {
    if (options.signal.aborted) {
      console.log(`[AgentLoop] round ${round} — aborted before start`);
      break;
    }

    if (await handleMistakeLimitBeforeRound()) {
      return;
    }
    if (options.beforeRoundMessages) {
      const injected = await options.beforeRoundMessages();
      if (injected.length > 0) {
        conversation = appendMessagesToOpenAIConversation(
          conversation,
          injected
        );
      }
    }
    const compactedForContext = compactOpenAIConversationForContext(
      conversation,
      {
        apiKey: key,
        baseURL,
        contextWindowTokens: options.contextWindowTokens,
        maxOutputTokens: options.maxOutputTokens,
        model,
        onStateChange: options.onContextCompactStateChange,
        providerIdentity: resolveProviderIdentityWithOverride(
          settings.providerIdentity,
          options.requestProviderIdentity
        ),
        proxyUrl: proxyRaw || undefined,
        signal: options.signal,
        state: options.contextCompactState,
      }
    );
    const compactedForContextResolved = await compactedForContext;
    if (compactedForContextResolved.changed) {
      conversation = compactedForContextResolved.messages;
      console.log(
        `[AgentLoop] round ${round} — context compacted provider=openai mode=${compactedForContextResolved.mode} before=${compactedForContextResolved.estimatedTokensBefore} after=${compactedForContextResolved.estimatedTokensAfter} compactedMessages=${compactedForContextResolved.compactedMessages} clearedToolResults=${compactedForContextResolved.clearedToolResults}${compactedForContextResolved.error ? ` error=${compactedForContextResolved.error}` : ""}`
      );
    }

    console.log(`[AgentLoop] round ${round} — starting LLM call`);
    const roundStartAt = Date.now();
    const tools = toOpenAITools(resolveVisibleToolPool());
    let turnText = "";
    const turnToolCalls: TurnTc[] = [];
    const legacyToolStream = createLegacyToolCallStreamFilter(
      `legacy_r${round}_`
    );
    let turnFinishReason: string | null = null;

    // 每轮创建独立 AbortController，叠加在外部 signal 之上，用于超时自动中止
    const roundAc = new AbortController();
    const roundSignal = roundAc.signal;
    let activeStream: { controller?: { abort?: () => void } } | null = null;
    const onOuterAbort = () => {
      roundAc.abort();
      try {
        activeStream?.controller?.abort?.();
      } catch {
        /* ignore */
      }
    };
    // 修复竞态：若 signal 已 aborted，直接同步 abort roundAc
    if (options.signal.aborted) {
      roundAc.abort();
    } else {
      options.signal.addEventListener("abort", onOuterAbort, { once: true });
    }

    const timeoutMgr = createStreamTimeoutManager(streamTimeoutConfig, () =>
      roundAc.abort()
    );
    timeoutMgr.start();

    try {
      const stream = await withLlmTransportRetry(
        () =>
          client.chat.completions.create(
            {
              max_completion_tokens: options.maxOutputTokens,
              messages: conversation,
              model,
              stream: true,
              stream_options: { include_usage: true },
              temperature,
              tools,
              ...(effort ? { reasoning_effort: effort } : {}),
            },
            { signal: roundSignal }
          ),
        { signal: options.signal }
      );
      activeStream = stream as { controller?: { abort?: () => void } };

      for await (const chunk of stream) {
        if (roundSignal.aborted) break;
        timeoutMgr.onChunk();

        if (chunk.usage) {
          accUsage = {
            inputTokens:
              (accUsage?.inputTokens ?? 0) + (chunk.usage.prompt_tokens ?? 0),
            outputTokens:
              (accUsage?.outputTokens ?? 0) +
              (chunk.usage.completion_tokens ?? 0),
          };
        }

        const choice = chunk.choices[0];
        if (!choice) continue;

        if (choice.finish_reason) {
          turnFinishReason = choice.finish_reason;
        }

        const delta = choice.delta;
        if (!delta) continue;

        if (delta.content) {
          const visible = legacyToolStream.feed(delta.content);
          if (visible) {
            turnText += visible;
            handlers.onTextDelta(visible);
          }
        }

        // OpenAI 兼容：部分网关提供 reasoning_content（如 DeepSeek）
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const reasoningPiece = (delta as any)?.reasoning_content;
        if (typeof reasoningPiece === "string" && reasoningPiece) {
          handlers.onThinkingDelta?.(reasoningPiece);
        }

        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index;
            while (turnToolCalls.length <= idx) {
              turnToolCalls.push({ arguments: "", id: "", name: "" });
            }
            const row = turnToolCalls[idx]!;
            if (tc.id) row.id = tc.id;
            if (tc.function?.name) row.name = tc.function.name;
            if (tc.function?.arguments) {
              row.arguments += tc.function.arguments;
              const effectiveToolName =
                row.name ||
                inferOpenAIToolNameFromPartialArguments(row.arguments) ||
                "(pending)";
              if (row.arguments.length > maxToolArgChars) {
                throw new Error(
                  `Streaming tool arguments exceeded safe limit (${maxToolArgChars} chars) for ${effectiveToolName}.`
                );
              }
            }
            if (!row.arguments || !handlers.onToolInputDelta) continue;
            const effectiveName =
              row.name ||
              inferOpenAIToolNameFromPartialArguments(row.arguments);
            if (effectiveName && shouldEmitToolInputDelta(effectiveName)) {
              toolDeltaBatcher.queue({
                index: idx,
                name: effectiveName,
                partialJson: row.arguments,
              });
              await yieldForToolInputStreamUi(effectiveName);
            }
          }
        }
      }
      toolDeltaBatcher.flush();
    } catch (e: unknown) {
      toolDeltaBatcher.flush();
      timeoutMgr.stop();
      if (options.signal.aborted) {
        synthesizeMissingOpenAIToolResults(
          conversation,
          turnToolCalls,
          "已中止生成"
        );
        break;
      }
      if (roundSignal.aborted && !options.signal.aborted) {
        // 超时中止：保留已生成内容，以 onDone 结束而非 onError 丢弃
        const partialText = unwrapAssistantContentEnvelope(turnText);
        structured.appendText(partialText);
        handlers.onDone(structured.serialize(), accUsage);
        return;
      }
      const errText = formatLlmSdkError(e);
      synthesizeMissingOpenAIToolResults(conversation, turnToolCalls, errText);
      handlers.onError(errText);
      return;
    } finally {
      activeStream = null;
      options.signal.removeEventListener("abort", onOuterAbort);
    }
    timeoutMgr.stop();
    console.log(
      `[AgentLoop] round ${round} — stream done (${Date.now() - roundStartAt}ms), finishReason=${turnFinishReason}, toolCalls=${turnToolCalls.filter((tc) => tc.name).length}, textLen=${turnText.length}`
    );

    if (options.signal.aborted || roundSignal.aborted) {
      console.log(`[AgentLoop] round ${round} — aborted after stream`);
      synthesizeMissingOpenAIToolResults(
        conversation,
        turnToolCalls,
        "已中止生成"
      );
      break;
    }

    const legacyTail = legacyToolStream.finish();
    if (legacyTail) {
      turnText += legacyTail;
      handlers.onTextDelta(legacyTail);
    }

    turnText = unwrapAssistantContentEnvelope(turnText);
    const hasNativeToolCalls = turnToolCalls.some((tc) => tc.name);
    if (!hasNativeToolCalls) {
      let legacyCalls = legacyToolStream.toolCalls;
      if (legacyCalls.length === 0) {
        const legacyParsed = extractLegacyToolCallsFromAssistantText(
          turnText,
          `legacy_r${round}_`
        );
        turnText = legacyParsed.text;
        legacyCalls = legacyParsed.toolCalls;
      }
      for (const tc of legacyCalls) {
        turnToolCalls.push(tc);
      }
    }
    structured.appendText(turnText);

    if (turnToolCalls.length === 0 || turnToolCalls.every((tc) => !tc.name)) {
      // 检测 max_output_tokens 截断，尝试自动续写
      if (
        turnFinishReason === "length" &&
        outputRecoveryCount < MAX_OUTPUT_RECOVERY_LIMIT
      ) {
        outputRecoveryCount++;
        conversation.push({ content: turnText, role: "assistant" });
        conversation.push({
          content:
            "Output token limit hit. Resume directly — no apology, no recap of what you were doing. " +
            "Pick up mid-thought if that is where the cut happened. Break remaining work into smaller pieces.",
          role: "user",
        });
        continue;
      }
      conversation.push({ content: turnText, role: "assistant" });
      break;
    }

    const assistantMsg: OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam =
      {
        content: turnText || null,
        role: "assistant",
        tool_calls: turnToolCalls
          .filter((tc) => tc.name)
          .map((tc) => ({
            function: { arguments: tc.arguments, name: tc.name },
            id: tc.id,
            type: "function" as const,
          })),
      };
    conversation.push(assistantMsg);

    console.log(
      `[AgentLoop] round ${round} — executing ${turnToolCalls.filter((tc) => tc.name).length} tool(s)`
    );
    const toolsStart = Date.now();
    const toolMessages = await flushOpenAIToolsInOrder(turnToolCalls);
    conversation.push(...toolMessages);
    console.log(
      `[AgentLoop] round ${round} — tools done (${Date.now() - toolsStart}ms)`
    );

    if (maxRounds != null && round === maxRounds - 1) {
      console.warn(
        `[AgentLoop] max tool rounds (${maxRounds}) exhausted — ending loop`
      );
      const warn = `\n\n---\n⚠ 已达到单次对话最大工具轮次 (${maxRounds})，自动停止。请发送新消息继续。`;
      structured.appendText(warn);
      handlers.onTextDelta(warn);
    }
  }

  console.log("[AgentLoop] OpenAI loop ended — calling onDone");
  if (
    !accUsage ||
    ((accUsage.inputTokens ?? 0) === 0 && (accUsage.outputTokens ?? 0) === 0)
  ) {
    let inputChars = systemContent.length;
    for (const m of conversation) {
      if (typeof m.content === "string") inputChars += m.content.length;
      else if (Array.isArray(m.content))
        inputChars += JSON.stringify(m.content).length;
    }
    const serialized = structured.serialize();
    accUsage = {
      inputTokens: Math.max(1, Math.ceil(inputChars / 4)),
      outputTokens: Math.max(1, Math.ceil(serialized.length / 4)),
    };
  }
  handlers.onDone(structured.serialize(), accUsage);
}
