/**
 * Mascottes disponibles pour un Wakie.
 *
 * Les 51 personnages de `public/wakies/` (source : archive ZIP du produit,
 * décompressée) — tous en png 512. L'ancien quintet blue/mint/orange/purple/red
 * ne fait plus partie du catalogue : les Wakies existants s'en voient attribuer
 * un nouveau personnage déduit de leur id (voir `Mascot.tsx`), sans écrire en
 * base. La liste est ici — client ET serveur — pour que la validation de l'API
 * et l'affichage de la galerie ne puissent pas diverger : un avatar accepté par
 * le serveur est un avatar qu'on sait rendre.
 */
export const WAKIE_AVATARS = [
  "abricot",
  "amiral",
  "aqualin",
  "azur",
  "baryton",
  "cacao",
  "capucine",
  "citronnelle",
  "cobalt",
  "coeurin",
  "corail",
  "cosmos",
  "diamant",
  "explorix",
  "flammeche",
  "fraisette",
  "fuchsia",
  "glacon",
  "goutte",
  "guimauve",
  "kiwi",
  "lagune",
  "lilas",
  "lunelle",
  "mandarino",
  "marinou",
  "menthe",
  "miel",
  "mimo",
  "myrtille",
  "nuage",
  "octave",
  "onyx",
  "paprika",
  "pechou",
  "petunia",
  "pistache",
  "pomme-d-or",
  "pousse",
  "prune",
  "prunelle",
  "reglisse",
  "reine-mauve",
  "rubis",
  "soleil",
  "sonora",
  "stella",
  "tango",
  "tic-tac",
  "zeste",
] as const;

export type WakieAvatar = (typeof WAKIE_AVATARS)[number];

/** Avatar par défaut quand l'utilisateur n'en choisit aucun. */
export const DEFAULT_WAKIE_AVATAR: WakieAvatar = "aqualin";

export function isWakieAvatar(value: unknown): value is WakieAvatar {
  return (
    typeof value === "string" &&
    (WAKIE_AVATARS as readonly string[]).includes(value)
  );
}

export function normalizeWakieAvatar(value: unknown): WakieAvatar | null {
  return isWakieAvatar(value) ? value : null;
}
