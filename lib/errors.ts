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

export class ChatbotError extends Error {
  type: ErrorType;
  surface: Surface;
  statusCode: number;

  constructor(errorCode: ErrorCode, cause?: string | ErrorOptions) {
    const message = getMessageByErrorCode(errorCode, cause);
    const options = typeof cause === "string" ? undefined : cause;

    super(message, options);

    const [type, surface] = errorCode.split(":");

    this.type = type as ErrorType;
    if (typeof cause === "string") {
      this.cause = cause;
    }
    this.surface = surface as Surface;
    this.statusCode = getStatusCodeByType(this.type);
  }

  toResponse() {
    const code: ErrorCode = `${this.type}:${this.surface}`;
    const { message, cause, statusCode } = this;

    const causeMsg =
      typeof cause === "string"
        ? cause
        : (cause as any)?.message || (cause as any)?.error || undefined;

    return Response.json(
      {
        cause: causeMsg,
        code,
        message: causeMsg ? `${message} (${causeMsg})` : message,
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
