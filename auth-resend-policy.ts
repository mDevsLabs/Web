/**
 * Politique de renvoi des codes de vérification.
 *
 * Un renvoi ne crée jamais un code : il ne peut que régénérer un code dont la
 * demande initiale existe déjà (connexion après mot de passe correct, ou
 * inscription explicitement commencée). Le module est pur afin d'être testé
 * sans SQLite ni réseau.
 */

export const RESEND_ALLOWED_ACTIONS = ["login", "register"] as const;

export type ResendAction = (typeof RESEND_ALLOWED_ACTIONS)[number];

export type PendingVerification = {
  attempts: number;
  expiresAt: number;
};

export type ResendDecision =
  | { allowed: true; nextAttempts: number }
  | {
      allowed: false;
      reason: "invalid_action" | "no_pending_request" | "too_many_attempts";
    };

export function normalizeResendAction(action: unknown): ResendAction | null {
  const value = String(action ?? "")
    .trim()
    .toLowerCase();
  return (RESEND_ALLOWED_ACTIONS as readonly string[]).includes(value)
    ? (value as ResendAction)
    : null;
}

export function decideResend(
  pending: PendingVerification | null,
  maxAttempts: number,
  now = Date.now()
): ResendDecision {
  if (!pending) {
    return { allowed: false, reason: "no_pending_request" };
  }
  // Un code expiré n'est pas une demande encore vivante : l'utilisateur doit
  // recommencer le parcours initial, qui seul prouve son identité.
  if (!Number.isFinite(pending.expiresAt) || pending.expiresAt <= now) {
    return { allowed: false, reason: "no_pending_request" };
  }
  if (!Number.isFinite(pending.attempts) || pending.attempts >= maxAttempts) {
    return { allowed: false, reason: "too_many_attempts" };
  }
  // Le compteur d'essais n'est jamais remis à zéro par un renvoi : sinon un
  // renvoi répété annulerait le verrouillage anti-brute-force.
  return { allowed: true, nextAttempts: pending.attempts };
}
