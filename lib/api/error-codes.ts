import type { ErrorCode } from "@/lib/errors";

// Taxonomie des codes d'erreur API (snake_case anglais, stable pour les
// intégrations clients). Les messages associés sont toujours en français.
export type ApiErrorCode =
  | "invalid_request"
  | "invalid_credentials"
  | "auth_required"
  | "access_denied"
  | "plan_required"
  | "model_access_denied"
  | "mcp_required"
  | "bot_detected"
  | "not_found"
  | "conflict"
  | "payload_too_large"
  | "unsupported_media_type"
  | "quota_exceeded"
  | "rate_limited"
  | "upstream_error"
  | "service_unavailable"
  | "database_error"
  | "internal_error";

export const API_ERROR_CODES = [
  "invalid_request",
  "invalid_credentials",
  "auth_required",
  "access_denied",
  "plan_required",
  "model_access_denied",
  "mcp_required",
  "bot_detected",
  "not_found",
  "conflict",
  "payload_too_large",
  "unsupported_media_type",
  "quota_exceeded",
  "rate_limited",
  "upstream_error",
  "service_unavailable",
  "database_error",
  "internal_error",
] as const satisfies readonly ApiErrorCode[];

export const API_ERROR_STATUS: Record<ApiErrorCode, number> = {
  access_denied: 403,
  auth_required: 401,
  bot_detected: 403,
  conflict: 409,
  database_error: 500,
  internal_error: 500,
  invalid_credentials: 401,
  invalid_request: 400,
  mcp_required: 428,
  model_access_denied: 403,
  not_found: 404,
  payload_too_large: 413,
  plan_required: 403,
  quota_exceeded: 429,
  rate_limited: 429,
  service_unavailable: 503,
  unsupported_media_type: 415,
  upstream_error: 502,
};

export function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return (
    typeof value === "string" &&
    (API_ERROR_CODES as readonly string[]).includes(value)
  );
}

// Anciens codes `type:surface` de lib/errors.ts -> codes de la taxonomie API.
export function legacyCodeToApi(code: string): ApiErrorCode {
  const [type] = code.split(":");
  switch (type) {
    case "bad_request":
      return code === "bad_request:database"
        ? "database_error"
        : "invalid_request";
    case "unauthorized":
      return "auth_required";
    case "forbidden":
      return "access_denied";
    case "not_found":
      return "not_found";
    case "rate_limit":
      return "rate_limited";
    case "offline":
      return "service_unavailable";
    default:
      return "internal_error";
  }
}

// Mapping inverse utilisé côté client (lib/utils.ts) pour reconstruire un
// ChatbotError typé à partir d'un code API.
export const API_TO_LEGACY: Record<ApiErrorCode, ErrorCode> = {
  access_denied: "forbidden:api",
  auth_required: "unauthorized:auth",
  bot_detected: "forbidden:api",
  conflict: "bad_request:api",
  database_error: "bad_request:database",
  internal_error: "bad_request:api",
  invalid_credentials: "unauthorized:auth",
  invalid_request: "bad_request:api",
  mcp_required: "bad_request:api",
  model_access_denied: "forbidden:api",
  not_found: "not_found:chat",
  payload_too_large: "bad_request:api",
  plan_required: "forbidden:api",
  quota_exceeded: "rate_limit:chat",
  rate_limited: "rate_limit:chat",
  service_unavailable: "offline:chat",
  unsupported_media_type: "bad_request:api",
  upstream_error: "offline:chat",
};

// Statut HTTP -> code par défaut lors de la normalisation d'une erreur amont.
export function statusToApiCode(status: number): ApiErrorCode {
  if (status === 401) {
    return "auth_required";
  }
  if (status === 403) {
    return "access_denied";
  }
  if (status === 404) {
    return "not_found";
  }
  if (status === 409) {
    return "conflict";
  }
  if (status === 413) {
    return "payload_too_large";
  }
  if (status === 415) {
    return "unsupported_media_type";
  }
  if (status === 428) {
    return "mcp_required";
  }
  if (status === 429) {
    return "quota_exceeded";
  }
  if (status === 502 || status === 503 || status === 504) {
    return status === 502 ? "upstream_error" : "service_unavailable";
  }
  if (status >= 500) {
    return "upstream_error";
  }
  if (status >= 400) {
    return "invalid_request";
  }
  return "internal_error";
}
