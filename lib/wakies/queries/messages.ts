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

// ─── Messages ───────────────────────────────────────────────────────────────

export type WakieMessageInput = {
  id: string;
  conversationId: string;
  role: string;
  parts: unknown;
  /** Auteur d'une réponse de groupe ; NULL = organisateur du fil. */
  authorWakieId?: string | null;
  /** Message auquel celui-ci répond (citation structurée). */
  replyToId?: string | null;
};

/**
 * PROPRIÉTÉ DES MESSAGES
 *
 * `WakiesMessage` ne porte volontairement PAS de colonne `userId` : un message
 * appartient à une conversation, qui appartient à un compte, et dupliquer la
 * propriété sur chaque ligne serait une seconde vérité à désynchroniser. La
 * propriété se vérifie donc par jointure sur `WakiesConversation.userId`.
 *
 * Les quatre fonctions de messages prenaient auparavant un identifiant seul.
 * C'était une frontière absente : l'appelant devait avoir vérifié la propriété
 * en amont, et rien dans la signature ne le rappelait. Un forget supprimait
 * silencieusement le filtre. Elles prennent maintenant toutes `userId` en
 * premier paramètre, comme le reste du fichier.
 */

/** Les conversations du compte parmi celles du lot. Toute autre est rejetée. */
export async function ownedConversationIds(
  userId: string,
  conversationIds: readonly string[]
): Promise<Set<string>> {
  const uniques = [...new Set(conversationIds)];
  if (uniques.length === 0) {
    return new Set();
  }
  await dbReady();
  const rows = await getDb()
    .select({ id: wakiesConversation.id })
    .from(wakiesConversation)
    .where(
      and(
        eq(wakiesConversation.userId, userId),
        inArray(wakiesConversation.id, uniques)
      )
    );
  return new Set(rows.map((row) => row.id));
}

/**
 * Écrit un lot de messages. `onConflictDoNothing` sur l'identifiant rend
 * l'opération sûre à rejouer : un flux interrompu puis renvoyé ne duplique
 * pas les messages déjà persistés.
 *
 * Le lot est EN ATTENDANT vérifié : un `conversationId` qui n'appartient pas
 * au compte fait échouer l'écriture entière plutôt que d'en insérer une
 * partie. Écrire ne doit jamais être partiel sous le doute.
 */
export async function appendMessages(
  userId: string,
  messages: WakieMessageInput[]
): Promise<void> {
  if (messages.length === 0) {
    return;
  }
  const autorisees = await ownedConversationIds(
    userId,
    messages.map((message) => message.conversationId)
  );
  const intruses = messages.filter(
    (message) => !autorisees.has(message.conversationId)
  );
  if (intruses.length > 0) {
    throw new Error("Conversation introuvable sur ce compte.");
  }
  await dbReady();
  await getDb()
    .insert(wakiesMessage)
    .values(messages)
    .onConflictDoNothing({ target: wakiesMessage.id });
}

/**
 * Historique d'une conversation, dans l'ordre d'écriture (`seq`).
 *
 * `seq` est un `serial` : c'est l'ordre d'INSERTION, pas l'horodatage. Deux
 * messages écrits dans la même milliseconde restent donc dans le bon ordre,
 * ce que `createdAt` ne garantit pas.
 *
 * PAGINATION — le curseur est `seq`, pas `createdAt`, et il est STRICTEMENT
 * décroissant. Deux pages successives ne peuvent donc jamais se chevaucher ni
 * sauter un message, même quand plusieurs messages partagent le même
 * horodatage. `limite` est bornée : une conversation longue ne se charge
 * jamais entière en mémoire.
 */
export async function listMessages(
  userId: string,
  conversationId: string,
  options: { avantSeq?: number; apresSeq?: number; limite?: number } = {}
): Promise<(typeof wakiesMessage.$inferSelect)[]> {
  await dbReady();
  const conditions = [
    eq(wakiesMessage.conversationId, conversationId),
    eq(wakiesConversation.userId, userId),
  ];
  if (options.avantSeq !== undefined) {
    conditions.push(lt(wakiesMessage.seq, options.avantSeq));
  }
  if (options.apresSeq !== undefined) {
    conditions.push(gt(wakiesMessage.seq, options.apresSeq));
  }
  const rows = await getDb()
    .select({ message: wakiesMessage })
    .from(wakiesMessage)
    .innerJoin(
      wakiesConversation,
      eq(wakiesMessage.conversationId, wakiesConversation.id)
    )
    .where(and(...conditions))
    .orderBy(
      options.apresSeq === undefined
        ? desc(wakiesMessage.seq)
        : asc(wakiesMessage.seq)
    )
    .limit(Math.min(Math.max(options.limite ?? 200, 1), 501));
  const messages = rows.map((row) => row.message);
  return options.apresSeq === undefined ? messages.reverse() : messages;
}

/**
 * Réécrit le texte d'un message DU COMPTE.
 *
 * Deux gardes dans la requête elle-même, pas seulement dans la route : le
 * message doit appartenir à une conversation du compte ET avoir le rôle
 * `user`. Une réponse de Wakie n'est jamais modifiable, même par son
 * propriétaire. Les pièces jointes d'origine sont conservées ; seul le texte
 * est remplacé.
 */
export async function updateOwnMessageText(
  userId: string,
  messageId: string,
  text: string
): Promise<boolean> {
  await dbReady();
  const [row] = await getDb()
    .select({ id: wakiesMessage.id, parts: wakiesMessage.parts })
    .from(wakiesMessage)
    .innerJoin(
      wakiesConversation,
      eq(wakiesMessage.conversationId, wakiesConversation.id)
    )
    .where(
      and(
        eq(wakiesMessage.id, messageId),
        eq(wakiesConversation.userId, userId),
        eq(wakiesMessage.role, "user")
      )
    )
    .limit(1);
  if (!row) return false;

  const parts = Array.isArray(row.parts) ? (row.parts as any[]) : [];
  const pieces = parts.filter((part) => part?.type !== "text");
  await getDb()
    .update(wakiesMessage)
    .set({ parts: [{ text, type: "text" }, ...pieces] })
    .where(eq(wakiesMessage.id, messageId));
  return true;
}

/** Message déjà écrit ? Utilisé par le flux pour ne pas le réinsérer. */
export async function messageExists(
  userId: string,
  messageId: string
): Promise<boolean> {
  await dbReady();
  const [row] = await getDb()
    .select({ id: wakiesMessage.id })
    .from(wakiesMessage)
    .innerJoin(
      wakiesConversation,
      eq(wakiesMessage.conversationId, wakiesConversation.id)
    )
    .where(
      and(
        eq(wakiesMessage.id, messageId),
        eq(wakiesConversation.userId, userId)
      )
    )
    .limit(1);
  return Boolean(row);
}
