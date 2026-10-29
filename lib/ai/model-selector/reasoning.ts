/**
 * Niveau d'effort de réflexion à afficher comme actif pour un modèle donné.
 *
 * La préférence globale ne s'applique que si le modèle accepte ce niveau :
 * mAI-2 expose `max | high | low` et n'a donc aucun « medium ». Sans ce repli,
 * aucun bouton n'apparaîtrait actif, alors que le fournisseur, lui, a un
 * défaut (`high`).
 */

import type { ModelCapabilities } from "@/lib/ai/models";
import {
  isReasoningLevel,
  type ReasoningLevel,
} from "@/lib/ai/registry/reasoning";
import type { SharedModel } from "./types";

export function displayedReasoningLevel(
  model: SharedModel,
  capabilities: ModelCapabilities | undefined,
  preferred: unknown
): ReasoningLevel | undefined {
  const extended = capabilities as
    | (ModelCapabilities & {
        reasoningDefault?: ReasoningLevel | null;
        reasoningLevels?: ReasoningLevel[];
      })
    | undefined;
  const levels = extended?.reasoningLevels?.length
    ? extended.reasoningLevels
    : (model.reasoning?.supported_efforts ?? []).filter(
        (level): level is ReasoningLevel => isReasoningLevel(level)
      );
  if (isReasoningLevel(preferred) && levels.includes(preferred)) {
    return preferred;
  }
  const fallback =
    extended?.reasoningDefault ?? model.reasoning?.default_effort;
  if (isReasoningLevel(fallback) && levels.includes(fallback)) {
    return fallback;
  }
  // Liste ordonnée du plus intense au moins intense : le dernier est le moins
  // coûteux, jamais le premier.
  return levels.at(-1);
}

/**
 * Niveaux d'effort réellement acceptés par un modèle.
 *
 * Trois sources, par ordre de fiabilité : les capacités enrichies du registre,
 * puis la déclaration du fournisseur sur le modèle, puis les ids mAI-2
 * (connus sans métadonnée).
 */
export function supportedReasoningLevels(
  model: SharedModel,
  capabilities: ModelCapabilities | undefined
): ReasoningLevel[] {
  const fromCaps = (capabilities as any)?.reasoningLevels;
  if (Array.isArray(fromCaps) && fromCaps.length > 0) {
    return fromCaps.filter((l): l is ReasoningLevel => isReasoningLevel(l));
  }
  const fromModel = model.reasoning?.supported_efforts;
  if (Array.isArray(fromModel) && fromModel.length > 0) {
    return fromModel.filter((l): l is ReasoningLevel => isReasoningLevel(l));
  }
  const idLower = (model.id || "").toLowerCase();
  if (
    idLower === "mai-2-mini" ||
    idLower.endsWith("/mai-2-mini") ||
    idLower === "mai-2" ||
    idLower.endsWith("/mai-2")
  ) {
    return ["max", "high", "low"] as ReasoningLevel[];
  }
  return [];
}
