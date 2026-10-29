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
 * Mapbox en lecture : géocodage et itinéraire. Le jeton voyage en paramètre
 * `access_token`, jamais dans un chemin choisi par le modèle.
 */

const descriptor = getIntegrationProvider("mapbox")!;
const BASE = "https://api.mapbox.com";

function coordinate(value: number, min: number, max: number): string | null {
  if (!Number.isFinite(value) || value < min || value > max) {
    return null;
  }
  return value.toFixed(6);
}

async function mapbox(
  deps: PluginToolDeps,
  path: string,
  query?: Record<string, string | number | undefined>
) {
  const cred = await loadCredential(deps, "mapbox");
  if (!cred.ok) {
    return cred;
  }
  return callProvider({
    auth: { kind: "query", name: "access_token" },
    base: BASE,
    descriptor,
    path,
    query,
    signal: deps.signal,
    token: cred.data.token,
  });
}

function shapeFeature(row: Record<string, unknown>) {
  const properties = asRecord(row.properties);
  const geometry = asRecord(row.geometry);
  const coordinates = Array.isArray(geometry?.coordinates)
    ? geometry.coordinates
    : [];
  return {
    latitude: typeof coordinates[1] === "number" ? coordinates[1] : null,
    longitude: typeof coordinates[0] === "number" ? coordinates[0] : null,
    name: textField(properties?.name ?? properties?.full_address, 180),
    place: textField(properties?.place_formatted, 180),
  };
}

function mapboxGeocode(deps: PluginToolDeps) {
  return tool({
    description: "Transforme une adresse ou un lieu en coordonnées Mapbox.",
    execute: async ({ limit, query }) => {
      const result = await mapbox(deps, "/search/geocode/v6/forward", {
        limit,
        q: query,
      });
      if (!result.ok) {
        return { error: result.error };
      }
      const features = jsonRecords(result.data, "features")
        .slice(0, limit)
        .map(shapeFeature);
      return {
        features,
        source: sourceRef(
          `${BASE}/search/geocode/v6/forward`,
          "Géocodage Mapbox"
        ),
        total: features.length,
      };
    },
    inputSchema: z.object({
      limit: z.number().int().min(1).max(5).default(3),
      query: z.string().trim().min(1).max(160),
    }),
  });
}

function mapboxReverseGeocode(deps: PluginToolDeps) {
  return tool({
    description: "Transforme des coordonnées en lieu Mapbox.",
    execute: async ({ latitude, longitude }) => {
      const result = await mapbox(deps, "/search/geocode/v6/reverse", {
        latitude,
        longitude,
      });
      if (!result.ok) {
        return { error: result.error };
      }
      const features = jsonRecords(result.data, "features")
        .slice(0, 3)
        .map(shapeFeature);
      return {
        features,
        source: sourceRef(
          `${BASE}/search/geocode/v6/reverse`,
          "Géocodage inverse Mapbox"
        ),
        total: features.length,
      };
    },
    inputSchema: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    }),
  });
}

function mapboxDirections(deps: PluginToolDeps) {
  return tool({
    description: "Itinéraire routier Mapbox entre deux points.",
    execute: async ({
      fromLatitude,
      fromLongitude,
      toLatitude,
      toLongitude,
    }) => {
      const fromLon = coordinate(fromLongitude, -180, 180);
      const fromLat = coordinate(fromLatitude, -90, 90);
      const toLon = coordinate(toLongitude, -180, 180);
      const toLat = coordinate(toLatitude, -90, 90);
      if (!fromLon || !fromLat || !toLon || !toLat) {
        return { error: "Coordonnées hors limites." };
      }
      const result = await mapbox(
        deps,
        `/directions/v5/mapbox/driving/${fromLon},${fromLat};${toLon},${toLat}`
      );
      if (!result.ok) {
        return { error: result.error };
      }
      const route = jsonRecords(result.data, "routes")[0];
      return {
        distanceMeters:
          typeof route?.distance === "number" ? route.distance : null,
        durationSeconds:
          typeof route?.duration === "number" ? route.duration : null,
        source: sourceRef(
          `${BASE}/directions/v5/mapbox/driving`,
          "Itinéraire Mapbox"
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

export const mapboxPlugin: PluginDefinition = {
  createTools: (deps) => ({
    mapboxDirections: mapboxDirections(deps),
    mapboxGeocode: mapboxGeocode(deps),
    mapboxReverseGeocode: mapboxReverseGeocode(deps),
  }),
  manifest: manifest as PluginManifest,
};
