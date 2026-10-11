import { type NextRequest, NextResponse } from "next/server";
import {
  type GithubActivityItem,
  type GithubWidget,
  normaliserCommits,
  normaliserEvenements,
  REPO_PUBLIC,
} from "@/lib/site/github-data";
import { EN_TETES_CACHE_RESPONSE, lireGithub } from "@/lib/site/github-fetch";

/**
 * GET /api/site/github/activity[?repo={organisation}/{nom}]
 *
 * Sans dépôt, la page demande l'activité de l'organisation (PushEvents publics) ;
 * avec un dépôt, ses cinq derniers commits. Les deux formes étaient construites
 * par le composant, qui avalait ensuite une réponse `any` — la normalisation est
 * désormais typée et serveur, et une réponse inattendue devient une liste vide
 * explicitement « indisponible », plus une page muette.
 */
const ORGANISATION = "mDevsLabs";

export async function GET(req: NextRequest) {
  const repo = req.nextUrl.searchParams.get("repo");

  if (repo !== null && !REPO_PUBLIC.test(repo)) {
    return NextResponse.json<GithubWidget<GithubActivityItem[]>>(
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

  const widget = repo
    ? await lireGithub<GithubActivityItem[]>(
        `activity:repo:${repo}`,
        [`https://api.github.com/repos/${repo}/commits?per_page=5`],
        ([brut]) => normaliserCommits(brut)
      )
    : await lireGithub<GithubActivityItem[]>(
        `activity:org:${ORGANISATION}`,
        [
          `https://api.github.com/users/${ORGANISATION}/events/public?per_page=10`,
        ],
        ([brut]) => normaliserEvenements(brut)
      );

  // Une liste vide n'est pas un échec : GitHub a répondu, il n'y a rien à montrer.
  // Le composant garde donc son message « aucune activité récente », qui est une
  // information, et le distingue de « indisponible » par `source`.
  return NextResponse.json(widget, { headers: EN_TETES_CACHE_RESPONSE });
}
