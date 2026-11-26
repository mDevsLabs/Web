import "server-only";

import { hostAllowed } from "@/lib/integrations/hosts";
import {
  getIntegrationProvider,
  type IntegrationDescriptor,
  type IntegrationProviderId,
} from "@/lib/integrations/providers";
import type { PluginToolDeps } from "../core/types";
import { type BoundedFetchOptions, boundedFetchJson } from "./bounded-fetch";
import { describeFailure } from "./public-api";

/**
 * Appels authentifiés aux API des connecteurs par jeton personnel.
 *
 * Même discipline que `fetchPublicJson` pour les garde-fous — HTTPS forcé, liste
 * blanche de hosts, redirections refusées, taille et durée bornées — avec deux
 * différences assumées : un porteur d'accès, et aucune reprise pour une écriture.
 */

export const AUTHORIZED_API_TIMEOUT_MS = 12_000;
export const AUTHORIZED_API_MAX_BYTES = 3_000_000;

export type AuthorizedResult<T> =
  | { data: T; ok: true }
  | { error: string; ok: false };

export type AuthorizedCallParams<T> = {
  accessToken: string;
  /**
   * En-tête Authorization complet. `undefined` conserve `Bearer` du jeton.
   * `null` n'envoie pas cet en-tête : la clé voyage ailleurs (api-key, URL).
   */
  authorization?: string | null;
  /** Corps JSON d'une écriture. Sa présence interdit toute reprise. */
  body?: string;
  /** Base du service, ex. `https://api.github.com`. */
  base: string;
  descriptor: IntegrationDescriptor;
  headers?: Record<string, string>;
  method?: "GET" | "PATCH" | "POST";
  /** Chemin sous la base, en littéral de code — jamais une URL du modèle. */
  path: string;
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

/** Borne uniformément un paramètre de pagination fourni par le modèle. */
export function clampLimit(
  value: number | undefined,
  fallback: number,
  max: number,
  min = 1
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(Math.max(Math.trunc(value), min), max);
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
  if (!hostAllowed(url.host, params.descriptor)) {
    return {
      error: `Hôte non déclaré par le connecteur ${params.descriptor.label} : ${url.host}.`,
      ok: false,
    };
  }
  for (const [key, value] of Object.entries(params.query ?? {})) {
    if (value === undefined || value === "") {
      continue;
    }
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

function formatAuthorizedFailure(
  label: string,
  failure: Parameters<typeof describeFailure>[0],
  timeoutMs: number
): string {
  if (failure.kind === "http" && failure.status === 401) {
    return `Jeton ${label} invalide, expiré ou révoqué (HTTP 401) : mettez à jour votre jeton depuis l'onglet Plugins.`;
  }
  if (failure.kind === "http" && failure.status === 403) {
    return `Permissions insuffisantes sur le jeton ${label} pour cette action (HTTP 403).`;
  }
  return describeFailure(failure, timeoutMs);
}

export async function callAuthorized<T>(
  params: AuthorizedCallParams<T>
): Promise<AuthorizedResult<T>> {
  const endpoint = endpointFor(params);
  if (!endpoint.ok) {
    return endpoint;
  }
  const timeoutMs = params.timeoutMs ?? AUTHORIZED_API_TIMEOUT_MS;
  const headers: Record<string, string> = { ...params.headers };
  if (params.authorization === undefined) {
    headers.Authorization = `Bearer ${params.accessToken}`;
  } else if (params.authorization) {
    headers.Authorization = params.authorization;
  }
  const options: BoundedFetchOptions = {
    body: params.body,
    headers,
    maxBytes: AUTHORIZED_API_MAX_BYTES,
    method: params.method ?? "GET",
    signal: params.signal,
    timeoutMs,
  };
  const result = await boundedFetchJson<unknown>(endpoint.data, options);
  if (!result.ok) {
    return {
      error: formatAuthorizedFailure(
        params.descriptor.label,
        result,
        timeoutMs
      ),
      ok: false,
    };
  }
  if (params.transform) {
    return params.transform(result.data);
  }
  return { data: result.data as T, ok: true };
}

/**
 * Porteur d'accès du compte, résolu À L'EXÉCUTION de l'outil.
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
