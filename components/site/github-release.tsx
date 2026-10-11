"use client";

/**
 * Pastilles de version d'un dépôt (dernière version, et préversion à la demande).
 *
 * Même correction que les statistiques : lecture via le proxy interne, et aucun
 * rendu quand GitHub n'a pas répondu. Une page produit muette sur ses versions
 * vaut mieux qu'une page qui les masque derrière un état d'initialisation.
 */

import { TagIcon as Tag } from "@mdevs/icons";
import { useGithubWidget } from "@/components/site/use-github-widget";
import { SITE_API_ROUTES } from "@/lib/site/api-routes";
import { estVersions, type GithubReleases } from "@/lib/site/github-data";

export function GithubRelease({
  repo,
  showPreRelease = false,
}: {
  repo: string;
  showPreRelease?: boolean;
}) {
  const { chargement, data, stale } = useGithubWidget<GithubReleases>(
    SITE_API_ROUTES.githubReleases(repo, showPreRelease),
    estVersions
  );

  if (chargement) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 animate-pulse">
        <div className="w-4 h-4 bg-slate-300 rounded-full" />
        Chargement des versions...
      </div>
    );
  }

  if (!data || (!data.latest && !data.prerelease)) return null;

  const titre = stale ? "Instantané déjà ancien" : undefined;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {data.latest && (
        <a
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/40 backdrop-blur-md border border-white/60 shadow-sm text-slate-800 text-xs font-bold uppercase tracking-wider hover:bg-white/60 transition-colors"
          href={`https://github.com/${repo}/releases/latest`}
          rel="noreferrer"
          target="_blank"
          title={titre}
        >
          <Tag aria-hidden="true" className="w-3 h-3" />
          Latest: {data.latest}
        </a>
      )}
      {showPreRelease && data.prerelease && (
        <a
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/40 backdrop-blur-md border border-white/60 shadow-sm text-purple-600 text-xs font-bold uppercase tracking-wider hover:bg-white/60 transition-colors"
          href={`https://github.com/${repo}/releases/tag/${data.prerelease}`}
          rel="noreferrer"
          target="_blank"
          title={titre}
        >
          <Tag aria-hidden="true" className="w-3 h-3" />
          Pre-release: {data.prerelease}
        </a>
      )}
    </div>
  );
}
