import { createOpenAI } from "@ai-sdk/openai";
import { titleModel } from "./models";
import type { ReasoningDetailsSink } from "./reasoning-details";
import { filterModelsForTier } from "./registry/tiers";

// Alias cloud mAI -> modèles backing OpenRouter réels
const MAI_BACKING_MODELS: Record<string, string> = {
  "mai-2": "deepseek/deepseek-v4.1-flash",
  "mai-2-mini": "minimax/minimax-m3",
  "mai-2.5-apex": "openai/gpt-6.1-terra",
  "mai-2.5-omni": "openai/gpt-6-luna",
  "mai-2.5-opal": "openai/gpt-6.1-sol",
  "mdevslabs/mai-2": "deepseek/deepseek-v4.1-flash",
  "mdevslabs/mai-2-mini": "minimax/minimax-m3",
  "mdevslabs/mai-2.5-apex": "openai/gpt-6.1-terra",
  "mdevslabs/mai-2.5-omni": "openai/gpt-6-luna",
  "mdevslabs/mai-2.5-opal": "openai/gpt-6.1-sol",
};

// Résout un identifiant de modèle utilitaire (titres, résumés, planification)
// vers un modèle réellement accessible au forfait de l'utilisateur. Sans cela,
// un compte Free recevait un refus backend (model_access_denied) pour chaque
// tâche interne envoyée à un modèle payant, alors même que sa conversation
// utilise un modèle gratuit.
export function resolveTierCompatibleModelId(
  fallbackModelId: string,
  tier?: string | null
): string {
  if (!tier) {
    return fallbackModelId;
  }
  const accessible = filterModelsForTier(
    [{ id: fallbackModelId } as any],
    tier
  );
  if (accessible.length > 0) {
    return fallbackModelId;
  }
  const firstFree = filterModelsForTier(
    [
      { id: "google/gemini-2.5-flash:free" },
      { id: "google/gemini-2.5-flash-lite:free" },
    ] as any[],
    tier
  );
  return firstFree[0]?.id ?? fallbackModelId;
}

export function getLanguageModel(
  modelId: string,
  options?: {
    apiKey?: string | null;
    sessionToken?: string | null;
    userId?: string | null;
    /**
     * Collecteur de `reasoning_details`. Transmis explicitement par l'appelant :
     * un module mutable partagé enverrait le raisonnement d'une requête chez
     * une autre requête concurrente.
     */
    reasoningSink?: ReasoningDetailsSink;
  }
) {
  const effectiveKey =
    process.env.OPENROUTER_API_KEY ||
    (options?.apiKey?.startsWith("sk-or-") ? options.apiKey : "") ||
    options?.apiKey ||
    options?.sessionToken ||
    process.env.MAI_API_KEY;

  if (!effectiveKey) {
    throw new Error(
      "Aucun identifiant d'API disponible : OPENROUTER_API_KEY, session ou clé API absente."
    );
  }

  const headers: Record<string, string> = {
    "HTTP-Referer": "https://mai.mdevs.fr",
    "X-Title": "mAI Web",
  };

  if (options?.userId) {
    headers["x-user-id"] = options.userId;
  }

  // Redirection directe vers OpenRouter API v1 (sans passer par Val Town)
  const openRouterBaseUrl =
    process.env.OPENROUTER_BASE_URL?.replace(/\/+$/, "") ||
    "https://openrouter.ai/api/v1";

  const reasoningSink = options?.reasoningSink;
  const targetModelId =
    MAI_BACKING_MODELS[modelId.toLowerCase().trim()] || modelId;

  const maiClient = createOpenAI({
    apiKey: effectiveKey,
    baseURL: openRouterBaseUrl,
    fetch: async (url, init) => {
      let urlStr = url.toString();
      if (
        urlStr.includes("/chat/completions") &&
        !urlStr.includes("/v1/chat/completions")
      ) {
        urlStr = urlStr.replace("/chat/completions", "/v1/chat/completions");
      }
      const response = await fetch(urlStr, init);
      // Le provider ignore les blocs de raisonnement : c'est le dernier point
      // où le flux passe intact, donc le seul endroit où les capturer.
      return reasoningSink ? reasoningSink.attach(response) : response;
    },
    headers,
  });

  return maiClient.chat(targetModelId);
}

export function getTitleModel(options?: {
  apiKey?: string | null;
  sessionToken?: string | null;
  userId?: string | null;
  tier?: string | null;
}) {
  return getLanguageModel(
    resolveTierCompatibleModelId(titleModel.id, options?.tier),
    options
  );
}

// Modèle utilitaire (titres, plans, compaction, routage d'outils) résolu selon
// le forfait de l'utilisateur : évite les refus backend pour les comptes Free
// tout en réutilisant le cache de session (aucun appel réseau supplémentaire).
export async function getUtilityModel(options?: {
  apiKey?: string | null;
  sessionToken?: string | null;
  userId?: string | null;
}) {
  const { getMaiUser } = await import("@/lib/auth/session");
  const maiUser = options?.sessionToken
    ? await getMaiUser(options.sessionToken).catch(() => null)
    : null;
  return getLanguageModel(
    resolveTierCompatibleModelId(titleModel.id, maiUser?.tier),
    options
  );
}
