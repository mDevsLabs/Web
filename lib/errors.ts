import { type ApiErrorCode, legacyCodeToApi } from "@/lib/api/error-codes";
import { isDevelopmentEnvironment } from "@/lib/constants";

export type ErrorType =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "rate_limit"
  | "offline";

export type Surface =
  | "chat"
  | "auth"
  | "api"
  | "stream"
  | "database"
  | "history"
  | "vote"
  | "document"
  | "suggestions"
  | "activate_gateway";

export type ErrorCode = `${ErrorType}:${Surface}`;

export type ErrorVisibility = "response" | "log" | "none";

export const visibilityBySurface: Record<Surface, ErrorVisibility> = {
  activate_gateway: "response",
  api: "response",
  auth: "response",
  chat: "response",
  database: "response",
  document: "response",
  history: "response",
  stream: "response",
  suggestions: "response",
  vote: "response",
};

export type ChatbotErrorMeta = {
  apiCode?: ApiErrorCode;
  messageOverride?: string;
  statusCode?: number;
};

// SQLSTATE « relation/colonne absente » : la base ne correspond pas au code
// déployé (migrations non appliquées). Symptôme exact du bug « l'IA ne répond
// pas, aucun appel API » : chaque route base répond 500 sans que le modèle
// soit jamais appelé, et le message générique masque la cause réelle.
const SCHEMA_DRIFT_SQLSTATES = new Set(["42P01", "42703"]);

// Remonte la chaîne des causes (postgres.js encapsule l'erreur SQL dans la
// propriété `cause` de l'Error « Failed query ») pour trouver un SQLSTATE.
function findSqlState(error: unknown): string | null {
  let current: unknown = error;
  for (let depth = 0; current && depth < 8; depth += 1) {
    const code = (current as { code?: unknown }).code;
    if (typeof code === "string") {
      return code;
    }
    current = (current as { cause?: unknown }).cause;
  }
  return null;
}

export function isSchemaDriftError(error: unknown): boolean {
  const state = findSqlState(error);
  return state !== null && SCHEMA_DRIFT_SQLSTATES.has(state);
}

export const SCHEMA_DRIFT_MESSAGE =
  "Le service est momentanément indisponible : le schéma de la base de données n'est pas à jour. L'équipe a été notifiée.";

export const SCHEMA_DRIFT_OPERATOR_LOG =
  "Schéma de base obsolète : migrations non appliquées sur cet environnement. Exécutez `pnpm exec tsx lib/db/migrate.ts` avec le DATABASE_URL de CET environnement (voir scripts/check-db-schema.mjs pour un diagnostic).";

export class ChatbotError extends Error {
  type: ErrorType;
  surface: Surface;
  statusCode: number;
  apiCode?: ApiErrorCode;

  constructor(
    errorCode: ErrorCode,
    cause?: string | ErrorOptions,
    meta?: ChatbotErrorMeta
  ) {
    const message =
      meta?.messageOverride ?? getMessageByErrorCode(errorCode, cause);
    const options = typeof cause === "string" ? undefined : cause;

    super(message, options);

    const [type, surface] = errorCode.split(":");

    this.type = type as ErrorType;
    if (typeof cause === "string") {
      this.cause = cause;
    }
    this.surface = surface as Surface;
    this.statusCode = meta?.statusCode ?? getStatusCodeByType(this.type);
    this.apiCode = meta?.apiCode;

    // Dérive de schéma détectée dans la cause : message utilisateur explicite
    // au lieu d'un « erreur de base de données » générique, et signal fort
    // dans les logs serveur (c'est une erreur d'OPÉRATION, pas de code).
    if (
      typeof cause === "object" &&
      cause !== null &&
      isSchemaDriftError(cause)
    ) {
      this.message = SCHEMA_DRIFT_MESSAGE;
      console.error(`[mAI] ${SCHEMA_DRIFT_OPERATOR_LOG}`, {
        errorCode,
        sqlState: findSqlState(cause),
      });
    }
  }

  toResponse() {
    const legacyCode: ErrorCode = `${this.type}:${this.surface}`;
    const code = this.apiCode ?? legacyCodeToApi(legacyCode);

    // Les échecs d'infrastructure ne sont pas des « requêtes invalides » :
    // bad_request:database est mappé sur database_error (500) côté taxonomie
    // API — on aligne le statut HTTP pour ne pas faire porter à l'utilisateur
    // un 400 trompeur (le bug « 400 sans raison » vient de là).
    const statusCode =
      legacyCode === "bad_request:database" ? 500 : this.statusCode;

    const causeMsg =
      typeof this.cause === "string"
        ? this.cause
        : (this.cause as any)?.message ||
          (this.cause as any)?.error ||
          undefined;

    // La cause technique n'est exposée qu'en développement.
    const details =
      isDevelopmentEnvironment && causeMsg ? { cause: causeMsg } : undefined;

    return Response.json(
      {
        code,
        message: this.message,
        status: statusCode,
        ...(details === undefined ? {} : { details }),
      },
      { status: statusCode }
    );
  }
}

export function getMessageByErrorCode(
  errorCode: ErrorCode,
  _cause?: string | ErrorOptions
): string {
  if (errorCode.includes("database")) {
    return "Une erreur est survenue lors de l'accès à la base de données.";
  }

  switch (errorCode) {
    case "bad_request:api":
      return "La requête n'a pas pu être traitée. Veuillez vérifier vos données.";

    case "unauthorized:auth":
    case "unauthorized:chat":
    case "unauthorized:document":
      return "Votre session a expiré. Veuillez vous reconnecter à mAI Web.";

    case "forbidden:auth":
    case "forbidden:chat":
    case "forbidden:document":
    case "forbidden:api":
      return "Vous n'avez pas l'autorisation d'accéder à cette ressource.";

    case "rate_limit:chat":
      return "Votre limite de messages hebdomadaire ou horaire a été atteinte.";

    case "not_found:chat":
      return "La discussion demandée est introuvable.";

    case "not_found:document":
      return "Le document demandé est introuvable.";

    case "offline:chat":
      return "Impossible de joindre le serveur mAI. Veuillez vérifier votre connexion.";

    case "bad_request:document":
      return "Impossible de créer ou mettre à jour le document.";

    default:
      return "Une erreur inattendue est survenue. Veuillez réessayer.";
  }
}

function getStatusCodeByType(type: ErrorType) {
  switch (type) {
    case "bad_request":
      return 400;
    case "unauthorized":
      return 401;
    case "forbidden":
      return 403;
    case "not_found":
      return 404;
    case "rate_limit":
      return 429;
    case "offline":
      return 503;
    default:
      return 500;
  }
}
