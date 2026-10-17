import "server-only";

/**
 * Lecture mise en cache des API publiques de GitHub pour les widgets du site.
 *
 * Le fetch est serveur : la directive `connect-src` de la CSP n'a donc pas à
 * connaître `api.github.com`. Autoriser une origine de plus au navigateur est une
 * décision prise pour toujours ; proxifier garde la politique étroite et apporte
 * au passage le délai, le cache, et l'absence de secret dans le bundle.
 *
 * Le cache n'est pas un confort ici : un appel anonyme à l'API GitHub est plafonné
 * à soixante requêtes par heure et par IP, et tous les visiteurs d'une page
 * vitrine partagent la même IP de serveur. Sans réserve, la page serait à plat au
 * premier pic. Cinq minutes par dépôt, plus un dernier bon instantané servi
 * `stale` en cas d'incident, sont la borne qui garde la page affichable sans
 * faire semblant.
 */

import { fetchPublicJson } from "@/lib/plugins/shared/public-api";
import {
  type GithubWidget,
  indisponible,
  reponseGithub,
} from "@/lib/site/github-data";

const CACHE_TTL_MS = 5 * 60_000;
const DELAI_MS = 5000;

/**
 * En-têtes de l'API GitHub, versionnée. Aucune authentification : le dépôt n'a
 * plus de token GitHub global, et ces lectures ne concernent que des dépôts
 * publics. Un jeton n'y arrangerait rien — exposer une variable `NEXT_PUBLIC_*`
 * au navigateur revient à publier sa valeur dans le bundle.
 */
const EN_TETES_GITHUB: Record<string, string> = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

type Entree = {
  expiresAt: number;
  value: GithubWidget<unknown>;
};

const instances = new Map<string, Entree>();
const derniersBons = new Map<string, GithubWidget<unknown>>();

/**
 * Lit une ou plusieurs ressources GitHub et les normalise ensemble.
 *
 * `normaliser` reçoit un tableau de corps dans le même ordre que `urls`, avec
 * `null` à la place de ce qui n'a pas pu être lu : un widget qui a besoin de deux
 * appels (les étoiles ET la dernière version) ne doit pas traiter une moitié
 * absente comme une moitié vide.
 *
 * La `cle` porte la forme de la donnée qu'elle indexe (une clé par route et par
 * dépôt) : le cast de sortie est borné à ce module, et deux formes partageant la
 * même clé seraient un bug de clé, pas de type.
 */
export async function lireGithub<T>(
  cle: string,
  urls: string[],
  normaliser: (bruts: unknown[]) => T | null
): Promise<GithubWidget<T>> {
  const maintenant = Date.now();
  const entree = instances.get(cle);
  if (entree && entree.expiresAt > maintenant) {
    return entree.value as GithubWidget<T>;
  }

  const bruts = await Promise.all(
    urls.map(async (url) => {
      const resultat = await fetchPublicJson<unknown>(url, EN_TETES_GITHUB, {
        timeoutMs: DELAI_MS,
      });
      return resultat.ok ? resultat.data : null;
    })
  );

  // Un appel qui échoue sur deux rend la donnée incomplète : on ne normalise que
  // si TOUTES les sources ont répondu, sinon l'affichage ressemblerait à une
  // mesure (des étoiles sans version, ou l'inverse).
  if (bruts.some((brut) => brut === null)) {
    const dernierBon = derniersBons.get(cle);
    if (dernierBon) {
      return {
        ...dernierBon,
        source: "cache",
        stale: true,
      } as GithubWidget<T>;
    }
    return indisponible<T>(
      "GitHub n'a pas répondu ; la donnée est indisponible."
    );
  }

  const valeur = reponseGithub(normaliser(bruts));
  instances.set(cle, {
    expiresAt: maintenant + CACHE_TTL_MS,
    value: valeur as GithubWidget<unknown>,
  });
  if (valeur.data !== null) {
    derniersBons.set(cle, valeur as GithubWidget<unknown>);
  }
  return valeur;
}

/** En-têtes de cache HTTP communs aux trois routes de widgets. */
export const EN_TETES_CACHE_RESPONSE = {
  "Cache-Control":
    "public, max-age=300, s-maxage=300, stale-while-revalidate=3600",
};
