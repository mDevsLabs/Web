import { z } from "zod";
import { errorResponse, logError } from "@/lib/api/error-response";
import { getMaiUser } from "@/lib/auth/session";
import {
  DEFAULT_STATS_QUERY,
  isStatsKind,
  isStatsMode,
  isStatsPeriod,
  type StatsQuery,
} from "@/lib/stats/stats-types";
import { getUsageStats } from "@/lib/stats/usage-stats";

// Source unique des statistiques de consommation. La page `/settings/
// statistiques` et l'outil `getUsageStats` passent tous deux par ici : aucune
// autre route ne lit `UsageEvent`, ce qui évite que deux implémentations du même
// graphique divergent.
//
// Le cache est explicitement désactivé (`private, no-store`) : ce sont des
// données personnelles, et la page doit refléter la consommation de l'instant.
// Le cache de 3 minutes de `/api/settings` ne doit surtout pas s'appliquer ici.

const querySchema = z.object({
  kind: z
    .array(z.string())
    .optional()
    .transform((values = []) =>
      values.filter((value): value is string => isStatsKind(value))
    ),
  mode: z.string().optional(),
  model: z.string().trim().min(1).max(200).optional(),
  period: z.string().optional(),
  projectId: z.uuid().optional(),
});

/**
 * Normalise les query params en `StatsQuery`.
 *
 * Les valeurs inconnues retombent sur la valeur par défaut plutôt que de
 * faire échouer la requête : un lien partagé avec un `period` périmé doit
 * afficher la page, pas une erreur. Le mode et le modèle sont validés par
 * listes blanches (`isStatsMode`, et pour le modèle l'existence est vérifiée en
 * base par le filtre lui-même).
 */
function parseQuery(searchParams: URLSearchParams): StatsQuery {
  const raw = querySchema.safeParse({
    kind: searchParams.getAll("kind"),
    mode: searchParams.get("mode") ?? undefined,
    model: searchParams.get("model") ?? undefined,
    period: searchParams.get("period") ?? undefined,
    projectId: searchParams.get("projectId") ?? undefined,
  });
  if (!raw.success) {
    logError("Paramètres de statistiques invalides", raw.error);
    return DEFAULT_STATS_QUERY;
  }

  const period = isStatsPeriod(raw.data.period)
    ? raw.data.period
    : DEFAULT_STATS_QUERY.period;
  const mode = isStatsMode(raw.data.mode) ? raw.data.mode : null;
  const kinds =
    raw.data.kind && raw.data.kind.length > 0
      ? raw.data.kind.filter(isStatsKind)
      : DEFAULT_STATS_QUERY.kinds;

  return {
    kinds,
    mode,
    model: raw.data.model ?? null,
    period,
    projectId: raw.data.projectId ?? null,
  };
}

export async function GET(request: Request) {
  const user = await getMaiUser();
  if (!user) {
    return errorResponse("auth_required");
  }

  const { searchParams } = new URL(request.url);
  const query = parseQuery(searchParams);

  try {
    const stats = await getUsageStats(
      { email: user.email, id: user.id },
      query
    );
    return Response.json(stats, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    logError("Erreur récupération des statistiques", error);
    return errorResponse("internal_error", {
      message:
        "Erreur lors du calcul des statistiques de consommation. Réessayez dans un instant.",
    });
  }
}
