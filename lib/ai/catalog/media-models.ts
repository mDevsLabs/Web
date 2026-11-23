import "server-only";

import type { AudioResponseFormat } from "@/lib/audio/format";
import { dbReady, getRawClient } from "@/lib/db/queries/connection";
import { isPaidTier } from "@/lib/auth/plan";
import { getModelCatalog, type SqlClient, type StoredModel } from "@/openrouter-models";
import {
  buildCometImageCatalog,
  buildSpeechCatalog,
  buildSpeechVoicesFromModels,
  type CatalogImageModel,
  type CatalogSpeechModel,
  type CatalogSpeechVoice,
  getDefaultCometImageModelId,
  type OpenRouterSpeechParamSpec,
  parseOpenRouterSpeechCapabilities,
  resolveCometImageRequestModel,
  resolveSpeechGenerationParams,
} from "./media-models-pure";

const SPEECH_CAPS_TTL_MS = 10 * 60_000;
let speechCapsCache: {
  expiresAt: number;
  specs: Map<string, OpenRouterSpeechParamSpec>;
} | null = null;
let speechCapsInFlight: Promise<Map<string, OpenRouterSpeechParamSpec>> | null =
  null;

async function readStoredModelCatalog(): Promise<StoredModel[]> {
  await dbReady();
  const raw = getRawClient();
  if (!raw) {
    throw new Error("Client PostgreSQL indisponible.");
  }
  const catalog = await getModelCatalog(raw as unknown as SqlClient);
  return catalog.models;
}

export async function getSpeechCapabilitiesMap(): Promise<
  Map<string, OpenRouterSpeechParamSpec>
> {
  const now = Date.now();
  if (speechCapsCache && now < speechCapsCache.expiresAt) {
    return speechCapsCache.specs;
  }
  if (speechCapsInFlight) {
    return speechCapsInFlight;
  }
  speechCapsInFlight = (async () => {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/audio/speech/models", {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) {
        return speechCapsCache?.specs ?? new Map();
      }
      const json = (await res.json().catch(() => null)) as {
        data?: unknown;
      } | null;
      const specs = parseOpenRouterSpeechCapabilities(json?.data);
      speechCapsCache = {
        expiresAt: Date.now() + SPEECH_CAPS_TTL_MS,
        specs,
      };
      return specs;
    } catch {
      return speechCapsCache?.specs ?? new Map();
    } finally {
      speechCapsInFlight = null;
    }
  })();
  return speechCapsInFlight;
}

export async function listCometImageModelsFromDb(): Promise<
  CatalogImageModel[]
> {
  const storedModels = await readStoredModelCatalog();
  return buildCometImageCatalog(storedModels);
}

export async function getDefaultCometImageModelFromDb(): Promise<string> {
  const models = await listCometImageModelsFromDb();
  return getDefaultCometImageModelId(models);
}

export async function resolveCometImageModelForRequest(params: {
  allowLegacyFallback?: boolean;
  requestedModel?: string | null;
}) {
  const models = await listCometImageModelsFromDb();
  return resolveCometImageRequestModel({
    allowLegacyFallback: params.allowLegacyFallback,
    models,
    requestedModel: params.requestedModel,
  });
}

export async function listSpeechModelsFromDb(
  tier?: string | null
): Promise<CatalogSpeechModel[]> {
  const [storedModels, paramSpecs] = await Promise.all([
    readStoredModelCatalog(),
    getSpeechCapabilitiesMap(),
  ]);
  return buildSpeechCatalog({
    isPaid: isPaidTier(tier),
    paramSpecs,
    storedModels,
  });
}

export async function listSpeechVoicesFromDb(
  tier?: string | null
): Promise<CatalogSpeechVoice[]> {
  const models = await listSpeechModelsFromDb(tier);
  return buildSpeechVoicesFromModels(models);
}

export async function resolveSpeechModelForRequest(params: {
  allowLegacyFallback?: boolean;
  requestedFormat: AudioResponseFormat;
  requestedModel?: string | null;
  requestedSpeed?: number;
  requestedVoice?: string | null;
  tier?: string | null;
}) {
  const [allActiveModels, paramSpecs] = await Promise.all([
    readStoredModelCatalog(),
    getSpeechCapabilitiesMap(),
  ]);
  return resolveSpeechGenerationParams({
    allActiveModels,
    allowLegacyFallback: params.allowLegacyFallback,
    isPaid: isPaidTier(params.tier),
    paramSpecs,
    requestedFormat: params.requestedFormat,
    requestedModel: params.requestedModel,
    requestedSpeed: params.requestedSpeed,
    requestedVoice: params.requestedVoice,
  });
}
