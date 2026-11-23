import "server-only";

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
/**
 * Le catalogue OpenRouter est GLOBAL, pas par compte.
 *
 * L'ancien cache était indexé par jeton et identifiant utilisateur alors que
 * la requête `https://openrouter.ai/api/v1/models` n'envoie aucun en-tête :
 * chaque compte (et chaque instance froide) re-téléchargeait et re-parsait
 * ~1 Mo de JSON pour produire exactement la même liste. Une seule entrée
 * module suffit ; elle est partagée par le chat et par les ticks.
 */
let catalogCache: CachedCatalog | null = null;
const CATALOG_CACHE_TTL_MS = 300_000;

async function readCatalogModels(): Promise<ChatModel[] | null> {
  const now = Date.now();
  if (catalogCache && now < catalogCache.expiresAt) {
    return catalogCache.models;
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
      catalogCache = {
        expiresAt: now + CATALOG_CACHE_TTL_MS,
        models: mapped,
      };
      return mapped;
    }
  } catch {}

  return FALLBACK_MODELS;
}

export async function fetchUserModels(): Promise<ChatModel[]> {
  try {
    // Le catalogue ne dépend ni du compte ni d'une clé : la route OpenRouter
    // appelée est publique. Lire la session et la clé utilisateur ici coûtait
    // deux requêtes base pour un résultat identique pour tous.
    const models = await readCatalogModels();

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
export async function fetchModelsForUser(_params: {
  apiKey: string | null;
  userId: string;
}): Promise<ChatModel[]> {
  try {
    const models = await readCatalogModels();
    return models ?? FALLBACK_MODELS;
  } catch (err) {
    console.error("Erreur fetchModelsForUser:", err);
    return FALLBACK_MODELS;
  }
}
