// Helpers client pour extraire message/code d'une réponse d'erreur, quel que
// soit le format rencontré (enveloppe unifiée, ancien { error: string },
// enveloppe OpenAI { error: { message } }).

export function extractApiErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    if (typeof payload === "string" && payload.trim()) {
      return payload;
    }
    return null;
  }
  const p = payload as Record<string, any>;
  if (typeof p.message === "string" && p.message.trim()) {
    return p.message;
  }
  if (typeof p.error === "string" && p.error.trim()) {
    return p.error;
  }
  if (p.error && typeof p.error === "object") {
    if (typeof p.error.message === "string" && p.error.message.trim()) {
      return p.error.message;
    }
  }
  return null;
}

export function extractApiErrorCode(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const p = payload as Record<string, any>;
  if (typeof p.code === "string" && p.code) {
    return p.code;
  }
  if (
    p.error &&
    typeof p.error === "object" &&
    typeof p.error.code === "string" &&
    p.error.code
  ) {
    return p.error.code;
  }
  return null;
}
