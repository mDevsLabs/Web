import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/queries";
import { maiSearchQuery } from "@/lib/db/schema";

/**
 * Enregistre une requête de recherche mAI Search dans la base.
 */
export async function recordSearchQuery(params: {
  query: string;
  resultsCount: number;
  summary?: string;
  userId: string;
}): Promise<string | null> {
  try {
    const db = getDb();
    const [inserted] = await db
      .insert(maiSearchQuery)
      .values({
        query: params.query.trim(),
        resultsCount: params.resultsCount,
        summary: params.summary ?? null,
        userId: params.userId,
      })
      .returning({ id: maiSearchQuery.id });

    return inserted?.id ?? null;
  } catch (error) {
    console.error(
      "[SearchHistory] Échec d'enregistrement de la recherche:",
      error
    );
    return null;
  }
}

/**
 * Met à jour le résumé IA associé à une recherche existante.
 *
 * `userId` n'est pas décoratif : `searchId` vient du client, et sans ce filtre
 * une session pourrait écraser le résumé d'une recherche qui ne lui appartient
 * pas. Une ligne d'un autre compte ne matche pas et la mise à jour est un no-op.
 */
export async function updateSearchQuerySummary(
  id: string,
  userId: string,
  summary: string,
  reasoning?: string | null
): Promise<boolean> {
  try {
    const db = getDb();
    await db
      .update(maiSearchQuery)
      .set({
        reasoning: reasoning?.trim() ? reasoning : null,
        summary,
        updatedAt: new Date(),
      })
      .where(and(eq(maiSearchQuery.id, id), eq(maiSearchQuery.userId, userId)));
    return true;
  } catch (error) {
    console.error("[SearchHistory] Échec de mise à jour du résumé:", error);
    return false;
  }
}

/**
 * Met à jour le vote utilisateur (Bien / Pas bien) pour un résumé.
 */
export async function updateSearchQueryVote(
  id: string,
  userId: string,
  vote: "good" | "bad"
): Promise<boolean> {
  try {
    const db = getDb();
    await db
      .update(maiSearchQuery)
      .set({
        updatedAt: new Date(),
        vote,
      })
      .where(and(eq(maiSearchQuery.id, id), eq(maiSearchQuery.userId, userId)));
    return true;
  } catch (error) {
    console.error("[SearchHistory] Échec de mise à jour du vote:", error);
    return false;
  }
}

export const SEARCH_HISTORY_PAGE_SIZE = 40;

export type SearchHistoryListItem = {
  createdAt: Date;
  hasSummary: boolean;
  id: string;
  pinned: boolean;
  query: string;
  title: string | null;
};

/**
 * Page d'historique, épinglées d'abord.
 *
 * Le décalage est volontaire : épingler change l'ordre, un curseur de date
 * sauterait des lignes. Après une épingle ou un renommage, l'interface
 * recharge depuis le début.
 */
export async function getSearchHistoryPage(params: {
  limit?: number;
  offset?: number;
  userId: string;
}): Promise<{ hasMore: boolean; queries: SearchHistoryListItem[] }> {
  const limit = Math.min(
    100,
    Math.max(1, params.limit ?? SEARCH_HISTORY_PAGE_SIZE)
  );
  const offset = Math.max(0, params.offset ?? 0);
  try {
    const db = getDb();
    const rows = await db
      .select({
        createdAt: maiSearchQuery.createdAt,
        hasSummary: sql<boolean>`(${maiSearchQuery.summary} IS NOT NULL AND ${maiSearchQuery.summary} <> '')`,
        id: maiSearchQuery.id,
        pinned: maiSearchQuery.pinned,
        query: maiSearchQuery.query,
        title: maiSearchQuery.title,
      })
      .from(maiSearchQuery)
      .where(eq(maiSearchQuery.userId, params.userId))
      .orderBy(
        desc(maiSearchQuery.pinned),
        desc(maiSearchQuery.createdAt),
        desc(maiSearchQuery.id)
      )
      .limit(limit + 1)
      .offset(offset);

    const hasMore = rows.length > limit;
    return { hasMore, queries: hasMore ? rows.slice(0, limit) : rows };
  } catch (error) {
    console.error(
      "[SearchHistory] Échec de récupération de l'historique:",
      error
    );
    return { hasMore: false, queries: [] };
  }
}

/**
 * Une recherche du compte, avec la synthèse et la réflexion enregistrées.
 *
 * `userId` filtre : l'identifiant vient du client, une ligne d'un autre
 * compte ne doit jamais sortir.
 */
export async function getSearchQueryForUser(
  id: string,
  userId: string
): Promise<{
  createdAt: Date;
  id: string;
  pinned: boolean;
  query: string;
  reasoning: string | null;
  summary: string | null;
  title: string | null;
  vote: string | null;
} | null> {
  try {
    const db = getDb();
    const [row] = await db
      .select({
        createdAt: maiSearchQuery.createdAt,
        id: maiSearchQuery.id,
        pinned: maiSearchQuery.pinned,
        query: maiSearchQuery.query,
        reasoning: maiSearchQuery.reasoning,
        summary: maiSearchQuery.summary,
        title: maiSearchQuery.title,
        vote: maiSearchQuery.vote,
      })
      .from(maiSearchQuery)
      .where(and(eq(maiSearchQuery.id, id), eq(maiSearchQuery.userId, userId)))
      .limit(1);
    return row ?? null;
  } catch (error) {
    console.error("[SearchHistory] Échec de lecture d'une recherche:", error);
    return null;
  }
}

/**
 * Renomme ou épingle une recherche du compte.
 *
 * Un titre vide revient au texte de la requête. Seuls les champs fournis
 * sont écrits.
 */
export async function patchSearchQuery(params: {
  id: string;
  pinned?: boolean;
  title?: string | null;
  userId: string;
}): Promise<boolean> {
  const patch: { pinned?: boolean; title?: string | null; updatedAt: Date } = {
    updatedAt: new Date(),
  };
  if (params.pinned !== undefined) {
    patch.pinned = params.pinned;
  }
  if (params.title !== undefined) {
    const titre = params.title?.trim() ?? "";
    patch.title = titre.length > 0 ? titre.slice(0, 180) : null;
  }
  if (params.pinned === undefined && params.title === undefined) {
    return false;
  }
  try {
    const db = getDb();
    const updated = await db
      .update(maiSearchQuery)
      .set(patch)
      .where(
        and(
          eq(maiSearchQuery.id, params.id),
          eq(maiSearchQuery.userId, params.userId)
        )
      )
      .returning({ id: maiSearchQuery.id });
    return updated.length > 0;
  } catch (error) {
    console.error("[SearchHistory] Échec de mise à jour:", error);
    return false;
  }
}

/**
 * Supprime une recherche de l'historique du compte.
 *
 * `userId` n'est pas décoratif : `id` vient du client, et sans ce filtre une
 * session pourrait effacer la recherche d'un autre compte. La ligne d'un
 * autre compte ne matche pas, et la suppression est un no-op — exactement
 * comme pour la mise à jour du résumé.
 */
export async function deleteSearchQuery(
  id: string,
  userId: string
): Promise<boolean> {
  try {
    const db = getDb();
    const deleted = await db
      .delete(maiSearchQuery)
      .where(and(eq(maiSearchQuery.id, id), eq(maiSearchQuery.userId, userId)))
      .returning({ id: maiSearchQuery.id });
    return deleted.length > 0;
  } catch (error) {
    console.error("[SearchHistory] Échec de suppression:", error);
    return false;
  }
}

/**
 * Vide tout l'historique de recherche du compte.
 *
 * Une seule requête, sans plafond : c'est le geste « tout effacer », et
 * l'interface le propose explicitement. La ligne du compte est protégée
 * par le même filtre `userId` que la suppression unitaire.
 */
export async function clearSearchQueries(userId: string): Promise<number> {
  try {
    const db = getDb();
    const deleted = await db
      .delete(maiSearchQuery)
      .where(eq(maiSearchQuery.userId, userId))
      .returning({ id: maiSearchQuery.id });
    return deleted.length;
  } catch (error) {
    console.error("[SearchHistory] Échec du vidage:", error);
    return 0;
  }
}
