// Statuts partagés entre les outils serveur (updateAccountProfile,
// updateProfilePicture) et les cartes clientes (components/chat/*.tsx) —
// évite les divergences de chaînes entre serveur et client.

export const ACCOUNT_PROFILE_TOOL = "updateAccountProfile";
export const PROFILE_PICTURE_TOOL = "updateProfilePicture";

export const PROFILE_STATUS = {
  AWAITING: "awaiting_user",
  CANCELLED: "cancelled",
  INVALID: "invalid",
  NO_CHANGE: "no_change",
  SUBMITTED: "submitted",
} as const;

export const PHOTO_STATUS = {
  AWAITING: "awaiting_user",
  CANCELLED: "cancelled",
  FAILED: "failed",
  INVALID: "invalid",
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
