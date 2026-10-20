import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import {
  clearSearchQueries,
  deleteSearchQuery,
} from "@/lib/db/queries/search-history";

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
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host && new URL(origin).host !== host) {
      return NextResponse.json(
        { error: "Origine de la requête non autorisée." },
        { status: 403 }
      );
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
