import { timingSafeEqual } from "node:crypto";

/**
 * Compare deux chaînes de caractères en temps constant.
 * Évite les fuites d'informations par canal auxiliaire temporel (timing attacks).
 *
 * @param a Première chaîne (ex: valeur reçue)
 * @param b Seconde chaîne (ex: secret de référence)
 * @returns true si les deux chaînes sont strictement identiques, false sinon.
 */
export function timingSafeCompare(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}
