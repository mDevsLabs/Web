// Réflexion : vocabulaire partagé par le registre de modèles, les paramètres
// Agent et les routes API.
// paramètres Agent et les routes API.
//
// CONTRAT CONFIRMÉ. Le proxy mAI (models.ts, hors de ce dépôt) relaie la
// requête à OpenRouter, dont l'API unifiée est `reasoning: { effort }` avec
// sept niveaux : max, xhigh, high, medium, low, minimal, none. Le provider AI
// SDK sérialise l'effort sous la clé historique `reasoning_effort` ; c'est le
// proxy qui la traduit en `reasoning: { effort }` au moment du relais, un seul
// point de contrôle pour les trois routes.
//
// La liste des niveaux disponibles n'est PLUS écrite ici : elle est lue dans le
// catalogue (`GET /v1/models` → `reasoning.supported_efforts`). Ce fichier ne
// définit plus que l'ordre canonique — du plus coûteux au moins coûteux — dont on
// se sert pour recadrer une préférence qui ne conviendrait pas au modèle actif.

/**
 * Niveaux d'effort reconnus, du plus intense au plus faible.
 *
 * L'ordre est significatif : `resolveReasoningEffort` s'en sert pour retomber
 * sur le niveau le plus proche *en dessous* de la préférence quand le modèle
 * sélectionné ne l'accepte pas. Ajouter un niveau ici est sans risque — un
 * modèle ne peut exposer que des valeurs déjà listées ici.
 */
export const REASONING_LEVELS = [
  "max",
  "xhigh",
  "high",
  "medium",
  "low",
  "minimal",
  "none",
] as const;

export type ReasoningLevel = (typeof REASONING_LEVELS)[number];

export const DEFAULT_REASONING_LEVEL: ReasoningLevel = "medium";

export const REASONING_LEVEL_LABELS: Record<ReasoningLevel, string> = {
  high: "Élevée",
  low: "Faible",
  max: "Maximale",
  medium: "Moyenne",
  minimal: "Minimale",
  none: "Désactivée",
  xhigh: "Très élevée",
};

export const REASONING_LEVEL_DESCRIPTIONS: Record<ReasoningLevel, string> = {
  high: "Réflexion approfondie, plus lente et plus coûteuse en tokens.",
  low: "Réponse directe, la plus rapide et la moins coûteuse.",
  max: "Réflexion maximale : la plus longue, la plus coûteuse en tokens.",
  medium: "Équilibre entre profondeur d'analyse et rapidité.",
  minimal: "Presque pas de réflexion, uniquement le strict nécessaire.",
  none: "Aucune réflexion : le modèle répond directement.",
  xhigh:
    "Plus intense qu'élevée, pour les analyses qui ne tolèrent pas l'à-peu-près.",
};

export function isReasoningLevel(value: unknown): value is ReasoningLevel {
  return (
    typeof value === "string" &&
    (REASONING_LEVELS as readonly string[]).includes(value)
  );
}

export function normalizeReasoningLevel(
  value: unknown,
  fallback: ReasoningLevel = DEFAULT_REASONING_LEVEL
): ReasoningLevel {
  return isReasoningLevel(value) ? value : fallback;
}

/**
 * Niveaux dans l'ordre d'un curseur de volume : du moins intense au plus intense.
 *
 * `REASONING_LEVELS` est décroissant (max → none) parce qu'on s'en sert pour
 * recadrer une préférence vers le bas. C'est le bon ordre pour le *repli*, et le
 * mauvais pour l'*affichage* : une piste qui va de « Maximale » à « Désactivée »
 * de gauche à droite se lit à l'envers de toute la réactivité de l'interface.
 * On inverse donc une fois, ici, plutôt que d'inverser six calculs dans le
 * composant.
 */
export function toAscendingLevels(
  levels: readonly ReasoningLevel[]
): ReasoningLevel[] {
  return [...levels].reverse();
}

/**
 * Position normalisée d'un niveau sur une piste ascendante : 0 = niveau le plus
 * faible (à gauche), 1 = niveau le plus intense (à droite).
 *
 * Une piste d'un seul cran n'a pas de géométrie — le composant la traite à part.
 * Un niveau absent de la liste vaut 0 : la position n'est jamais inventée.
 */
export function levelToRatio(
  ascending: readonly ReasoningLevel[],
  level: ReasoningLevel
): number {
  if (ascending.length < 2) {
    return 0;
  }
  const index = ascending.indexOf(level);
  if (index < 0) {
    return 0;
  }
  return index / (ascending.length - 1);
}

/**
 * Niveau le plus proche d'une position normalisée — ce que fait un geste sur la
 * piste.
 *
 * La position est bornée avant l'arrondi : un clic dans le padding, ou un
 * glissement de quelques pixels hors piste, ne doit pas pouvoir sortir du
 * vocabulaire. Seul `NaN` est ramené au bord gauche ; les infinis sont des
 * positions « au bout de la piste » et se bornent normalement.
 */
export function ratioToLevel(
  ascending: readonly ReasoningLevel[],
  ratio: number
): ReasoningLevel | undefined {
  if (ascending.length === 0) {
    return;
  }
  if (ascending.length === 1) {
    return ascending[0];
  }
  const finite = Number.isNaN(ratio) ? 0 : ratio;
  const bounded = Math.min(1, Math.max(0, finite));
  const target = Math.round(bounded * (ascending.length - 1));
  return ascending[target];
}

// Options du provider, structurellement compatibles avec `providerOptions` des
// appels generateText/streamText (valeurs JSON scalaires).
export type ReasoningProviderOptions = Record<
  string,
  Record<string, string | number | boolean | null>
>;

/**
 * Options provider pour un niveau donné.
 *
 * Le provider AI SDK valide `reasoningEffort` contre un enum qui contient
 * exactement ces sept valeurs : un niveau non supporté est donc retiré du corps
 * de la requête avant l'envoi, plutôt que d'être rejeté par le fournisseur.
 */
export function resolveReasoningProviderOptions(
  level: ReasoningLevel
): ReasoningProviderOptions {
  return { openai: { reasoningEffort: level } };
}
