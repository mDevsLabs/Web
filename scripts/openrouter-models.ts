export type SqlClient = (
  strings: TemplateStringsArray,
  ...values: any[]
) => Promise<any[]>;

export interface StoredModel {
  architecture: Record<string, any>;
  context_length: number;
  created: number;
  description: string;
  id: string;
  is_available: boolean;
  isActive: boolean;
  max_output_tokens: number;
  model_number: string | number;
  name: string;
  overrides: Record<string, any>;
  pricing: Record<string, any>;
  supported_parameters: string[];
  upstream: Record<string, any>;
}

export class ModelAccessError extends Error {
  public status: 400 | 403 | 404 | 503;
  public code: string;

  constructor(status: 400 | 403 | 404 | 503, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function isFreeModelId(id: string): boolean {
  return id.endsWith(":free");
}

function providerFromName(name: unknown, modelId: string): string | null {
  if (typeof name !== "string") return null;
  const match = name.match(/^\s*([^:]+?)\s*:\s*(.+?)\s*$/);
  const idProvider = modelId.split("/")[0] || "openrouter";
  if (
    !match ||
    match[1].replace(/[-_\s]/g, "").toLowerCase() !==
      idProvider.replace(/[-_\s]/g, "").toLowerCase()
  ) {
    return null;
  }
  return match[1].trim();
}

function displayProvider(model: StoredModel): string {
  const upstreamName = model.upstream?.name;
  const nameProvider =
    providerFromName(upstreamName, model.id) ??
    providerFromName(model.name, model.id);
  if (nameProvider) return nameProvider;
  return (model.id.split("/")[0] || "openrouter")
    .replace(
      /[-_]+([a-z])/gi,
      (_match, letter: string) => ` ${letter.toUpperCase()}`
    )
    .replace(/^([a-z])/i, (letter) => letter.toUpperCase());
}

function displayModelName(name: unknown, modelId: string): string {
  if (typeof name !== "string") return modelId;
  const match = name.match(/^\s*([^:]+?)\s*:\s*(.+?)\s*$/);
  if (match && providerFromName(name, modelId)) return match[2].trim();
  return name;
}

export function supportsOutput(model: StoredModel, modality: string): boolean {
  const architecture = model.overrides.architecture ?? model.architecture;
  const outputs = architecture?.output_modalities;
  if (Array.isArray(outputs) && outputs.length)
    return outputs.includes(modality);
  const output = String(architecture?.modality || "").split("->")[1] || "";
  return output.split("+").includes(modality);
}

export function isPublicChatModel(model: StoredModel): boolean {
  return (
    model.isActive &&
    model.is_available &&
    !model.id.startsWith("openrouter/") &&
    !model.id.toLowerCase().includes(":batch") &&
    supportsOutput(model, "text")
  );
}

export function effectiveModel(model: StoredModel) {
  const o = model.overrides;
  const name = o.name ?? model.name;
  return {
    architecture: o.architecture ?? model.architecture,
    created: Number(model.created),
    description: o.description ?? model.description,
    id: model.id,
    maxContext: o.context_length ?? model.context_length,
    maxOutput: o.max_output_tokens ?? model.max_output_tokens,
    name: displayModelName(name, model.id),
    object: "model",
    owned_by: displayProvider(model),
    supported_parameters: o.supported_parameters ?? model.supported_parameters,
  };
}

export interface ModelCatalog {
  byId: Map<string, StoredModel>;
  models: StoredModel[];
}

// Cache bref et requête partagée : pas d'appel OpenRouter sur le chemin des requêtes.
// Pas de catalogue périmé en cas de panne : une activation ne doit pas être contournée.
const CACHE_TTL_MS = 10_000;
const cache = new WeakMap<
  SqlClient,
  {
    value?: ModelCatalog;
    expiresAt: number;
    pending?: Promise<ModelCatalog>;
  }
>();

export function invalidateModelCatalog(sql: SqlClient): void {
  cache.delete(sql);
}

export async function getModelCatalog(sql: SqlClient): Promise<ModelCatalog> {
  let entry = cache.get(sql);
  if (!entry) {
    entry = { expiresAt: 0 };
    cache.set(sql, entry);
  }
  if (entry.value && Date.now() < entry.expiresAt) return entry.value;
  if (entry.pending) return entry.pending;
  const current = entry;
  current.pending = (async () => {
    try {
      const rows: StoredModel[] = await sqlQueryCatalog(sql);
      if (!rows.length) {
        throw new Error(
          "Catalogue vide : exécuter la migration et updateModels.ts."
        );
      }
      const value = { byId: new Map(rows.map((m) => [m.id, m])), models: rows };
      current.value = value;
      current.expiresAt = Date.now() + CACHE_TTL_MS;
      return value;
    } catch (error) {
      console.error("[Models] Lecture du catalogue impossible:", error);
      throw new ModelAccessError(
        503,
        "model_catalog_unavailable",
        "Le catalogue des modèles est temporairement indisponible."
      );
    } finally {
      current.pending = undefined;
    }
  })();
  return current.pending;
}

async function sqlQueryCatalog(sql: SqlClient): Promise<StoredModel[]> {
  return await sql`
    SELECT id, model_number, name, description, created, context_length,
      max_output_tokens, architecture, pricing, supported_parameters, upstream,
      overrides, "isActive", is_available
    FROM openrouter_models ORDER BY model_number
  `;
}

export async function requireChatModel(
  sql: SqlClient,
  requested: unknown,
  paid: boolean,
  aliasBackend?: string | null
): Promise<StoredModel> {
  if (
    typeof requested !== "string" ||
    !requested ||
    requested !== requested.trim()
  ) {
    throw new ModelAccessError(
      400,
      "invalid_model",
      "Un identifiant de modèle valide est requis."
    );
  }
  if (!paid && !aliasBackend && !isFreeModelId(requested)) {
    throw new ModelAccessError(
      403,
      "model_access_denied",
      "Le forfait Free autorise uniquement les modèles :free et les alias mAI cloud."
    );
  }
  const catalog = await getModelCatalog(sql);
  const model = catalog.byId.get(aliasBackend || requested);
  if (!model) {
    throw new ModelAccessError(
      404,
      "model_not_found",
      "Ce modèle est absent du catalogue."
    );
  }
  if (!model.isActive) {
    throw new ModelAccessError(
      403,
      "model_inactive",
      "Ce modèle a été désactivé."
    );
  }
  if (!isPublicChatModel(model)) {
    throw new ModelAccessError(
      404,
      "model_unavailable",
      "Ce modèle est indisponible pour le chat."
    );
  }
  return model;
}

export function validateModelRequest(
  body: Record<string, any>,
  model: StoredModel
): void {
  if (body.models !== undefined) {
    throw new ModelAccessError(
      400,
      "unsupported_model_fallback",
      "Le paramètre models n'est pas pris en charge. Utilisez model."
    );
  }
  const maxOutput = effectiveModel(model).maxOutput;
  for (const value of [
    body.max_tokens,
    body.max_completion_tokens,
    body.generationConfig?.maxOutputTokens,
  ]) {
    if (
      value !== undefined &&
      (!Number.isSafeInteger(value) || value <= 0 || value > maxOutput)
    ) {
      throw new ModelAccessError(
        400,
        "invalid_max_tokens",
        `La limite de sortie du modèle est de ${maxOutput} tokens.`
      );
    }
  }
}
