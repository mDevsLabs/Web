// Helpers partagés par les plugins qui interrogent des API publiques sans clé
// (Open-Meteo : météo et qualité de l'air). Une seule implémentation du
// géocodage, de la résolution « ville OU coordonnées » et des appels HTTP
// bornés, pour éviter que chaque plugin recopie sa propre variante.

export const PLUGIN_HTTP_TIMEOUT_MS = 8000;

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
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) {
      return {
        error: `Service indisponible (HTTP ${response.status}).`,
        ok: false,
      };
    }
    return { data: (await response.json()) as T, ok: true };
  } catch (error) {
    const aborted =
      error instanceof Error &&
      (error.name === "AbortError" || error.name === "TimeoutError");
    return {
      error: aborted
        ? `Délai d'attente dépassé (${timeoutMs / 1000}s).`
        : "Erreur réseau lors de l'appel du service.",
      ok: false,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function geocodeCity(city: string): Promise<GeocodedCity | null> {
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
    return null;
  }
  const first = result.data.results?.[0];
  if (!first) {
    return null;
  }
  return {
    country: first.country || "",
    latitude: first.latitude,
    longitude: first.longitude,
    name: first.name,
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
    const coords = await geocodeCity(input.city);
    if (!coords) {
      return {
        error: `Ville introuvable : "${input.city}". Vérifiez l'orthographe.`,
        ok: false,
      };
    }
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
