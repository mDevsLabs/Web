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

/**
 * Échelle pédagogique des ligues, du bas vers le haut : reprise de `LEAGUES`
 * avec le libellé, pour les écrans qui montrent la progression complète.
 */
export const ECHELLE_LIGUES: readonly { id: LeagueId; libelle: string }[] =
  LEAGUES.map((id) => ({ id, libelle: libelleLigue(id) }));

export type SeuilsLigue = {
  /** Rang (1-based) du lecteur dans sa cohorte, ou `null` s'il n'y siège pas. */
  rang: number | null;
  /** Nombre de sièges de la cohorte. */
  taille: number;
  /** XP hebdomadaire du lecteur. */
  xpMoi: number;
  /** XP du dernier promu (rang `LEAGUE_MOVE`) : le seuil de montée. */
  seuilMontee: number | null;
  /** XP du premier relégué par le bas : le seuil de relégation. */
  seuilRellegation: number | null;
  /** XP qui séparent le lecteur de la zone de montée (0 s'il y est). */
  ecartMontee: number;
  /** XP d'avance sur la zone de relégation (0 s'il y est). */
  margeRellegation: number;
  dansZoneMontee: boolean;
  dansZoneRelagation: boolean;
};

/**
 * Seuils de position d'un élève dans sa cohorte, lus sur le classement déjà
 * trié par `comparerMembres`. Les zones correspondent à celles de
 * `resoudreGroupe` : les `LEAGUE_MOVE` premiers montent, les `LEAGUE_MOVE`
 * derniers descendent. Cohortes de moins de `LEAGUE_MIN_COHORT` : personne ne
 * bouge, les seuils sont donc absents.
 */
export function seuilsLigue(
  membres: readonly MembreCohorte[],
  userId: string
): SeuilsLigue {
  const tries = [...membres].sort(comparerMembres);
  const index = tries.findIndex((membre) => membre.userId === userId);
  if (index === -1) {
    return {
      dansZoneMontee: false,
      dansZoneRelagation: false,
      ecartMontee: 0,
      margeRellegation: 0,
      rang: null,
      seuilMontee: null,
      seuilRellegation: null,
      taille: tries.length,
      xpMoi: 0,
    };
  }
  const moi = tries[index];
  if (!moi) {
    return {
      dansZoneMontee: false,
      dansZoneRelagation: false,
      ecartMontee: 0,
      margeRellegation: 0,
      rang: null,
      seuilMontee: null,
      seuilRellegation: null,
      taille: tries.length,
      xpMoi: 0,
    };
  }
  const taille = tries.length;
  if (taille < LEAGUE_MIN_COHORT) {
    return {
      dansZoneMontee: false,
      dansZoneRelagation: false,
      ecartMontee: 0,
      margeRellegation: 0,
      rang: index + 1,
      seuilMontee: null,
      seuilRellegation: null,
      taille,
      xpMoi: moi.weeklyXp,
    };
  }
  const denierPromu = tries[LEAGUE_MOVE - 1];
  const premierReligue = tries[taille - LEAGUE_MOVE];
  const seuilMontee = denierPromu ? denierPromu.weeklyXp : null;
  const seuilRellegation = premierReligue ? premierReligue.weeklyXp : null;
  const dansZoneMontee = index < LEAGUE_MOVE;
  const dansZoneRelagation = index >= taille - LEAGUE_MOVE;
  // À XP égal, le départage se fait sur l'XP total : dépasser le seuil suffit.
  return {
    dansZoneMontee,
    dansZoneRelagation,
    ecartMontee:
      seuilMontee === null || dansZoneMontee
        ? 0
        : Math.max(0, seuilMontee - moi.weeklyXp),
    margeRellegation:
      seuilRellegation === null || dansZoneRelagation
        ? 0
        : Math.max(1, moi.weeklyXp - seuilRellegation + 1),
    rang: index + 1,
    seuilMontee,
    seuilRellegation,
    taille,
    xpMoi: moi.weeklyXp,
  };
}

/**
 * Instant de clôture de la semaine `AAAA-Wss` : lundi suivant à minuit,
 * heure de Paris. Renvoyé en ISO pour l'affichage du compte à rebours.
 */
export function clotureLigueParis(cle: string): string {
  const lundiUtc = lundiDeSemaine(semaineSuivante(cle));
  // Décalage Europe/Paris à cet instant (60 ou 120 min), calculé via `Intl`.
  const parties = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).formatToParts(lundiUtc);
  const heure = Number(
    parties.find((p) => p.type === "hour")?.value.replace("24", "0") ?? "0"
  );
  const minute = Number(parties.find((p) => p.type === "minute")?.value ?? "0");
  const decalageMs = (heure * 60 + minute) * 60_000;
  return new Date(lundiUtc.getTime() - decalageMs).toISOString();
}
