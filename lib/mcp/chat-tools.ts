import { tool } from "ai";
import { z } from "zod";
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
import { assertMcpRuntimeEnabled } from "./policy";
import { redactMcpError, redactMcpText, redactMcpValue } from "./redaction";
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
  const inputSchema = toolDefinition.inputSchema;
  if (!inputSchema || typeof inputSchema !== "object") {
    // Sans contrat publié, on conserve un objet extensible mais typé ; le
    // client MCP reste toutefois la source de vérité pour la validation.
    return z.object({}).catchall(z.unknown());
  }

  const required = new Set(inputSchema.required ?? []);
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const [name, property] of Object.entries(inputSchema.properties ?? {})) {
    if (!/^[A-Za-z_][A-Za-z0-9_-]{0,127}$/.test(name)) continue;
    let schema: z.ZodTypeAny;
    if (property.enum && property.enum.length > 0) {
      schema = z.enum(
        property.enum.map((value) => redactMcpText(value, 200)) as [
          string,
          ...string[],
        ]
      );
    } else {
      switch (property.type.toLowerCase()) {
        case "boolean":
          schema = z.boolean();
          break;
        case "integer":
          schema = z.number().int();
          break;
        case "number":
          schema = z.number();
          break;
        case "array":
          schema = z.array(z.unknown());
          break;
        case "object":
          schema = z.record(z.string(), z.unknown());
          break;
        case "null":
          schema = z.null();
          break;
        case "string":
        default:
          schema = z.string();
          break;
      }
    }
    if (property.description) schema = schema.describe(property.description);
    if (property.default !== undefined) {
      schema = schema.default(redactMcpValue(property.default) as never);
    }
    if (!required.has(name)) schema = schema.optional();
    shape[name] = schema;
  }

  const objectSchema = z.object(shape);
  return inputSchema.additionalProperties === true
    ? objectSchema.catchall(z.unknown())
    : objectSchema.strict();
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
  const usedToolIds = new Set<string>();

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
      const safeServerName = redactMcpText(server.name, 120)
        .replace(/[^a-zA-Z0-9]/g, "_")
        .toLowerCase();
      const safeToolName = definition.name.replace(/[^a-zA-Z0-9_-]/g, "_");
      let toolId = `mcp_${safeServerName}_${safeToolName}`;
      // Deux noms de serveurs peuvent se normaliser de la même façon. Ne pas
      // écraser silencieusement l'un des outils.
      if (usedToolIds.has(toolId)) {
        const suffix = server.id.replace(/[^a-zA-Z0-9]/g, "").slice(-8);
        toolId = `${toolId}_${suffix || "server"}`;
      }
      usedToolIds.add(toolId);

      const actionType = classifyToolAction(
        definition.name,
        definition.description
      );
      const policy = resolveRequireApproval(config, definition.name);
      const requireUserApproval = needsApproval(policy, actionType);
      const approved = Boolean(
        approvedToolIds?.has(toolId) || approvedToolIds?.has(`tool-${toolId}`)
      );
      const description = redactMcpText(
        `[MCP: ${server.name}] ${definition.description || definition.name}`,
        1000
      );
      const inputSchema = inputSchemaFor(definition);

      if (requireUserApproval && !approved) {
        // Vrai Human-in-the-Loop : sans fonction `execute`, le SDK AI suspend
        // l'appel et attend une décision explicite. L'identifiant canonique
        // est utilisé ; un nom d'outil brut partagé entre serveurs ne vaut pas
        // une approbation.
        tools[toolId] = (tool as any)({
          description: `${description} (Action: ${actionType} - APPROBATION REQUISE)`,
          inputSchema,
          parameters: z.record(z.string(), z.unknown()),
        });
        continue;
      }

      tools[toolId] = (tool as any)({
        description: `${description} (Action: ${actionType}${
          requireUserApproval ? " - Confirmé" : ""
        })`,
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
              approvalStatus: requireUserApproval
                ? "approved"
                : "auto_approved",
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
              approvalStatus: requireUserApproval
                ? "approved"
                : "auto_approved",
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
        parameters: z.record(z.string(), z.unknown()),
      });
    }
  }

  return tools;
}
