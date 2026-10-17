import type Anthropic from "@anthropic-ai/sdk";
import type {
  ContentBlockParam,
  MessageParam,
} from "@anthropic-ai/sdk/resources/messages";
import { HttpsProxyAgent } from "https-proxy-agent";
import { parseAgentAssistantPayload } from "../../../src/agentStructuredMessage.js";
import {
  resolveProviderIdentityWithOverride,
} from "../../../src/providerIdentitySettings.js";
import type {
  AnthropicToolResultBlock,
  AnthropicToolSchema,
} from "../../llm/anthropicBeta.js";
import {
  type AnthropicCacheBreakpointDecision,
  addAnthropicCacheBreakpoints,
  buildAnthropicSystemForApi,
  isAnthropicPromptCachingEnabled,
  observeAnthropicPromptCacheUsage,
} from "../../llm/anthropicPromptCache.js";
import { formatLlmSdkError } from "../../llm/formatLlmSdkError.js";
import { withLlmTransportRetry } from "../../llm/llmTransportRetry.js";
import {
  composeSystemSections,
  temperatureForMode,
} from "../../llm/modePrompts.js";
import {
  applyAnthropicProviderIdentity,
  buildAnthropicAuthOptions,
  buildAnthropicProviderIdentityMetadata,
  createAnthropicClient,
  logAnthropicAuthDebug,
  prependProviderIdentitySystemPrompt,
  providerIdentityForOAuthAuth,
} from "../../llm/providerIdentity.js";
import { ensureFreshOAuthAuthForRequest } from "../../llm/providerOAuthLogin.js";
import {
  buildAnthropicUserBlocks,
} from "../../llm/resolvedUserSerialize.js";
import { llmSdkResponseHeadTimeoutMs } from "../../llm/sdkResponseHeadTimeoutMs.js";
import type { SendableMessage } from "../../llm/sendResolved.js";
import { userMessageTextForSend } from "../../llm/sendResolved.js";
import {
  createStreamTimeoutManager,
  resolveStreamTimeouts,
} from "../../llm/streamTimeouts.js";
import {
  anthropicEffectiveMaxTokens,
  anthropicEffectiveTemperature,
  anthropicThinkingBudget,
  resolveRequestedTemperature,
} from "../../llm/thinkingLevel.js";
import type { TurnTokenUsage } from "../../llm/types.js";
import type { ShellSettings } from "../../settingsStore.js";
import {
  compactAnthropicConversationForContext,
} from "../agentConversationContext.js";
import { isDeferredAgentTool } from "../agentToolPool.js";
import {
  type AgentToolDef,
  isReadOnlyAgentTool,
  type ToolCall,
  type ToolResult,
  toAnthropicTools,
} from "../agentTools.js";
import { repairAnthropicToolPairing } from "../apiConversationRepair.js";
import {
  mergeAdjacentAnthropicUserMessages,
  normalizeAnthropicMessagesForApi,
} from "../messageNormalizeForApi.js";
import { StructuredAssistantBuilder } from "../structuredAssistantBuilder.js";
import { expandStructuredAssistantPayloadToAnthropic } from "../structuredAssistantToApi.js";
import {
  analyzeToolContext,
  shouldEnableAnthropicNativeDefer,
} from "../toolContextAnalysis.js";
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
} from "./agentLoopTypes.js";
import {
  DEFAULT_MAX_CONSECUTIVE_MISTAKES,
  MAX_TOOL_CONCURRENCY,
  agentToolDefsForLoop,
  appendMcpToolsSystemHint,
  appendMessagesToAnthropicConversation,
  createToolInputDeltaBatcher,
  emitDeferredToolStateChange,
  maxStreamingToolArgChars,
  normalizeDeferredToolStateForLoop,
  normalizeToolNameList,
  resolveAgentMaxRounds,
  runBatchWithLimit,
  shouldEmitToolInputDelta,
  synthesizeMissingAnthropicToolResults,
  unwrapAssistantContentEnvelope,
  visibleAgentToolDefsForLoop,
  yieldForToolInputStreamUi,
} from "./agentLoopUtils.js";

export function threadToAnthropic(messages: SendableMessage[]): MessageParam[] {
  const nonSystem = messages.filter(
    (m) => m.role === "user" || m.role === "assistant"
  );
  const out: MessageParam[] = [];
  type Pending = { role: "user" | "assistant"; blocks: ContentBlockParam[] };
  let current: Pending | null = null;

  const flush = () => {
    if (current && current.blocks.length > 0) {
      out.push({ content: current.blocks, role: current.role });
    }
    current = null;
  };

  for (const m of nonSystem) {
    if (m.role === "assistant") {
      const p = parseAgentAssistantPayload(m.content);
      if (p) {
        flush();
        out.push(...expandStructuredAssistantPayloadToAnthropic(p));
        continue;
      }
    }

    const role = m.role as "user" | "assistant";
    const blocks: ContentBlockParam[] =
      role === "user" && m.resolved && m.resolved.hasImages
        ? buildAnthropicUserBlocks(m.resolved)
        : [
            {
              text: role === "user" ? userMessageTextForSend(m) : m.content,
              type: "text",
            },
          ];
    if (current && current.role === role) {
      current.blocks.push(...blocks);
    } else {
      flush();
      current = { blocks: [...blocks], role };
    }
  }
  flush();
  return out;
}

export async function runAnthropicLoop(
  settings: ShellSettings,
  threadMessages: SendableMessage[],
  options: AgentLoopOptions,
  handlers: AgentLoopHandlers
): Promise<void> {
  const oauthAuth =
    options.requestOAuthAuth?.provider === "claude"
      ? await ensureFreshOAuthAuthForRequest(
          options.requestProviderId,
          options.requestOAuthAuth
        )
      : undefined;
  const key = (oauthAuth?.accessToken ?? options.requestApiKey).trim();
  if (!key) {
    handlers.onError("未配置 Anthropic API Key。请在设置 → 模型中填写。");
    return;
  }

  const baseURL = options.requestBaseURL?.trim() || undefined;
  const requestProviderIdentity =
    providerIdentityForOAuthAuth(oauthAuth) ?? options.requestProviderIdentity;
  const model = options.requestModelId.trim();
  if (!model) {
    handlers.onError("模型请求名称为空。");
    return;
  }
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
  const authOptions = buildAnthropicAuthOptions(key, oauthAuth);
  logAnthropicAuthDebug({
    authOptions,
    baseURL,
    model,
    oauthAuth,
    providerId: options.requestProviderId,
    providerIdentity: requestProviderIdentity,
    source: "agent-loop",
  });
  const client = createAnthropicClient(
    applyAnthropicProviderIdentity(
      settings,
      {
        ...authOptions,
        baseURL: baseURL || undefined,
        ...(httpAgent ? { httpAgent } : {}),
        maxRetries: 0,
        timeout: llmSdkResponseHeadTimeoutMs(),
      },
      requestProviderIdentity
    )
  );
  const storedSystem = threadMessages.find((m) => m.role === "system");
  const anthropicPromptCaching = isAnthropicPromptCachingEnabled(model);
  const systemSectionsBase = composeSystemSections(
    storedSystem?.content,
    options.composerMode,
    options.agentSystemAppend
  );
  const staticSystemText = prependProviderIdentitySystemPrompt(
    settings,
    systemSectionsBase.staticText,
    requestProviderIdentity
  );
  const dynamicSystemText = appendMcpToolsSystemHint(
    systemSectionsBase.dynamicText,
    options.composerMode,
    settings
  );
  const system = buildAnthropicSystemForApi(
    {
      dynamicText: dynamicSystemText,
      fullText: [staticSystemText, dynamicSystemText]
        .filter(Boolean)
        .join("\n\n---\n"),
      staticText: staticSystemText,
    },
    anthropicPromptCaching
  );
  let conversation: MessageParam[] = normalizeAnthropicMessagesForApi(
    threadToAnthropic(threadMessages)
  );
  conversation = repairAnthropicToolPairing(conversation);
  conversation = mergeAdjacentAnthropicUserMessages(conversation);
  if (conversation.length === 0) {
    handlers.onError("没有可发送的对话消息。");
    return;
  }
  let deferredToolState = normalizeDeferredToolStateForLoop(
    options.deferredToolState,
    options.discoveredDeferredToolNames
  );
  const discoveredDeferredToolNames = new Set(
    deferredToolState.discoveredToolNames
  );
  let toolResultReplacementState = normalizeToolResultReplacementState(
    options.toolResultReplacementState
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
          anthropic: normalizeToolNameList([
            ...(deferredToolState.providerLoadedToolNames?.anthropic ?? []),
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
  const resolveToolDefsByName = () =>
    new Map(resolveFullToolPool().map((tool) => [tool.name, tool] as const));
  const countAnthropicDeferredToolTokensExact = async (
    tools: AgentToolDef[]
  ): Promise<number | null> => {
    if (tools.length === 0) {
      return 0;
    }
    try {
      const response = await client.messages.countTokens({
        messages: [{ content: "", role: "user" }],
        model,
        tools: toAnthropicTools(
          tools
        ) as unknown as Anthropic.Messages.MessageCountTokensTool[],
      });
      const baseline = await client.messages.countTokens({
        messages: [{ content: "", role: "user" }],
        model,
      });
      return Math.max(0, response.input_tokens - baseline.input_tokens);
    } catch {
      return null;
    }
  };
  const initialFullToolPool = resolveFullToolPool();
  const initialDeferredToolPool = initialFullToolPool.filter((tool) =>
    isDeferredAgentTool(tool)
  );
  const initialVisibleToolPool = visibleAgentToolDefsForLoop(
    options.composerMode,
    settings,
    discoveredDeferredToolNames,
    options.toolPoolOverride
  );
  const toolContextAnalysis = await analyzeToolContext({
    deferredToolPool: initialDeferredToolPool,
    exactDeferredTokenCounter: countAnthropicDeferredToolTokensExact,
    fullToolPool: initialFullToolPool,
    provider: "anthropic",
    visibleToolPool: initialVisibleToolPool,
  });
  const nativeAnthropicDeferEnabled = shouldEnableAnthropicNativeDefer({
    analysis: toolContextAnalysis,
    baseURL,
    contextWindowTokens: options.contextWindowTokens,
    model,
  });
  const resolveVisibleToolPool = () =>
    visibleAgentToolDefsForLoop(
      options.composerMode,
      settings,
      discoveredDeferredToolNames,
      options.toolPoolOverride,
      nativeAnthropicDeferEnabled
    );
  const resolveAnthropicApiTools = (): AnthropicToolSchema[] => {
    const visibleToolPool = resolveVisibleToolPool();
    if (!nativeAnthropicDeferEnabled) {
      return toAnthropicTools(visibleToolPool);
    }
    const deferToolNames = new Set(
      resolveFullToolPool()
        .filter(
          (tool) =>
            isDeferredAgentTool(tool) &&
            !discoveredDeferredToolNames.has(tool.name)
        )
        .map((tool) => tool.name)
    );
    return toAnthropicTools(visibleToolPool, {
      deferToolNames,
      includeExperimentalBetaFields: nativeAnthropicDeferEnabled,
    });
  };
  const mergedCustomToolHandlers = {
    ToolSearch: createToolSearchToolHandler({
      discoverTools: markDeferredToolsDiscovered,
      nativeAnthropicToolReference: nativeAnthropicDeferEnabled,
      resolveFullToolPool,
    }),
    ...(options.customToolHandlers ?? {}),
  };
  const structured = new StructuredAssistantBuilder();
  const anthropicMetadata = buildAnthropicProviderIdentityMetadata(
    settings,
    requestProviderIdentity
  );
  const thinkBudget = anthropicThinkingBudget(options.thinkingLevel ?? "off");
  const requestedTemperature = resolveRequestedTemperature(
    temperatureForMode(options.composerMode),
    options.temperatureMode,
    options.temperature
  );
  const temperature = anthropicEffectiveTemperature(
    requestedTemperature,
    thinkBudget
  );
  let accUsage: TurnTokenUsage | undefined;

  const mistakeLimitEnabled = options.mistakeLimitEnabled !== false;
  const threshold =
    options.maxConsecutiveMistakes ?? DEFAULT_MAX_CONSECUTIVE_MISTAKES;
  let consecutiveToolFailures = 0;

  const MAX_OUTPUT_RECOVERY_LIMIT_A = 3;
  let outputRecoveryCountA = 0;

  type TurnTu = { id: string; name: string; input: string };
  type AnthropicToolExecution = {
    call: TurnTu;
    args: Record<string, unknown>;
    result: ToolResult;
  };
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

  async function handleMistakeLimitBeforeRoundAnthropic(): Promise<boolean> {
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

  async function runOneAnthropicTool(
    tu: TurnTu
  ): Promise<AnthropicToolExecution> {
    let args: Record<string, unknown>;
    try {
      args = JSON.parse(tu.input || "{}");
    } catch (parseErr) {
      const msg = `工具参数 JSON 无效：${parseErr instanceof Error ? parseErr.message : String(parseErr)}。请提供合法的 JSON。`;
      if (mistakeLimitEnabled) consecutiveToolFailures++;
      return {
        args: {},
        call: tu,
        result: {
          content: msg,
          isError: true,
          name: tu.name,
          toolCallId: tu.id,
        },
      };
    }

    const toolCall: ToolCall = { arguments: args, id: tu.id, name: tu.name };

    handlers.onToolCall(tu.name, args, tu.id);
    await new Promise<void>((r) => setTimeout(r, 0));

    const gateStart = Date.now();
    console.log(`[AgentLoop/A] tool=${tu.name} — beforeExecuteTool start`);
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
      `[AgentLoop/A] tool=${tu.name} — beforeExecuteTool done (${Date.now() - gateStart}ms, proceed=${gate.proceed})`
    );
    if (!gate.proceed) {
      const msg = gate.rejectionMessage;
      if (mistakeLimitEnabled) consecutiveToolFailures++;
      return {
        args,
        call: tu,
        result: {
          content: msg,
          isError: true,
          name: tu.name,
          toolCallId: tu.id,
        },
      };
    }

    handlers.onToolProgress?.({ name: tu.name, phase: "executing" });
    const execStart = Date.now();
    console.log(`[AgentLoop/A] tool=${tu.name} — executeTool start`);
    const result = await executeTool(toolCall, options.toolHooks, toolExecCtx);
    console.log(
      `[AgentLoop/A] tool=${tu.name} — executeTool done (${Date.now() - execStart}ms, error=${result.isError})`
    );
    if (mistakeLimitEnabled) {
      if (result.isError) {
        consecutiveToolFailures++;
      } else {
        consecutiveToolFailures = 0;
      }
    }

    return { args, call: tu, result };
  }

  async function flushAnthropicToolsInOrder(
    turnToolUses: TurnTu[]
  ): Promise<AnthropicToolResultBlock[]> {
    const executed: AnthropicToolExecution[] = [];
    let i = 0;
    while (i < turnToolUses.length) {
      const cur = turnToolUses[i]!;
      if (isReadOnlyAgentTool(cur.name)) {
        let j = i;
        while (
          j < turnToolUses.length &&
          isReadOnlyAgentTool(turnToolUses[j]!.name)
        ) {
          j++;
        }
        const batch = turnToolUses.slice(i, j);
        const batchResults = await runBatchWithLimit(
          batch.map((b) => () => runOneAnthropicTool(b)),
          MAX_TOOL_CONCURRENCY
        );
        executed.push(...batchResults);
        i = j;
      } else {
        executed.push(await runOneAnthropicTool(cur));
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
    return executed.map((item, index) => {
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
        content: adjusted.structuredContent ?? adjusted.content,
        is_error: adjusted.isError,
        tool_use_id: item.call.id,
        type: "tool_result",
      };
    });
  }

  const toolDeltaBatcherA = createToolInputDeltaBatcher((p) =>
    handlers.onToolInputDelta?.(p)
  );
  const streamTimeoutConfigA = resolveStreamTimeouts(settings);
  const maxRoundsA = resolveAgentMaxRounds(settings);
  console.log(
    `[AgentLoop] Anthropic loop start — idleMs=${streamTimeoutConfigA.idleMs} hardMs=${streamTimeoutConfigA.hardMs} watchdog=${streamTimeoutConfigA.idleWatchdogEnabled} maxRounds=${maxRoundsA ?? "∞"}`
  );

  for (let round = 0; maxRoundsA == null || round < maxRoundsA; round++) {
    if (options.signal.aborted) {
      console.log(`[AgentLoop/A] round ${round} — aborted before start`);
      break;
    }

    if (await handleMistakeLimitBeforeRoundAnthropic()) {
      return;
    }
    if (options.beforeRoundMessages) {
      const injected = await options.beforeRoundMessages();
      if (injected.length > 0) {
        conversation = appendMessagesToAnthropicConversation(
          conversation,
          injected
        );
      }
    }
    const compactedForContextA = compactAnthropicConversationForContext(
      conversation,
      {
        apiKey: key,
        baseURL,
        contextWindowTokens: options.contextWindowTokens,
        maxOutputTokens: options.maxOutputTokens,
        model,
        oauthAuth,
        onStateChange: options.onContextCompactStateChange,
        providerId: options.requestProviderId,
        providerIdentity: resolveProviderIdentityWithOverride(
          settings.providerIdentity,
          options.requestProviderIdentity
        ),
        proxyUrl: proxyRaw || undefined,
        signal: options.signal,
        state: options.contextCompactState,
      }
    );
    const compactedForContextAResolved = await compactedForContextA;
    if (compactedForContextAResolved.changed) {
      conversation = compactedForContextAResolved.messages;
      console.log(
        `[AgentLoop/A] round ${round} — context compacted provider=anthropic mode=${compactedForContextAResolved.mode} before=${compactedForContextAResolved.estimatedTokensBefore} after=${compactedForContextAResolved.estimatedTokensAfter} compactedMessages=${compactedForContextAResolved.compactedMessages} clearedToolResults=${compactedForContextAResolved.clearedToolResults}${compactedForContextAResolved.error ? ` error=${compactedForContextAResolved.error}` : ""}`
      );
    }

    console.log(`[AgentLoop/A] round ${round} — starting LLM call`);
    const roundStartAtA = Date.now();
    const tools = resolveAnthropicApiTools();
    let turnText = "";
    let turnThinking = "";
    let turnThinkingSignature = "";
    const turnToolUses: { id: string; name: string; input: string }[] = [];
    let currentBlockType: "text" | "tool_use" | "thinking" | null = null;
    let currentBlockIdx = -1;
    let turnStopReason: string | null = null;

    const maxTokens = anthropicEffectiveMaxTokens(
      thinkBudget,
      options.maxOutputTokens
    );
    const thinkingParam =
      thinkBudget === null
        ? undefined
        : { budget_tokens: thinkBudget, type: "enabled" as const };

    const roundAcA = new AbortController();
    const roundSignalA = roundAcA.signal;
    let activeStreamA: { abort?: () => void } | null = null;
    const onOuterAbortA = () => {
      roundAcA.abort();
      try {
        activeStreamA?.abort?.();
      } catch {
        /* ignore */
      }
    };
    if (options.signal.aborted) {
      roundAcA.abort();
    } else {
      options.signal.addEventListener("abort", onOuterAbortA, { once: true });
    }

    const timeoutMgrA = createStreamTimeoutManager(streamTimeoutConfigA, () =>
      roundAcA.abort()
    );
    timeoutMgrA.start();

    let cacheDecision: AnthropicCacheBreakpointDecision | undefined;
    try {
      const messagesForApi = addAnthropicCacheBreakpoints(
        conversation,
        anthropicPromptCaching,
        {
          onDecision: (decision) => {
            cacheDecision = decision;
          },
          skipCacheWrite: options.skipAnthropicPromptCacheWrite === true,
          strategy: "stable-prefix",
        }
      );
      const stream = await withLlmTransportRetry(
        async () => {
          const s = client.messages.stream(
            {
              max_tokens: maxTokens,
              messages: messagesForApi,
              model,
              system,
              temperature,
              tools: tools as Anthropic.Messages.Tool[],
              ...(anthropicMetadata ? { metadata: anthropicMetadata } : {}),
              ...(thinkingParam ? { thinking: thinkingParam } : {}),
            },
            { signal: roundSignalA }
          );
          s.on("error", () => undefined);
          s.on("abort", () => undefined);
          await s.withResponse();
          return s;
        },
        { signal: options.signal }
      );
      activeStreamA = stream as { abort?: () => void };

      for await (const ev of stream) {
        if (roundSignalA.aborted) break;
        timeoutMgrA.onChunk();

        if (ev.type === "message_start" && ev.message.usage) {
          accUsage = {
            cacheReadTokens:
              (accUsage?.cacheReadTokens ?? 0) +
              ((ev.message.usage as any).cache_read_input_tokens ?? 0),
            cacheWriteTokens:
              (accUsage?.cacheWriteTokens ?? 0) +
              ((ev.message.usage as any).cache_creation_input_tokens ?? 0),
            inputTokens:
              (accUsage?.inputTokens ?? 0) +
              (ev.message.usage.input_tokens ?? 0),
            outputTokens:
              (accUsage?.outputTokens ?? 0) +
              (ev.message.usage.output_tokens ?? 0),
          };
        } else if (ev.type === "message_delta" && ev.usage) {
          accUsage = {
            ...(accUsage ?? {}),
            outputTokens:
              (accUsage?.outputTokens ?? 0) + (ev.usage.output_tokens ?? 0),
          };
          if ((ev as any).delta?.stop_reason) {
            turnStopReason = (ev as any).delta.stop_reason;
          }
        } else if (ev.type === "content_block_start") {
          if (ev.content_block.type === "text") {
            currentBlockType = "text";
          } else if (ev.content_block.type === "tool_use") {
            currentBlockType = "tool_use";
            currentBlockIdx = turnToolUses.length;
            turnToolUses.push({
              id: ev.content_block.id,
              input: "",
              name: ev.content_block.name,
            });
          } else if (ev.content_block.type === "thinking") {
            currentBlockType = "thinking";
          } else {
            currentBlockType = null;
          }
        } else if (ev.type === "content_block_delta") {
          if (currentBlockType === "text" && ev.delta.type === "text_delta") {
            turnText += ev.delta.text;
            handlers.onTextDelta(ev.delta.text);
          } else if (
            currentBlockType === "thinking" &&
            ev.delta.type === "thinking_delta"
          ) {
            const piece = ev.delta.thinking;
            if (piece) {
              turnThinking += piece;
              handlers.onThinkingDelta?.(piece);
            }
          } else if (
            currentBlockType === "thinking" &&
            ev.delta.type === "signature_delta"
          ) {
            turnThinkingSignature += ev.delta.signature;
          } else if (
            currentBlockType === "tool_use" &&
            ev.delta.type === "input_json_delta"
          ) {
            if (currentBlockIdx >= 0 && turnToolUses[currentBlockIdx]) {
              turnToolUses[currentBlockIdx]!.input += ev.delta.partial_json;
              const tu = turnToolUses[currentBlockIdx]!;
              if (tu.input.length > maxToolArgChars) {
                throw new Error(
                  `Streaming tool arguments exceeded safe limit (${maxToolArgChars} chars) for ${tu.name || "(pending)"}.`
                );
              }
              if (tu.name && shouldEmitToolInputDelta(tu.name)) {
                toolDeltaBatcherA.queue({
                  index: currentBlockIdx,
                  name: tu.name,
                  partialJson: tu.input,
                });
                await yieldForToolInputStreamUi(tu.name);
              }
            }
          }
        } else if (ev.type === "content_block_stop") {
          currentBlockType = null;
        }
      }
      toolDeltaBatcherA.flush();
    } catch (e: unknown) {
      toolDeltaBatcherA.flush();
      timeoutMgrA.stop();
      if (options.signal.aborted) {
        synthesizeMissingAnthropicToolResults(
          conversation,
          turnToolUses,
          "已中止生成"
        );
        break;
      }
      if (roundSignalA.aborted && !options.signal.aborted) {
        // 超时中止：保留已生成内容，以 onDone 结束而非 onError 丢弃
        const partialTextA = unwrapAssistantContentEnvelope(turnText);
        structured.appendText(partialTextA);
        handlers.onDone(structured.serialize(), accUsage);
        return;
      }
      const errTextA = formatLlmSdkError(e);
      synthesizeMissingAnthropicToolResults(
        conversation,
        turnToolUses,
        errTextA
      );
      handlers.onError(errTextA);
      return;
    } finally {
      activeStreamA = null;
      options.signal.removeEventListener("abort", onOuterAbortA);
    }
    timeoutMgrA.stop();
    observeAnthropicPromptCacheUsage({
      decision: cacheDecision,
      model,
      source: `agent:${options.threadId ?? "ephemeral"}`,
      system,
      toolNames: tools.map((tool) => tool.name),
      usage: accUsage,
    });
    console.log(
      `[AgentLoop/A] round ${round} — stream done (${Date.now() - roundStartAtA}ms), stopReason=${turnStopReason}, toolUses=${turnToolUses.length}, textLen=${turnText.length}`
    );

    if (options.signal.aborted || roundSignalA.aborted) {
      console.log(`[AgentLoop/A] round ${round} — aborted after stream`);
      synthesizeMissingAnthropicToolResults(
        conversation,
        turnToolUses,
        "已中止生成"
      );
      break;
    }

    turnText = unwrapAssistantContentEnvelope(turnText);
    structured.appendText(turnText);

    if (turnToolUses.length === 0) {
      // 检测 max_tokens 截断，尝试自动续写
      if (
        turnStopReason === "max_tokens" &&
        outputRecoveryCountA < MAX_OUTPUT_RECOVERY_LIMIT_A
      ) {
        outputRecoveryCountA++;
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

    const assistantContent: ContentBlockParam[] = [];
    if (turnThinking.trim()) {
      assistantContent.push({
        signature: turnThinkingSignature || "",
        thinking: turnThinking,
        type: "thinking",
      });
    }
    if (turnText) {
      assistantContent.push({ text: turnText, type: "text" });
    }
    for (const tu of turnToolUses) {
      let input: Record<string, unknown> = {};
      try {
        input = JSON.parse(tu.input || "{}");
      } catch {
        input = {};
      }
      assistantContent.push({
        id: tu.id,
        input,
        name: tu.name,
        type: "tool_use",
      });
    }
    conversation.push({ content: assistantContent, role: "assistant" });

    console.log(
      `[AgentLoop/A] round ${round} — executing ${turnToolUses.length} tool(s)`
    );
    const toolsStartA = Date.now();
    const toolResults = await flushAnthropicToolsInOrder(turnToolUses);
    console.log(
      `[AgentLoop/A] round ${round} — tools done (${Date.now() - toolsStartA}ms)`
    );

    conversation.push({
      content: toolResults as unknown as ContentBlockParam[],
      role: "user",
    });

    if (maxRoundsA != null && round === maxRoundsA - 1) {
      console.warn(
        `[AgentLoop/A] max tool rounds (${maxRoundsA}) exhausted — ending loop`
      );
      const warnA = `\n\n---\n⚠ 已达到单次对话最大工具轮次 (${maxRoundsA})，自动停止。请发送新消息继续。`;
      structured.appendText(warnA);
      handlers.onTextDelta(warnA);
    }
  }

  console.log("[AgentLoop/A] Anthropic loop ended — calling onDone");
  if (
    !accUsage ||
    ((accUsage.inputTokens ?? 0) === 0 && (accUsage.outputTokens ?? 0) === 0)
  ) {
    let inputChars =
      typeof system === "string"
        ? system.length
        : JSON.stringify(system).length;
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
