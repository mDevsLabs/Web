/**
 * ============================================================================
 * VIBE — PRÉ-HYDRATATION RSC (lib/vibe/server/hydration.ts)
 * ============================================================================
 *
 * Dispatcher unique route → lecteur. Les pages générées (`app/(chat)/vibe/**`)
 * appellent `getVibeHydration(cle, props)` et passent le résultat en prop aux
 * adaptateurs de `components/vibe/pages/vibe-routes.tsx`, qui le transmettent
 * aux pages en `initial*`. Le client rend alors le premier écran sans appel
 * réseau ; `ApiService` garde la main sur les rafraîchissements post-écriture
 * et la pagination (les données sont injectées dans son cache TTL sous la même
 * clé que les getters, cf. `seedEndpointFor`).
 *
 * Contrat d'échec : TOUTE erreur (base absente, table manquante,identité non
 * résolue, lecteur inconnu) produit `data: null` — jamais une exception qui
 * traverserait la frontière serveur→client. Une page dont l'hydratation échoue
 * se comporte exactement comme avant la migration : elle appelle l'API.
 */
import "server-only";
import { cache } from "react";
import type { VibeSessionHydration } from "@/lib/vibe/types/vibe";
import { vibeSql } from "./db";
import { resolveVibeIdentity, type VibeIdentity } from "./identity";
import { readBooks } from "./queries/books";
import { readCircle } from "./queries/circle";
import { readConversations } from "./queries/dms";
import { readExplore } from "./queries/explore";
import { readMe } from "./queries/me";
import { readNotifications, readUnreadCounts } from "./queries/notifications";
import { readPostSeed } from "./queries/post";
import { readProfile } from "./queries/profile";
import { readSettings } from "./queries/settings";

export type VibeHydrationKey =
  | "books"
  | "explore"
  | "feed"
  | "join"
  | "messages"
  | "notifications"
  | "post"
  | "profile"
  | "settings"
  | "stats";

export type VibeHydration<T = unknown> = {
  /** `users.id` au moment de la lecture ; le client rejette un seed d'autrui. */
  as: string | null;
  data: T | null;
  /** Horodatage ms — les adaptateurs ignorent un seed antérieur à leur écriture. */
  hydratedAt: number;
  /** Identité (route + params) du seed, pour le `hydrationKey` des hooks. */
  key: string;
};

type SearchParamValue = string | (string | undefined)[] | undefined;

export type VibeReaderContext = {
  identity: VibeIdentity | null;
  params: Record<string, string | undefined>;
  searchParams: Record<string, SearchParamValue>;
};

export type VibeReader = (ctx: VibeReaderContext) => Promise<unknown>;

/**
 * Registres des lecteurs, rempli par lots de migration. Un lot ajoute son
 * import et une entrée ; rien d'autre ne change dans la chaîne.
 */
const readers: Partial<Record<VibeHydrationKey, VibeReader>> = {};

// Lot 2 — profil. `/vibe/profile` (pseudo en session) et `/vibe/u/:username`
// partagent le même lecteur ; l'anonymat (identity null) hydrate la version
// publique, exactement comme l'API avec un jeton absent.
readers.profile = async ({ identity, params }) => {
  const username = String(params.username || "") || identity?.username || "";
  if (!username) {
    return null;
  }
  return readProfile(username, identity);
};

// Lot 3 — Explorer : tendances, Top Vibe, Top Vibers, suggestions.
readers.explore = async ({ identity }) => readExplore(identity);

// Lot 4 — publication : post + réponses en une graine (une page, deux GET).
readers.post = async ({ identity, params }) => {
  const postId = String(params.postId || "");
  if (!postId) {
    return null;
  }
  return readPostSeed(postId, identity);
};

// Lot 5 — notifications : liste authentifiée uniquement.
readers.notifications = async ({ identity }) =>
  identity ? readNotifications(identity) : null;

// Lot 6 — Messages : la liste des conversations (le fil reste à l'API/SSE).
readers.messages = async ({ identity }) => readConversations(identity);

// Lot 7 — Livres accessibles (possédés + rejoints).
readers.books = async ({ identity }) => (identity ? readBooks(identity) : null);

// Lot 8 — Réglages + Cercle : le handler GET renvoyait `{ settings }` ; la
// page consomme aussi la liste du cercle au même premier écran.
readers.settings = async ({ identity }) => {
  if (!identity) {
    return null;
  }
  const settings = await readSettings(identity);
  const circle = await readCircle(identity).catch(() => null);
  if (settings === null && !circle) {
    return null;
  }
  return { circle, settings };
};

// Rail de stories : PAS de graine serveur ici. Le gabarit de page
// (scripts/build-vibe-routes.mjs) n'admet qu'UNE seule clé d'hydratation par
// route, et celle du fil est déjà prise par `readers.feed`. Le rail appelle donc
// `GET /v1/stories/tray`, servi par le cache TTL d'ApiService (15 s). Une graine
// supposée ici serait du code mort ; l'ajouter au seed du feed en changerait la
// forme pour `useInfiniteFeed`.

/** Premier élément d'un searchParam multi-valeurs. */
export function firstParam(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function describeKey(
  key: VibeHydrationKey,
  params: Record<string, string | undefined>
): string {
  const segments = Object.keys(params)
    .sort()
    .map((name) => `${name}=${params[name] ?? ""}`);
  return segments.length > 0 ? `${key}:${segments.join("&")}` : key;
}

/**
 * Produit le seed d'une page. Appelée depuis une page serveur ; la résolution
 * d'identité lit le cookie, donc la page est dynamique (`instant = false`),
 * comme le layout `/vibe` qui lit déjà ce cookie.
 */
export async function getVibeHydration<T = unknown>(
  key: VibeHydrationKey,
  route: {
    params?: Promise<Record<string, string | undefined>>;
    searchParams?: Promise<Record<string, SearchParamValue>>;
  }
): Promise<VibeHydration<T>> {
  let params: Record<string, string | undefined> = {};
  let searchParams: Record<string, SearchParamValue> = {};
  try {
    params = (await route.params) || {};
    searchParams = (await route.searchParams) || {};
  } catch {}

  const base: VibeHydration<T> = {
    as: null,
    data: null,
    hydratedAt: Date.now(),
    key: describeKey(key, params),
  };

  if (!vibeSql()) {
    return base;
  }
  const reader = readers[key];
  if (!reader) {
    return base;
  }

  let identity: VibeIdentity | null = null;
  try {
    identity = await resolveVibeIdentity();
  } catch {
    return base;
  }

  try {
    const data = (await reader({ identity, params, searchParams })) as T | null;
    return {
      as: identity?.userId ?? null,
      data: data ?? null,
      hydratedAt: base.hydratedAt,
      key: base.key,
    };
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[vibe-server] hydratation « ${key} » en échec :`, err);
    }
    return base;
  }
}

/**
 * Session complète du layout `/vibe` : répliques serveur de `GET /v1/me`,
 * `GET /v1/settings` et `GET /v1/notifications/unread_count`, pipelées en
 * parallèle. `React.cache` : layout et pages d'une même requête ne paient la
 * résolution qu'une fois. Un lecteur en échec vaut `null` dans son compartiment
 * — le client ne retente que ce compartiment-là via l'API.
 */
export const readVibeSession = cache(
  async (): Promise<VibeSessionHydration | null> => {
    if (!vibeSql()) {
      return null;
    }
    let identity: VibeIdentity | null = null;
    try {
      identity = await resolveVibeIdentity();
    } catch {
      return null;
    }
    if (!identity) {
      return null;
    }
    const [me, settings, unread] = await Promise.all([
      readMe(identity).catch(() => null),
      readSettings(identity).catch(() => null),
      readUnreadCounts(identity).catch(() => null),
    ]);
    if (!me && !settings && !unread) {
      return null;
    }
    return { me, settings, unread };
  }
);
