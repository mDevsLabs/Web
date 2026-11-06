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

/**
 * Normalise un secret en retirant les espaces et guillemets superflus
 * qui peuvent être injectés par les variables d'environnement.
 */
export function sanitizeSecret(
  value: string | null | undefined
): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .trim();
  return trimmed || null;
}

/**
 * Valide l'authentification d'une route cron via Authorization: Bearer ou x-cron-secret.
 * Gère de manière sécurisée et robuste les guillemets et espaces éventuels.
 */
export function verifyCronAuth(
  request: Request,
  expectedSecret: string | null | undefined = process.env.CRON_SECRET
): boolean {
  const secret = sanitizeSecret(expectedSecret);
  if (!secret) {
    return false;
  }

  const rawAuth = request.headers.get("authorization");
  if (rawAuth) {
    let token = rawAuth.trim();
    if (token.toLowerCase().startsWith("bearer ")) {
      token = sanitizeSecret(token.slice(7)) ?? "";
    }
    if (timingSafeCompare(token, secret)) {
      return true;
    }
    if (timingSafeCompare(rawAuth, `Bearer ${secret}`)) {
      return true;
    }
  }

  const rawHeader = request.headers.get("x-cron-secret");
  if (rawHeader) {
    const cleanHeader = sanitizeSecret(rawHeader);
    if (timingSafeCompare(cleanHeader, secret)) {
      return true;
    }
  }

  return false;
}
