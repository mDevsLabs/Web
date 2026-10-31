/**
 * Coach Quizzly : faits, modèle et consigne.
 *
 * La note reste celle de la correction déterministe. Ce module ne juge
 * pas une réponse : il fige la dernière tentative, refuse une question
 * qui n'y figure pas comme erreur, et rédige une consigne ancrée sur
 * l'explication du cours. Le client n'envoie ni l'énoncé ni la bonne
 * réponse.
 */

import { z } from "zod";

export const COACH_INTENTS = ["explain", "summary", "encourage"] as const;
export type CoachIntent = (typeof COACH_INTENTS)[number];

/** Échanges de suivi, sans compter la demande construite par le serveur. */
export const COACH_SUIVI_MAX = 6;
export const COACH_MESSAGE_MAX = 2000;
export const COACH_REPLY_MAX = 8000;
export const COACH_TENTATIVES_MAX = 20;

const questionIdSchema = z.string().regex(/^q(?:[1-9]|10)$/);

const erreurSchema = z.object({
  expectedIndexes: z.array(z.number().int().nonnegative().max(5)).max(3),
  explanation: z.string().min(1).max(400),
  givenIndexes: z.array(z.number().int().nonnegative().max(5)).max(6),
  options: z.array(z.string().min(1).max(160)).min(2).max(4),
  question: z.string().min(1).max(300),
  questionId: questionIdSchema,
});

export type TentativeErreur = z.infer<typeof erreurSchema>;

export const tentativeSchema = z
  .object({
    answeredAt: z.string().min(1).max(40),
    correctCount: z.number().int().nonnegative().max(10),
    misses: z.array(erreurSchema).max(10),
    passed: z.boolean(),
    totalCount: z.number().int().positive().max(10),
  })
  .refine((valeur) => valeur.correctCount <= valeur.totalCount, {
    message: "Le score dépasse le nombre de questions.",
  });

export type DerniereTentative = z.infer<typeof tentativeSchema>;

type QuestionSource = {
  explanation: string;
  id: string;
  options: readonly string[];
  question: string;
};

type NoteSource = {
  correctCount: number;
  passed: boolean;
  results: readonly {
    correct: boolean;
    expectedIndexes: readonly number[];
    givenIndexes: readonly number[];
    questionId: string;
  }[];
  totalCount: number;
};

/**
 * Instantané de CET envoi. Le meilleur score, lui, est décidé à part :
 * une moins bonne tentative ne doit pas l'abaisser.
 */
export function construireTentative(
  questions: readonly QuestionSource[],
  note: NoteSource,
  answeredAt: Date
): DerniereTentative {
  const parId = new Map(questions.map((question) => [question.id, question]));
  const misses: TentativeErreur[] = [];
  for (const ligne of note.results) {
    if (ligne.correct) {
      continue;
    }
    const question = parId.get(ligne.questionId);
    if (!question?.explanation.trim() || !question.question.trim()) {
      continue;
    }
    const erreur = erreurSchema.safeParse({
      expectedIndexes: [...ligne.expectedIndexes],
      explanation: question.explanation,
      givenIndexes: [...ligne.givenIndexes],
      options: [...question.options],
      question: question.question,
      questionId: question.id,
    });
    if (erreur.success) {
      misses.push(erreur.data);
    }
  }
  return {
    answeredAt: answeredAt.toISOString(),
    correctCount: note.correctCount,
    misses,
    passed: note.passed,
    totalCount: note.totalCount,
  };
}

export function scoreRetenu(
  existant: { correctCount: number; passed: boolean } | null,
  note: { correctCount: number; passed: boolean }
): { correctCount: number; passed: boolean } {
  return {
    correctCount: Math.max(existant?.correctCount ?? 0, note.correctCount),
    passed: Boolean(existant?.passed) || note.passed,
  };
}

export function lireTentative(valeur: unknown): DerniereTentative | null {
  const parsed = tentativeSchema.safeParse(valeur);
  return parsed.success ? parsed.data : null;
}

export type QuizTente = {
  answeredAt: string;
  chapterTitle: string;
  correctCount: number;
  misses: TentativeErreur[];
  passed: boolean;
  quizId: string;
  quizTitle: string;
  subjectLabel: string;
  totalCount: number;
};

export function assemblerTentatives(
  lignes: readonly { lastAttempt: unknown; quizId: string }[],
  titre: (
    quizId: string
  ) => { chapterTitle: string; quizTitle: string; subjectLabel: string } | null
): QuizTente[] {
  const vues: QuizTente[] = [];
  for (const ligne of lignes) {
    const tentative = lireTentative(ligne.lastAttempt);
    if (!tentative) {
      continue;
    }
    const libelle = titre(ligne.quizId);
    vues.push({
      answeredAt: tentative.answeredAt,
      chapterTitle: libelle?.chapterTitle ?? "",
      correctCount: tentative.correctCount,
      misses: tentative.misses,
      passed: tentative.passed,
      quizId: ligne.quizId,
      quizTitle: libelle?.quizTitle ?? "Quiz",
      subjectLabel: libelle?.subjectLabel ?? "",
      totalCount: tentative.totalCount,
    });
  }
  return vues;
}

export type ErreurCoachVue = {
  answeredAt: string;
  chapterTitle: string;
  givenOptions: string[];
  question: string;
  questionId: string;
  quizId: string;
  quizTitle: string;
  subjectLabel: string;
};

export function vuesErreurs(
  tentatives: readonly QuizTente[],
  max = 40
): ErreurCoachVue[] {
  const vues: ErreurCoachVue[] = [];
  for (const tentative of tentatives) {
    for (const erreur of tentative.misses) {
      if (vues.length >= max) {
        return vues;
      }
      vues.push({
        answeredAt: tentative.answeredAt,
        chapterTitle: tentative.chapterTitle,
        givenOptions: erreur.givenIndexes.flatMap((index) => {
          const option = erreur.options[index];
          return option ? [option] : [];
        }),
        question: erreur.question,
        questionId: erreur.questionId,
        quizId: tentative.quizId,
        quizTitle: tentative.quizTitle,
        subjectLabel: tentative.subjectLabel,
      });
    }
  }
  return vues;
}

export type ContexteCoach = {
  passedCount: number;
  streakCount: number;
  tentatives: readonly QuizTente[];
  xp: number;
  yearLabel: string;
};

export type MessageSuivi = {
  role: "assistant" | "user";
  text: string;
};

export function validerSuivi(
  messages: readonly { role: string; text: string }[]
): { message: string; ok: false } | { messages: MessageSuivi[]; ok: true } {
  if (messages.length > COACH_SUIVI_MAX) {
    return { message: "L'échange de suivi est trop long.", ok: false };
  }
  const propres: MessageSuivi[] = [];
  for (let index = 0; index < messages.length; index++) {
    const message = messages[index];
    if (!message) {
      return { message: "L'échange est mal formé.", ok: false };
    }
    const attendu = index % 2 === 0 ? "assistant" : "user";
    if (message.role !== attendu) {
      return { message: "L'échange est mal formé.", ok: false };
    }
    const text = message.text.trim();
    if (!text) {
      return { message: "Un message de suivi est vide.", ok: false };
    }
    if (attendu === "user" && text.length > COACH_MESSAGE_MAX) {
      return { message: "Un message de suivi est trop long.", ok: false };
    }
    propres.push({
      role: attendu,
      text: text.slice(
        0,
        attendu === "user" ? COACH_MESSAGE_MAX : COACH_REPLY_MAX
      ),
    });
  }
  if (propres.length > 0 && propres.at(-1)?.role !== "user") {
    return { message: "Le dernier message doit venir de vous.", ok: false };
  }
  return { messages: propres, ok: true };
}

function decrireOptions(erreur: TentativeErreur): string {
  return erreur.options
    .map((option, index) => {
      const marques: string[] = [];
      if (erreur.givenIndexes.includes(index)) {
        marques.push("choix de l'élève");
      }
      if (erreur.expectedIndexes.includes(index)) {
        marques.push("réponse du cours");
      }
      const suffixe = marques.length > 0 ? ` (${marques.join(", ")})` : "";
      return `- ${option}${suffixe}`;
    })
    .join("\n");
}

function decrireErreur(tentative: QuizTente, erreur: TentativeErreur): string {
  const matiere = [tentative.subjectLabel, tentative.chapterTitle]
    .filter(Boolean)
    .join(", ");
  return [
    `Quiz : ${tentative.quizTitle}${matiere ? ` (${matiere})` : ""}`,
    `Question : ${erreur.question}`,
    "Options :",
    decrireOptions(erreur),
    `Explication du cours, à ne pas contredire : ${erreur.explanation}`,
  ].join("\n");
}

function decrireFaits(contexte: ContexteCoach): string {
  const lignes = [
    `Année : ${contexte.yearLabel}`,
    `XP : ${contexte.xp}`,
    `Série : ${contexte.streakCount} jour${contexte.streakCount > 1 ? "s" : ""}`,
    `Quiz validés : ${contexte.passedCount}`,
  ];
  if (contexte.tentatives.length === 0) {
    lignes.push("Aucune tentative détaillée pour l'instant.");
    return lignes.join("\n");
  }
  lignes.push("Dernières tentatives :");
  for (const tentative of contexte.tentatives) {
    const matiere = tentative.subjectLabel ? `${tentative.subjectLabel}, ` : "";
    lignes.push(
      `- ${matiere}${tentative.quizTitle} : ${tentative.correctCount}/${tentative.totalCount}, ${tentative.passed ? "validé" : "à reprendre"}`
    );
  }
  const details: string[] = [];
  for (const tentative of contexte.tentatives) {
    for (const erreur of tentative.misses) {
      details.push(decrireErreur(tentative, erreur));
      if (details.length >= 20) {
        break;
      }
    }
    if (details.length >= 20) {
      break;
    }
  }
  if (details.length === 0) {
    lignes.push("Aucune erreur dans ces tentatives.");
    return lignes.join("\n");
  }
  lignes.push("Erreurs de ces tentatives :", ...details);
  return lignes.join("\n\n");
}

function consigne(yearLabel: string): string {
  return [
    `Tu es le coach de Quizzly, pour un élève de ${yearLabel}.`,
    "Tu parles français, en phrases courtes, sans titre ni liste markdown.",
    "Tu encourages. Tu ne te moques pas.",
    "La note est déjà décidée. Tu ne la changes pas.",
    "L'explication du cours fait foi. Tu ne proposes pas une autre bonne réponse.",
    "Tu ne parles pas d'un autre quiz et tu ne donnes pas la réponse d'une question absente du message.",
    "Tu restes sur le sujet de cette demande.",
  ].join("\n");
}

export function preparerEchangeCoach(params: {
  contexte: ContexteCoach;
  intent: CoachIntent;
  questionId?: string;
  quizId?: string;
}):
  | { code: "missing_error" | "unknown_question"; ok: false }
  | { ok: true; ouverture: string; system: string } {
  const system = consigne(params.contexte.yearLabel);
  if (params.intent === "explain") {
    if (!params.quizId || !params.questionId) {
      return { code: "missing_error", ok: false };
    }
    const tentative = params.contexte.tentatives.find(
      (entree) => entree.quizId === params.quizId
    );
    const erreur = tentative?.misses.find(
      (entree) => entree.questionId === params.questionId
    );
    if (!tentative || !erreur) {
      return { code: "unknown_question", ok: false };
    }
    return {
      ok: true,
      ouverture: [
        "Explique mon erreur.",
        decrireErreur(tentative, erreur),
        "Dis pourquoi mon choix ne convient pas, et comment retenir la bonne idée.",
      ].join("\n\n"),
      system,
    };
  }
  if (params.intent === "summary") {
    return {
      ok: true,
      ouverture: [
        "Résume mes apprentissages.",
        decrireFaits(params.contexte),
        "Fais un bilan court : ce qui est acquis, les erreurs qui reviennent, et une prochaine étape. Appuie-toi seulement sur ces faits.",
      ].join("\n\n"),
      system,
    };
  }
  return {
    ok: true,
    ouverture: [
      "Encourage-moi.",
      `Année : ${params.contexte.yearLabel}`,
      `XP : ${params.contexte.xp}`,
      `Série : ${params.contexte.streakCount}`,
      `Quiz validés : ${params.contexte.passedCount}`,
      params.contexte.tentatives.length === 0
        ? "Aucune tentative détaillée pour l'instant."
        : params.contexte.tentatives
            .map(
              (tentative) =>
                `- ${tentative.quizTitle} : ${tentative.correctCount}/${tentative.totalCount}, ${tentative.passed ? "validé" : "à reprendre"}`
            )
            .join("\n"),
      "Relève ce qui avance. S'il reste des quiz à reprendre, rappelle qu'une erreur sert à apprendre, sans détailler les réponses.",
    ].join("\n\n"),
    system,
  };
}

/**
 * Le modèle enregistré ne prime que s'il est encore au catalogue et
 * autorisé pour le forfait. Sinon on reprend le modèle du compte, puis
 * le repli de l'application.
 */
export function resoudreModeleCoach(params: {
  autorise: (modelId: string) => boolean;
  catalogueIds: readonly string[];
  fallback: string;
  preferred: string | null | undefined;
  stored: string | null | undefined;
}): string {
  const prefere = params.preferred?.trim();
  const repli = prefere && params.autorise(prefere) ? prefere : params.fallback;
  const demande = params.stored?.trim();
  if (!demande) {
    return repli;
  }
  if (params.catalogueIds.includes(demande) && params.autorise(demande)) {
    return demande;
  }
  return repli;
}

export function modeleCoachEnregistrable(params: {
  autorise: (modelId: string) => boolean;
  catalogueIds: readonly string[];
  modelId: string;
}): boolean {
  const id = params.modelId.trim();
  if (!id || id.length > 120) {
    return false;
  }
  return params.catalogueIds.includes(id) && params.autorise(id);
}
