/**
 * Accent couleur d'un Wakie (lot messagerie).
 *
 * ISOMORPHE (client + serveur) : le fil l'applique en variable CSS locale
 * (`--wakie-accent`) sur la bulle, pour identifier QUEL Wakie parle. Le chrome
 * de l'application reste achromatique : la couleur porte une information,
 * elle ne décore pas.
 *
 * Deux sources, un ordre : l'accent EXPLICITE (`WakiesWakie.accent`, validé
 * contre la palette) gagne ; sinon DÉRIVATION déterministe depuis la mascotte
 * ou l'identifiant — aucun Wakie existant ne change d'apparence sans geste,
 * et deux affichages du même Wakie donnent toujours la même couleur.
 */

export const ACCENTS_WAKIE = [
  { hex: "#2563eb", nom: "bleu" },
  { hex: "#e5484d", nom: "corail" },
  { hex: "#e8862e", nom: "abricot" },
  { hex: "#b7791f", nom: "soleil" },
  { hex: "#0e9f8a", nom: "menthe" },
  { hex: "#0e7490", nom: "lagune" },
  { hex: "#8e4ec6", nom: "lilas" },
  { hex: "#d6409f", nom: "framboise" },
] as const;

export type NomAccentWakie = (typeof ACCENTS_WAKIE)[number]["nom"];

/** Accent stocké utilisable tel quel, sinon dérivation. */
export function estAccentValide(valeur: unknown): valeur is NomAccentWakie {
  return (
    typeof valeur === "string" &&
    (ACCENTS_WAKIE as readonly { nom: string }[]).some(
      (accent) => accent.nom === valeur
    )
  );
}

/** FNV-1a 32 bits : assez pour répartir, stable entre deux affichages. */
function empreinte(texte: string): number {
  let hash = 0x81_1c_9d_c5;
  for (let index = 0; index < texte.length; index++) {
    hash ^= texte.charCodeAt(index);
    hash = Math.imul(hash, 0x01_00_01_93);
  }
  return hash >>> 0;
}

export function accentPourWakie(params: {
  accent?: string | null;
  avatar?: string | null;
  id: string;
}): { hex: string; nom: NomAccentWakie } {
  if (estAccentValide(params.accent)) {
    const trouve = ACCENTS_WAKIE.find((accent) => accent.nom === params.accent);
    if (trouve) return { hex: trouve.hex, nom: trouve.nom };
  }
  const derive =
    ACCENTS_WAKIE[
      empreinte(`${params.avatar ?? ""}:${params.id}`) % ACCENTS_WAKIE.length
    ];
  return { hex: derive.hex, nom: derive.nom };
}
