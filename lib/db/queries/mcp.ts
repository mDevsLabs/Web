import "server-only";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  isNull,
  lt,
  lte,
  notInArray,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import type { ToolCategory } from "@/lib/agent/types";
import { ChatbotError } from "@/lib/errors";
import {
  redactMcpError,
  redactMcpText,
  redactMcpValue,
} from "@/lib/mcp/redaction";
import {
  agent,
  agentTemplate,
  type Chat,
  chat,
  customCommand,
  type DBMessage,
  type DocumentProposal,
  document,
  documentProposal,
  mcpLog,
  mcpServer,
  mcpServerSecret,
  message,
  pluginInstallation,
  project,
  projectFile,
  projectInvite,
  projectMember,
  type ScheduledMessage,
  type Skill,
  type Suggestion,
  scheduledMessage,
  skill,
  skillUsage,
  skillVersion,
  stream,
  suggestion,
  toolExecution,
  userMcpPrefs,
  userMemory,
  vote,
} from "../schema";
import { _rawClient, dbReady, getDb, getRawClient } from "./connection";

// ==========================================
// MCP SERVER & LOG QUERIES
// ==========================================

export async function getMcpServersByUserId({ userId }: { userId: string }) {
  const database = await getDb();
  return database
    .select()
    .from(mcpServer)
    .where(eq(mcpServer.userId, userId))
    .orderBy(desc(mcpServer.createdAt));
}

export async function getMcpServerById({
  id,
  userId,
}: {
  id: string;
  userId?: string;
}) {
  const database = await getDb();
  const conditions = [eq(mcpServer.id, id)];
  if (userId) {
    conditions.push(eq(mcpServer.userId, userId));
  }
  const [result] = await database
    .select()
    .from(mcpServer)
    .where(and(...conditions));
  return result ?? null;
}

// Serveur MCP installé depuis un modèle donné : l'installation d'un modèle MCP
// est idempotente (un seul serveur par utilisateur et par slug de modèle).
export async function getMcpServerByTemplateId({
  userId,
  templateId,
}: {
  userId: string;
  templateId: string;
}) {
  const database = await getDb();
  const [result] = await database
    .select()
    .from(mcpServer)
    .where(
      and(eq(mcpServer.userId, userId), eq(mcpServer.templateId, templateId))
    )
    .limit(1);
  return result ?? null;
}

export async function createMcpServer(data: {
  userId: string;
  name: string;
  description?: string;
  icon?: string;
  transport?: "sse" | "http" | "stdio" | "websocket";
  url?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  authType?: "none" | "bearer" | "basic" | "oauth2" | "custom_headers";
  authConfig?: Record<string, any>;
  headers?: Record<string, string>;
  isEnabled?: boolean;
  requireApproval?: "always_allow" | "ask_permission" | "write_only";
  toolsCache?: any[];
  toolOverrides?: Record<
    string,
    { enabled: boolean; requireApproval?: string | null }
  >;
  timeoutMs?: number;
  rateLimitPerMin?: number;
  /** Slug du modèle MCP d'origine (voir lib/mcp-templates). */
  templateId?: string | null;
}) {
  const database = await getDb();
  const [created] = await database
    .insert(mcpServer)
    .values({
      args: (data.args as any) ?? [],
      authConfig: data.authConfig ?? {},
      authType: data.authType ?? "none",
      command: data.command ?? null,
      description: data.description ?? "",
      env: data.env ?? {},
      headers: data.headers ?? {},
      icon: data.icon ?? "server",
      isEnabled: data.isEnabled ?? true,
      name: data.name,
      rateLimitPerMin: data.rateLimitPerMin ?? 60,
      requireApproval: data.requireApproval ?? "write_only",
      templateId: data.templateId ?? null,
      timeoutMs: data.timeoutMs ?? 15_000,
      toolOverrides: (data.toolOverrides as any) ?? {},
      toolsCache: (data.toolsCache as any) ?? [],
      transport: data.transport ?? "sse",
      url: data.url ?? null,
      userId: data.userId,
    })
    .returning();
  return created;
}

export async function updateMcpServer({
  id,
  userId,
  data,
}: {
  id: string;
  userId: string;
  data: Partial<{
    name: string;
    description: string;
    icon: string;
    transport: "sse" | "http" | "stdio" | "websocket";
    url: string | null;
    command: string | null;
    args: string[];
    env: Record<string, string>;
    authType: "none" | "bearer" | "basic" | "oauth2" | "custom_headers";
    authConfig: Record<string, any>;
    headers: Record<string, string>;
    isEnabled: boolean;
    requireApproval: "always_allow" | "ask_permission" | "write_only";
    toolsCache: any[];
    toolOverrides: Record<
      string,
      { enabled: boolean; requireApproval?: string | null }
    >;
    timeoutMs: number;
    rateLimitPerMin: number;
    avgLatencyMs: number;
    callCount: number;
    uptimeStatus: string;
    lastSyncAt: Date | null;
    lastCallAt: Date | null;
  }>;
}) {
  const database = await getDb();
  const [updated] = await database
    .update(mcpServer)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(mcpServer.id, id), eq(mcpServer.userId, userId)))
    .returning();
  return updated ?? null;
}

export async function deleteMcpServer({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  const database = await getDb();
  const [deleted] = await database
    .delete(mcpServer)
    .where(and(eq(mcpServer.id, id), eq(mcpServer.userId, userId)))
    .returning();
  return deleted ?? null;
}

export async function toggleMcpServer({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  const database = await getDb();
  const existing = await getMcpServerById({ id, userId });
  if (!existing) {
    return null;
  }

  const [updated] = await database
    .update(mcpServer)
    .set({
      isEnabled: !existing.isEnabled,
      updatedAt: new Date(),
    })
    .where(and(eq(mcpServer.id, id), eq(mcpServer.userId, userId)))
    .returning();
  return updated ?? null;
}

export async function updateMcpToolsCache({
  id,
  userId,
  toolsCache,
}: {
  id: string;
  toolsCache: any[];
  userId: string;
}) {
  const database = await getDb();
  const [updated] = await database
    .update(mcpServer)
    .set({
      toolsCache: (toolsCache as any) ?? [],
      updatedAt: new Date(),
    })
    .where(and(eq(mcpServer.id, id), eq(mcpServer.userId, userId)))
    .returning();
  return updated ?? null;
}

export async function logMcpExecution(data: {
  userId: string;
  serverId?: string | null;
  serverName: string;
  toolName: string;
  chatId?: string | null;
  actionType?: "read" | "write" | "delete" | "execute" | "other";
  approvalStatus?: "pending" | "approved" | "denied" | "auto_approved";
  inputPayload?: any;
  outputPayload?: any;
  error?: string | null;
  durationMs?: number;
}) {
  try {
    const database = await getDb();
    const [log] = await database
      .insert(mcpLog)
      .values({
        actionType: data.actionType ?? "read",
        approvalStatus: data.approvalStatus ?? "auto_approved",
        chatId: data.chatId ?? null,
        durationMs: data.durationMs ?? 0,
        error: data.error ? redactMcpText(data.error, 1000) : null,
        inputPayload: redactMcpValue(data.inputPayload),
        outputPayload: redactMcpValue(data.outputPayload),
        serverId: data.serverId ?? null,
        serverName: redactMcpText(data.serverName, 160),
        toolName: redactMcpText(data.toolName, 160),
        userId: data.userId,
      })
      .returning();
    return log;
  } catch (err) {
    console.error("Erreur logMcpExecution:", redactMcpError(err));
    return null;
  }
}

/**
 * Trace un appel d'outil effectué dans le CHAT (migration 0036).
 *
 * Écrit dans `ToolExecution` avec `runId` nul : c'est ce qui distingue une
 * exécution de conversation d'une exécution d'Agent, et ce qui permet à la page
 * Statistiques de compter les plugins utilisés en mode Chat. `userId` est
 * renseigné — c'est l'identité de la ligne, `ToolExecution` n'ayant pas de run
 * par lequel la retrouver.
 *
 * Aucun secret n'est journalisé : l'entrée et la sortie sont réécrites par
 * `redactMcpValue` comme pour le MCP, et un `chatId` mal formé est écarté plutôt
 * que de faire échouer l'insertion.
 *
 * Best-effort par construction : un échec ici ne doit JAMAIS faire échouer
 * l'appel d'outil, dont la réponse est déjà produite. D'où le `catch` qui se
 * contente de tracer.
 */
export async function logChatToolExecution(data: {
  userId: string;
  toolId: string;
  category?: ToolCategory;
  chatId?: string | null;
  durationMs?: number;
  error?: string | null;
  input?: unknown;
  output?: unknown;
  status?: "completed" | "failed" | "denied";
}) {
  try {
    const database = await getDb();
    const now = new Date();
    const [log] = await database
      .insert(toolExecution)
      .values({
        // `runId` reste NULL : c'est le marqueur du chemin Chat. L'index unique
        // `(runId, operationKey, attempt)` n'est pas entravé, `operationKey`
        // étant lui aussi nul — en SQL, deux NULL ne violent pas un UNIQUE.
        approvalStatus: "not_required",
        category: data.category ?? "plugins",
        chatId:
          data.chatId && /^[0-9a-fA-F-]{36}$/.test(data.chatId)
            ? data.chatId
            : null,
        completedAt: now,
        createdAt: now,
        durationMs: Math.max(0, Math.floor(data.durationMs ?? 0)),
        error: data.error ? redactMcpText(data.error, 1000) : null,
        input: (redactMcpValue(data.input) ?? null) as never,
        output: (redactMcpValue(data.output) ?? null) as never,
        runId: null,
        // Pas d'approbation rattachable : hors du canal Agent, les outils
        // d'ÉCRITURE d'un plugin ne sont même pas instanciés
        // (`createPluginTools` les filtre par effet), donc toute exécution
        // journalisée depuis le Chat est une lecture et n'a rien soumis à
        // validation.
        startedAt: now,
        status: data.status ?? "completed",
        toolId: data.toolId,
        userId: data.userId,
      })
      .returning();
    return log ?? null;
  } catch (err) {
    console.error("Erreur logChatToolExecution:", redactMcpError(err));
    return null;
  }
}

export async function getMcpLogsByUserId({
  userId,
  limit = 50,
}: {
  limit?: number;
  userId: string;
}) {
  const database = await getDb();
  return database
    .select()
    .from(mcpLog)
    .where(eq(mcpLog.userId, userId))
    .orderBy(desc(mcpLog.createdAt))
    .limit(limit);
}

export async function getMcpStats({ userId }: { userId: string }) {
  const database = await getDb();
  const [serversCount] = await database
    .select({ count: count() })
    .from(mcpServer)
    .where(eq(mcpServer.userId, userId));
  const [logsCount] = await database
    .select({ count: count() })
    .from(mcpLog)
    .where(eq(mcpLog.userId, userId));
  return {
    servers: Number(serversCount?.count ?? 0),
    totalCalls: Number(logsCount?.count ?? 0),
  };
}

export async function updateMcpServerStats({
  id,
  userId,
  durationMs,
  success,
}: {
  id: string;
  userId: string;
  durationMs: number;
  success: boolean;
}) {
  const database = await getDb();
  const [existing] = await database
    .select()
    .from(mcpServer)
    .where(and(eq(mcpServer.id, id), eq(mcpServer.userId, userId)))
    .limit(1);
  if (!existing) {
    return null;
  }
  const newCount = (existing.callCount ?? 0) + 1;
  const prevAvg = existing.avgLatencyMs ?? 0;
  const newAvg = Math.round((prevAvg * (newCount - 1) + durationMs) / newCount);
  const [updated] = await database
    .update(mcpServer)
    .set({
      avgLatencyMs: newAvg,
      callCount: newCount,
      lastCallAt: new Date(),
      updatedAt: new Date(),
      uptimeStatus: success ? "online" : "error",
    })
    .where(and(eq(mcpServer.id, id), eq(mcpServer.userId, userId)))
    .returning();
  return updated ?? null;
}

export async function updateMcpServerSync({
  id,
  userId,
  toolsCache,
  success,
}: {
  id: string;
  userId: string;
  toolsCache?: any[];
  success: boolean;
}) {
  const database = await getDb();
  const data: any = {
    lastSyncAt: new Date(),
    updatedAt: new Date(),
    uptimeStatus: success ? "online" : "error",
  };
  if (toolsCache) {
    data.toolsCache = toolsCache as any;
  }
  const [updated] = await database
    .update(mcpServer)
    .set(data)
    .where(and(eq(mcpServer.id, id), eq(mcpServer.userId, userId)))
    .returning();
  return updated ?? null;
}

// Les catalogues de modèles (Skills / MCP) ne sont plus lus en base : la
// source de vérité est statique et versionnée (lib/skill-templates,
// lib/mcp-templates). Les tables SkillTemplate / McpTemplate sont conservées
// pour ne pas casser les environnements existants mais ne sont plus alimentées
// ni interrogées ; aucune requête concurrente des catalogues ne subsiste.

// ==========================================
// MCP SECRETS (chiffrés) — lib/mcp/encryption
// ==========================================

export async function getMcpServerSecrets({
  serverId,
  userId,
}: {
  serverId: string;
  userId: string;
}) {
  const db = await dbReady();
  return db
    .select()
    .from(mcpServerSecret)
    .where(
      and(
        eq(mcpServerSecret.serverId, serverId),
        eq(mcpServerSecret.userId, userId)
      )
    );
}

export async function setMcpServerSecrets({
  serverId,
  userId,
  secrets,
}: {
  serverId: string;
  userId: string;
  secrets: Array<{
    kind: "env" | "auth" | "header";
    key: string;
    encryptedValue: string;
  }>;
}) {
  const db = await dbReady();
  await db
    .delete(mcpServerSecret)
    .where(
      and(
        eq(mcpServerSecret.serverId, serverId),
        eq(mcpServerSecret.userId, userId)
      )
    );
  if (secrets.length === 0) {
    return [];
  }
  const rows = await db
    .insert(mcpServerSecret)
    .values(secrets.map((s) => ({ ...s, serverId, userId })))
    .returning();
  return rows;
}

export async function upsertMcpServerSecret({
  serverId,
  userId,
  kind,
  key,
  encryptedValue,
}: {
  serverId: string;
  userId: string;
  kind: "env" | "auth" | "header";
  key: string;
  encryptedValue: string;
}) {
  const db = await dbReady();
  const existing = await db
    .select()
    .from(mcpServerSecret)
    .where(
      and(
        eq(mcpServerSecret.serverId, serverId),
        eq(mcpServerSecret.userId, userId),
        eq(mcpServerSecret.kind, kind),
        eq(mcpServerSecret.key, key)
      )
    )
    .limit(1);
  if (existing.length > 0) {
    const [updated] = await db
      .update(mcpServerSecret)
      .set({ encryptedValue })
      .where(
        and(
          eq(mcpServerSecret.id, existing[0].id),
          eq(mcpServerSecret.serverId, serverId),
          eq(mcpServerSecret.userId, userId)
        )
      )
      .returning();
    return updated;
  }
  const [created] = await db
    .insert(mcpServerSecret)
    .values({ encryptedValue, key, kind, serverId, userId })
    .returning();
  return created;
}

// ==========================================
// USER MCP PREFS (global kill-switch, defaults)
// ==========================================

export async function getUserMcpPrefs(userId: string) {
  const db = await dbReady();
  const [prefs] = await db
    .select()
    .from(userMcpPrefs)
    .where(eq(userMcpPrefs.userId, userId))
    .limit(1);
  if (prefs) {
    return prefs;
  }
  return {
    allowStdio: false,
    createdAt: new Date(),
    defaultRateLimitPerMin: 60,
    defaultRequireApproval: "write_only" as const,
    defaultTimeoutMs: 15_000,
    globalKillSwitch: false,
    retentionDays: 30,
    updatedAt: new Date(),
    userId,
  };
}

export async function upsertUserMcpPrefs(
  userId: string,
  data: Partial<{
    allowStdio: boolean;
    defaultRateLimitPerMin: number;
    defaultRequireApproval: "always_allow" | "write_only" | "ask_permission";
    defaultTimeoutMs: number;
    globalKillSwitch: boolean;
    retentionDays: number;
  }>
) {
  const db = await dbReady();
  const existing = await db
    .select()
    .from(userMcpPrefs)
    .where(eq(userMcpPrefs.userId, userId))
    .limit(1);
  if (existing.length === 0) {
    const [created] = await db
      .insert(userMcpPrefs)
      .values({
        allowStdio: data.allowStdio ?? false,
        defaultRateLimitPerMin: data.defaultRateLimitPerMin ?? 60,
        defaultRequireApproval: data.defaultRequireApproval ?? "write_only",
        defaultTimeoutMs: data.defaultTimeoutMs ?? 15_000,
        globalKillSwitch: data.globalKillSwitch ?? false,
        retentionDays: data.retentionDays ?? 30,
        userId,
      })
      .returning();
    return created;
  }
  const [updated] = await db
    .update(userMcpPrefs)
    .set({ ...data, updatedAt: new Date() } as any)
    .where(eq(userMcpPrefs.userId, userId))
    .returning();
  return updated;
}

export async function getFilteredMcpLogs({
  userId,
  serverId,
  toolName,
  actionType,
  limit = 50,
}: {
  userId: string;
  serverId?: string;
  toolName?: string;
  actionType?: string;
  limit?: number;
}) {
  const db = await dbReady();
  const conditions: any[] = [eq(mcpLog.userId, userId)];
  if (serverId) {
    conditions.push(eq(mcpLog.serverId, serverId));
  }
  if (toolName) {
    conditions.push(eq(mcpLog.toolName, toolName));
  }
  if (actionType) {
    conditions.push(eq(mcpLog.actionType, actionType as any));
  }
  return db
    .select()
    .from(mcpLog)
    .where(and(...conditions))
    .orderBy(desc(mcpLog.createdAt))
    .limit(Math.min(limit, 200));
}

export async function purgeMcpLogs({
  userId,
  olderThanDays,
}: {
  userId: string;
  // 0 = tout purger
  olderThanDays: number;
}) {
  const db = await dbReady();
  if (olderThanDays <= 0) {
    const deleted = await db
      .delete(mcpLog)
      .where(eq(mcpLog.userId, userId))
      .returning();
    return { deleted: deleted.length };
  }
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
  // lt() plutôt qu'un fragment sql brut : l'objet Date est sérialisé par
  // Drizzle, sinon le driver échoue ("Received an instance of Date").
  const deleted = await db
    .delete(mcpLog)
    .where(and(eq(mcpLog.userId, userId), lt(mcpLog.createdAt, cutoff)))
    .returning();
  return { deleted: deleted.length };
}
