import { z } from "zod";
import { errorResponse, logError } from "@/lib/api/error-response";
import { getMaiUser } from "@/lib/auth/session";
import { searchIndex } from "@/lib/search/index-query";
import { isSearchSourceKey, type SearchSourceKey } from "@/lib/search/types";

// Point d'entrée unique de la recherche interne. La page `/recherche` et son
// icône dans la barre latérale passent tous deux par ici : aucun autre
// composant n'assemble de sources lui-même, sinon deux écrans divergeraient sur
// ce qu'un compte contient.
//
// Le cache est désactivé (`private, no-store`) : ce sont des données
// personnelles, et une recherche doit refléter l'instant.

/**
 * Plafond par source et par page.
 *
 * `perSource` borne la page, `max` borne l'offset. Sans ce second plafond, un
 * lien forgé (`?offset=1000000`) ferait porter un `OFFSET` d'un million sur
 * seize tables — un coût payé par le serveur, sur une URL que l'utilisateur a
 * entrée sans le vouloir. Au-delà, la page doit affiner sa recherche.
 */
const PER_SOURCE_LIMIT = 12;
const MAX_OFFSET = 240;
const MIN_QUERY_LENGTH = 2;

const querySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(PER_SOURCE_LIMIT)
    .default(PER_SOURCE_LIMIT),
  offset: z.coerce.number().int().min(0).max(MAX_OFFSET).default(0),
  q: z.string().trim().min(MIN_QUERY_LENGTH).max(200),
  sources: z.string().optional(),
});

/**
 * Normalise les query params.
 *
 * Une source inconnue est IGNORÉE plutôt que fatale : un lien partagé depuis
 * une version antérieure, ou une source retirée, doit encore rendre des
 * résultats pour les autres. Seule une requête trop courte est refusée, car il
 * n'y a alors rien à chercher.
 */
function parseQuery(searchParams: URLSearchParams) {
  const raw = querySchema.safeParse({
    limit: searchParams.get("limit") ?? undefined,
    offset: searchParams.get("offset") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    sources: searchParams.get("sources") ?? undefined,
  });
  if (!raw.success) {
    return null;
  }

  const requested = (raw.data.sources ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(isSearchSourceKey);
  const sources: SearchSourceKey[] =
    requested.length > 0 ? [...new Set(requested)] : [];

  return {
    limit: raw.data.limit,
    offset: raw.data.offset,
    query: raw.data.q,
    sources,
  };
}

export async function GET(request: Request) {
  const user = await getMaiUser();
  if (!user) {
    return errorResponse("auth_required");
  }

  const { searchParams } = new URL(request.url);
  const parsed = parseQuery(searchParams);
  if (!parsed) {
    return errorResponse("invalid_request", {
      message: `Saisissez au moins ${MIN_QUERY_LENGTH} caractères pour lancer une recherche.`,
    });
  }

  try {
    const result = await searchIndex({
      limit: parsed.limit,
      offset: parsed.offset,
      query: parsed.query,
      sources: parsed.sources,
      user: {
        email: user.email,
        id: user.id,
        tier: user.tier,
        username: user.username,
      },
    });

    return Response.json(result, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    logError("Erreur de l'index de recherche", error);
    return errorResponse("internal_error", {
      message:
        "La recherche est momentanément indisponible. Réessayez dans un instant.",
    });
  }
}
