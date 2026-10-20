import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { recordSearchQuery } from "@/lib/db/queries/search-history";
import { getUserPreferences } from "@/lib/db/queries/users";
import {
  MAI_SEARCH_LANGUAGES,
  MAI_SEARCH_SAFETY_LEVELS,
  MAI_SEARCH_SOURCE_KEYS,
  type MaiSearchSourceKey,
  normalizeMaiSearchSources,
} from "@/lib/search/sources";
import { executeMaiSearch } from "@/lib/search/you-client";

export const maxDuration = 15;

// Le client peut demander un sous-ensemble de sources, mais il ne peut pas
// EN IMPOSER : c'est la préférence du compte qui fait autorité. Sans cette
// distinction, « désactiver les images » serait contournable en un appel.
const bodySchema = z.object({
  count: z.number().int().min(1).max(25).optional(),
  lang: z.enum(MAI_SEARCH_LANGUAGES).optional(),
  query: z.string().min(1).max(500),
  safetyLevel: z.enum(MAI_SEARCH_SAFETY_LEVELS).optional(),
  sources: z.array(z.enum(MAI_SEARCH_SOURCE_KEYS)).min(1).optional(),
  type: z.enum(["images", "web", "all"]).optional(),
});

/**
 * Les sources réellement interrogées.
 *
 * Trois cas, dans cet ordre :
 *
 * 1. Le compte a une préférence enregistrée ⇒ c'est elle qui fait foi. Le
 *    client ne peut pas élargir le périmètre de sa recherche, et il ne peut
 *    pas non plus le rétrécir : sinon « désactiver les images » contourné
 *    par un appel direct remettrait des images à l'écran.
 * 2. Aucune préférence (visiteur non connecté) ⇒ les sources demandées par
 *    le client, ou toutes.
 * 3. Le paramètre historique `type` reste honoré quand le client le
 *    fournit : c'est lui qui porte le comportement « images seules ».
 */
function resolveSources(params: {
  preferences: { searchSources?: string[] } | null;
  requested?: string[];
  type?: "all" | "images" | "web";
}): MaiSearchSourceKey[] {
  if (params.preferences?.searchSources?.length) {
    // La Normalisation est faite ici, pas seulement à la lecture : c'est
    // elle qui garantit qu'une source fantôme ne finit jamais dans la
    // requête envoyée au moteur.
    return normalizeMaiSearchSources(params.preferences.searchSources);
  }
  if (params.requested?.length) {
    return normalizeMaiSearchSources(params.requested);
  }
  if (params.type === "images") {
    return ["images"];
  }
  if (params.type === "web") {
    return ["web"];
  }
  return [...MAI_SEARCH_SOURCE_KEYS];
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Requête de recherche invalide." },
        { status: 400 }
      );
    }
    const { count, lang, query, safetyLevel, sources, type } = parsed.data;
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return NextResponse.json(
        { error: "Veuillez fournir une requête de recherche." },
        { status: 400 }
      );
    }

    // `userId` vient du point de dérivation canonique : `user.id` seul
    // refuserait les comptes dont l'identifiant EST l'adresse.
    const session = await requireUser();

    // Les préférences du compte font autorité : le client propose, le
    // serveur tranche. Une session absente (visiteur non connecté) utilise
    // les valeurs par défaut — la recherche reste possible.
    const preferences = session
      ? await getUserPreferences(session.userId).catch(() => null)
      : null;

    const effectiveSources = resolveSources({
      preferences,
      requested: sources,
      type,
    });
    const effectiveLang = preferences?.searchLanguage ?? lang ?? "fr";
    const effectiveSafety =
      preferences?.searchSafetyLevel ?? safetyLevel ?? "medium";
    const preferredCount = preferences?.searchResultCount ?? 10;

    const searchResponse = await executeMaiSearch({
      // Le nombre demandé ne peut pas dépasser la préférence du compte :
      // c'est elle qui borne l'usage du moteur.
      count: Math.min(count ?? preferredCount, preferredCount),
      lang: effectiveLang,
      query: trimmedQuery,
      safetyLevel: effectiveSafety,
      // `sources` fait autorité : `type` n'est plus transmis au moteur,
      // sinon deux paramètres décrivant la même chose pourraient
      // diverger.
      sources: effectiveSources,
    });

    let searchId: string | null = null;

    if (session) {
      searchId = await recordSearchQuery({
        query: trimmedQuery,
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
      wikiFirst: searchResponse.wikiFirst ?? false,
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
