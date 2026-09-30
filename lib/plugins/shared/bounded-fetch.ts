// Lecture HTTP bornée partagée par TOUS les plugins réseau.
//
// Pourquoi ce module : la boucle « AbortController + content-length + lecture
// par chunks + plafond d'octets » était dupliquée trois fois
// (`shared/public-api`, `shared/open-meteo`, `mobilite-fr`) et les copies
// divergeaient déjà sur le délai, les libellés d'erreur et le traitement du
// 429. Ce qui reste volontairement ailleurs, c'est la LISTE BLANCHE d'hôtes :
// elle est propre à chaque API et n'a rien de générique.
//
// Ce module ne connaît donc que des URL déjà validées par l'appelant : il ne
// fait aucune politique d'accès. Il garantit en revanche, une seule fois :
//   - un délai maximal, toujours NETTOYÉ (sinon une génération peut rester
//     suspendue jusqu'au timeout du run) ;
//   - l'annulation immédiate quand l'appelant abandonne (Agent interrompu) ;
//   - un plafond d'octets appliqué DEUX fois (en-tête announced puis au
//     flux), sinon une réponse sans content-length peut saturer la mémoire ;
//   - le refus des redirections, qui sinon contourne la liste blanche ;
//   - une seule reprise sur incident transitoire (502/503/504). Le 429 n'est
//     PAS rejoué : son Retry-After se compte en secondes, pas en millisecondes.

export const DEFAULT_TIMEOUT_MS = 8000;
export const DEFAULT_MAX_BYTES = 1_000_000;

/** Statuts considered incidents de transport : rejoués une fois. */
const RETRYABLE_STATUSES: ReadonlySet<number> = new Set([502, 503, 504]);
/** 2 tentatives au total (1 reprise), délai court : au-delà, on rend la main. */
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 300;

export type BoundedFetchFailureKind =
  /** L'appelant a annulé (Agent interrompu, génération abandonnée). */
  | "aborted"
  /** Corps vide ou illisible. */
  | "body"
  /** Statut HTTP en erreur — voir `status`. */
  | "http"
  /** Panne réseau (DNS, TLS, socket). */
  | "network"
  /** Le service a répondu en redirigeant : liste blanche contournée. */
  | "redirect"
  /** Réponse plus volumineuse que la limite. */
  | "too_large"
  /** Le délai maximal est dépassé. */
  | "timeout";

export type BoundedFetchFailure = {
  attempts: number;
  kind: BoundedFetchFailureKind;
  ok: false;
  /** Honouré par l'adaptateur Agent pour rejouer au bon moment. */
  retryAfterMs?: number;
  status?: number;
};

export type BoundedFetchResult =
  | { bytes: Uint8Array; ok: true; status: number }
  | BoundedFetchFailure;

export type BoundedJsonResult<T> =
  | { data: T; ok: true; status: number }
  | ({
      kind: BoundedFetchFailureKind | "json";
      ok: false;
    } & Omit<BoundedFetchFailure, "kind" | "ok">);

export type BoundedFetchOptions = {
  headers?: Record<string, string>;
  maxBytes?: number;
  /** 0 désactive toute reprise. Défaut : une reprise sur 502/503/504. */
  retries?: 0 | 1;
  /** Annulation transmise par l'appelant ; prioritaire sur le délai interne. */
  signal?: AbortSignal;
  timeoutMs?: number;
};

type RawResult =
  | { bytes: Uint8Array; ok: true; status: number }
  | {
      kind: BoundedFetchFailureKind;
      ok: false;
      retryAfterMs?: number;
      status?: number;
    };

function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  );
}

function retryAfterMsFrom(response: Response): number | undefined {
  const raw = response.headers.get("retry-after");
  if (!raw) return;
  const seconds = Number(raw);
  if (Number.isFinite(seconds) && seconds > 0) {
    return Math.min(seconds * 1000, 60_000);
  }
  // Le 429 de l'API World Bank renvoie une date HTTP, pas un délai.
  const date = Date.parse(raw);
  return Number.isNaN(date) ? undefined : Math.max(date - Date.now(), 0);
}

async function attemptFetch(
  url: URL,
  options: BoundedFetchOptions,
  maxBytes: number,
  timeoutMs: number
): Promise<RawResult> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  // `once` évite de laisser un écouteur sur le signal du run Agent.
  const onExternalAbort = () => controller.abort();
  options.signal?.addEventListener("abort", onExternalAbort, { once: true });

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json", ...options.headers },
      method: "GET",
      redirect: "error",
      signal: controller.signal,
    });

    if (!response.ok) {
      const retryAfterMs = retryAfterMsFrom(response);
      return {
        kind: "http",
        ok: false,
        status: response.status,
        ...(retryAfterMs === undefined ? {} : { retryAfterMs }),
      };
    }

    const announced = Number(response.headers.get("content-length") ?? 0);
    if (announced > maxBytes) {
      return { kind: "too_large", ok: false };
    }
    if (!response.body) {
      return { kind: "body", ok: false };
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let byteCount = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      byteCount += chunk.value.byteLength;
      // Second garde-fou : une réponse sans content-length n'est pas bornée
      // par l'en-tête, seule la lecture permet de l'arrêter à temps.
      if (byteCount > maxBytes) {
        await reader.cancel();
        return { kind: "too_large", ok: false };
      }
      chunks.push(chunk.value);
    }

    const bytes = new Uint8Array(byteCount);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return { bytes, ok: true, status: response.status };
  } catch (error) {
    if (isAbortError(error)) {
      return { kind: timedOut ? "timeout" : "aborted", ok: false };
    }
    if (error instanceof TypeError && /redirect/i.test(error.message)) {
      return { kind: "redirect", ok: false };
    }
    return { kind: "network", ok: false };
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", onExternalAbort);
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * GET borné sur une URL déjà autorisée par l'appelant. Ne lève jamais : un
 * incident réseau est un résultat, pas une exception, parce que le modèle doit
 * pouvoir corriger sa requête. Le corps est rendu en octets bruts : le
 * catalogue de mobilité ne publie pas de JSON.
 */
export async function boundedFetch(
  url: URL,
  options: BoundedFetchOptions = {}
): Promise<BoundedFetchResult> {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxAttempts = options.retries === 0 ? 1 : MAX_ATTEMPTS;

  // Annulation déjà demandée : ne part pas une requête inutile.
  if (options.signal?.aborted) {
    return { attempts: 0, kind: "aborted", ok: false };
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = await attemptFetch(url, options, maxBytes, timeoutMs);
    const retryable =
      !result.ok &&
      result.kind === "http" &&
      RETRYABLE_STATUSES.has(result.status ?? 0);
    if (result.ok || !retryable || attempt === maxAttempts) {
      return result.ok ? result : { ...result, attempts: attempt };
    }
    await wait(RETRY_DELAY_MS);
    // Annulation pendant l'attente de reprise : rendre la main sans rejouer.
    if (options.signal?.aborted) {
      return { attempts: attempt, kind: "aborted", ok: false };
    }
  }

  /* c8 ignore next 2 */
  return { attempts: maxAttempts, kind: "network", ok: false };
}

/** Variante JSON de `boundedFetch` : même garde-fous, corps décodé. */
export async function boundedFetchJson<T>(
  url: URL,
  options: BoundedFetchOptions = {}
): Promise<BoundedJsonResult<T>> {
  const result = await boundedFetch(url, options);
  if (!result.ok) {
    return result;
  }
  try {
    return {
      data: JSON.parse(new TextDecoder().decode(result.bytes)) as T,
      ok: true,
      status: result.status,
    };
  } catch {
    return { attempts: 1, kind: "json", ok: false };
  }
}
