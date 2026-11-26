/**
 * Formatage unifié des erreurs techniques et fournisseurs IA côté client et serveur.
 *
 * Ce module est volontairement universel (aucun import `server-only`) afin d'être
 * partagé entre les flux serveur (Chat, Agent, Vibe, Wakies, Coach Quizzly) et
 * les composants clients qui affichent les erreurs à l'utilisateur.
 *
 * Règle produit :
 * - Toute défaillance serveur, réseau, base de données ou fournisseur IA amont
 *   affiche le message unique « Nos serveurs rencontrent des difficultés ».
 * - Les erreurs métier actionnables par l'utilisateur (quota atteint, forfait
 *   requis, pièce jointe non prise en charge, validation de saisie, session
 *   expirée) conservent leur message explicite.
 */

import { ChatbotError } from "@/lib/errors";

export const MAI_SERVER_DIFFICULTIES_MESSAGE =
  "Nos serveurs rencontrent des difficultés";

export const MODEL_SATURATED_MESSAGE =
  "Ce modèle gratuit est saturé, réessayez ou changez de modèle.";
export const MODEL_UNAVAILABLE_MESSAGE = "Ce modèle n'est plus disponible.";

const MODEL_SPECIFIC_MESSAGES = new Set([
  MODEL_SATURATED_MESSAGE,
  MODEL_UNAVAILABLE_MESSAGE,
]);

/**
 * Statut HTTP amont d'une erreur du SDK IA. `RetryError` enveloppe la dernière
 * erreur (`lastError`) après les nouvelles tentatives : on descend jusqu'à elle.
 */
function readUpstreamStatus(error: unknown, depth = 0): number | null {
  if (!error || typeof error !== "object" || depth > 3) {
    return null;
  }
  const candidate = error as {
    errors?: unknown[];
    lastError?: unknown;
    statusCode?: unknown;
  };
  if (typeof candidate.statusCode === "number") {
    return candidate.statusCode;
  }
  return (
    readUpstreamStatus(candidate.lastError, depth + 1) ??
    readUpstreamStatus(candidate.errors?.at(-1), depth + 1)
  );
}

/**
 * Cas du modèle lui-même : 429 (saturé) et 404 (retiré). Ce sont les seuls
 * échecs amont dont l'utilisateur peut agir (changer de modèle) ; tout le reste
 * garde le message unifié.
 */
export function classifyModelProviderError(error: unknown): string | null {
  const status = readUpstreamStatus(error);
  if (status === 429) {
    return MODEL_SATURATED_MESSAGE;
  }
  if (status === 404) {
    return MODEL_UNAVAILABLE_MESSAGE;
  }
  return null;
}

const SERVER_DIFFICULTY_CODES = new Set([
  "database_error",
  "internal_error",
  "service_unavailable",
  "upstream_error",
]);

const PRESERVED_BUSINESS_CODES = new Set([
  "COACH_IMAGES_NON_SUPPORTEES",
  "access_denied",
  "auth_required",
  "bot_detected",
  "conflict",
  "conversation_busy",
  "existing_run",
  "invalid_credentials",
  "mai_quota_exceeded",
  "mcp_required",
  "model_access_denied",
  "payload_too_large",
  "plan_required",
  "quota_exceeded",
  "rate_limited",
  "turn_already_saved",
  "unsupported_media_type",
]);

const TECHNICAL_OR_GENERIC_PATTERNS: readonly RegExp[] = [
  /nos serveurs rencontrent des difficult/i,
  /failed to fetch|networkerror|load failed|fetch failed|econnrefused|etimedout|socket hang up/i,
  /\babort(?:ed|error)?\b|terminated/i,
  /openrouter|cometapi|ai_apicallerror|ai_typevalidationerror|type validation failed|jsonparseerror/i,
  /provider returned error|no endpoints found|invalid json|unexpected token/i,
  /cl[ée] api|api key|service unavailable|bad gateway|gateway timeout|internal server error/i,
  /base de donn[ée]es|sch[ée]ma de la base|failed query|sqlstate|postgres/i,
  /une erreur (?:inattendue |interne |technique )?est survenue/i,
  /impossible de (?:contacter|joindre|g[ée]n[ée]rer|communiquer|traiter)/i,
  /impossible d['’]obtenir une r[ée]ponse/i,
  /erreur (?:r[ée]seau|serveur|interne|technique|de communication|lors de la g[ée]n[ée]ration)/i,
  /aucune r[ée]ponse re[çc]ue|r[ée]ponse vide|d[ée]lai d[ée]pass[ée]/i,
  /fournisseur ia|service ia indisponible|mod[èe]le .*indisponible/i,
];

const ACTIONABLE_FRENCH_BUSINESS_PATTERNS: readonly RegExp[] = [
  /\bquota\b|\bforfait\b|\babonnement\b|\blimite\b/i,
  /\bpi[èe]ce jointe\b|\bfichier\b|\bimage(?:s)?\b|\baudio\b|\bvid[ée]o\b|\bformat\b|\btaille\b|\bmo\b/i,
  /\bsession\b|\breconnecter\b|\bconnexion requise\b|\bauthentification\b/i,
  /\bautorisation\b|\bacc[èe]s refus[ée]\b|\br[ée]serv[ée] aux\b/i,
  /\bveuillez saisir\b|\bchamp\b|\btrop long\b|\bcaract[èe]res\b|\bquestion vide\b|\bmessage vide\b/i,
  /\bconversation occup[ée]e\b|\bd[ée]j[àa] en cours\b|\bprise(?:s)? en charge\b/i,
];

function extractCode(error: unknown): string | null {
  if (!error || typeof error !== "object") {
    return null;
  }
  const candidate = error as {
    apiCode?: unknown;
    code?: unknown;
  };
  if (typeof candidate.apiCode === "string" && candidate.apiCode.trim()) {
    return candidate.apiCode.trim();
  }
  if (typeof candidate.code === "string" && candidate.code.trim()) {
    return candidate.code.trim();
  }
  return null;
}

function extractStatus(error: unknown): number | null {
  if (!error || typeof error !== "object") {
    return null;
  }
  const candidate = error as {
    status?: unknown;
    statusCode?: unknown;
  };
  if (typeof candidate.statusCode === "number") {
    return candidate.statusCode;
  }
  if (typeof candidate.status === "number") {
    return candidate.status;
  }
  return null;
}

function extractRawMessage(error: unknown): string {
  if (typeof error === "string") {
    return error.trim();
  }
  if (error instanceof Error) {
    return error.message.trim();
  }
  if (error && typeof error === "object") {
    const candidate = error as { error?: unknown; message?: unknown };
    if (typeof candidate.message === "string" && candidate.message.trim()) {
      return candidate.message.trim();
    }
    if (typeof candidate.error === "string" && candidate.error.trim()) {
      return candidate.error.trim();
    }
  }
  return "";
}

export function isTechnicalOrServerFailureMessage(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) {
    return true;
  }
  return TECHNICAL_OR_GENERIC_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/**
 * Formate une erreur issue directement d'un flux LLM / OpenRouter côté serveur.
 */
export function formatStreamProviderError(error?: unknown): string {
  return classifyModelProviderError(error) ?? MAI_SERVER_DIFFICULTIES_MESSAGE;
}

/**
 * Formate toute erreur reçue par une route ou une interface IA (Chat, Agent,
 * mAI dans Vibe, Wakies, Coach dans Quizzly) :
 * - préserve les messages métier actionnables ;
 * - unifie toutes les pannes techniques/serveur/fournisseur sur
 *   « Nos serveurs rencontrent des difficultés ».
 */
export function formatUserFacingAiError(error: unknown): string {
  const rawMessage = extractRawMessage(error);
  if (!rawMessage || rawMessage === MAI_SERVER_DIFFICULTIES_MESSAGE) {
    return MAI_SERVER_DIFFICULTIES_MESSAGE;
  }

  if (MODEL_SPECIFIC_MESSAGES.has(rawMessage)) {
    return rawMessage;
  }

  const code = extractCode(error);
  const status = extractStatus(error);

  if (code && SERVER_DIFFICULTY_CODES.has(code)) {
    return MAI_SERVER_DIFFICULTIES_MESSAGE;
  }

  if (status !== null && status >= 500) {
    return MAI_SERVER_DIFFICULTIES_MESSAGE;
  }

  if (error instanceof ChatbotError) {
    if (error.surface === "database" || error.type === "offline") {
      return MAI_SERVER_DIFFICULTIES_MESSAGE;
    }
    if (!isTechnicalOrServerFailureMessage(error.message)) {
      return error.message;
    }
    return MAI_SERVER_DIFFICULTIES_MESSAGE;
  }

  if (isTechnicalOrServerFailureMessage(rawMessage)) {
    return MAI_SERVER_DIFFICULTIES_MESSAGE;
  }

  if (code && PRESERVED_BUSINESS_CODES.has(code)) {
    return rawMessage;
  }

  if (
    ACTIONABLE_FRENCH_BUSINESS_PATTERNS.some((pattern) =>
      pattern.test(rawMessage)
    )
  ) {
    return rawMessage;
  }

  return MAI_SERVER_DIFFICULTIES_MESSAGE;
}
