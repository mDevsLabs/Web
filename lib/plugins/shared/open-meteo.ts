// Helpers partagés par les plugins qui interrogent des API publiques sans clé
// (Open-Meteo : météo et qualité de l'air). Une seule implémentation du
// géocodage, de la résolution « ville OU coordonnées » et des appels HTTP
// bornés, pour éviter que chaque plugin recopie sa propre variante.

export const PLUGIN_HTTP_TIMEOUT_MS = 8000;
const MAX_RESPONSE_BYTES = 1_000_000;
const OPEN_METEO_HOSTS = new Set([
  "geocoding-api.open-meteo.com",
  "api.open-meteo.com",
  "air-quality-api.open-meteo.com",
]);

export type GeocodedCity = {
  country: string;
  latitude: number;
  longitude: number;
  name: string;
};

export type HttpJsonResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// Appel HTTP JSON avec délai maximal : ne bloque jamais une génération et
// renvoie toujours une erreur exploitable par le modèle.
export async function fetchJson<T>(
  url: string,
  timeoutMs = PLUGIN_HTTP_TIMEOUT_MS
): Promise<HttpJsonResult<T>> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return { error: "Adresse du service invalide.", ok: false };
  }
  if (
    parsedUrl.protocol !== "https:" ||
    !OPEN_METEO_HOSTS.has(parsedUrl.hostname)
  ) {
    return { error: "Service Open-Meteo non autorisé.", ok: false };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(parsedUrl, {
      headers: { Accept: "application/json" },
      redirect: "error",
      signal: controller.signal,
    });
    if (!response.ok) {
      return {
        error: `Service indisponible (HTTP ${response.status}).`,
        ok: false,
      };
    }
    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (contentLength > MAX_RESPONSE_BYTES) {
      return { error: "Réponse trop volumineuse.", ok: false };
    }
    if (!response.body) {
      return { error: "Réponse vide ou illisible.", ok: false };
    }
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        return { error: "Réponse trop volumineuse.", ok: false };
      }
      chunks.push(chunk.value);
    }
    const body = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return { data: JSON.parse(new TextDecoder().decode(body)) as T, ok: true };
  } catch (error) {
    const aborted =
      error instanceof Error &&
      (error.name === "AbortError" || error.name === "TimeoutError");
    const redirect =
      error instanceof TypeError && /redirect/i.test(error.message);
    return {
      error: aborted
        ? `Délai d'attente dépassé (${timeoutMs / 1000}s).`
        : redirect
          ? "Redirection du service refusée."
          : "Erreur réseau ou réponse JSON invalide.",
      ok: false,
    };
  } finally {
    clearTimeout(timer);
  }
}

type GeocodeResult =
  | { city: GeocodedCity; ok: true }
  | { error: string; ok: false; reason: "not_found" | "upstream" };

export async function geocodeCity(city: string): Promise<GeocodeResult> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    city
  )}&count=1&language=fr&format=json`;
  const result = await fetchJson<{
    results?: Array<{
      country?: string;
      latitude: number;
      longitude: number;
      name: string;
    }>;
  }>(url);
  if (!result.ok) {
    return {
      error: `Géo-codeur indisponible : ${result.error}`,
      ok: false,
      reason: "upstream",
    };
  }
  const first = result.data.results?.[0];
  if (!first) {
    return {
      error: `Ville introuvable : "${city}". Vérifiez l'orthographe.`,
      ok: false,
      reason: "not_found",
    };
  }
  return {
    city: {
      country: first.country || "",
      latitude: first.latitude,
      longitude: first.longitude,
      name: first.name,
    },
    ok: true,
  };
}

export type ResolvedLocation =
  | { ok: true; latitude: number; longitude: number; label?: string }
  | { ok: false; error: string };

// Résout « ville » OU « latitude/longitude » en coordonnées : logique commune
// aux plugins météo et qualité de l'air.
export async function resolveLocation(input: {
  city?: string;
  latitude?: number;
  longitude?: number;
}): Promise<ResolvedLocation> {
  if (input.city) {
    const geocoded = await geocodeCity(input.city);
    if (!geocoded.ok) {
      return { error: geocoded.error, ok: false };
    }
    const coords = geocoded.city;
    return {
      label: `${coords.name}${coords.country ? `, ${coords.country}` : ""}`,
      latitude: coords.latitude,
      longitude: coords.longitude,
      ok: true,
    };
  }

  if (input.latitude !== undefined && input.longitude !== undefined) {
    return {
      latitude: input.latitude,
      longitude: input.longitude,
      ok: true,
    };
  }

  return {
    error:
      "Fournissez soit un nom de ville, soit des coordonnées latitude et longitude.",
    ok: false,
  };
}
