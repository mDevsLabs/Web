import { tool } from "ai";
import { z } from "zod";

export const askUserQuestionSchema = z.object({
  allowCustomInput: z
    .boolean()
    .default(true)
    .describe("Permet à l'utilisateur de taper une réponse libre si 'Autre'"),
  defaultValue: z
    .union([z.string(), z.number(), z.boolean()])
    .optional()
    .describe("Valeur par défaut pré-sélectionnée"),
  id: z
    .string()
    .describe("Identifiant unique de la question (ex: q1, budget, os, date)"),
  max: z.number().optional().describe("Valeur maximale pour un type slider"),
  min: z.number().optional().describe("Valeur minimale pour un type slider"),
  options: z
    .array(z.string())
    .min(1)
    .max(12)
    .optional()
    .describe("Liste des choix proposés (pour single_choice ou multiple_choice)"),
  question: z
    .string()
    .describe("La question claire et précise posée à l'utilisateur"),
  required: z.boolean().default(true),
  step: z.number().optional().describe("Incrément pour un type slider"),
  type: z
    .enum([
      "single_choice",
      "multiple_choice",
      "text",
      "slider",
      "boolean",
      "date",
    ])
    .default("single_choice")
    .describe(
      "Type de champ : choix unique, choix multiples, texte libre, curseur (slider), confirmation Oui/Non (boolean), ou sélecteur de date"
    ),
});

export const askUserSchema = z.object({
  description: z
    .string()
    .optional()
    .describe("Contexte ou explication courte de pourquoi ces questions sont posées"),
  questions: z
    .array(askUserQuestionSchema)
    .min(1)
    .max(10)
    .describe("De 1 à 10 questions à poser à l'utilisateur"),
  title: z
    .string()
    .describe("Titre du questionnaire ou du formulaire de clarification"),
});

export const askUser = tool({
  description:
    "Permet de poser entre 1 et 10 questions interactives et ciblées à l'utilisateur (choix unique, choix multiples, champ libre, slider numérique, confirmation Oui/Non, sélecteur de date) lorsqu'une demande manque de précision ou nécessite des préférences avant d'agir.",
  inputSchema: askUserSchema,
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