"use client";

/**
 * Activité récente : commits d'un dépôt, ou pushes publics de l'organisation.
 *
 * La réponse de GitHub était versée dans un `any[]` et un échec se confondait
 * avec « aucune activité » — deux affirmations opposées, l'une exacte, l'autre
 * produite par une panne de réseau ou, jusqu'ici, par la CSP. Le composant
 * distingue maintenant trois états : chargement, rien à montrer, indisponible.
 */

import {
  GitCommitIcon as GitCommit,
  Loader2Icon as Loader2,
} from "@mdevs/icons";
import { useGithubWidget } from "@/components/site/use-github-widget";
import { SITE_API_ROUTES } from "@/lib/site/api-routes";
import { formatDisplayDate } from "@/lib/site/date-format";
import { estActivite, type GithubActivityItem } from "@/lib/site/github-data";

export function GithubActivity({
  repo,
  title = "Activité Récente",
}: {
  repo?: string;
  title?: string;
}) {
  const { chargement, data, stale } = useGithubWidget<GithubActivityItem[]>(
    SITE_API_ROUTES.githubActivity(repo),
    estActivite
  );

  return (
    <div className="w-full bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900">
        <GitCommit aria-hidden="true" className="w-5 h-5 text-purple-500" />
        {title}
      </h3>
      <div className="flex flex-col gap-3 min-h-[100px]">
        {chargement ? (
          <div className="flex justify-center items-center h-full text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : data === null ? (
          <p className="text-sm text-slate-500 italic">
            Activité momentanément indisponible.
          </p>
        ) : data.length === 0 ? (
          <p className="text-sm text-slate-500 italic">
            Aucune activité récente trouvée.
          </p>
        ) : (
          data.map((item) => (
            <a
              className="group flex flex-col gap-1 text-sm p-3 rounded-2xl hover:bg-white/60 transition-colors"
              href={item.url}
              key={item.id}
              rel="noreferrer"
              target="_blank"
              title={stale ? "Instantané déjà ancien" : undefined}
            >
              <span className="font-medium text-slate-800 group-hover:text-purple-600 transition-colors line-clamp-1">
                {item.message}
              </span>
              <span className="text-xs text-slate-500">
                {formatDisplayDate(item.date, {
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  month: "short",
                })}{" "}
                • par {item.author}
              </span>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
