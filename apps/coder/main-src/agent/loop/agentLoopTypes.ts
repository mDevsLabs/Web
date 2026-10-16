import type OpenAI from "openai";
import type { ProviderIdentitySettings } from "../../../src/providerIdentitySettings.js";
import type { ComposerMode } from "../../llm/composerMode.js";
import type { SendableMessage } from "../../llm/sendResolved.js";
import type { TurnTokenUsage } from "../../llm/types.js";
import type { WorkspaceLspManager } from "../../lsp/workspaceLspManager.js";
import type {
  ModelRequestParadigm,
  ProviderOAuthAuthRecord,
  ThinkingLevel,
} from "../../settingsStore.js";
import type { DeferredToolState } from "../../threadStore.js";
import type { AgentContextCompactState } from "../agentConversationContext.js";
import type { AgentToolDef, ToolCall, ToolResult } from "../agentTools.js";
import type {
  MistakeLimitContext,
  MistakeLimitDecision,
} from "../mistakeLimitGate.js";
import type { TeamPlanQuestionRoleScope } from "../planQuestionTool.js";
import type {
  ToolExecutionContext,
  ToolExecutionHooks,
} from "../toolExecutor.js";
import type { ToolResultReplacementState } from "../toolResultBudget.js";

export type {
  MistakeLimitContext,
  MistakeLimitDecision,
} from "../mistakeLimitGate.js";

/** 执行工具前闸门；返回 proceed:false 时不调用 executeTool，结果写入对话为失败 tool_result */
export type BeforeExecuteToolResult =
  | { proceed: true }
  | { proceed: false; rejectionMessage: string };

export type ToolInputDeltaPayload = {
  name: string;
  partialJson: string;
  index: number;
};

export type ToolProgressPayload = {
  name: string;
  phase: "executing" | "awaiting_approval";
  detail?: string;
};

export type AgentLoopHandlers = {
  onTextDelta: (text: string) => void;
  /** 模型边生成工具 JSON 参数时流式回调（便于 UI 实时预览写入内容） */
  onToolInputDelta?: (payload: ToolInputDeltaPayload) => void;
  /** Anthropic extended thinking 流式片段（不写入持久化 assistant 正文） */
  onThinkingDelta?: (text: string) => void;
  /** 工具执行阶段（全过程可见） */
  onToolProgress?: (payload: ToolProgressPayload) => void;
  onToolCall: (
    name: string,
    args: Record<string, unknown>,
    toolUseId: string
  ) => void;
  onToolResult: (
    name: string,
    result: string,
    success: boolean,
    toolUseId: string
  ) => void;
  onDone: (fullContent: string, usage?: TurnTokenUsage) => void;
  onError: (message: string) => void;
};

export type AgentLoopOptions = {
  /** UI 里实际选中的模型条目 id；用于 memory recall/extraction 等旁路调用 */
  modelSelection?: string;
  requestModelId: string;
  paradigm: ModelRequestParadigm;
  /** 与 UnifiedChatOptions 一致：已由 modelResolve 解析 */
  requestApiKey: string;
  requestBaseURL?: string;
  /** OpenAI 兼容：提供商级代理 */
  requestProxyUrl?: string;
  /** 当前提供商 id（来自 modelResolve）。 */
  requestProviderId?: string;
  /** 当前提供商对全局「模型提供商标识」的覆盖。 */
  requestProviderIdentity?: ProviderIdentitySettings;
  /** 当前提供商的 OAuth 凭据（Codex / Claude Code / Antigravity）。 */
  requestOAuthAuth?: ProviderOAuthAuthRecord;
  maxOutputTokens: number;
  contextWindowTokens?: number;
  temperatureMode?: "auto" | "custom";
  temperature?: number;
  signal: AbortSignal;
  /** 与主界面 Composer 模式一致；Plan 仅注册只读工具 */
  composerMode: ComposerMode;
  /** 子 Agent 等场景覆盖默认工具池（非空则跳过 assembleAgentToolPool） */
  toolPoolOverride?: AgentToolDef[];
  agentSystemAppend?: string;
  toolHooks?: ToolExecutionHooks;
  customToolHandlers?: Record<
    string,
    (
      call: ToolCall,
      hooks: ToolExecutionHooks,
      execCtx: ToolExecutionContext
    ) => Promise<ToolResult> | ToolResult
  >;
  /** 线程级延迟工具发现状态（优先于旧的 discoveredDeferredToolNames 传递）。 */
  deferredToolState?: DeferredToolState;
  /** 兼容旧调用方：若未提供 deferredToolState，则退回使用此字段。 */
  discoveredDeferredToolNames?: string[];
  /** 当 ToolSearch 加载了新工具后回调，用于把状态持久化到线程。 */
  onDeferredToolStateChange?: (state: DeferredToolState) => void;
  /** 兼容旧调用方：若设置，会在 deferred state 更新后同步回调 discoveredToolNames。 */
  onDiscoveredDeferredToolsChange?: (names: string[]) => void;
  toolResultReplacementState?: ToolResultReplacementState;
  onToolResultReplacementStateChange?: (
    state: ToolResultReplacementState
  ) => void;
  contextCompactState?: AgentContextCompactState;
  onContextCompactStateChange?: (state: AgentContextCompactState) => void;
  /** 在 executeTool 之前调用；用于 shell 写入等需用户确认的闸门 */
  beforeExecuteTool?: (call: ToolCall) => Promise<BeforeExecuteToolResult>;
  thinkingLevel?: ThinkingLevel;
  /** 连续工具失败（含用户拒绝执行）达到阈值时回调；未设置则达到阈值后仅重置计数并继续 */
  onMistakeLimitReached?: (
    ctx: MistakeLimitContext
  ) => Promise<MistakeLimitDecision>;
  maxConsecutiveMistakes?: number;
  /** 默认 true */
  mistakeLimitEnabled?: boolean;
  /**
   * 当前嵌套深度：根循环为 0；子 Agent 内为 1。用于禁止多层 Agent 而不依赖全局状态。
   */
  delegateExecutionDepth?: number;
  /** 发起 Agent 的窗口当前工作区根 */
  workspaceRoot?: string | null;
  /** 本轮激活的 Skill/插件只读资源根目录 */
  extraReadableRoots?: string[];
  /** 与 workspaceRoot 同窗的多语言 LSP 路由（插件 `.lsp.json` + 可选 settings.lsp 迁移 + 若存在则探测 typescript-language-server） */
  workspaceLspManager?: WorkspaceLspManager | null;
  /** 当前会话线程 ID，用于 TodoWrite 等按线程隔离状态的工具 */
  threadId?: string | null;
  /** 发起本轮 Agent 的宿主渲染进程 webContents id，用于控制当前窗口的内置浏览器等 UI 能力 */
  hostWebContentsId?: number | null;
  /**
   * Team 子循环：与流式 `teamRoleScope` 对齐，供 `ask_plan_question` 把澄清题挂到对应角色工作流。
   */
  teamToolRoleScope?: TeamPlanQuestionRoleScope;
  /**
   * Called before each LLM round. Use this to inject additional user/assistant messages into a running loop.
   */
  beforeRoundMessages?: () => Promise<SendableMessage[]>;
  /**
   * Anthropic：prompt cache 断点挂在倒数第二条消息，避免无后续读取的尾部写入 KVCC。
   */
  skipAnthropicPromptCacheWrite?: boolean;
};

export type OAIMsg = OpenAI.Chat.Completions.ChatCompletionMessageParam;
