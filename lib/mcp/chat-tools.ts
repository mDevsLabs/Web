import { tool } from "ai";
import {
  createNotification,
  logMcpExecution,
  updateMcpServerStats,
} from "@/lib/db/queries";
import type { McpServer } from "@/lib/db/schema";
import { classifyToolAction, needsApproval } from "./classifier";
import {
  callMcpTool,
  getFilteredTools,
  type McpRuntimePrefs,
  resolveRequireApproval,
} from "./client";
import { jsonSchemaToZod } from "./input-schema";
import { assertMcpRuntimeEnabled } from "./policy";
import {
  allocateMcpProviderToolIds,
  isProviderToolName,
  mcpModelDescription,
} from "./provider-tool-id";
import { redactMcpError, redactMcpText } from "./redaction";
import type {
  McpApprovalPolicy,
  McpAuthType,
  McpServerConfig,
  McpToolDefinition,
  McpToolOverride,
  McpTransport,
} from "./types";

function asStringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => typeof item === "string")
      .map(([key, item]) => [key, item as string])
  );
}

/** Convertit une ligne DB (ou son clone runtime) en configuration appelable. */
export function mcpServerToConfig(server: McpServer): McpServerConfig {
  return {
    args: Array.isArray(server.args)
      ? (server.args.filter(
          (arg): arg is string => typeof arg === "string"
        ) as string[])
      : [],
    authConfig: (server.authConfig ?? {}) as McpServerConfig["authConfig"],
    authType: server.authType as McpAuthType,
    command: server.command,
    env: asStringRecord(server.env),
    headers: asStringRecord(server.headers),
    id: server.id,
    isEnabled: server.isEnabled,
    name: server.name,
    rateLimitPerMin: server.rateLimitPerMin,
    requireApproval: server.requireApproval as McpApprovalPolicy,
    timeoutMs: server.timeoutMs,
    toolOverrides: (server.toolOverrides ?? {}) as Record<
      string,
      McpToolOverride
    >,
    toolsCache: (server.toolsCache ?? []) as McpToolDefinition[],
    transport: server.transport as McpTransport,
    url: server.url,
  };
}

export function inputSchemaFor(toolDefinition: McpToolDefinition) {
  return jsonSchemaToZod(toolDefinition.inputSchema);
}

export function createMcpChatTools({
  approvedToolIds,
  chatId,
  servers,
  userId,
  prefs,
}: {
  approvedToolIds?: Set<string>;
  chatId?: string;
  servers: McpServer[];
  userId: string;
  prefs?: McpRuntimePrefs | null;
}) {
  if (!prefs || typeof prefs.globalKillSwitch !== "boolean") {
    return {} as Record<string, any>;
  }
  if (prefs.globalKillSwitch) {
    return {} as Record<string, any>;
  }

  const tools: Record<string, any> = {};
  const planned: Array<{
    config: ReturnType<typeof mcpServerToConfig>;
    definition: McpToolDefinition;
    server: McpServer;
  }> = [];

  for (const server of servers) {
    if (!server.isEnabled) continue;
    if (server.transport === "stdio" && prefs?.allowStdio !== true) continue;
    const config = mcpServerToConfig(server);
    try {
      assertMcpRuntimeEnabled(config, prefs);
    } catch {
      continue;
    }
    // Respecte les overrides `enabled` avant même d'exposer l'outil au
    // modèle. Le filtre est également appliqué au moment de l'appel dans le
    // client (défense en profondeur).
    const cachedTools = getFilteredTools(config);
    if (cachedTools.length === 0) continue;

    for (const definition of cachedTools) {
      if (!definition || typeof definition.name !== "string") continue;
      planned.push({ config, definition, server });
    }
  }

  const bindings = allocateMcpProviderToolIds(
    planned.map((item) => ({
      serverId: item.server.id,
      serverName: item.server.name,
      toolName: item.definition.name,
    }))
  );

  for (let index = 0; index < planned.length; index += 1) {
    const item = planned[index];
    const binding = bindings[index];
    if (!item || !binding || !isProviderToolName(binding.providerToolId)) {
      continue;
    }
    const { config, definition, server } = item;
    const toolId = binding.providerToolId;
    const actionType = classifyToolAction(
      definition.name,
      definition.description
    );
    const policy = resolveRequireApproval(config, definition.name);
    const requireUserApproval = needsApproval(policy, actionType);
    const approved = Boolean(
      approvedToolIds?.has(toolId) || approvedToolIds?.has(`tool-${toolId}`)
    );
    const approvalNote =
      requireUserApproval && !approved
        ? " - APPROBATION REQUISE"
        : requireUserApproval
          ? " - Confirmé"
          : "";
    const description = mcpModelDescription({
      actionNote: ` (Action: ${actionType}${approvalNote})`,
      description: definition.description,
      serverName: server.name,
      toolName: definition.name,
    });
    const inputSchema = inputSchemaFor(definition);

    if (requireUserApproval && !approved) {
      // Vrai Human-in-the-Loop : sans fonction `execute`, le SDK AI suspend
      // l'appel et attend une décision explicite. L'identifiant court est
      // celui de l'approbation ; l'appel utilise le nom d'outil d'origine.
      tools[toolId] = tool({
        description,
        inputSchema,
      });
      continue;
    }

    tools[toolId] = tool<any, any, any>({
      description,
      execute: async (args: Record<string, unknown>) => {
        const startTime = Date.now();
        try {
          const result = await callMcpTool(
            config,
            definition.name,
            args,
            prefs
          );

          const durationMs = Date.now() - startTime;
          await logMcpExecution({
            actionType,
            approvalStatus: requireUserApproval ? "approved" : "auto_approved",
            chatId,
            durationMs,
            inputPayload: args,
            outputPayload: result,
            serverId: server.id,
            serverName: server.name,
            toolName: definition.name,
            userId,
          });
          updateMcpServerStats({
            durationMs,
            id: server.id,
            success: true,
            userId,
          }).catch(() => {});
          if (["write", "delete", "execute"].includes(actionType)) {
            createNotification({
              body: `Outil ${redactMcpText(definition.name, 120)} exécuté sur ${redactMcpText(server.name, 120)}`,
              link: chatId ? `/chat/${chatId}` : "/mcp",
              title: "Demande d'accès MCP",
              type: "mcp_access_request",
              userId,
            }).catch(() => {});
          }

          return result;
        } catch (error: unknown) {
          const durationMs = Date.now() - startTime;
          const safeError = redactMcpError(error);
          await logMcpExecution({
            actionType,
            approvalStatus: requireUserApproval ? "approved" : "auto_approved",
            chatId,
            durationMs,
            error: safeError,
            inputPayload: args,
            serverId: server.id,
            serverName: server.name,
            toolName: definition.name,
            userId,
          });
          updateMcpServerStats({
            durationMs,
            id: server.id,
            success: false,
            userId,
          }).catch(() => {});
          return {
            error: `Erreur d'appel MCP ${redactMcpText(server.name, 120)}::${redactMcpText(definition.name, 120)}: ${safeError}`,
          };
        }
      },
      inputSchema,
    });
  }

  return tools;
}
