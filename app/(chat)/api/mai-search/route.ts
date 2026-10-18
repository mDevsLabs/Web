import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { recordSearchQuery } from "@/lib/db/queries/search-history";
import { executeMaiSearch } from "@/lib/search/you-client";

export const maxDuration = 15;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const query = typeof body.query === "string" ? body.query.trim() : "";
    const type =
      body.type === "images" || body.type === "web" ? body.type : "all";

    if (!query) {
      return NextResponse.json(
        { error: "Veuillez fournir une requête de recherche." },
        { status: 400 }
      );
    }

    const searchResponse = await executeMaiSearch({
      count: 25,
      query,
      type,
    });

    let searchId: string | null = null;
    // `userId` vient du point de dérivation canonique : `user.id` seul
    // refuserait les comptes dont l'identifiant EST l'adresse.
    const session = await requireUser();

    if (session) {
      searchId = await recordSearchQuery({
        query,
        resultsCount: searchResponse.results.length,
        userId: session.userId,
      });
    }

    return NextResponse.json({
      cached: searchResponse.cached,
      images: searchResponse.images,
      news: searchResponse.news || [],
      provider: searchResponse.provider,
      query: searchResponse.query,
      results: searchResponse.results,
      searchId,
      success: searchResponse.success,
      videos: searchResponse.videos || [],
    });
  } catch (error: any) {
    console.error("[mAI-Search-API] Erreur:", error);
    return NextResponse.json(
      {
        error: "Une erreur est survenue lors de la recherche.",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
