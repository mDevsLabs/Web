import "server-only";

import { z } from "zod";
import { defineTool } from "@/lib/agent/tools/define-tool";
import type { AgentTool, RegisteredAgentTool } from "@/lib/agent/types";
import { toolFailure, toolSuccess } from "@/lib/agent/types";
import type { McpServer } from "@/lib/db/schema";
import { callMcpTool } from "@/lib/mcp/client";
import {
  loadMcpSecretDescriptors,
  mergeMcpSecrets,
} from "@/lib/mcp/secrets-config";

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

export async function buildMcpAgentTools(params: {
  server: McpServer;
  userId: string;
}): Promise<RegisteredAgentTool[]> {
  if (!params.server.isEnabled) {
    return [];
  }
  const cachedTools =
    (params.server.toolsCache as Array<{
      description?: string;
      name: string;
    }>) ?? [];
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
          const result = await callMcpTool(
            {
              args: (params.server.args as string[]) ?? [],
              authConfig: merged.authConfig,
              authType: (params.server.authType as "bearer") ?? "none",
              command: params.server.command ?? undefined,
              env: merged.env,
              headers: merged.headers,
              id: params.server.id,
              name: params.server.name,
              timeoutMs: 20_000,
              transport: (params.server.transport as "http") ?? "http",
              url: params.server.url ?? undefined,
            },
            cached.name,
            input
          );
          if (result?.isError) {
            return toolFailure(
              "tool_failed",
              `Le serveur MCP « ${params.server.name} » a signalé une erreur pour ${cached.name}.`,
              { category: "transient", retryable: true }
            );
          }
          return toolSuccess(summary, [
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
      permissions: { default: "ask", readOnly: false },
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
