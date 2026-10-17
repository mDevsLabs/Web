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
import { ChatbotError } from "@/lib/errors";
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
// NOTIFICATIONS QUERIES
// ==========================================

export async function getUserNotificationPrefs(userId: string) {
  const db = await dbReady();
  const { notification, userNotificationPrefs } = await import("../schema");
  const [prefs] = await db
    .select()
    .from(userNotificationPrefs)
    .where(eq(userNotificationPrefs.userId, userId))
    .limit(1);
  if (prefs) {
    return prefs;
  }
  // default prefs if not exists
  return {
    aiResponse: true,
    createdAt: new Date(),
    enabled: false,
    mcpAccessRequest: true,
    mcpCreated: true,
    news: true,
    planningTaskCompleted: true,
    projectCreated: true,
    quotaWarning: true,
    regenerateMode: "truncate" as const,
    updatedAt: new Date(),
    userId,
  };
}

export async function upsertUserNotificationPrefs(
  userId: string,
  data: Partial<{
    enabled: boolean;
    aiResponse: boolean;
    projectCreated: boolean;
    mcpCreated: boolean;
    mcpAccessRequest: boolean;
    news: boolean;
    planningTaskCompleted: boolean;
    quotaWarning: boolean;
    regenerateMode: "truncate" | "fork";
  }>
) {
  const db = await dbReady();
  const { userNotificationPrefs } = await import("../schema");
  const existing = await db
    .select()
    .from(userNotificationPrefs)
    .where(eq(userNotificationPrefs.userId, userId))
    .limit(1);
  if (existing.length === 0) {
    const [created] = await db
      .insert(userNotificationPrefs)
      .values({
        aiResponse: data.aiResponse ?? true,
        enabled: data.enabled ?? false,
        mcpAccessRequest: data.mcpAccessRequest ?? true,
        mcpCreated: data.mcpCreated ?? true,
        news: data.news ?? true,
        planningTaskCompleted: data.planningTaskCompleted ?? true,
        projectCreated: data.projectCreated ?? true,
        quotaWarning: data.quotaWarning ?? true,
        regenerateMode: data.regenerateMode ?? "truncate",
        userId,
      })
      .returning();
    return created;
  }
  const [updated] = await db
    .update(userNotificationPrefs)
    .set({ ...data, updatedAt: new Date() } as any)
    .where(eq(userNotificationPrefs.userId, userId))
    .returning();
  return updated;
}

export async function createNotification(data: {
  userId: string;
  type:
    | "ai_response"
    | "project_created"
    | "mcp_created"
    | "mcp_access_request"
    | "news"
    | "planning_task_completed"
    | "project_member_joined"
    | "quota_warning"
    // Notifications Agent (types autorisés par la contrainte 0017).
    | "agent_approval_required"
    | "agent_run_failed"
    | "agent_run_finished"
    | "agent_user_input_required";
  title: string;
  body?: string | null;
  dedupeKey?: string | null;
  link?: string | null;
}) {
  const db = await dbReady();
  const { notification } = await import("../schema");
  // check prefs gating
  try {
    const prefs = await getUserNotificationPrefs(data.userId);
    if (!prefs.enabled) {
      return null;
    }
    // Le gate DOIT couvrir les 12 types. Un type absent de cette table
    // valait `undefined`, donc différent de `false` : la notification passait
    // sans jamais consulter la préférence correspondante. C'était le cas des
    // 6 types `agent_*` et de `project_member_joined`, dont les colonnes
    // existent en base (migrations 0017 / 0020) mais n'étaient pas câblées ici.
    // `?? true` reste le repli : une ligne de prefs partielle (base antérieure
    // à une migration) ne doit jamais faire perdre une notification.
    const gate: Record<string, boolean> = {
      agent_approval_required: (prefs as any).agentApprovalRequired ?? true,
      agent_run_failed: (prefs as any).agentRunFailed ?? true,
      agent_run_finished: (prefs as any).agentRunFinished ?? true,
      agent_user_input_required: (prefs as any).agentUserInputRequired ?? true,
      ai_response: prefs.aiResponse,
      mcp_access_request: prefs.mcpAccessRequest,
      mcp_created: prefs.mcpCreated,
      news: prefs.news,
      planning_task_completed: (prefs as any).planningTaskCompleted ?? true,
      project_created: prefs.projectCreated,
      // Pas de colonne dédiée : la participation à un projet est un événement
      // factuel, governed par projectCreated.
      project_member_joined: prefs.projectCreated,
      quota_warning: (prefs as any).quotaWarning ?? true,
    };
    if (gate[data.type] === false) {
      return null;
    }
  } catch (prefsErr) {
    // Repli volontaire : préférences illisibles → notification envoyée par
    // défaut, mais l'incident est tracé.
    console.warn("Préférences de notification illisibles:", prefsErr);
  }
  const [created] = await db
    .insert(notification)
    .values({
      body: data.body ?? null,
      dedupeKey: data.dedupeKey ?? null,
      link: data.link ?? null,
      title: data.title,
      type: data.type,
      userId: data.userId,
    })
    .onConflictDoNothing()

    .returning();
  return created;
}

export async function getNotificationsByUserId({
  userId,
  limit = 20,
  offset = 0,
  unreadOnly = false,
}: {
  userId: string;
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}) {
  const db = await dbReady();
  const { notification } = await import("../schema");
  const conditions = [eq(notification.userId, userId)];
  if (unreadOnly) {
    conditions.push(eq(notification.isRead, false));
  }
  const rows = await db
    .select()
    .from(notification)
    .where(and(...conditions))
    .orderBy(desc(notification.createdAt))
    .limit(Math.min(limit, 50))
    .offset(offset);
  return rows;
}

export async function getUnreadNotificationCount(userId: string) {
  const db = await dbReady();
  const { notification } = await import("../schema");
  const [row] = await db
    .select({ count: count() })
    .from(notification)
    .where(
      and(eq(notification.userId, userId), eq(notification.isRead, false))
    );
  return Number(row?.count ?? 0);
}

export async function markNotificationRead({
  id,
  userId,
  isRead = true,
}: {
  id: string;
  userId: string;
  isRead?: boolean;
}) {
  const db = await dbReady();
  const { notification } = await import("../schema");
  const [updated] = await db
    .update(notification)
    .set({ isRead })
    .where(and(eq(notification.id, id), eq(notification.userId, userId)))
    .returning();
  return updated ?? null;
}

export async function markAllNotificationsRead(userId: string) {
  const db = await dbReady();
  const { notification } = await import("../schema");
  await db
    .update(notification)
    .set({ isRead: true })
    .where(
      and(eq(notification.userId, userId), eq(notification.isRead, false))
    );
  return { success: true };
}

export async function deleteNotification({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  const db = await dbReady();
  const { notification } = await import("../schema");
  const [deleted] = await db
    .delete(notification)
    .where(and(eq(notification.id, id), eq(notification.userId, userId)))
    .returning();
  return deleted ?? null;
}

export async function deleteAllNotifications(userId: string) {
  const db = await dbReady();
  const { notification } = await import("../schema");
  await db.delete(notification).where(eq(notification.userId, userId));
  return { success: true };
}

export async function broadcastNewsNotification(data: {
  title: string;
  body?: string | null;
  link?: string | null;
}) {
  const db = await dbReady();
  const { userNotificationPrefs, notification } = await import("../schema");
  // get all users with enabled+news
  const eligible = await db
    .select({ userId: userNotificationPrefs.userId })
    .from(userNotificationPrefs)
    .where(
      and(
        eq(userNotificationPrefs.enabled, true),
        eq(userNotificationPrefs.news, true)
      )
    );
  if (eligible.length === 0) {
    return { sent: 0 };
  }
  const values = eligible.map((e) => ({
    body: data.body ?? null,
    link: data.link ?? null,
    title: data.title,
    type: "news" as const,
    userId: e.userId,
  }));
  // batch insert 500 at a time
  let sent = 0;
  for (let i = 0; i < values.length; i += 500) {
    const chunk = values.slice(i, i + 500);
    await db.insert(notification).values(chunk as any);
    sent += chunk.length;
  }
  return { sent };
}
