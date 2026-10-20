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
 * La préférence du compte est un PLAFOND, pas une liste figée : le client
 * propose un sous-ensemble, le serveur l'intersecte avec le plafond.
 *
 * Pourquoi une intersection, et non « la préférence gagne » :
 *
 * - le client ne peut pas Élargir : demander « images » alors que le compte
 *   les a désactivées ne remet pas d'images à l'écran ;
 * - le client peut RÉTRÉCIR : c'est ce qui rend les onglets « Actualités »
 *   ou « Images » possibles. Sans cela, désactiver les images dans les
 *   paramètres rendrait l'onglet « Images » vide — et surtout, un compte
 *   qui les a activées ne pourrait pas demander les images SEULES, alors
 *   que c'est précisément ce que fait l'onglet.
 *
 * `type` reste honoré pour les appelants historiques : c'est lui qui porte
 * le comportement « images seules ».
 */
export function resolveSources(params: {
  preferences: { searchSources?: string[] } | null;
  requested?: string[];
  type?: "all" | "images" | "web";
}): MaiSearchSourceKey[] {
  // Le plafond : ce que le compte a autorisé. La normalisation est faite ici,
  // pas seulement à la lecture : c'est elle qui garantit qu'une source
  // fantôme ne finit jamais dans la requête envoyée au moteur.
  const plafond = params.preferences?.searchSources?.length
    ? normalizeMaiSearchSources(params.preferences.searchSources)
    : [...MAI_SEARCH_SOURCE_KEYS];

  // La demande : ce que l'appelant veut, borné par le plafond.
  let demande: MaiSearchSourceKey[] | null = null;
  if (params.requested?.length) {
    demande = normalizeMaiSearchSources(params.requested);
  } else if (params.type === "images") {
    demande = ["images"];
  } else if (params.type === "web") {
    demande = ["web"];
  }

  if (!demande) {
    return plafond;
  }

  // Intersection. Si la demande ne laisse rien dans le plafond — l'onglet
  // « Images » alors que les images sont désactivées — on rend le PLAFOND
  // plutôt que rien : une recherche qui ne rend aucun lien est un échec
  // silencieux, alors que rendre les sources autorisées reste utile.
  const autorisees = plafond.filter((source) => demande.includes(source));
  return autorisees.length > 0 ? autorisees : plafond;
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

    const debut = Date.now();
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
    const dureeMs = Date.now() - debut;

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
      /**
       * Durée de la recherche, en millisecondes.
       *
       * Ce n'est pas un ornement : c'est le seul moyen, pour l'interface,
       * de distinguer « le moteur a été lent » de « le moteur n'a rien
       * trouvé ». La première invite à réessayer, la seconde invite à
       * reformuler — deux gestes opposés.
       */
      durationMs: dureeMs,
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
