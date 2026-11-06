import "server-only";

import { upstreamJson } from "@/lib/api/upstream";
import { getMaiSessionToken, getMaiUser } from "@/lib/auth/session";
import { getUserApiKey } from "@/lib/db/api-keys";
import {
  type ChatModel,
  FALLBACK_MODELS,
  formatModelName,
  normalizeModelDisplayName,
} from "./models";

function mapCatalogModels(rawList: unknown): ChatModel[] {
  if (!Array.isArray(rawList) || rawList.length === 0) {
    return FALLBACK_MODELS;
  }

  return rawList.map((m: any) => {
    const { name, provider, isFree } = formatModelName(m.id);
    const displayName = normalizeModelDisplayName(m.id, m.name);
    return {
      architecture: m.architecture,
      description: m.description || `Modèle ${provider}`,
      id: m.id,
      isFree: m.isFree === undefined ? isFree : m.isFree,
      maxContext: m.maxContext || m.context_length || 128_000,
      maxOutput: m.maxOutput || 4096,
      name: displayName || name,
      provider,
      // Capacités de réflexion déclarées par le fournisseur. Sans ce champ,
      // le registre retomberait sur ses heuristiques par nom de modèle et
      // proposerait des niveaux d'effort qu'aucun modèle n'accepte.
      reasoning: m.reasoning ?? null,
      supported_parameters: m.supported_parameters,
    };
  });
}

async function readCatalogModels(params: {
  headers: Record<string, string>;
  token: string | null;
}): Promise<ChatModel[] | null> {
  const result = await upstreamJson<{ data?: unknown }>({
    headers: params.headers,
    path: "/v1/models",
    token: params.token,
  });
  if (!result.ok) {
    return null;
  }
  return mapCatalogModels(result.data.data || []);
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
