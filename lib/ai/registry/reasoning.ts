// Intensité de réflexion : vocabulaire partagé par le registre de modèles, les
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
