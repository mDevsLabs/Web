// Usage provider normalisé : structure indépendante des fournisseurs, alimentée
// depuis les usages bruts du SDK. Le frontend ne recalcule jamais le quota ni
// le coût : il affiche ce que le serveur persiste.

export type NormalizedUsage = {
  cacheReadTokens: number;
  cacheWriteTokens: number;
  inputTokens: number;
  latencyMs: number | null;
  outputTokens: number;
  provider: string | null;
  reasoningTokens: number;
  retries: number;
  // Unités de calcul spécifiques (images, audio, exécution de code…) : null
  // quand le provider n'en expose pas.
  computeUnits: number | null;
  totalTokens: number;
};

export function emptyNormalizedUsage(): NormalizedUsage {
  return {
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    computeUnits: null,
    inputTokens: 0,
    latencyMs: null,
    outputTokens: 0,
    provider: null,
    reasoningTokens: 0,
    retries: 0,
    totalTokens: 0,
  };
}

function readNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : 0;
}

// Normalisation tolérante : accepte les deux conventions de nommage du SDK
// (inputTokens/promptTokens, outputTokens/completionTokens, cachedInputTokens)
// et ignore tout ce qui n'est pas un nombre fini positif.
export function normalizeProviderUsage(
  raw: unknown,
  context: {
    provider?: string | null;
    latencyMs?: number | null;
    retries?: number;
  } = {}
): NormalizedUsage {
  const record =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const inputTokens = readNumber(record.inputTokens ?? record.promptTokens);
  const outputTokens = readNumber(
    record.outputTokens ?? record.completionTokens
  );
  const reasoning = record.reasoningTokens ?? record.completionTokensDetails;
  const reasoningTokens =
    typeof reasoning === "object" && reasoning !== null
      ? readNumber((reasoning as Record<string, unknown>).reasoningTokens)
      : readNumber(reasoning);

  const normalized: NormalizedUsage = {
    ...emptyNormalizedUsage(),
    cacheReadTokens: readNumber(
      (record.cachedInputTokens as number | undefined) ??
        (record.cacheReadTokens as number | undefined)
    ),
    cacheWriteTokens: readNumber(record.cacheWriteTokens),
    computeUnits:
      record.computeUnits === undefined
        ? null
        : readNumber(record.computeUnits) || null,
    inputTokens,
    latencyMs: context.latencyMs ?? null,
    outputTokens,
    provider: context.provider ?? null,
    reasoningTokens,
    retries: context.retries ?? 0,
    totalTokens: inputTokens + outputTokens + reasoningTokens,
  };
  return normalized;
}

export function addNormalizedUsage(
  a: NormalizedUsage,
  b: NormalizedUsage
): NormalizedUsage {
  return {
    cacheReadTokens: a.cacheReadTokens + b.cacheReadTokens,
    cacheWriteTokens: a.cacheWriteTokens + b.cacheWriteTokens,
    computeUnits:
      a.computeUnits === null && b.computeUnits === null
        ? null
        : (a.computeUnits ?? 0) + (b.computeUnits ?? 0),
    inputTokens: a.inputTokens + b.inputTokens,
    latencyMs:
      a.latencyMs === null && b.latencyMs === null
        ? null
        : (a.latencyMs ?? 0) + (b.latencyMs ?? 0),
    outputTokens: a.outputTokens + b.outputTokens,
    provider: a.provider ?? b.provider,
    reasoningTokens: a.reasoningTokens + b.reasoningTokens,
    retries: a.retries + b.retries,
    totalTokens: a.totalTokens + b.totalTokens,
  };
}

// Estimation de coût : TOUJOURS libellée comme estimation, et null tant
// qu'aucun tarif fiable n'est configuré côté mAI (cas actuel).
export type CostEstimate = {
  amountUsd: number;
  basis: "configured_mai_pricing";
} | null;

export function estimateRunCost(): CostEstimate {
  // Aucun tarif configuré dans mAI aujourd'hui : on refuse d'inventer un
  // chiffre. La synthèse affiche « coût indisponible » plutôt qu'une estimation
  // non fondée.
  return null;
}
