import {
  type ModelCapabilities,
  REASONING_LEVELS,
  type ReasoningLevel,
} from "@/lib/ai/registry";

// Niveaux d'effort proposés dans l'interface.
//
// Règle unique, partagée par les paramètres Agent et le sélecteur du composer :
// on n'affiche JAMAIS une liste de niveaux écrite à la main. Ce qui est proposé
// vient des capacités du modèle, lues dans le catalogue. Un modèle peut exposer
// trois niveaux, cinq, ou aucun ; l'interface suit, sans code à modifier.

export type ReasoningModelLike = {
  capabilities: Pick<
    ModelCapabilities,
    "reasoning" | "reasoningDefault" | "reasoningLevels" | "reasoningMandatory"
  >;
  id: string;
  name?: string;
};

export type ReasoningOptions = {
  /** Le niveau appliqué quand l'utilisateur n'a rien choisi d'explicitement. */
  defaultLevel: ReasoningLevel | null;
  /** Le modèle ne peut pas produire de réponse sans raisonner. */
  mandatory: boolean;
  /**
   * `true` quand aucun modèle de repli n'est choisi : la préférence est alors
   * recalée sur le modèle de chaque conversation, et l'ensemble des niveaux
   * possibles est l'union de ce que le catalogue propose.
   */
  isAutomatic: boolean;
  /** Niveaux réellement proposables, dans l'ordre canonique. */
  levels: ReasoningLevel[];
  /** Modèle dont les capacités pilotent l'affichage, le cas échéant. */
  modelId: string | null;
  /** Aucun modèle ne propose de niveaux : masquer le sélecteur. */
  isEmpty: boolean;
};

function levelsOf(
  capabilities: Pick<ModelCapabilities, "reasoningLevels">
): ReasoningLevel[] {
  return capabilities.reasoningLevels.filter((level) =>
    REASONING_LEVELS.includes(level)
  );
}

/**
 * Niveaux à proposer pour un choix de modèle donné.
 *
 * - Modèle de repli choisi : exactement ses niveaux. Proposer « max » pour un
 *   modèle qui ne l'accepte pas enverrait une requête refusée à chaque tour.
 * - Aucun modèle choisi (« Automatique ») : l'union de ce que propose le
 *   catalogue, triée dans l'ordre canonique. C'est la sémantique réelle de la
 *   préférence enregistrée — une intention, recalée sur le modèle de chaque
 *   conversation — et non un engagement de coût.
 */
export function resolveReasoningOptions(params: {
  models: readonly ReasoningModelLike[];
  selectedModelId?: string | null;
}): ReasoningOptions {
  const { models, selectedModelId } = params;

  if (selectedModelId) {
    const selected = models.find((model) => model.id === selectedModelId);
    if (selected) {
      const levels = levelsOf(selected.capabilities);
      return {
        defaultLevel: selected.capabilities.reasoningDefault,
        isAutomatic: false,
        isEmpty: !selected.capabilities.reasoning || levels.length === 0,
        levels,
        mandatory: selected.capabilities.reasoningMandatory,
        modelId: selected.id,
      };
    }
  }

  // Mode automatique : union des niveaux, dans l'ordre canonique (max → none)
  // pour que le plus intense reste en premier quel que soit l'ordre du
  // catalogue.
  const union = new Set<ReasoningLevel>();
  let anyReasoning = false;
  for (const model of models) {
    if (!model.capabilities.reasoning) {
      continue;
    }
    anyReasoning = true;
    for (const level of levelsOf(model.capabilities)) {
      union.add(level);
    }
  }
  const levels = REASONING_LEVELS.filter((level) => union.has(level));

  return {
    defaultLevel: null,
    isAutomatic: true,
    isEmpty: !anyReasoning || levels.length === 0,
    levels,
    mandatory: false,
    modelId: null,
  };
}
