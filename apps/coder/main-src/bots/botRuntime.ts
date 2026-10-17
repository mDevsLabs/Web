import * as fs from "node:fs";
import * as path from "node:path";
import { app, BrowserWindow, webContents } from "electron";
import { getShellPermissionMode } from "../../src/shellPermissionMode.js";
import { runAgentLoop } from "../agent/agentLoop.js";
import {
  AGENT_TOOLS,
  type AgentToolDef,
  type ToolCall,
  type ToolResult,
} from "../agent/agentTools.js";
import { compressForSend } from "../agent/conversationCompress.js";
import { runTeamSession } from "../agent/teamOrchestrator.js";
import { isSafeShellCommandForAutoApprove } from "../agent/toolApprovalGate.js";
import type {
  ToolExecutionContext,
  ToolExecutionHooks,
} from "../agent/toolExecutor.js";
import { resolveToolPermissionFromRules } from "../agent/toolPermissionModel.js";
import type { AgentCustomization, AgentSkill } from "../agentSettingsTypes.js";
import type {
  BotComposerMode,
  BotIntegrationConfig,
} from "../botSettingsTypes.js";
import {
  awaitBrowserCommandResult,
  closeBrowserWindowForHostId,
} from "../browser/browserController.js";
import { getGitContextBlock } from "../gitContext.js";
import {
  buildAgentGlobalRuleAppend,
  prepareUserTurnForChat,
} from "../llm/agentMessagePrep.js";
import { formatLlmSdkError } from "../llm/formatLlmSdkError.js";
import { streamChatUnified } from "../llm/llmRouter.js";
import {
  resolveModelRequest,
  resolveThinkingLevelForSelection,
} from "../llm/modelResolve.js";
import { resolveMessagesForSend } from "../llm/sendResolved.js";
import { modeExpandsWorkspaceFileContext } from "../llm/workspaceContextExpand.js";
import { WorkspaceLspManager } from "../lsp/workspaceLspManager.js";
import {
  checkMaiQuotaAvailable,
  recordMaiTokenUsage,
} from "../maiAccountStore.js";
import { loadMemoryPrompt } from "../memdir/memdir.js";
import { mergeAgentWithPluginRuntime } from "../plugins/pluginRuntimeService.js";
import {
  buildDialecticContextBlock,
  buildRelationshipContextBlock,
  runDialecticAnalysis,
} from "../services/dialectic/dialectic.js";
import { queueExtractMemories } from "../services/extractMemories/extractMemories.js";
import {
  recordSkillUsage,
  updateSkillSuccessRate,
} from "../services/extractSkills/skillSelfImprove.js";
import {
  getRecentWorkspaces,
  type ShellSettings,
  updateBotIntegrationFeishuTokens,
} from "../settingsStore.js";
import {
  accumulateTokenUsage,
  appendMessage,
  type ChatMessage,
  createThread,
  getThread,
  incrementThreadAgentToolCallCount,
  saveSummary,
  saveTeamSession,
  touchFileInThread,
  updateLastAssistant,
} from "../threadStore.js";
import {
  mergeAgentWithProjectSlice,
  readWorkspaceAgentProjectSlice,
} from "../workspaceAgentStore.js";
import { ensureWorkspaceFileIndex } from "../workspaceFileIndex.js";
import type {
  BotInboundAttachment,
  BotStreamChannel,
  BotTodoListItem,
} from "./platforms/common.js";
import { buildFeishuToolBundle } from "./platforms/feishu/feishuToolBundle.js";

export type BotInboundMessage = {
  conversationKey: string;
  text: string;
  senderId?: string;
  senderName?: string;
  attachments?: BotInboundAttachment[];
};

export type BotSessionState = {
  integrationId: string;
  conversationKey: string;
  workspaceRoot: string | null;
  modelId: string;
  /** 用户通过 /model 命令手动切换过模型；此时不应被 integration.defaultModelId 覆盖 */
  modelIdExplicitlySet?: boolean;
  mode: BotComposerMode;
  threadIdsByWorkspace: Record<string, string>;
  leaderMessages: ChatMessage[];
  leaderSummary?: string;
  leaderSummaryCoversCount?: number;
  lastUserId?: string;
  lastUserName?: string;
  browserHostWebContentsId?: number | null;
  pendingQrLogin?: BotPendingQrLoginState;
  /**
   * 同一会话内缓存的 memory prompt，用于保留 LLM prefix cache。
   * `undefined` = 尚未加载；`null` = 已加载但无 memory；`string` = 已加载的 memory prompt。
   * 该字段不持久化到磁盘，session 重启后重新加载。
   */
  cachedMemoryPrompt?: string | null;
  /**
   * 本会话中已完成的对话轮次计数，用于 Periodic Nudge。
   * 该字段不持久化到磁盘。
   */
  turnCount?: number;
};

export type BotPendingQrLoginState = {
  requestedAt: number;
  hostWebContentsId: number;
  screenshotPath: string;
  tabId?: string;
  pageUrl?: string;
  replyText: string;
};

export type BotAvailableModel = {
  id: string;
  label: string;
  paradigm: "openai-compatible" | "anthropic";
};

function appendSystemBlock(base: string | undefined, block: string): string {
  const trimmed = block.trim();
  if (!trimmed) {
    return base ?? "";
  }
  return base && base.trim() ? `${base}\n\n---\n${trimmed}` : trimmed;
}

function normalizeBotSkill(skill: AgentSkill): AgentSkill | null {
  const slug = String(skill.slug ?? "")
    .trim()
    .replace(/^\.\//, "");
  const content = String(skill.content ?? "").trim();
  if (!slug || !content || skill.enabled === false) {
    return null;
  }
  return {
    ...skill,
    content,
    description: String(skill.description ?? "").trim(),
    enabled: true,
    name: String(skill.name ?? "").trim() || slug,
    slug,
  };
}

function getEnabledBotSkills(integration: BotIntegrationConfig): AgentSkill[] {
  return (integration.skills ?? [])
    .map((skill) => normalizeBotSkill(skill))
    .filter((skill): skill is AgentSkill => skill != null);
}

function mergeBotSkillsIntoAgent(
  agent: AgentCustomization | undefined,
  integration: BotIntegrationConfig
): AgentCustomization | undefined {
  const botSkills = getEnabledBotSkills(integration);
  if (botSkills.length === 0) {
    return agent;
  }
  const mergedBySlug = new Map<string, AgentSkill>();
  for (const skill of agent?.skills ?? []) {
    const normalized = normalizeBotSkill(skill);
    if (!normalized) {
      continue;
    }
    mergedBySlug.set(normalized.slug.toLowerCase(), normalized);
  }
  for (const skill of botSkills) {
    mergedBySlug.set(skill.slug.toLowerCase(), skill);
  }
  return {
    ...(agent ?? {}),
    skills: [...mergedBySlug.values()],
  };
}

function buildBotSkillAppend(
  _settings: ShellSettings,
  integration: BotIntegrationConfig
): string {
  const skills = getEnabledBotSkills(integration);
  if (skills.length === 0) {
    return "";
  }
  const intro =
    "Voici les compétences exclusives au bot. Elles appartiennent uniquement à cette intégration. Traitez-les comme des guides intégrés pour ce bot, et si l'utilisateur écrit explicitement `./slug`, donnez la priorité à cette compétence correspondante.";
  return [
    "## Compétences exclusives au Bot",
    intro,
    ...skills.map((skill) =>
      [
        `### ${skill.name} (./${skill.slug})`,
        skill.description ? skill.description : "",
        skill.content,
      ]
        .filter(Boolean)
        .join("\n\n")
    ),
  ].join("\n\n");
}

function normalizeWorkspaceRoot(
  value: string | null | undefined
): string | null {
  if (!value || !String(value).trim()) {
    return null;
  }
  try {
    return path.resolve(String(value).trim());
  } catch {
    return null;
  }
}

function normalizeWorkspaceKey(root: string | null | undefined): string {
  return (normalizeWorkspaceRoot(root) ?? "__global__")
    .replace(/\\/g, "/")
    .toLowerCase();
}

let headlessBotWindow: BrowserWindow | null = null;

function getOrCreateHeadlessBotWindow(): BrowserWindow | null {
  if (headlessBotWindow && !headlessBotWindow.isDestroyed()) {
    return headlessBotWindow;
  }
  try {
    headlessBotWindow = new BrowserWindow({
      height: 800,
      show: false,
      webPreferences: {
        backgroundThrottling: false,
        contextIsolation: true,
        nodeIntegration: false,
        offscreen: false,
      },
      width: 1280,
    });
    headlessBotWindow.on("closed", () => {
      headlessBotWindow = null;
    });
    void headlessBotWindow.loadURL("about:blank").catch(() => {});
    return headlessBotWindow;
  } catch (error) {
    console.warn(
      "[bots] headless host window create failed",
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

function resolveBotHostWebContentsId(): number | null {
  const focused = BrowserWindow.getFocusedWindow();
  if (focused && !focused.isDestroyed()) {
    return focused.webContents.id;
  }
  const fallback = BrowserWindow.getAllWindows().find(
    (win) => !win.isDestroyed() && win !== headlessBotWindow
  );
  if (fallback) {
    return fallback.webContents.id;
  }
  const headless = getOrCreateHeadlessBotWindow();
  return headless?.webContents.id ?? null;
}

function isLiveWebContentsId(id: number | null | undefined): id is number {
  if (!Number.isInteger(id) || Number(id) <= 0) {
    return false;
  }
  try {
    const contents = webContents.fromId(Number(id));
    return Boolean(contents && !contents.isDestroyed());
  } catch {
    return false;
  }
}

function resolveSessionBotHostWebContentsId(
  session: BotSessionState
): number | null {
  if (isLiveWebContentsId(session.browserHostWebContentsId)) {
    return session.browserHostWebContentsId;
  }
  if (session.browserHostWebContentsId != null) {
    session.browserHostWebContentsId = null;
  }
  if (isLiveWebContentsId(session.pendingQrLogin?.hostWebContentsId)) {
    const pendingId = Number(session.pendingQrLogin?.hostWebContentsId);
    session.browserHostWebContentsId = pendingId;
    return pendingId;
  }
  return resolveBotHostWebContentsId();
}

function parsePngDataUrl(dataUrl: string): Buffer {
  const match = /^data:image\/png;base64,(.+)$/i.exec(
    String(dataUrl ?? "").trim()
  );
  if (!match?.[1]) {
    throw new Error("浏览器截图未返回 PNG 数据。");
  }
  return Buffer.from(match[1], "base64");
}

function buildBotBrowserAttachmentDir(session: BotSessionState): string {
  if (session.workspaceRoot) {
    return path.join(session.workspaceRoot, ".mai", "bot-attachments");
  }
  return path.join(app.getPath("userData"), "async", "bot-attachments");
}

function buildBotBrowserScreenshotPath(
  session: BotSessionState,
  prefix: string
): string {
  const fileName = `${prefix}-${new Date().toISOString().replace(/[:.]/g, "-").replace(/Z$/, "Z")}.png`;
  return path.join(buildBotBrowserAttachmentDir(session), fileName);
}

async function captureBrowserScreenshotForBot(params: {
  hostWebContentsId: number;
  session: BotSessionState;
  tabId?: string;
  timeoutMs?: number;
}): Promise<{
  path: string;
  pageUrl: string;
  title: string;
  width: number;
  height: number;
}> {
  const timeoutMs = Math.max(
    3000,
    Math.min(60_000, Math.floor(params.timeoutMs ?? 25_000))
  );
  const result = await awaitBrowserCommandResult(
    params.hostWebContentsId,
    {
      commandId: `bot-browser-shot-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      tabId: params.tabId,
      type: "screenshotPage",
      waitForLoad: true,
    },
    timeoutMs
  );
  if (!result.ok) {
    throw new Error(result.error || "浏览器截图失败。");
  }
  const payload =
    result.result && typeof result.result === "object"
      ? (result.result as Record<string, unknown>)
      : {};
  const png = parsePngDataUrl(String(payload.dataUrl ?? ""));
  const outputPath = buildBotBrowserScreenshotPath(params.session, "qr-login");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, png);
  return {
    height: Number(payload.height ?? 0) || 0,
    pageUrl: String(payload.url ?? ""),
    path: outputPath,
    title: String(payload.title ?? ""),
    width: Number(payload.width ?? 0) || 0,
  };
}

const QR_LOGIN_CONFIRM_PATTERNS = [
  /\b(?:logged\s*in|login\s*(?:done|complete|completed|ok)|qr\s*(?:done|complete|completed))\b/i,
  /(已登录|登录完成|登录好了|我已登录|已经登录|扫码完成|扫码好了|我已扫码|已经扫码|扫好了|扫完了)/,
];

const QR_LOGIN_RESEND_PATTERNS = [
  /\b(?:qr|code|resend|send again|show again)\b/i,
  /(二维码|再发|重发|重新发|看不到|发一下|再来一张)/,
];

export function looksLikeQrLoginConfirmation(text: string): boolean {
  const trimmed = String(text ?? "").trim();
  if (!trimmed) {
    return false;
  }
  return QR_LOGIN_CONFIRM_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function looksLikeQrLoginScreenshotResendRequest(text: string): boolean {
  const trimmed = String(text ?? "").trim();
  if (!trimmed) {
    return false;
  }
  return QR_LOGIN_RESEND_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function defaultQrLoginReplyText(_language: ShellSettings["language"]): string {
  return "La page de connexion par QR code vous a été envoyée. Veuillez la scanner avec votre téléphone, puis répondez « connecté » ici pour continuer.";
}

export function buildQrLoginResumeUserTurn(
  pending: BotPendingQrLoginState,
  userText: string,
  language: ShellSettings["language"]
): string {
  const followup = String(userText ?? "").trim() || "connecté";
  const lines =
    language === "zh-CN"
      ? [
          "[系统] 之前已经因为二维码登录而暂停。",
          `截图路径：${pending.screenshotPath}`,
          pending.pageUrl ? `上次页面 URL：${pending.pageUrl}` : "",
          "用户现在已经确认二维码登录完成。请继续使用现有浏览器会话，不要重新打开登录页。",
        ]
      : language === "fr"
        ? [
            "[Système] La connexion par QR code a été mise en pause pour confirmation manuelle.",
            `Chemin de capture : ${pending.screenshotPath}`,
            pending.pageUrl ? `Dernière URL de page : ${pending.pageUrl}` : "",
            "L'utilisateur a confirmé que la connexion par QR code est effectuée. Continuez à partir de la session de navigateur existante.",
          ]
        : [
            "[System] QR login was previously paused for manual user confirmation.",
            `Screenshot path: ${pending.screenshotPath}`,
            pending.pageUrl ? `Last page URL: ${pending.pageUrl}` : "",
            "The user has now confirmed the QR login step is complete. Continue from the existing browser session instead of reopening the login page.",
          ];
  return `${lines.filter(Boolean).join("\n")}\n\n[User follow-up]\n${followup}`;
}

function trimBotLeaderMessages(
  messages: ChatMessage[],
  maxMessages = 24
): ChatMessage[] {
  if (messages.length <= maxMessages) {
    return messages;
  }
  return messages.slice(messages.length - maxMessages);
}

function buildUserTurnContentWithAttachments(
  inbound: BotInboundMessage
): string {
  const attachments = inbound.attachments ?? [];
  const baseText = inbound.text ?? "";
  if (attachments.length === 0) {
    return baseText;
  }
  const descriptions = attachments
    .map((att) => {
      const label = att.kind === "image" ? "image" : "file";
      const name = att.name ? ` (${att.name})` : "";
      return `- ${label}${name}: ${att.localPath}`;
    })
    .join("\n");
  const header = `[User attached ${attachments.length} item(s); read them with Read or pass their paths to run_async_task]`;
  return `${header}\n${descriptions}\n\n${baseText}`.trim();
}

function workerThreadMapKey(
  root: string | null | undefined,
  mode: BotComposerMode
): string {
  return `${normalizeWorkspaceKey(root)}::${mode}`;
}

function extractBotTodosFromArgs(
  args: Record<string, unknown>
): BotTodoListItem[] {
  const rawTodos = args.todos;
  if (!Array.isArray(rawTodos)) {
    return [];
  }
  return rawTodos
    .map((todo) => {
      const item =
        todo && typeof todo === "object"
          ? (todo as Record<string, unknown>)
          : {};
      const statusRaw = String(item.status ?? "").trim();
      const status =
        statusRaw === "completed" ||
        statusRaw === "in_progress" ||
        statusRaw === "pending"
          ? statusRaw
          : "pending";
      return {
        activeForm: String(item.activeForm ?? "").trim() || undefined,
        content: String(item.content ?? "").trim(),
        status,
      } satisfies BotTodoListItem;
    })
    .filter((todo) => todo.content);
}

function describeBotToolActivity(
  name: string,
  args: Record<string, unknown>
): string | undefined {
  switch (name) {
    case "TodoWrite": {
      const todos = extractBotTodosFromArgs(args);
      const active = todos.find((todo) => todo.status === "in_progress");
      return (
        active?.activeForm ||
        active?.content ||
        `更新任务列表（${todos.length} 项）`
      );
    }
    case "TaskCreate": {
      const prompt = String(args.prompt ?? "").slice(0, 80);
      return prompt ? `派发子任务：${prompt}` : "派发子任务";
    }
    case "TaskList":
      return "查询任务列表";
    case "TaskGet":
      return `查询任务 ${String(args.taskId ?? args.id ?? "")}`;
    case "TaskOutput":
      return `读取任务输出 ${String(args.taskId ?? args.id ?? "")}`;
    case "TaskUpdate":
      return `向任务发送消息 ${String(args.taskId ?? args.target ?? "")}`;
    case "TaskStop":
      return `停止任务 ${String(args.taskId ?? args.target ?? "")}`;
    case "Browser": {
      const action = String(args.action ?? "").trim();
      return action ? `浏览器：${action}` : "正在操作内置浏览器";
    }
    case "BrowserCapture": {
      const action = String(args.action ?? "").trim();
      return action ? `浏览器抓包：${action}` : "正在抓取浏览器网络请求";
    }
    case "Bash": {
      const command = String(args.command ?? "").trim();
      return command ? `执行命令：${command.slice(0, 80)}` : "执行命令";
    }
    case "Terminal": {
      const action = String(args.action ?? "").trim();
      if (action === "list_profiles") {
        return "读取终端 profiles";
      }
      if (action === "exec") {
        const profile = String(args.profile_id ?? "").trim();
        return profile
          ? `通过 SSH profile 后台执行命令：${profile}`
          : "通过 SSH profile 后台执行命令";
      }
      if (action === "open") {
        const profile = String(args.profile_id ?? "").trim();
        return profile ? `打开后台终端会话：${profile}` : "打开后台终端会话";
      }
      if (action === "write") {
        return "向后台终端写入命令";
      }
      if (action === "read") {
        return "读取后台终端输出";
      }
      return action ? `终端：${action}` : "操作后台终端";
    }
    case "run_async_task": {
      const task = String(args.task ?? "").trim();
      const mode = String(args.mode ?? "").trim();
      if (mode) {
        return `派发内部会话（${mode}）`;
      }
      return task ? `派发内部会话：${task.slice(0, 60)}` : "派发内部会话";
    }
    case "send_local_attachment":
      return "发送本地附件给用户";
    case "pause_for_qr_login":
      return "发送二维码登录截图并等待用户扫码";
    default:
      return;
  }
}

function resolveBotLocalAttachmentPath(
  session: BotSessionState,
  requested: string
): string {
  const raw = requested.trim();
  if (!raw) {
    throw new Error("file_path 不能为空。");
  }
  if (path.isAbsolute(raw)) {
    if (!fs.existsSync(raw) || !fs.statSync(raw).isFile()) {
      throw new Error("目标附件不存在，或不是文件。");
    }
    return raw;
  }
  if (!session.workspaceRoot) {
    throw new Error("当前没有工作区，无法解析相对附件路径。");
  }
  const resolved = path.resolve(session.workspaceRoot, raw);
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    throw new Error("目标附件不存在，或不是文件。");
  }
  return resolved;
}

function collectAvailableWorkspaceRoots(
  integration: BotIntegrationConfig
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of [
    integration.defaultWorkspaceRoot,
    ...(integration.workspaceRoots ?? []),
    ...getRecentWorkspaces(),
  ]) {
    const normalized = normalizeWorkspaceRoot(raw);
    if (!normalized) {
      continue;
    }
    if (!fs.existsSync(normalized) || !fs.statSync(normalized).isDirectory()) {
      continue;
    }
    const key = normalizeWorkspaceKey(normalized);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(normalized);
  }
  return out;
}

export function getAvailableBotModels(
  settings: ShellSettings
): BotAvailableModel[] {
  const providerById = new Map(
    (settings.models?.providers ?? []).map((item) => [item.id, item])
  );
  const enabledIds = new Set(settings.models?.enabledIds ?? []);
  const rawEntries = settings.models?.entries ?? [];
  const entries =
    enabledIds.size > 0
      ? rawEntries.filter((item) => enabledIds.has(item.id))
      : rawEntries;
  return entries
    .map((entry) => {
      const provider = providerById.get(entry.providerId);
      const paradigm = provider?.paradigm;
      if (paradigm !== "openai-compatible" && paradigm !== "anthropic") {
        return null;
      }
      return {
        id: entry.id,
        label: entry.displayName.trim() || entry.requestName || entry.id,
        paradigm,
      } satisfies BotAvailableModel;
    })
    .filter((item): item is BotAvailableModel => item != null);
}

export function createInitialBotSession(
  integration: BotIntegrationConfig,
  settings: ShellSettings,
  conversationKey: string,
  senderId?: string,
  senderName?: string
): BotSessionState {
  const models = getAvailableBotModels(settings);
  const modelId =
    (integration.defaultModelId &&
    models.some((item) => item.id === integration.defaultModelId)
      ? integration.defaultModelId
      : null) ??
    (settings.defaultModel &&
    models.some((item) => item.id === settings.defaultModel)
      ? settings.defaultModel
      : null) ??
    models[0]?.id ??
    "";
  const workspaces = collectAvailableWorkspaceRoots(integration);
  const defaultWorkspace = normalizeWorkspaceRoot(
    integration.defaultWorkspaceRoot
  );
  const workspaceRoot =
    (defaultWorkspace &&
    workspaces.some(
      (item) =>
        normalizeWorkspaceKey(item) === normalizeWorkspaceKey(defaultWorkspace)
    )
      ? defaultWorkspace
      : null) ??
    workspaces[0] ??
    null;
  return {
    browserHostWebContentsId: null,
    conversationKey,
    integrationId: integration.id,
    lastUserId: senderId,
    lastUserName: senderName,
    leaderMessages: [],
    mode: integration.defaultMode ?? ("agent" as BotComposerMode),
    modelId,
    threadIdsByWorkspace: {},
    workspaceRoot,
  };
}

type RunBotOrchestratorArgs = {
  settings: ShellSettings;
  integration: BotIntegrationConfig;
  session: BotSessionState;
  inbound: BotInboundMessage;
  workspaceLspManager: WorkspaceLspManager;
  signal: AbortSignal;
  onStreamDelta?: (fullText: string, channel?: BotStreamChannel) => void;
  onToolStatus?: (
    name: string,
    state: "running" | "completed" | "error",
    detail?: string
  ) => void;
  onTodoUpdate?: (todos: BotTodoListItem[]) => void;
  onSendAttachment?: (filePath: string) => Promise<string>;
  onLeaderMessagesPersist?: (session: BotSessionState) => void;
};

type RunBotAsyncTaskArgs = {
  settings: ShellSettings;
  integration: BotIntegrationConfig;
  session: BotSessionState;
  task: string;
  modeOverride?: BotComposerMode;
  startNewThread?: boolean;
  workspaceLspManager: WorkspaceLspManager;
  signal: AbortSignal;
  onInnerTextDelta?: (fullText: string, channel?: BotStreamChannel) => void;
  onInnerToolStatus?: (
    name: string,
    state: "running" | "completed" | "error",
    detail?: string
  ) => void;
  onInnerTodoUpdate?: (todos: BotTodoListItem[]) => void;
};

const BOT_TOOL_DEFS: AgentToolDef[] = [
  {
    description:
      "Get the current bot session context, including active workspace, model, and available switch targets.",
    name: "get_async_session",
    parameters: { properties: {}, required: [], type: "object" },
  },
  {
    description:
      "Switch the active mAI Coder workspace for this conversation. Use a value returned by get_async_session.availableWorkspaces.",
    name: "switch_workspace",
    parameters: {
      properties: {
        workspace: {
          description:
            'Absolute workspace path, or "none" to clear the current workspace.',
          type: "string",
        },
      },
      required: ["workspace"],
      type: "object",
    },
  },
  {
    description:
      "Switch the active mAI Coder model for this conversation. Use a model id returned by get_async_session.availableModels.",
    name: "switch_model",
    parameters: {
      properties: {
        model_id: { description: "Configured model id.", type: "string" },
      },
      required: ["model_id"],
      type: "object",
    },
  },
  {
    description:
      "Start a fresh internal mAI Coder worker thread for the current workspace. Use this before run_async_task when you intentionally want a clean worker context.",
    name: "new_async_thread",
    parameters: {
      properties: {
        reason: {
          description:
            "Optional short note about why a new thread is being started.",
          type: "string",
        },
      },
      required: [],
      type: "object",
    },
  },
  {
    description:
      "Launch an internal mAI Coder worker session when you intentionally want a detached worker or specialist workflow. Prefer using your own tools directly unless you explicitly want a worker session. Choose mode automatically: agent for direct execution, ask for lightweight Q&A, plan for planning-only work, team for delegated multi-role work.",
    name: "run_async_task",
    parameters: {
      properties: {
        mode: {
          description:
            "Optional worker mode override. Omit to use the current default worker mode.",
          enum: ["agent", "ask", "plan", "team"],
          type: "string",
        },
        new_thread: {
          description:
            "When true, force a fresh internal worker thread for this run. Recommended when delegating a brand-new task.",
          type: "boolean",
        },
        task: {
          description: "The task or user request to execute.",
          type: "string",
        },
      },
      required: ["task"],
      type: "object",
    },
  },
  {
    description:
      "Send a local image or file from disk back to the external user chat. Use this after you produce or locate a file the user wants to receive.",
    name: "send_local_attachment",
    parameters: {
      properties: {
        file_path: {
          description:
            "Absolute file path, or a path relative to the current workspace.",
          type: "string",
        },
      },
      required: ["file_path"],
      type: "object",
    },
  },
  {
    description:
      "Capture the current built-in browser page, send the screenshot to the external user for QR-code or other manual login steps, and pause the browser session until the user confirms login is complete. After calling this tool, stop and wait for the user to reply.",
    name: "pause_for_qr_login",
    parameters: {
      properties: {
        message: {
          description:
            'Optional short user-facing instruction. If omitted, mAI Coder sends a default "scan the QR and reply when done" message.',
          type: "string",
        },
        tab_id: {
          description: "Optional browser tab id. Omit to use the active tab.",
          type: "string",
        },
        timeout_ms: {
          description:
            "Optional timeout for the screenshot capture. Default about 25 seconds.",
          type: "number",
        },
      },
      required: [],
      type: "object",
    },
  },
];

const BOT_LEADER_NATIVE_TOOL_NAMES = new Set([
  "Browser",
  "BrowserCapture",
  "TodoWrite",
  "TaskCreate",
  "TaskList",
  "TaskGet",
  "TaskOutput",
  "TaskUpdate",
  "TaskStop",
  "Read",
  "Grep",
  "Glob",
  "Terminal",
]);

function renderSessionSnapshot(
  settings: ShellSettings,
  integration: BotIntegrationConfig,
  session: BotSessionState
): string {
  const models = getAvailableBotModels(settings);
  const workspaces = collectAvailableWorkspaceRoots(integration);
  return JSON.stringify(
    {
      availableModels: models,
      availableWorkspaces: workspaces,
      current: {
        browserHostWebContentsId: session.browserHostWebContentsId ?? null,
        defaultWorkerMode: session.mode,
        leaderContextTurns: Math.floor(
          (session.leaderMessages?.length ?? 0) / 2
        ),
        modelId: session.modelId,
        qrLoginPending: Boolean(session.pendingQrLogin),
        workspaceRoot: session.workspaceRoot,
      },
      integration: {
        id: integration.id,
        name: integration.name || integration.platform,
        platform: integration.platform,
      },
    },
    null,
    2
  );
}

export function buildBotOrchestratorPrompt(
  settings: ShellSettings,
  integration: BotIntegrationConfig,
  session: BotSessionState,
  inbound: BotInboundMessage
): string {
  const language = settings.language ?? "fr";
  const sessionBlock = renderSessionSnapshot(settings, integration, session);
  const userName =
    inbound.senderName?.trim() || inbound.senderId?.trim() || "user";
  const extraPrompt = integration.systemPrompt?.trim();
  const botSkillAppend = buildBotSkillAppend(settings, integration);
  const globalRuleAppend = buildAgentGlobalRuleAppend(settings.agent, language);
  const lines = [
    "Vous êtes le bot Leader global de mAI Coder. Vous gérez directement l'application mAI Coder, ses outils et ses sessions de travail.",
    "Cette boucle Leader est dédiée à l'orchestration au niveau de l'application. Elle peut utiliser directement les outils de l'application/navigateur ainsi que les outils de session bot ci-dessous.",
    "Votre priorité est de répondre rapidement et directement à l'utilisateur. Utilisez par défaut vos propres outils (Read, Grep, Glob, Browser, BrowserCapture, Terminal) pour répondre sans lancer un worker. Utilisez la famille Task* (TaskCreate / TaskList / TaskGet / TaskOutput / TaskUpdate / TaskStop) lorsque l'utilisateur demande explicitement une tâche asynchrone.",
    "Utilisez run_async_task UNIQUEMENT lorsque la tâche nécessite des écritures/modifications, des builds/tests, des refactorisations multi-fichiers ou des flux longs. Les opérations shell directes peuvent utiliser Terminal sur place.",
    language === "en"
      ? "For saved SSH profiles, prefer Terminal exec for one-shot remote commands. Use open + write/read only when you need a persistent interactive terminal session."
      : "对于已保存的 SSH profile，单次远程命令优先使用 Terminal exec；只有在需要持续交互的终端会话时，才使用 open + write/read。",
    language === "en"
      ? "If the user asks about current model, workspace, browser state, git state, or other app state, inspect and answer directly."
      : "如果用户在问当前模型、工作区、浏览器状态、Git 状态或其他应用状态，直接检查并回答。",
    language === "en"
      ? "When delegating via run_async_task, choose mode automatically: agent for direct project implementation/debugging, plan for plan-only analysis, team for larger or cross-cutting project work, and ask for lightweight Q&A that still needs a recorded worker conversation."
      : "使用 run_async_task 时，自动判断模式：直接项目实现/调试用 agent，只做方案分析用 plan，较大或跨领域工作用 team，需要保留记录的轻量问答可用 ask。",
    language === "en"
      ? "When the user asks to search the web, open a page, read a webpage, interact with a login form, take a screenshot, or close the built-in browser, use Browser and BrowserCapture directly (for example: navigate, input_text, click_element, screenshot_page, list_requests, get_request)."
      : "当用户要求搜索网页、打开页面、与登录表单交互、读取网页内容、截屏或抓取浏览器网络请求时，直接使用 Browser 和 BrowserCapture 工具（例如：navigate、input_text、click_element、screenshot_page、list_requests、get_request）。",
    language === "en"
      ? "If a site switches to QR-code login or another manual mobile confirmation step, do not ask the user for passwords. Use pause_for_qr_login to send the current browser screenshot to the user, keep the browser session open, and wait for the user to confirm login is complete."
      : "如果网站切换到二维码登录或其他需要用户手机确认的登录步骤，不要向用户索要密码。请使用 pause_for_qr_login，把当前浏览器截图发给用户，保持浏览器会话不关闭，并等待用户确认登录完成。",
    language === "en"
      ? "If the user wants the screenshot or a local file to appear in the chat, do not stop at saving it locally. Use send_local_attachment to send the produced or located file back to the user."
      : "如果用户希望截图或本地文件直接出现在聊天窗口里，不要只停留在本地保存；拿到文件后继续调用 send_local_attachment 发回给用户。",
    language === "en"
      ? "For user-visible replies on external platforms like Feishu, be explicit and reasonably detailed. For substantial work, summarize what was checked, what was done, key findings, affected areas, and the next step."
      : "在飞书这类外部平台上给用户回复时，要明确且信息量充足。只要工作不算特别轻，就总结：检查了什么、做了什么、关键发现、影响范围，以及下一步建议。",
    language === "en"
      ? "If this bot has exclusive skills below, use them as part of your normal reasoning. They are not global skills; they belong only to this bot."
      : "如果下方配置了 Bot 专属 Skills，请把它们纳入你的正常推理流程。它们不是全局 Skill，只属于当前 Bot。",
    language === "en"
      ? `Current bot user: ${userName}`
      : `当前外部用户：${userName}`,
    "",
    "## mAI Coder Session",
    sessionBlock,
  ];
  if (extraPrompt) {
    lines.push("", "## Integration Prompt", extraPrompt);
  }
  if (
    integration.platform === "feishu" &&
    integration.feishu?.appId &&
    integration.feishu?.appSecret
  ) {
    const hasUserToken = Boolean(integration.feishu?.userAccessToken?.trim());
    const lns = [
      "",
      language === "en" ? "## Feishu tools" : "## 飞书工具",
      language === "en"
        ? "You can call native Feishu Open API tools when the user explicitly asks for Feishu document/folder/task/contact operations. Available tools:"
        : "当用户明确要求执行飞书文档 / 文件夹 / 任务 / 通讯录相关操作时，可以直接调用以下飞书原生 API 工具：",
      language === "en"
        ? "- Documents: create_feishu_document, get_feishu_document_blocks, batch_create_feishu_blocks, search_feishu_documents"
        : "- 文档：create_feishu_document、get_feishu_document_blocks、batch_create_feishu_blocks、search_feishu_documents",
      language === "en"
        ? "- Folders: get_feishu_folder_files, create_feishu_folder"
        : "- 文件夹：get_feishu_folder_files、create_feishu_folder",
    ];
    if (hasUserToken) {
      lns.push(
        language === "en"
          ? "- Tasks: list_feishu_tasks, create_feishu_task, update_feishu_task, delete_feishu_task"
          : "- 任务：list_feishu_tasks、create_feishu_task、update_feishu_task、delete_feishu_task",
        language === "en"
          ? "- Contacts: get_feishu_users (resolve a name to open_id, then pass it as assigneeIds when creating tasks)."
          : "- 通讯录：get_feishu_users（先把人名解析成 open_id，再作为 assigneeIds 传给任务创建工具）。"
      );
    } else {
      lns.push(
        language === "en"
          ? "- Tasks/contacts disabled: paste a user_access_token into the integration settings to unlock list_feishu_tasks / create_feishu_task / get_feishu_users."
          : "- 任务 / 通讯录工具未启用：在集成设置中粘贴 user_access_token 后即可解锁 list_feishu_tasks / create_feishu_task / get_feishu_users 等。"
      );
    }
    lns.push(
      language === "en"
        ? "Do NOT advertise these tools spontaneously. Use them only when the user is asking a Feishu-specific operation."
        : "不要主动宣传这些工具——仅当用户明确要求飞书相关操作时再调用。"
    );
    lines.push(...lns);
  }
  if (botSkillAppend.trim()) {
    lines.push("", botSkillAppend);
  }
  if (globalRuleAppend.trim()) {
    lines.push(
      "",
      language === "en" ? "## Global Reply Rules" : "## 全局回复规则",
      language === "en"
        ? "Follow these rules whenever you produce user-visible text, including short confirmations and direct replies."
        : "只要你输出任何面向用户的文本，包括简短确认和直接回复，也必须遵守以下规则。",
      "",
      globalRuleAppend
    );
  }
  // Dialectic 用户画像 + 关系演进注入（Hermes 式两层上下文）
  const dialecticBlock = buildDialecticContextBlock({
    turnNumber: session.turnCount ?? 0,
    workspaceRoot: session.workspaceRoot,
  });
  if (dialecticBlock) {
    lines.push("", dialecticBlock);
  }
  const relationshipBlock = buildRelationshipContextBlock(
    session.conversationKey
  );
  if (relationshipBlock) {
    lines.push("", relationshipBlock);
  }

  // Periodic Nudge: 每 8 轮提醒 Agent 主动沉淀知识（Hermes 式学习循环）
  const turnCount = session.turnCount ?? 0;
  if (turnCount > 0 && turnCount % 8 === 0) {
    lines.push(
      "",
      language === "en"
        ? `[System nudge] You have completed ${turnCount} turns with this user. Take a moment to reflect: are there any user preferences, project conventions, or lessons learned from this conversation worth persisting to long-term memory? If so, mention them naturally and they will be automatically extracted.`
        : `[系统提醒] 你已和用户完成了 ${turnCount} 轮对话。请回顾：本轮讨论中是否有值得长期保存的用户偏好、项目约定或经验教训？如果有，请在回复中自然提及，系统会自动提取到持久记忆。`
    );
  }
  return lines.join("\n");
}

function resolveSessionWorkspace(
  integration: BotIntegrationConfig,
  session: BotSessionState,
  requested: string
): { ok: true; workspaceRoot: string | null } | { ok: false; error: string } {
  const raw = requested.trim();
  if (!raw || raw.toLowerCase() === "none" || raw.toLowerCase() === "null") {
    session.workspaceRoot = null;
    return { ok: true, workspaceRoot: null };
  }
  const available = collectAvailableWorkspaceRoots(integration);
  const normalized = normalizeWorkspaceRoot(raw);
  if (!normalized) {
    return { error: "工作区路径无效。", ok: false };
  }
  const match = available.find(
    (item) => normalizeWorkspaceKey(item) === normalizeWorkspaceKey(normalized)
  );
  if (!match) {
    return { error: "目标工作区不在当前机器人可访问列表中。", ok: false };
  }
  session.workspaceRoot = match;
  return { ok: true, workspaceRoot: match };
}

const READONLY_TOOLS = new Set([
  "Read",
  "Grep",
  "Glob",
  "Browser",
  "BrowserCapture",
  "TodoWrite",
  "TaskList",
  "TaskGet",
  "TaskOutput",
  "pause_for_qr_login",
]);

function resolveBotPermissionPolicy(
  integration: BotIntegrationConfig
): "strict" | "readonly_auto" | "permissive" {
  const raw = String(integration.permissionPolicy ?? "")
    .trim()
    .toLowerCase();
  if (raw === "permissive" || raw === "readonly_auto" || raw === "strict") {
    return raw;
  }
  return "readonly_auto";
}

function createHeadlessBeforeExecuteTool(
  settings: ShellSettings,
  integration: BotIntegrationConfig,
  opts?: { hasPendingQrLogin?: () => boolean }
) {
  const policy = resolveBotPermissionPolicy(integration);
  return async (call: ToolCall) => {
    if (
      opts?.hasPendingQrLogin?.() &&
      call.name !== "pause_for_qr_login" &&
      call.name !== "get_async_session"
    ) {
      return {
        proceed: false as const,
        rejectionMessage: "二维码登录等待中，请先等待用户扫码并确认完成。",
      };
    }
    const agent = settings.agent;
    const permission = resolveToolPermissionFromRules(call, agent, {
      avoidPermissionPrompts: true,
    });
    if (permission === "deny") {
      return {
        proceed: false as const,
        rejectionMessage: "工具调用被当前权限规则拒绝。",
      };
    }

    if (READONLY_TOOLS.has(call.name) && policy !== "strict") {
      return { proceed: true as const };
    }

    if (call.name === "Bash") {
      const mode = getShellPermissionMode(agent);
      const command = String(call.arguments.command ?? "").trim();
      if (permission === "allow") {
        return mode === "ask_every_time"
          ? {
              proceed: false as const,
              rejectionMessage: "当前机器人会话无法处理 shell 执行确认。",
            }
          : { proceed: true as const };
      }
      if (mode === "always") {
        return { proceed: true as const };
      }
      if (mode === "rules" && isSafeShellCommandForAutoApprove(command)) {
        return { proceed: true as const };
      }
      if (
        policy === "permissive" &&
        isSafeShellCommandForAutoApprove(command)
      ) {
        return { proceed: true as const };
      }
      return {
        proceed: false as const,
        rejectionMessage:
          "当前机器人会话不会弹出 shell 执行确认，请在桌面端放宽权限后重试。",
      };
    }

    if (call.name === "Write" || call.name === "Edit") {
      if (
        permission === "allow" ||
        settings.agent?.confirmWritesBeforeExecute !== true
      ) {
        return { proceed: true as const };
      }
      if (policy === "permissive") {
        return { proceed: true as const };
      }
      return {
        proceed: false as const,
        rejectionMessage:
          "当前机器人会话不会弹出写入确认，请关闭写入确认或改在桌面端执行。",
      };
    }

    return { proceed: true as const };
  };
}

function ensureThreadForSession(
  session: BotSessionState,
  mode: BotComposerMode,
  forceNewThread = false
): string {
  const key = workerThreadMapKey(session.workspaceRoot, mode);
  const existing = session.threadIdsByWorkspace[key];
  if (!forceNewThread && existing && getThread(existing)) {
    return existing;
  }
  const created = createThread(session.workspaceRoot, { select: false });
  session.threadIdsByWorkspace[key] = created.id;
  return created.id;
}

async function runBotAsyncTask(args: RunBotAsyncTaskArgs): Promise<string> {
  const { settings, integration, session, task, workspaceLspManager, signal } =
    args;
  const mode = args.modeOverride ?? session.mode;
  const threadId = ensureThreadForSession(
    session,
    mode,
    args.startNewThread === true
  );
  const hostWebContentsId = resolveSessionBotHostWebContentsId(session);
  try {
    const modelSelection = session.modelId.trim();
    if (!modelSelection) {
      throw new Error(
        "当前机器人会话没有可用的模型。请先在设置里为该机器人配置可用模型。"
      );
    }
    const resolved = resolveModelRequest(settings, modelSelection);
    if (!resolved.ok) {
      throw new Error(resolved.message);
    }

    // Vérification préventive du quota avant de lancer la tâche bot
    if (
      resolved.providerId === "mai" ||
      resolved.baseURL?.includes("mai.val.run")
    ) {
      const quota = await checkMaiQuotaAvailable(settings, true);
      if (!quota.available) {
        throw new Error(
          quota.message || "Votre quota hebdomadaire mAI est épuisé."
        );
      }
    }

    const effectiveSettings: ShellSettings = {
      ...settings,
      team: {
        ...(settings.team ?? {}),
        requirePlanApproval: false,
      },
    };

    let workspaceFiles: string[] = [];
    if (session.workspaceRoot) {
      try {
        workspaceFiles = await ensureWorkspaceFileIndex(
          session.workspaceRoot,
          signal
        );
      } catch {
        workspaceFiles = [];
      }
    }

    const projectAgent = readWorkspaceAgentProjectSlice(session.workspaceRoot);
    const agentForTurn = mergeBotSkillsIntoAgent(
      mergeAgentWithPluginRuntime(
        mergeAgentWithProjectSlice(effectiveSettings.agent, projectAgent),
        session.workspaceRoot
      ),
      integration
    );
    const uiLanguage = effectiveSettings.language ?? "fr";
    const prepared = prepareUserTurnForChat(
      task,
      agentForTurn,
      session.workspaceRoot,
      workspaceFiles,
      uiLanguage
    );
    let finalSystemAppend = prepared.agentSystemAppend;

    // Frozen memory: 同一会话内缓存 MEMORY.md，保留 LLM prefix cache
    if (session.cachedMemoryPrompt === undefined) {
      session.cachedMemoryPrompt =
        mode === "agent" && session.workspaceRoot
          ? await loadMemoryPrompt(session.workspaceRoot)
          : null;
    }
    if (session.cachedMemoryPrompt) {
      finalSystemAppend = appendSystemBlock(
        finalSystemAppend,
        session.cachedMemoryPrompt
      );
    }
    if (modeExpandsWorkspaceFileContext(mode) && session.workspaceRoot) {
      const gitBlock = await getGitContextBlock(session.workspaceRoot);
      if (gitBlock) {
        finalSystemAppend = appendSystemBlock(finalSystemAppend, gitBlock);
      }
    }

    const updatedThread = appendMessage(threadId, {
      content: prepared.userText,
      role: "user",
    });
    const thinkingLevel = resolveThinkingLevelForSelection(
      effectiveSettings,
      modelSelection
    );
    const thread = getThread(threadId);
    const compressResult = await compressForSend(
      updatedThread.messages,
      effectiveSettings,
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
        signal,
        ...(resolved.contextWindowTokens == null
          ? {}
          : { contextWindowTokens: resolved.contextWindowTokens }),
        temperatureMode: resolved.temperatureMode,
        ...(resolved.temperature == null
          ? {}
          : { temperature: resolved.temperature }),
        thinkingLevel,
      },
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

    const usedSkillSlug = prepared.usedSkillSlug;
    const finish = (
      full: string,
      usage?: { inputTokens?: number; outputTokens?: number }
    ) => {
      updateLastAssistant(threadId, full);
      accumulateTokenUsage(threadId, usage?.inputTokens, usage?.outputTokens);
      const turnTokens = (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0);
      if (turnTokens > 0) {
        void recordMaiTokenUsage(turnTokens);
      }
      // Skill self-improve: 记录使用并更新 stats
      if (usedSkillSlug && session.workspaceRoot) {
        void recordSkillUsage(usedSkillSlug, session.workspaceRoot);
        void updateSkillSuccessRate(usedSkillSlug, session.workspaceRoot, true);
      }
      queueExtractMemories({
        enableSkillExtraction: true,
        modelSelection,
        settings: effectiveSettings,
        threadId,
        workspaceRoot: session.workspaceRoot,
      });
      // Dialectic 实时推理：分析对话并更新用户画像 + 关系演进
      const threadForDialectic = getThread(threadId);
      if (threadForDialectic && session.workspaceRoot) {
        void runDialecticAnalysis({
          messages: threadForDialectic.messages,
          modelSelection,
          sessionId: threadId,
          settings: effectiveSettings,
          turnNumber: session.turnCount ?? 0,
          workspaceRoot: session.workspaceRoot,
        });
      }
    };

    if (mode === "team") {
      return await new Promise<string>(async (resolve, reject) => {
        try {
          let teamStreamFull = "";
          await runTeamSession({
            agentSystemAppend: finalSystemAppend,
            emit: (evt) => {
              if (evt.type === "delta") {
                teamStreamFull += evt.text;
                args.onInnerTextDelta?.(teamStreamFull, "worker");
                return;
              }
              if (evt.type === "tool_call") {
                let parsedArgs: Record<string, unknown> = {};
                try {
                  parsedArgs = JSON.parse(evt.args) as Record<string, unknown>;
                } catch {
                  parsedArgs = {};
                }
                if (evt.name === "TodoWrite") {
                  args.onInnerTodoUpdate?.(extractBotTodosFromArgs(parsedArgs));
                }
                args.onInnerToolStatus?.(
                  evt.name,
                  "running",
                  describeBotToolActivity(evt.name, parsedArgs)
                );
                return;
              }
              if (evt.type === "tool_progress") {
                args.onInnerToolStatus?.(
                  evt.name,
                  "running",
                  evt.detail || evt.phase
                );
                return;
              }
              if (evt.type === "tool_result") {
                args.onInnerToolStatus?.(
                  evt.name,
                  evt.success ? "completed" : "error"
                );
              }
            },
            extraReadableRoots: prepared.readableRoots,
            hostWebContentsId,
            messages: sendMessages,
            modelSelection,
            onDone: (full, usage, teamSnapshot) => {
              finish(full, usage);
              if (teamSnapshot) {
                saveTeamSession(threadId, teamSnapshot);
              }
              resolve(full);
            },
            onError: (message) => reject(new Error(message)),
            resolvedModel: resolved,
            settings: effectiveSettings,
            signal,
            thinkingLevel,
            threadId,
            workspaceLspManager,
            workspaceRoot: session.workspaceRoot,
          });
        } catch (error) {
          reject(error);
        }
      });
    }

    if (
      (mode === "agent" || mode === "plan") &&
      resolved.paradigm !== "gemini"
    ) {
      const messagesForAgent = modeExpandsWorkspaceFileContext(mode)
        ? await resolveMessagesForSend(sendMessages, session.workspaceRoot)
        : sendMessages;
      let innerStreamFull = "";
      return await new Promise<string>(async (resolve, reject) => {
        try {
          await runAgentLoop(
            effectiveSettings,
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
              temperatureMode: resolved.temperatureMode,
              ...(resolved.temperature == null
                ? {}
                : { temperature: resolved.temperature }),
              beforeExecuteTool: createHeadlessBeforeExecuteTool(
                effectiveSettings,
                integration,
                {
                  hasPendingQrLogin: () => Boolean(session.pendingQrLogin),
                }
              ),
              composerMode: mode,
              extraReadableRoots: prepared.readableRoots,
              hostWebContentsId,
              maxConsecutiveMistakes:
                effectiveSettings.agent?.maxConsecutiveMistakes,
              mistakeLimitEnabled: effectiveSettings.agent?.mistakeLimitEnabled,
              signal,
              thinkingLevel,
              threadId,
              toolHooks: {
                beforeWrite: ({ path: relPath, previousContent }) => {
                  touchFileInThread(
                    threadId,
                    relPath,
                    previousContent === null ? "created" : "modified",
                    previousContent === null
                  );
                },
              },
              workspaceLspManager,
              workspaceRoot: session.workspaceRoot,
              ...(finalSystemAppend?.trim()
                ? { agentSystemAppend: finalSystemAppend.trim() }
                : {}),
            },
            {
              onDone: (full, usage) => {
                finish(full, usage);
                resolve(full);
              },
              onError: (message) => reject(new Error(message)),
              onTextDelta: (text) => {
                innerStreamFull += text;
                args.onInnerTextDelta?.(innerStreamFull, "worker");
              },
              onToolCall: (name, toolArgs) => {
                if (name === "TodoWrite") {
                  args.onInnerTodoUpdate?.(extractBotTodosFromArgs(toolArgs));
                }
                args.onInnerToolStatus?.(
                  name,
                  "running",
                  describeBotToolActivity(name, toolArgs)
                );
              },
              onToolProgress: (payload) => {
                args.onInnerToolStatus?.(
                  payload.name,
                  "running",
                  payload.detail || payload.phase
                );
              },
              onToolResult: (name, _result, success) => {
                incrementThreadAgentToolCallCount(threadId);
                args.onInnerToolStatus?.(name, success ? "completed" : "error");
              },
            }
          );
        } catch (error) {
          reject(error);
        }
      });
    }

    let askStreamFull = "";
    return await new Promise<string>(async (resolve, reject) => {
      try {
        await streamChatUnified(
          effectiveSettings,
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
            signal,
            temperatureMode: resolved.temperatureMode,
            ...(resolved.temperature == null
              ? {}
              : { temperature: resolved.temperature }),
            thinkingLevel,
            workspaceRoot: session.workspaceRoot,
            ...(finalSystemAppend?.trim()
              ? { agentSystemAppend: finalSystemAppend.trim() }
              : {}),
          },
          {
            onDelta: (text) => {
              askStreamFull += text;
              args.onInnerTextDelta?.(askStreamFull, "worker");
            },
            onDone: (full, usage) => {
              finish(full, usage);
              resolve(full);
            },
            onError: (message) => reject(new Error(message)),
            onThinkingDelta: () => {},
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  } finally {
    if (hostWebContentsId != null) {
      if (session.pendingQrLogin?.hostWebContentsId === hostWebContentsId) {
        session.browserHostWebContentsId = hostWebContentsId;
      } else {
        closeBrowserWindowForHostId(hostWebContentsId);
        if (session.browserHostWebContentsId === hostWebContentsId) {
          session.browserHostWebContentsId = null;
        }
      }
    }
  }
}

export async function runBotOrchestratorTurn(
  args: RunBotOrchestratorArgs
): Promise<string> {
  const {
    settings,
    integration,
    session,
    inbound,
    workspaceLspManager,
    signal,
  } = args;
  session.lastUserId = inbound.senderId;
  session.lastUserName = inbound.senderName;
  if (!session.modelId.trim()) {
    throw new Error(
      "当前没有可用于机器人会话的模型。请先在设置里配置 OpenAI 兼容或 Anthropic 模型。"
    );
  }
  const resolved = resolveModelRequest(settings, session.modelId.trim());
  if (!resolved.ok) {
    throw new Error(resolved.message);
  }
  if (resolved.paradigm === "gemini") {
    throw new Error(
      "当前机器人桥接层需要支持工具调用的模型。请为机器人切换到 OpenAI 兼容或 Anthropic 模型。"
    );
  }

  // Vérification préventive du quota avant de lancer le tour d'orchestration
  if (
    resolved.providerId === "mai" ||
    resolved.baseURL?.includes("mai.val.run")
  ) {
    const quota = await checkMaiQuotaAvailable(settings, true);
    if (!quota.available) {
      throw new Error(
        quota.message || "Votre quota hebdomadaire mAI est épuisé."
      );
    }
  }

  const handlers: Record<
    string,
    (
      call: ToolCall,
      _hooks: ToolExecutionHooks,
      _execCtx: ToolExecutionContext
    ) => Promise<ToolResult>
  > = {
    get_async_session: async (call) => ({
      content: renderSessionSnapshot(settings, integration, session),
      isError: false,
      name: call.name,
      toolCallId: call.id,
    }),
    new_async_thread: async (call) => {
      const created = createThread(session.workspaceRoot, { select: false });
      session.threadIdsByWorkspace[
        workerThreadMapKey(session.workspaceRoot, session.mode)
      ] = created.id;
      const reason = String(call.arguments.reason ?? "").trim();
      return {
        content: reason
          ? `已创建新线程：${created.id}。原因：${reason}`
          : `已创建新线程：${created.id}`,
        isError: false,
        name: call.name,
        toolCallId: call.id,
      };
    },
    pause_for_qr_login: async (call) => {
      if (!args.onSendAttachment) {
        return {
          content: "当前平台不支持发送图片，无法执行二维码登录等待流程。",
          isError: true,
          name: call.name,
          toolCallId: call.id,
        };
      }
      const currentHostId = resolveSessionBotHostWebContentsId(session);
      if (!currentHostId) {
        return {
          content: "当前没有可用的浏览器宿主窗口，无法发送二维码截图。",
          isError: true,
          name: call.name,
          toolCallId: call.id,
        };
      }
      try {
        const screenshot = await captureBrowserScreenshotForBot({
          hostWebContentsId: currentHostId,
          session,
          tabId:
            typeof call.arguments.tab_id === "string"
              ? String(call.arguments.tab_id).trim()
              : undefined,
          timeoutMs: Number(call.arguments.timeout_ms ?? 25_000),
        });
        await args.onSendAttachment(screenshot.path);
        const replyText =
          String(call.arguments.message ?? "").trim() ||
          defaultQrLoginReplyText(settings.language);
        session.browserHostWebContentsId = currentHostId;
        session.pendingQrLogin = {
          hostWebContentsId: currentHostId,
          pageUrl: screenshot.pageUrl || undefined,
          replyText,
          requestedAt: Date.now(),
          screenshotPath: screenshot.path,
          tabId:
            typeof call.arguments.tab_id === "string"
              ? String(call.arguments.tab_id).trim() || undefined
              : undefined,
        };
        return {
          content:
            settings.language === "zh-CN"
              ? `已将二维码登录截图发送给用户：${screenshot.path}。现在请停止后续操作，等待用户确认“已登录”。`
              : settings.language === "fr"
                ? `La capture d'écran de connexion QR a été envoyée à l'utilisateur : ${screenshot.path}. Arrêtez-vous maintenant et attendez que l'utilisateur confirme qu'il est connecté.`
                : `QR login screenshot sent to the user at ${screenshot.path}. Stop now and wait for the user to confirm login is complete.`,
          isError: false,
          name: call.name,
          toolCallId: call.id,
        };
      } catch (error) {
        return {
          content: error instanceof Error ? error.message : String(error),
          isError: true,
          name: call.name,
          toolCallId: call.id,
        };
      }
    },
    run_async_task: async (call) => {
      const task = String(call.arguments.task ?? "").trim();
      if (!task) {
        return {
          content: "task 不能为空。",
          isError: true,
          name: call.name,
          toolCallId: call.id,
        };
      }
      try {
        const rawMode = String(call.arguments.mode ?? "").trim();
        const modeOverride =
          rawMode === "agent" ||
          rawMode === "ask" ||
          rawMode === "plan" ||
          rawMode === "team"
            ? rawMode
            : undefined;
        const result = await runBotAsyncTask({
          integration,
          modeOverride,
          onInnerTextDelta: args.onStreamDelta,
          onInnerTodoUpdate: args.onTodoUpdate,
          onInnerToolStatus: args.onToolStatus,
          session,
          settings,
          signal,
          startNewThread: call.arguments.new_thread === true,
          task,
          workspaceLspManager,
        });
        return {
          content: [
            `workspace=${session.workspaceRoot ?? "(none)"}`,
            `mode=${modeOverride ?? session.mode}`,
            `model=${session.modelId}`,
            "",
            result,
          ].join("\n"),
          isError: false,
          name: call.name,
          toolCallId: call.id,
        };
      } catch (error) {
        return {
          content: error instanceof Error ? error.message : String(error),
          isError: true,
          name: call.name,
          toolCallId: call.id,
        };
      }
    },
    send_local_attachment: async (call) => {
      if (!args.onSendAttachment) {
        return {
          content: "当前平台不支持发送附件。",
          isError: true,
          name: call.name,
          toolCallId: call.id,
        };
      }
      try {
        const resolvedPath = resolveBotLocalAttachmentPath(
          session,
          String(call.arguments.file_path ?? "").trim()
        );
        const result = await args.onSendAttachment(resolvedPath);
        return {
          content: result,
          isError: false,
          name: call.name,
          toolCallId: call.id,
        };
      } catch (error) {
        return {
          content: error instanceof Error ? error.message : String(error),
          isError: true,
          name: call.name,
          toolCallId: call.id,
        };
      }
    },
    switch_model: async (call) => {
      const requested = String(call.arguments.model_id ?? "").trim();
      const model = getAvailableBotModels(settings).find(
        (item) => item.id === requested
      );
      if (!model) {
        return {
          content: "目标模型不存在，或当前不支持 bot 工具调用。",
          isError: true,
          name: call.name,
          toolCallId: call.id,
        };
      }
      session.modelId = model.id;
      return {
        content: `已切换模型：${model.label} (${model.id})`,
        isError: false,
        name: call.name,
        toolCallId: call.id,
      };
    },
    switch_workspace: async (call) => {
      const requested = String(call.arguments.workspace ?? "").trim();
      const resolvedWorkspace = resolveSessionWorkspace(
        integration,
        session,
        requested
      );
      return resolvedWorkspace.ok
        ? {
            content: resolvedWorkspace.workspaceRoot
              ? `已切换到工作区：${resolvedWorkspace.workspaceRoot}`
              : "已清空当前工作区上下文。",
            isError: false,
            name: call.name,
            toolCallId: call.id,
          }
        : {
            content: resolvedWorkspace.error,
            isError: true,
            name: call.name,
            toolCallId: call.id,
          };
    },
  };

  const thinkingLevel = resolveThinkingLevelForSelection(
    settings,
    session.modelId.trim()
  );
  const systemAppend = buildBotOrchestratorPrompt(
    settings,
    integration,
    session,
    inbound
  );
  const hostWebContentsId = resolveSessionBotHostWebContentsId(session);
  let full = "";
  let errorMessage = "";
  let streamFull = "";
  const feishuBundle = buildFeishuToolBundle(integration, (next) => {
    updateBotIntegrationFeishuTokens(integration.id, next);
  });
  if (feishuBundle) {
    Object.assign(handlers, feishuBundle.handlers);
  }
  const leaderToolPool = [
    ...AGENT_TOOLS.filter((tool) =>
      BOT_LEADER_NATIVE_TOOL_NAMES.has(tool.name)
    ),
    ...BOT_TOOL_DEFS,
    ...(feishuBundle?.toolDefs ?? []),
  ];
  const userTurnContent = buildUserTurnContentWithAttachments(inbound);
  const baseLeaderMessages = [
    ...session.leaderMessages,
    { content: userTurnContent, role: "user" } satisfies ChatMessage,
  ];
  const leaderCompress = await compressForSend(
    baseLeaderMessages,
    settings,
    {
      maxOutputTokens: resolved.maxOutputTokens,
      mode: "agent",
      paradigm: resolved.paradigm,
      requestApiKey: resolved.apiKey,
      requestBaseURL: resolved.baseURL,
      requestModelId: resolved.requestModelId,
      requestOAuthAuth: resolved.oauthAuth,
      requestProviderId: resolved.providerId,
      requestProviderIdentity: resolved.providerIdentity,
      requestProxyUrl: resolved.proxyUrl,
      signal,
      temperatureMode: resolved.temperatureMode,
      ...(resolved.temperature == null
        ? {}
        : { temperature: resolved.temperature }),
      thinkingLevel,
    },
    session.leaderSummary,
    session.leaderSummaryCoversCount
  ).catch(
    () =>
      ({ messages: baseLeaderMessages }) as {
        messages: ChatMessage[];
        newSummary?: string;
        newSummaryCoversCount?: number;
      }
  );
  if (
    leaderCompress.newSummary &&
    leaderCompress.newSummaryCoversCount !== undefined
  ) {
    session.leaderSummary = leaderCompress.newSummary;
    session.leaderSummaryCoversCount = leaderCompress.newSummaryCoversCount;
  }
  const leaderMessages = leaderCompress.messages;

  try {
    await runAgentLoop(
      settings,
      leaderMessages,
      {
        maxOutputTokens: resolved.maxOutputTokens,
        modelSelection: session.modelId.trim(),
        paradigm: resolved.paradigm,
        requestApiKey: resolved.apiKey,
        requestBaseURL: resolved.baseURL,
        requestModelId: resolved.requestModelId,
        requestOAuthAuth: resolved.oauthAuth,
        requestProviderId: resolved.providerId,
        requestProviderIdentity: resolved.providerIdentity,
        requestProxyUrl: resolved.proxyUrl,
        temperatureMode: resolved.temperatureMode,
        ...(resolved.temperature == null
          ? {}
          : { temperature: resolved.temperature }),
        agentSystemAppend: systemAppend,
        beforeExecuteTool: createHeadlessBeforeExecuteTool(
          settings,
          integration,
          {
            hasPendingQrLogin: () => Boolean(session.pendingQrLogin),
          }
        ),
        composerMode: "agent",
        customToolHandlers: handlers,
        hostWebContentsId,
        maxConsecutiveMistakes: settings.agent?.maxConsecutiveMistakes,
        mistakeLimitEnabled: settings.agent?.mistakeLimitEnabled,
        signal,
        thinkingLevel,
        toolPoolOverride: leaderToolPool,
        workspaceLspManager,
        workspaceRoot: session.workspaceRoot,
      },
      {
        onDone: (text) => {
          full = text;
        },
        onError: (message) => {
          errorMessage = message;
        },
        onTextDelta: (text) => {
          streamFull += text;
          full = streamFull;
          args.onStreamDelta?.(streamFull, "leader");
        },
        onToolCall: (name, toolArgs) => {
          if (name === "TodoWrite") {
            args.onTodoUpdate?.(extractBotTodosFromArgs(toolArgs));
          }
          args.onToolStatus?.(
            name,
            "running",
            describeBotToolActivity(name, toolArgs)
          );
        },
        onToolProgress: (payload) => {
          args.onToolStatus?.(
            payload.name,
            "running",
            payload.detail || payload.phase
          );
        },
        onToolResult: (name, _result, success) => {
          args.onToolStatus?.(name, success ? "completed" : "error");
        },
      }
    );
  } catch (error) {
    errorMessage = formatLlmSdkError(error);
  } finally {
    if (hostWebContentsId != null) {
      if (session.pendingQrLogin?.hostWebContentsId === hostWebContentsId) {
        session.browserHostWebContentsId = hostWebContentsId;
      } else {
        closeBrowserWindowForHostId(hostWebContentsId);
        if (session.browserHostWebContentsId === hostWebContentsId) {
          session.browserHostWebContentsId = null;
        }
      }
    }
  }

  if (errorMessage) {
    args.onLeaderMessagesPersist?.(session);
    throw new Error(errorMessage);
  }
  session.leaderMessages = trimBotLeaderMessages([
    ...baseLeaderMessages,
    { content: full.trim(), role: "assistant" } satisfies ChatMessage,
  ]);
  session.turnCount = (session.turnCount ?? 0) + 1;
  args.onLeaderMessagesPersist?.(session);
  return full.trim();
}

export function createBotWorkspaceLspManager(
  getSettings: () => ShellSettings
): WorkspaceLspManager {
  return new WorkspaceLspManager(getSettings, () => app.getAppPath());
}
