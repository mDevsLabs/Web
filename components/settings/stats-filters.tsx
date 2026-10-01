"use client";

import { useId } from "react";
import {
  STATS_KIND_LABELS,
  STATS_KINDS,
  STATS_MODE_LABELS,
  STATS_MODES,
  STATS_PERIOD_LABELS,
  STATS_PERIODS,
  type StatsFilterOptions,
  type StatsKind,
  type StatsMode,
  type StatsPeriod,
  type StatsQuery,
} from "@/lib/stats/stats-types";

// Les cinq filtres de la page. Tous pilotent la même requête : la période et le
// modèle restreignent les DONNÉES, le type de contenu masque des COURBES (les
// données restent calculées), et le mode/projet restreint les conversations
// comme les tokens.
//
// L'état actif des pastilles passe par `data-active` (primitive `chip`), jamais
// par une classe conditionnelle : une seule source de vérité pour le style.
//
// ── Densité ─────────────────────────────────────────────────────────────────
// Les cinq filtres sont un MOYEN d'arriver aux chiffres, pas le contenu de la
// page : sur un écran large, périodes et contenus tiennent sur une ligne, et
// les trois listes sur une autre. Le bloc passe ainsi de quatre lignes de
// hauteur à deux. Aucune information n'est retirée pour cela — les libellés
// longs restent en `title`, et les listes conservent toutes leurs options.

type Props = {
  filterOptions: StatsFilterOptions;
  onChange: (patch: Partial<StatsQuery>) => void;
  query: StatsQuery;
};

/** Étiquette d'une période, raccourcie pour tenir dans une pastille. */
const PERIOD_SHORT: Record<StatsPeriod, string> = {
  "7d": "7 j",
  "12m": "12 mois",
  "30d": "30 j",
  "90d": "90 j",
  all: "Tout",
};

export function StatsFilters({ filterOptions, onChange, query }: Props) {
  const toggleKind = (kind: StatsKind) => {
    const next = query.kinds.includes(kind)
      ? query.kinds.filter((entry) => entry !== kind)
      : [...query.kinds, kind];
    // On refuse le masquage total : sans aucune courbe visible, le graphique
    // n'affiche qu'un cadre vide, ce qui ressemble à une panne.
    if (next.length === 0) {
      return;
    }
    onChange({ kinds: next });
  };

  return (
    <div className="surface-card flex flex-col gap-2.5 p-3 sm:p-4">
      {/*
        Les deux ensembles de pastilles partagent une ligne quand la largeur le
        permet : cinq périodes et trois types de contenu tiennent côte à côte
        sur un écran large, et la barre de filtres n'occupe alors qu'un tiers de
        la hauteur qu'elle prenait en trois blocs empilés. `sm:` porte le
        basculement, pas `md:` — sous 640 px, la ligne entière tiendrait mal
        les libellés « Contenu affiché » et « 12 mois » côte à côte.
      */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-end sm:gap-x-6">
        {/* Période */}
        <fieldset className="flex min-w-0 flex-col gap-1.5">
          <legend className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            Période
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {STATS_PERIODS.map((period) => (
              <button
                className="chip"
                data-active={query.period === period}
                key={period}
                onClick={() => onChange({ period })}
                title={STATS_PERIOD_LABELS[period]}
                type="button"
              >
                {PERIOD_SHORT[period]}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Type de contenu : masque les courbes, ne filtre pas les données. */}
        <fieldset className="flex min-w-0 flex-col gap-1.5">
          <legend className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            Contenu affiché
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {STATS_KINDS.map((kind) => (
              <button
                className="chip"
                data-active={query.kinds.includes(kind)}
                key={kind}
                onClick={() => toggleKind(kind)}
                type="button"
              >
                {STATS_KIND_LABELS[kind]}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      {/* Mode, modèle, projet */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
        <label className="flex min-w-0 flex-col gap-1 text-[10px] font-medium text-muted-foreground">
          Mode
          <select
            className="field-input px-2.5 py-1.5 text-[13px]"
            onChange={(event) =>
              onChange({
                mode: (event.target.value || null) as StatsMode | null,
              })
            }
            value={query.mode ?? ""}
          >
            <option value="">Tous</option>
            {STATS_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {STATS_MODE_LABELS[mode]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-0 flex-col gap-1 text-[10px] font-medium text-muted-foreground">
          Modèle
          <select
            className="field-input px-2.5 py-1.5 text-[13px]"
            onChange={(event) =>
              onChange({ model: event.target.value || null })
            }
            value={query.model ?? ""}
          >
            <option value="">Tous</option>
            {filterOptions.models.map((model) => (
              // `value` reste l'identifiant — c'est lui que la route compare à
              // `UsageEvent.model`. `title` garde l'identifiant lisible au
              // survol pour lever tout doute sur le modèle réellement filtré.
              <option key={model.id} title={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-0 flex-col gap-1 text-[10px] font-medium text-muted-foreground">
          Projet
          <select
            className="field-input px-2.5 py-1.5 text-[13px]"
            disabled={filterOptions.projects.length === 0}
            onChange={(event) =>
              onChange({ projectId: event.target.value || null })
            }
            value={query.projectId ?? ""}
          >
            <option value="">
              {filterOptions.projects.length === 0 ? "Aucun projet" : "Tous"}
            </option>
            {filterOptions.projects.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
