/**
 * Mascottes disponibles pour un Wakie.
 *
 * Les cinq images existent déjà dans `public/wakies/` (elles venaient du
 * gabarit) : elles servent au choix d'identité visuelle à la création, plutôt
 * qu'à une couleur inventée côté client. La liste est ici — client ET serveur —
 * pour que la validation de l'API et l'affichage de la galerie ne puissent pas
 * diverger : un avatar accepté par le serveur est un avatar qu'on sait rendre.
 */
export const WAKIE_AVATARS = [
  "blue",
  "mint",
  "orange",
  "purple",
  "red",
] as const;

export type WakieAvatar = (typeof WAKIE_AVATARS)[number];

/** Avatar par défaut quand l'utilisateur n'en choisit aucun. */
export const DEFAULT_WAKIE_AVATAR: WakieAvatar = "blue";

export function isWakieAvatar(value: unknown): value is WakieAvatar {
  return (
    typeof value === "string" &&
    (WAKIE_AVATARS as readonly string[]).includes(value)
  );
}

export function normalizeWakieAvatar(value: unknown): WakieAvatar | null {
  return isWakieAvatar(value) ? value : null;
}
