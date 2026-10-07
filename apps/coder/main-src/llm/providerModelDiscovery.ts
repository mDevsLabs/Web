import { HttpsProxyAgent } from "https-proxy-agent";
import OpenAI from "openai";
import { getSettings, type UserLlmProvider } from "../settingsStore.js";
import { formatLlmSdkError } from "./formatLlmSdkError.js";
import { applyOpenAIProviderIdentity } from "./providerIdentity.js";

const OPENAI_COMPAT_FALLBACK_API_KEY = "async-local";

export type DiscoveredProviderModel = {
  id: string;
  displayName?: string;
  contextWindowTokens?: number;
  maxOutputTokens?: number;
};

export type DiscoverProviderModelsResult =
  | { ok: true; models: DiscoveredProviderModel[] }
  | { ok: false; message: string };

function normalizePositiveInt(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : undefined;
}

function extractContextWindowTokens(
  raw: Record<string, unknown>
): number | undefined {
  return (
    normalizePositiveInt(raw.context_window) ??
    normalizePositiveInt(raw.maxContext)
  );
}

function extractMaxOutputTokens(
  raw: Record<string, unknown>
): number | undefined {
  return (
    normalizePositiveInt(raw.max_output_tokens) ??
    normalizePositiveInt(raw.max_completion_tokens) ??
    normalizePositiveInt(raw.maxOutput)
  );
}

export async function discoverProviderModels(
  provider: UserLlmProvider
): Promise<DiscoverProviderModelsResult> {
  if (provider.paradigm !== "openai-compatible") {
    return {
      message:
        "Actuellement, seule la découverte automatique des fournisseurs compatibles OpenAI est supportée.",
      ok: false,
    };
  }

  let httpAgent: InstanceType<typeof HttpsProxyAgent> | undefined;
  const proxyRaw = provider.proxyUrl?.trim();
  if (proxyRaw) {
    try {
      httpAgent = new HttpsProxyAgent(proxyRaw);
    } catch {
      return {
        message:
          "Adresse proxy invalide. Vérifiez le format (ex: http://127.0.0.1:7890).",
        ok: false,
      };
    }
  }

  try {
    const client = new OpenAI(
      applyOpenAIProviderIdentity(
        getSettings(),
        {
          apiKey: provider.apiKey?.trim() || OPENAI_COMPAT_FALLBACK_API_KEY,
          baseURL: provider.baseURL?.trim() || undefined,
          httpAgent,
          maxRetries: 0,
          timeout: 30_000,
        },
        provider.providerIdentity
      )
    );
    const page = await client.models.list();
    const seen = new Set<string>();
    const models: DiscoveredProviderModel[] = [];

    for (const row of page.data) {
      const id = row.id.trim();
      const dedupeKey = id.toLowerCase();
      if (!id || seen.has(dedupeKey)) {
        continue;
      }
      seen.add(dedupeKey);
      const extended = row as unknown as Record<string, unknown>;
      const contextWindowTokens = extractContextWindowTokens(extended);
      const maxOutputTokens = extractMaxOutputTokens(extended);
      const displayName =
        typeof extended.name === "string" && extended.name.trim()
          ? extended.name.trim()
          : undefined;
      models.push({
        id,
        ...(displayName ? { displayName } : {}),
        ...(contextWindowTokens == null ? {} : { contextWindowTokens }),
        ...(maxOutputTokens == null ? {} : { maxOutputTokens }),
      });
    }

    models.sort((a, b) =>
      a.id.localeCompare(b.id, undefined, { sensitivity: "base" })
    );
    return { models, ok: true };
  } catch (error) {
    return {
      message: formatLlmSdkError(error),
      ok: false,
    };
  }
}
