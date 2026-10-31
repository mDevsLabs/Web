// Prompt du panneau d'édition. Pur : la route fournit les textes déjà lus
// en base. L'ordre est fixe — contrat, puis sélection et mode, puis les
// consignes personnelles en dernier (projet, page, compte).

import {
  composePersonalInstructions,
  composeSystemPrompt,
} from "@/lib/prompts/personal";

export type PagePromptInput = {
  accountEnabled: boolean;
  accountInstructions: string | null;
  intent: "edit" | "propose";
  pagePrompt: string | null;
  projectInstructions: string | null;
  /** Bloc déjà composé par buildMemoryContext, ou null. */
  memoryBlock?: string | null;
  selection: string | null;
};

const BASE = [
  "Tu es mAI, l'assistant d'édition d'une page Markdown.",
  "Tu réponds en français. Tu n'inventes pas de contenu hors de la page, de la sélection et de ce que l'utilisateur demande.",
  "La page est du Markdown. Tu conserves les titres, listes, tableaux, liens et blocs de code sauf demande contraire.",
  "Outils :",
  "- lire_page : lis le titre, le corps et l'empreinte avant toute modification.",
  "- modifier_page : édition ciblée, appliquée tout de suite. Réservée au mode édition.",
  "- proposer_modification : propose un patch. La page ne change qu'après acceptation.",
  "- renommer_page : change uniquement le titre.",
  "Appelle lire_page avant modifier_page ou proposer_modification : l'empreinte (baseHash) doit être celle que lire_page vient de renvoyer.",
  "Préfère des opérations ciblées (remplacer un passage, insérer, supprimer des lignes) à une réécriture entière.",
  "Si un outil répond que la page a changé, relis-la et recommence. N'insiste pas avec une empreinte périmée.",
].join("\n");

function modeSection(intent: PagePromptInput["intent"]): string {
  if (intent === "edit") {
    return [
      "MODE ÉDITION",
      "L'utilisateur a demandé une modification directe. Utilise modifier_page (ou renommer_page pour le titre). N'utilise pas proposer_modification.",
    ].join("\n");
  }
  return [
    "MODE PROPOSITION",
    "Conversation libre. Utilise proposer_modification pour toute modification du corps. N'appelle modifier_page que si l'utilisateur demande explicitement d'appliquer tout de suite.",
  ].join("\n");
}

function selectionSection(selection: string | null): string | null {
  const text = selection?.trim();
  if (!text) {
    return null;
  }
  const clipped = text.slice(0, 8000);
  return [
    "SÉLECTION COURANTE",
    "L'utilisateur a sélectionné ce passage. Les remplacements doivent cibler ce texte exact :",
    clipped,
  ].join("\n");
}

export function buildPageSystemPrompt(input: PagePromptInput): string {
  const personal = composePersonalInstructions([
    {
      body: input.projectInstructions,
      label: "CONTEXTE DU PROJET",
    },
    {
      body: input.memoryBlock ?? null,
      label: "MÉMOIRE",
    },
    {
      body: input.pagePrompt,
      label: "PROMPT DE LA PAGE",
    },
    {
      body: input.accountEnabled ? input.accountInstructions : null,
      label: "INSTRUCTIONS DU COMPTE",
    },
  ]);
  return composeSystemPrompt({
    base: `${BASE}\n\n${modeSection(input.intent)}`,
    capabilitySections: [selectionSection(input.selection)],
    personal,
  });
}
