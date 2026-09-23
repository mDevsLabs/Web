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

// Conversion d'une erreur inconnue en AgentToolError : les TimeoutError et
// AbortError sont transitoires par nature ; toute autre erreur inconnue est
// classée permanente (sûr par défaut, pas de retry aveugle).
export function toAgentToolError(error: unknown): AgentToolError {
  if (error instanceof AgentToolError) {
    return error;
  }
  if (error instanceof Error) {
    const isTimeout =
      error.name === "AbortError" || error.name === "TimeoutError";
    if (isTimeout) {
      return new AgentToolError({
        category: "transient",
        cause: error,
        code: AGENT_ERROR_CODES.toolTimeout,
        message: "L'outil a dépassé son délai d'exécution.",
      });
    }
    return new AgentToolError({
      category: "permanent",
      cause: error,
      code: AGENT_ERROR_CODES.toolFailed,
      internalDetails: { raw: error.message.slice(0, 400) },
      message: "L'outil a échoué de manière irrécupérable.",
    });
  }
  return new AgentToolError({
    category: "permanent",
    code: AGENT_ERROR_CODES.toolFailed,
    message: "Erreur inattendue lors de l'exécution de l'outil.",
  });
}
