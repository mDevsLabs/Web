// Helpers partagés par les plugins qui interrogent des API publiques sans clé
// (Open-Meteo : météo et qualité de l'air). Une seule implémentation du
// géocodage, de la résolution « ville OU coordonnées » et des appels HTTP
// bornés, pour éviter que chaque plugin recopie sa propre variante.
import {
  type BoundedFetchFailureKind,
  type BoundedFetchOptions,
  boundedFetchJson,
  DEFAULT_MAX_BYTES,
} from "./bounded-fetch";

export const PLUGIN_HTTP_TIMEOUT_MS = 8000;
const MAX_RESPONSE_BYTES = DEFAULT_MAX_BYTES;
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

function describeFailure(
  failure: {
    kind: BoundedFetchFailureKind | "json";
    status?: number;
  },
  timeoutMs: number
): string {
  switch (failure.kind) {
    case "http":
      return `Service indisponible (HTTP ${failure.status ?? 0}).`;
    case "too_large":
      return "Réponse trop volumineuse.";
    case "body":
      return "Réponse vide ou illisible.";
    case "timeout":
      return `Délai d'attente dépassé (${Math.round(timeoutMs / 1000)}s).`;
    case "aborted":
      return "Requête annulée avant son terme.";
    case "redirect":
      return "Redirection du service refusée.";
    case "json":
    case "network":
      return "Erreur réseau ou réponse JSON invalide.";
  }
}

// Appel HTTP JSON avec délai maximal : ne bloque jamais une génération et
// renvoie toujours une erreur exploitable par le modèle.
export async function fetchJson<T>(
  url: string,
  timeoutMs = PLUGIN_HTTP_TIMEOUT_MS,
  options: Pick<BoundedFetchOptions, "retries" | "signal"> = {}
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

  const result = await boundedFetchJson<T>(parsedUrl, {
    ...options,
    maxBytes: MAX_RESPONSE_BYTES,
    timeoutMs,
  });
  if (!result.ok) {
    return { error: describeFailure(result, timeoutMs), ok: false };
  }
  return { data: result.data, ok: true };
}

type GeocodeResult =
  | { city: GeocodedCity; ok: true }
  | { error: string; ok: false; reason: "not_found" | "upstream" };

export async function geocodeCity(
  city: string,
  signal?: AbortSignal
): Promise<GeocodeResult> {
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
  }>(url, PLUGIN_HTTP_TIMEOUT_MS, { signal });
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
export async function resolveLocation(
  input: {
    city?: string;
    latitude?: number;
    longitude?: number;
  },
  signal?: AbortSignal
): Promise<ResolvedLocation> {
  if (input.city) {
    const geocoded = await geocodeCity(input.city, signal);
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
