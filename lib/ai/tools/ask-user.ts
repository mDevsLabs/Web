import { tool } from "ai";
import {
  ASK_USER_MAX_QUESTIONS,
  askUserQuestionSchema,
  askUserRequestSchema,
} from "@/lib/agent/contracts";

// Le questionnaire est un CONTRAT STRUCTURÉ, partagé entre le Chat et Agent :
// une seule définition du schéma (lib/agent/contracts.ts), validée par le
// serveur dans les deux cas. Aucune interprétation de texte libre.
export { askUserQuestionSchema };
export const askUserSchema = askUserRequestSchema;

export const askUser = tool({
  description: `Pose de 1 à ${ASK_USER_MAX_QUESTIONS} questions interactives et ciblées à l'utilisateur (choix unique, choix multiples, champ libre, curseur numérique, confirmation Oui/Non, sélecteur de date) lorsqu'une information manque et qu'aucune hypothèse raisonnable n'est possible. Chaque question porte un identifiant stable, un type de réponse, des choix éventuels, une valeur par défaut facultative et son caractère obligatoire ou non.`,
  execute: async ({ title, description, questions }) => ({
    description,
    questions,
    status: "waiting_for_user",
    title,
  }),
  inputSchema: askUserSchema,
});
