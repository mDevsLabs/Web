import { type ToolFailure, toolFailure } from "@/lib/agent/types";

// Codes d'erreur du runtime Agent. Les échecs d'outils sont renvoyés au modèle
// sous forme structurée (ToolFailure) pour qu'il puisse réessayer, changer
// d'approche, demander une information ou terminer proprement — jamais sous
// forme d'exception qui interromprait le run.

export const AGENT_ERROR_CODES = {
  agentDisabled: "agent_disabled",
  budgetExceeded: "budget_exceeded",
  filesNotSupported: "files_not_supported",
  invalidInput: "invalid_input",
  maxStepsExceeded: "max_steps_exceeded",
  notFound: "not_found",
  permissionDenied: "permission_denied",
  planRequired: "plan_required",
  runCancelled: "run_cancelled",
  sourceUnavailable: "source_unavailable",
  toolFailed: "tool_failed",
  toolNotFound: "tool_not_found",
  toolsNotSupported: "tools_not_supported",
  toolTimeout: "tool_timeout",
} as const;

export type AgentErrorCode =
  (typeof AGENT_ERROR_CODES)[keyof typeof AGENT_ERROR_CODES];

export class AgentRuntimeError extends Error {
  readonly code: AgentErrorCode;

  constructor(
    code: AgentErrorCode,
    message: string,
    options?: { cause?: unknown }
  ) {
    super(message, options);
    this.code = code;
    this.name = "AgentRuntimeError";
  }
}

export function toToolFailure(
  error: unknown,
  fallbackCode: AgentErrorCode = AGENT_ERROR_CODES.toolFailed
): ToolFailure {
  if (error instanceof AgentRuntimeError) {
    return toolFailure(error.code, error.message);
  }
  if (error instanceof Error) {
    const isTimeout =
      error.name === "AbortError" || error.name === "TimeoutError";
    return toolFailure(
      isTimeout ? AGENT_ERROR_CODES.toolTimeout : fallbackCode,
      error.message
    );
  }
  return toolFailure(fallbackCode, "Erreur inattendue lors de l'exécution.");
}

export function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "AbortError" ||
      error.message.toLowerCase().includes("aborted"))
  );
}
