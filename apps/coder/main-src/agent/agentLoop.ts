/**
 * 多轮 Agent 工具循环 — 核心引擎。
 *
 * Découpé de manière modulaire :
 * - loop/agentLoopTypes.ts : Définitions de types (AgentLoopOptions, Handlers, etc.)
 * - loop/agentLoopUtils.ts : Utilitaires de batching, tool input deltas, streaming
 * - loop/openAiLoop.ts : Boucle agent compatible OpenAI
 * - loop/anthropicLoop.ts : Boucle agent native Anthropic
 */

import type { SendableMessage } from "../llm/sendResolved.js";
import { checkMaiQuotaAvailable } from "../maiAccountStore.js";
import type { ShellSettings } from "../settingsStore.js";
import { repairAgentThreadMessagesForApi } from "./agentToolProtocolRepair.js";
import {
  type AgentLoopHandlers,
  type AgentLoopOptions,
  prepareMcpConnectionsForSession,
  runAnthropicLoop,
  runOpenAILoop,
} from "./loop/index.js";

export * from "./loop/index.js";

export async function runAgentLoop(
  settings: ShellSettings,
  threadMessages: SendableMessage[],
  options: AgentLoopOptions,
  handlers: AgentLoopHandlers
): Promise<void> {
  const loopT0 = Date.now();
  const tid = options.threadId ?? "n/a";
  console.log(
    `[AgentLoop] runAgentLoop enter thread=${tid} paradigm=${options.paradigm} mode=${options.composerMode} msgCount=${threadMessages.length}`
  );
  const repairStart = Date.now();
  const messagesForApi = repairAgentThreadMessagesForApi(threadMessages);
  console.log(
    `[AgentLoop] repairAgentThreadMessagesForApi (${Date.now() - repairStart}ms) thread=${tid}`
  );
  await prepareMcpConnectionsForSession(
    options.composerMode,
    settings.mcpServers,
    options.workspaceRoot ?? null
  );
  console.log(
    `[AgentLoop] after MCP prepare, before ${options.paradigm === "anthropic" ? "Anthropic" : "OpenAI"} loop (${Date.now() - loopT0}ms since runAgentLoop enter) thread=${tid}`
  );
  // Vérification préventive du quota avant d'initier la boucle agent
  if (
    options.requestProviderId === "mai" ||
    options.requestBaseURL?.includes("mai.val.run")
  ) {
    const quota = await checkMaiQuotaAvailable(settings, false);
    if (!quota.available) {
      handlers.onError(
        quota.message || "Votre quota hebdomadaire mAI est épuisé."
      );
      return;
    }
  }

  switch (options.paradigm) {
    case "anthropic":
      return runAnthropicLoop(settings, messagesForApi, options, handlers);
    case "openai-compatible":
    default:
      return runOpenAILoop(settings, messagesForApi, options, handlers);
  }
}
