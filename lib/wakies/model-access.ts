import "server-only";

/** La sélection persistée ne peut pas introduire un modèle absent du catalogue mAI. L'API amont reste l'autorité finale. */
import { fetchUserModels } from "@/lib/ai/models.server";
import { isModelAllowedForTier } from "@/lib/ai/registry/tiers";
import { errorResponse } from "@/lib/api/error-response";
export async function validateWakiesModel(
  model: string | null | undefined,
  tier: string
): Promise<Response | null> {
  if (!model) return null;
  const models = await fetchUserModels();
  return models.some((candidate) => candidate.id === model) &&
    isModelAllowedForTier(model, tier)
    ? null
    : errorResponse("access_denied", {
        message: "Ce modèle n’est pas disponible pour votre compte mAI.",
      });
}
