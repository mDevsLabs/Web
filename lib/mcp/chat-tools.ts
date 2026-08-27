import { tool } from "ai";
import { z } from "zod";
import { logMcpExecution } from "@/lib/db/queries";
import type { McpServer } from "@/lib/db/schema";
import { classifyToolAction, needsApproval } from "./classifier";
import { callMcpTool } from "./client";

export function createMcpChatTools({
  chatId,
  servers,
  userId,
}: {
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

      tools[toolId] = (tool as any)({
        description: `[MCP: ${server.name}] ${t.description || t.name} (Type d'action: ${actionType}${requireUserApproval ? " - Confirmation requise" : ""})`,
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
