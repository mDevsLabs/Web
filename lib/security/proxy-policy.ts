/**
 * Politique d'exemption du middleware (`proxy.ts`).
 *
 * Le middleware exige un cookie de session valide sur toute route non publique.
 * Certaines routes API portent cependant LEUR PROPRE authentification : secret de
 * cron par en-tête, clé API en `Bearer` pour l'API publique, ou publicité assumée.
 * Un client non-navigateur (SDK, curl, agent externe) n'envoie jamais de cookie :
 * si on le lui exige, il reçoit un 401 du middleware sans que le handler ait pu
 * valider sa clé — l'API devient injoignable alors qu'elle est correcte.
 *
 * L'exemption retire UNIQUEMENT l'exigence du cookie. Elle ne désactive jamais
 * l'authentification réelle : la requête atteint son endpoint, qui applique ses
 * propres contrôles, et l'amont tranche la clé, le quota et la facturation.
 *
 * Ce module est volontairement pur (aucune dépendance à `next/server`, aux
 * `cookies()` ni à `server-only`) : c'est la seule façon de tester la frontière
 * d'authentification sans monter un runtime Next. La fabrication de la `Response`
 * reste dans `proxy.ts` (AGENTS.md §7).
 */

/**
 * Préfixes exemptés. Le `/` final fait partie de la clé : `/api/site/v1betaevil`
 * ne correspond pas à `/api/site/v1beta/`. Un préfixe approximatif serait une
 * porte de contournement vers des routes privées.
 */
export const PREFIXES_API_AUTONOMES = [
  "/api/cron/",
  // L'API publique v1 (OpenAI-compatible) et v1beta (Google Generative AI)
  // s'authentifient par clé Bearer, jamais par cookie navigateur.
  "/api/site/v1/",
  "/api/site/v1beta/",
  // Proxys de lecture des widgets du site vitrine (statistiques, versions et
  // activité GitHub). Publiques par conception : elles ne renvoient aucune donnée
  // de compte, et un visiteur anonyme de /site doit pouvoir les charger. Ce sont
  // des lectures côté serveur précisément pour que le navigateur n'ait pas à
  // declaring d'origine externe dans la CSP.
  "/api/site/github/",
  "/api/skills/share/",
] as const;

/**
 * Le chemin porte-t-il l'un des préfixes autonomes ?
 *
 * Un chemin contenant une traversée (`..`) ou une séquence d'échappement (`%`)
 * n'est JAMAIS exempté : on ne peut pas savoir ce que le routeur en fera après
 * décodage, et exempter à tort ouvrirait éventuellement une route privée. Le
 * refus est sûr — le client est alors traité comme un navigateur et doit
 * présenter son cookie.
 */
export function estPrefixeApiAutonome(pathname: string): boolean {
  if (pathname.includes("..") || pathname.includes("%")) {
    return false;
  }
  return PREFIXES_API_AUTONOMES.some((prefixe) => pathname.startsWith(prefixe));
}

/**
 * Retire le `basePath` (mode démo : `/demo`) lorsque le pathname le porte.
 *
 * Next le conserve ou le retire selon le point d'entrée, et le dépôt hésite déjà
 * (`proxy.ts` teste les deux formes pour BotID). Cette normalisation rend
 * l'exemption correcte dans les deux cas. Elle ne s'applique qu'à la comparaison
 * de préfixe : l'URL de retour après connexion doit rester construite sur le
 * pathname d'origine, sinon on produit un `/demo/demo/login`.
 */
export function cheminSansBasePath(pathname: string, base: string): string {
  if (base && (pathname === base || pathname.startsWith(`${base}/`))) {
    return pathname.slice(base.length) || "/";
  }
  return pathname;
}

/**
 * Deuxième juge : la route est-elle exemptée, `basePath` pris en compte ?
 * Garder les deux questions séparées laisse `proxy.ts` intact sur le reste de sa
 * logique (redirect de connexion, assets statiques, routes d'authentification).
 */
export function estRouteApiAutonome(pathname: string, base: string): boolean {
  return estPrefixeApiAutonome(cheminSansBasePath(pathname, base));
}
