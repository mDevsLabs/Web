import "server-only";

import type { NextRequest } from "next/server";

/** `nextUrl` d'une requête Next. `NextURL` n'est pas exporté par `next/server`. */
type RequestUrl = NextRequest["nextUrl"];

/**
 * Construction des URLs de retour du flux OAuth.
 *
 * Le callback est une navigation du navigateur, pas un appel XHR : il ne peut
 * pas rendre du JSON et il ne peut pas ouvrir un pop-up (la page de consentement
 * est une navigation top-level, et les bloqueurs tuent une fenêtre qui ne suit
 * pas un geste direct). Il redirige donc vers une page de l'application, avec
 * l'issue en query. `basePath` est porté ici une seule fois : l'oublier en démo
 * (`/demo`, voir `next.config.ts:4`) enverrait l'utilisateur sur une 404.
 */

export type IntegrationFailureReason =
  | "exchange_failed"
  | "not_configured"
  | "plan_required"
  | "provider_denied"
  | "state_invalid"
  | "tier_unavailable"
  | "vault_unconfigured";

export function internalUrl(
  nextUrl: RequestUrl,
  path: string,
  query: Record<string, string | undefined>
): URL {
  const base = nextUrl.basePath ?? "";
  const pathname =
    base && path.startsWith(`${base}/`) ? path : `${base}${path}`;
  const url = new URL(pathname, nextUrl.origin);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, value);
    }
  }
  return url;
}

/**
 * Étiquette affichable du compte connecté, tronquée : elle revient dans l'URL
 * de retour, et une adresse email de 320 caractères n'a rien à y faire.
 */
export function accountLabelForUrl(label: string | null): string | undefined {
  return label ? label.slice(0, 80) : undefined;
}
