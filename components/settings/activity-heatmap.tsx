"use client";

import { useMemo, useState } from "react";
import { PillSwitcher } from "@/components/ui/pill-switcher";
import { formatCompactFr } from "@/lib/account/format";
import { formatBucketLabel, weekStartOf } from "@/lib/stats/heatmap";
import {
  HEATMAP_MONTHS,
  type StatsDailyActivity,
} from "@/lib/stats/stats-types";

// Carte de chaleur d'activité, façon « grille de contributions ».
//
// ── Choix de la métrique de couleur ────────────────────────────────────────
// La case est colorée par les TOKENS DU JOUR (texte + audio), pas par le
// nombre de conversations. Raison : les conversations创建的 une fois par
// échange changent trop peu d'un jour à l'autre — presque toutes les cases
// seraient identiques — alors que la consommation varie de plusieurs ordres de
// grandeur et rend la lecture utile. Le nombre de conversations reste visible
// dans l'infobulle.
//
// L'échelle est calculée sur le MAXIMUM observé, et non sur une échelle fixe :
// un compte à 10 k tokens par jour et un compte à 5 M doivent tous deux montrer
// un dégradé lisible. Les gradients sont interpolés entre quatre paliers —
// comme une échelle de commits — et non par un dégradé continu, parce qu'un
// dégradé continu ferait lire « un jour à 30 % du max » comme « une petite
// journée » alors qu'il peut s'agir d'un jour军阀ement chargé.
//
// ── Repère d'activité Agent ────────────────────────────────────────────────
// Les jours où l'Agent a tourné portent un point d'angle. C'est la seule
// information « quel mode » lisible d'un coup d'œil, et elle répond à la
// question que la grille seule ne peut pas poser : ces deux usages sont de
// nature très différente, et les fusionner en « activité » ferait perdre cette
// distinction.

type Mode = "cumulative" | "daily" | "weekly";

const MODES: { id: Mode; label: string }[] = [
  { id: "daily", label: "Quotidien" },
  { id: "weekly", label: "Hebdomadaire" },
  { id: "cumulative", label: "Cumulé" },
];

/** Cinq paliers : vide, faible, moyen, élevé, maximal. */
const LEVELS = 5;

const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

const MONTH_SHORT = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

type Props = {
  daily: StatsDailyActivity[];
  /** Premier jour couvert, `AAAA-MM-JJ`. */
  from: string;
};

type Cell = {
  activity: number;
  agentRuns: number;
  conversations: number;
  day: string;
  date: Date;
  /** Rang du jour dans la semaine, 0 = lundi. */
  weekday: number;
};

/** `title` d'une case : la seule information affichée au survol de la souris. */
function cellTitle(cell: Cell, value: number): string {
  const parts = [
    formatBucketLabel(cell.day, true),
    value > 0 ? `${formatCompactFr(value)} tokens` : "aucune activité",
  ];
  if (cell.conversations > 0) {
    parts.push(
      `${cell.conversations} conversation${cell.conversations > 1 ? "s" : ""}`
    );
  }
  if (cell.agentRuns > 0) {
    parts.push(`${cell.agentRuns} run${cell.agentRuns > 1 ? "s" : ""} Agent`);
  }
  return parts.join(" · ");
}

export function ActivityHeatmap({ daily, from }: Props) {
  const [mode, setMode] = useState<Mode>("daily");
  // Une seule date par rendu : appeler `new Date()` dans la boucle créerait 364
  // objets `Date`, pour une comparaison qui n'a pas besoin d'être si fine.
  const nowToday = new Date();

  const { activeDays, longest, cellsShown, weeks, max, monthTicks, hasData } =
    useMemo(() => {
      const byDay = new Map(daily.map((entry) => [entry.day, entry]));

      // La grille commence un LUNDI (convention ISO, comme `date_trunc('week')`)
      // pour que les colonnes soient des semaines complètes et les lignes des
      // jours de la semaine constants.
      const firstMonday = weekStartOf(new Date(`${from}T00:00:00Z`));
      // La grille s'arrête au DIMANCHE de la dernière semaine COMPLÈTE. La
      // semaine en cours n'est pas comparable aux autres colonnes, et la montrer
      // tronquée laisserait des cases vides en dessous — que l'œil lirait comme
      // une chute d'activité qui n'a pas eu lieu.
      const last = new Date(`${daily.at(-1)?.day ?? from}T00:00:00Z`);
      const daysFromStart = Math.max(
        0,
        Math.floor((last.getTime() - firstMonday.getTime()) / 86_400_000)
      );
      // La semaine `w` occupe les jours [7w, 7w+6] ; elle est complète si son
      // dimanche (7w+6) est déjà atteint, donc w <= (daysFromStart - 6) / 7.
      const lastCompleteWeek = Math.floor((daysFromStart - 6) / 7);
      const totalDays = lastCompleteWeek * 7 + 7;
      const list: Cell[] = [];
      for (let index = 0; index < totalDays; index++) {
        const date = new Date(firstMonday.getTime() + index * 86_400_000);
        const key = date.toISOString().slice(0, 10);
        const entry = byDay.get(key);
        // Une case sans ligne reste à zéro : la grille ne doit jamais avoir de
        // trou, sinon l'œil lirait un trou comme une absence de données.
        list.push({
          activity: entry?.tokens ?? 0,
          agentRuns: entry?.agentRuns ?? 0,
          conversations: entry?.conversations ?? 0,
          date,
          day: key,
          weekday: (date.getUTCDay() + 6) % 7,
        });
      }

      // `totalDays` est déjà un multiple de 7 : toutes les colonnes sont des
      // semaines complètes, de lundi à dimanche.
      const columns: Cell[][] = [];
      for (let index = 0; index < totalDays; index += 7) {
        columns.push(list.slice(index, index + 7));
      }

      // Pic de la période, commun aux trois modes : changer de mode ne doit pas
      // changer la définition d'un « jour chargé », sinon les deux vues ne sont
      // pas comparables.
      const peak = list.reduce(
        (highest, cell) => Math.max(highest, cell.activity),
        0
      );

      // Étiquettes de mois : on pose le libellé au premier jour du mois visible,
      // et on l'omet s'il tomberait dans les trois dernières colonnes, où il
      // serait illisible.
      const ticks: { column: number; label: string }[] = [];
      let lastMonth = -1;
      columns.forEach((column, columnIndex) => {
        const firstOfColumn = column[0]?.date;
        if (!firstOfColumn) {
          return;
        }
        const month = firstOfColumn.getUTCMonth();
        if (month === lastMonth) {
          return;
        }
        // Une étiquette ne doit pas chevaucher celle du mois précédent.
        const previous = ticks.at(-1);
        if (previous && columnIndex - previous.column < 3) {
          return;
        }
        lastMonth = month;
        ticks.push({
          column: columnIndex,
          label: MONTH_SHORT[month] ?? "",
        });
      });

      return {
        activeDays: list.filter((cell) => cell.activity > 0).length,
        cellsShown: list.length,
        hasData: peak > 0,
        // Plus longue série de jours non vides, recalculée ici parce que la
        // légende doit pouvoir être lue sans les KPI.
        longest: list.reduce((best, cell, index) => {
          const run =
            cell.activity > 0
              ? (index > 0 && list[index - 1]?.activity ? 1 : 0) + 1
              : 0;
          return Math.max(best, run);
        }, 0),
        max: peak,
        monthTicks: ticks,
        weeks: columns,
      };
    }, [daily, from]);

  if (weeks.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Pas encore d&apos;historique d&apos;activité.
      </p>
    );
  }

  const weekCounts = weeks.map((column) =>
    mode === "cumulative"
      ? column.reduce((sum, cell) => sum + cell.activity, 0)
      : column.reduce((highest, cell) => Math.max(highest, cell.activity), 0)
  );
  const scale = Math.max(...weekCounts, max, 1);

  const levelOf = (value: number): number => {
    if (value <= 0) {
      return 0;
    }
    // `LEVELS - 1` paliers au-dessus du vide, réparties logarithmiquement :
    // l'usage est très long-tailed, une échelle linéaire aplatirait tout.
    const ratio = Math.log1p(value) / Math.log1p(scale);
    return Math.min(LEVELS - 1, Math.max(1, Math.ceil(ratio * (LEVELS - 1))));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">
          Activité des jetons
        </h2>
        <PillSwitcher
          activeId={mode}
          ariaLabel="Granularité de l'activité"
          items={MODES}
          layoutId="stats-heatmap-mode"
          onSelect={setMode}
          size="sm"
        />
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="flex w-max gap-1">
          {/* Colonne des jours de la semaine : seulement les repères
              intermédiaires, sinon les 7 lettres encombrent la grille. */}
          <div
            aria-hidden
            className="grid shrink-0 grid-rows-7 gap-1 pt-6 pr-1 text-[9px] text-muted-foreground"
          >
            {DAY_LABELS.map((label, index) => (
              <span
                className="flex h-3 items-center leading-none"
                key={`${label}-${index}`}
              >
                {index % 2 === 1 ? label : ""}
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-1">
            {/* Ligne des mois */}
            <div
              aria-hidden
              className="grid h-4 gap-1 text-[9px] text-muted-foreground"
              style={{
                gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 0.8rem))`,
              }}
            >
              {weeks.map((_, index) => {
                const tick = monthTicks.find((entry) => entry.column === index);
                return (
                  <span className="whitespace-nowrap" key={`m-${index}`}>
                    {tick?.label ?? ""}
                  </span>
                );
              })}
            </div>

            {/*
              Un vrai `<table>` plutôt qu'une `div` en `role="grid"`.

              Raison 1 — accessibilité : `role="grid"` impose `row` puis
              `gridcell`, et des `gridcell` sans ligne englobante forment une
              structure invalide. Le tableau natif porte la sémantique sans
              attributs de rôle, et un lecteur d'écran sait le parcourir.

              Raison 2 — performance : la version précédente montait UN
              `Tooltip` Radix par case. Chaque déclencheur Radix installe son
              portail et ses écouteurs : 364 d'entre eux, sur une page qui en
              compte déjà ailleurs. Le `title` natif donne le même survol à la
              souris pour zéro composant.

              Raison 3 — navigation clavier : 364 cases focusables feraient de
              la grille un mur de tabulations. Le tableau se parcourt au
              clavier par les flèches du mode tableau, et la légende textuelle
              ci-dessous porte l'essentiel pour qui ne voit pas la grille.
            */}
            <table
              className="border-separate border-spacing-0.5"
              summary={`Activité quotidienne des ${HEATMAP_MONTHS} derniers mois`}
            >
              <caption className="sr-only">
                {activeDays} jour{activeDays > 1 ? "s" : ""} actif
                {activeDays > 1 ? "s" : ""} sur {cellsShown} jours affichés.
                Plus longue série : {longest} jours. Pic :{" "}
                {formatCompactFr(max)} tokens.
              </caption>
              <tbody>
                {Array.from({ length: 7 }, (_, weekday) => (
                  <tr key={`row-${weekday}`}>
                    <th
                      className="h-3 pr-1 text-right text-[9px] font-normal text-muted-foreground"
                      scope="row"
                    >
                      {weekday % 2 === 1 ? DAY_LABELS[weekday] : ""}
                    </th>
                    {weeks.map((column, columnIndex) => {
                      const cell = column[weekday];
                      if (!cell) {
                        return <td key={`empty-${columnIndex}`} />;
                      }
                      const value =
                        mode === "cumulative"
                          ? column.reduce((sum, item) => sum + item.activity, 0)
                          : cell.activity;
                      const level = levelOf(value);
                      const isFuture = cell.date > nowToday;
                      return (
                        <td className="p-0" key={cell.day}>
                          <span
                            className="heat-cell block size-3 rounded-[3px]"
                            data-agent={
                              cell.agentRuns > 0 && !isFuture
                                ? "true"
                                : undefined
                            }
                            data-empty={
                              !hasData || isFuture ? "true" : undefined
                            }
                            data-level={level}
                            data-mode={mode}
                            title={cellTitle(cell, value)}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] text-muted-foreground">
          Couleur = tokens du jour (texte + audio). Un point d&apos;angle
          signale un jour où l&apos;Agent a tourné. Les colonnes sont des
          semaines calendaires, du lundi au dimanche.
        </p>
        {/* Échelle de lecture. Le `chip` est volontairement ÉVITÉ ici : c'est
            une pastille de FILTRAGE interactive, alors que cette échelle est
            passive. On utilise des carrés, comme la grille. */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">Moins</span>
          {Array.from({ length: LEVELS }, (_, level) => (
            <span
              aria-hidden
              className="heat-cell size-3 rounded-[3px]"
              data-level={level}
              data-mode={mode}
              key={level}
            />
          ))}
          <span className="text-[10px] text-muted-foreground">Plus</span>
        </div>
      </div>
    </div>
  );
}
