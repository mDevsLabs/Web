import { createOpenAI } from "@ai-sdk/openai";
import { MAI_API_URL } from "../constants";
import { titleModel } from "./models";
import type { ReasoningDetailsSink } from "./reasoning-details";
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
    /**
     * Collecteur de `reasoning_details`. Transmis explicitement par l'appelant :
     * un module mutable partagé enverrait le raisonnement d'une requête chez
     * une autre requête concurrente.
     */
    reasoningSink?: ReasoningDetailsSink;
  }
) {
  const effectiveKey =
    options?.apiKey || options?.sessionToken || process.env.MAI_API_KEY;

  // Aucun repli sur une chaîne littérale partagée. Un identifiant statique
  // « par défaut » est inoffensif tant que le backend le refuse, mais il
  // transforme une configuration absente en tentative d'appel authentifiée : il
  // suffit qu'un jour le backend l'accepte pour obtenir des appels modèle
  // non facturés. Une configuration manquante doit échouer franchement.
  if (!effectiveKey) {
    throw new Error(
      "Aucun identifiant d'API disponible : session absente et MAI_API_KEY non défini."
    );
  }

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

  const reasoningSink = options?.reasoningSink;

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
      const response = await fetch(urlStr, init);
      // Le provider ignore les blocs de raisonnement : c'est le dernier point
      // où le flux passe intact, donc le seul endroit où les capturer. Sans
      // collecteur, la réponse est renvoyée telle quelle — un `tee()` inutile
      // coûterait de la mémoire sur chaque appel.
      return reasoningSink ? reasoningSink.attach(response) : response;
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
