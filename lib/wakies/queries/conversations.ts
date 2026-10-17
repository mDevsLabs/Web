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

import { findWakie } from "./wakies";

// ─── Conversations ──────────────────────────────────────────────────────────

/** Une première relève fixe la borne sans notifier l'historique déjà présent. */
export async function releverNotifications(userId: string, after?: number) {
  await dbReady();
  const db = getDb();
  if (after === undefined) {
    const [borne] = await db
      .select({
        seq: sql<number>`coalesce(max(${wakiesNotification.seq}), 0)::int`,
      })
      .from(wakiesNotification)
      .where(eq(wakiesNotification.userId, userId));
    return { cursor: borne?.seq ?? 0, notifications: [] };
  }
  const rows = await db
    .select({
      conversationId: wakiesMessage.conversationId,
      id: wakiesMessage.id,
      muted: wakiesConversation.muted,
      parts: wakiesMessage.parts,
      seq: wakiesNotification.seq,
      title: wakiesConversation.title,
    })
    .from(wakiesNotification)
    .innerJoin(
      wakiesMessage,
      eq(wakiesMessage.id, wakiesNotification.messageId)
    )
    .innerJoin(
      wakiesConversation,
      eq(wakiesConversation.id, wakiesMessage.conversationId)
    )
    .where(
      and(
        eq(wakiesConversation.userId, userId),
        eq(wakiesNotification.userId, userId),
        eq(wakiesMessage.role, "assistant"),
        gt(wakiesNotification.seq, after)
      )
    )
    .orderBy(asc(wakiesNotification.seq))
    .limit(100);
  return {
    cursor: rows.at(-1)?.seq ?? after,
    notifications: rows.map(({ parts, ...row }) => ({
      ...row,
      preview: apercuMessage(parts),
    })),
  };
}

/**
 * Conversation telle que la LISTE la sert : la ligne, plus ce qu'une liste de
 * messagerie doit montrer — aperçu du dernier message, horodatage, compteur de
 * non-lus et participants.
 *
 * Pourquoi ces champs sont calculés ICI et pas dans l'interface : la page ne
 * doit pas ouvrir chaque conversation pour afficher son aperçu, et le compteur
 * de non-lus se déduit du curseur `lastReadSeq` côté serveur (le client ne
 * recalcule jamais une limite ou un état de lecture).
 */
export type WakieConversationListee = WakieConversationRow & {
  apercuDernierMessage: string;
  auteurDernierWakieId: string | null;
  dernierMessageAt: Date | null;
  dernierMessageId: string | null;
  dernierRole: string | null;
  nonLus: number;
};

export async function listConversations(
  userId: string
): Promise<WakieConversationListee[]> {
  await dbReady();
  const db = getDb();
  const conversations = await db
    .select()
    .from(wakiesConversation)
    .where(
      and(
        eq(wakiesConversation.userId, userId),
        // Les fils de groupe sont retirés du produit, pas de la base : leurs
        // lignes restent (migrations additives). Sans ce filtre, ils
        // reparaîtraient comme des conversations fantômes dans le rail.
        ne(wakiesConversation.isGroup, true)
      )
    )
    .orderBy(desc(wakiesConversation.createdAt));
  if (conversations.length === 0) return [];
  const ids = conversations.map((row) => row.id);
  // `sql.join` compose une liste de paramètres : les identifiants restent des
  // valeurs liées, jamais du SQL concaténé.
  const liste = sql.join(
    ids.map((id) => sql`${id}::uuid`),
    sql`, `
  );
  // DISTINCT ON : un seul aller-retour pour le DERNIER message de chaque fil.
  const derniers = (await db.execute(sql`
    SELECT DISTINCT ON ("conversationId")
      "conversationId", "id", "role", "authorWakieId", "parts", "createdAt"
    FROM "WakiesMessage"
    WHERE "conversationId" IN (${liste})
    ORDER BY "conversationId", "seq" DESC
  `)) as unknown as Array<{
    authorWakieId: string | null;
    conversationId: string;
    createdAt: Date;
    id: string;
    parts: unknown;
    role: string;
  }>;
  const nonLus = await db
    .select({
      conversationId: wakiesMessage.conversationId,
      total: sql<number>`count(*)::int`,
    })
    .from(wakiesMessage)
    .innerJoin(
      wakiesConversation,
      eq(wakiesConversation.id, wakiesMessage.conversationId)
    )
    .where(
      and(
        eq(wakiesConversation.userId, userId),
        gt(wakiesMessage.seq, wakiesConversation.lastReadSeq),
        // Mes propres messages ne sont jamais « non lus ».
        sql`${wakiesMessage.role} <> 'user'`
      )
    )
    .groupBy(wakiesMessage.conversationId);
  const parDernier = new Map(derniers.map((row) => [row.conversationId, row]));
  const parNonLus = new Map(
    nonLus.map((row) => [row.conversationId, row.total])
  );
  return conversations.map((row) => {
    const dernier = parDernier.get(row.id);
    return {
      ...row,
      apercuDernierMessage: dernier ? apercuMessage(dernier.parts) : "",
      auteurDernierWakieId: dernier?.authorWakieId ?? null,
      dernierMessageAt: dernier?.createdAt ?? null,
      dernierMessageId: dernier?.id ?? null,
      dernierRole: dernier?.role ?? null,
      nonLus: parNonLus.get(row.id) ?? 0,
    };
  });
}

export async function createConversation(
  userId: string,
  input: { wakieId: string; title: string; model?: string | null }
): Promise<WakieConversationRow> {
  await dbReady();
  const wakie = await findWakie(userId, input.wakieId);
  if (!wakie) {
    throw new Error("Wakie introuvable.");
  }
  const [row] = await getDb()
    .insert(wakiesConversation)
    .values({
      learningContainerId: wakie.learningContainerId ?? null,
      // Le modèle du Wakie est le DÉFAUT de ses nouvelles conversations ; la
      // conversation en garde une copie, donc changer le Wakie ne réécrit pas
      // le modèle des fils existants (et donc leur facturation).
      model: input.model ?? wakie.model ?? null,
      // À CONTRAIRE des colonnes de sélection d'outils, qui restent à NULL.
      // Ce n'est pas un oubli : le modèle est FIGÉ à la création parce qu'il
      // détermine ce qui a été facturé aux tours déjà joués, alors qu'un outil
      // ne coûte qu'au tour où il est appelé. NULL y signifie « suit le
      // Wakie », donc corriger la sélection d'un Wakie corrige aussi ses
      // conversations qui n'ont jamais rien choisi — comportement voulu, et le
      // seul qui rende `null` et `[]` distinguables.
      title: input.title,
      userId,
      wakieId: input.wakieId,
    })
    .returning();
  return row;
}

/**
 * Met à jour une conversation du compte.
 *
 * Les champs absents ne sont pas touchés : le renommage et le choix du modèle
 * sont deux gestes indépendants, et un PATCH qui n'en porte qu'un ne doit pas
 * écraser l'autre. `model: null` revient au modèle du Wakie (puis au défaut) :
 * c'est un choix explicite, pas une absence de valeur.
 *
 * Il en va de même pour la sélection d'outils : `undefined` = conserver,
 * `null` = revenir au réglage du Wakie, `[]` = ne rien utiliser. Le formulaire
 * et son adaptateur doivent distinguer ces trois intentions — les confondre
 * fait qu'un simple renommage vide le plateau d'outils de la conversation.
 */
export async function updateConversation(
  userId: string,
  conversationId: string,
  patch: {
    favorite?: boolean;
    muted?: boolean;
    title?: string;
    model?: string | null;
    mcpServerIds?: string[] | null;
    pluginIds?: string[] | null;
    skillIds?: string[] | null;
    skillParams?: Record<string, Record<string, string>> | null;
    toolIds?: string[] | null;
    /** Contexte durable réglé par `@@` (migration 0053). */
    contextPageIds?: string[] | null;
    contextSpaceIds?: string[] | null;
    contextWakieIds?: string[] | null;
  }
): Promise<WakieConversationRow | null> {
  await dbReady();
  const changes: Partial<typeof wakiesConversation.$inferInsert> & {
    updatedAt: Date;
  } = {
    updatedAt: new Date(),
  };
  if (patch.title !== undefined) {
    changes.title = patch.title;
  }
  if (patch.favorite !== undefined) changes.favorite = patch.favorite;
  if (patch.muted !== undefined) changes.muted = patch.muted;
  if (patch.model !== undefined) {
    changes.model = patch.model;
  }
  // Chaque colonne est traitée séparément : `undefined` (absent du PATCH) et
  // `null` (« reviens au Wakie ») doivent produire deux écritures différentes.
  for (const champ of [
    "contextPageIds",
    "contextSpaceIds",
    "contextWakieIds",
    "mcpServerIds",
    "pluginIds",
    "skillIds",
    "skillParams",
    "toolIds",
  ] as const) {
    const valeur = patch[champ];
    if (valeur !== undefined) {
      changes[champ] = valeur as never;
    }
  }
  const [row] = await getDb()
    .update(wakiesConversation)
    .set(changes)
    .where(
      and(
        eq(wakiesConversation.id, conversationId),
        eq(wakiesConversation.userId, userId)
      )
    )
    .returning();
  return row ?? null;
}

/** Conversation du compte, ou `null` — le garde-fou d'isolation du port. */
export async function findConversation(
  userId: string,
  conversationId: string
): Promise<WakieConversationRow | null> {
  await dbReady();
  const [row] = await getDb()
    .select()
    .from(wakiesConversation)
    .where(
      and(
        eq(wakiesConversation.id, conversationId),
        eq(wakiesConversation.userId, userId)
      )
    )
    .limit(1);
  return row ?? null;
}

/**
 * Marque la conversation comme modifiée. Prend `userId` comme les autres : un
 * `UPDATE` sans filtre de propriété peut toucher la conversation d'un autre
 * compte, et rien dans la signature ne l'interdisait.
 */
export async function touchConversation(
  userId: string,
  conversationId: string
): Promise<void> {
  await dbReady();
  await getDb()
    .update(wakiesConversation)
    .set({ updatedAt: new Date() })
    .where(
      and(
        eq(wakiesConversation.id, conversationId),
        eq(wakiesConversation.userId, userId)
      )
    );
}

export async function deleteConversation(
  userId: string,
  conversationId: string
): Promise<boolean> {
  await dbReady();
  const rows = await getDb()
    .delete(wakiesConversation)
    .where(
      and(
        eq(wakiesConversation.id, conversationId),
        eq(wakiesConversation.userId, userId)
      )
    )
    .returning({ id: wakiesConversation.id });
  return rows.length > 0;
}
