import "server-only";

import { z } from "zod";

import {
  API_ERROR_STATUS,
  type ApiErrorCode,
  isApiErrorCode,
  statusToApiCode,
} from "@/lib/api/error-codes";
import { DEFAULT_MESSAGES_FR } from "@/lib/api/error-messages";
import {
  type ApiErrorPayload,
  isApiErrorPayload,
} from "@/lib/api/error-schema";
import { ChatbotError } from "@/lib/errors";

// Messages de validation Zod en français, hérités par toute route/action qui
// utilise ce module (l'app est monolingue français).
z.config(z.locales.fr());

export function zodIssuesMessage(error: z.ZodError): string {
  const issues = error.issues
    .map((e) => `${e.path.join(".") || "champ"}: ${e.message}`)
    .join(" • ");
  return `Données invalides : ${issues}`;
}

type ErrorResponseOptions = {
  message?: string;
  status?: number;
  details?: unknown;
  headers?: HeadersInit;
};

// Construit une réponse d'erreur unifiée { code, message, status, details? }.
export function errorResponse(
  code: ApiErrorCode,
  options: ErrorResponseOptions = {}
): Response {
  const status = options.status ?? API_ERROR_STATUS[code];
  const body: ApiErrorPayload = {
    code,
    message: options.message ?? DEFAULT_MESSAGES_FR[code],
    status,
    ...(options.details === undefined ? {} : { details: options.details }),
  };
  return Response.json(body, { headers: options.headers, status });
}

export function extractUpstreamMessage(body: unknown): string | undefined {
  if (!body || typeof body !== "object") {
    return;
  }
  const b = body as Record<string, any>;
  if (typeof b.message === "string" && b.message.trim()) {
    return b.message;
  }
  if (typeof b.error === "string" && b.error.trim()) {
    return b.error;
  }
  if (b.error && typeof b.error === "object") {
    if (typeof b.error.message === "string" && b.error.message.trim()) {
      return b.error.message;
    }
  }
}

function extractUpstreamCode(body: unknown): ApiErrorCode | undefined {
  if (!body || typeof body !== "object") {
    return;
  }
  const b = body as Record<string, any>;
  const candidates = [
    b.code,
    b.error && typeof b.error === "object" ? b.error.code : undefined,
  ];
  for (const candidate of candidates) {
    if (isApiErrorCode(candidate)) {
      return candidate;
    }
  }
}

// Détails non sensibles relayés depuis un amont (jamais de stack/message brut).
function extractUpstreamDetails(body: unknown): unknown {
  if (!body || typeof body !== "object") {
    return;
  }
  const b = body as Record<string, any>;
  const errorObj = b.error && typeof b.error === "object" ? b.error : undefined;
  const details: Record<string, unknown> = {};
  const param = errorObj?.param ?? b.param;
  const type = errorObj?.type ?? b.type;
  if (typeof param === "string") {
    details.param = param;
  }
  if (typeof type === "string") {
    details.type = type;
  }
  if (b.limit !== undefined) {
    details.limit = b.limit;
  }
  if (b.used !== undefined) {
    details.used = b.used;
  }
  if (b.resetAt !== undefined) {
    details.resetAt = b.resetAt;
  }
  return Object.keys(details).length > 0 ? details : undefined;
}

// Normalise une erreur renvoyée par le backend Val Town (enveloppe OpenAI,
// { error: string }, { message }) dans le schéma unifié du BFF.
export function normalizeUpstreamError(
  body: unknown,
  status: number,
  context: { code?: ApiErrorCode; message?: string; details?: unknown } = {}
): ApiErrorPayload {
  const upstreamCode = extractUpstreamCode(body);
  const code = context.code ?? upstreamCode ?? statusToApiCode(status);
  const upstreamMessage = extractUpstreamMessage(body);
  const message =
    context.message ??
    (upstreamCode && upstreamMessage
      ? upstreamMessage
      : DEFAULT_MESSAGES_FR[code]);
  const details = context.details ?? extractUpstreamDetails(body);
  return {
    code,
    message,
    status,
    ...(details === undefined ? {} : { details }),
  };
}

export function logError(context: string, error: unknown): void {
  console.error(`[mAI] ${context}:`, error);
}

// Convertit n'importe quelle erreur en réponse unifiée, sans jamais exposer
// de détail interne au client (log serveur uniquement).
export function toErrorResponse(
  error: unknown,
  fallbackCode: ApiErrorCode = "internal_error"
): Response {
  if (error instanceof ChatbotError) {
    return error.toResponse();
  }
  if (isApiErrorPayload(error)) {
    return Response.json(error, { status: error.status });
  }
  logError("Erreur non gérée", error);
  return errorResponse(fallbackCode);
}
