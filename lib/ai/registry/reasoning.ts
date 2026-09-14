// Intensité de réflexion : vocabulaire partagé par le registre de modèles,
// les paramètres Agent et les routes API.
//
// IMPORTANT — contrat amont non confirmé : le proxy mAI (mai.val.run, hors de
// ce dépôt) expose bien des modèles déclarés compatibles « thinking/reasoning »
// (voir models.ts et maiModels.ts, qui ne font que déclarer la capacité), mais
// aucun code du dépôt ne contractualise le nom du paramètre transmis. Tant que
// REASONING_CONTRACT_CONFIRMED est false, aucune option n'est envoyée au modèle
// et le sélecteur reste masqué (flag `agent.reasoning`). Le branchement se fait
// alors en renseignant la table REASONING_PARAM_MAPPINGS, sans toucher au reste.

export const REASONING_LEVELS = ["low", "medium", "high"] as const;

export type ReasoningLevel = (typeof REASONING_LEVELS)[number];

export const DEFAULT_REASONING_LEVEL: ReasoningLevel = "medium";

export const REASONING_LEVEL_LABELS: Record<ReasoningLevel, string> = {
  high: "Élevée",
  low: "Faible",
  medium: "Moyenne",
};

export const REASONING_LEVEL_DESCRIPTIONS: Record<ReasoningLevel, string> = {
  high: "Réflexion approfondie, plus lente et plus coûteuse en tokens.",
  low: "Réponse directe, la plus rapide et la moins coûteuse.",
  medium: "Équilibre entre profondeur d'analyse et rapidité.",
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

export type ReasoningParamMapping = {
  providerOptions: ReasoningProviderOptions;
};

export const REASONING_CONTRACT_CONFIRMED = false;

// Exemple de mapping une fois le contrat confirmé côté backend :
//   "google/gemini-2.5-flash": OPENAI_COMPATIBLE_REASONING_EFFORT,
export const OPENAI_COMPATIBLE_REASONING_EFFORT: Record<
  ReasoningLevel,
  ReasoningParamMapping
> = {
  high: { providerOptions: { openai: { reasoningEffort: "high" } } },
  low: { providerOptions: { openai: { reasoningEffort: "low" } } },
  medium: { providerOptions: { openai: { reasoningEffort: "medium" } } },
};

export const REASONING_PARAM_MAPPINGS: Record<
  string,
  Record<ReasoningLevel, ReasoningParamMapping>
> = {};

export function resolveReasoningProviderOptions(
  modelId: string,
  level: ReasoningLevel
): ReasoningProviderOptions | undefined {
  if (!REASONING_CONTRACT_CONFIRMED) {
    return;
  }
  return REASONING_PARAM_MAPPINGS[modelId]?.[level]?.providerOptions;
}
