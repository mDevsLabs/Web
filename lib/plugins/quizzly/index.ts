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

export const quizzlyPlugin: PluginDefinition = {
  createTools: () => ({ quizzly }),
  manifest: manifest as PluginManifest,
};
