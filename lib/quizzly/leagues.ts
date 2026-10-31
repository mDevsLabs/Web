/**
 * Classement des ligues Quizzly, pur et testable.
 *
 * Une cohorte compte au plus 30 élèves. À la clôture de la semaine ISO,
 * les 5 premiers montent et les 5 derniers descendent. En dessous de 10,
 * personne ne bouge : les deux zones se chevaucheraient.
 */

import { semaineIso } from "@/lib/quizzly/rules";

export const LEAGUES = [
  "bronze",
  "silver",
  "gold",
  "platinum",
  "diamond",
  "champion",
] as const;

export type LeagueId = (typeof LEAGUES)[number];

export const COHORT_SIZE = 30;
export const LEAGUE_MOVE = 5;
export const LEAGUE_MIN_COHORT = 10;

const LIBELLES: Record<LeagueId, string> = {
  bronze: "Bronze",
  champion: "Champion",
  diamond: "Diamant",
  gold: "Or",
  platinum: "Platine",
  silver: "Argent",
};

export function estLigue(valeur: string): valeur is LeagueId {
  return (LEAGUES as readonly string[]).includes(valeur);
}

export function ligueOuBronze(valeur: string): LeagueId {
  return estLigue(valeur) ? valeur : "bronze";
}

export function libelleLigue(ligue: LeagueId): string {
  return LIBELLES[ligue];
}

export function ligueSuivante(ligue: LeagueId): LeagueId {
  const index = LEAGUES.indexOf(ligue);
  return LEAGUES[Math.min(LEAGUES.length - 1, index + 1)] ?? ligue;
}

export function liguePrecedente(ligue: LeagueId): LeagueId {
  const index = LEAGUES.indexOf(ligue);
  return LEAGUES[Math.max(0, index - 1)] ?? ligue;
}

export type MembreCohorte = {
  league: LeagueId;
  shield: boolean;
  totalXp: number;
  userId: string;
  weeklyXp: number;
};

export type IssueLigue = {
  league: LeagueId;
  userId: string;
};

export function comparerMembres(a: MembreCohorte, b: MembreCohorte): number {
  if (b.weeklyXp !== a.weeklyXp) {
    return b.weeklyXp - a.weeklyXp;
  }
  if (b.totalXp !== a.totalXp) {
    return b.totalXp - a.totalXp;
  }
  if (a.userId < b.userId) {
    return -1;
  }
  if (a.userId > b.userId) {
    return 1;
  }
  return 0;
}

function resoudreGroupe(membres: readonly MembreCohorte[]): IssueLigue[] {
  const ligue = membres[0]?.league;
  if (!ligue) {
    return [];
  }
  const tries = [...membres].sort(comparerMembres);
  if (tries.length < LEAGUE_MIN_COHORT) {
    return tries.map((membre) => ({ league: ligue, userId: membre.userId }));
  }
  const promu = new Set<string>();
  if (ligue !== "champion") {
    for (const membre of tries.slice(0, LEAGUE_MOVE)) {
      promu.add(membre.userId);
    }
  }
  const relegue = new Set<string>();
  if (ligue !== "bronze") {
    for (
      let index = tries.length - 1;
      index >= 0 && relegue.size < LEAGUE_MOVE;
      index -= 1
    ) {
      const membre = tries[index];
      if (!membre || promu.has(membre.userId) || membre.shield) {
        continue;
      }
      relegue.add(membre.userId);
    }
  }
  const haut = ligueSuivante(ligue);
  const bas = liguePrecedente(ligue);
  return tries.map((membre) => ({
    league: promu.has(membre.userId)
      ? haut
      : relegue.has(membre.userId)
        ? bas
        : ligue,
    userId: membre.userId,
  }));
}

/** Les cohortes sont homogènes. Un mélange est tranché ligue par ligue. */
export function resoudreCohorte(
  membres: readonly MembreCohorte[]
): IssueLigue[] {
  const parLigue = new Map<LeagueId, MembreCohorte[]>();
  for (const membre of membres) {
    const liste = parLigue.get(membre.league) ?? [];
    liste.push(membre);
    parLigue.set(membre.league, liste);
  }
  return [...parLigue.values()].flatMap((groupe) => resoudreGroupe(groupe));
}

export function decouperCohortes<T>(
  elements: readonly T[],
  taille: number
): T[][] {
  if (taille < 1) {
    return [];
  }
  const groupes: T[][] = [];
  for (let index = 0; index < elements.length; index += taille) {
    groupes.push(elements.slice(index, index + taille));
  }
  return groupes;
}

const CLE_SEMAINE = /^(\d{4})-W(\d{2})$/;

/** Lundi UTC de la semaine ISO `AAAA-Wss`. */
export function lundiDeSemaine(cle: string): Date {
  const trouve = CLE_SEMAINE.exec(cle);
  if (!trouve) {
    throw new Error("Semaine invalide.");
  }
  const annee = Number(trouve[1]);
  const semaine = Number(trouve[2]);
  const janvier = new Date(Date.UTC(annee, 0, 4));
  const jour = janvier.getUTCDay() || 7;
  const lundi = new Date(janvier);
  lundi.setUTCDate(janvier.getUTCDate() - jour + 1 + (semaine - 1) * 7);
  return lundi;
}

export function semaineSuivante(cle: string): string {
  const lundi = lundiDeSemaine(cle);
  lundi.setUTCDate(lundi.getUTCDate() + 7);
  return semaineIso(lundi.toISOString().slice(0, 10));
}

export function semaineAvant(cle: string, autre: string): boolean {
  return cle < autre;
}
