import { type NextRequest, NextResponse } from "next/server";
import {
  type GithubReleases,
  type GithubWidget,
  normaliserVersions,
  REPO_PUBLIC,
} from "@/lib/site/github-data";
import { EN_TETES_CACHE_RESPONSE, lireGithub } from "@/lib/site/github-fetch";

/**
 * GET /api/site/github/releases?repo={organisation}/{nom}[&pre=true]
 *
 * La liste complète n'est demandée que si une préversion est affichable : le
 * second appel amont a un coût de quota, et la page qui ne montre que la dernière
 * version ne doit pas le payer.
 */
export async function GET(req: NextRequest) {
  const repo = req.nextUrl.searchParams.get("repo") ?? "";
  const avecPreversion = req.nextUrl.searchParams.get("pre") === "true";
  if (!REPO_PUBLIC.test(repo)) {
    return NextResponse.json<GithubWidget<GithubReleases>>(
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
  const widget = await lireGithub<GithubReleases>(
    `releases:${repo}:${avecPreversion ? "pre" : "sans-pre"}`,
    avecPreversion
      ? [`${base}/releases/latest`, `${base}/releases`]
      : [`${base}/releases/latest`],
    ([brutLatest, brutListe]) => normaliserVersions(brutLatest, brutListe)
  );

  return NextResponse.json(widget, { headers: EN_TETES_CACHE_RESPONSE });
}
