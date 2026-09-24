import "server-only";

import { z } from "zod";
import { defineTool } from "@/lib/agent/tools/define-tool";
import type { AgentTool, RegisteredAgentTool } from "@/lib/agent/types";
import { toolFailure, toolSuccess } from "@/lib/agent/types";
import { getUserMcpPrefs } from "@/lib/db/queries";
import type { McpServer } from "@/lib/db/schema";
import { callMcpTool, getFilteredTools } from "@/lib/mcp/client";
import {
  loadMcpSecretDescriptors,
  mergeMcpSecrets,
} from "@/lib/mcp/secrets-config";
import type {
  McpAuthType,
  McpServerConfig,
  McpToolCallResult,
  McpToolDefinition,
  McpToolOverride,
  McpTransport,
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
  const safeServerName = params.serverName
    .replace(/[^a-zA-Z0-9]/g, "_")
    .toLowerCase();
  const safeToolName = params.toolName.replace(/[^a-zA-Z0-9_-]/g, "_");
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
  const prefs = await getUserMcpPrefs(params.userId).catch(() => null);
  if (prefs?.globalKillSwitch) {
    return [];
  }
  if (params.server.transport === "stdio" && prefs?.allowStdio === false) {
    return [];
  }
  const serverConfig: McpServerConfig = {
    args: (params.server.args as string[]) ?? [],
    authConfig: (params.server.authConfig ??
      {}) as McpServerConfig["authConfig"],
    authType: params.server.authType as McpAuthType,
    command: params.server.command,
    env: (params.server.env ?? {}) as Record<string, string>,
    headers: (params.server.headers ?? {}) as Record<string, string>,
    id: params.server.id,
    name: params.server.name,
    timeoutMs: params.server.timeoutMs,
    toolOverrides: (params.server.toolOverrides ?? {}) as Record<
      string,
      McpToolOverride
    >,
    toolsCache: (params.server.toolsCache ?? []) as McpToolDefinition[],
    transport: params.server.transport as McpTransport,
    url: params.server.url,
  };
  const cachedTools = getFilteredTools(serverConfig);
  if (cachedTools.length === 0) {
    return [];
  }

  // Secrets : déchiffrés une fois par run, fusionnés dans la configuration
  // d'appel. En cas d'échec de déchiffrement, la valeur est ignorée (jamais
  // de secret vide envoyé).
  const secrets = await loadMcpSecretDescriptors({
    serverId: params.server.id,
    userId: params.userId,
  }).catch(() => []);
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
  serverConfig.timeoutMs = 20_000;

  const tools: RegisteredAgentTool[] = [];
  for (const cached of cachedTools) {
    const toolId = mcpAgentToolId({
      serverName: params.server.name,
      toolName: cached.name,
    });
    const summary = `[MCP · ${params.server.name}] ${cached.name}`;

    const agentTool: AgentTool<Record<string, unknown>> = defineTool<
      Record<string, unknown>
    >({
      availability: {
        categories: ["mcp"],
        requires: { tools: true },
        tiers: "all",
      },
      category: "mcp",
      description: cached.description?.slice(0, 500) || summary,
      execute: async (input) => {
        try {
          const result = await callMcpTool(serverConfig, cached.name, input);
          if (result?.isError) {
            return toolFailure(
              "tool_failed",
              `Le serveur MCP « ${params.server.name} » a signalé une erreur pour ${cached.name}.`,
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
            `L'appel MCP « ${cached.name} » sur ${params.server.name} a échoué (serveur injoignable ou erreur d'authentification).`,
            { category: "transient", retryable: true }
          );
        }
      },
      id: toolId,
      name: `${params.server.name} · ${cached.name}`,
      permissions: {
        default: "ask",
        impact: "external_mutation",
        readOnly: false,
      },
      schema: z.record(z.string(), z.unknown()) as z.ZodType<
        Record<string, unknown>
      >,
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
  userId: string;
}): Promise<RegisteredAgentTool[]> {
  const results = await Promise.all(
    params.servers.map((server) =>
      buildMcpAgentTools({ server, userId: params.userId }).catch(() => [])
    )
  );
  return results.flat();
}
