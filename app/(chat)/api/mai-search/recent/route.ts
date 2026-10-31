import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import {
  clearSearchQueries,
  deleteSearchQuery,
  getSearchHistoryPage,
  getSearchQueryForUser,
  patchSearchQuery,
  SEARCH_HISTORY_PAGE_SIZE,
} from "@/lib/db/queries/search-history";

function refuseOrigineEtrangere(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return NextResponse.json(
      { error: "Origine de la requête non autorisée." },
      { status: 403 }
    );
  }
  return null;
}

/**
 * GET /api/mai-search/recent — historique du compte connecté.
 *
 * Sans `id` : une page (épinglées d'abord). Avec `id` : la recherche, sa
 * synthèse et sa réflexion, pour les rouvrir sans relancer le modèle.
 * Un visiteur sans session reçoit une liste vide : l'historique est un
 * confort, pas une erreur.
 */
export async function GET(request: Request) {
  try {
    const session = await requireUser();
    if (!session) {
      return NextResponse.json({ queries: [] });
    }
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (id) {
      if (!z.string().uuid().safeParse(id).success) {
        return NextResponse.json(
          { error: "Identifiant invalide." },
          { status: 400 }
        );
      }
      const row = await getSearchQueryForUser(id, session.userId);
      if (!row) {
        return NextResponse.json(
          { error: "Recherche introuvable." },
          { status: 404 }
        );
      }
      return NextResponse.json({
        query: {
          createdAt: row.createdAt.toISOString(),
          id: row.id,
          pinned: row.pinned,
          query: row.query,
          reasoning: row.reasoning,
          summary: row.summary,
          title: row.title,
          vote: row.vote === "good" || row.vote === "bad" ? row.vote : null,
        },
      });
    }

    const limit = Number(
      url.searchParams.get("limit") ?? SEARCH_HISTORY_PAGE_SIZE
    );
    const offset = Number(url.searchParams.get("offset") ?? 0);
    const page = await getSearchHistoryPage({
      limit: Number.isFinite(limit) ? limit : SEARCH_HISTORY_PAGE_SIZE,
      offset: Number.isFinite(offset) ? offset : 0,
      userId: session.userId,
    });
    return NextResponse.json({
      hasMore: page.hasMore,
      nextOffset: page.hasMore
        ? Math.max(0, Number.isFinite(offset) ? offset : 0) +
          page.queries.length
        : null,
      queries: page.queries.map((query) => ({
        createdAt: query.createdAt.toISOString(),
        hasSummary: query.hasSummary,
        id: query.id,
        pinned: query.pinned,
        query: query.query,
        title: query.title,
      })),
    });
  } catch (error) {
    console.error("[mAI-Search-Recent] Lecture impossible:", error);
    return NextResponse.json({ hasMore: false, queries: [] });
  }
}

const patchSchema = z
  .object({
    id: z.string().uuid(),
    pinned: z.boolean().optional(),
    title: z.string().max(180).nullable().optional(),
  })
  .refine((value) => value.pinned !== undefined || value.title !== undefined, {
    message: "Rien à modifier.",
  });

/**
 * PATCH /api/mai-search/recent — renomme ou épingle une recherche du compte.
 */
export async function PATCH(request: Request) {
  const refused = refuseOrigineEtrangere(request);
  if (refused) {
    return refused;
  }
  try {
    const session = await requireUser();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }
    const parsed = patchSchema.safeParse(
      await request.json().catch(() => null)
    );
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Modification d'historique invalide." },
        { status: 400 }
      );
    }
    const updated = await patchSearchQuery({
      id: parsed.data.id,
      pinned: parsed.data.pinned,
      title: parsed.data.title,
      userId: session.userId,
    });
    if (!updated) {
      return NextResponse.json(
        { error: "Recherche introuvable." },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[mAI-Search-Recent] Modification impossible:", error);
    return NextResponse.json(
      { error: "Impossible de modifier l'historique." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/mai-search/recent — purge l'historique de recherche.
 *
 * Deux gestes, distingués par le corps :
 *
 * - `{ id }` supprime UNE recherche ;
 * - `{ all: true }` vide tout l'historique du compte.
 *
 * Les deux sont des MUTATIONS : la route refuse donc une origine étrangère,
 * comme toute route d'écriture de l'hôte. Le cookie de session suffit
 * pour l'authentification, mais un formulaire cross-site pourrait déclencher
 * la suppression sans que l'utilisateur l'ait demandée.
 */

const bodySchema = z.union([
  z.object({ all: z.literal(true) }),
  z.object({ id: z.string().uuid() }),
]);

export async function DELETE(request: Request) {
  try {
    const refused = refuseOrigineEtrangere(request);
    if (refused) {
      return refused;
    }

    const session = await requireUser();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Requête de suppression invalide." },
        { status: 400 }
      );
    }

    if ("all" in parsed.data) {
      const removed = await clearSearchQueries(session.userId);
      return NextResponse.json({ removed, success: true });
    }

    const removed = await deleteSearchQuery(parsed.data.id, session.userId);
    return NextResponse.json({ removed, success: true });
  } catch (error) {
    console.error("[mAI-Search-Recent] Erreur:", error);
    return NextResponse.json(
      { error: "Impossible de modifier l'historique." },
      { status: 500 }
    );
  }
}
