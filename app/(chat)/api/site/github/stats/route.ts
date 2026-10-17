import { type NextRequest, NextResponse } from "next/server";
import {
  type GithubStats,
  type GithubWidget,
  normaliserStats,
  REPO_PUBLIC,
} from "@/lib/site/github-data";
import { EN_TETES_CACHE_RESPONSE, lireGithub } from "@/lib/site/github-fetch";

/**
 * GET /api/site/github/stats?repo={organisation}/{nom}
 *
 * Deux lectures amont pour un seul affichage : les étoiles ET la dernière
 * version. Le composant qui les appelait séparément depuis le navigateur
 * affichait « 0 Stars » après un échec — le zéro était sa valeur d'initialisation,
 * pas une mesure. Ici l'échec rend `data: null`, et le composant ne rend plus rien.
 */
export async function GET(req: NextRequest) {
  const repo = req.nextUrl.searchParams.get("repo") ?? "";
  if (!REPO_PUBLIC.test(repo)) {
    return NextResponse.json<GithubWidget<GithubStats>>(
      {
        data: null,
        error: "Dépôt invalide : attendu « organisation/nom ».",
        source: "indisponible",
        stale: false,
        updatedAt: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

  const base = `https://api.github.com/repos/${repo}`;
  const widget = await lireGithub<GithubStats>(
    `stats:${repo}`,
    [base, `${base}/releases/latest`],
    ([brutDepot, brutVersion]) => normaliserStats(brutDepot, brutVersion)
  );

  return NextResponse.json(widget, { headers: EN_TETES_CACHE_RESPONSE });
}
