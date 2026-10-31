/**
 * Médailles de ligue et jetons de classe.
 * La couleur vient des variables de `.quizzly-root`.
 */

import type { LeagueId } from "@/lib/quizzly/leagues";
import { libelleLigue } from "@/lib/quizzly/leagues";
import { libelleAnnee, type SchoolYear } from "@/lib/quizzly/program";

const LETTRE: Record<LeagueId, string> = {
  bronze: "B",
  champion: "C",
  diamond: "D",
  gold: "O",
  platinum: "P",
  silver: "A",
};

export function IconeLigue({
  className,
  league,
}: {
  className?: string;
  league: LeagueId;
}) {
  return (
    <svg
      aria-hidden
      className={className ?? "size-5"}
      style={{ color: `var(--q-league-${league})` }}
      viewBox="0 0 32 32"
    >
      <path
        d="M16 2 28 7v9c0 7.2-4.6 12-12 14C8.6 28 4 23.2 4 16V7z"
        fill="currentColor"
      />
      <text
        fill="white"
        fontSize="11"
        fontWeight="700"
        textAnchor="middle"
        x="16"
        y="19"
      >
        {LETTRE[league]}
      </text>
    </svg>
  );
}

export function IconeClasse({
  className,
  year,
}: {
  className?: string;
  year: SchoolYear | string;
}) {
  const libelle = (
    year === "6e" ||
    year === "5e" ||
    year === "4e" ||
    year === "3e" ||
    year === "2nde" ||
    year === "1ere" ||
    year === "terminale"
      ? libelleAnnee(year)
      : year
  ).slice(0, 3);
  return (
    <span
      aria-hidden
      className={
        className ??
        "inline-flex size-8 items-center justify-center rounded-full text-[10px] font-bold"
      }
      style={{
        background: `color-mix(in oklch, var(--q-year-${year}) 22%, transparent)`,
        color: `var(--q-year-${year})`,
      }}
    >
      {libelle}
    </span>
  );
}

export function nomLigue(league: LeagueId): string {
  return libelleLigue(league);
}
