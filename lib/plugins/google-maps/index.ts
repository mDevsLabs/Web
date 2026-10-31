import { tool } from "ai";
import { z } from "zod";
import { getIntegrationProvider } from "@/lib/integrations/providers";
import {
  asRecord,
  callProvider,
  jsonRecords,
  loadCredential,
  textField,
} from "../shared/bearer-read";
import { sourceRef } from "../shared/public-api";
import type {
  PluginDefinition,
  PluginManifest,
  PluginToolDeps,
} from "../types";
import manifest from "./index.json";

/**
 * Google Maps en lecture. La clé voyage en paramètre `key`, jamais dans un
 * chemin choisi par le modèle. L'API répond souvent HTTP 200 même quand la
 * clé est refusée : le champ `status` tranche.
 */

const descriptor = getIntegrationProvider("google-maps")!;
const BASE = "https://maps.googleapis.com";

function mapsStatus(payload: unknown): string | null {
  const record = asRecord(payload);
  return typeof record?.status === "string" ? record.status : null;
}

function mapsFailure(payload: unknown): string | null {
  const status = mapsStatus(payload);
  if (!status || status === "OK" || status === "ZERO_RESULTS") {
    return null;
  }
  const message = textField(asRecord(payload)?.error_message, 240);
  return message ?? `Google Maps a répondu ${status}.`;
}

async function maps(
  deps: PluginToolDeps,
  path: string,
  query?: Record<string, string | number | undefined>
) {
  const cred = await loadCredential(deps, "google-maps");
  if (!cred.ok) {
    return cred;
  }
  const result = await callProvider({
    auth: { kind: "query", name: "key" },
    base: BASE,
    descriptor,
    path,
    query,
    signal: deps.signal,
    token: cred.data.token,
  });
  if (!result.ok) {
    return result;
  }
  const failure = mapsFailure(result.data);
  if (failure) {
    return { error: failure, ok: false as const };
  }
  return result;
}

function placeOf(row: Record<string, unknown>) {
  const geometry = asRecord(row.geometry);
  const location = asRecord(geometry?.location);
  return {
    address: textField(row.formatted_address, 240),
    latitude: typeof location?.lat === "number" ? location.lat : null,
    longitude: typeof location?.lng === "number" ? location.lng : null,
    name: textField(row.name, 180),
    placeId: textField(row.place_id, 180),
  };
}

function mapsGeocode(deps: PluginToolDeps) {
  return tool({
    description: "Transforme une adresse ou un lieu en coordonnées Google Maps.",
    execute: async ({ limit, query }) => {
      const result = await maps(deps, "/maps/api/geocode/json", {
        address: query,
      });
      if (!result.ok) {
        return { error: result.error };
      }
      const places = jsonRecords(result.data, "results")
        .slice(0, limit)
        .map(placeOf);
      return {
        places,
        source: sourceRef(`${BASE}/maps/api/geocode/json`, "Géocodage Google Maps"),
        total: places.length,
      };
    },
    inputSchema: z.object({
      limit: z.number().int().min(1).max(5).default(3),
      query: z.string().trim().min(1).max(160),
    }),
  });
}

function mapsReverseGeocode(deps: PluginToolDeps) {
  return tool({
    description: "Transforme des coordonnées en adresse Google Maps.",
    execute: async ({ latitude, longitude }) => {
      const result = await maps(deps, "/maps/api/geocode/json", {
        latlng: `${latitude.toFixed(6)},${longitude.toFixed(6)}`,
      });
      if (!result.ok) {
        return { error: result.error };
      }
      const places = jsonRecords(result.data, "results").slice(0, 3).map(placeOf);
      return {
        places,
        source: sourceRef(
          `${BASE}/maps/api/geocode/json`,
          "Géocodage inverse Google Maps"
        ),
        total: places.length,
      };
    },
    inputSchema: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    }),
  });
}

function mapsSearchPlaces(deps: PluginToolDeps) {
  return tool({
    description: "Recherche de lieux Google Maps à partir d'un texte.",
    execute: async ({ limit, query }) => {
      const result = await maps(deps, "/maps/api/place/textsearch/json", {
        query,
      });
      if (!result.ok) {
        return { error: result.error };
      }
      const places = jsonRecords(result.data, "results")
        .slice(0, limit)
        .map(placeOf);
      return {
        places,
        source: sourceRef(
          `${BASE}/maps/api/place/textsearch/json`,
          "Recherche de lieux Google Maps"
        ),
        total: places.length,
      };
    },
    inputSchema: z.object({
      limit: z.number().int().min(1).max(5).default(3),
      query: z.string().trim().min(1).max(160),
    }),
  });
}

function mapsDirections(deps: PluginToolDeps) {
  return tool({
    description: "Itinéraire routier Google Maps entre deux points.",
    execute: async ({
      fromLatitude,
      fromLongitude,
      toLatitude,
      toLongitude,
    }) => {
      const result = await maps(deps, "/maps/api/directions/json", {
        destination: `${toLatitude.toFixed(6)},${toLongitude.toFixed(6)}`,
        mode: "driving",
        origin: `${fromLatitude.toFixed(6)},${fromLongitude.toFixed(6)}`,
      });
      if (!result.ok) {
        return { error: result.error };
      }
      const route = jsonRecords(result.data, "routes")[0];
      const leg = jsonRecords(route, "legs")[0];
      const distance = asRecord(leg?.distance);
      const duration = asRecord(leg?.duration);
      return {
        distanceMeters:
          typeof distance?.value === "number" ? distance.value : null,
        durationSeconds:
          typeof duration?.value === "number" ? duration.value : null,
        endAddress: textField(leg?.end_address, 240),
        startAddress: textField(leg?.start_address, 240),
        summary: textField(route?.summary, 180),
        source: sourceRef(
          `${BASE}/maps/api/directions/json`,
          "Itinéraire Google Maps"
        ),
      };
    },
    inputSchema: z.object({
      fromLatitude: z.number().min(-90).max(90),
      fromLongitude: z.number().min(-180).max(180),
      toLatitude: z.number().min(-90).max(90),
      toLongitude: z.number().min(-180).max(180),
    }),
  });
}

export const googleMapsPlugin: PluginDefinition = {
  createTools: (deps) => ({
    mapsDirections: mapsDirections(deps),
    mapsGeocode: mapsGeocode(deps),
    mapsReverseGeocode: mapsReverseGeocode(deps),
    mapsSearchPlaces: mapsSearchPlaces(deps),
  }),
  manifest: manifest as PluginManifest,
};
