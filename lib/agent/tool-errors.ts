import { z } from "zod";
import { AGENT_ERROR_CODES } from "@/lib/agent/errors";

// Contrat d'erreur commun aux outils Agent : code, catégorie, message sûr,
// caractère retryable, délai éventuel. Les détails internes (cause technique,
// payload amont) ne sont JAMAIS exposés au modèle ni à l'utilisateur : seuls
// `code`, `category`, `message`, `retryable` et `retryAfterMs` franchissent la
// frontière. Une stack trace n'est jamais sérialisée.

export const TOOL_ERROR_CATEGORIES = [
  "transient",
  "invalid_arguments",
  "permanent",
  "permission",
  "auth",
  "user_intervention",
] as const;

export type ToolErrorCategory = (typeof TOOL_ERROR_CATEGORIES)[number];

export type ToolErrorShape = {
  category: ToolErrorCategory;
  code: string;
  message: string;
  retryable: boolean;
  retryAfterMs?: number;
};

// Catégories retentables par défaut : transient uniquement. Les arguments
// invalides sont « retentables » d'un point de vue métier (le modèle peut les
// corriger), mais sans délai — ils repartent immédiatement au modèle.
export const RETRYABLE_CATEGORIES: readonly ToolErrorCategory[] = ["transient"];

export function isRetryableCategory(category: ToolErrorCategory): boolean {
  return RETRYABLE_CATEGORIES.includes(category);
}

export class AgentToolError extends Error {
  readonly category: ToolErrorCategory;
  readonly code: string;
  readonly retryable: boolean;
  readonly retryAfterMs?: number;
  // Détails internes : consignés côté serveur, jamais inclus dans la forme
  // structurée transmise au modèle ni affichée à l'utilisateur.
  readonly internalDetails?: Record<string, unknown>;

  constructor(params: {
    category: ToolErrorCategory;
    code: string;
    message: string;
    retryAfterMs?: number;
    internalDetails?: Record<string, unknown>;
    cause?: unknown;
  }) {
    super(params.message, { cause: params.cause });
    this.name = "AgentToolError";
    this.category = params.category;
    this.code = params.code;
    this.retryable = isRetryableCategory(params.category);
    this.retryAfterMs = params.retryAfterMs;
    this.internalDetails = params.internalDetails;
  }

  // Forme sure exposée au modèle / à la timeline : sans détails internes.
  toSafeShape(): ToolErrorShape {
    return {
      category: this.category,
      code: this.code,
      message: this.message,
      retryable: this.retryable,
      ...(this.retryAfterMs === undefined
        ? {}
        : { retryAfterMs: this.retryAfterMs }),
    };
  }
}

// Plafond du délai annoncé par Retry-After : au-delà, on attendrait plus
// longtemps que le budget d'une invocation. Aligné sur bounded-fetch.
const RETRY_AFTER_CAP_MS = 60_000;
const SAFE_MESSAGE_MAX = 400;

const NETWORK_CODES = new Set([
  "EAI_AGAIN",
  "ECONNREFUSED",
  "ECONNRESET",
  "ENOTFOUND",
  "ETIMEDOUT",
]);

const QUOTA_MESSAGE = "Le quota de cette action est atteint.";
const PERMISSION_MESSAGE = "Cette action n'est pas autorisée.";
const NETWORK_MESSAGE = "Le service est momentanément injoignable.";
const RATE_LIMIT_MESSAGE = "Le service limite temporairement les appels.";
const UNAVAILABLE_MESSAGE = "Le service est momentanément indisponible.";

// Conversion d'une erreur inconnue en AgentToolError.
//
// Ordre voulu : un quota ou une permission n'est jamais retenté, même si le
// statut HTTP est 429. Un ZodError repart au modèle (arguments à corriger),
// sans retry automatique. Réseau, 429 et 5xx sont transitoires. Tout le reste
// est permanent : pas de retry aveugle, et aucun détail interne dans le
// message public.
export function toAgentToolError(error: unknown): AgentToolError {
  if (error instanceof AgentToolError) {
    return error;
  }

  if (error instanceof z.ZodError) {
    return new AgentToolError({
      category: "invalid_arguments",
      cause: error,
      code: AGENT_ERROR_CODES.invalidInput,
      internalDetails: { issues: error.issues.length },
      message: zodArgumentMessage(error),
    });
  }

  const nodes = errorChain(error);
  const haystack = nodes
    .map((node) => textOf(node))
    .join(" ")
    .toLowerCase();
  const status = firstStatus(nodes);
  const raw = rawMessage(error);

  if (isQuotaSignal(haystack)) {
    return closedError({
      category: "permanent",
      code: AGENT_ERROR_CODES.budgetExceeded,
      error,
      message: QUOTA_MESSAGE,
      raw,
    });
  }

  if (isPermissionSignal(haystack, status)) {
    return closedError({
      category: "permission",
      code: AGENT_ERROR_CODES.permissionDenied,
      error,
      message: PERMISSION_MESSAGE,
      raw,
    });
  }

  if (nodes.some((node) => isTimeoutNode(node))) {
    return new AgentToolError({
      category: "transient",
      ...(error instanceof Error ? { cause: error } : {}),
      code: AGENT_ERROR_CODES.toolTimeout,
      message: "L'outil a dépassé son délai d'exécution.",
    });
  }

  const retryAfterMs = readRetryAfterMs(nodes);
  if (isFetchFailed(haystack) || hasNetworkCode(nodes)) {
    return transientError({
      error,
      message: NETWORK_MESSAGE,
      raw,
      retryAfterMs,
    });
  }

  if (isTransientHttpStatus(status)) {
    return transientError({
      error,
      message: status === 429 ? RATE_LIMIT_MESSAGE : UNAVAILABLE_MESSAGE,
      raw,
      retryAfterMs,
    });
  }

  if (error instanceof Error) {
    return new AgentToolError({
      category: "permanent",
      cause: error,
      code: AGENT_ERROR_CODES.toolFailed,
      internalDetails: { raw: error.message.slice(0, SAFE_MESSAGE_MAX) },
      message: "L'outil a échoué de manière irrécupérable.",
    });
  }

  return new AgentToolError({
    category: "permanent",
    code: AGENT_ERROR_CODES.toolFailed,
    message: "Erreur inattendue lors de l'exécution de l'outil.",
  });
}

function closedError(params: {
  category: ToolErrorCategory;
  code: string;
  error: unknown;
  message: string;
  raw?: string;
}): AgentToolError {
  return new AgentToolError({
    category: params.category,
    ...(params.error instanceof Error ? { cause: params.error } : {}),
    code: params.code,
    ...(params.raw === undefined
      ? {}
      : { internalDetails: { raw: params.raw } }),
    message: params.message,
  });
}

function transientError(params: {
  error: unknown;
  message: string;
  raw?: string;
  retryAfterMs?: number;
}): AgentToolError {
  return new AgentToolError({
    category: "transient",
    ...(params.error instanceof Error ? { cause: params.error } : {}),
    code: AGENT_ERROR_CODES.toolFailed,
    ...(params.raw === undefined
      ? {}
      : { internalDetails: { raw: params.raw } }),
    message: params.message,
    ...(params.retryAfterMs === undefined
      ? {}
      : { retryAfterMs: params.retryAfterMs }),
  });
}

function zodArgumentMessage(error: z.ZodError): string {
  const issues = error.issues
    .slice(0, 5)
    .map((issue) => `${issuePath(issue.path)}: ${issue.message}`)
    .join(" • ");
  const text = issues
    ? `Arguments invalides : ${issues}`
    : "Les arguments de l'outil sont invalides.";
  return text.slice(0, SAFE_MESSAGE_MAX);
}

function issuePath(path: readonly PropertyKey[]): string {
  const parts = path.filter(
    (part): part is number | string =>
      typeof part === "string" || typeof part === "number"
  );
  return parts.length > 0 ? parts.join(".") : "champ";
}

function errorChain(error: unknown): unknown[] {
  const seen = new Set<unknown>();
  const nodes: unknown[] = [];
  let current: unknown = error;
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    nodes.push(current);
    if (nodes.length >= 4) {
      break;
    }
    current = (current as { cause?: unknown }).cause;
  }
  return nodes;
}

function textOf(value: unknown): string {
  if (!value || typeof value !== "object") {
    return "";
  }
  const record = value as { code?: unknown; message?: unknown; name?: unknown };
  return [record.message, record.code, record.name]
    .filter((part): part is string => typeof part === "string")
    .join(" ");
}

function rawMessage(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.message.slice(0, SAFE_MESSAGE_MAX);
  }
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") {
      return message.slice(0, SAFE_MESSAGE_MAX);
    }
  }
}

function isQuotaSignal(text: string): boolean {
  return text.includes("quota") || text.includes("limite hebdomadaire");
}

function isPermissionSignal(text: string, status: number | undefined): boolean {
  if (status === 403) {
    return true;
  }
  return (
    text.includes("permission_denied") ||
    text.includes("forbidden") ||
    text.includes("non autorisé") ||
    text.includes("non autorise") ||
    /\b403\b/.test(text) ||
    /\bpermission\b/.test(text)
  );
}

function isTimeoutNode(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const name = (value as { name?: unknown }).name;
  return name === "AbortError" || name === "TimeoutError";
}

function isFetchFailed(text: string): boolean {
  return text.includes("fetch failed") || text.includes("failed to fetch");
}

function hasNetworkCode(nodes: readonly unknown[]): boolean {
  return nodes.some((node) => {
    if (!node || typeof node !== "object") {
      return false;
    }
    const code = (node as { code?: unknown }).code;
    return typeof code === "string" && isNetworkCode(code);
  });
}

function isNetworkCode(code: string): boolean {
  return NETWORK_CODES.has(code) || code.startsWith("UND_ERR_");
}

function isTransientHttpStatus(status: number | undefined): boolean {
  return (
    status === 429 || (status !== undefined && status >= 500 && status <= 599)
  );
}

function firstStatus(nodes: readonly unknown[]): number | undefined {
  for (const node of nodes) {
    const status = readStatus(node);
    if (status !== undefined) {
      return status;
    }
  }
}

function readStatus(value: unknown): number | undefined {
  if (!value || typeof value !== "object") {
    return;
  }
  const record = value as {
    message?: unknown;
    status?: unknown;
    statusCode?: unknown;
  };
  const numeric =
    numericStatus(record.statusCode) ?? numericStatus(record.status);
  if (numeric !== undefined) {
    return numeric;
  }
  if (typeof record.message !== "string") {
    return;
  }
  const match = record.message.match(/\b(429|5\d{2})\b/);
  return match ? Number(match[1]) : undefined;
}

function numericStatus(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return;
  }
  if (value < 100 || value > 599) {
    return;
  }
  return value;
}

function readRetryAfterMs(nodes: readonly unknown[]): number | undefined {
  for (const node of nodes) {
    if (!node || typeof node !== "object") {
      continue;
    }
    const record = node as {
      headers?: unknown;
      responseHeaders?: unknown;
    };
    const raw =
      readHeader(record.headers, "retry-after") ??
      readHeader(record.responseHeaders, "retry-after");
    const parsed = parseRetryAfter(raw);
    if (parsed !== undefined) {
      return parsed;
    }
  }
}

function readHeader(headers: unknown, name: string): string | undefined {
  if (!headers) {
    return;
  }
  if (typeof Headers !== "undefined" && headers instanceof Headers) {
    const value = headers.get(name);
    return value?.trim() ? value : undefined;
  }
  if (Array.isArray(headers)) {
    for (const entry of headers) {
      if (!Array.isArray(entry) || entry.length < 2) {
        continue;
      }
      if (String(entry[0]).toLowerCase() === name) {
        return headerString(entry[1]);
      }
    }
    return;
  }
  if (typeof headers === "object") {
    for (const [key, value] of Object.entries(headers)) {
      if (key.toLowerCase() === name) {
        return headerString(value);
      }
    }
  }
}

function headerString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const text = headerString(item);
      if (text) {
        return text;
      }
    }
  }
}

// Retry-After est soit un nombre de secondes, soit une date HTTP.
// Zéro, négatif ou illisible : le champ est omis.
function parseRetryAfter(raw: string | undefined): number | undefined {
  if (!raw) {
    return;
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return;
  }
  const seconds = Number(trimmed);
  if (Number.isFinite(seconds) && seconds > 0) {
    return Math.min(Math.round(seconds * 1000), RETRY_AFTER_CAP_MS);
  }
  const date = Date.parse(trimmed);
  if (Number.isNaN(date)) {
    return;
  }
  const delta = date - Date.now();
  if (delta <= 0) {
    return;
  }
  return Math.min(delta, RETRY_AFTER_CAP_MS);
}
