// Prompt du panneau d'édition. Pur : la route fournit les textes déjà lus
// en base. L'ordre est fixe — contrat (formats Markdown et balise <m>),
// puis le mode, la police du compte, la sélection, et les consignes
// personnelles en dernier (projet, page, compte).

import { normalizePageFont, type PageFont } from "@/lib/pages/style";
import {
  composePersonalInstructions,
  composeSystemPrompt,
} from "@/lib/prompts/personal";

export type PagePromptInput = {
  accountEnabled: boolean;
  accountInstructions: string | null;
  /** Police de lecture du compte. Absente, elle vaut sans. */
  defaultFont?: PageFont;
  intent: "edit" | "propose";
  pagePrompt: string | null;
  projectInstructions: string | null;
  /** Bloc déjà composé par buildMemoryContext, ou null. */
  memoryBlock?: string | null;
  selection: string | null;
  /** Ancrage de la sélection (offsets dans le contenu), ou null. */
  selectionAnchor?: { end: number; start: number } | null;
};

const BASE = [
  "Tu es mAI, l'assistant d'édition d'une page Markdown.",
  "Tu réponds en français. Tu n'inventes pas de contenu hors de la page, de la sélection et de ce que l'utilisateur demande.",
  "La page est du Markdown. Tu conserves les titres, listes, tableaux, liens et blocs de code sauf demande contraire.",
  "Les formats habituels restent du Markdown : **gras**, *italique*, titres et listes.",
  "Une zone de texte peut porter une police et une couleur, et seulement ainsi :",
  '<m font="serif" tone="info">passage</m>',
  "font vaut sans, serif ou mono. tone vaut info, warning, success ou destructive. Omets l'attribut que tu ne changes pas.",
  "N'utilise aucune autre balise HTML, aucun attribut style, aucune couleur libre. Une balise <m> invalide force le mode source et abîme la page.",
  "Outils :",
  "- lire_page : lis le titre, le corps et l'empreinte avant toute modification.",
  "- modifier_page : édition ciblée, appliquée tout de suite. Réservée au mode édition.",
  "- proposer_modification : propose un patch. La page ne change qu'après acceptation.",
  "- renommer_page : change uniquement le titre.",
  "Appelle lire_page avant modifier_page ou proposer_modification : l'empreinte (baseHash) doit être celle que lire_page vient de renvoyer.",
  "Préfère des opérations ciblées (remplacer un passage, insérer, supprimer des lignes) à une réécriture entière.",
  "Un replace_text dont le texte recherché apparaît plusieurs fois sans anchor ni occurrence est REFUSÉ : ancre la sélection (anchor) ou précise l'occurrence.",
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

function fontSection(font: PageFont): string {
  return [
    "POLICE DU COMPTE",
    `La police de lecture est « ${font} ». Le texte sans balise <m> l'utilise déjà : ne réécris pas la page pour l'appliquer.`,
  ].join("\n");
}

function selectionSection(
  selection: string | null,
  selectionAnchor: { end: number; start: number } | null | undefined
): string | null {
  const text = selection?.trim();
  if (!text) {
    return null;
  }
  const clipped = text.slice(0, 8000);
  const anchorLines = selectionAnchor
    ? [
        `La sélection occupe exactement les offsets [${selectionAnchor.start}, ${selectionAnchor.end}) du contenu renvoyé par lire_page.`,
        "Pour remplacer CETTE occurrence dans un replace_text, utilise anchor: { start, end } : c'est l'ancrage, pas la première occurrence, qui doit être remplacée.",
      ]
    : [
        "La sélection n'a pas d'ancrage résoluble : si ce texte apparaît plusieurs fois, un replace_text sans occurrence sera refusé. Élargis le texte recherché ou précise l'occurrence.",
      ];
  return [
    "SÉLECTION COURANTE",
    "L'utilisateur a sélectionné ce passage. Les remplacements doivent cibler ce texte exact :",
    clipped,
    ...anchorLines,
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
    capabilitySections: [
      fontSection(normalizePageFont(input.defaultFont)),
      selectionSection(input.selection, input.selectionAnchor),
    ],
    personal,
  });
}
