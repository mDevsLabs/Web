import { createOpenAI } from "@ai-sdk/openai";
import { injectMaiIdentityPrompt } from "@/mai-identity";
import { titleModel } from "./models";
import type { ReasoningDetailsSink } from "./reasoning-details";
import { filterModelsForTier } from "./registry/tiers";

// Alias cloud mAI -> modèles backing OpenRouter réels
export const MAI_BACKING_MODELS: Record<string, string> = {
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

// Modèles OpenRouter qui n'acceptent pas temperature / top_p (rejet HTTP 400).
// Le provider @ai-sdk/openai ne les reconnaît pas à cause du préfixe `openai/`.
const NO_SAMPLING_MODELS = new Set([
  "openai/gpt-6.1-sol",
  "openai/gpt-6.1-terra",
  "openai/gpt-6-luna",
]);

function isNoSamplingModel(targetModelId: string): boolean {
  const lower = targetModelId.toLowerCase().trim();
  if (NO_SAMPLING_MODELS.has(lower)) {
    return true;
  }
  return /^openai\/o[134](-|$)/.test(lower);
}

/**
 * Résout l'identifiant réel OpenRouter pour un modèle demandé (alias mAI ou
 * identifiant OpenRouter direct).
 */
export function resolveOpenRouterModelId(modelId: string): string {
  const normalized = modelId.toLowerCase().trim();
  return MAI_BACKING_MODELS[normalized] || modelId.trim();
}

/**
 * Normalise un corps de requête `/chat/completions` avant envoi direct à
 * OpenRouter :
 * - injecte le prompt d'identité mAI pour les alias souverains ;
 * - traduit `reasoning_effort` (émis par @ai-sdk/openai) vers le format unifié
 *   OpenRouter `reasoning: { effort }` afin d'éviter les rejets HTTP 400 sur
 *   les modèles qui n'acceptent pas `reasoning_effort` (ex. MiniMax M3, Gemini) ;
 * - retire `temperature` et `top_p` sur les modèles qui refusent ces paramètres.
 */
export function prepareOpenRouterRequestBody(
  rawBody: Record<string, unknown>,
  requestedModelId: string,
  targetModelId: string
): Record<string, unknown> {
  const body: Record<string, unknown> = { ...rawBody };

  // Traduction `reasoning_effort` -> `reasoning: { effort }` (contrat OpenRouter).
  if ("reasoning_effort" in body) {
    const effort = body.reasoning_effort;
    delete body.reasoning_effort;
    if (
      typeof effort === "string" &&
      effort.trim().length > 0 &&
      effort !== "none" &&
      !("reasoning" in body)
    ) {
      body.reasoning = { effort: effort.trim() };
    }
  }

  // Certains modèles OpenRouter (GPT-6 / o-series) refusent temperature/top_p.
  if (isNoSamplingModel(targetModelId)) {
    delete body.temperature;
    delete body.top_p;
  }

  // Prompt système d'identité souverain pour les alias mAI-2 / mAI-2.5.
  return injectMaiIdentityPrompt(body, requestedModelId, "openai");
}

function isOpenRouterHost(baseUrl: string): boolean {
  try {
    const { hostname } = new URL(baseUrl);
    return hostname === "openrouter.ai" || hostname.endsWith(".openrouter.ai");
  } catch {
    return true;
  }
}

function isValidUrlCitationAnnotation(item: unknown): boolean {
  if (!item || typeof item !== "object") {
    return false;
  }
  const candidate = item as {
    type?: unknown;
    url_citation?: {
      end_index?: unknown;
      start_index?: unknown;
      title?: unknown;
      url?: unknown;
    };
  };
  return (
    candidate.type === "url_citation" &&
    Boolean(candidate.url_citation) &&
    typeof candidate.url_citation?.url === "string" &&
    typeof candidate.url_citation?.title === "string" &&
    typeof candidate.url_citation?.start_index === "number" &&
    typeof candidate.url_citation?.end_index === "number"
  );
}

/**
 * Normalise un objet JSON issu d'une ligne SSE `data: {...}` d'OpenRouter pour
 * respecter le schéma Zod strict de `@ai-sdk/openai` (`openaiChatChunkSchema`).
 *
 * Plusieurs fournisseurs routés par OpenRouter (Baidu ERNIE, MiniMax, DeepSeek,
 * Qwen…) émettent `delta.role: ""`, omettent `choices[i].index` ou
 * `tool_calls[j].index`, ou ajoutent des `annotations` non standard, ce qui
 * provoquait un rejet immédiat `AI_TypeValidationError` côté SDK avant tout
 * affichage de réponse.
 */
export function normalizeOpenRouterSsePayload(rawPayload: string): string {
  const trimmed = rawPayload.trim();
  if (!trimmed || trimmed === "[DONE]") {
    return rawPayload;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return rawPayload;
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return rawPayload;
  }

  const record = parsed as Record<string, unknown>;
  if (!Array.isArray(record.choices)) {
    return rawPayload;
  }

  let mutated = false;
  const normalizedChoices = record.choices.map((choice, choiceIndex) => {
    if (!choice || typeof choice !== "object") {
      return choice;
    }
    const nextChoice = { ...(choice as Record<string, unknown>) };
    if (typeof nextChoice.index !== "number") {
      nextChoice.index = choiceIndex;
      mutated = true;
    }

    if (
      nextChoice.finish_reason !== undefined &&
      nextChoice.finish_reason !== null &&
      typeof nextChoice.finish_reason !== "string"
    ) {
      nextChoice.finish_reason = String(nextChoice.finish_reason);
      mutated = true;
    }

    if (nextChoice.delta && typeof nextChoice.delta === "object") {
      const nextDelta = { ...(nextChoice.delta as Record<string, unknown>) };

      if ("role" in nextDelta) {
        if (
          nextDelta.role === "" ||
          nextDelta.role === null ||
          nextDelta.role === undefined
        ) {
          delete nextDelta.role;
          mutated = true;
        } else if (nextDelta.role !== "assistant") {
          nextDelta.role = "assistant";
          mutated = true;
        }
      }

      if (Array.isArray(nextDelta.content)) {
        nextDelta.content = nextDelta.content
          .map((part) => {
            if (typeof part === "string") {
              return part;
            }
            if (
              part &&
              typeof part === "object" &&
              typeof (part as { text?: unknown }).text === "string"
            ) {
              return (part as { text: string }).text;
            }
            return "";
          })
          .join("");
        mutated = true;
      }

      if (Array.isArray(nextDelta.tool_calls)) {
        nextDelta.tool_calls = nextDelta.tool_calls.map((tc, tcIndex) => {
          if (!tc || typeof tc !== "object") {
            return tc;
          }
          const nextTc = { ...(tc as Record<string, unknown>) };
          if (typeof nextTc.index !== "number") {
            nextTc.index = tcIndex;
            mutated = true;
          }
          if (nextTc.type !== undefined && nextTc.type !== "function") {
            nextTc.type = "function";
            mutated = true;
          }
          return nextTc;
        });
      }

      if ("annotations" in nextDelta) {
        if (Array.isArray(nextDelta.annotations)) {
          const validAnnotations = nextDelta.annotations.filter(
            isValidUrlCitationAnnotation
          );
          if (validAnnotations.length === 0) {
            delete nextDelta.annotations;
            mutated = true;
          } else if (validAnnotations.length !== nextDelta.annotations.length) {
            nextDelta.annotations = validAnnotations;
            mutated = true;
          }
        } else if (nextDelta.annotations !== null) {
          delete nextDelta.annotations;
          mutated = true;
        }
      }

      nextChoice.delta = nextDelta;
    }

    return nextChoice;
  });

  if (!mutated) {
    return rawPayload;
  }

  return JSON.stringify({
    ...record,
    choices: normalizedChoices,
  });
}

function normalizeSseLine(line: string): string {
  const hasCarriageReturn = line.endsWith("\r");
  const cleanLine = hasCarriageReturn ? line.slice(0, -1) : line;
  if (!cleanLine.startsWith("data:")) {
    return line;
  }
  const payload = cleanLine.slice(5);
  const leadingSpace = payload.startsWith(" ") ? " " : "";
  const normalized = normalizeOpenRouterSsePayload(payload);
  if (normalized === payload) {
    return line;
  }
  return `data:${leadingSpace}${normalized.trim()}${hasCarriageReturn ? "\r" : ""}`;
}

export function normalizeOpenRouterSseResponse(response: Response): Response {
  if (!response.body) {
    return response;
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = "";

  const transformed = response.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      flush(controller) {
        buffer += decoder.decode();
        if (buffer.length > 0) {
          controller.enqueue(encoder.encode(normalizeSseLine(buffer)));
          buffer = "";
        }
      },
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        if (lines.length === 0) {
          return;
        }
        const output = `${lines.map(normalizeSseLine).join("\n")}\n`;
        controller.enqueue(encoder.encode(output));
      },
    })
  );

  return new Response(transformed, {
    headers: response.headers,
    status: response.status,
    statusText: response.statusText,
  });
}

/**
 * Résout la clé Bearer à utiliser vers OpenRouter.
 *
 * Vers `openrouter.ai`, seule une vraie clé OpenRouter (`OPENROUTER_API_KEY` ou
 * clé utilisateur `sk-or-…`) est acceptée : envoyer un JWT de session mAI ou
 * une clé `mai_…` produirait systématiquement une erreur HTTP 401 muette.
 */
export function resolveOpenRouterApiKey(options?: {
  apiKey?: string | null;
  baseUrl?: string;
  sessionToken?: string | null;
}): string {
  const envOpenRouterKey = process.env.OPENROUTER_API_KEY?.trim() || "";
  const userOpenRouterKey = options?.apiKey?.trim().startsWith("sk-or-")
    ? options.apiKey.trim()
    : "";

  if (envOpenRouterKey) {
    return envOpenRouterKey;
  }
  if (userOpenRouterKey) {
    return userOpenRouterKey;
  }

  const baseUrl =
    options?.baseUrl ||
    process.env.OPENROUTER_BASE_URL?.replace(/\/+$/, "") ||
    "https://openrouter.ai/api/v1";

  if (isOpenRouterHost(baseUrl)) {
    throw new Error(
      "Clé API OpenRouter manquante : configurez OPENROUTER_API_KEY sur cette instance."
    );
  }

  const fallbackKey =
    options?.apiKey?.trim() ||
    options?.sessionToken?.trim() ||
    process.env.MAI_API_KEY?.trim() ||
    "";

  if (!fallbackKey) {
    throw new Error(
      "Aucun identifiant d'API disponible : OPENROUTER_API_KEY, session ou clé API absente."
    );
  }
  return fallbackKey;
}

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
      { id: "mai-2-mini" },
      { id: "google/gemma-4-26b-a4b-it:free" },
      { id: "nvidia/nemotron-3.5-lightning:free" },
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
  // Redirection directe vers OpenRouter API v1 (sans passer par Val Town)
  const openRouterBaseUrl =
    process.env.OPENROUTER_BASE_URL?.replace(/\/+$/, "") ||
    "https://openrouter.ai/api/v1";

  const effectiveKey = resolveOpenRouterApiKey({
    apiKey: options?.apiKey,
    baseUrl: openRouterBaseUrl,
    sessionToken: options?.sessionToken,
  });

  const headers: Record<string, string> = {
    "HTTP-Referer": "https://mai.mdevs.fr",
    "X-Title": "mAI Web",
  };

  if (options?.userId && !isOpenRouterHost(openRouterBaseUrl)) {
    headers["x-user-id"] = options.userId;
  }

  const reasoningSink = options?.reasoningSink;
  const targetModelId = resolveOpenRouterModelId(modelId);

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

      let nextInit = init;
      let normalizedBody: Record<string, unknown> | null = null;
      let isStreamingRequest = false;
      if (typeof init?.body === "string") {
        try {
          const parsed = JSON.parse(init.body) as Record<string, unknown>;
          isStreamingRequest = parsed.stream === true;
          normalizedBody = prepareOpenRouterRequestBody(
            parsed,
            modelId,
            targetModelId
          );
          nextInit = { ...init, body: JSON.stringify(normalizedBody) };
        } catch {
          // Corps non-JSON : transmis tel quel.
        }
      }

      let response = await fetch(urlStr, nextInit);
      if (
        response.status === 400 &&
        normalizedBody &&
        ("reasoning" in normalizedBody ||
          "temperature" in normalizedBody ||
          "top_p" in normalizedBody)
      ) {
        const strippedBody = { ...normalizedBody };
        delete strippedBody.reasoning;
        delete strippedBody.temperature;
        delete strippedBody.top_p;
        console.warn(
          `[openrouter] retry_without_optional_params requestedModel=${modelId} targetModel=${targetModelId}`
        );
        response = await fetch(urlStr, {
          ...init,
          body: JSON.stringify(strippedBody),
        });
      }

      if (!response.ok) {
        const preview = await response
          .clone()
          .text()
          .then((txt) => txt.slice(0, 400))
          .catch(() => "");
        console.error(
          `[openrouter] upstream_error status=${response.status} requestedModel=${modelId} targetModel=${targetModelId} body=${preview}`
        );
        return response;
      }

      // Le provider ignore les blocs de raisonnement : c'est le dernier point
      // où le flux passe intact, donc le seul endroit où les capturer.
      const withReasoning = reasoningSink
        ? reasoningSink.attach(response)
        : response;
      const contentType = (
        withReasoning.headers.get("content-type") ?? ""
      ).toLowerCase();
      if (
        contentType.includes("text/event-stream") ||
        (isStreamingRequest && !contentType.includes("application/json"))
      ) {
        return normalizeOpenRouterSseResponse(withReasoning);
      }
      return withReasoning;
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
