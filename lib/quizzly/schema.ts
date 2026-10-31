/**
 * Forme d'un chapitre Quizzly.
 *
 * Un fichier JSON est un chapitre : 2 unités, 10 quiz, 10 questions.
 * La correction reste dans le fichier ; la route de lecture la retire
 * avant de répondre au navigateur.
 */

import { z } from "zod";
import { SCHOOL_YEARS } from "@/lib/quizzly/program";

const INDEX_QUIZ = /^q(?:0[1-9]|10)$/;

export const questionSchema = z
  .object({
    correctAnswers: z.array(z.number().int().nonnegative()).min(1).max(3),
    explanation: z.string().min(1).max(400),
    id: z.string().regex(/^q(?:[1-9]|10)$/),
    options: z.array(z.string().min(1).max(160)).length(4),
    question: z.string().min(1).max(300),
    type: z.enum(["single_choice", "multiple_choice"]),
  })
  .superRefine((question, ctx) => {
    const vues = new Set<number>();
    for (const reponse of question.correctAnswers) {
      if (reponse >= question.options.length) {
        ctx.addIssue({
          code: "custom",
          message: "Une réponse correcte est hors des options.",
          path: ["correctAnswers"],
        });
      }
      if (vues.has(reponse)) {
        ctx.addIssue({
          code: "custom",
          message: "Les réponses correctes doivent être uniques.",
          path: ["correctAnswers"],
        });
      }
      vues.add(reponse);
    }
    if (
      question.type === "single_choice" &&
      question.correctAnswers.length !== 1
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Un choix unique a exactement une bonne réponse.",
        path: ["correctAnswers"],
      });
    }
    if (
      question.type === "multiple_choice" &&
      question.correctAnswers.length < 2
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Un choix multiple a au moins deux bonnes réponses.",
        path: ["correctAnswers"],
      });
    }
    const textes = new Set(
      question.options.map((option) => option.trim().toLowerCase())
    );
    if (textes.size !== question.options.length) {
      ctx.addIssue({
        code: "custom",
        message: "Les options d'une question sont distinctes.",
        path: ["options"],
      });
    }
  });

const quizSchema = z.object({
  id: z.string().regex(INDEX_QUIZ),
  questions: z.array(questionSchema).length(10),
  title: z.string().min(1).max(120),
});

const uniteSchema = z.object({
  id: z.enum(["u1", "u2"]),
  order: z.union([z.literal(1), z.literal(2)]),
  quizzes: z.array(quizSchema).length(10),
  title: z.string().min(1).max(160),
});

export const chapterSchema = z
  .object({
    id: z.string().min(1).max(80),
    order: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    subject: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string().min(1).max(160),
    units: z.tuple([uniteSchema, uniteSchema]),
    year: z.enum(SCHOOL_YEARS),
  })
  .superRefine((chapitre, ctx) => {
    const [premiere, seconde] = chapitre.units;
    if (premiere.id !== "u1" || premiere.order !== 1) {
      ctx.addIssue({
        code: "custom",
        message: "La première unité est u1, d'ordre 1.",
        path: ["units", 0],
      });
    }
    if (seconde.id !== "u2" || seconde.order !== 2) {
      ctx.addIssue({
        code: "custom",
        message: "La seconde unité est u2, d'ordre 2.",
        path: ["units", 1],
      });
    }
    for (const [indexUnite, unite] of chapitre.units.entries()) {
      const identifiantsQuestions = new Set<string>();
      unite.quizzes.forEach((quiz, indexQuiz) => {
        const attendu = `q${String(indexQuiz + 1).padStart(2, "0")}`;
        if (quiz.id !== attendu) {
          ctx.addIssue({
            code: "custom",
            message: `Le quiz ${indexQuiz + 1} porte l'identifiant ${attendu}.`,
            path: ["units", indexUnite, "quizzes", indexQuiz, "id"],
          });
        }
        const multiples = quiz.questions.filter(
          (question) => question.type === "multiple_choice"
        ).length;
        if (multiples < 1 || multiples > 2) {
          ctx.addIssue({
            code: "custom",
            message: "Chaque quiz contient 1 ou 2 choix multiples.",
            path: ["units", indexUnite, "quizzes", indexQuiz, "questions"],
          });
        }
        const vus = new Set<string>();
        for (const question of quiz.questions) {
          if (vus.has(question.id)) {
            ctx.addIssue({
              code: "custom",
              message:
                "Les questions d'un quiz ont des identifiants distincts.",
              path: ["units", indexUnite, "quizzes", indexQuiz, "questions"],
            });
          }
          vus.add(question.id);
          identifiantsQuestions.add(`${quiz.id}:${question.id}`);
        }
      });
      if (identifiantsQuestions.size !== 100) {
        ctx.addIssue({
          code: "custom",
          message: "Une unité porte 100 questions distinctes.",
          path: ["units", indexUnite],
        });
      }
    }
  });

export type ChapterFile = z.infer<typeof chapterSchema>;
export type QuizQuestion = z.infer<typeof questionSchema>;

export const answerSchema = z.object({
  questionId: z.string().min(1).max(20),
  selectedIndexes: z.array(z.number().int().nonnegative()).max(4),
});

export type SubmittedAnswer = z.infer<typeof answerSchema>;

export type PublicQuestion = {
  id: string;
  options: string[];
  question: string;
  type: QuizQuestion["type"];
};

export type PublicQuiz = {
  chapterTitle: string;
  id: string;
  questions: PublicQuestion[];
  subjectLabel: string;
  title: string;
  unitTitle: string;
};

/** Retire la correction : le navigateur ne la reçoit qu'après l'envoi des réponses. */
export function versQuizPublic(quiz: {
  chapterTitle: string;
  id: string;
  questions: QuizQuestion[];
  subjectLabel: string;
  title: string;
  unitTitle: string;
}): PublicQuiz {
  return {
    chapterTitle: quiz.chapterTitle,
    id: quiz.id,
    questions: quiz.questions.map((question) => ({
      id: question.id,
      options: question.options,
      question: question.question,
      type: question.type,
    })),
    subjectLabel: quiz.subjectLabel,
    title: quiz.title,
    unitTitle: quiz.unitTitle,
  };
}
