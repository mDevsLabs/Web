import { tool } from "ai";
import { z } from "zod";

export const quizQuestionSchema = z.object({
  correctAnswers: z
    .array(z.number())
    .min(1)
    .describe(
      "Index (base 0) de la ou des bonnes réponses dans le tableau options"
    ),
  explanation: z
    .string()
    .describe("Explication didactique et détaillée de la bonne réponse"),
  id: z.string().describe("Identifiant de la question (ex: q1, q2)"),
  options: z
    .array(z.string())
    .min(2)
    .max(6)
    .describe("Liste des choix proposés pour cette question"),
  question: z.string().describe("Le texte de la question"),
  type: z
    .enum(["single_choice", "multiple_choice"])
    .default("single_choice")
    .describe("Type de question : choix unique ou choix multiple"),
});

export const quizzlySchema = z.object({
  difficulty: z
    .enum(["facile", "moyen", "difficile", "expert"])
    .default("moyen")
    .describe("Niveau de difficulté du quiz"),
  domain: z
    .string()
    .default("Général")
    .describe(
      "Domaine du quiz (ex: Informatique, Histoire, Sciences, Cinéma, Culture générale...)"
    ),
  questions: z
    .array(quizQuestionSchema)
    .min(1)
    .max(50)
    .describe("Liste ordonnée de 1 à 50 questions générées pour le quiz"),
  theme: z.string().describe("Thème précis du quiz"),
  title: z.string().describe("Titre accrocheur du quiz"),
});

export const quizzly = tool({
  description:
    "Génère un quiz interactif complet (1 à 50 questions, choix unique ou multiple) avec correction immédiate (vert/rouge), explications pédagogiques et score final. Utiliser dès que l'utilisateur demande un quiz, teste ses connaissances, ou via /quiz.",
  execute: async (quizData: any) => ({
    difficulty: quizData.difficulty,
    domain: quizData.domain,
    questions: quizData.questions,
    theme: quizData.theme,
    title: quizData.title,
    totalQuestions: quizData.questions.length,
  }),
  inputSchema: quizzlySchema,
});
