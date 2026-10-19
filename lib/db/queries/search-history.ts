import "server-only";

import { and, desc, eq } from "drizzle-orm";
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
  summary: string
): Promise<boolean> {
  try {
    const db = getDb();
    await db
      .update(maiSearchQuery)
      .set({
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

/**
 * Récupère les recherches récentes de l'utilisateur.
 */
export async function getRecentSearchQueries(
  userId: string,
  limit = 10
): Promise<Array<{ id: string; query: string; createdAt: Date }>> {
  try {
    const db = getDb();
    const rows = await db
      .select({
        createdAt: maiSearchQuery.createdAt,
        id: maiSearchQuery.id,
        query: maiSearchQuery.query,
      })
      .from(maiSearchQuery)
      .where(eq(maiSearchQuery.userId, userId))
      .orderBy(desc(maiSearchQuery.createdAt))
      .limit(limit);

    return rows;
  } catch (error) {
    console.error(
      "[SearchHistory] Échec de récupération de l'historique:",
      error
    );
    return [];
  }
}
