import { tool } from "ai";
import { z } from "zod";

export const askUserQuestionSchema = z.object({
  allowCustomInput: z.boolean().default(true).describe("Permet à l'utilisateur de taper une réponse libre si 'Autre'"),
  id: z.string().describe("Identifiant unique de la question (ex: q1, budget, os)"),
  options: z.array(z.string()).min(2).max(10).describe("Liste des choix proposés"),
  question: z.string().describe("La question claire et précise posée à l'utilisateur"),
  required: z.boolean().default(true),
  type: z.enum(["single_choice", "multiple_choice", "text"]).default("single_choice"),
});

export const askUserSchema = z.object({
  description: z.string().optional().describe("Contexte ou explication courte de pourquoi ces questions sont posées"),
  questions: z
    .array(askUserQuestionSchema)
    .min(1)
    .max(10)
    .describe("De 1 à 10 questions à poser à l'utilisateur"),
  title: z.string().describe("Titre du questionnaire ou du formulaire de clarification"),
});

export const askUser = tool({
  description:
    "Permet de poser entre 1 et 10 questions interactives à l'utilisateur (choix unique, choix multiples, champ libre personnalisé) lorsqu'une demande manque de précision ou nécessite des préférences avant d'agir.",
  inputSchema: askUserSchema,
  // execute retourne le format attendu pour l'interface client (l'utilisateur répondra côté UI)
  execute: async ({
    title,
    description,
    questions,
  }: {
    title: string;
    description?: string;
    questions: any[];
  }) => {
    return {
      description,
      questions,
      status: "waiting_for_user",
      title,
    };
  },
});