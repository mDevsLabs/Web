/**
 * Progression Quizzly, par compte.
 *
 * Cœurs, gemmes, série et quêtes sont décidés ici, dans une transaction
 * qui verrouille la ligne du profil. Le client envoie des réponses ;
 * il n'envoie ni score, ni récompense.
 */

import "server-only";

import { and, count, desc, eq, isNotNull } from "drizzle-orm";
import type { MaiUser } from "@/lib/auth/session";
import { dbReady, getDb } from "@/lib/db/queries";
import {
  type QuizzlyProfile,
  quizzlyProfile,
  quizzlyQuest,
  quizzlyQuizProgress,
  quizzlyReport,
} from "@/lib/db/schema";
import {
  COACH_TENTATIVES_MAX,
  construireTentative,
  scoreRetenu,
} from "@/lib/quizzly/coach";
import { lireNomAffiche } from "@/lib/quizzly/display-name";
import { corrigerQuiz } from "@/lib/quizzly/grade";
import {
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
  achatImpossible,
  analyserCleQuete,
  appliquerAchat,
  avancerSerie,
  idsDebloques,
  incrementsQuetes,
  jourParis,
  libelleQuete,
  normaliserCosmetiques,
  QUEST_REWARDS,
  QUEST_TARGETS,
  type QuestId,
  recompensesPremiereValidation,
  regeneratedHearts,
  semaineIso,
} from "@/lib/quizzly/rules";
import type { SubmittedAnswer } from "@/lib/quizzly/schema";
import { articleBoutique, type ShopItem } from "@/lib/quizzly/shop";

export type ResumeQuizzly = {
  avatarUrl: string | null;
  displayName: string;
  equippedFrame: string | null;
  gems: number;
  hearts: number;
  heartsUpdatedAt: string;
  modelId: string | null;
  ownedFrames: string[];
  schoolYear: SchoolYear;
  streakCount: number;
  streakFreezes: number;
  username: string;
  xp: number;
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
  key: string;
  label: string;
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
  const [profil, nom] = await Promise.all([
    assurerProfil(userId),
    lireNomAffiche(repli),
  ]);
  const cosmetiques = normaliserCosmetiques(profil.cosmetics);
  const annee = estAnneeScolaire(profil.schoolYear) ? profil.schoolYear : "6e";
  return {
    avatarUrl: nom.avatarUrl,
    displayName: nom.displayName,
    equippedFrame: cosmetiques.equippedFrame,
    gems: profil.gems,
    hearts: profil.hearts,
    heartsUpdatedAt: profil.heartsUpdatedAt.toISOString(),
    modelId: profil.modelId,
    ownedFrames: cosmetiques.ownedFrames,
    schoolYear: annee,
    streakCount: profil.streakCount,
    streakFreezes: profil.streakFreezes,
    username: nom.username,
    xp: profil.xp,
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
    .set({ schoolYear: annee, updatedAt: new Date(), yearChosen: true })
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
  modelId: string | null;
  passedCount: number;
  schoolYear: SchoolYear;
  streakCount: number;
  tentatives: { lastAttempt: unknown; quizId: string }[];
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
  return {
    modelId: profil.modelId,
    passedCount: Number(compte[0]?.valeur ?? 0),
    schoolYear: annee,
    streakCount: profil.streakCount,
    tentatives: lignes,
    xp: profil.xp,
  };
}

export async function soumettreQuiz(
  userId: string,
  index: CurriculumIndex,
  quiz: LoadedQuiz,
  reponses: SubmittedAnswer[]
): Promise<
  | { code: "locked" | "no_hearts"; ok: false }
  | { ok: true; resultat: ResultatQuiz }
> {
  const note = corrigerQuiz(quiz.questions, reponses);
  const maintenant = new Date();
  const aujourdhui = jourParis(maintenant);
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
    const gain = premiere
      ? recompensesPremiereValidation(note.correctCount)
      : { gems: 0, xp: 0 };
    const serie = note.passed
      ? avancerSerie(
          {
            streakCount: profil.streakCount,
            streakFreezes: profil.streakFreezes,
            streakLastDay: profil.streakLastDay,
          },
          aujourdhui
        )
      : {
          streakCount: profil.streakCount,
          streakFreezes: profil.streakFreezes,
          streakLastDay: profil.streakLastDay,
        };
    const coeurs = Math.max(0, regen.hearts - note.wrongCount);
    await tx
      .update(quizzlyProfile)
      .set({
        gems: profil.gems + gain.gems,
        hearts: coeurs,
        heartsUpdatedAt:
          note.wrongCount > 0 ? maintenant : regen.heartsUpdatedAt,
        streakCount: serie.streakCount,
        streakFreezes: serie.streakFreezes,
        streakLastDay: serie.streakLastDay,
        updatedAt: maintenant,
        xp: profil.xp + gain.xp,
      })
      .where(eq(quizzlyProfile.userId, userId));
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
    if (note.passed) {
      const mouvements = incrementsQuetes({
        firstPass: premiere,
        parfait: note.correctCount === note.totalCount,
        periodeJour: aujourdhui,
        periodeSemaine: semaineIso(aujourdhui),
        serie: serie.streakCount,
        xp: gain.xp,
      });
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
        streakExtended: note.passed && serie.streakCount > profil.streakCount,
        streakFreezeUsed:
          note.passed && serie.streakFreezes < profil.streakFreezes,
        totalCount: note.totalCount,
        xpAwarded: gain.xp,
      },
    };
  });
}

function clesCourantes(
  maintenant: Date
): { cle: string; id: QuestId; scope: "daily" | "weekly" }[] {
  const jour = jourParis(maintenant);
  const semaine = semaineIso(jour);
  return [
    { cle: `daily:${jour}:quiz`, id: "quiz", scope: "daily" },
    { cle: `daily:${jour}:perfect`, id: "perfect", scope: "daily" },
    { cle: `daily:${jour}:xp`, id: "xp", scope: "daily" },
    { cle: `weekly:${semaine}:quizzes`, id: "quizzes", scope: "weekly" },
    { cle: `weekly:${semaine}:streak`, id: "streak", scope: "weekly" },
  ];
}

export async function listerQuetes(userId: string): Promise<QueteVue[]> {
  await assurerProfil(userId);
  const attendues = clesCourantes(new Date());
  const lignes = await getDb()
    .select()
    .from(quizzlyQuest)
    .where(eq(quizzlyQuest.userId, userId));
  const parCle = new Map(lignes.map((ligne) => [ligne.questKey, ligne]));
  return attendues.map((attendue) => {
    const ligne = parCle.get(attendue.cle);
    return {
      claimed: Boolean(ligne?.claimedAt),
      key: attendue.cle,
      label: libelleQuete(attendue.id),
      progress: ligne?.progress ?? 0,
      reward: QUEST_REWARDS[attendue.id],
      scope: attendue.scope,
      target: QUEST_TARGETS[attendue.id],
    };
  });
}

export async function reclamerQuete(
  userId: string,
  cle: string
): Promise<{ message: string; ok: false } | { gems: number; ok: true }> {
  const analyse = analyserCleQuete(cle);
  if (!analyse) {
    return { message: "Quête inconnue.", ok: false };
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
    if (quete.progress < QUEST_TARGETS[analyse.id]) {
      return { message: "Cette quête n'est pas terminée.", ok: false as const };
    }
    const reward = QUEST_REWARDS[analyse.id];
    const gems = profil.gems + reward;
    await tx
      .update(quizzlyQuest)
      .set({ claimedAt: new Date() })
      .where(
        and(eq(quizzlyQuest.userId, userId), eq(quizzlyQuest.questKey, cle))
      );
    await tx
      .update(quizzlyProfile)
      .set({ gems, updatedAt: new Date() })
      .where(eq(quizzlyProfile.userId, userId));
    return { gems, ok: true as const };
  });
}

export async function acheterArticle(
  userId: string,
  articleId: string
): Promise<
  { message: string; ok: false } | { gems: number; hearts: number; ok: true }
> {
  const article = articleBoutique(articleId);
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
    const regen = regeneratedHearts(
      profil.hearts,
      profil.heartsUpdatedAt,
      new Date()
    );
    const cosmetiques = normaliserCosmetiques(profil.cosmetics);
    const portefeuille = {
      gems: profil.gems,
      hearts: regen.hearts,
      ownedFrames: cosmetiques.ownedFrames,
      streakFreezes: profil.streakFreezes,
    };
    const refus = achatImpossible(article, portefeuille);
    if (refus) {
      return { message: refus, ok: false as const };
    }
    const suivant = appliquerAchat(article, portefeuille);
    const ownedFrames = suivant.ownedFrames;
    const equippedFrame =
      article.kind === "frame" ? article.id : cosmetiques.equippedFrame;
    await tx
      .update(quizzlyProfile)
      .set({
        cosmetics: { equippedFrame, ownedFrames },
        gems: suivant.gems,
        hearts: suivant.hearts,
        heartsUpdatedAt:
          article.kind === "hearts" ? new Date() : regen.heartsUpdatedAt,
        streakFreezes: suivant.streakFreezes,
        updatedAt: new Date(),
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

export type { ShopItem };
