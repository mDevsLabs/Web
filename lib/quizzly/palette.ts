/**
 * Couleurs de Quizzly.
 *
 * Elles portent une information (ligue, matière, classe) et sont recopiées
 * dans `app/globals.css` sous `.quizzly-root`. Le test unitaire vérifie
 * que les deux restent alignées. Le reste de mAI reste achromatique.
 */

import type { LeagueId } from "@/lib/quizzly/leagues";
import type { SchoolYear } from "@/lib/quizzly/program";

export const LEAGUE_COLOR: Record<LeagueId, string> = {
  bronze: "oklch(0.62 0.12 55)",
  champion: "oklch(0.62 0.2 320)",
  diamond: "oklch(0.72 0.14 230)",
  gold: "oklch(0.82 0.14 90)",
  platinum: "oklch(0.74 0.06 200)",
  silver: "oklch(0.78 0.02 250)",
};

export const YEAR_COLOR: Record<SchoolYear, string> = {
  "1ere": "oklch(0.6 0.15 25)",
  "2nde": "oklch(0.58 0.14 290)",
  "3e": "oklch(0.56 0.15 250)",
  "4e": "oklch(0.58 0.14 210)",
  "5e": "oklch(0.6 0.13 175)",
  "6e": "oklch(0.62 0.12 145)",
  terminale: "oklch(0.58 0.16 55)",
};

export type FamilleMatiere =
  | "arts"
  | "humain"
  | "info"
  | "langues"
  | "lettres"
  | "maths"
  | "sciences";

const FAMILLES: Record<string, FamilleMatiere> = {
  allemand: "langues",
  anglais: "langues",
  arabe: "langues",
  arts: "arts",
  chinois: "langues",
  coreen: "langues",
  "enseignement-scientifique": "sciences",
  espagnol: "langues",
  francais: "lettres",
  grec: "langues",
  hebreu: "langues",
  hggsp: "humain",
  "histoire-geographie": "humain",
  hlp: "lettres",
  italien: "langues",
  japonais: "langues",
  latin: "langues",
  mathematiques: "maths",
  nsi: "info",
  philosophie: "lettres",
  "physique-chimie": "sciences",
  portugais: "langues",
  russe: "langues",
  "sciences-et-technologie": "sciences",
  ses: "humain",
  snt: "sciences",
  svt: "sciences",
  technologie: "sciences",
  turc: "langues",
};

export const SUBJECT_COLOR: Record<string, string> = {
  allemand: "oklch(0.58 0.14 250)",
  anglais: "oklch(0.62 0.14 255)",
  arabe: "oklch(0.56 0.13 265)",
  arts: "oklch(0.62 0.16 330)",
  chinois: "oklch(0.6 0.12 240)",
  coreen: "oklch(0.54 0.14 270)",
  "enseignement-scientifique": "oklch(0.6 0.12 175)",
  espagnol: "oklch(0.64 0.15 35)",
  francais: "oklch(0.58 0.16 25)",
  grec: "oklch(0.57 0.12 280)",
  hebreu: "oklch(0.55 0.13 300)",
  hggsp: "oklch(0.58 0.12 70)",
  "histoire-geographie": "oklch(0.62 0.13 75)",
  hlp: "oklch(0.56 0.14 10)",
  italien: "oklch(0.6 0.15 145)",
  japonais: "oklch(0.57 0.13 220)",
  latin: "oklch(0.55 0.1 80)",
  mathematiques: "oklch(0.58 0.16 145)",
  nsi: "oklch(0.55 0.14 290)",
  philosophie: "oklch(0.52 0.12 350)",
  "physique-chimie": "oklch(0.58 0.14 190)",
  portugais: "oklch(0.6 0.14 130)",
  russe: "oklch(0.56 0.12 210)",
  "sciences-et-technologie": "oklch(0.62 0.11 165)",
  ses: "oklch(0.6 0.11 85)",
  snt: "oklch(0.57 0.13 200)",
  svt: "oklch(0.56 0.15 155)",
  technologie: "oklch(0.54 0.12 185)",
  turc: "oklch(0.61 0.14 45)",
};

export function familleMatiere(id: string): FamilleMatiere {
  return FAMILLES[id] ?? "lettres";
}

export function couleurMatiere(id: string): string {
  return SUBJECT_COLOR[id] ?? "oklch(0.58 0.16 25)";
}

export function jetonCss(prefixe: string, id: string): string {
  return `--q-${prefixe}-${id}`;
}
