/**
 * Aide à la comptabilisation des tokens.
 *
 * Deux règles :
 *  • une entrée de `/log-usage` ne peut jamais diminuer un compteur : seules
 *    des valeurs finies, entières, positives et bornées sont acceptées ;
 *  • une génération directe se compte sur l'usage RÉEL du fournisseur (OpenAI,
 *    Anthropic, Gemini), pas sur un débit forfaitaire d'un token.
 *
 * Module pur, sans import Deno/Next : testable directement.
 */

export const MAX_TOKENS_PER_EVENT = 100_000_000;

export type ParsedUsageLog = {
  inputTokens: number;
  outputTokens: number;
  tokensUsed: number;
};

export type UsageLogParseResult =
  | { ok: true; value: ParsedUsageLog }
  | { ok: false; error: string };

function readCount(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return 0;
  }
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value >= 0 ? value : null;
  }
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    const parsed = Number(value.trim());
    return Number.isSafeInteger(parsed) ? parsed : null;
  }
  return null;
}

/**
 * Valide le corps de `/v1/log-usage`. Aucune coercition permissive : `-1`,
 * `NaN`, `Infinity`, `"1e3"`, `"0x10"`, un objet ou un dépassement de borne
 * sont refusés. Le total explicite ne peut pas être inférieur à la somme des
 * deux composantes fournies, sinon il sous-déclarerait la consommation.
 */
export function parseUsageLogPayload(body: unknown): UsageLogParseResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Corps de requête invalide.", ok: false };
  }
  const record = body as Record<string, unknown>;

  const inputTokens = readCount(
    record.inputTokens ?? record.promptTokens ?? undefined
  );
  if (inputTokens === null) {
    return { error: "inputTokens invalide.", ok: false };
  }
  const outputTokens = readCount(
    record.outputTokens ?? record.completionTokens ?? undefined
  );
  if (outputTokens === null) {
    return { error: "outputTokens invalide.", ok: false };
  }
  const sum = inputTokens + outputTokens;
  if (sum > MAX_TOKENS_PER_EVENT) {
    return { error: "Consommation déclarée hors limites.", ok: false };
  }

  const explicitRaw = record.tokensUsed ?? record.tokens;
  let tokensUsed = sum;
  if (explicitRaw !== undefined) {
    const explicit = readCount(explicitRaw);
    if (explicit === null) {
      return { error: "tokensUsed invalide.", ok: false };
    }
    if (explicit < sum) {
      return {
        error: "tokensUsed est inférieur à la somme input/output déclarée.",
        ok: false,
      };
    }
    tokensUsed = explicit;
  }
  if (tokensUsed > MAX_TOKENS_PER_EVENT) {
    return { error: "Consommation déclarée hors limites.", ok: false };
  }

  return {
    ok: true,
    value: { inputTokens, outputTokens, tokensUsed },
  };
}

function readPositiveInteger(...candidates: unknown[]): number | null {
  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      const value = Math.floor(candidate);
      if (value >= 0) return value;
    }
  }
  return null;
}

/**
 * Extrait le total de tokens d'une réponse fournisseur, quel que soit son
 * dialecte : OpenAI (`prompt_tokens`/`completion_tokens`), Anthropic
 * (`input_tokens`/`output_tokens`), Gemini (`usageMetadata`).
 */
export function extractUsageTokens(payload: unknown): number | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, any>;

  const usage =
    record.usage && typeof record.usage === "object" ? record.usage : null;
  if (usage) {
    const total = readPositiveInteger(usage.total_tokens, usage.totalTokens);
    if (total !== null && total > 0) return total;
    const input =
      readPositiveInteger(usage.prompt_tokens, usage.input_tokens) ?? 0;
    const output =
      readPositiveInteger(usage.completion_tokens, usage.output_tokens) ?? 0;
    if (input + output > 0) return input + output;
  }

  const metadata =
    record.usageMetadata && typeof record.usageMetadata === "object"
      ? record.usageMetadata
      : null;
  if (metadata) {
    const total = readPositiveInteger(
      metadata.totalTokenCount,
      metadata.total_token_count
    );
    if (total !== null && total > 0) return total;
    const prompt =
      readPositiveInteger(
        metadata.promptTokenCount,
        metadata.prompt_token_count
      ) ?? 0;
    const candidates =
      readPositiveInteger(
        metadata.candidatesTokenCount,
        metadata.candidates_token_count
      ) ?? 0;
    if (prompt + candidates > 0) return prompt + candidates;
  }

  return null;
}

/**
 * Dernier usage trouvé dans un flux SSE. Les lignes `data:` sont du JSON ;
 * OpenRouter ajoute un chunk final `{ choices: [], usage: {...} }` lorsque
 * `stream_options.include_usage` est demandé.
 */
export function extractUsageFromSseText(text: string): number | null {
  let found: number | null = null;
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;
    const data = trimmed.slice(5).trim();
    if (!data || data === "[DONE]") continue;
    try {
      const parsed = JSON.parse(data);
      const tokens = extractUsageTokens(parsed);
      if (tokens !== null) found = tokens;
    } catch {
      // Ligne partielle : le tampon sera relu au prochain chunk.
    }
  }
  return found;
}

/** Estimation de repli, utilisée uniquement si le fournisseur ne dit rien. */
export function estimateTokensFromText(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

/**
 * Demande l'usage réel au fournisseur. Pour un flux, OpenRouter ne l'envoie
 * que si `stream_options.include_usage` est vrai ; le body client est copié
 * pour ne pas le muter.
 */
export function ensureUsageIncluded<T extends Record<string, any>>(
  body: T
): T & { stream_options?: Record<string, unknown> } {
  if (body?.stream === true) {
    const streamOptions =
      body.stream_options && typeof body.stream_options === "object"
        ? body.stream_options
        : {};
    return {
      ...body,
      stream_options: { ...streamOptions, include_usage: true },
    };
  }
  return body;
}
