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

/**
 * Total facturable d'un appel, sans double comptage de la réflexion.
 *
 * `reasoning_tokens` est un SOUS-ENSEMBLE de `completion_tokens`, et c'est
 * vérifié dans le contrat de l'AI SDK : `onFinish` livre `outputTokens` à plat,
 * réponse déjà incluse, et `outputTokenDetails.reasoningTokens` uniquement pour
 * la décomposition. Le total amont inclut donc déjà la réflexion.
 *
 * Conséquence : on ne l'ajoute JAMAIS. L'additionner facturerait deux fois la
 * réflexion sur chaque appel raisonnant — un niveau « élevée » sur un modèle
 * bavard créerait des dizaines de milliers de tokens fantômes. Elle est
 * conservée à part, pour l'affichage et la décomposition du quota.
 */
export function resolveBillableTotal(input: {
  inputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  totalTokens: number;
}): number {
  const base =
    Math.max(0, input.inputTokens || 0) + Math.max(0, input.outputTokens || 0);
  const reported = Math.max(0, input.totalTokens || 0);

  // Un total amont existe : il fait foi, réflexion comprise.
  if (reported > 0) {
    return reported;
  }
  // Aucun total : entrée + sortie suffit. `outputTokens` inclut déjà la
  // réflexion dans le contrat de l'AI SDK, la retirer pour la réadditionner
  // serait un aller-retour inutile.
  return base;
}

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

// Détail de raisonnement renvoyé par le fournisseur (`reasoning_details`).
// On ne garde que ce qui est affichable : le contenu textuel et les métadonnées,
// jamais une chaîne chiffrée que l'on ne pourrait pas rendre.
export type ReasoningDetail = Record<string, unknown> & {
  text?: string;
  type?: string;
};

/**
 * Lit les tokens de réflexion quelle que soit la convention reçue.
 *
 * Quatre formes coexistent et il faut toutes les accepter :
 * - `outputTokenDetails.reasoningTokens` : la forme réellement livrée par
 *   `onFinish` de l'AI SDK v7 (le provider y place la décomposition) ;
 * - `completion_tokens_details.reasoning_tokens` : la forme brute du
 *   fournisseur, en snake_case ;
 * - `reasoningTokens` à plat, et l'ancienne forme camelCase imbriquée.
 *
 * Traiter cela séparément à chaque appelant a déjà produit des trous : le
 * décompte du Chat et celui de l'Agent lisaient des propriétés différentes.
 */
export function readReasoningTokens(raw: unknown): number {
  if (!raw || typeof raw !== "object") {
    return 0;
  }
  const record = raw as Record<string, unknown>;

  const direct = readNumber(record.reasoningTokens);
  if (direct > 0) {
    return direct;
  }

  // Forme de l'AI SDK v7 telle que reçue par onFinish({ usage }).
  const v7 = record.outputTokenDetails;
  if (v7 && typeof v7 === "object") {
    const nested = readNumber((v7 as Record<string, unknown>).reasoningTokens);
    if (nested > 0) {
      return nested;
    }
  }

  // Forme brute du fournisseur, en snake_case.
  const details = record.completion_tokens_details;
  if (details && typeof details === "object") {
    const snake = readNumber(
      (details as Record<string, unknown>).reasoning_tokens
    );
    if (snake > 0) {
      return snake;
    }
  }

  // Ancienne forme camelCase du SDK.
  const camel = record.completionTokensDetails;
  if (camel && typeof camel === "object") {
    const legacy = readNumber(
      (camel as Record<string, unknown>).reasoningTokens
    );
    if (legacy > 0) {
      return legacy;
    }
  }

  // Forme imbriquée du mock de tests et des anciens runtimes.
  const output = record.outputTokens;
  if (output && typeof output === "object") {
    return readNumber((output as Record<string, unknown>).reasoning);
  }
  return 0;
}

/**
 * Extrait `reasoning_details` sans jamais faire échouer l'appelant.
 *
 * Ces blocs sont volumineux et facultatifs : on plafonne la collecte pour qu'un
 * modèle bavard ne fasse pas grossir un run sans borne, et on tolère toutes les
 * formes de réponse plutôt que de supposer un tableau.
 */
export function readReasoningDetails(
  raw: unknown,
  limit = 20
): ReasoningDetail[] {
  if (!raw || typeof raw !== "object") {
    return [];
  }
  const record = raw as Record<string, unknown>;
  const rawDetails =
    record.reasoning_details ?? record.reasoningDetails ?? record.raw;
  if (!Array.isArray(rawDetails)) {
    return [];
  }
  const details: ReasoningDetail[] = [];
  for (const item of rawDetails.slice(0, limit)) {
    if (item && typeof item === "object") {
      details.push(item as ReasoningDetail);
    }
  }
  return details;
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
  const reasoningTokens = readReasoningTokens(record);

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
