import { tool } from "ai";
import { z } from "zod";
import type { PluginDefinition, PluginManifest } from "../types";
import manifest from "./index.json";

export const quizQuestionSchema = z
  .object({
    correctAnswers: z
      .array(z.number().int().nonnegative())
      .min(1)
      .describe(
        "Index (base 0) de la ou des bonnes réponses dans le tableau options"
      ),
    explanation: z
      .string()
      .min(1)
      .max(2000)
      .describe("Explication didactique et détaillée de la bonne réponse"),
    id: z
      .string()
      .min(1)
      .max(100)
      .describe("Identifiant de la question (ex: q1, q2)"),
    options: z
      .array(z.string().min(1).max(500))
      .min(2)
      .max(6)
      .describe("Liste des choix proposés pour cette question"),
    question: z.string().min(1).max(1000).describe("Le texte de la question"),
    type: z
      .enum(["single_choice", "multiple_choice"])
      .default("single_choice")
      .describe("Type de question : choix unique ou choix multiple"),
  })
  .superRefine((question, ctx) => {
    const seen = new Set<number>();
    for (const answer of question.correctAnswers) {
      if (answer >= question.options.length) {
        ctx.addIssue({
          code: "custom",
          message: "Une réponse correcte est hors des options proposées.",
          path: ["correctAnswers"],
        });
      }
      if (seen.has(answer)) {
        ctx.addIssue({
          code: "custom",
          message: "Les réponses correctes doivent être uniques.",
          path: ["correctAnswers"],
        });
      }
      seen.add(answer);
    }
    if (
      question.type === "single_choice" &&
      question.correctAnswers.length !== 1
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "Une question à choix unique doit avoir une seule bonne réponse.",
        path: ["correctAnswers"],
      });
    }
  });

export const quizzlySchema = z.object({
  difficulty: z
    .enum(["facile", "moyen", "difficile", "expert"])
    .default("moyen")
    .describe("Niveau de difficulté du quiz"),
  domain: z
    .string()
    .min(1)
    .max(200)
    .default("Général")
    .describe(
      "Domaine du quiz (ex: Informatique, Histoire, Sciences, Cinéma, Culture générale...)"
    ),
  questions: z
    .array(quizQuestionSchema)
    .min(1)
    .max(50)
    .describe("Liste ordonnée de 1 à 50 questions générées pour le quiz"),
  theme: z.string().min(1).max(200).describe("Thème précis du quiz"),
  title: z.string().min(1).max(200).describe("Titre accrocheur du quiz"),
});

export const quizzly = tool({
  description:
    "Génère un quiz interactif complet (1 à 50 questions, choix unique ou multiple) avec correction immédiate (vert/rouge), explications pédagogiques et score final. Utiliser dès que l'utilisateur demande un quiz, teste ses connaissances, ou via /quiz.",
  execute: async (quizData: z.infer<typeof quizzlySchema>) => ({
    difficulty: quizData.difficulty,
    domain: quizData.domain,
    questions: quizData.questions,
    theme: quizData.theme,
    title: quizData.title,
    totalQuestions: quizData.questions.length,
  }),
  inputSchema: quizzlySchema,
});

const answerSchema = z.object({
  questionId: z
    .string()
    .min(1)
    .max(100)
    .describe("Identifiant de la question répondue, tel que celui du quiz"),
  selectedIndexes: z
    .array(z.number().int().nonnegative())
    .max(6)
    .describe(
      "Index (base 0) des options cochées par la personne, dans l'ordre du tableau options"
    ),
});

/**
 * Correction déterministe et 100 % locale. Le modèle ne doit JAMAIS noter lui-même :
 * il comparerait ses propres questions à ses propres réponses en inventant au
 * passage des justifications. Ici la note est une comparaison d'ensembles, donc
 * reproductible, et l'écart entre choisi et attendu est explicité question par
 * question pour permettre une remédiation ciblée.
 */
export const gradeQuiz = tool({
  description:
    "Corriger un quiz déjà généré et noter les réponses : score exact, pourcentage, détail question par question (réponse attendue, réponse donnée, juste ou faux) et récapitulatif par type de question. Calcul local et déterministe.",
  execute: async (input) => {
    const results = input.questions.map((question) => {
      const given = input.answers.find(
        (answer) => answer.questionId === question.id
      );
      const selected = [...new Set(given?.selectedIndexes ?? [])].sort(
        (left, right) => left - right
      );
      const expected = [...question.correctAnswers].sort(
        (left, right) => left - right
      );
      const isCorrect =
        selected.length === expected.length &&
        selected.every((index, position) => index === expected[position]);
      return {
        correct: isCorrect,
        expectedIndexes: expected,
        expectedOptions: expected.map(
          (index) => question.options[index] ?? null
        ),
        explanation: question.explanation,
        givenIndexes: selected,
        givenOptions: selected.map((index) => question.options[index] ?? null),
        question: question.question,
        questionId: question.id,
        status: given ? (isCorrect ? "correct" : "incorrect") : "unanswered",
        type: question.type,
      };
    });

    const answered = results.filter((entry) => entry.status !== "unanswered");
    const correct = results.filter((entry) => entry.correct).length;
    const byType = Object.entries(
      results.reduce<Record<string, { correct: number; total: number }>>(
        (acc, entry) => {
          const bucket = acc[entry.type] ?? { correct: 0, total: 0 };
          bucket.total += 1;
          if (entry.correct) {
            bucket.correct += 1;
          }
          acc[entry.type] = bucket;
          return acc;
        },
        {}
      )
    ).map(([type, bucket]) => ({
      correct: bucket.correct,
      successRate: Number(((bucket.correct / bucket.total) * 100).toFixed(1)),
      total: bucket.total,
      type,
    }));

    const unknownAnswers = input.answers
      .filter(
        (answer) =>
          !input.questions.some((question) => question.id === answer.questionId)
      )
      .map((answer) => answer.questionId);

    return {
      byType,
      correctCount: correct,
      incorrectCount: answered.length - correct,
      results,
      scorePercent: Number(((correct / results.length) * 100).toFixed(1)),
      totalCount: results.length,
      unansweredCount: results.length - answered.length,
      unknownQuestionIds: unknownAnswers,
    };
  },
  inputSchema: z.object({
    answers: z
      .array(answerSchema)
      .max(50)
      .describe(
        "Réponses de la personne. Une question absente de cette liste est comptée « sans réponse »."
      ),
    questions: z
      .array(quizQuestionSchema)
      .min(1)
      .max(50)
      .describe(
        "Les questions du quiz à corriger, avec leurs options et leurs bonnes réponses"
      ),
  }),
});

export const quizzlyPlugin: PluginDefinition = {
  createTools: () => ({ gradeQuiz, quizzly }),
  manifest: manifest as PluginManifest,
};
