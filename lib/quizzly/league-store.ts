/**
 * Sièges de ligue et clôture hebdomadaire.
 *
 * Le verrou `quizzly-league` est pris avant toute écriture de cohorte.
 * La soumission d'un quiz ne le prend pas : elle incrémente un siège
 * déjà posé, pour ne pas s'interbloquer avec une clôture qui met à jour
 * les profils.
 */

import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { dbReady, getDb } from "@/lib/db/queries";
import {
  quizzlyLeagueClosure,
  quizzlyLeagueCohort,
  quizzlyLeagueSeat,
  quizzlyProfile,
} from "@/lib/db/schema";
import {
  COHORT_SIZE,
  comparerMembres,
  decouperCohortes,
  type LeagueId,
  ligueOuBronze,
  type MembreCohorte,
  resoudreCohorte,
  semaineAvant,
  semaineSuivante,
} from "@/lib/quizzly/leagues";
import { jourParis, semaineIso } from "@/lib/quizzly/rules";

const VERROU = "quizzly-league";

export type LigneClasse = {
  league: LeagueId;
  rank: number;
  totalXp: number;
  userId: string;
  weeklyXp: number;
};

export type CohorteLue = {
  league: LeagueId;
  lignes: LigneClasse[];
  weekKey: string;
  weeklyXp: number;
};

export async function cloreLiguesEchues(
  maintenant = new Date()
): Promise<string[]> {
  const courante = semaineIso(jourParis(maintenant));
  const fermees: string[] = [];
  for (let tour = 0; tour < 12; tour += 1) {
    const fermee = await cloreProchaine(courante);
    if (!fermee) {
      break;
    }
    fermees.push(fermee);
  }
  return fermees;
}

async function cloreProchaine(courante: string): Promise<string | null> {
  await dbReady();
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${VERROU}))`);
    const semaines = await tx
      .selectDistinct({ weekKey: quizzlyLeagueSeat.weekKey })
      .from(quizzlyLeagueSeat);
    const fermetures = await tx
      .select({ weekKey: quizzlyLeagueClosure.weekKey })
      .from(quizzlyLeagueClosure);
    const deja = new Set(fermetures.map((ligne) => ligne.weekKey));
    const weekKey = semaines
      .map((ligne) => ligne.weekKey)
      .filter((cle) => semaineAvant(cle, courante) && !deja.has(cle))
      .sort()[0];
    if (!weekKey) {
      return null;
    }
    const sieges = await tx
      .select({
        cohortId: quizzlyLeagueSeat.cohortId,
        league: quizzlyLeagueSeat.league,
        shield: quizzlyProfile.leagueShieldWeek,
        totalXp: quizzlyProfile.xp,
        userId: quizzlyLeagueSeat.userId,
        weeklyXp: quizzlyLeagueSeat.weeklyXp,
      })
      .from(quizzlyLeagueSeat)
      .innerJoin(
        quizzlyProfile,
        eq(quizzlyProfile.userId, quizzlyLeagueSeat.userId)
      )
      .where(eq(quizzlyLeagueSeat.weekKey, weekKey));
    const parCohorte = new Map<string, MembreCohorte[]>();
    for (const siege of sieges) {
      const membre: MembreCohorte = {
        league: ligueOuBronze(siege.league),
        shield: siege.shield === weekKey,
        totalXp: siege.totalXp,
        userId: siege.userId,
        weeklyXp: siege.weeklyXp,
      };
      const liste = parCohorte.get(siege.cohortId) ?? [];
      liste.push(membre);
      parCohorte.set(siege.cohortId, liste);
    }
    const destinations = new Map<string, LeagueId>();
    for (const groupe of parCohorte.values()) {
      for (const issue of resoudreCohorte(groupe)) {
        destinations.set(issue.userId, issue.league);
      }
    }
    const suivante = semaineSuivante(weekKey);
    const parLigue = new Map<LeagueId, string[]>();
    for (const [userId, league] of destinations) {
      const liste = parLigue.get(league) ?? [];
      liste.push(userId);
      parLigue.set(league, liste);
    }
    const maintenant = new Date();
    for (const [league, ids] of parLigue) {
      ids.sort();
      for (const paquet of decouperCohortes(ids, COHORT_SIZE)) {
        const [cohorte] = await tx
          .insert(quizzlyLeagueCohort)
          .values({ league, weekKey: suivante })
          .returning({ id: quizzlyLeagueCohort.id });
        if (!cohorte) {
          continue;
        }
        await tx
          .insert(quizzlyLeagueSeat)
          .values(
            paquet.map((userId) => ({
              cohortId: cohorte.id,
              league,
              userId,
              weekKey: suivante,
              weeklyXp: 0,
            }))
          )
          .onConflictDoUpdate({
            set: {
              cohortId: cohorte.id,
              league,
            },
            target: [quizzlyLeagueSeat.userId, quizzlyLeagueSeat.weekKey],
          });
      }
      for (const userId of ids) {
        await tx
          .update(quizzlyProfile)
          .set({ league, updatedAt: maintenant })
          .where(eq(quizzlyProfile.userId, userId));
      }
    }
    await tx
      .insert(quizzlyLeagueClosure)
      .values({ weekKey })
      .onConflictDoNothing();
    return weekKey;
  });
}

export async function assurerSiege(
  userId: string,
  maintenant = new Date()
): Promise<void> {
  const weekKey = semaineIso(jourParis(maintenant));
  await dbReady();
  await getDb().transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${VERROU}))`);
    const [existant] = await tx
      .select({ userId: quizzlyLeagueSeat.userId })
      .from(quizzlyLeagueSeat)
      .where(
        and(
          eq(quizzlyLeagueSeat.userId, userId),
          eq(quizzlyLeagueSeat.weekKey, weekKey)
        )
      )
      .limit(1);
    if (existant) {
      return;
    }
    const [profil] = await tx
      .select({ league: quizzlyProfile.league })
      .from(quizzlyProfile)
      .where(eq(quizzlyProfile.userId, userId))
      .limit(1);
    if (!profil) {
      return;
    }
    const league = ligueOuBronze(profil.league);
    const cohortes = await tx
      .select({ id: quizzlyLeagueCohort.id })
      .from(quizzlyLeagueCohort)
      .where(
        and(
          eq(quizzlyLeagueCohort.weekKey, weekKey),
          eq(quizzlyLeagueCohort.league, league)
        )
      );
    let cohortId: string | null = null;
    for (const cohorte of cohortes) {
      const [compte] = await tx
        .select({ total: sql<number>`count(*)::int` })
        .from(quizzlyLeagueSeat)
        .where(eq(quizzlyLeagueSeat.cohortId, cohorte.id));
      if (Number(compte?.total ?? 0) < COHORT_SIZE) {
        cohortId = cohorte.id;
        break;
      }
    }
    if (!cohortId) {
      const [cree] = await tx
        .insert(quizzlyLeagueCohort)
        .values({ league, weekKey })
        .returning({ id: quizzlyLeagueCohort.id });
      cohortId = cree?.id ?? null;
    }
    if (!cohortId) {
      return;
    }
    await tx
      .insert(quizzlyLeagueSeat)
      .values({
        cohortId,
        league,
        userId,
        weekKey,
        weeklyXp: 0,
      })
      .onConflictDoNothing();
  });
}

export async function lireCohorte(
  userId: string,
  maintenant = new Date()
): Promise<CohorteLue | null> {
  const weekKey = semaineIso(jourParis(maintenant));
  await dbReady();
  const db = getDb();
  const [siege] = await db
    .select({
      cohortId: quizzlyLeagueSeat.cohortId,
      league: quizzlyLeagueSeat.league,
      weeklyXp: quizzlyLeagueSeat.weeklyXp,
    })
    .from(quizzlyLeagueSeat)
    .where(
      and(
        eq(quizzlyLeagueSeat.userId, userId),
        eq(quizzlyLeagueSeat.weekKey, weekKey)
      )
    )
    .limit(1);
  if (!siege) {
    return null;
  }
  const lignes = await db
    .select({
      totalXp: quizzlyProfile.xp,
      userId: quizzlyLeagueSeat.userId,
      weeklyXp: quizzlyLeagueSeat.weeklyXp,
    })
    .from(quizzlyLeagueSeat)
    .innerJoin(
      quizzlyProfile,
      eq(quizzlyProfile.userId, quizzlyLeagueSeat.userId)
    )
    .where(eq(quizzlyLeagueSeat.cohortId, siege.cohortId));
  const league = ligueOuBronze(siege.league);
  const tries = lignes
    .map(
      (ligne): MembreCohorte => ({
        league,
        shield: false,
        totalXp: ligne.totalXp,
        userId: ligne.userId,
        weeklyXp: ligne.weeklyXp,
      })
    )
    .sort(comparerMembres);
  return {
    league,
    lignes: tries.map((ligne, index) => ({
      league,
      rank: index + 1,
      totalXp: ligne.totalXp,
      userId: ligne.userId,
      weeklyXp: ligne.weeklyXp,
    })),
    weekKey,
    weeklyXp: siege.weeklyXp,
  };
}

export async function xpSemaine(
  userId: string,
  weekKey: string
): Promise<number> {
  await dbReady();
  const [siege] = await getDb()
    .select({ weeklyXp: quizzlyLeagueSeat.weeklyXp })
    .from(quizzlyLeagueSeat)
    .where(
      and(
        eq(quizzlyLeagueSeat.userId, userId),
        eq(quizzlyLeagueSeat.weekKey, weekKey)
      )
    )
    .limit(1);
  return siege?.weeklyXp ?? 0;
}
