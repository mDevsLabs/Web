"use client";

/**
 * Pastilles étoiles / dernière version d'un dépôt.
 *
 * Le composant appelait `api.github.com` depuis le navigateur — origine absente de
 * `connect-src`, donc la requête échouait toujours — et rendait ensuite la valeur
 * d'initialisation `stars = 0` comme une mesure : « 0 Stars » sur un dépôt qui en
 * a des centaines est une affirmation fausse, pas une absence.
 *
 * Il lit désormais un proxy interne, et ne rend plus rien du tout quand la donnée
 * n'a pas pu être lue.
 */

import {
  Loader2Icon as Loader2,
  StarIcon as Star,
  TagIcon as Tag,
} from "@mdevs/icons";
import { useGithubWidget } from "@/components/site/use-github-widget";
import { SITE_API_ROUTES } from "@/lib/site/api-routes";
import { estStats, type GithubStats } from "@/lib/site/github-data";

export function GithubRepoStats({ repo }: { repo: string }) {
  const { chargement, data, stale } = useGithubWidget<GithubStats>(
    SITE_API_ROUTES.githubStats(repo),
    estStats
  );

  if (chargement) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Chargement des stats...</span>
      </div>
    );
  }

  // Pas de donnée lue, pas d'affichage : un chiffre manquant se signale par son
  // absence, jamais par un zéro.
  if (!data) return null;

  const titre = stale ? "Instantané déjà ancien" : undefined;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div
        className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-white/50 backdrop-blur-md border border-white/60 px-2.5 py-1 rounded-full shadow-sm"
        title={titre}
      >
        <Star
          aria-hidden="true"
          className="w-3.5 h-3.5 text-amber-500 fill-amber-500"
        />
        <span>{data.stars.toLocaleString()} Stars</span>
      </div>
      {data.release && (
        <div
          className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-white/50 backdrop-blur-md border border-white/60 px-2.5 py-1 rounded-full shadow-sm"
          title={titre}
        >
          <Tag aria-hidden="true" className="w-3.5 h-3.5 text-purple-500" />
          <span>Release: {data.release}</span>
        </div>
      )}
    </div>
  );
}
