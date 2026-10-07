/**
 * URL canonique du site.
 *
 * Les liens de partage doivent être calculés au rendu serveur : lire
 * `window.location.href` pendant le rendu d'un composant client produit un HTML
 * contenant des liens vides (les robots de partage et les prévisualiseurs de
 * réseaux sociaux ne voient que cette sortie) et provoque une erreur d'hydratation,
 * car le premier rendu client ne correspond plus au serveur.
 */

const DEFAULT_APP_URL = "https://m-ai.fr";

/** Base du site, déduite de la requête réelle quand elle est disponible. */
export function getAppUrl(reqHeaders?: Headers): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  if (reqHeaders) {
    const host =
      reqHeaders.get("x-forwarded-host") ?? reqHeaders.get("host") ?? undefined;
    if (host) {
      const proto =
        reqHeaders.get("x-forwarded-proto") ??
        (host.startsWith("localhost") ? "http" : "https");
      return `${proto}://${host}`;
    }
  }

  return DEFAULT_APP_URL;
}

/** URL absolue d'une route interne, calculée côté serveur. */
export function getCanonicalUrl(
  reqHeaders: Headers | undefined,
  pathname: string
): string {
  const base = getAppUrl(reqHeaders);
  return `${base}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}
