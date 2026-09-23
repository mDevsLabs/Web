import { createOpenAI } from "@ai-sdk/openai";
import { MAI_API_URL } from "../constants";
import { titleModel } from "./models";
import { filterModelsForTier } from "./registry/tiers";

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
  }
) {
  const effectiveKey =
    options?.apiKey ||
    options?.sessionToken ||
    process.env.MAI_API_KEY ||
    "mai-web-default";

  const headers: Record<string, string> = {
    "HTTP-Referer": "https://mai.val.run",
    "X-Title": "mAI Web",
  };

  if (options?.userId) {
    headers["x-user-id"] = options.userId;
  }

  const maiBaseUrl = MAI_API_URL.endsWith("/v1")
    ? MAI_API_URL
    : `${MAI_API_URL.replace(/\/+$/, "")}/v1`;

  const maiClient = createOpenAI({
    apiKey: effectiveKey,
    baseURL: maiBaseUrl,
    fetch: async (url, init) => {
      let urlStr = url.toString();
      if (
        urlStr.includes("/chat/completions") &&
        !urlStr.includes("/v1/chat/completions")
      ) {
        urlStr = urlStr.replace("/chat/completions", "/v1/chat/completions");
      }
      return await fetch(urlStr, init);
    },
    headers,
  });

  return maiClient.chat(modelId);
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
