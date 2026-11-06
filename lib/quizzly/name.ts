/**
 * Nom affiché partagé.
 *
 * Quizzly, Vibe et l'indicatif Blackline lisent la même chaîne. Le
 * `@username` de connexion n'est pas ce nom : il reste unique et inchangé.
 * Blackline n'affiche que 18 caractères au-dessus du personnage, donc
 * l'indicatif est une coupe du nom, pas un second profil.
 */

export const NOM_AFFICHE_MIN = 2;
export const NOM_AFFICHE_MAX = 40;
export const INDICATIF_MAX = 18;

export function normaliserNomAffiche(brut: string): string | null {
  const nom = brut.trim().replace(/\s+/g, " ");
  if (nom.length < NOM_AFFICHE_MIN || nom.length > NOM_AFFICHE_MAX) {
    return null;
  }
  for (const caractere of nom) {
    const code = caractere.codePointAt(0) ?? 0;
    if (code < 32) {
      return null;
    }
  }
  return nom;
}

export function versIndicatif(nom: string): string {
  return nom.trim().slice(0, INDICATIF_MAX);
}

/** Force l'indicatif du jeu sur le nom partagé, sans toucher aux autres réglages. */
export function superposerIndicatif(
  reglages: Record<string, unknown>,
  nom: string | null
): Record<string, unknown> {
  if (!nom) {
    return reglages;
  }
  const indicatif = versIndicatif(nom);
  if (!indicatif) {
    return reglages;
  }
  return { ...reglages, callsign: indicatif };
}
