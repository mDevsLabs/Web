export type SqlClient = (
  strings: TemplateStringsArray,
  ...values: any[]
) => Promise<any[]>;

export type ModelType = "chat" | "audio" | "image";
export type ModelFournisseur = "openrouter" | "cometapi";

export interface StoredModel {
  architecture: Record<string, any>;
  context_length: number;
  created: number;
  description: string;
  fournisseur: ModelFournisseur | string;
  id: string;
  is_available: boolean;
  isActive: boolean;
  max_output_tokens: number;
  model_number: string | number;
  name: string;
  overrides: Record<string, any>;
  pricing: Record<string, any>;
  provider: string;
  reasoning?: Record<string, any> | null;
  supported_parameters: string[];
  type: ModelType;
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
  const idProvider = modelId.split("/")[0] || "inconnu";
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
  const provider = effectiveProvider(model);
  if (provider && provider !== "openrouter" && provider !== "cometapi") {
    return provider
      .replace(
        /[-_]+([a-z])/gi,
        (_match, letter: string) => ` ${letter.toUpperCase()}`
      )
      .replace(/^([a-z])/i, (letter) => letter.toUpperCase());
  }
  const upstreamName = model.upstream?.name;
  const nameProvider =
    providerFromName(upstreamName, model.id) ??
    providerFromName(model.name, model.id);
  if (nameProvider) return nameProvider;
  return (model.id.split("/")[0] || "inconnu")
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

// La colonne reste la valeur amont ; une surcharge admin peut la remplacer.
// Toutes les lectures doivent passer par ces trois accesseurs, sinon une
// synchronisation ferait réapparaître le type ou le fournisseur d'origine.
export function effectiveType(model: StoredModel): ModelType {
  return (model.overrides.type ?? model.type ?? "chat") as ModelType;
}

export function effectiveProvider(model: StoredModel): string {
  return String(
    model.overrides.provider ??
      model.provider ??
      model.id.split("/")[0] ??
      "inconnu"
  );
}

export function effectiveFournisseur(model: StoredModel): string {
  return String(
    model.overrides.fournisseur ?? model.fournisseur ?? "openrouter"
  );
}

export const OVERRIDABLE_SYNC_FIELDS = [
  "architecture",
  "context_length",
  "description",
  "max_output_tokens",
  "name",
  "pricing",
  "supported_parameters",
] as const;

// Le cron écrase ces colonnes structurelles. Un écart avec la base est donc
// toujours arbitré, même sans surcharge préalable : c'était le cas des
// modifications admin antérieures au suivi par `overrides`.
export const STRUCTURAL_SYNC_FIELDS = [
  "fournisseur",
  "provider",
  "type",
] as const;

export type SyncConflictField =
  | (typeof OVERRIDABLE_SYNC_FIELDS)[number]
  | (typeof STRUCTURAL_SYNC_FIELDS)[number];

export function detectOpenRouterModelType(m: Record<string, any>): ModelType {
  const arch = isObject(m.architecture) ? m.architecture : {};
  const outputModalities = Array.isArray(arch.output_modalities)
    ? arch.output_modalities.map((o: unknown) => String(o).toLowerCase())
    : [];
  const modality = String(arch.modality || "").toLowerCase();
  const outputs = (modality.split("->")[1] || "")
    .split("+")
    .map((s) => s.trim());
  const idLower = String(m.id || "").toLowerCase();

  // Sortie Audio (synthèse vocale TTS) : uniquement les modèles produisant de la parole
  // ("speech"), et non la modalité générique "audio" (multimodal, musique ou transcription).
  const producesSpeech =
    outputModalities.includes("speech") || outputs.includes("speech");
  if (producesSpeech || idLower.includes("tts") || idLower.includes("bark")) {
    return "audio";
  }

  const producesImage =
    outputModalities.includes("image") || outputs.includes("image");
  if (
    (producesImage &&
      (idLower.includes("image") || !outputModalities.includes("text"))) ||
    idLower.includes("stable-diffusion") ||
    idLower.includes("midjourney") ||
    (idLower.includes("dall-e") && !idLower.includes("chat")) ||
    (idLower.includes("flux") &&
      !idLower.includes("chat") &&
      !idLower.includes("llm"))
  ) {
    return "image";
  }

  return "chat";
}

export interface StoredSyncModel {
  architecture: Record<string, any>;
  context_length: number;
  description: string;
  fournisseur: string;
  id: string;
  max_output_tokens: number;
  model_number: string | number;
  name: string;
  overrides: Record<string, any>;
  pricing: Record<string, any>;
  provider: string;
  supported_parameters: string[];
  type: string;
  upstream: Record<string, any>;
}

export interface ModelConflict {
  databaseValue: unknown;
  field: SyncConflictField;
  id: string;
  modelNumber: string | number;
  origin: "override" | "database";
  upstreamValue: unknown;
}

export type ModelConflictChoice = "database" | "upstream" | "delete";
export type ModelConflictResolver = (
  conflict: ModelConflict
) => ModelConflictChoice | Promise<ModelConflictChoice>;

export interface ModelConflictResolution {
  choice: ModelConflictChoice;
  conflict: ModelConflict;
}

function isObject(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasOwn(value: object, key: string): boolean {
  return Object.hasOwn(value, key);
}

function structuralBaseline(
  row: StoredSyncModel,
  field: (typeof STRUCTURAL_SYNC_FIELDS)[number]
): unknown {
  if (field === "provider") {
    // Les anciennes lignes stockaient le fournisseur amont dans `provider` ;
    // ce n'est pas une modification admin et la synchronisation doit corriger.
    if (
      !row.provider ||
      row.provider === "openrouter" ||
      row.provider === "cometapi"
    ) {
      return undefined;
    }
    return row.id.split("/")[0] || "inconnu";
  }
  if (field === "type") {
    if (row.fournisseur === "cometapi") return "image";
    const upstream = isObject(row.upstream) ? row.upstream : {};
    return detectOpenRouterModelType({ ...upstream, id: row.id });
  }
  // `fournisseur` n'est pas présent dans l'objet amont : impossible de
  // reconstituer la valeur d'origine après un reset. La surcharge explicite
  // reste la seule source fiable pour ce champ.
  return undefined;
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  if (isObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "undefined";
}

/**
 * Conflits entre ce que la synchronisation amont va écrire et ce que la base
 * conserve. Les champs métier ne sont comparés que s'ils portent une
 * surcharge ; les champs structurels le sont toujours, car le cron les écrase
 * sans laisser de trace.
 */
export function findModelConflicts(
  incoming: Record<string, any>[],
  stored: StoredSyncModel[]
): ModelConflict[] {
  const rows = new Map(stored.map((model) => [model.id, model]));
  const conflicts: ModelConflict[] = [];

  for (const model of incoming) {
    const id = typeof model.id === "string" ? model.id : "";
    const row = id ? rows.get(id) : undefined;
    if (!row) continue;
    const overrides = isObject(row.overrides) ? row.overrides : {};

    for (const field of OVERRIDABLE_SYNC_FIELDS) {
      if (!hasOwn(overrides, field) || !hasOwn(model, field)) continue;
      // La colonne porte la dernière valeur amont. Si elle n'a pas bougé,
      // la surcharge n'est pas en conflit : rien de nouveau à arbitrer.
      if (canonicalJson(row[field]) === canonicalJson(model[field])) continue;
      if (canonicalJson(overrides[field]) === canonicalJson(model[field]))
        continue;
      conflicts.push({
        databaseValue: overrides[field],
        field,
        id,
        modelNumber: row.model_number,
        origin: "override",
        upstreamValue: model[field],
      });
    }

    for (const field of STRUCTURAL_SYNC_FIELDS) {
      if (!hasOwn(model, field)) continue;
      const overridden = hasOwn(overrides, field);

      if (overridden) {
        // Même règle : seule une évolution de l'amont mérite un arbitrage.
        if (canonicalJson(row[field]) === canonicalJson(model[field])) continue;
        if (canonicalJson(overrides[field]) === canonicalJson(model[field]))
          continue;
        conflicts.push({
          databaseValue: overrides[field],
          field,
          id,
          modelNumber: row.model_number,
          origin: "override",
          upstreamValue: model[field],
        });
        continue;
      }

      // Sans surcharge, la colonne n'est un choix admin que si elle diffère
      // de la valeur que la dernière synchronisation aurait écrite. Cela évite
      // de figer un ancien amont après un reset.
      const baseline = structuralBaseline(row, field);
      if (baseline === undefined) continue;
      if (canonicalJson(row[field]) === canonicalJson(baseline)) continue;
      if (canonicalJson(row[field]) === canonicalJson(model[field])) continue;
      conflicts.push({
        databaseValue: row[field],
        field,
        id,
        modelNumber: row.model_number,
        origin: "database",
        upstreamValue: model[field],
      });
    }
  }

  return conflicts.sort(
    (a, b) =>
      String(a.modelNumber).localeCompare(String(b.modelNumber), "fr", {
        numeric: true,
      }) || a.field.localeCompare(b.field)
  );
}

/**
 * Résout chaque conflit. Sans résolveur — donc pour le cron automatique — la
 * base de données gagne, conformément au contrat : une synchronisation ne doit jamais
 * effacer une décision d'administration.
 */
export async function resolveModelConflicts(
  conflicts: ModelConflict[],
  resolver?: ModelConflictResolver
): Promise<ModelConflictResolution[]> {
  const resolutions: ModelConflictResolution[] = [];
  const deletedModelIds = new Set<string>();

  for (const conflict of conflicts) {
    if (deletedModelIds.has(conflict.id)) {
      resolutions.push({ choice: "delete", conflict });
      continue;
    }
    const answer = resolver ? await resolver(conflict) : "database";
    const choice =
      answer === "delete"
        ? "delete"
        : answer === "upstream"
          ? "upstream"
          : "database";
    if (choice === "delete") {
      deletedModelIds.add(conflict.id);
    }
    resolutions.push({
      choice,
      conflict,
    });
  }
  return resolutions;
}

export interface ModelConflictWrites {
  keep: Record<string, unknown>;
  release: string[];
}

/**
 * Traduit les arbitrages en écritures `overrides`. La conservation d'une
 * valeur structurelle présente uniquement en base doit créer une surcharge :
 * sinon l'écriture amont déjà effectuée serait perdue à la prochaine passe.
 */
export function planModelConflictWrites(
  resolutions: ModelConflictResolution[]
): Map<string, ModelConflictWrites> {
  const changes = new Map<string, ModelConflictWrites>();
  for (const { choice, conflict } of resolutions) {
    if (choice === "delete") continue;
    if (choice === "upstream") {
      if (conflict.origin !== "override") continue;
      const entry = changes.get(conflict.id) ?? { keep: {}, release: [] };
      entry.release.push(conflict.field);
      changes.set(conflict.id, entry);
    } else if (conflict.origin === "database") {
      const entry = changes.get(conflict.id) ?? { keep: {}, release: [] };
      entry.keep[conflict.field] = conflict.databaseValue;
      changes.set(conflict.id, entry);
    }
  }
  return changes;
}

/**
 * Applique les arbitrages après l'écriture amont. Extrait de `updateModels`
 * pour rester testable sans réseau ni base réelle.
 */
export async function applyModelConflictWrites(
  sql: SqlClient,
  resolutions: ModelConflictResolution[]
) {
  const changes = planModelConflictWrites(resolutions);
  for (const [id, { keep, release }] of changes) {
    await sql`
      UPDATE openrouter_models
      SET overrides = (COALESCE(overrides, '{}'::jsonb) - ${release}::text[]) || ${JSON.stringify(keep)}::jsonb,
        updated_at = now()
      WHERE id = ${id}
    `;
  }
  return changes;
}

export function isPublicChatModel(model: StoredModel): boolean {
  return (
    model.isActive &&
    model.is_available &&
    (effectiveType(model) === "chat" || !model.type) &&
    !model.id.startsWith("openrouter/") &&
    !model.id.toLowerCase().includes(":batch") &&
    supportsOutput(model, "text")
  );
}

export function isPublicAudioModel(model: StoredModel): boolean {
  const type = effectiveType(model);
  return (
    model.isActive &&
    model.is_available &&
    (type === "audio" ||
      (model.overrides.type === undefined && supportsOutput(model, "speech")))
  );
}

/**
 * Catalogue Speech visible pour un forfait donné.
 *
 * La base est l'autorité : un modèle audio payant doit apparaître pour un
 * compte payant, même sans suffixe `:free`. Le filtre `:free` ne s'applique
 * qu'aux comptes Free, conformément à la matrice d'accès.
 */
export function selectAudioModels(
  models: StoredModel[],
  paid: boolean
): StoredModel[] {
  return models.filter(
    (model) => isPublicAudioModel(model) && (paid || isFreeModelId(model.id))
  );
}

export function isPublicImageModel(model: StoredModel): boolean {
  const type = effectiveType(model);
  return (
    model.isActive &&
    model.is_available &&
    (type === "image" ||
      (model.overrides.type === undefined && supportsOutput(model, "image")))
  );
}

export function effectiveModel(model: StoredModel) {
  const o = model.overrides;
  const name = o.name ?? model.name;
  const rawReasoning =
    o.reasoning ??
    model.reasoning ??
    (model.upstream && typeof model.upstream === "object"
      ? model.upstream.reasoning
      : null) ??
    null;
  return {
    architecture: o.architecture ?? model.architecture,
    created: Number(model.created),
    description: o.description ?? model.description,
    fournisseur: effectiveFournisseur(model),
    id: model.id,
    maxContext: o.context_length ?? model.context_length,
    maxOutput: o.max_output_tokens ?? model.max_output_tokens,
    name: displayModelName(name, model.id),
    object: "model",
    owned_by: displayProvider(model),
    provider: effectiveProvider(model),
    reasoning: rawReasoning,
    supported_parameters: o.supported_parameters ?? model.supported_parameters,
    type: effectiveType(model),
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
    SELECT id, model_number,
      COALESCE(NULLIF(provider, ''), split_part(id, '/', 1)) as provider,
      COALESCE(fournisseur, 'openrouter') as fournisseur,
      COALESCE(type, 'chat') as type,
      name, description, created, context_length,
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
  if (effectiveType(model) === "image") {
    throw new ModelAccessError(
      400,
      "image_model_not_supported_on_chat",
      "Ce modèle est un générateur d'images. Veuillez utiliser l'endpoint d'images (/v1/images/generations)."
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
