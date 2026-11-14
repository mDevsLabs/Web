/**
 * Progression Quizzly, par compte.
 *
 * Cœurs, gemmes, série et quêtes sont décidés ici, dans une transaction
 * qui verrouille la ligne du profil. Le client envoie des réponses ;
 * il n'envoie ni score, ni récompense.
 */

import "server-only";

import { and, count, desc, eq, isNotNull, sql } from "drizzle-orm";
import type { MaiUser } from "@/lib/auth/session";
import { dbReady, getDb } from "@/lib/db/queries";
import {
  type QuizzlyProfile,
  quizzlyLeagueSeat,
  quizzlyProfile,
  quizzlyQuest,
  quizzlyQuestDraw,
  quizzlyQuizProgress,
  quizzlyReport,
  quizzlyShopItem,
} from "@/lib/db/schema";
import {
  COACH_TENTATIVES_MAX,
  construireTentative,
  scoreRetenu,
} from "@/lib/quizzly/coach";
import { lireNomAffiche } from "@/lib/quizzly/display-name";
import { corrigerQuestion, corrigerQuiz } from "@/lib/quizzly/grade";
import {
  assurerSiege,
  cloreLiguesEchues,
  xpSemaine,
} from "@/lib/quizzly/league-store";
import { type LeagueId, ligueOuBronze } from "@/lib/quizzly/leagues";
import {
  analyserIdentifiantQuiz,
  type CurriculumIndex,
  type LoadedQuiz,
  precedentQuiz,
  suivantQuiz,
} from "@/lib/quizzly/load";
import {
  type ChapterFileName,
  estAnneeScolaire,
  type SchoolYear,
} from "@/lib/quizzly/program";
import {
  catalogueDe,
  type QuetePubliee,
  quetePubliee,
} from "@/lib/quizzly/quetes";
import {
  achatImpossible,
  analyserCleQuete,
  appliquerAchat,
  boosterActif,
  HEARTS_MAX,
  idsDebloques,
  jourParis,
  MESURES_HEBDOMADAIRES,
  MESURES_QUOTIDIENNES,
  mouvementsQuetes,
  niveauDepuisXp,
  normaliserCosmetiques,
  offreDuJourDisponible,
  type PorteeQuete,
  recompensesPremiereValidation,
  recordSerie,
  regeneratedHearts,
  semaineIso,
  serieApresTentative,
  tirerUneParMesure,
  xpAvecBooster,
} from "@/lib/quizzly/rules";
import type { SubmittedAnswer } from "@/lib/quizzly/schema";
import {
  articleBoutique,
  estKindBoutique,
  type QuizzlyGift,
  type ShopItem,
} from "@/lib/quizzly/shop";
import { matiereSuivie, normaliserMatieres } from "@/lib/quizzly/subjects";

export type ResumeQuizzly = {
  avatarUrl: string | null;
  dailyGiftClaimed: boolean;
  displayName: string;
  equippedFrame: string | null;
  gems: number;
  giftsReceived?: QuizzlyGift[];
  hearts: number;
  heartsUpdatedAt: string;
  league: LeagueId;
  leagueShieldWeek: string | null;
  modelId: string | null;
  niveau: number;
  ownedFrames: string[];
  pendingFriends: number;
  schoolYear: SchoolYear;
  streakBest: number;
  streakCount: number;
  streakFreezes: number;
  subjects: string[];
  username: string;
  weekKey: string;
  weeklyXp: number;
  xp: number;
  xpBoostUntil: string | null;
  xpDansPalier: number;
  xpPalier: number;
  yearChosen: boolean;
};

export type ResultatQuiz = {
  correctCount: number;
  gemsAwarded: number;
  hearts: number;
  nextQuizId: string | null;
  passed: boolean;
  results: {
    correct: boolean;
    expectedIndexes: number[];
    explanation: string;
    givenIndexes: number[];
    questionId: string;
  }[];
  streakCount: number;
  streakExtended: boolean;
  streakFreezeUsed: boolean;
  totalCount: number;
  xpAwarded: number;
};

export type QueteVue = {
  claimed: boolean;
  description: string;
  key: string;
  label: string;
  monnaie: "gemmes" | "xp";
  progress: number;
  reward: number;
  scope: "daily" | "weekly";
  target: number;
};

async function assurerProfil(userId: string): Promise<QuizzlyProfile> {
  await dbReady();
  const db = getDb();
  await db.insert(quizzlyProfile).values({ userId }).onConflictDoNothing({
    target: quizzlyProfile.userId,
  });
  const [ligne] = await db
    .select()
    .from(quizzlyProfile)
    .where(eq(quizzlyProfile.userId, userId))
    .limit(1);
  if (!ligne) {
    throw new Error("Profil Quizzly illisible.");
  }
  const regen = regeneratedHearts(
    ligne.hearts,
    ligne.heartsUpdatedAt,
    new Date()
  );
  if (!regen.changed) {
    return ligne;
  }
  const [miseAJour] = await db
    .update(quizzlyProfile)
    .set({
      hearts: regen.hearts,
      heartsUpdatedAt: regen.heartsUpdatedAt,
      updatedAt: new Date(),
    })
    .where(eq(quizzlyProfile.userId, userId))
    .returning();
  return miseAJour ?? ligne;
}

export async function resumeQuizzly(
  userId: string,
  repli: Pick<MaiUser, "avatarUrl" | "username">
): Promise<ResumeQuizzly> {
  await cloreLiguesEchues();
  const [profil, nom] = await Promise.all([
    assurerProfil(userId),
    lireNomAffiche(repli),
  ]);
  await assurerSiege(userId);
  const aujourdhui = jourParis(new Date());
  const semaine = semaineIso(aujourdhui);
  const hebdo = await xpSemaine(userId, semaine);
  const cosmetiques = normaliserCosmetiques(profil.cosmetics);
  const annee = estAnneeScolaire(profil.schoolYear) ? profil.schoolYear : "6e";
  const niveau = niveauDepuisXp(profil.xp);
  return {
    avatarUrl: nom.avatarUrl,
    dailyGiftClaimed: !offreDuJourDisponible(profil.lastDailyGift, aujourdhui),
    displayName: nom.displayName,
    equippedFrame: cosmetiques.equippedFrame,
    gems: profil.gems,
    giftsReceived: cosmetiques.giftsReceived || [],
    hearts: profil.hearts,
    heartsUpdatedAt: profil.heartsUpdatedAt.toISOString(),
    league: ligueOuBronze(profil.league),
    leagueShieldWeek: profil.leagueShieldWeek,
    modelId: profil.modelId,
    niveau: niveau.niveau,
    ownedFrames: cosmetiques.ownedFrames,
    pendingFriends: 0,
    schoolYear: annee,
    streakBest: recordSerie(profil.streakCount, profil.streakBest),
    streakCount: profil.streakCount,
    streakFreezes: profil.streakFreezes,
    subjects: normaliserMatieres(annee, profil.subjects),
    username: nom.username,
    weekKey: semaine,
    weeklyXp: hebdo,
    xp: profil.xp,
    xpBoostUntil: profil.xpBoostUntil?.toISOString() ?? null,
    xpDansPalier: niveau.xpDansPalier,
    xpPalier: niveau.xpPalier,
    yearChosen: profil.yearChosen,
  };
}

export async function progressionPasse(userId: string): Promise<Set<string>> {
  await dbReady();
  const lignes = await getDb()
    .select({
      passed: quizzlyQuizProgress.passed,
      quizId: quizzlyQuizProgress.quizId,
    })
    .from(quizzlyQuizProgress)
    .where(eq(quizzlyQuizProgress.userId, userId));
  return new Set(
    lignes.filter((ligne) => ligne.passed).map((ligne) => ligne.quizId)
  );
}

export async function choisirAnnee(
  userId: string,
  annee: SchoolYear
): Promise<void> {
  await assurerProfil(userId);
  await getDb()
    .update(quizzlyProfile)
    .set({
      schoolYear: annee,
      subjects: [],
      updatedAt: new Date(),
      yearChosen: true,
    })
    .where(eq(quizzlyProfile.userId, userId));
}

export async function enregistrerMatieres(
  userId: string,
  brutes: readonly string[]
): Promise<void> {
  const profil = await assurerProfil(userId);
  const annee = estAnneeScolaire(profil.schoolYear) ? profil.schoolYear : "6e";
  await getDb()
    .update(quizzlyProfile)
    .set({
      subjects: normaliserMatieres(annee, [...brutes]),
      updatedAt: new Date(),
    })
    .where(eq(quizzlyProfile.userId, userId));
}

export async function equiperCadre(
  userId: string,
  cadre: string | null
): Promise<{ message: string; ok: false } | { ok: true }> {
  const profil = await assurerProfil(userId);
  const cosmetiques = normaliserCosmetiques(profil.cosmetics);
  if (cadre && !cosmetiques.ownedFrames.includes(cadre)) {
    return { message: "Ce cadre n'est pas dans votre collection.", ok: false };
  }
  await getDb()
    .update(quizzlyProfile)
    .set({
      cosmetics: { ...cosmetiques, equippedFrame: cadre },
      updatedAt: new Date(),
    })
    .where(eq(quizzlyProfile.userId, userId));
  return { ok: true };
}

export async function enregistrerModeleQuizzly(
  userId: string,
  modelId: string | null
): Promise<void> {
  await assurerProfil(userId);
  await getDb()
    .update(quizzlyProfile)
    .set({ modelId, updatedAt: new Date() })
    .where(eq(quizzlyProfile.userId, userId));
}

export async function chargerCoach(userId: string): Promise<{
  league: LeagueId;
  modelId: string | null;
  niveau: number;
  passedCount: number;
  schoolYear: SchoolYear;
  streakCount: number;
  subjects: string[];
  tentatives: { lastAttempt: unknown; quizId: string }[];
  weeklyXp: number;
  xp: number;
}> {
  const profil = await assurerProfil(userId);
  const db = getDb();
  const [lignes, compte] = await Promise.all([
    db
      .select({
        lastAttempt: quizzlyQuizProgress.lastAttempt,
        quizId: quizzlyQuizProgress.quizId,
      })
      .from(quizzlyQuizProgress)
      .where(
        and(
          eq(quizzlyQuizProgress.userId, userId),
          isNotNull(quizzlyQuizProgress.lastAttempt)
        )
      )
      .orderBy(desc(quizzlyQuizProgress.completedAt))
      .limit(COACH_TENTATIVES_MAX),
    db
      .select({ valeur: count() })
      .from(quizzlyQuizProgress)
      .where(
        and(
          eq(quizzlyQuizProgress.userId, userId),
          eq(quizzlyQuizProgress.passed, true)
        )
      ),
  ]);
  const annee = estAnneeScolaire(profil.schoolYear) ? profil.schoolYear : "6e";
  const ligue = ligueOuBronze(profil.league);
  const palier = niveauDepuisXp(profil.xp);
  const aujourdhui = jourParis(new Date());
  const semaine = semaineIso(aujourdhui);
  const hebdo = await xpSemaine(userId, semaine);

  return {
    league: ligue,
    modelId: profil.modelId,
    niveau: palier.niveau,
    passedCount: Number(compte[0]?.valeur ?? 0),
    schoolYear: annee,
    streakCount: profil.streakCount,
    subjects: Array.isArray(profil.subjects)
      ? (profil.subjects as string[])
      : [],
    tentatives: lignes,
    weeklyXp: hebdo,
    xp: profil.xp,
  };
}

export async function soumettreQuiz(
  userId: string,
  index: CurriculumIndex,
  quiz: LoadedQuiz,
  reponses: SubmittedAnswer[]
): Promise<
  | { code: "locked" | "no_hearts" | "subject"; ok: false }
  | { ok: true; resultat: ResultatQuiz }
> {
  const note = corrigerQuiz(quiz.questions, reponses);
  const maintenant = new Date();
  const aujourdhui = jourParis(maintenant);
  await cloreLiguesEchues(maintenant);
  await assurerProfil(userId);
  await assurerSiege(userId, maintenant);
  const db = getDb();
  return db.transaction(async (tx) => {
    const [profil] = await tx
      .select()
      .from(quizzlyProfile)
      .where(eq(quizzlyProfile.userId, userId))
      .for("update")
      .limit(1);
    if (!profil) {
      throw new Error("Profil Quizzly absent.");
    }
    const precedent = precedentQuiz(index, quiz.id);
    if (precedent) {
      const [dejaPrecedent] = await tx
        .select({ passed: quizzlyQuizProgress.passed })
        .from(quizzlyQuizProgress)
        .where(
          and(
            eq(quizzlyQuizProgress.userId, userId),
            eq(quizzlyQuizProgress.quizId, precedent)
          )
        )
        .limit(1);
      if (!dejaPrecedent?.passed) {
        return { code: "locked", ok: false as const };
      }
    }
    const regen = regeneratedHearts(
      profil.hearts,
      profil.heartsUpdatedAt,
      maintenant
    );
    const anneeProfil = estAnneeScolaire(profil.schoolYear)
      ? profil.schoolYear
      : "6e";
    const analyseQuiz = analyserIdentifiantQuiz(quiz.id);
    if (
      analyseQuiz &&
      analyseQuiz.year === anneeProfil &&
      !matiereSuivie(
        normaliserMatieres(anneeProfil, profil.subjects),
        analyseQuiz.matiereId
      )
    ) {
      return { code: "subject", ok: false as const };
    }
    if (regen.hearts <= 0) {
      return { code: "no_hearts", ok: false as const };
    }
    const [existant] = await tx
      .select()
      .from(quizzlyQuizProgress)
      .where(
        and(
          eq(quizzlyQuizProgress.userId, userId),
          eq(quizzlyQuizProgress.quizId, quiz.id)
        )
      )
      .for("update")
      .limit(1);
    const premiere = note.passed && !existant?.passed;
    const brut = premiere
      ? recompensesPremiereValidation(note.correctCount)
      : { gems: 0, xp: 0 };
    const gain = {
      gems: brut.gems,
      xp: xpAvecBooster(brut.xp, boosterActif(profil.xpBoostUntil, maintenant)),
    };
    const serie = serieApresTentative(
      {
        streakCount: profil.streakCount,
        streakFreezes: profil.streakFreezes,
        streakLastDay: profil.streakLastDay,
      },
      aujourdhui
    );
    const coeurs = regen.hearts;
    await tx
      .update(quizzlyProfile)
      .set({
        gems: profil.gems + gain.gems,
        hearts: coeurs,
        heartsUpdatedAt: regen.heartsUpdatedAt,
        streakBest: recordSerie(serie.streakCount, profil.streakBest),
        streakCount: serie.streakCount,
        streakFreezes: serie.streakFreezes,
        streakLastDay: serie.streakLastDay,
        updatedAt: maintenant,
        xp: profil.xp + gain.xp,
      })
      .where(eq(quizzlyProfile.userId, userId));
    if (gain.xp > 0) {
      await tx
        .update(quizzlyLeagueSeat)
        .set({
          weeklyXp: sql`${quizzlyLeagueSeat.weeklyXp} + ${gain.xp}`,
        })
        .where(
          and(
            eq(quizzlyLeagueSeat.userId, userId),
            eq(quizzlyLeagueSeat.weekKey, semaineIso(aujourdhui))
          )
        );
    }
    const retenu = scoreRetenu(
      existant
        ? { correctCount: existant.correctCount, passed: existant.passed }
        : null,
      { correctCount: note.correctCount, passed: note.passed }
    );
    const tentative = construireTentative(quiz.questions, note, maintenant);
    if (existant) {
      await tx
        .update(quizzlyQuizProgress)
        .set({
          completedAt: maintenant,
          correctCount: retenu.correctCount,
          lastAttempt: tentative,
          passed: retenu.passed,
          totalCount: note.totalCount,
        })
        .where(
          and(
            eq(quizzlyQuizProgress.userId, userId),
            eq(quizzlyQuizProgress.quizId, quiz.id)
          )
        );
    } else {
      await tx.insert(quizzlyQuizProgress).values({
        completedAt: maintenant,
        correctCount: retenu.correctCount,
        lastAttempt: tentative,
        passed: retenu.passed,
        quizId: quiz.id,
        totalCount: note.totalCount,
        userId,
      });
    }
    const actives = await quetesDuMoment(maintenant);
    const mouvements = mouvementsQuetes(
      actives,
      aujourdhui,
      semaineIso(aujourdhui),
      {
        bonnesReponses: note.correctCount,
        firstPass: premiere,
        nouveauJour: profil.streakLastDay !== aujourdhui,
        parfait: note.correctCount === note.totalCount,
        serie: serie.streakCount,
      }
    );
    // optimizer-ignore-n1: mouvements bornés à 3 quêtes actives max
    for (const mouvement of mouvements) {
      const [quete] = await tx
        .select()
        .from(quizzlyQuest)
        .where(
          and(
            eq(quizzlyQuest.userId, userId),
            eq(quizzlyQuest.questKey, mouvement.cle)
          )
        )
        .for("update")
        .limit(1);
      if (!quete) {
        await tx.insert(quizzlyQuest).values({
          progress: mouvement.valeur,
          questKey: mouvement.cle,
          userId,
        });
      } else if (mouvement.mode === "add") {
        await tx
          .update(quizzlyQuest)
          .set({ progress: quete.progress + mouvement.valeur })
          .where(
            and(
              eq(quizzlyQuest.userId, userId),
              eq(quizzlyQuest.questKey, mouvement.cle)
            )
          );
      } else {
        await tx
          .update(quizzlyQuest)
          .set({ progress: Math.max(quete.progress, mouvement.valeur) })
          .where(
            and(
              eq(quizzlyQuest.userId, userId),
              eq(quizzlyQuest.questKey, mouvement.cle)
            )
          );
      }
    }
    return {
      ok: true as const,
      resultat: {
        correctCount: note.correctCount,
        gemsAwarded: gain.gems,
        hearts: coeurs,
        nextQuizId: note.passed ? suivantQuiz(index, quiz.id) : null,
        passed: note.passed,
        results: note.results,
        streakCount: serie.streakCount,
        streakExtended: serie.streakCount > profil.streakCount,
        streakFreezeUsed: serie.streakFreezes < profil.streakFreezes,
        totalCount: note.totalCount,
        xpAwarded: gain.xp,
      },
    };
  });
}

export async function traiterReponseQuestion(params: {
  answers?: readonly {
    questionId: string;
    selectedIndexes: readonly number[];
  }[];
  correct: boolean;
  quiz: LoadedQuiz;
  userId: string;
}): Promise<{ gameOver: boolean; hearts: number }> {
  await dbReady();
  const db = getDb();
  const maintenant = new Date();

  return db.transaction(async (tx) => {
    await tx
      .insert(quizzlyProfile)
      .values({ userId: params.userId })
      .onConflictDoNothing({
        target: quizzlyProfile.userId,
      });
    const [profil] = await tx
      .select()
      .from(quizzlyProfile)
      .where(eq(quizzlyProfile.userId, params.userId))
      .for("update")
      .limit(1);

    if (!profil) {
      throw new Error("Profil Quizzly introuvable.");
    }

    const regen = regeneratedHearts(
      profil.hearts,
      profil.heartsUpdatedAt,
      maintenant
    );

    if (params.correct) {
      if (regen.changed) {
        await tx
          .update(quizzlyProfile)
          .set({
            hearts: regen.hearts,
            heartsUpdatedAt: regen.heartsUpdatedAt,
            updatedAt: maintenant,
          })
          .where(eq(quizzlyProfile.userId, params.userId));
      }
      return {
        gameOver: regen.hearts <= 0,
        hearts: regen.hearts,
      };
    }

    const coeurs = Math.max(0, regen.hearts - 1);
    const gameOver = coeurs <= 0;
    const heartsUpdatedAt =
      regen.hearts >= HEARTS_MAX ? maintenant : regen.heartsUpdatedAt;

    await tx
      .update(quizzlyProfile)
      .set({
        hearts: coeurs,
        heartsUpdatedAt,
        updatedAt: maintenant,
      })
      .where(eq(quizzlyProfile.userId, params.userId));

    if (gameOver) {
      const parId = new Map(params.quiz.questions.map((q) => [q.id, q]));
      const reponses = params.answers ?? [];
      let correctCount = 0;
      const results = reponses.map((rep) => {
        const q = parId.get(rep.questionId);
        const correction = q
          ? corrigerQuestion(q, rep.selectedIndexes)
          : { correct: false, expectedIndexes: [], givenIndexes: [] };
        if (correction.correct) {
          correctCount++;
        }
        return {
          correct: correction.correct,
          expectedIndexes: correction.expectedIndexes,
          givenIndexes: correction.givenIndexes,
          questionId: rep.questionId,
        };
      });

      const tentative = construireTentative(
        params.quiz.questions,
        {
          correctCount,
          passed: false,
          results,
          totalCount: params.quiz.questions.length,
        },
        maintenant
      );

      const [existant] = await tx
        .select()
        .from(quizzlyQuizProgress)
        .where(
          and(
            eq(quizzlyQuizProgress.userId, params.userId),
            eq(quizzlyQuizProgress.quizId, params.quiz.id)
          )
        )
        .for("update")
        .limit(1);

      const retenu = scoreRetenu(
        existant
          ? { correctCount: existant.correctCount, passed: existant.passed }
          : null,
        { correctCount, passed: false }
      );

      if (existant) {
        await tx
          .update(quizzlyQuizProgress)
          .set({
            completedAt: maintenant,
            correctCount: retenu.correctCount,
            lastAttempt: tentative,
            passed: retenu.passed,
            totalCount: params.quiz.questions.length,
          })
          .where(
            and(
              eq(quizzlyQuizProgress.userId, params.userId),
              eq(quizzlyQuizProgress.quizId, params.quiz.id)
            )
          );
      } else {
        await tx.insert(quizzlyQuizProgress).values({
          completedAt: maintenant,
          correctCount: retenu.correctCount,
          lastAttempt: tentative,
          passed: retenu.passed,
          quizId: params.quiz.id,
          totalCount: params.quiz.questions.length,
          userId: params.userId,
        });
      }
    }

    return {
      gameOver,
      hearts: coeurs,
    };
  });
}

function idsFiges(
  valeur: unknown,
  catalogue: readonly QuetePubliee[],
  attendu: number
): string[] | null {
  if (!Array.isArray(valeur) || valeur.length !== attendu) {
    return null;
  }
  const ids: string[] = [];
  const mesures = new Set<string>();
  for (const entree of valeur) {
    if (typeof entree !== "string") {
      return null;
    }
    const quete = catalogue.find((candidat) => candidat.id === entree);
    if (!quete || mesures.has(quete.mesure)) {
      return null;
    }
    mesures.add(quete.mesure);
    ids.push(entree);
  }
  return ids;
}

async function assurerTirage(
  portee: PorteeQuete,
  jour: string
): Promise<QuetePubliee[]> {
  const periode = portee === "daily" ? jour : semaineIso(jour);
  const periodKey = `${portee}:${periode}`;
  const catalogue = catalogueDe(portee);
  const mesures =
    portee === "daily" ? MESURES_QUOTIDIENNES : MESURES_HEBDOMADAIRES;
  await dbReady();
  const db = getDb();
  const [existante] = await db
    .select()
    .from(quizzlyQuestDraw)
    .where(eq(quizzlyQuestDraw.periodKey, periodKey))
    .limit(1);
  let ids = idsFiges(existante?.questIds, catalogue, mesures.length);
  if (!ids) {
    ids = tirerUneParMesure(catalogue, periodKey, mesures).map(
      (quete) => quete.id
    );
    await db
      .insert(quizzlyQuestDraw)
      .values({ periodKey, questIds: ids })
      .onConflictDoNothing({ target: quizzlyQuestDraw.periodKey });
    const [relue] = await db
      .select()
      .from(quizzlyQuestDraw)
      .where(eq(quizzlyQuestDraw.periodKey, periodKey))
      .limit(1);
    ids = idsFiges(relue?.questIds, catalogue, mesures.length) ?? ids;
  }
  return ids.flatMap((id) => {
    const quete = quetePubliee(id);
    return quete?.portee === portee ? [quete] : [];
  });
}

async function quetesDuMoment(maintenant: Date): Promise<QuetePubliee[]> {
  const jour = jourParis(maintenant);
  const [journees, semaines] = await Promise.all([
    assurerTirage("daily", jour),
    assurerTirage("weekly", jour),
  ]);
  return [...journees, ...semaines];
}

export async function listerQuetes(userId: string): Promise<QueteVue[]> {
  await assurerProfil(userId);
  const jour = jourParis(new Date());
  const [journees, semaines] = await Promise.all([
    assurerTirage("daily", jour),
    assurerTirage("weekly", jour),
  ]);
  const lignes = await getDb()
    .select()
    .from(quizzlyQuest)
    .where(eq(quizzlyQuest.userId, userId));
  const parCle = new Map(lignes.map((ligne) => [ligne.questKey, ligne]));
  return [...journees, ...semaines].map((quete) => {
    const periode = quete.portee === "daily" ? jour : semaineIso(jour);
    const key = `${quete.portee}:${periode}:${quete.id}`;
    const ligne = parCle.get(key);
    return {
      claimed: Boolean(ligne?.claimedAt),
      description: quete.description,
      key,
      label: quete.titre,
      monnaie: quete.monnaie,
      progress: ligne?.progress ?? 0,
      reward: quete.recompense,
      scope: quete.portee,
      target: quete.objectif,
    };
  });
}

export async function reclamerQuete(
  userId: string,
  cle: string
): Promise<
  | { message: string; ok: false }
  | {
      gems: number;
      monnaie: "gemmes" | "xp";
      ok: true;
      recompense: number;
      xp: number;
    }
> {
  const analyse = analyserCleQuete(cle);
  if (!analyse) {
    return { message: "Quête inconnue.", ok: false };
  }
  const jour = jourParis(new Date());
  const periode = analyse.portee === "daily" ? jour : semaineIso(jour);
  if (analyse.periode !== periode) {
    return { message: "Cette quête n'est plus d'actualité.", ok: false };
  }
  const definition = quetePubliee(analyse.id);
  const tirage = await assurerTirage(analyse.portee, jour);
  if (!definition || !tirage.some((quete) => quete.id === analyse.id)) {
    return { message: "Cette quête n'est pas au programme.", ok: false };
  }
  await assurerProfil(userId);
  const db = getDb();
  return db.transaction(async (tx) => {
    const [profil] = await tx
      .select()
      .from(quizzlyProfile)
      .where(eq(quizzlyProfile.userId, userId))
      .for("update")
      .limit(1);
    const [quete] = await tx
      .select()
      .from(quizzlyQuest)
      .where(
        and(eq(quizzlyQuest.userId, userId), eq(quizzlyQuest.questKey, cle))
      )
      .for("update")
      .limit(1);
    if (!profil || !quete) {
      return {
        message: "Cette quête n'est pas encore avancée.",
        ok: false as const,
      };
    }
    if (quete.claimedAt) {
      return { message: "Cette quête est déjà réclamée.", ok: false as const };
    }
    if (quete.progress < definition.objectif) {
      return { message: "Cette quête n'est pas terminée.", ok: false as const };
    }
    const gems =
      definition.monnaie === "gemmes"
        ? profil.gems + definition.recompense
        : profil.gems;
    const xp =
      definition.monnaie === "xp"
        ? profil.xp + definition.recompense
        : profil.xp;
    await tx
      .update(quizzlyQuest)
      .set({ claimedAt: new Date() })
      .where(
        and(eq(quizzlyQuest.userId, userId), eq(quizzlyQuest.questKey, cle))
      );
    await tx
      .update(quizzlyProfile)
      .set({ gems, updatedAt: new Date(), xp })
      .where(eq(quizzlyProfile.userId, userId));
    return {
      gems,
      monnaie: definition.monnaie,
      ok: true as const,
      recompense: definition.recompense,
      xp,
    };
  });
}

/**
 * Articles et offres ajoutés par `scripts/admin.ts`. Une ligne dont le `kind`
 * est illisible est ignorée : une entrée corrompue ne doit pas casser la
 * boutique entière.
 */
export async function listerArticlesPersonnalises(): Promise<ShopItem[]> {
  await dbReady();
  const lignes = await getDb()
    .select()
    .from(quizzlyShopItem)
    .orderBy(desc(quizzlyShopItem.createdAt));
  return lignes.flatMap((ligne) =>
    estKindBoutique(ligne.kind)
      ? [
          {
            description: ligne.description,
            id: ligne.id,
            kind: ligne.kind,
            label: ligne.label,
            price: ligne.price,
          },
        ]
      : []
  );
}

export async function acheterArticle(
  userId: string,
  articleId: string
): Promise<
  { message: string; ok: false } | { gems: number; hearts: number; ok: true }
> {
  const article = articleBoutique(
    articleId,
    await listerArticlesPersonnalises()
  );
  if (!article) {
    return { message: "Article inconnu.", ok: false };
  }
  await assurerProfil(userId);
  const db = getDb();
  return db.transaction(async (tx) => {
    const [profil] = await tx
      .select()
      .from(quizzlyProfile)
      .where(eq(quizzlyProfile.userId, userId))
      .for("update")
      .limit(1);
    if (!profil) {
      throw new Error("Profil Quizzly absent.");
    }
    const maintenant = new Date();
    const aujourdhui = jourParis(maintenant);
    const contexte = {
      aujourdhui,
      maintenant,
      semaine: semaineIso(aujourdhui),
    };
    const regen = regeneratedHearts(
      profil.hearts,
      profil.heartsUpdatedAt,
      maintenant
    );
    const cosmetiques = normaliserCosmetiques(profil.cosmetics);
    const portefeuille = {
      gems: profil.gems,
      hearts: regen.hearts,
      lastDailyGift: profil.lastDailyGift,
      leagueShieldWeek: profil.leagueShieldWeek,
      ownedFrames: cosmetiques.ownedFrames,
      streakFreezes: profil.streakFreezes,
      xpBoostUntil: profil.xpBoostUntil,
    };
    const refus = achatImpossible(article, portefeuille, contexte);
    if (refus) {
      return { message: refus, ok: false as const };
    }
    const suivant = appliquerAchat(article, portefeuille, contexte);
    const ownedFrames = suivant.ownedFrames;
    const equippedFrame =
      article.kind === "frame" ? article.id : cosmetiques.equippedFrame;
    await tx
      .update(quizzlyProfile)
      .set({
        cosmetics: {
          customItems: cosmetiques.customItems,
          equippedFrame,
          giftsReceived: cosmetiques.giftsReceived,
          giftsSent: cosmetiques.giftsSent,
          ownedFrames,
        },
        gems: suivant.gems,
        hearts: suivant.hearts,
        heartsUpdatedAt:
          article.kind === "hearts" ? maintenant : regen.heartsUpdatedAt,
        lastDailyGift: suivant.lastDailyGift,
        leagueShieldWeek: suivant.leagueShieldWeek,
        streakFreezes: suivant.streakFreezes,
        updatedAt: maintenant,
        xpBoostUntil: suivant.xpBoostUntil,
      })
      .where(eq(quizzlyProfile.userId, userId));
    return {
      gems: suivant.gems,
      hearts: suivant.hearts,
      ok: true as const,
    };
  });
}

export async function enregistrerSignalement(ligne: {
  chapterFile: ChapterFileName;
  chapterTitle: string;
  email: string | null;
  message: string;
  options: string[];
  questionId: string;
  questionNumber: number;
  questionText: string;
  quizId: string;
  quizTitle: string;
  subjectId: string;
  subjectLabel: string;
  unitId: "u1" | "u2";
  unitTitle: string;
  userId: string;
  username: string | null;
  year: SchoolYear;
}): Promise<void> {
  await dbReady();
  await getDb().insert(quizzlyReport).values(ligne);
}

export function idsOuverts(
  index: CurriculumIndex,
  annee: SchoolYear,
  matiereId: string,
  passes: ReadonlySet<string>
): Set<string> {
  const ordre = index.ordreParMatiere.get(`${annee}/${matiereId}`) ?? [];
  return idsDebloques(ordre, passes);
}

export type { QuizzlyGift, ShopItem };
