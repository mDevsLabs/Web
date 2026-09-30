"use client";

import {
  formatCompactFr,
  formatDaysFr,
  formatDurationFr,
  formatTokensFr,
} from "@/lib/account/format";
import { formatBucketLabel } from "@/lib/stats/heatmap";
import type { StatsActivity, StatsOverview } from "@/lib/stats/stats-types";

// Bande de cinq indicateurs, séparés par des filets verticaux.
//
// Chaque tuile porte DEUX lignes : la valeur, puis ce qu'elle compte
// exactement. La ligne du bas n'est pas décorative, c'est elle qui empêche la
// mauvaise lecture : « 388,2 M » ne dit pas si c'est le mois ou l'année, et
// « 2 h 33 min » ne dit pas de quoi. Le formatage compact économise la largeur
// mais déplace la charge vers l'explication, alors on l'assume explicitement.

type Props = {
  activity: StatsActivity | null;
  loading?: boolean;
  overview: StatsOverview;
};

function Tile({
  detail,
  label,
  value,
}: {
  detail: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1 px-3 py-4 text-center">
      <span className="truncate text-lg font-semibold text-foreground sm:text-xl">
        {value}
      </span>
      <span className="text-[11px] leading-tight text-muted-foreground">
        {label}
      </span>
      <span className="text-[10px] leading-tight text-muted-foreground/70">
        {detail}
      </span>
    </div>
  );
}

function TileSkeleton() {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2 px-3 py-4">
      <div className="h-6 w-20 animate-pulse rounded bg-muted" />
      <div className="h-3 w-24 animate-pulse rounded bg-muted" />
    </div>
  );
}

export function StatsKpiStrip({ activity, loading, overview }: Props) {
  const tiles: { detail: string; label: string; value: string }[] = [
    {
      detail: "texte, Agent et planification",
      label: "Total des tokens",
      value: formatCompactFr(overview.totalTokens),
    },
    {
      detail: activity?.peakWeekStart
        ? `semaine du ${formatBucketLabel(activity.peakWeekStart, true)}`
        : "sur la période",
      label: "Pic hebdomadaire de tokens",
      value: formatCompactFr(activity?.peakWeekTokens ?? 0),
    },
    {
      // Le chemin Chat n'écrit AUCUNE durée : `lib/chat/stream.ts` ne persiste
      // que des tokens. Présenter cet indicateur sans cette mention ferait
      // croire qu'il couvre toute l'application.
      detail: "tâche Agent la plus longue",
      label: "Durée la plus longue",
      value: formatDurationFr(activity?.longestAgentTaskMs ?? 0),
    },
    {
      detail: "jours consécutifs",
      label: "Série en cours",
      value: formatDaysFr(activity?.streaks.current ?? 0),
    },
    {
      detail: "jamais dépassée",
      label: "Série la plus longue",
      value: formatDaysFr(activity?.streaks.longest ?? 0),
    },
  ];

  return (
    <div className="surface-card flex flex-col overflow-hidden p-0 sm:flex-row">
      {tiles.map((tile, index) => (
        <div
          className={`flex min-w-0 flex-1 ${
            // Filet entre les tuiles : vertical dès qu'elles sont sur une
            // ligne, horizontal quand elles s'empilent. Jamais sur la dernière,
            // où il vaudrait un trait en bord de carte.
            index < tiles.length - 1
              ? "border-b border-border/60 sm:border-r sm:border-b-0"
              : ""
          }`}
          key={tile.label}
        >
          {loading ? <TileSkeleton /> : <Tile {...tile} />}
        </div>
      ))}
    </div>
  );
}

/**
 * Les trois indicateurs historiques demandés au départ, conservés tels quels
 * mais déplacés hors de la bande de cinq : conversations, tokens détaillés et
 * modèle le plus utilisé. Ils répondent à « combien » là où la bande répond à
 * « quelle intensité », et la page a besoin des deux lectures.
 */
export function StatsTotalsRow({ overview }: { overview: StatsOverview }) {
  const topModel = overview.topModel;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="surface-card">
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          Conversations en tout
        </p>
        <p className="mt-2 font-mono text-2xl font-semibold text-foreground">
          {overview.totalConversations.toLocaleString("fr-FR")}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          créées sur la période
        </p>
      </div>
      <div className="surface-card">
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          Images générées
        </p>
        <p className="mt-2 font-mono text-2xl font-semibold text-foreground">
          {overview.totalImages.toLocaleString("fr-FR")}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {overview.totalAudioTokens > 0
            ? `audio : ${formatTokensFr(overview.totalAudioTokens)} tokens`
            : "aucune synthèse vocale"}
        </p>
      </div>
      <div className="surface-card">
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          Modèle le plus utilisé
        </p>
        {/*
          `name` est résolu côté serveur (lib/stats/usage-stats.ts) : c'est le
          catalogue qui décide du libellé, pas une reconstruction de
          l'identifiant. L'identifiant brut reste en `title` et en `font-mono`
          dans la répartition ci-dessous, où l'on veut la valeur exacte.
        */}
        <p
          className="mt-2 truncate text-2xl font-semibold text-foreground"
          title={topModel?.model}
        >
          {topModel ? topModel.name : "—"}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {topModel
            ? `${Math.round(topModel.share * 100)} % des tokens · ${formatCompactFr(topModel.tokens)}`
            : "aucun modèle enregistré"}
        </p>
      </div>
    </div>
  );
}
