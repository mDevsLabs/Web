import "server-only";

import { isPaidTier } from "@/lib/auth/plan";
import { getMaiUser } from "@/lib/auth/session";
import { dbReady, getRawClient } from "@/lib/db/queries/connection";
import {
  effectiveModel,
  getModelCatalog,
  isFreeModelId,
  isPublicChatModel,
  type SqlClient,
  type StoredModel,
} from "@/openrouter-models";
import {
  type ChatModel,
  FALLBACK_MODELS,
  formatModelName,
  isBatchModelId,
  normalizeModelDisplayName,
} from "./models";
import { MAI_BACKING_MODELS } from "./providers";

function isFreeMaiCloudModelId(modelId: string): boolean {
  const normalized = modelId
    .toLowerCase()
    .trim()
    .replace(/^mdevslabs\//, "");
  return (
    normalized === "mai-2" ||
    normalized === "mai-2-mini" ||
    normalized === "mai-2.5-omni"
  );
}

function mapStoredModelToChatModel(stored: StoredModel): ChatModel {
  const eff = effectiveModel(stored);
  const fallbackFmt = formatModelName(eff.id);
  const displayName = normalizeModelDisplayName(eff.id, eff.name);
  const explicitIsFree =
    typeof stored.overrides?.isFree === "boolean"
      ? stored.overrides.isFree
      : undefined;
  const isFree =
    explicitIsFree ??
    (isFreeModelId(eff.id) ||
      isFreeMaiCloudModelId(eff.id) ||
      fallbackFmt.isFree);

  return {
    architecture: eff.architecture,
    description: eff.description || `Modèle ${eff.owned_by || eff.provider}`,
    id: eff.id,
    isFree,
    maxContext: eff.maxContext || 128_000,
    ...(typeof eff.maxOutput === "number" && eff.maxOutput > 0
      ? { maxOutput: eff.maxOutput }
      : {}),
    name: displayName || fallbackFmt.name,
    provider: eff.provider || fallbackFmt.provider,
    reasoning: (eff.reasoning as ChatModel["reasoning"]) ?? null,
    supported_parameters: eff.supported_parameters,
  };
}

function buildSovereignModels(byId: Map<string, StoredModel>): ChatModel[] {
  const sovereignTemplates = FALLBACK_MODELS.filter(
    (model) => model.provider === "mdevslabs"
  );

  return sovereignTemplates.map((template) => {
    const directRow = byId.get(template.id);
    if (directRow && isPublicChatModel(directRow)) {
      const mapped = mapStoredModelToChatModel(directRow);
      return {
        ...mapped,
        isFree: template.isFree ?? mapped.isFree,
        provider: "mdevslabs",
      };
    }

    const backendId = MAI_BACKING_MODELS[template.id.toLowerCase()];
    const backendRow = backendId ? byId.get(backendId) : undefined;
    if (backendRow && isPublicChatModel(backendRow)) {
      const eff = effectiveModel(backendRow);
      return {
        ...template,
        maxContext: eff.maxContext || template.maxContext,
        maxOutput: eff.maxOutput || template.maxOutput,
        reasoning: template.reasoning?.supported_efforts?.length
          ? template.reasoning
          : ((eff.reasoning as ChatModel["reasoning"]) ?? template.reasoning),
        supported_parameters:
          Array.isArray(eff.supported_parameters) &&
          eff.supported_parameters.length > 0
            ? eff.supported_parameters
            : template.supported_parameters,
      };
    }

    return template;
  });
}

function filterChatModelsByAccess(
  models: readonly ChatModel[],
  paid: boolean
): ChatModel[] {
  const filtered = models.filter(
    (model) =>
      !isBatchModelId(model.id) &&
      (paid ||
        Boolean(model.isFree) ||
        isFreeModelId(model.id) ||
        isFreeMaiCloudModelId(model.id))
  );
  return filtered.length > 0
    ? filtered
    : FALLBACK_MODELS.filter(
        (m) => paid || Boolean(m.isFree) || isFreeMaiCloudModelId(m.id)
      );
}

async function readNeonChatCatalog(): Promise<{
  models: ChatModel[];
  sql: SqlClient;
} | null> {
  if (!process.env.DATABASE_URL?.trim()) {
    return null;
  }

  try {
    await dbReady();
    const raw = getRawClient();
    if (!raw) {
      return null;
    }
    const sql = raw as unknown as SqlClient;
    const catalog = await getModelCatalog(sql);

    const dbChatModels = catalog.models
      .filter((model) => isPublicChatModel(model) && !isBatchModelId(model.id))
      .map(mapStoredModelToChatModel);

    const sovereignModels = buildSovereignModels(catalog.byId);

    const seen = new Set<string>();
    const combined: ChatModel[] = [];

    for (const model of [...sovereignModels, ...dbChatModels]) {
      if (!model.id || isBatchModelId(model.id) || seen.has(model.id)) {
        continue;
      }
      seen.add(model.id);
      combined.push(model);
    }

    return combined.length > 0 ? { models: combined, sql } : null;
  } catch {
    return null;
  }
}

export async function buildCatalogModelsFromStored(
  storedModels: StoredModel[],
  tier?: string | null
): Promise<ChatModel[]> {
  const byId = new Map(storedModels.map((m) => [m.id, m]));
  const dbChatModels = storedModels
    .filter((model) => isPublicChatModel(model) && !isBatchModelId(model.id))
    .map(mapStoredModelToChatModel);
  const sovereignModels = buildSovereignModels(byId);

  const seen = new Set<string>();
  const combined: ChatModel[] = [];
  for (const model of [...sovereignModels, ...dbChatModels]) {
    if (!model.id || isBatchModelId(model.id) || seen.has(model.id)) {
      continue;
    }
    seen.add(model.id);
    combined.push(model);
  }

  const paid = isPaidTier(tier);
  return filterChatModelsByAccess(
    combined.length > 0 ? combined : FALLBACK_MODELS,
    paid
  );
}

export async function fetchUserModels(): Promise<ChatModel[]> {
  try {
    const [neonCatalog, user] = await Promise.all([
      readNeonChatCatalog(),
      getMaiUser().catch(() => null),
    ]);

    if (neonCatalog) {
      return filterChatModelsByAccess(
        neonCatalog.models,
        isPaidTier(user?.tier)
      );
    }

    if (user) {
      return filterChatModelsByAccess(FALLBACK_MODELS, isPaidTier(user.tier));
    }

    return FALLBACK_MODELS;
  } catch (err) {
    console.error("Erreur fetchUserModels:", err);
    return FALLBACK_MODELS;
  }
}

/**
 * Catalogue pour un tick sans cookie (planification, exécution différée) :
 * résout directement le forfait du compte depuis la table `users` sur Neon.
 */
export async function fetchModelsForUser(params: {
  apiKey: string | null;
  userId: string;
}): Promise<ChatModel[]> {
  try {
    const neonCatalog = await readNeonChatCatalog();
    if (!neonCatalog) {
      return FALLBACK_MODELS;
    }

    let tier: string | null = null;
    if (params.userId?.trim()) {
      const rows =
        await neonCatalog.sql`SELECT tier FROM users WHERE id::text = ${params.userId}::text OR email = ${params.userId}::text OR username = ${params.userId}::text LIMIT 1`.catch(
          () => []
        );
      tier = typeof rows[0]?.tier === "string" ? rows[0].tier : null;
    }

    return filterChatModelsByAccess(neonCatalog.models, isPaidTier(tier));
  } catch (err) {
    console.error("Erreur fetchModelsForUser:", err);
    return FALLBACK_MODELS;
  }
}
