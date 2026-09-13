// Statuts partagés entre l'outil serveur updateAccountProfile et la carte
// cliente (components/chat/account-profile-card.tsx) — évite les divergences
// de chaînes entre serveur et client.

export const ACCOUNT_PROFILE_TOOL = "updateAccountProfile";

export const PROFILE_STATUS = {
  AWAITING: "awaiting_user",
  CANCELLED: "cancelled",
  INVALID: "invalid",
  NO_CHANGE: "no_change",
  SUBMITTED: "submitted",
} as const;

// Vrai tant que la carte attend la saisie du mot de passe / confirmation.
export function isProfileAwaiting(output: unknown): boolean {
  return (
    !!output &&
    typeof output === "object" &&
    (output as { status?: unknown }).status === PROFILE_STATUS.AWAITING
  );
}
