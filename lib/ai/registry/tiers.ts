import type { ChatModel } from "@/lib/ai/models";
import { isPaidTier, type PaidTier } from "@/lib/auth/plan";

// Accès par forfait : "all" signifie « disponible pour tous les forfaits ».
// Le catalogue /v1/models est déjà filtré par le backend mAI selon la clé de
// l'utilisateur ; ces règles servent de garde côté Agent (le client ne fait
// jamais autorité) et alimentent l'UI du sélecteur de modèle.
export type ModelTierAccess = PaidTier[] | "all";

export const MODEL_TIER_ACCESS_OVERRIDES: Record<string, ModelTierAccess> = {};

export function getModelTierAccess(modelId: string): ModelTierAccess {
  return MODEL_TIER_ACCESS_OVERRIDES[modelId] ?? "all";
}

export function isModelAllowedForTier(
  modelId: string,
  tier: string | null | undefined
): boolean {
  const access = getModelTierAccess(modelId);
  if (access === "all") {
    return true;
  }
  const normalized = (tier || "free").toLowerCase().trim();
  if (!isPaidTier(normalized)) {
    return false;
  }
  return access.includes(normalized as PaidTier);
}

export function filterModelsForTier(
  models: ChatModel[],
  tier: string | null | undefined
): ChatModel[] {
  return models.filter((model) => isModelAllowedForTier(model.id, tier));
}
