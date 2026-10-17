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
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { ChatbotError } from "@/lib/errors";
import {
  normalizeScheduleToolMode,
  type ScheduleToolMode,
} from "@/lib/planning/tool-mode";
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

// ============================================================================
// Planification (ScheduledMessage)
// ============================================================================

export async function createScheduledMessage(params: {
  userId: string;
  title: string;
  prompt: string;
  scheduledAt: Date;
  createMode?: "new_chat" | "existing_chat";
  chatId?: string | null;
  agentId?: string | null;
  modelId?: string;
  enabledTools?: string[];
  toolMode?: ScheduleToolMode;
  cloudFileUrls?: string[];
  customInstructions?: string | null;
  temperature?: number | null;
  recurrence?: "none" | "daily" | "weekly" | "monthly";
  // Récurrence calendaire (migration 0046) : vérité = heure murale dans le
  // fuseau de la tâche ; l'instant UTC n'est qu'une conséquence recalculée.
  timezone?: string | null;
  hour?: number | null;
  minute?: number | null;
  dayOfMonth?: number | null;
  monthlyPolicy?: "clamp" | "report" | "skip" | null;
}): Promise<ScheduledMessage> {
  const database = await getDb();
  const [created] = await database
    .insert(scheduledMessage)
    .values({
      agentId: params.agentId || null,
      chatId: params.chatId || null,
      cloudFileUrls: params.cloudFileUrls || [],
      createMode: params.createMode || "new_chat",
      customInstructions: params.customInstructions || null,
      dayOfMonth: params.dayOfMonth ?? null,
      // Conservé pour la compat ascendante, plus lu par l'exécuteur : le
      // périmètre d'outils est désormais porté par "toolMode".
      enabledTools: params.enabledTools || [],
      hour: params.hour ?? null,
      minute: params.minute ?? null,
      modelId: params.modelId || DEFAULT_CHAT_MODEL,
      monthlyPolicy: params.monthlyPolicy || undefined,
      prompt: params.prompt,
      recurrence: params.recurrence || "none",
      scheduledAt: params.scheduledAt,
      status: "pending",
      temperature: params.temperature ?? null,
      timezone:
        typeof params.timezone === "string" && params.timezone.length > 0
          ? params.timezone
          : undefined,
      title: params.title || "Envoi planifié",
      toolMode: normalizeScheduleToolMode(params.toolMode),
      userId: params.userId,
    })
    .returning();
  return created;
}

export async function getScheduledMessagesByUserId(params: {
  userId: string;
  status?: string;
}): Promise<ScheduledMessage[]> {
  const database = await getDb();
  const conditions = [eq(scheduledMessage.userId, params.userId)];
  if (params.status && params.status !== "all") {
    conditions.push(eq(scheduledMessage.status, params.status as any));
  }
  return await database
    .select()
    .from(scheduledMessage)
    .where(and(...conditions))
    .orderBy(desc(scheduledMessage.scheduledAt));
}

export async function getScheduledMessageById(params: {
  id: string;
  userId?: string;
}): Promise<ScheduledMessage | null> {
  const database = await getDb();
  const conditions = [eq(scheduledMessage.id, params.id)];
  if (params.userId) {
    conditions.push(eq(scheduledMessage.userId, params.userId));
  }
  const [res] = await database
    .select()
    .from(scheduledMessage)
    .where(and(...conditions))
    .limit(1);
  return res ?? null;
}

export async function updateScheduledMessage(params: {
  id: string;
  userId: string;
  title?: string;
  prompt?: string;
  scheduledAt?: Date;
  createMode?: "new_chat" | "existing_chat";
  chatId?: string | null;
  agentId?: string | null;
  modelId?: string;
  enabledTools?: string[];
  toolMode?: ScheduleToolMode;
  cloudFileUrls?: string[];
  customInstructions?: string | null;
  temperature?: number | null;
  recurrence?: "none" | "daily" | "weekly" | "monthly";
  timezone?: string | null;
  hour?: number | null;
  minute?: number | null;
  dayOfMonth?: number | null;
  monthlyPolicy?: "clamp" | "report" | "skip" | null;
  executedAt?: Date | null;
  lastError?: string | null;
  resultChatId?: string | null;
  status?: "pending" | "processing" | "completed" | "failed" | "cancelled";
}): Promise<ScheduledMessage | null> {
  const database = await getDb();
  const { id, userId, ...updates } = params;
  const updateData: Record<string, any> = {
    updatedAt: new Date(),
  };

  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.prompt !== undefined) updateData.prompt = updates.prompt;
  if (updates.scheduledAt !== undefined)
    updateData.scheduledAt = updates.scheduledAt;
  if (updates.createMode !== undefined)
    updateData.createMode = updates.createMode;
  if (updates.chatId !== undefined) updateData.chatId = updates.chatId;
  if (updates.agentId !== undefined) updateData.agentId = updates.agentId;
  if (updates.modelId !== undefined) updateData.modelId = updates.modelId;
  if (updates.enabledTools !== undefined)
    updateData.enabledTools = updates.enabledTools;
  if (updates.toolMode !== undefined)
    updateData.toolMode = normalizeScheduleToolMode(updates.toolMode);
  if (updates.cloudFileUrls !== undefined)
    updateData.cloudFileUrls = updates.cloudFileUrls;
  if (updates.customInstructions !== undefined)
    updateData.customInstructions = updates.customInstructions;
  if (updates.temperature !== undefined)
    updateData.temperature = updates.temperature;
  if (updates.recurrence !== undefined)
    updateData.recurrence = updates.recurrence;
  if (updates.timezone !== undefined && updates.timezone !== null)
    updateData.timezone = updates.timezone;
  if (updates.hour !== undefined) updateData.hour = updates.hour;
  if (updates.minute !== undefined) updateData.minute = updates.minute;
  if (updates.dayOfMonth !== undefined)
    updateData.dayOfMonth = updates.dayOfMonth;
  if (updates.monthlyPolicy !== undefined && updates.monthlyPolicy !== null)
    updateData.monthlyPolicy = updates.monthlyPolicy;
  if (updates.executedAt !== undefined)
    updateData.executedAt = updates.executedAt;
  if (updates.lastError !== undefined) updateData.lastError = updates.lastError;
  if (updates.resultChatId !== undefined)
    updateData.resultChatId = updates.resultChatId;
  if (updates.status !== undefined) updateData.status = updates.status;

  const [updated] = await database
    .update(scheduledMessage)
    .set(updateData)
    .where(
      and(eq(scheduledMessage.id, id), eq(scheduledMessage.userId, userId))
    )
    .returning();
  return updated ?? null;
}

export async function deleteScheduledMessage(params: {
  id: string;
  userId: string;
}): Promise<boolean> {
  const database = await getDb();
  const res = await database
    .delete(scheduledMessage)
    .where(
      and(
        eq(scheduledMessage.id, params.id),
        eq(scheduledMessage.userId, params.userId)
      )
    )
    .returning();
  return res.length > 0;
}

export async function claimScheduledMessage(params: {
  id: string;
}): Promise<ScheduledMessage | null> {
  const database = await getDb();
  const now = new Date();
  const stuckThreshold = new Date(now.getTime() - 10 * 60 * 1000);
  const [claimed] = await database
    .update(scheduledMessage)
    .set({ status: "processing", updatedAt: now })
    .where(
      and(
        eq(scheduledMessage.id, params.id),
        or(
          eq(scheduledMessage.status, "pending"),
          eq(scheduledMessage.status, "failed"),
          and(
            eq(scheduledMessage.status, "processing"),
            lte(scheduledMessage.updatedAt, stuckThreshold)
          )
        )
      )
    )
    .returning();
  return claimed ?? null;
}

/**
 * Rend une réservation au fil de l'eau : repasse l'item en `pending` sans le
 * terminer.
 *
 * Utilisé quand l'exécution est **différée** plutôt qu'en échec : quota
 * hebdomadaire épuisé, par exemple. Marquer `failed` déclencherait une
 * notification d'erreur alors que rien n'a échoué, et empêcherait la
 * récurrence de repartir. En `pending`, l'item reste dû et sera repris au
 * prochain tick.
 */
export async function releaseScheduledMessageClaim(params: {
  id: string;
}): Promise<void> {
  const database = await getDb();
  await database
    .update(scheduledMessage)
    .set({ status: "pending", updatedAt: new Date() })
    .where(
      and(
        eq(scheduledMessage.id, params.id),
        eq(scheduledMessage.status, "processing")
      )
    );
}

export async function getDueScheduledMessages(): Promise<ScheduledMessage[]> {
  const database = await getDb();
  // Les items "processing" bloqués depuis plus de 10 minutes (ex: crash serveur)
  // sont repris automatiquement pour ne jamais rester coincés.
  const stuckThreshold = new Date(Date.now() - 10 * 60 * 1000);
  return await database
    .select()
    .from(scheduledMessage)
    .where(
      or(
        and(
          eq(scheduledMessage.status, "pending"),
          lte(scheduledMessage.scheduledAt, new Date())
        ),
        and(
          eq(scheduledMessage.status, "processing"),
          lte(scheduledMessage.updatedAt, stuckThreshold)
        )
      )
    )
    .orderBy(asc(scheduledMessage.scheduledAt))
    .limit(20);
}

export async function rescheduleRecurringMessage(params: {
  id: string;
  nextScheduledAt: Date;
}): Promise<void> {
  const database = await getDb();
  await database
    .update(scheduledMessage)
    .set({
      executedAt: null,
      lastError: null,
      resultChatId: null,
      scheduledAt: params.nextScheduledAt,
      status: "pending",
      updatedAt: new Date(),
    })
    .where(eq(scheduledMessage.id, params.id));
}

export async function setScheduledMessageStatus(params: {
  id: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  resultChatId?: string | null;
  lastError?: string | null;
  executedAt?: Date | null;
}): Promise<void> {
  const database = await getDb();
  await database
    .update(scheduledMessage)
    .set({
      executedAt:
        params.executedAt === undefined ? undefined : params.executedAt,
      lastError: params.lastError === undefined ? undefined : params.lastError,
      resultChatId:
        params.resultChatId === undefined ? undefined : params.resultChatId,
      status: params.status,
      updatedAt: new Date(),
    })
    .where(eq(scheduledMessage.id, params.id));
}

// ─────────────────────────────────────────────────────────────
// Plugins installés par utilisateur
// ─────────────────────────────────────────────────────────────

export async function getPluginInstallationsByUserId(params: {
  userId: string;
}) {
  const database = await getDb();
  const rows = await database
    .select()
    .from(pluginInstallation)
    .where(eq(pluginInstallation.userId, params.userId))
    .orderBy(desc(pluginInstallation.installedAt));
  return rows;
}

export async function installPlugin(params: {
  userId: string;
  pluginId: string;
  version: string;
}) {
  const database = await getDb();
  const now = new Date();
  const [row] = await database
    .insert(pluginInstallation)
    .values({
      installedAt: now,
      isEnabled: true,
      pluginId: params.pluginId,
      updatedAt: now,
      userId: params.userId,
      version: params.version,
    })
    .onConflictDoUpdate({
      set: {
        updatedAt: now,
        version: params.version,
      },
      target: [pluginInstallation.userId, pluginInstallation.pluginId],
    })
    .returning();
  return row;
}

export async function setPluginEnabled(params: {
  userId: string;
  pluginId: string;
  isEnabled: boolean;
}) {
  const database = await getDb();
  const [row] = await database
    .update(pluginInstallation)
    .set({ isEnabled: params.isEnabled, updatedAt: new Date() })
    .where(
      and(
        eq(pluginInstallation.userId, params.userId),
        eq(pluginInstallation.pluginId, params.pluginId)
      )
    )
    .returning();
  return row;
}

export async function uninstallPlugin(params: {
  userId: string;
  pluginId: string;
}) {
  const database = await getDb();
  await database
    .delete(pluginInstallation)
    .where(
      and(
        eq(pluginInstallation.userId, params.userId),
        eq(pluginInstallation.pluginId, params.pluginId)
      )
    );
}
