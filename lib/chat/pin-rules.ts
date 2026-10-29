// Règles partagées entre le serveur et l'interface : ce module ne doit importer
// ni `node:crypto` ni un module `server-only`, sinon le bundle client tirerait
// des primitives serveur pour une simple validation de longueur.
export const CHAT_PIN_MIN_LENGTH = 4;
export const CHAT_PIN_MAX_LENGTH = 6;
export const CHAT_PIN_PATTERN = /^\d{4,6}$/;

export function isValidChatPin(value: unknown): value is string {
  return typeof value === "string" && CHAT_PIN_PATTERN.test(value);
}

/** Ne garde que les chiffres, pour les champs de saisie masqués. */
export function sanitizeChatPinInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, CHAT_PIN_MAX_LENGTH);
}
