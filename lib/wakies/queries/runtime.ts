import "server-only";
import {
  and,
  asc,
  desc,
  eq,
  gt,
  ilike,
  inArray,
  isNull,
  lt,
  lte,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { dbReady, getDb } from "@/lib/db/queries";
import {
  wakiesCall,
  wakiesCapture,
  wakiesChatTurn,
  wakiesConversation,
  wakiesFriend,
  wakiesMemory,
  wakiesMessage,
  wakiesMessageReaction,
  wakiesNotification,
  wakiesPage,
  wakiesPageConversation,
  wakiesPageReview,
  wakiesSettings,
  wakiesSpace,
  wakiesTask,
  wakiesTaskConversation,
  wakiesTaskEvent,
  wakiesTaskRun,
  wakiesWakie,
  wakiesWakieImage,
  wakiesWakieProfile,
  wakiesWakieSpace,
} from "@/lib/db/schema";
import type { PageSettings } from "@/lib/wakies/pages";
import { preserveGoalMarker } from "@/lib/wakies/shared/goals";
import { apercuMessage } from "@/lib/wakies/shared/messages";
import {
  prochaineExecution,
  STATUT_TACHE,
  TACHE_BAIL_MS,
  TACHE_MAX_TENTATIVES,
  tentativesEpuisees,
} from "@/lib/wakies/task-lease";
import { findConversation } from "./conversations";
import type {
  SetupStatus,
  WakieCallRow,
  WakieConversationRow,
  WakieMemoryRow,
  WakiePageRow,
  WakieRow,
  WakieSettingsRow,
  WakieSpaceRow,
  WakieTaskEventRow,
  WakieTaskRow,
  WakieTaskRunRow,
  WakieWithSpaces,
} from "./types";
import { hashCompte } from "./wakies";

// ─── Mémoires ───────────────────────────────────────────────────────────────

export async function listMemories(userId: string): Promise<WakieMemoryRow[]> {
  await dbReady();
  return getDb()
    .select()
    .from(wakiesMemory)
    .where(eq(wakiesMemory.userId, userId))
    .orderBy(desc(wakiesMemory.createdAt));
}

export async function saveMemory(
  userId: string,
  text: string,
  id?: string
): Promise<WakieMemoryRow | null> {
  await dbReady();
  const db = getDb();
  if (id) {
    const [row] = await db
      .update(wakiesMemory)
      .set({ text })
      .where(and(eq(wakiesMemory.id, id), eq(wakiesMemory.userId, userId)))
      .returning();
    return row ?? null;
  }
  const [row] = await db
    .insert(wakiesMemory)
    .values({ text, userId })
    .returning();
  return row;
}

export async function deleteMemory(
  userId: string,
  id: string
): Promise<boolean> {
  await dbReady();
  const rows = await getDb()
    .delete(wakiesMemory)
    .where(and(eq(wakiesMemory.id, id), eq(wakiesMemory.userId, userId)))
    .returning({ id: wakiesMemory.id });
  return rows.length > 0;
}

// ─── Appels vocaux ──────────────────────────────────────────────────────────

export async function listCalls(userId: string): Promise<WakieCallRow[]> {
  await dbReady();
  return getDb()
    .select()
    .from(wakiesCall)
    .where(eq(wakiesCall.userId, userId))
    .orderBy(desc(wakiesCall.startedAt));
}

export async function createCall(
  userId: string,
  conversationId: string
): Promise<WakieCallRow | null> {
  await dbReady();
  if (!(await findConversation(userId, conversationId))) {
    return null;
  }
  const [row] = await getDb()
    .insert(wakiesCall)
    .values({ conversationId, userId })
    .returning();
  return row;
}

export async function findCall(
  userId: string,
  callId: string
): Promise<WakieCallRow | null> {
  await dbReady();
  const [row] = await getDb()
    .select()
    .from(wakiesCall)
    .where(and(eq(wakiesCall.id, callId), eq(wakiesCall.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function updateCall(
  userId: string,
  callId: string,
  patch: {
    status?: WakieCallRow["status"];
    transcript?: string;
    error?: string | null;
    anchorMessageId?: string | null;
    endedAt?: Date | null;
  }
): Promise<WakieCallRow | null> {
  await dbReady();
  const [row] = await getDb()
    .update(wakiesCall)
    .set(patch)
    .where(and(eq(wakiesCall.id, callId), eq(wakiesCall.userId, userId)))
    .returning();
  return row ?? null;
}

// ─── Captures ───────────────────────────────────────────────────────────────

export async function getCapture(
  userId: string,
  conversationId: string
): Promise<unknown> {
  await dbReady();
  if (!(await findConversation(userId, conversationId))) {
    return null;
  }
  const [row] = await getDb()
    .select()
    .from(wakiesCapture)
    .where(eq(wakiesCapture.conversationId, conversationId))
    .limit(1);
  return row?.value ?? null;
}

export async function saveCapture(
  userId: string,
  conversationId: string,
  value: unknown
): Promise<void> {
  await dbReady();
  if (!(await findConversation(userId, conversationId))) {
    throw new Error("Conversation introuvable sur ce compte.");
  }
  await getDb()
    .insert(wakiesCapture)
    .values({ conversationId, value })
    .onConflictDoUpdate({
      set: { updatedAt: new Date(), value },
      target: wakiesCapture.conversationId,
    });
}

/**
 * Réservation transactionnelle : le serveur possède l'historique et la clé
 * d'idempotence.
 *
 * `wakieId` est le participant qui répond (lot messagerie) : un tour est
 * réservé par (conversation, message, Wakie), donc N Wakies répondent au même
 * message utilisateur sans se bloquer, mais un rejeu du même Wakie reste un
 * conflit. Le verrou consultatif suit la même granularité : deux Wakies
 * génèrent en parallèle, deux réservations du même Wakie se sérialisent.
 * Absent, il retombe sur l'organisateur du fil (compatibilité 1:1).
 */
export async function reserveChatTurn(
  userId: string,
  conversationId: string,
  messageId: string,
  wakieId?: string
): Promise<
  { conflict: "busy" | "replayed" } | { id: string; responseId: string }
> {
  const conversation = await findConversation(userId, conversationId);
  if (!conversation) throw new Error("Conversation introuvable.");
  const repondant = wakieId ?? conversation.wakieId;
  await dbReady();
  return getDb().transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(${hashCompte(`${userId}:${conversationId}:${repondant}`)})`
    );
    const [replayed] = await tx
      .select()
      .from(wakiesChatTurn)
      .where(
        and(
          eq(wakiesChatTurn.userId, userId),
          eq(wakiesChatTurn.conversationId, conversationId),
          eq(wakiesChatTurn.messageId, messageId),
          eq(wakiesChatTurn.wakieId, repondant)
        )
      )
      .limit(1);
    if (replayed) return { conflict: "replayed" as const };
    const [running] = await tx
      .select()
      .from(wakiesChatTurn)
      .where(
        and(
          eq(wakiesChatTurn.userId, userId),
          eq(wakiesChatTurn.conversationId, conversationId),
          eq(wakiesChatTurn.wakieId, repondant),
          eq(wakiesChatTurn.status, "running"),
          gt(wakiesChatTurn.expiresAt, new Date())
        )
      )
      .limit(1);
    if (running) return { conflict: "busy" as const };
    await tx
      .update(wakiesChatTurn)
      .set({ status: "interrupted" })
      .where(
        and(
          eq(wakiesChatTurn.userId, userId),
          eq(wakiesChatTurn.conversationId, conversationId),
          eq(wakiesChatTurn.wakieId, repondant),
          eq(wakiesChatTurn.status, "running")
        )
      );
    const [turn] = await tx
      .insert(wakiesChatTurn)
      .values({
        conversationId,
        expiresAt: new Date(Date.now() + 360_000),
        messageId,
        userId,
        wakieId: repondant,
      })
      .returning();
    return { id: turn.id, responseId: turn.responseId };
  });
}
export async function finishChatTurn(
  userId: string,
  turnId: string,
  status: "completed" | "interrupted" | "failed"
): Promise<void> {
  await dbReady();
  await getDb().transaction(async (tx) => {
    const [termine] = await tx
      .update(wakiesChatTurn)
      .set({ status })
      .where(
        and(
          eq(wakiesChatTurn.id, turnId),
          eq(wakiesChatTurn.userId, userId),
          eq(wakiesChatTurn.status, "running")
        )
      )
      .returning();
    if (!termine || status !== "completed") return;
    // Les événements d'un même compte sont alloués dans l'ordre des commits :
    // une relève ne peut pas dépasser un événement encore non validé.
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${`wakies-notifications:${userId}`}))`
    );
    const [entree] = await tx
      .select({ seq: wakiesMessage.seq })
      .from(wakiesMessage)
      .where(
        and(
          eq(wakiesMessage.id, termine.messageId),
          eq(wakiesMessage.conversationId, termine.conversationId)
        )
      )
      .limit(1);
    if (!entree) return;
    const reponses = await tx
      .select({ id: wakiesMessage.id })
      .from(wakiesMessage)
      .where(
        and(
          eq(wakiesMessage.conversationId, termine.conversationId),
          gt(wakiesMessage.seq, entree.seq),
          eq(wakiesMessage.role, "assistant")
        )
      );
    if (reponses.length > 0)
      await tx
        .insert(wakiesNotification)
        .values(
          reponses.map((message) => ({
            conversationId: termine.conversationId,
            messageId: message.id,
            userId,
          }))
        )
        .onConflictDoNothing();
  });
}
