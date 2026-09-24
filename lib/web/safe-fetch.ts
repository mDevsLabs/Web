import type { IncomingHttpHeaders, IncomingMessage } from "node:http";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import {
  MAX_REDIRECTS,
  resolveRedirectTarget,
  validateAndResolveUrl,
} from "./ssrf";

// Client HTTP unique pour TOUTES les sorties réseau pilotées par du contenu non
// fiable (lecture d'URL, extraction de documents, capture web).
//
// Ce que ce module garantit, et que des `fetch()` dispersés ne garantissaient pas :
//   1. résolution DNS vérifiée puis ÉPINGLÉE (`lookup`) : la connexion part
//      vers l'adresse validée, jamais vers une seconde résolution (rebinding) ;
//   2. redirections suivies MANUELLEMENT, chacune entièrement revalidée
//      (protocole, hôte, adresses) avec une limite stricte de 3 sauts ;
//   3. corps lu en FLUX avec plafond d'octets : un serveur ne peut pas faire
//      allouer 2 Go avant troncature ;
//   4. `Accept-Encoding: identity` : aucune bombe de décompression HTTP ;
//   5. délais bornés (connexion + corps) et type MIME contrôlable ;
//   6. `Authorization` envoyé UNIQUEMENT vers une origine explicitement
//      autorisée (jamais vers une URL arbitraire fournie par un tiers).

export const DEFAULT_MAX_BYTES = 2_000_000;
export const DOCUMENT_MAX_BYTES = 8_000_000;
export const DEFAULT_TIMEOUT_MS = 15_000;

export type SafeFetchFailure = { error: string; ok: false; status?: number };

export type SafeFetchSuccess = {
  bytes: number;
  contentType: string;
  finalUrl: string;
  ok: true;
  status: number;
  text: string;
  truncated: boolean;
};

export type SafeFetchBufferSuccess = {
  buffer: Buffer;
  bytes: number;
  contentType: string;
  finalUrl: string;
  ok: true;
  status: number;
  truncated: boolean;
};

export type SafeFetchOptions = {
  /** Délai maximal, connexion et lecture du corps incluses. */
  allowedContentTypes?: Array<string | RegExp>;
  headers?: Record<string, string>;
  maxBytes?: number;
  maxRedirects?: number;
  resolver?: (hostname: string) => Promise<string[]>;
  signal?: AbortSignal;
  timeoutMs?: number;
  method?: "GET" | "POST";
  body?: string | Uint8Array;
  /**
   * Origines autorisées à recevoir l'en-tête `Authorization`. Toute autre
   * destination (y compris après une redirection) le voit retiré : un jeton de
   * session ne peut pas être exfiltré par un `Location:` contrôlé par un tiers.
   */
  tokenOriginAllowlist?: readonly string[];
};

/**
 * En-têtes réellement envoyés à un saut donné. `Authorization` est retiré dès
 * que l'origine n'est pas dans la liste blanche — le contrôle est refait à
 * CHAQUE saut, car une redirection peut changer d'origine.
 */
export function headersForHop(
  headers: Record<string, string>,
  url: string,
  allowlist: readonly string[] | undefined
): Record<string, string> {
  const hasAuth = Object.keys(headers).some(
    (name) => name.toLowerCase() === "authorization"
  );
  if (!hasAuth) {
    return headers;
  }
  if (allowlist === undefined) {
    // Aucun jeton fourni par un appelant qui ne déclare pas de liste blanche :
    // l'en-tête est retiré. Par défaut on ne fait pas confiance.
    return withoutAuthorization(headers);
  }
  if (isTokenOriginAllowed(url, allowlist)) {
    return headers;
  }
  return withoutAuthorization(headers);
}

function withoutAuthorization(
  headers: Record<string, string>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, value] of Object.entries(headers)) {
    if (name.toLowerCase() !== "authorization") {
      out[name] = value;
    }
  }
  return out;
}

/**
 * Lit un flux en appliquant un plafond d'octets. Au-delà, le flux est détruit
 * et le contenu déjà lu est renvoyé avec `truncated: true` : on ne laisse
 * jamais la réponse entière s'accumuler en mémoire.
 */
export async function readStreamCapped(
  stream: AsyncIterable<unknown> & { destroy?: (error?: Error) => void },
  maxBytes: number
): Promise<{ buffer: Buffer; bytes: number; truncated: boolean }> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of stream) {
    const buf = Buffer.isBuffer(chunk)
      ? chunk
      : Buffer.from(chunk as ArrayBufferLike);
    if (total + buf.length > maxBytes) {
      const remaining = Math.max(0, maxBytes - total);
      if (remaining > 0) {
        chunks.push(buf.subarray(0, remaining));
      }
      total = maxBytes;
      stream.destroy?.();
      return { buffer: Buffer.concat(chunks), bytes: total, truncated: true };
    }
    chunks.push(buf);
    total += buf.length;
  }
  return { buffer: Buffer.concat(chunks), bytes: total, truncated: false };
}

/**
 * Un jeton interne (session mAI) ne part que vers une origine de confiance
 * explicite. Comparaison stricte sur l'origine (schéma + hôte + port), pas sur
 * un préfixe de chaîne : `https://api.mai.example.evil.com` ne correspond pas
 * à `https://api.mai.example`.
 */
export function isTokenOriginAllowed(
  targetUrl: string,
  allowlist: readonly string[]
): boolean {
  let origin: string;
  try {
    origin = new URL(targetUrl).origin;
  } catch {
    return false;
  }
  return allowlist.some((allowed) => {
    try {
      const parsed = new URL(allowed);
      return parsed.origin === origin;
    } catch {
      return false;
    }
  });
}

/** Liste blanche d'origines pouvant recevoir un jeton de session mAI. */
export function tokenOriginAllowlist(): string[] {
  const origins = [
    process.env.MAI_API_URL,
    process.env.MAI_API_ORIGIN,
    process.env.NEXT_PUBLIC_MAI_API_URL,
  ].filter((value): value is string => Boolean(value?.trim()));
  return origins;
}

type SingleResponse = {
  headers: IncomingHttpHeaders;
  status: number;
  stream: IncomingMessage;
};

function pinnedLookup(addresses: string[]) {
  // La résolution est déjà faite et validée : on épingle l'adresse pour que
  // la pile réseau ne relance JAMAIS une résolution concurrente.
  return (
    _hostname: string,
    _options: unknown,
    callback: (error: Error | null, address?: string, family?: number) => void
  ) => {
    const address = addresses[0];
    if (!address) {
      callback(new Error("Aucune adresse validée pour cet hôte."));
      return;
    }
    callback(null, address, address.includes(":") ? 6 : 4);
  };
}

function requestOnce(params: {
  addresses: string[];
  body?: string | Uint8Array;
  headers: Record<string, string>;
  method?: "GET" | "POST";
  signal?: AbortSignal;
  timeoutMs: number;
  url: URL;
}): Promise<SingleResponse> {
  return new Promise((resolve, reject) => {
    const isHttps = params.url.protocol === "https:";
    const request = (isHttps ? httpsRequest : httpRequest)(
      {
        headers: params.headers,
        host: params.url.hostname,
        lookup: pinnedLookup(params.addresses) as never,
        method: params.method ?? "GET",
        path: `${params.url.pathname}${params.url.search}`,
        port: params.url.port ? Number(params.url.port) : isHttps ? 443 : 80,
        signal: params.signal,
      },
      (response) => {
        resolve({
          headers: response.headers,
          status: response.statusCode ?? 0,
          stream: response,
        });
      }
    );

    request.setTimeout(params.timeoutMs, () => {
      request.destroy(new Error(`Délai dépassé (${params.timeoutMs} ms).`));
    });
    request.on("error", reject);
    request.end(params.body);
  });
}

function contentTypeAllowed(
  contentType: string,
  allowed?: Array<string | RegExp>
): boolean {
  if (!allowed || allowed.length === 0) {
    return true;
  }
  return allowed.some((rule) =>
    typeof rule === "string"
      ? contentType.toLowerCase().includes(rule.toLowerCase())
      : rule.test(contentType)
  );
}

type RawResult =
  | { failure: SafeFetchFailure }
  | {
      response: SafeFetchSuccess & { rawBuffer?: undefined };
      buffer: Buffer;
    };

async function fetchCapped(
  target: string,
  options: SafeFetchOptions
): Promise<RawResult> {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRedirects = options.maxRedirects ?? MAX_REDIRECTS;
  const headers: Record<string, string> = {
    Accept: "*/*",
    // Aucune décompression transparente : borne la mémoire allouée par un
    // serveur hostile (bombe gzip).
    "Accept-Encoding": "identity",
    ...options.headers,
  };

  let currentUrl = target;
  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    const resolved = await validateAndResolveUrl(currentUrl, {
      resolver: options.resolver,
    });
    if (resolved.error !== undefined) {
      return { failure: { error: resolved.error, ok: false } };
    }
    const { addresses, url } = resolved.host;

    let response: SingleResponse;
    try {
      response = await requestOnce({
        addresses,
        body: options.body,
        // Le jeton n'est envoyé que si l'origine de CE saut est autorisée.
        headers: headersForHop(
          headers,
          url.toString(),
          options.tokenOriginAllowlist
        ),
        method: options.method,
        signal: options.signal,
        timeoutMs,
        url,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "inconnue";
      return {
        failure: { error: `Requête impossible : ${message}.`, ok: false },
      };
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.location;
      response.stream.destroy?.();
      if (!location) {
        return {
          failure: {
            error: "Redirection sans destination fournie.",
            ok: false,
            status: response.status,
          },
        };
      }
      const next = resolveRedirectTarget(location, url.toString());
      if (!next) {
        return {
          failure: {
            error: "Redirection vers un protocole non autorisé.",
            ok: false,
            status: response.status,
          },
        };
      }
      if (hop === maxRedirects) {
        return {
          failure: {
            error: `Trop de redirections (max ${maxRedirects}).`,
            ok: false,
            status: response.status,
          },
        };
      }
      currentUrl = next.toString();
      continue; // Chaque saut est revalidé : c'est tout l'intérêt.
    }

    if (response.status < 200 || response.status >= 300) {
      response.stream.destroy?.();
      return {
        failure: {
          error: `HTTP ${response.status}`,
          ok: false,
          status: response.status,
        },
      };
    }

    const contentType = String(response.headers["content-type"] ?? "");
    if (!contentTypeAllowed(contentType, options.allowedContentTypes)) {
      response.stream.destroy?.();
      return {
        failure: {
          error: `Type de contenu refusé (${contentType || "inconnu"}).`,
          ok: false,
          status: response.status,
        },
      };
    }

    const body = await readStreamCapped(response.stream, maxBytes);
    const success: SafeFetchSuccess = {
      bytes: body.bytes,
      contentType,
      finalUrl: url.toString(),
      ok: true,
      status: response.status,
      text: body.buffer.toString("utf8"),
      truncated: body.truncated,
    };
    return { buffer: body.buffer, response: success };
  }

  return {
    failure: {
      error: `Trop de redirections (max ${maxRedirects}).`,
      ok: false,
    },
  };
}

/** Télécharge un corps borné et le renvoie en texte UTF-8. */
export async function safeFetchText(
  url: string,
  options: SafeFetchOptions = {}
): Promise<SafeFetchSuccess | SafeFetchFailure> {
  const result = await fetchCapped(url, options);
  if ("failure" in result) {
    return result.failure;
  }
  return result.response;
}

/** Télécharge un corps borné et le renvoie en octets (PDF, DOCX, images). */
export async function safeFetchBuffer(
  url: string,
  options: SafeFetchOptions = {}
): Promise<SafeFetchBufferSuccess | SafeFetchFailure> {
  const result = await fetchCapped(url, options);
  if ("failure" in result) {
    return result.failure;
  }
  const { text: _text, ...rest } = result.response;
  return { ...rest, buffer: result.buffer };
}
