// Client commun des API publiques des plugins. Les outils construisent leurs
// URL depuis des domaines constants; ce garde-fou refuse tout autre hôte,
// toute redirection et toute réponse trop volumineuse.
export const PUBLIC_API_TIMEOUT_MS = 8_000;
export const PUBLIC_API_MAX_BYTES = 1_000_000;

export type PublicApiResult<T> =
  | { data: T; ok: true; url: string }
  | { error: string; ok: false; url: string };

const ALLOWED_HOSTS = new Set([
  "api.github.com",
  "world.openfoodfacts.org",
  "search.openfoodfacts.org",
  "openlibrary.org",
  "api.crossref.org",
  "api.worldbank.org",
  "date.nager.at",
  "nagerholidays.com",
  "api.tvmaze.com",
]);

function safeStatusMessage(response: Response): string {
  if (response.status === 429) {
    const retryAfter = response.headers.get("retry-after");
    return `Limite de requêtes atteinte (HTTP 429)${retryAfter ? `; réessayez dans ${retryAfter} secondes` : ""}.`;
  }
  if (response.status === 404) {
    return "Aucun résultat trouvé (HTTP 404).";
  }
  return `Service indisponible (HTTP ${response.status}).`;
}

export async function fetchPublicJson<T>(
  rawUrl: string,
  headers: Record<string, string> = {}
): Promise<PublicApiResult<T>> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { error: "Adresse de source invalide.", ok: false, url: "" };
  }
  if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname)) {
    return { error: "Domaine de source non autorisé.", ok: false, url: "" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PUBLIC_API_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json", ...headers },
      method: "GET",
      redirect: "error",
      signal: controller.signal,
    });
    if (!response.ok) {
      return { error: safeStatusMessage(response), ok: false, url: url.href };
    }
    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (contentLength > PUBLIC_API_MAX_BYTES) {
      return { error: "Réponse trop volumineuse; résultat refusé.", ok: false, url: url.href };
    }
    const reader = response.body?.getReader();
    if (!reader) {
      return { error: "Réponse vide ou illisible.", ok: false, url: url.href };
    }
    const chunks: Uint8Array[] = [];
    let byteCount = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      byteCount += chunk.value.byteLength;
      if (byteCount > PUBLIC_API_MAX_BYTES) {
        await reader.cancel();
        return { error: "Réponse trop volumineuse; résultat refusé.", ok: false, url: url.href };
      }
      chunks.push(chunk.value);
    }
    const bytes = new Uint8Array(byteCount);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const text = new TextDecoder().decode(bytes);
    return { data: JSON.parse(text) as T, ok: true, url: url.href };
  } catch (error) {
    const aborted = error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError");
    const redirect = error instanceof TypeError && /redirect/i.test(error.message);
    return {
      error: aborted ? `Délai dépassé (${PUBLIC_API_TIMEOUT_MS / 1000}s).` : redirect ? "Redirection de la source refusée." : "Erreur réseau ou réponse JSON invalide.",
      ok: false,
      url: url.href,
    };
  } finally {
    clearTimeout(timer);
  }
}

export function sourceRef(url: string, title: string) {
  return { title, url };
}

export function contactHeaders(appName: string): Record<string, string> {
  const email = process.env.PUBLIC_API_CONTACT_EMAIL?.trim();
  return email ? { "User-Agent": `${appName}/1.0 (${email})` } : { "User-Agent": `${appName}/1.0` };
}

export function truncateText(value: unknown, max = 2_000): string | null {
  return typeof value === "string" ? value.slice(0, max) : null;
}
