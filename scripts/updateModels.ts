import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  applyModelConflictWrites,
  detectOpenRouterModelType,
  findModelConflicts,
  invalidateModelCatalog,
  type ModelConflictResolver,
  resolveModelConflicts,
  type SqlClient,
  type StoredSyncModel,
} from "./openrouter-models.ts";

// Deno / Val Town acceptent npm:, tandis que la CLI Bun utilise les dépendances locales.
const { neon } =
  typeof Deno === "undefined"
    ? await import("@neondatabase/serverless")
    : await import("npm:@neondatabase/serverless");

type JsonObject = Record<string, any>;

function object(value: unknown): JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

function positiveInteger(value: unknown, fallback: number): number {
  return Number.isSafeInteger(value) &&
    Number(value) > 0 &&
    Number(value) <= 2_147_483_647
    ? Number(value)
    : fallback;
}

export function normalizeOpenRouterModels(data: unknown): JsonObject[] {
  if (!Array.isArray(data) || !data.length) {
    throw new Error("OpenRouter a renvoyé un catalogue vide ou invalide.");
  }
  const ids = new Set<string>();
  const models = data
    .filter((value) => {
      const id = object(value).id;
      return typeof id !== "string" || !id.toLowerCase().includes(":batch");
    })
    .map((value) => {
      const m = object(value);
      if (
        typeof m.id !== "string" ||
        !m.id ||
        m.id !== m.id.trim() ||
        ids.has(m.id) ||
        !m.id.includes("/")
      ) {
        throw new Error(
          "Le catalogue contient un identifiant invalide ou dupliqué."
        );
      }
      ids.add(m.id);
      if (
        m.supported_parameters !== null &&
        m.supported_parameters !== undefined &&
        (!Array.isArray(m.supported_parameters) ||
          m.supported_parameters.some(
            (p: unknown) => typeof p !== "string" || !p
          ))
      ) {
        throw new Error(`supported_parameters invalide pour ${m.id}`);
      }
      const name = typeof m.name === "string" && m.name ? m.name : m.id;
      const providerPrefix = name.match(/^\s*([^:]+?)\s*:\s*(.+?)\s*$/);
      const displayName =
        providerPrefix &&
        providerPrefix[1].replace(/[-_\s]/g, "").toLowerCase() ===
          m.id
            .split("/")[0]
            .replace(/[-_\s]/g, "")
            .toLowerCase()
          ? providerPrefix[2].trim()
          : name;

      const labo = m.id.split("/")[0] || "inconnu";
      const modelType = detectOpenRouterModelType(m);

      return {
        architecture: object(m.architecture),
        context_length: positiveInteger(m.context_length, 128_000),
        created:
          Number.isSafeInteger(m.created) && m.created >= 0 ? m.created : 0,
        description: typeof m.description === "string" ? m.description : "",
        fournisseur: "openrouter",
        id: m.id,
        max_output_tokens: positiveInteger(
          m.top_provider?.max_completion_tokens,
          4096
        ),
        name: displayName,
        pricing: object(m.pricing),
        provider: labo,
        reasoning:
          m.reasoning && typeof m.reasoning === "object" ? m.reasoning : null,
        supported_parameters: [
          ...new Set<string>(m.supported_parameters ?? []),
        ],
        type: modelType,
        upstream: m,
      };
    });
  return models;
}

export const FALLBACK_COMET_IMAGE_MODELS: JsonObject[] = [
  {
    architecture: {
      input_modalities: ["text"],
      modality: "text->image",
      output_modalities: ["image"],
    },
    context_length: 4096,
    created: 1_722_470_400,
    description:
      "Modèle ultra-rapide en 4 étapes par Black Forest Labs (Text-to-Image).",
    fournisseur: "cometapi",
    id: "black-forest-labs/flux-schnell",
    max_output_tokens: 1,
    name: "FLUX.1 Schnell",
    pricing: {},
    provider: "black-forest-labs",
    supported_parameters: ["text-to-image"],
    type: "image",
    upstream: { form: "openai-standard", owned_by: "black-forest-labs" },
  },
  {
    architecture: {
      input_modalities: ["text", "image"],
      modality: "text+image->image",
      output_modalities: ["image"],
    },
    context_length: 4096,
    created: 1_722_470_400,
    description:
      "Modèle phare de synthèse photoréaliste et artistique par Black Forest Labs.",
    fournisseur: "cometapi",
    id: "black-forest-labs/flux-dev",
    max_output_tokens: 1,
    name: "FLUX.1 Dev",
    pricing: {},
    provider: "black-forest-labs",
    supported_parameters: ["text-to-image", "image-to-image"],
    type: "image",
    upstream: { form: "openai-standard", owned_by: "black-forest-labs" },
  },
  {
    architecture: {
      input_modalities: ["text"],
      modality: "text->image",
      output_modalities: ["image"],
    },
    context_length: 4096,
    created: 1_727_827_200,
    description:
      "Sommet de la qualité visuelle, cohérence typographique et détails avancés par Black Forest Labs.",
    fournisseur: "cometapi",
    id: "black-forest-labs/flux-pro",
    max_output_tokens: 1,
    name: "FLUX 1.1 Pro",
    pricing: {},
    provider: "black-forest-labs",
    supported_parameters: ["text-to-image"],
    type: "image",
    upstream: { form: "openai-standard", owned_by: "black-forest-labs" },
  },
  {
    architecture: {
      input_modalities: ["text"],
      modality: "text->image",
      output_modalities: ["image"],
    },
    context_length: 4096,
    created: 1_730_419_200,
    description:
      "Version Ultra haute résolution avec photoréalisme extrême par Black Forest Labs.",
    fournisseur: "cometapi",
    id: "black-forest-labs/flux-1.1-pro-ultra",
    max_output_tokens: 1,
    name: "FLUX 1.1 Pro Ultra",
    pricing: {},
    provider: "black-forest-labs",
    supported_parameters: ["text-to-image"],
    type: "image",
    upstream: { form: "openai-standard", owned_by: "black-forest-labs" },
  },
  {
    architecture: {
      input_modalities: ["text", "image"],
      modality: "text+image->image",
      output_modalities: ["image"],
    },
    context_length: 4096,
    created: 1_729_641_600,
    description:
      "Modèle phare de 8 milliards de paramètres de Stability AI pour une variété stylistique maximale.",
    fournisseur: "cometapi",
    id: "stabilityai/stable-diffusion-3.5-large",
    max_output_tokens: 1,
    name: "Stable Diffusion 3.5 Large",
    pricing: {},
    provider: "stabilityai",
    supported_parameters: ["text-to-image", "image-to-image"],
    type: "image",
    upstream: { form: "openai-standard", owned_by: "stabilityai" },
  },
  {
    architecture: {
      input_modalities: ["text"],
      modality: "text->image",
      output_modalities: ["image"],
    },
    context_length: 4096,
    created: 1_729_641_600,
    description:
      "Version accélérée en 4 étapes de Stable Diffusion 3.5 Large par Stability AI.",
    fournisseur: "cometapi",
    id: "stabilityai/stable-diffusion-3.5-large-turbo",
    max_output_tokens: 1,
    name: "Stable Diffusion 3.5 Large Turbo",
    pricing: {},
    provider: "stabilityai",
    supported_parameters: ["text-to-image"],
    type: "image",
    upstream: { form: "openai-standard", owned_by: "stabilityai" },
  },
  {
    architecture: {
      input_modalities: ["text", "image"],
      modality: "text+image->image",
      output_modalities: ["image"],
    },
    context_length: 4096,
    created: 1_690_848_000,
    description: "Modèle SDXL 1.0 haute résolution de Stability AI.",
    fournisseur: "cometapi",
    id: "stabilityai/sdxl",
    max_output_tokens: 1,
    name: "Stable Diffusion XL 1.0",
    pricing: {},
    provider: "stabilityai",
    supported_parameters: ["text-to-image", "image-to-image"],
    type: "image",
    upstream: { form: "openai-standard", owned_by: "stabilityai" },
  },
  {
    architecture: {
      input_modalities: ["text", "image"],
      modality: "text+image->image",
      output_modalities: ["image"],
    },
    context_length: 4096,
    created: 1_718_064_000,
    description:
      "Génération stylisée haut de gamme avec esthétique cinématique via Midjourney v6.",
    fournisseur: "cometapi",
    id: "midjourney/v6",
    max_output_tokens: 1,
    name: "Midjourney v6",
    pricing: {},
    provider: "midjourney",
    supported_parameters: [
      "text-to-image",
      "image-to-image",
      "upscale",
      "variation",
    ],
    type: "image",
    upstream: { form: "midjourney-pipeline", owned_by: "midjourney" },
  },
  {
    architecture: {
      input_modalities: ["text", "image"],
      modality: "text+image->image",
      output_modalities: ["image"],
    },
    context_length: 4096,
    created: 1_722_384_000,
    description:
      "Dernière itération du moteur Midjourney v6.1 avec cohérence accrue.",
    fournisseur: "cometapi",
    id: "midjourney/v6.1",
    max_output_tokens: 1,
    name: "Midjourney v6.1",
    pricing: {},
    provider: "midjourney",
    supported_parameters: [
      "text-to-image",
      "image-to-image",
      "upscale",
      "variation",
    ],
    type: "image",
    upstream: { form: "midjourney-pipeline", owned_by: "midjourney" },
  },
  {
    architecture: {
      input_modalities: ["text", "image"],
      modality: "text+image->image",
      output_modalities: ["image"],
    },
    context_length: 4096,
    created: 1_730_419_200,
    description:
      "Génération vectorielle et matricielle spécialisée dans le design graphique par Recraft AI.",
    fournisseur: "cometapi",
    id: "recraft-ai/recraft-v3",
    max_output_tokens: 1,
    name: "Recraft V3",
    pricing: {},
    provider: "recraft-ai",
    supported_parameters: ["text-to-image", "image-to-image"],
    type: "image",
    upstream: { form: "openai-standard", owned_by: "recraft-ai" },
  },
  {
    architecture: {
      input_modalities: ["text"],
      modality: "text->image",
      output_modalities: ["image"],
    },
    context_length: 4096,
    created: 1_724_284_800,
    description: "Modèle phare de rendu de texte dans l'image par Ideogram AI.",
    fournisseur: "cometapi",
    id: "ideogram-ai/ideogram-v2",
    max_output_tokens: 1,
    name: "Ideogram V2",
    pricing: {},
    provider: "ideogram-ai",
    supported_parameters: ["text-to-image"],
    type: "image",
    upstream: { form: "openai-standard", owned_by: "ideogram-ai" },
  },
  {
    architecture: {
      input_modalities: ["text"],
      modality: "text->image",
      output_modalities: ["image"],
    },
    context_length: 4096,
    created: 1_698_796_800,
    description:
      "Modèle DALL-E 3 d'OpenAI pour la synthèse d'images haute fidélité.",
    fournisseur: "cometapi",
    id: "openai/dall-e-3",
    max_output_tokens: 1,
    name: "DALL-E 3",
    pricing: {},
    provider: "openai",
    supported_parameters: ["text-to-image"],
    type: "image",
    upstream: { form: "openai-standard", owned_by: "openai" },
  },
  {
    architecture: {
      input_modalities: ["text"],
      modality: "text->image",
      output_modalities: ["image"],
    },
    context_length: 4096,
    created: 1_723_680_000,
    description:
      "Modèle de synthèse photoréaliste de Google DeepMind Imagen 3.",
    fournisseur: "cometapi",
    id: "google/imagen-3",
    max_output_tokens: 1,
    name: "Google Imagen 3",
    pricing: {},
    provider: "google",
    supported_parameters: ["text-to-image"],
    type: "image",
    upstream: { form: "openai-standard", owned_by: "google" },
  },
  {
    architecture: {
      input_modalities: ["text"],
      modality: "text->image",
      output_modalities: ["image"],
    },
    context_length: 4096,
    created: 1_730_000_000,
    description: "Modèle ultra-rapide de génération photoréaliste par Luma AI.",
    fournisseur: "cometapi",
    id: "luma/photon",
    max_output_tokens: 1,
    name: "Luma Photon",
    pricing: {},
    provider: "luma",
    supported_parameters: ["text-to-image"],
    type: "image",
    upstream: { form: "openai-standard", owned_by: "luma" },
  },
];

export async function fetchCometImageModels(
  apiKey?: string,
  fetcher: typeof fetch = fetch,
  signal?: AbortSignal
): Promise<JsonObject[]> {
  const cometKey = apiKey || env("COMET_API_KEY");
  if (!cometKey) {
    return FALLBACK_COMET_IMAGE_MODELS;
  }

  try {
    const res = await fetcher("https://api.cometapi.com/v1/models", {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${cometKey}`,
      },
      signal,
    });
    if (!res.ok) {
      console.warn(
        `[CometAPI] Réponse HTTP ${res.status}, utilisation des modèles de repli.`
      );
      return FALLBACK_COMET_IMAGE_MODELS;
    }
    const json = await res.json();
    const rawList: any[] = json?.data || json?.models || [];
    if (!Array.isArray(rawList) || !rawList.length) {
      return FALLBACK_COMET_IMAGE_MODELS;
    }

    const imageModels = rawList.filter((m: any) => {
      if (!m?.id) return false;
      const idLower = String(m.id).toLowerCase();
      const mType = String(m.type || m.object || "").toLowerCase();
      return (
        mType.includes("image") ||
        idLower.includes("flux") ||
        idLower.includes("diffusion") ||
        idLower.includes("dall-e") ||
        idLower.includes("midjourney") ||
        idLower.includes("mj-") ||
        idLower.includes("recraft") ||
        idLower.includes("ideogram") ||
        idLower.includes("imagen") ||
        idLower.includes("photon") ||
        idLower.includes("sdxl")
      );
    });

    if (!imageModels.length) {
      return FALLBACK_COMET_IMAGE_MODELS;
    }

    const seenIds = new Set<string>();
    const normalized: JsonObject[] = [];

    for (const m of imageModels) {
      let rawId = String(m.id).trim();
      if (!rawId.includes("/")) {
        const org = String(m.owned_by || "").trim();
        rawId = org ? `${org}/${rawId}` : `cometapi/${rawId}`;
      }
      if (seenIds.has(rawId)) continue;
      seenIds.add(rawId);

      const labo = rawId.split("/")[0] || "cometapi";
      const name =
        typeof m.name === "string" && m.name
          ? m.name
          : rawId.split("/")[1] || rawId;

      normalized.push({
        architecture: {
          input_modalities: ["text"],
          modality: "text->image",
          output_modalities: ["image"],
        },
        context_length: 4096,
        created: Number.isSafeInteger(m.created)
          ? m.created
          : Math.floor(Date.now() / 1000),
        description:
          typeof m.description === "string"
            ? m.description
            : `Modèle d'image ${name}`,
        fournisseur: "cometapi",
        id: rawId,
        max_output_tokens: 1,
        name,
        pricing: object(m.pricing),
        provider: labo,
        supported_parameters: Array.isArray(m.features)
          ? m.features
          : ["text-to-image"],
        type: "image",
        upstream: m,
      });
    }

    return normalized.length ? normalized : FALLBACK_COMET_IMAGE_MODELS;
  } catch (err: any) {
    console.warn("[CometAPI] Échec fetch modèles :", err?.message || err);
    return FALLBACK_COMET_IMAGE_MODELS;
  }
}

export interface SyncOptions {
  apiKey?: string;
  cometApiKey?: string;
  fetcher?: typeof fetch;
  // Fourni par la CLI admin : chaque conflit est arbitré. Absent (cron
  // automatique), la version de la base de données est conservée sans interaction.
  resolveConflict?: ModelConflictResolver;
  signal?: AbortSignal;
}

function env(name: string): string | undefined {
  return typeof Deno === "undefined" ? process.env[name] : Deno.env.get(name);
}

export async function updateModels(sql?: SqlClient, options: SyncOptions = {}) {
  const databaseUrl = sql ? undefined : env("DATABASE_URL");
  if (!sql && !databaseUrl) throw new Error("DATABASE_URL est requis.");
  const db: SqlClient = sql ?? neon(databaseUrl!);
  const startedAt = new Date().toISOString();
  const apiKey = options.apiKey ?? env("OPENROUTER_API_KEY");
  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  const signal = options.signal
    ? AbortSignal.any([options.signal, AbortSignal.timeout(30_000)])
    : AbortSignal.timeout(30_000);

  // 1. Récupération & normalisation OpenRouter (Chat & API Speech pour l'audio)
  const [chatResponse, speechResponse] = await Promise.all([
    (options.fetcher ?? fetch)("https://openrouter.ai/api/v1/models", {
      headers,
      signal,
    }),
    (options.fetcher ?? fetch)(
      "https://openrouter.ai/api/v1/models?output_modalities=speech",
      { headers, signal }
    ),
  ]);
  if (!chatResponse.ok)
    throw new Error(`OpenRouter : HTTP ${chatResponse.status}`);
  if (!speechResponse.ok)
    throw new Error(`OpenRouter Speech : HTTP ${speechResponse.status}`);

  const chatJson = await chatResponse.json();
  const speechJson = await speechResponse.json();

  const chatList = Array.isArray(chatJson?.data) ? chatJson.data : [];
  const speechList = Array.isArray(speechJson?.data) ? speechJson.data : [];

  const rawMap = new Map<string, any>();
  for (const item of chatList) {
    if (item && typeof item === "object" && item.id) {
      rawMap.set(item.id, item);
    }
  }
  for (const item of speechList) {
    if (item && typeof item === "object" && item.id) {
      // Les modèles de l'API speech priment pour garantir la modalité speech/audio
      rawMap.set(item.id, item);
    }
  }

  const openrouterModels = normalizeOpenRouterModels(
    Array.from(rawMap.values())
  );

  // 2. Récupération & normalisation CometAPI (Images)
  const cometModels = await fetchCometImageModels(
    options.cometApiKey,
    options.fetcher ?? fetch,
    signal
  );

  // 3. Fusion des catalogues (Chat, Audio, Image)
  const combinedModels = [...openrouterModels, ...cometModels];

  const stored = combinedModels.length ? await loadStoredSyncModels(db) : [];
  const conflicts = findModelConflicts(combinedModels, stored);
  const resolutions = await resolveModelConflicts(
    conflicts,
    options.resolveConflict
  );

  const deletedIds = new Set(
    resolutions.filter((r) => r.choice === "delete").map((r) => r.conflict.id)
  );

  const modelsToPersist = deletedIds.size
    ? combinedModels.filter((m) => !deletedIds.has(m.id))
    : combinedModels;

  const result = modelsToPersist.length
    ? await persistModels(db, modelsToPersist, startedAt)
    : { retired: 0, skipped: true, upserted: 0 };

  if (!result.skipped) {
    await applyModelConflictWrites(db, resolutions);
  }

  if (deletedIds.size) {
    for (const id of deletedIds) {
      await db`DELETE FROM openrouter_models WHERE id = ${id}`;
    }
  }

  await db`DELETE FROM openrouter_models WHERE POSITION(':batch' IN LOWER(id)) > 0`;
  invalidateModelCatalog(db);

  const chatCount = combinedModels.filter((m) => m.type === "chat").length;
  const audioCount = combinedModels.filter((m) => m.type === "audio").length;
  const imageCount = combinedModels.filter((m) => m.type === "image").length;
  const orCount = combinedModels.filter(
    (m) => m.fournisseur === "openrouter"
  ).length;
  const cometCount = combinedModels.filter(
    (m) => m.fournisseur === "cometapi"
  ).length;

  console.log(
    `[updateModels] ${result.upserted} modèle(s) synchronisé(s) (Chat: ${chatCount}, Audio: ${audioCount}, Image: ${imageCount}). Fournisseurs : OpenRouter (${orCount}), CometAPI (${cometCount}).`
  );
  if (conflicts.length) {
    const kept = resolutions.filter((r) => r.choice === "database").length;
    const upstream = resolutions.filter((r) => r.choice === "upstream").length;
    const deleted = deletedIds.size;
    const details = [
      `${kept} conservé(s) en base de données`,
      `${upstream} pris depuis l'amont`,
    ];
    if (deleted) details.push(`${deleted} supprimé(s)`);
    console.log(
      `[updateModels] ${conflicts.length} conflit(s) base de données/amont : ${details.join(", ")}.`
    );
  }

  return {
    ...result,
    audioCount,
    chatCount,
    cometCount,
    conflicts: conflicts.length,
    conflictsDeleted: deletedIds.size,
    conflictsKeptInDatabase: resolutions.filter((r) => r.choice === "database")
      .length,
    conflictsTakenFromUpstream: resolutions.filter(
      (r) => r.choice === "upstream"
    ).length,
    imageCount,
    openrouterCount: orCount,
    total: combinedModels.length,
  };
}

async function persistModels(
  sql: SqlClient,
  models: JsonObject[],
  startedAt: string
) {
  const rows = await sql`
    SELECT * FROM sync_openrouter_models(${JSON.stringify(
      models
    )}::jsonb, ${startedAt}::timestamptz)
  `;
  if (!rows[0])
    throw new Error("La synchronisation n'a retourné aucun résultat.");
  return rows[0] as { upserted: number; retired: number; skipped: boolean };
}

async function loadStoredSyncModels(
  sql: SqlClient
): Promise<StoredSyncModel[]> {
  return (await sql`
    SELECT id, model_number, name, description, context_length,
      max_output_tokens, architecture, pricing, supported_parameters,
      type, provider, fournisseur, upstream, overrides
    FROM openrouter_models
  `) as StoredSyncModel[];
}

// Handler utilisable par un CRON externe (notamment un val CRON Val Town).
export default async function runModelSync() {
  return await updateModels();
}

const invokedFile = process.argv[1];
if (
  import.meta.url.startsWith("file:") &&
  invokedFile &&
  path.resolve(invokedFile) === fileURLToPath(import.meta.url)
) {
  const { loadLocalEnv } = await import("./cli-env.ts");
  loadLocalEnv();
  await runModelSync().catch((error) => {
    console.error("[updateModels] Échec :", error.message);
    process.exitCode = 1;
  });
}
