/**
 * ============================================================================
 * ADAPTATEUR DE ROUTAGE — Vibe au-dessus de l'App Router
 * ============================================================================
 *
 * POURQUOI CE FICHIER
 *
 * Vibe a été écrit pour `react-router-dom` : 98 fichiers, 15 d'entre eux
 * utilisent le routeur. Réécrire chacun en `next/navigation` revient à choisir,
 * à la main, entre `useRouter` et `usePathname` à chaque appel — et à laisser
 * cohabiter deux langages de navigation dans un même dossier.
 *
 * Ce module expose les MÊMES primitives (`useNavigate`, `useLocation`,
 * `useParams`, `Link`) avec les MÊMES signatures, construites sur l'App Router.
 * Les pages Vibe restent inchangées et le routage n'est décrit qu'à un endroit.
 *
 * LE POINT DELICAT : LE PREFIXE /vibe
 *
 * Vibe vit chez lui à la racine (`/`, `/explore`, `/post/:id`, `/@user`).
 * Intégré, il vit sous `/vibe`. Deux espaces de noms se superposent alors :
 *
 *   - Les composants comparent des chemins EN RELATIF (`location.pathname ===
 *     '/'`, `startsWith('/explore')`, `/@${username}`). Si on leur servait le
 *     chemin absolu, toutes ces comparaisons tombent à côté et la navigation
 *     sélectionne deux fois le même onglet.
 *
 *   - `navigate('/explore')` doit produire `/vibe/explore` à l'écran.
 *
 * D'où la fonction `toVibePath` (relatif → absolu) et `toVibeLocation`
 * (absolu → relatif). Une seule règle de conversion, testée dans
 * tests/unit/vibe-router.test.ts, et les deux sens ne peuvent pas diverger.
 *
 * `navigate(-1)` est traduit par `router.back()`. Le paramètre `key` de
 * react-router (utilisé par le gestionnaire de scroll pour distinguer deux
 * entrées du même chemin) n'a pas d'équivalent ici : on synthétise une clé
 * stable à partir de chemin + query + hash, ce qui suffit à l'usage réel
 * (remonter en haut quand la destination change).
 */

"use client";

import NextLink from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";

/**
 * Racine de Vibe dans l'application hôte. Toute conversion de chemin passe par
 * cette constante — jamais une chaîne en dur dispersée dans les pages.
 */
export const VIBE_BASE_PATH = "/vibe";

/**
 * Convertit un chemin Vibe (« relatif ») en URL absolue (« /vibe/... »).
 *
 * Les chemins déjà préfixés par `/vibe` sont renvoyés tels quels : un composant
 * peut donc passer indifféremment les deux formes sans double préfixe.
 *
 * La racine se réduit à `/vibe`, jamais `/vibe/` : les deux répondent, mais le
 * second déclenche une redirection de Next et laisse une entrée d'historique en
 * trop dans une application qui navigue beaucoup.
 */
export function toVibePath(to: string): string {
  if (!to) {
    return VIBE_BASE_PATH;
  }
  // URL absolue ou protocole externe : on ne touche à rien (mailto:, https:).
  if (/^[a-z][a-z0-9+.-]*:/i.test(to) || to.startsWith("//")) {
    return to;
  }
  const [chemin, reste] = splitOnce(to, "?");
  const [base, hash] = splitOnce(reste ?? "", "#");
  const suffixe = (base ? `?${base}` : "") + (hash ? `#${hash}` : "");

  if (chemin === VIBE_BASE_PATH || chemin === `${VIBE_BASE_PATH}/`) {
    return `${VIBE_BASE_PATH}${suffixe}`;
  }
  if (chemin.startsWith(`${VIBE_BASE_PATH}/`)) {
    return `${chemin}${suffixe}`;
  }
  const normalise = chemin.startsWith("/") ? chemin : `/${chemin}`;
  // `/` est la racine de Vibe : `/vibe/` serait une redirection pour rien.
  const absolu =
    normalise === "/" ? VIBE_BASE_PATH : `${VIBE_BASE_PATH}${normalise}`;
  return `${absolu}${suffixe}`;
}

/**
 * Base publique de l'hôte (mode démo sous `/demo`), posée par `env` dans
 * next.config.ts. Elle ne concerne QUE les liens absolus construits à la main.
 */
const BASE_PUBLIQUE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * URL absolue d'un chemin Vibe, pour les liens COPIÉS ou PARTAGÉS (presse-
 * papiers, QR codes, cartes de partage, codes d'invitation).
 *
 * `router.push` et `<Link>` ajoutent eux-mêmes `/vibe` et le basePath ; un
 * `window.location.origin + chemin` écrit à la main ne le fait pas. Les liens
 * partagés pointaient donc vers `/post/42` ou `/@marie`, c'est-à-dire hors de
 * `/vibe` — 404 chez le destinataire. Une seule règle, ici, comme pour la
 * navigation.
 */
export function toVibeAbsoluteUrl(to: string): string {
  const chemin = `${BASE_PUBLIQUE}${toVibePath(to)}`;
  return typeof window === "undefined"
    ? chemin
    : `${window.location.origin}${chemin}`;
}

/** Isole chemin / query / hash sans regex coûteuse : Vibe construit ces chaînes à la main. */
function splitOnce(
  value: string,
  separateur: string
): [string, string | undefined] {
  const i = value.indexOf(separateur);
  return i === -1
    ? [value, undefined]
    : [value.slice(0, i), value.slice(i + 1)];
}

/**
 * Retrait du préfixe `/vibe` : les composants Vibe comparent des chemins
 * relatifs (`/`, `/explore`, `/@marie`). `/vibe` et `/vibe/` se réduisent
 * tous deux à `/`, sinon `location.pathname === '/'` échouerait sur la racine
 * de Vibe — le cas le plus fréquent de l'application.
 */
export function stripVibeBasePath(pathname: string): string {
  if (pathname === VIBE_BASE_PATH) {
    return "/";
  }
  if (pathname.startsWith(`${VIBE_BASE_PATH}/`)) {
    return pathname.slice(VIBE_BASE_PATH.length);
  }
  return pathname;
}

/** Objet `location` au format react-router, reconstruit depuis l'App Router. */
export interface VibeLocation {
  hash: string;
  /** Clé synthétisée : distingue deux entrées du même chemin (query, hash). */
  key: string;
  pathname: string;
  search: string;
}

export function useLocation(): VibeLocation {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();

  // `useSearchParams` est un ReadonlyURLSearchParams : on le re-sérialise pour
  // obtenir la chaîne brute que react-router exposait dans `location.search`.
  const query = searchParams.toString();
  const hash = typeof window === "undefined" ? "" : window.location.hash;

  return {
    hash,
    key: `${pathname}${query ? `?${query}` : ""}${hash}`,
    pathname: stripVibeBasePath(pathname),
    search: query ? `?${query}` : "",
  };
}

type NavigateOptions = { replace?: boolean } | undefined;

/**
 * Remplace `useNavigate`. Gère la navigation absolue (Next), le numéro
 * d'historique (`-1`) et l'option `replace`.
 */
export function useNavigate() {
  const router = useRouter();

  return (to: string | number, options?: NavigateOptions): void => {
    // react-router : navigate(-1) / navigate(-2) = remonter l'historique.
    if (typeof to === "number") {
      if (to < 0) {
        router.back();
      } else {
        router.forward();
      }
      return;
    }
    const url = toVibePath(to);
    if (options?.replace) {
      router.replace(url);
    } else {
      router.push(url);
    }
  };
}

/**
 * Remplace `useParams`. L'App Router expose les segments dynamiques du segment
 * courant via `useParams` de `next/navigation`, mais Vibe a besoin du même
 * objet quel que soit le niveau ; on lit donc le segment courant de l'URL.
 *
 * Les noms sont conservés tels que Vibe les lit (`bookId`, `code`) : le mapping
 * segment → paramètre reste ici, seul endroit qui connaît la forme des routes.
 */
export function useParams<T extends Record<string, string | undefined>>(): T {
  return useVibeRouteParams() as T;
}

/** Segments dont la page n'a pas de profil : `/explore` n'est pas un pseudo. */
const SEGMENTS_FIXES = new Set([
  "explore",
  "mai",
  "messages",
  "notifications",
  "settings",
  "stats",
]);

/** `/@marie` et `/marie` désignent le même profil : l'arobase n'est qu'un préfixe. */
function sansArobase(valeur: string): string {
  return valeur.startsWith("@") ? valeur.slice(1) : valeur;
}

/**
 * Paramètres de la route Vibe courante, dérivés du chemin RELATIF (sans
 * `/vibe`).
 *
 * On ne se fie pas à `useParams()` de Next : il ne renvoie que le segment
 * dynamique le plus proche, donc `bookId` serait absent d'une page rendue sous
 * `/vibe/books`. On dérive les paramètres du chemin Vibe lui-même : c'est
 * déterministe quelle que soit la page appelante.
 *
 * Fonction pure exportée à dessein : c'est ici que se joue la correspondance
 * route → paramètre, et une erreur ne se voit qu'à l'écran (le profil d'un
 * autre utilisateur s'affiche comme le vôtre). Testée dans
 * tests/unit/vibe-router.test.ts, sans routeur ni DOM.
 */
export function deriveVibeRouteParams(
  pathname: string
): Record<string, string | undefined> {
  const segments = pathname.split("/").filter(Boolean);
  const params: Record<string, string | undefined> = {};
  const premier = segments[0];
  if (!premier) {
    return params;
  }

  // /post/:postId
  if (premier === "post") {
    params.postId = segments[1];
    return params;
  }

  // /books/:bookId et /books/join/:code
  if (premier === "books") {
    if (segments[1] === "join") {
      params.code = segments[2];
    } else {
      params.bookId = segments[1];
    }
    return params;
  }

  // /u/:username — cible de la réécriture /vibe/@:username (next.config.ts), et
  // /profile/:username : dans les deux cas, le profil d'un AUTRE utilisateur.
  // Sans cette branche, `/u/marie` rendait le profil « u » et
  // `/profile/marie` celui de l'utilisateur connecté.
  if (premier === "u" || premier === "profile") {
    const cible = segments[1];
    if (cible) {
      params.username = sansArobase(cible);
    }
    return params;
  }

  // /@marie (lien historique de Vibe) ou /marie : profil à la racine.
  if (SEGMENTS_FIXES.has(premier)) {
    return params;
  }
  params.username = sansArobase(premier);
  return params;
}

/** Paramètres de la route Vibe courante, lus depuis l'URL de l'App Router. */
function useVibeRouteParams(): Record<string, string | undefined> {
  return deriveVibeRouteParams(stripVibeBasePath(usePathname() || "/"));
}

export interface VibeLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  children?: ReactNode;
  replace?: boolean;
  to: string;
}

/**
 * Remplace `<Link>` de react-router. `onClick` reste prioritaire — les onglets
 * mobiles s'en servent pour bloquer la navigation quand une modale est ouverte.
 */
export function Link({
  to,
  replace,
  onClick,
  children,
  ...props
}: VibeLinkProps) {
  const router = useNavigate();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) {
      return;
    }
    // Clic modifié ou bouton non principal : on laisse le navigateur agir.
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }
    event.preventDefault();
    router(to, { replace });
  };

  return (
    <NextLink href={toVibePath(to)} onClick={handleClick} {...props}>
      {children}
    </NextLink>
  );
}
