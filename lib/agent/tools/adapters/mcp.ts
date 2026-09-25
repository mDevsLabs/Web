import "server-only";

import type { z } from "zod";
import { defineTool } from "@/lib/agent/tools/define-tool";
import type { AgentTool, RegisteredAgentTool } from "@/lib/agent/types";
import { toolFailure, toolSuccess } from "@/lib/agent/types";
import { getUserMcpPrefs } from "@/lib/db/queries";
import type { McpServer } from "@/lib/db/schema";
import { inputSchemaFor, mcpServerToConfig } from "@/lib/mcp/chat-tools";
import { classifyToolAction, needsApproval } from "@/lib/mcp/classifier";
import {
  callMcpTool,
  getFilteredTools,
  type McpRuntimePrefs,
  resolveRequireApproval,
  validateMcpConfig,
} from "@/lib/mcp/client";
import { assertMcpRuntimeEnabled } from "@/lib/mcp/policy";
import { redactMcpText } from "@/lib/mcp/redaction";
import {
  loadMcpSecretDescriptors,
  mergeMcpSecrets,
} from "@/lib/mcp/secrets-config";
import type {
  McpApprovalPolicy,
  McpServerConfig,
  McpToolCallResult,
} from "@/lib/mcp/types";

// Adaptateur MCP → AgentTool : les serveurs MCP installés et activés par
// l'utilisateur deviennent des outils Agent réellement exécutables. Chaque
// outil porte source "mcp" et catégorie "mcp" (le sélecteur et la timeline
// l'affichent comme tel). Les secrets chiffrés sont déchiffrés ici, côté
// serveur, au moment de la définition — jamais envoyés au modèle, jamais
// journalisés, jamais présents dans une URL ou le résultat d'exécution.
//
// La sélection d'outils par étape reste celle du runtime : ces outils sont
// simplement ajoutés au pool d'outils du run. Une réorientation peut les
// retirer au prochain point sûr (signature de sélection).

export function mcpAgentToolId(params: {
  serverName: string;
  toolName: string;
}): string {
  const safeServerName = redactMcpText(params.serverName, 120)
    .replace(/[^a-zA-Z0-9]/g, "_")
    .toLowerCase();
  const safeToolName = redactMcpText(params.toolName, 160).replace(
    /[^a-zA-Z0-9_-]/g,
    "_"
  );
  return `mcp_${safeServerName}_${safeToolName}`;
}

function boundedMcpResult(result: McpToolCallResult): unknown {
  try {
    const serialized = JSON.stringify(result);
    if (serialized.length <= 50_000) return result;
  } catch {}
  return {
    content: Array.isArray(result.content)
      ? result.content.slice(0, 10)
      : undefined,
    truncated: true,
  };
}

export async function buildMcpAgentTools(params: {
  server: McpServer;
  userId: string;
}): Promise<RegisteredAgentTool[]> {
  if (!params.server.isEnabled) {
    return [];
  }

  // Une erreur de lecture des préférences doit supprimer le pool MCP, jamais
  // le laisser ouvert par défaut.
  const storedPrefs = await getUserMcpPrefs(params.userId).catch(() => null);
  if (!storedPrefs) {
    return [];
  }
  const prefs: McpRuntimePrefs = {
    allowStdio: storedPrefs.allowStdio,
    globalKillSwitch: storedPrefs.globalKillSwitch,
  };
  if (prefs.globalKillSwitch) {
    return [];
  }

  const serverConfig: McpServerConfig = {
    ...mcpServerToConfig(params.server),
    isEnabled: params.server.isEnabled,
    rateLimitPerMin:
      params.server.rateLimitPerMin ?? storedPrefs.defaultRateLimitPerMin,
    requireApproval: params.server.requireApproval as McpApprovalPolicy,
    timeoutMs:
      params.server.timeoutMs ?? storedPrefs.defaultTimeoutMs ?? 15_000,
  };
  try {
    assertMcpRuntimeEnabled(serverConfig, prefs);
  } catch {
    return [];
  }
  const cachedTools = getFilteredTools(serverConfig);
  if (cachedTools.length === 0) {
    return [];
  }

  // Secrets : déchiffrés une fois par run, fusionnés dans la configuration
  // d'appel. En cas d'échec de déchiffrement, la valeur est ignorée (jamais
  // de secret vide envoyé).
  let secrets;
  try {
    secrets = await loadMcpSecretDescriptors({
      serverId: params.server.id,
      userId: params.userId,
    });
  } catch {
    return [];
  }
  const merged = mergeMcpSecrets({
    authConfig: params.server.authConfig,
    authType: params.server.authType,
    env: params.server.env,
    headers: params.server.headers,
    secrets,
  });
  serverConfig.authConfig = merged.authConfig;
  serverConfig.env = merged.env;
  serverConfig.headers = merged.headers;
  try {
    validateMcpConfig(serverConfig);
  } catch {
    return [];
  }

  const tools: RegisteredAgentTool[] = [];
  for (const cached of cachedTools) {
    const toolId = mcpAgentToolId({
      serverName: params.server.name,
      toolName: cached.name,
    });
    const summary = `[MCP · ${redactMcpText(params.server.name, 120)}] ${redactMcpText(cached.name, 160)}`;
    const actionType = classifyToolAction(cached.name, cached.description);
    const policy = resolveRequireApproval(serverConfig, cached.name);
    const requiresApproval = needsApproval(policy, actionType);
    const readOnly = actionType === "read";

    const agentTool: AgentTool<Record<string, unknown>> = defineTool<
      Record<string, unknown>
    >({
      availability: {
        categories: ["mcp"],
        requires: { tools: true },
        tiers: "all",
      },
      category: "mcp",
      description:
        (cached.description && redactMcpText(cached.description, 500)) ||
        summary,
      execute: async (input) => {
        try {
          const result = await callMcpTool(
            serverConfig,
            cached.name,
            input,
            prefs
          );
          if (result?.isError) {
            return toolFailure(
              "tool_failed",
              `Le serveur MCP « ${redactMcpText(params.server.name, 120)} » a signalé une erreur pour ${redactMcpText(cached.name, 160)}.`,
              { category: "transient", retryable: true }
            );
          }
          return toolSuccess(boundedMcpResult(result), [
            {
              id: `${params.server.id}:${cached.name}`,
              kind: "mcp",
              metadata: {
                serverId: params.server.id,
                toolName: cached.name,
              },
              title: `${params.server.name} · ${cached.name}`,
            },
          ]);
        } catch {
          return toolFailure(
            "tool_failed",
            `L'appel MCP « ${redactMcpText(cached.name, 160)} » sur ${redactMcpText(params.server.name, 120)} a échoué (serveur injoignable ou erreur d'authentification).`,
            { category: "transient", retryable: true }
          );
        }
      },
      id: toolId,
      name: `${params.server.name} · ${cached.name}`,
      permissions: {
        default: requiresApproval ? "ask" : "auto",
        destructive: actionType === "delete",
        impact: readOnly
          ? "read"
          : actionType === "delete"
            ? "deletion"
            : "external_mutation",
        readOnly,
      },
      schema: inputSchemaFor(cached) as z.ZodType<Record<string, unknown>>,
      source: "mcp",
      summarize: () => summary,
    });
    tools.push(agentTool as RegisteredAgentTool);
  }
  return tools;
}

// Outils MCP d'un utilisateur : serveurs activés, outils en cache découverts.
// Une erreur de lecture ne bloque jamais le run : le pool reste utilisable.
export async function listMcpAgentTools(params: {
  servers: McpServer[];
  serverIds?: readonly string[] | null;
  userId: string;
}): Promise<RegisteredAgentTool[]> {
  // `undefined` = appel interne historique (pool global). Un tableau, même
  // vide, est une whitelist stricte : un Agent sans serveur sélectionné n'a
  // donc aucun MCP disponible.
  const requestedServerIds = params.serverIds;
  const selectedIds =
    requestedServerIds == null
      ? null
      : new Set(requestedServerIds.filter((id) => typeof id === "string"));
  const servers =
    selectedIds === null
      ? params.servers
      : params.servers.filter((server) => selectedIds.has(server.id));
  if (servers.length === 0) {
    return [];
  }

  const results = await Promise.all(
    servers.map((server) =>
      buildMcpAgentTools({ server, userId: params.userId }).catch(() => [])
    )
  );
  return results.flat();
}
