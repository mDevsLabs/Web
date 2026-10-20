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
  type NOTIFICATION_TYPES,
  type NotificationOrigin,
  originForNotificationType,
} from "@/lib/notifications/types";
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
  //
  // Les préférences Agent sont incluses : l'écran groupé les affiche, et une
  // absence vaudrait « faux » — donc une case cochée qui ne l'est pas.
  return {
    agentApprovalRequired: true,
    agentRunFailed: true,
    agentRunFinished: true,
    agentUserInputRequired: true,
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
    // Préférences Agent (migration 0017) : elles existent en base et sont
    // exposées par l'API, mais le type d'écriture ne les mentionnait pas —
    // l'upsert les acceptait par accident (spread), sans les insérer
    // correctement sur une ligne neuve.
    agentApprovalRequired: boolean;
    agentRunFailed: boolean;
    agentRunFinished: boolean;
    agentUserInputRequired: boolean;
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
        agentApprovalRequired: data.agentApprovalRequired ?? true,
        agentRunFailed: data.agentRunFailed ?? true,
        agentRunFinished: data.agentRunFinished ?? true,
        agentUserInputRequired: data.agentUserInputRequired ?? true,
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
    | "agent_user_input_required"
    // Notifications Vibe et Wakies (migration 0063) : répliquées depuis leur
    // source, elles portent l'origine qui les a produites.
    | "vibe_like"
    | "vibe_repost"
    | "vibe_reply"
    | "vibe_mention"
    | "vibe_quote"
    | "vibe_follow"
    | "vibe_dm"
    | "vibe_ai_digest"
    | "vibe_system"
    | "wakies_reply";
  title: string;
  body?: string | null;
  dedupeKey?: string | null;
  link?: string | null;
  /** Origine de l'événement. Déduite du type quand elle est omise. */
  origin?: NotificationOrigin;
  /** Identifiant de l'événement dans sa source. */
  sourceId?: string | null;
  /** Charge utile propre à la source. */
  sourceMeta?: Record<string, unknown> | null;
}) {
  const db = await dbReady();
  const { notification } = await import("../schema");
  const origin = data.origin ?? originForNotificationType(data.type);
  // check prefs gating
  try {
    const prefs = await getUserNotificationPrefs(data.userId);
    // Le gate `enabled` ne s'applique PAS aux notifications RÉPLIQUÉES.
    // Une notification Vibe ou Wakies a déjà été décidée par sa source :
    // la rejuger par le réglage global de mAI la ferait disparaître alors
    // que l'utilisateur l'a demandée dans l'application d'origine. Seules
    // les notifications natives de mAI obéissent à `prefs.enabled`.
    if (!prefs.enabled && origin === "mai") {
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
    // Les types répliqués (Vibe, Wakies) ne sont pas dans la table : leur
    // décision a été prise à la source. `undefined` ne doit donc pas être
    // lu comme « à vérifier ».
    const decision = gate[data.type];
    if (decision === false) {
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
      origin,
      sourceId: data.sourceId ?? null,
      sourceMeta: (data.sourceMeta as any) ?? null,
      title: data.title,
      type: data.type,
      userId: data.userId,
    })
    .onConflictDoNothing()

    .returning();
  return created;
}

/**
 * Réplique une notification venue d'une autre application.
 *
 * L'upsert est idempotent : la contrainte unique `(origin, sourceId)` fait
 * qu'un rejeu de tick ne duplique rien. C'est ce qui rend le tick de
 * réplication sans risque.
 */
export async function replicateNotification(data: {
  body?: string | null;
  createdAt?: Date;
  dedupeKey?: string | null;
  link?: string | null;
  origin: NotificationOrigin;
  sourceId: string;
  sourceMeta?: Record<string, unknown> | null;
  title: string;
  type: (typeof NOTIFICATION_TYPES)[number];
  userId: string;
}) {
  const db = await dbReady();
  const { notification } = await import("../schema");
  const [created] = await db
    .insert(notification)
    .values({
      body: data.body ?? null,
      createdAt: data.createdAt ?? new Date(),
      dedupeKey: data.dedupeKey ?? null,
      link: data.link ?? null,
      origin: data.origin,
      sourceId: data.sourceId,
      sourceMeta: (data.sourceMeta as any) ?? null,
      title: data.title,
      type: data.type,
      userId: data.userId,
    })
    .onConflictDoNothing({
      target: [notification.origin, notification.sourceId],
      // L'index unique est PARTIEL (`sourceId is not null`) : la clause
      // `ON CONFLICT` doit porter la même condition, sinon PostgreSQL
      // refuse de l'appliquer à un index partiel.
      // `where` est le prédicat d'index (le `targetWhere` n'existe que pour
      // `onConflictDoUpdate`).
      where: sql`${notification.sourceId} is not null`,
    })
    .returning();
  return created ?? null;
}

export async function getNotificationsByUserId({
  userId,
  limit = 20,
  offset = 0,
  unreadOnly = false,
  origins,
}: {
  userId: string;
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
  /** Restreint la lecture à certaines origines. Absent = toutes. */
  origins?: NotificationOrigin[];
}) {
  const db = await dbReady();
  const { notification } = await import("../schema");
  const conditions = [eq(notification.userId, userId)];
  if (unreadOnly) {
    conditions.push(eq(notification.isRead, false));
  }
  if (origins && origins.length > 0) {
    conditions.push(inArray(notification.origin, origins));
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

export async function getUnreadNotificationCount(
  userId: string,
  origins?: NotificationOrigin[]
) {
  const db = await dbReady();
  const { notification } = await import("../schema");
  const conditions = [
    eq(notification.userId, userId),
    eq(notification.isRead, false),
  ];
  if (origins && origins.length > 0) {
    conditions.push(inArray(notification.origin, origins));
  }
  const [row] = await db
    .select({ count: count() })
    .from(notification)
    .where(and(...conditions));
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

/**
 * Notification unifiée correspondant à un événement de source.
 *
 * Sert à la propagation du « lu » : retrouver l'événement répliqué pour
 * connaître son `sourceId` et son `sourceMeta` avant de prévenir la source.
 */
export async function getNotificationBySource({
  origin,
  sourceId,
  userId,
}: {
  origin: NotificationOrigin;
  sourceId: string;
  userId: string;
}) {
  const db = await dbReady();
  const { notification } = await import("../schema");
  const [row] = await db
    .select()
    .from(notification)
    .where(
      and(
        eq(notification.userId, userId),
        eq(notification.origin, origin),
        eq(notification.sourceId, sourceId)
      )
    )
    .limit(1);
  return row ?? null;
}

/**
 * Dernier `seq` Wakies déjà répliqué pour un compte.
 *
 * C'est la borne du tick : sans elle, chaque tick relirait tout
 * l'historique des alertes. Le `seq` est un entier, donc la borne se lit
 * comme un nombre — jamais comme une date, qui n'est pas monotone.
 */
export async function getMaxReplicatedWakiesSeq(
  userId: string
): Promise<number> {
  const db = await dbReady();
  const { notification } = await import("../schema");
  // `sourceId` est un TEXTE, donc `max()` comparerait lexicographiquement :
  // "9" serait greater que "10", et la borne du tick serait fausse.
  //
  // Le cast ne s'applique qu'aux chaînes ENTIÈRES : un `sourceId` qui ne
  // l'est pas (une notification native de mAI, par exemple) est simplement
  // ignoré, sans faire échouer la requête entière.
  const [row] = await db
    .select({
      maxSeq: sql<string | null>`max(
        case when ${notification.sourceId} ~ '^[0-9]+$'
          then ${notification.sourceId}::bigint
          else null
        end
      )`,
    })
    .from(notification)
    .where(
      and(eq(notification.userId, userId), eq(notification.origin, "wakies"))
    );
  const valeur = Number(row?.maxSeq ?? 0);
  return Number.isFinite(valeur) ? valeur : 0;
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
