import "server-only";

import { getMaiSessionToken, getMaiUser } from "@/lib/auth/session";
import { getUserApiKey } from "@/lib/db/api-keys";
import {
  type ChatModel,
  FALLBACK_MODELS,
  formatModelName,
  isBatchModelId,
  normalizeModelDisplayName,
} from "./models";

function mapCatalogModels(rawList: unknown): ChatModel[] {
  if (!Array.isArray(rawList) || rawList.length === 0) {
    return FALLBACK_MODELS;
  }

  const seen = new Set<string>();
  const result: ChatModel[] = [];

  for (const m of rawList as any[]) {
    if (
      !m ||
      typeof m.id !== "string" ||
      !m.id ||
      isBatchModelId(m.id) ||
      seen.has(m.id)
    ) {
      continue;
    }
    seen.add(m.id);
    const { name, provider, isFree } = formatModelName(m.id);
    const displayName = normalizeModelDisplayName(m.id, m.name);
    const declaredMaxOutput =
      typeof m.maxOutput === "number" && m.maxOutput > 0
        ? m.maxOutput
        : typeof m.top_provider?.max_completion_tokens === "number" &&
            m.top_provider.max_completion_tokens > 0
          ? m.top_provider.max_completion_tokens
          : undefined;
    result.push({
      architecture: m.architecture,
      description: m.description || `Modèle ${provider}`,
      id: m.id,
      isFree: m.isFree === undefined ? isFree : m.isFree,
      maxContext: m.maxContext || m.context_length || 128_000,
      ...(declaredMaxOutput ? { maxOutput: declaredMaxOutput } : {}),
      name: displayName || name,
      provider,
      // Capacités de réflexion déclarées par le fournisseur. Sans ce champ,
      // le registre retomberait sur ses heuristiques par nom de modèle et
      // proposerait des niveaux d'effort qu'aucun modèle n'accepte.
      reasoning: m.reasoning ?? null,
      supported_parameters: m.supported_parameters,
    });
  }

  return result.length > 0 ? result : FALLBACK_MODELS;
}

type CachedCatalog = {
  expiresAt: number;
  models: ChatModel[];
};
const CATALOG_CACHE = new Map<string, CachedCatalog>();
const CATALOG_CACHE_TTL_MS = 60_000;

async function readCatalogModels(params: {
  headers: Record<string, string>;
  token: string | null;
}): Promise<ChatModel[] | null> {
  const cacheKey = `${params.token || "anonymous"}:${params.headers["x-user-id"] || "none"}`;
  const cached = CATALOG_CACHE.get(cacheKey);
  const now = Date.now();
  if (cached && now < cached.expiresAt) {
    return cached.models;
  }

  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const json = await res.json();
      const rawList = Array.isArray(json.data) ? json.data : [];
      // Combiner uniquement les modèles souverains mAI avec le catalogue live OpenRouter
      const sovereignModels = FALLBACK_MODELS.filter(
        (m) => m.provider === "mdevslabs"
      );
      const mapped = mapCatalogModels([...sovereignModels, ...rawList]);
      CATALOG_CACHE.set(cacheKey, {
        expiresAt: now + CATALOG_CACHE_TTL_MS,
        models: mapped,
      });
      return mapped;
    }
  } catch {}

  return FALLBACK_MODELS;
}

export async function fetchUserModels(): Promise<ChatModel[]> {
  try {
    const user = await getMaiUser();
    let authHeader = "";

    if (user?.id) {
      const apiKey = await getUserApiKey(user.id);
      if (apiKey) {
        authHeader = `Bearer ${apiKey}`;
      }
    }

    if (!authHeader) {
      const token = await getMaiSessionToken();
      if (token) {
        authHeader = `Bearer ${token}`;
      }
    }

    const headers: Record<string, string> = {};
    if (authHeader) {
      headers.Authorization = authHeader;
    }
    if (user?.id) {
      headers["x-user-id"] = user.id;
    }

    const models = await readCatalogModels({
      headers,
      // `authHeader` est déjà préfixé par « Bearer » : c'est une clé API
      // personnelle pour les comptes qui en ont une, sinon le jeton de session.
      token: authHeader ? authHeader.replace(/^Bearer\s+/i, "") : null,
    });

    // Un catalogue illisible ne doit pas casser le sélecteur de modèle : on
    // retombe sur la liste embarquée, qui est la seule source disponible hors
    // ligne. Le repli est le comportement attendu ici, pas une erreur.
    return models ?? FALLBACK_MODELS;
  } catch (err) {
    console.error("Erreur fetchUserModels:", err);
    return FALLBACK_MODELS;
  }
}

/**
 * Catalogue pour un tick sans cookie. La planification n'a que la clé API
 * du compte et son identifiant : `fetchUserModels` lirait une session
 * absente et retomberait sur la liste embarquée, qui ne connaît pas Flint.
 */
export async function fetchModelsForUser(params: {
  apiKey: string | null;
  userId: string;
}): Promise<ChatModel[]> {
  try {
    const headers: Record<string, string> = {};
    if (params.userId) {
      headers["x-user-id"] = params.userId;
    }
    const models = await readCatalogModels({
      headers,
      token: params.apiKey,
    });
    return models ?? FALLBACK_MODELS;
  } catch (err) {
    console.error("Erreur fetchModelsForUser:", err);
    return FALLBACK_MODELS;
  }
}
