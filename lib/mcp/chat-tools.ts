import { tool } from "ai";
import { z } from "zod";
import {
  createNotification,
  logMcpExecution,
  updateMcpServerStats,
} from "@/lib/db/queries";
import type { McpServer } from "@/lib/db/schema";
import { classifyToolAction, needsApproval } from "./classifier";
import { callMcpTool } from "./client";

export function createMcpChatTools({
  approvedToolIds,
  chatId,
  servers,
  userId,
}: {
  approvedToolIds?: Set<string>;
  chatId?: string;
  servers: McpServer[];
  userId: string;
}) {
  const tools: Record<string, any> = {};

  for (const server of servers) {
    if (!server.isEnabled) {
      continue;
    }
    const cachedTools = (server.toolsCache as any[]) || [];

    for (const t of cachedTools) {
      const safeServerName = server.name
        .replace(/[^a-zA-Z0-9]/g, "_")
        .toLowerCase();
      const safeToolName = t.name.replace(/[^a-zA-Z0-9_-]/g, "_");
      const toolId = `mcp_${safeServerName}_${safeToolName}`;

      const actionType = classifyToolAction(t.name, t.description);
      const policy = (server.requireApproval as any) || "write_only";
      const requireUserApproval = needsApproval(policy, actionType);

      const isApproved =
        Boolean(approvedToolIds?.has(toolId)) ||
        Boolean(approvedToolIds?.has(t.name)) ||
        Boolean(approvedToolIds?.has(`tool-${toolId}`));

      // Vrai Human-in-the-Loop : si l'action est sensible/soumise à politique et pas encore approuvée,
      // on omet la fonction `execute` pour que le SDK AI suspende l'appel et demande l'approbation de l'utilisateur.
      if (requireUserApproval && !isApproved) {
        tools[toolId] = (tool as any)({
          description: `[MCP: ${server.name}] ${t.description || t.name} (Action: ${actionType} - APPROBATION REQUISE)`,
          inputSchema: z.object({}).catchall(z.any()),
          parameters: z.record(z.string(), z.unknown()),
        });
        continue;
      }

      tools[toolId] = (tool as any)({
        description: `[MCP: ${server.name}] ${t.description || t.name} (Type d'action: ${actionType}${requireUserApproval ? " - Confirmé" : ""})`,
        execute: async (args: any) => {
          const startTime = Date.now();
          try {
            const result = await callMcpTool(
              {
                args: server.args as string[],
                authConfig: server.authConfig as any,
                authType: server.authType as any,
                command: server.command,
                env: server.env as Record<string, string>,
                headers: server.headers as Record<string, string>,
                name: server.name,
                transport: server.transport as any,
                url: server.url,
              },
              t.name,
              args
            );

            const durationMs = Date.now() - startTime;
            await logMcpExecution({
              actionType,
              approvalStatus: "approved",
              chatId,
              durationMs,
              inputPayload: args,
              outputPayload: result,
              serverId: server.id,
              serverName: server.name,
              toolName: t.name,
              userId,
            });
            // Statistiques par serveur (nb d'appels, latence moyenne, statut)
            updateMcpServerStats({
              durationMs,
              id: server.id,
              success: true,
              userId,
            }).catch(() => {});
            if (["write", "delete", "execute"].includes(actionType)) {
              createNotification({
                body: `Outil ${t.name} exécuté sur ${server.name}`,
                link: chatId ? `/chat/${chatId}` : "/mcp",
                title: "Demande d'accès MCP",
                type: "mcp_access_request",
                userId,
              }).catch(() => {});
            }

            return result;
          } catch (err: any) {
            const durationMs = Date.now() - startTime;
            await logMcpExecution({
              actionType,
              approvalStatus: "approved",
              chatId,
              durationMs,
              error: err.message,
              inputPayload: args,
              serverId: server.id,
              serverName: server.name,
              toolName: t.name,
              userId,
            });
            updateMcpServerStats({
              durationMs,
              id: server.id,
              success: false,
              userId,
            }).catch(() => {});
            return {
              error: `Erreur d'appel MCP ${server.name}::${t.name}: ${err.message}`,
            };
          }
        },
        inputSchema: z.object({}).catchall(z.any()),
        parameters: z.record(z.string(), z.unknown()),
      });
    }
  }

  return tools;
}
