import type {
  AgentToolDef,
  ToolCall,
  ToolResult,
} from "../../../agent/agentTools.js";
import type {
  ToolExecutionContext,
  ToolExecutionHooks,
} from "../../../agent/toolExecutor.js";
import type { BotIntegrationConfig } from "../../../botSettingsTypes.js";
import {
  buildFeishuApiClient,
  type FeishuTokenRefreshCallback,
} from "./feishuApiClient.js";
import {
  buildFeishuDocumentHandlers,
  FEISHU_DOCUMENT_TOOL_NAMES,
  feishuDocumentToolDefs,
} from "./feishuDocumentTools.js";
import {
  buildFeishuFolderHandlers,
  FEISHU_FOLDER_TOOL_NAMES,
  feishuFolderToolDefs,
} from "./feishuFolderTools.js";
import {
  buildFeishuTaskHandlers,
  FEISHU_TASK_TOOL_NAMES,
  feishuTaskToolDefs,
} from "./feishuTaskTools.js";
import {
  buildFeishuUserHandlers,
  FEISHU_USER_TOOL_NAMES,
  feishuUserToolDefs,
} from "./feishuUserTools.js";

export type FeishuToolHandler = (
  call: ToolCall,
  hooks: ToolExecutionHooks,
  execCtx: ToolExecutionContext
) => Promise<ToolResult>;

export type FeishuToolBundle = {
  toolDefs: AgentToolDef[];
  handlers: Record<string, FeishuToolHandler>;
  /** Tool names that require user_access_token (filtered out when none configured). */
  userTokenOnlyToolNames: string[];
};

/**
 * Build the per-integration Feishu tool bundle. Returns null when:
 * - integration.platform !== 'feishu', OR
 * - appId/appSecret are not configured.
 *
 * Tools that require user_access_token are dropped from `toolDefs` (and the
 * leader prompt) when `feishu.userAccessToken` is empty — the LLM never sees
 * tools it cannot successfully call.
 */
export function buildFeishuToolBundle(
  integration: BotIntegrationConfig,
  onTokensRefreshed?: FeishuTokenRefreshCallback
): FeishuToolBundle | null {
  const client = buildFeishuApiClient(integration, onTokensRefreshed);
  if (!client) return null;

  const userTokenOnly = new Set<string>([
    ...FEISHU_TASK_TOOL_NAMES,
    ...FEISHU_USER_TOOL_NAMES,
  ]);

  const allDefs: AgentToolDef[] = [
    ...feishuTaskToolDefs,
    ...feishuUserToolDefs,
    ...feishuDocumentToolDefs,
    ...feishuFolderToolDefs,
  ];

  const filteredDefs = client.hasUserToken
    ? allDefs
    : allDefs.filter((d) => !userTokenOnly.has(d.name));

  // Always wire all handlers — even for tools we hid from the LLM. If a stale
  // transcript replays a removed tool name we still surface a clean error
  // rather than crashing the dispatcher.
  const handlersRaw = {
    ...buildFeishuTaskHandlers(client),
    ...buildFeishuUserHandlers(client),
    ...buildFeishuDocumentHandlers(client),
    ...buildFeishuFolderHandlers(client),
  };
  const handlers: Record<string, FeishuToolHandler> = {};
  for (const [name, fn] of Object.entries(handlersRaw)) {
    handlers[name] = (call) => fn(call);
  }

  const expectedNames = new Set([
    ...FEISHU_TASK_TOOL_NAMES,
    ...FEISHU_USER_TOOL_NAMES,
    ...FEISHU_DOCUMENT_TOOL_NAMES,
    ...FEISHU_FOLDER_TOOL_NAMES,
  ]);
  for (const def of allDefs) {
    if (!expectedNames.has(def.name as never)) {
      throw new Error(`Feishu tool def ${def.name} not in expected name set.`);
    }
    if (!handlers[def.name]) {
      throw new Error(`Feishu tool def ${def.name} has no matching handler.`);
    }
  }

  return {
    handlers,
    toolDefs: filteredDefs,
    userTokenOnlyToolNames: [...userTokenOnly],
  };
}

export const ALL_FEISHU_TOOL_NAMES = [
  ...FEISHU_TASK_TOOL_NAMES,
  ...FEISHU_USER_TOOL_NAMES,
  ...FEISHU_DOCUMENT_TOOL_NAMES,
  ...FEISHU_FOLDER_TOOL_NAMES,
] as const;
