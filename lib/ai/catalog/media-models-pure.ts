/**
 * Logique pure de filtrage, tri et résolution des catalogues Image (CometAPI)
 * et Audio/Speech (OpenRouter) depuis `openrouter_models`.
 *
 * Ce module ne touche ni à la base ni au réseau : il est directement testable
 * et partagé entre les routes API et les générateurs Chat/Agent.
 */

import { normalizeModelDisplayName } from "@/lib/ai/models";
import type { AudioResponseFormat } from "@/lib/audio/format";
import {
  effectiveFournisseur,
  effectiveModel,
  isFreeModelId,
  isPublicImageModel,
  type StoredModel,
  selectAudioModels,
} from "@/openrouter-models";
import {
  DEFAULT_AUDIO_MODEL,
  DEFAULT_AUDIO_VOICE,
  DEFAULT_IMAGE_MODEL,
} from "./media-defaults";

export type CatalogImageModel = {
  capabilities: {
    async_task: boolean;
    image_to_image: boolean;
    inpainting: boolean;
    text_to_image: boolean;
  };
  created: number;
  description: string;
  endpoints: string[];
  features: string[];
  form: string;
  fournisseur: string;
  id: string;
  isFree: boolean;
  name: string;
  object: "model";
  owned_by: string;
  provider: string;
};

export type OpenRouterSpeechParamSpec = {
  supportedFormats: AudioResponseFormat[];
  supportsSpeed: boolean;
  voices?: string[];
};

export type CatalogSpeechModel = {
  created: number;
  description: string;
  fournisseur: string;
  id: string;
  isFree: boolean;
  name: string;
  object: "model";
  owned_by: string;
  provider: string;
  supportedFormats: AudioResponseFormat[];
  supportsSpeed: boolean;
  voices: string[];
};

export type CatalogSpeechVoice = {
  description: string;
  gender?: string;
  id: string;
  language?: string;
  name: string;
};

const LEGACY_OBSOLETE_IMAGE_IDS = new Set([
  "black-forest-labs/flux-schnell",
  "black-forest-labs/flux-1-schnell",
  "flux-schnell",
  "flux-1-schnell",
]);

const LEGACY_OBSOLETE_AUDIO_IDS = new Set([
  "deepgram/flux-tts:free",
  "openai/tts-1",
  "openai/tts-1-hd",
]);

function compareAlphabetical(a: string, b: string): number {
  return a.localeCompare(b, "fr", { sensitivity: "base" });
}

export function normalizeBaseSpeechModelId(modelId: string): string {
  return modelId.trim().replace(/:free$/i, "");
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

export function inferImageModelProvider(
  modelId: string,
  rawProvider: string
): string {
  const cleanedProvider = rawProvider.trim().toLowerCase();
  if (
    cleanedProvider &&
    cleanedProvider !== "cometapi" &&
    cleanedProvider !== "openrouter" &&
    cleanedProvider !== "inconnu" &&
    cleanedProvider !== "unknown" &&
    cleanedProvider !== modelId.toLowerCase()
  ) {
    return rawProvider.trim();
  }

  const lowerId = modelId.trim().toLowerCase();
  if (lowerId.includes("/")) {
    const prefix = lowerId.split("/")[0];
    if (prefix && prefix !== "cometapi" && prefix !== "openrouter") {
      return prefix;
    }
  }

  if (lowerId.includes("flux")) return "black-forest-labs";
  if (lowerId.startsWith("dall-e") || lowerId.startsWith("gpt-image"))
    return "openai";
  if (
    lowerId.includes("stable-diffusion") ||
    lowerId.startsWith("sdxl") ||
    lowerId.startsWith("sd3") ||
    lowerId.startsWith("sd-")
  ) {
    return "stability-ai";
  }
  if (lowerId.includes("midjourney") || lowerId.startsWith("mj-"))
    return "midjourney";
  if (lowerId.includes("recraft")) return "recraft-ai";
  if (lowerId.includes("ideogram")) return "ideogram-ai";
  if (lowerId.includes("imagen") || lowerId.includes("gemini")) return "google";
  if (lowerId.includes("photon") || lowerId.includes("luma")) return "luma";
  if (lowerId.includes("seedream") || lowerId.includes("doubao"))
    return "bytedance";
  if (lowerId.includes("kling") || lowerId.includes("kolors"))
    return "kwaipilot";
  if (lowerId.includes("hunyuan")) return "tencent";
  if (lowerId.includes("qwen") || lowerId.includes("wan")) return "qwen";

  return rawProvider.trim() || "mai";
}

function formatImageModelDescription(
  rawDescription: string | undefined,
  displayName: string
): string {
  const trimmed = (rawDescription ?? "").trim();
  if (
    !trimmed ||
    /^mod[èe]le (?:d['’]image|de g[ée]n[ée]ration d['’]images)\s+[a-z0-9._/-]+\.?$/i.test(
      trimmed
    )
  ) {
    return `Modèle de génération d'images ${displayName}.`;
  }
  return trimmed;
}

/**
 * Construit le catalogue d'images à partir de `openrouter_models` :
 * - uniquement le fournisseur `cometapi`
 * - tous les modèles actifs (`isActive && is_available`) quel que soit le plan
 * - triés par ordre alphabétique
 */
export function buildCometImageCatalog(
  storedModels: StoredModel[]
): CatalogImageModel[] {
  const mapped = storedModels
    .filter(
      (model) =>
        isPublicImageModel(model) &&
        effectiveFournisseur(model).toLowerCase() === "cometapi"
    )
    .map((model): CatalogImageModel => {
      const eff = effectiveModel(model);
      const rawFeatures = Array.isArray(eff.supported_parameters)
        ? eff.supported_parameters.map((f) => String(f).toLowerCase())
        : [];
      const features = rawFeatures.length > 0 ? rawFeatures : ["text-to-image"];
      const supportsEdit =
        features.includes("image-to-image") ||
        features.includes("edits") ||
        eff.id.toLowerCase().includes("kontext");
      const resolvedProvider = inferImageModelProvider(eff.id, eff.provider);
      let displayName = normalizeModelDisplayName(eff.id, eff.name);
      if (
        resolvedProvider === "midjourney" &&
        /^v\d+(?:\.\d+)*$/i.test(displayName)
      ) {
        displayName = `Midjourney ${displayName}`;
      }
      const isFree =
        typeof model.overrides?.isFree === "boolean"
          ? model.overrides.isFree
          : isFreeModelId(eff.id);

      return {
        capabilities: {
          async_task: true,
          image_to_image: supportsEdit,
          inpainting: features.includes("inpainting"),
          text_to_image: true,
        },
        created: eff.created,
        description: formatImageModelDescription(eff.description, displayName),
        endpoints: supportsEdit
          ? ["/v1/images/generations", "/v1/images/edits"]
          : ["/v1/images/generations"],
        features,
        form: "openai-standard",
        fournisseur: "cometapi",
        id: eff.id,
        isFree,
        name: displayName,
        object: "model",
        owned_by: resolvedProvider,
        provider: resolvedProvider,
      };
    });

  mapped.sort(
    (a, b) =>
      compareAlphabetical(a.name, b.name) || compareAlphabetical(a.id, b.id)
  );
  return mapped;
}

export function getDefaultCometImageModelId(
  models: CatalogImageModel[]
): string {
  return models[0]?.id ?? DEFAULT_IMAGE_MODEL;
}

/**
 * Résout le modèle d'image à utiliser pour une requête donnée :
 * - si `requestedModel` est absent, vide ou correspond à un ancien défaut
 *   obsolète (ex. `flux-schnell`), retourne le premier modèle alphabétique.
 * - si un identifiant explicite est fourni, il doit être actif chez CometAPI.
 */
export function resolveCometImageRequestModel(params: {
  allowLegacyFallback?: boolean;
  models: CatalogImageModel[];
  requestedModel?: string | null;
}):
  | { model: CatalogImageModel; ok: true }
  | { code: string; message: string; ok: false; status: 400 | 404 | 503 } {
  const { allowLegacyFallback = true, models, requestedModel } = params;
  if (models.length === 0) {
    return {
      code: "image_catalog_empty",
      message: "Aucun modèle d'image CometAPI actif n'est disponible.",
      ok: false,
      status: 503,
    };
  }

  const trimmed = (requestedModel ?? "").trim();
  if (!trimmed) {
    return { model: models[0], ok: true };
  }

  const lower = trimmed.toLowerCase();
  const exact = models.find((m) => m.id.toLowerCase() === lower);
  if (exact) {
    return { model: exact, ok: true };
  }

  // Accepter un slug court (ex. `flux-1.1-pro`) s'il correspond de façon unique
  const bySlug = models.filter((m) => {
    const slug = m.id.split("/").slice(1).join("/").toLowerCase();
    return slug === lower;
  });
  if (bySlug.length === 1) {
    return { model: bySlug[0], ok: true };
  }

  if (allowLegacyFallback && LEGACY_OBSOLETE_IMAGE_IDS.has(lower)) {
    return { model: models[0], ok: true };
  }

  return {
    code: "model_not_found",
    message:
      "Ce modèle d'image n'est pas disponible dans le catalogue CometAPI actif.",
    ok: false,
    status: 404,
  };
}

/**
 * Fallback local sur les paramètres OpenRouter Speech quand la métadonnée
 * dynamique `/audio/speech/models` n'est pas disponible.
 */
export function inferSpeechParamSpecFallback(
  modelId: string
): OpenRouterSpeechParamSpec {
  const lower = normalizeBaseSpeechModelId(modelId).toLowerCase();
  if (lower.startsWith("heygen/") || lower.includes("gemini-")) {
    return {
      supportedFormats: ["pcm"],
      supportsSpeed: false,
    };
  }
  const supportsSpeed =
    lower.startsWith("fish-audio/") ||
    lower.startsWith("speechify/") ||
    lower.startsWith("microsoft/mai-voice") ||
    lower.startsWith("sesame/") ||
    lower.startsWith("canopylabs/") ||
    lower.startsWith("hexgrad/") ||
    /^elevenlabs\/eleven-(v3|turbo-v2|flash-v2\.5|multilingual)/.test(lower);

  return {
    supportedFormats: ["mp3", "pcm"],
    supportsSpeed,
  };
}

/**
 * Parse la réponse de `https://openrouter.ai/api/v1/audio/speech/models` en
 * un index par identifiant de modèle (sans `:free`).
 */
export function parseOpenRouterSpeechCapabilities(
  rawData: unknown
): Map<string, OpenRouterSpeechParamSpec> {
  const map = new Map<string, OpenRouterSpeechParamSpec>();
  if (!Array.isArray(rawData)) {
    return map;
  }

  for (const item of rawData) {
    if (
      !item ||
      typeof item !== "object" ||
      typeof (item as any).id !== "string"
    ) {
      continue;
    }
    const id = (item as any).id.trim();
    const outputs = Array.isArray((item as any).output_modalities)
      ? (item as any).output_modalities
      : [];
    const speechOut =
      outputs.find((o: any) => o?.type === "speech") ?? outputs[0];
    const params = speechOut?.supported_parameters ?? {};

    const rawFormats = readStringArray(params?.response_format?.values)
      .map((f) => f.toLowerCase())
      .filter(
        (f): f is AudioResponseFormat =>
          f === "mp3" ||
          f === "pcm" ||
          f === "wav" ||
          f === "opus" ||
          f === "flac" ||
          f === "aac"
      );
    const supportedFormats: AudioResponseFormat[] =
      rawFormats.length > 0 ? rawFormats : ["mp3", "pcm"];

    const supportsSpeed = Boolean(params?.speed);
    const voices = readStringArray(params?.voice?.values);

    map.set(normalizeBaseSpeechModelId(id), {
      supportedFormats,
      supportsSpeed,
      ...(voices.length > 0 ? { voices } : {}),
    });
  }

  return map;
}

/**
 * Construit le catalogue Speech depuis `openrouter_models` :
 * - comptes Free : uniquement les modèles `:free` (`selectAudioModels(..., false)`)
 * - comptes payants : tous les modèles `audio` actifs et disponibles
 */
export function buildSpeechCatalog(params: {
  isPaid: boolean;
  paramSpecs?: Map<string, OpenRouterSpeechParamSpec>;
  storedModels: StoredModel[];
}): CatalogSpeechModel[] {
  const filtered = selectAudioModels(params.storedModels, params.isPaid);
  const models = filtered.map((model): CatalogSpeechModel => {
    const eff = effectiveModel(model);
    const baseId = normalizeBaseSpeechModelId(eff.id);
    const spec =
      params.paramSpecs?.get(eff.id) ??
      params.paramSpecs?.get(baseId) ??
      inferSpeechParamSpecFallback(eff.id);

    const dbVoices = readStringArray(
      model.overrides?.supported_voices ?? model.upstream?.supported_voices
    );
    const voices = dbVoices.length > 0 ? dbVoices : (spec.voices ?? []);

    return {
      created: eff.created,
      description: eff.description || `Modèle de synthèse vocale ${eff.name}.`,
      fournisseur: eff.fournisseur,
      id: eff.id,
      isFree: isFreeModelId(eff.id),
      name: normalizeModelDisplayName(eff.id, eff.name),
      object: "model",
      owned_by: eff.provider,
      provider: eff.provider,
      supportedFormats: spec.supportedFormats,
      supportsSpeed: spec.supportsSpeed,
      voices,
    };
  });

  // Modèle par défaut en tête s'il est présent, puis ordre alphabétique
  models.sort((a, b) => {
    if (a.id === DEFAULT_AUDIO_MODEL && b.id !== DEFAULT_AUDIO_MODEL) return -1;
    if (b.id === DEFAULT_AUDIO_MODEL && a.id !== DEFAULT_AUDIO_MODEL) return 1;
    return (
      compareAlphabetical(a.name, b.name) || compareAlphabetical(a.id, b.id)
    );
  });

  return models;
}

export function formatVoiceDisplayName(voiceId: string): string {
  const base = voiceId
    .replace(/^(flux|aura-2|aai)-/i, "")
    .replace(/:MAI-Voice-[^:]+$/i, "");
  const parts = base.split(/[-_]+/).filter(Boolean);
  // Retirer un éventuel suffixe de langue (en, fr, es...) si un nom le précède
  if (parts.length > 1 && /^[a-z]{2}$/i.test(parts.at(-1) ?? "")) {
    parts.pop();
  }
  const label = parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  return label || voiceId;
}

export function buildSpeechVoicesFromModels(
  models: CatalogSpeechModel[]
): CatalogSpeechVoice[] {
  const seen = new Set<string>();
  const voices: CatalogSpeechVoice[] = [];
  for (const model of models) {
    for (const voiceId of model.voices) {
      if (seen.has(voiceId)) continue;
      seen.add(voiceId);
      voices.push({
        description: `Voix officielle (${model.name})`,
        id: voiceId,
        name: formatVoiceDisplayName(voiceId),
      });
    }
  }
  return voices;
}

/**
 * Résout modèle, voix, format et vitesse pour une requête OpenRouter Speech :
 * - applique le filtrage `:free` sur les comptes gratuits
 * - repli sur le défaut gratuit si la préférence ou demande provient d'un
 *   ancien défaut supprimé (`deepgram/flux-tts:free`, `openai/tts-1*`)
 * - refuse en 403 un modèle payant demandé explicitement par un compte Free
 */
export function resolveSpeechGenerationParams(params: {
  allActiveModels: StoredModel[];
  allowLegacyFallback?: boolean;
  isPaid: boolean;
  paramSpecs?: Map<string, OpenRouterSpeechParamSpec>;
  requestedFormat: AudioResponseFormat;
  requestedModel?: string | null;
  requestedSpeed?: number;
  requestedVoice?: string | null;
}):
  | {
      model: CatalogSpeechModel;
      ok: true;
      payload: Record<string, unknown>;
      responseFormat: AudioResponseFormat;
      voice: string;
    }
  | {
      code: string;
      message: string;
      ok: false;
      status: 400 | 403 | 404 | 503;
    } {
  const accessible = buildSpeechCatalog({
    isPaid: params.isPaid,
    paramSpecs: params.paramSpecs,
    storedModels: params.allActiveModels,
  });

  if (accessible.length === 0) {
    return {
      code: "speech_catalog_empty",
      message: "Aucun modèle audio disponible pour votre forfait.",
      ok: false,
      status: 503,
    };
  }

  const defaultAccessible =
    accessible.find((m) => m.id === DEFAULT_AUDIO_MODEL) ?? accessible[0];
  const requested = (params.requestedModel ?? "").trim();

  let targetModel: CatalogSpeechModel | undefined;
  if (requested) {
    const lower = requested.toLowerCase();
    targetModel = accessible.find((m) => m.id.toLowerCase() === lower);

    if (!targetModel) {
      // Vérifier si le modèle existe en payant alors que l'utilisateur est Free
      const allActive = buildSpeechCatalog({
        isPaid: true,
        paramSpecs: params.paramSpecs,
        storedModels: params.allActiveModels,
      });
      const paidMatch = allActive.find((m) => m.id.toLowerCase() === lower);
      if (paidMatch && !params.isPaid) {
        return {
          code: "model_access_denied",
          message:
            "Ce modèle audio nécessite un forfait Plus, Pro ou Max (forfait Free limité aux modèles :free).",
          ok: false,
          status: 403,
        };
      }

      if (
        (params.allowLegacyFallback ?? true) &&
        LEGACY_OBSOLETE_AUDIO_IDS.has(lower)
      ) {
        targetModel = defaultAccessible;
      } else {
        return {
          code: "model_not_found",
          message: "Ce modèle audio n'est pas disponible dans le catalogue.",
          ok: false,
          status: 404,
        };
      }
    }
  } else {
    targetModel = defaultAccessible;
  }

  // Choix de la voix compatible avec le modèle
  const reqVoice = (params.requestedVoice ?? "").trim();
  let resolvedVoice = "";
  if (targetModel.voices.length > 0) {
    const matchedVoice = reqVoice
      ? targetModel.voices.find(
          (v) => v.toLowerCase() === reqVoice.toLowerCase()
        )
      : undefined;
    if (matchedVoice) {
      resolvedVoice = matchedVoice;
    } else if (
      targetModel.id === DEFAULT_AUDIO_MODEL &&
      targetModel.voices.includes(DEFAULT_AUDIO_VOICE)
    ) {
      resolvedVoice = DEFAULT_AUDIO_VOICE;
    } else {
      resolvedVoice = targetModel.voices[0];
    }
  } else if (reqVoice && !reqVoice.toLowerCase().startsWith("flux-")) {
    // Modèle sans enum fermé (ex. Fish Audio) : ne pas transmettre les
    // anciennes voix `flux-*` incompatibles.
    resolvedVoice = reqVoice;
  }

  // Choix du format supporté par le modèle
  const responseFormat = targetModel.supportedFormats.includes(
    params.requestedFormat
  )
    ? params.requestedFormat
    : (targetModel.supportedFormats[0] ?? "mp3");

  const payload: Record<string, unknown> = {
    model: targetModel.id,
    response_format: responseFormat,
  };
  if (resolvedVoice) {
    payload.voice = resolvedVoice;
  }
  if (
    targetModel.supportsSpeed &&
    typeof params.requestedSpeed === "number" &&
    Number.isFinite(params.requestedSpeed)
  ) {
    payload.speed = params.requestedSpeed;
  }

  return {
    model: targetModel,
    ok: true,
    payload,
    responseFormat,
    voice: resolvedVoice,
  };
}
