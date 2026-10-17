import "server-only";

import type { ApiErrorCode } from "@/lib/api/error-codes";
import { normalizeUpstreamError } from "@/lib/api/error-response";
import type { ApiErrorPayload } from "@/lib/api/error-schema";
import { MAI_API_URL } from "@/lib/constants";

// Client unique vers le backend Val Town.
//
// Le dépôt compte plus de 33 appels à `fetch(`${MAI_API_URL}…`)`, chacun
// redéclarant l'en-tête `Authorization`, son propre délai, `cache: "no-store"`
// et sa façon de normaliser l'erreur. Chaque copie a divergé : certaines
// traitent une réponse non-JSON, d'autres perdent le message précis du backend,
// d'autres ne propagent pas `Retry-After`. Ce module rend la forme unique.
//
// Le retour est discriminé (`ok: true | ok: false`) : l'appelant n'a plus à
// écrire le bloc `if (!res.ok) { … normalizeUpstreamError … }`, qui était la
// partie divergente à chaque fois.

/** Délai par défaut. Assez long pour une generation d'image, court pour du JSON. */
const DEFAULT_TIMEOUT_MS = 15_000;

// Les chemins amont qui lisent ou écrivent une donnée personnelle ne sont jamais
// mis en cache : `cache: "no-store"` partout, sans exception.
export type UpstreamMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";

export type UpstreamCall<T> =
  | { data: T; ok: true; status: number }
  | { ok: false; payload: ApiErrorPayload };

export type UpstreamParams = {
  /**
   * Chemin amont, avec ou sans slash initial : `/usage` et `usage` sont
   * acceptés. Ne jamais.includes une valeur d'appelant — passer par
   * `query` pour les paramètres.
   */
  path: string;
  method?: UpstreamMethod;
  /** Corps sérialisé en JSON. Un corps avec `method: "GET"` est ignoré. */
  body?: unknown;
  /**
   * Paramètres de requête. Clés et valeurs sont encodées par `URLSearchParams` :
   * c'est la seule façon sûre de composer une URL amont à partir d'une entrée.
   */
  query?: Record<string, number | string | undefined>;
  /**
   * En-têtes additionnels (par exemple `x-user-id`).
   *
   * `Authorization` est réservé : il est dérivé de `token` et ignoré ici. Sans
   * cette garantie, un appelant pourrait passer une liste de ses propres
   * en-têtes et remplacer l'authentification qu'on cherche à appliquer.
   */
  headers?: Record<string, string>;
  /**
   * Jeton de session de l'utilisateur, relayé tel quel. `null` omet
   * l'en-tête : la requête part alors sans authentification, ce qui convient
   * aux rares endpoints publics.
   */
  token?: string | null;
  timeoutMs?: number;
  /**
   * Forçage du code d'erreur lorsque le backend n'en fournit pas. Utilisé
   * quand la route connaît la nature de l'échec (quotas, conflicts…).
   */
  code?: ApiErrorCode;
  /** Message à exposer au client, prioritaire sur celui du backend. */
  message?: string;
};

export function upstreamUrl(
  path: string,
  query?: UpstreamParams["query"]
): string {
  const base = `${MAI_API_URL}${path.startsWith("/") ? path : `/${path}`}`;
  if (!query) {
    return base;
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    // `undefined` = paramètre absent, pas paramètre vide.
    if (value !== undefined) {
      params.set(key, String(value));
    }
  }
  const search = params.toString();
  return search ? `${base}?${search}` : base;
}

/**
 * Envoie un `FormData` tel quel au backend.
 *
 * `upstreamJson` sérialise le corps en JSON et ne convient donc pas à un
 * envoi de fichier. Cette variante ne fixe PAS de `Content-Type` : c'est le
 * runtime qui doit ajouter la frontière multipart, et le faire à la main casse
 * l'analyse du formulaire côté amont.
 */
export async function upstreamForm<T = unknown>(params: {
  path: string;
  form: FormData;
  method?: UpstreamMethod;
  query?: UpstreamParams["query"];
  timeoutMs?: number;
  token?: string | null;
}): Promise<UpstreamCall<T>> {
  const {
    form,
    method = "POST",
    path,
    query,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    token,
  } = params;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(upstreamUrl(path, query), {
      body: form,
      cache: "no-store",
      headers,
      method,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    return {
      ok: false,
      payload: normalizeUpstreamError(null, 502, {
        message: "Le service de fichiers est momentanément injoignable.",
      }),
    };
  }

  const parsed = await readJsonBody(response);
  if (!response.ok) {
    return {
      ok: false,
      payload: normalizeUpstreamError(parsed.body, response.status),
    };
  }
  return { data: parsed.body as T, ok: true, status: response.status };
}

/**
 * Lit un corps JSON sans faire échouer une réponse d'erreur HTML.
 * `res.json()` lèverait et transformerait une panne lisible en 500 opaque.
 */
async function readJsonBody(response: Response): Promise<{ body: unknown }> {
  const text = await response.text();
  if (!text) {
    return { body: null };
  }
  try {
    return { body: JSON.parse(text) };
  } catch {
    return { body: { message: text.slice(0, 500) } };
  }
}

/**
 * Appelle le backend et normalise sa réponse.
 *
 * Ne lève jamais : un échec réseau devient un payload d'erreur comme un autre,
 * ce qui évite au caller un `try/catch` qui englobe tout le handler. Les
 * erreurs de programmation (URL invalide impossible ici, `path` non
 * `path` non textuelle) restent des exceptions.
 */
export async function upstreamJson<T = unknown>(
  params: UpstreamParams
): Promise<UpstreamCall<T>> {
  const {
    body,
    code,
    headers: extraHeaders,
    message,
    method = "GET",
    path,
    query,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    token,
  } = params;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  // `Authorization` est toujours dérivé de `token` : une valeur fournie par
  // l'appelant dans `headers` est ignorée, sinon le client amont pourrait se
  // voir appliquer une autre authentification que celle demandée.
  for (const [key, value] of Object.entries(extraHeaders ?? {})) {
    if (key.toLowerCase() !== "authorization") {
      headers[key] = value;
    }
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (body !== undefined && method !== "GET") {
    headers["Content-Type"] = "application/json";
  }

  let response: Response;
  try {
    response = await fetch(upstreamUrl(path, query), {
      body:
        body === undefined || method === "GET"
          ? undefined
          : JSON.stringify(body),
      cache: "no-store",
      headers,
      method,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    // Panne réseau ou délai dépassé : ni le code HTTP ni la charge utile amont
    // n'existent. On distingue le délai, plus fréquent et plus actionnable.
    const timedOut =
      error instanceof DOMException && error.name === "TimeoutError";
    return {
      ok: false,
      payload: normalizeUpstreamError(null, timedOut ? 504 : 502, {
        message:
          message ??
          (timedOut
            ? "Le service ne répond pas. Réessayez dans un instant."
            : "Le service est momentanément injoignable."),
      }),
    };
  }

  const parsed = await readJsonBody(response);

  if (!response.ok) {
    return {
      ok: false,
      payload: normalizeUpstreamError(parsed.body, response.status, {
        ...(code ? { code } : {}),
        ...(message ? { message } : {}),
      }),
    };
  }

  return { data: parsed.body as T, ok: true, status: response.status };
}

/**
 * Variante qui lève sur échec, pour les appelants déjà dans un `try/catch`.
 * `normalizeUpstreamError` a produit un payload : on le rend tel quel via
 * `toErrorResponse` plutôt que de reconstruire une erreur.
 */
export async function upstreamJsonOrThrow<T = unknown>(
  params: UpstreamParams
): Promise<T> {
  const result = await upstreamJson<T>(params);
  if (result.ok) {
    return result.data;
  }
  throw new UpstreamError(result.payload);
}

/** Erreur portant le payload déjà normalisé par `upstreamJson`. */
export class UpstreamError extends Error {
  readonly payload: ApiErrorPayload;

  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.name = "UpstreamError";
    this.payload = payload;
  }

  toResponse(): Response {
    return Response.json(this.payload, { status: this.payload.status });
  }
}

/**
 * Réponse 502 pour un amont injoignable, à utiliser dans le `catch` d'un
 * handler qui appelle `upstreamJsonOrThrow`.
 */
export function upstreamErrorResponse(
  error: unknown,
  fallbackMessage = "Le service est momentanément injoignable."
): Response {
  if (error instanceof UpstreamError) {
    return error.toResponse();
  }
  return errorResponse(fallbackMessage);
}

function errorResponse(message: string): Response {
  return Response.json(
    { code: "upstream_error", message, status: 502 },
    { status: 502 }
  );
}
