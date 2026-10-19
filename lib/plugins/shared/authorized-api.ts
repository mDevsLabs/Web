import "server-only";

import {
  getIntegrationProvider,
  type IntegrationDescriptor,
  type IntegrationProviderId,
  splitGrantedScopes,
} from "@/lib/integrations/providers";
import type { PluginToolDeps } from "../types";
import { type BoundedFetchOptions, boundedFetchJson } from "./bounded-fetch";
import { describeFailure } from "./public-api";

/**
 * Appels authentifiés aux API des connecteurs (Google, GitHub).
 *
 * Même discipline que `fetchPublicJson` pour les garde-fous — HTTPS forcé, liste
 * blanche de hosts, redirections refusées, taille et durée bornées — avec deux
 * différences assumées : un porteur Bearer, et aucune reprise pour une écriture
 * (rejouer un POST après un 503 enverrait deux e-mails).
 *
 * Un hôte absent de la liste blanche du descripteur est refusé avant tout appel :
 * le modèle ne choisit jamais l'adresse à atteindre, seulement des morceaux de
 * chemin, et ceux-ci passent par `encodeSegment`.
 */

export const AUTHORIZED_API_TIMEOUT_MS = 12_000;
/** Une page de résultats Drive ou Gmail pèse plus qu'un avis météo. */
export const AUTHORIZED_API_MAX_BYTES = 3_000_000;

export type AuthorizedResult<T> =
  | { data: T; ok: true }
  | { error: string; ok: false };

export type AuthorizedCallParams<T> = {
  accessToken: string;
  /** Corps JSON d'une écriture. Sa présence interdit toute reprise. */
  body?: string;
  /** Base du service, ex. `https://www.googleapis.com/drive/v3`. */
  base: string;
  descriptor: IntegrationDescriptor;
  headers?: Record<string, string>;
  method?: "GET" | "POST";
  /** Chemin sous la base, en littéral de code — jamais une URL du modèle. */
  path: string;
  /**
   * Paramètres de requête. Une valeur en tableau est répétée dans l'URL —
   * Gmail attend `metadataHeaders=From&metadataHeaders=Subject`, que la forme
   * jointe ne remplace pas.
   */
  query?: Record<
    string,
    readonly (string | number)[] | string | number | undefined
  >;
  signal?: AbortSignal;
  timeoutMs?: number;
  /** Réduit et tronque la réponse brute avant qu'elle n'atteigne le modèle. */
  transform?: (payload: unknown) => AuthorizedResult<T>;
};

/** Un segment de chemin fourni par le modèle : encodé, jamais interpolé nu. */
export function encodeSegment(value: string): string {
  return encodeURIComponent(value.trim().replace(/^\/+|\/+$/g, ""));
}

function endpointFor(
  params: Pick<
    AuthorizedCallParams<unknown>,
    "base" | "descriptor" | "path" | "query"
  >
): AuthorizedResult<URL> {
  if (
    !params.path.startsWith("/") ||
    params.path.includes("//") ||
    params.path.includes("..")
  ) {
    return { error: "Chemin d'API refusé.", ok: false };
  }
  let url: URL;
  try {
    url = new URL(`${params.base.replace(/\/+$/, "")}${params.path}`);
  } catch {
    return { error: "Adresse d'API invalide.", ok: false };
  }
  if (url.protocol !== "https:") {
    return {
      error: "Seul HTTPS est admis pour un appel authentifié.",
      ok: false,
    };
  }
  if (!params.descriptor.hosts.includes(url.host)) {
    return {
      error: `Hôte non déclaré par le connecteur ${params.descriptor.label} : ${url.host}.`,
      ok: false,
    };
  }
  for (const [key, value] of Object.entries(params.query ?? {})) {
    if (value === undefined || value === "") {
      continue;
    }
    // Une valeur multiple se répète dans la query : Gmail l'exige
    // (`metadataHeaders=From&metadataHeaders=To`), et une jointure par virgules
    // n'est pas la même requête pour les API de Google.
    if (Array.isArray(value)) {
      for (const item of value) {
        url.searchParams.append(key, String(item));
      }
      continue;
    }
    url.searchParams.set(key, String(value));
  }
  return { data: url, ok: true };
}

export async function callAuthorized<T>(
  params: AuthorizedCallParams<T>
): Promise<AuthorizedResult<T>> {
  const endpoint = endpointFor(params);
  if (!endpoint.ok) {
    return endpoint;
  }
  const timeoutMs = params.timeoutMs ?? AUTHORIZED_API_TIMEOUT_MS;
  const options: BoundedFetchOptions = {
    body: params.body,
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      ...params.headers,
    },
    maxBytes: AUTHORIZED_API_MAX_BYTES,
    method: params.method ?? "GET",
    signal: params.signal,
    timeoutMs,
  };
  // `body` et `method` sont portés par BoundedFetchOptions : une écriture n'y a
  // droit à aucune reprise, voir `boundedFetch`.
  const result = await boundedFetchJson<unknown>(endpoint.data, options);
  if (!result.ok) {
    return { error: describeFailure(result, timeoutMs), ok: false };
  }
  if (params.transform) {
    return params.transform(result.data);
  }
  return { data: result.data as T, ok: true };
}

/**
 * Porteur d'accès du compte, résolu À L'EXÉCUTION de l'outil.
 *
 * Résoudre le jeton à la création des outils le figerait pour toute la durée du
 * run : un Agent de quarante minutes partirait avec un jeton d'une heure et
 * tomberait en 401 en plein milieu. `secretResolver` rafraîchit à chaque appel.
 *
 * Le message d'absence de connexion est un échec PERMANENT assumé : il ne
 * contient aucun des mots (« service indisponible », « délai », « réseau »,
 * « 429 ») que l'adaptateur Agent interprète comme transitoire, donc aucun
 * rejeu automatique ne viendra user le quota du compte pour rien.
 */
export async function bearerFor(
  deps: PluginToolDeps,
  providerId: IntegrationProviderId
): Promise<AuthorizedResult<string>> {
  const descriptor = getIntegrationProvider(providerId);
  if (!descriptor) {
    return { error: `Connecteur inconnu : « ${providerId} ».`, ok: false };
  }
  const token = await deps.secretResolver?.({
    key: `${providerId}.access_token`,
    kind: "auth",
  });
  if (!token) {
    return {
      error: `Aucune connexion ${descriptor.label} sur ce compte. Connectez-la depuis l'onglet Plugins, puis mentionnez @${descriptor.mentionToken}.`,
      ok: false,
    };
  }
  return { data: token, ok: true };
}

/** Refus d'écrire quand le consentement n'a pas accordé la portée nécessaire. */
export async function requireWriteScope(
  deps: PluginToolDeps,
  providerId: IntegrationProviderId,
  scope: string
): Promise<AuthorizedResult<true>> {
  const descriptor = getIntegrationProvider(providerId);
  if (!descriptor) {
    return { error: `Connecteur inconnu : « ${providerId} ».`, ok: false };
  }
  const granted =
    (await deps.secretResolver?.({
      key: `${providerId}.scopes`,
      kind: "auth",
    })) ?? "";
  if (splitGrantedScopes(granted).has(scope)) {
    return { data: true, ok: true };
  }
  return {
    error: `Le consentement ${descriptor.label} de ce compte n'inclut pas la portée « ${scope} » : reconnectez le compte en l'accordant.`,
    ok: false,
  };
}
