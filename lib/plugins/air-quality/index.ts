import { tool } from "ai";
import { z } from "zod";
import { fetchJson, resolveLocation } from "../shared/open-meteo";
import type { PluginDefinition, PluginManifest } from "../types";
import manifest from "./index.json";

// Indice européen de qualité de l'air (EEA) : seuils officiels sur 0-100.
const EUROPEAN_AQI_LEVELS: Array<{ max: number; label: string }> = [
  { label: "Bon", max: 20 },
  { label: "Correct", max: 40 },
  { label: "Moyen", max: 60 },
  { label: "Mauvais", max: 80 },
  { label: "Très mauvais", max: 100 },
];

function describeEuropeanAqi(value: number | undefined): string | undefined {
  if (typeof value !== "number") {
    return;
  }
  const level = EUROPEAN_AQI_LEVELS.find((candidate) => value <= candidate.max);
  return level?.label ?? "Extrêmement mauvais";
}

const POLLEN_FIELDS = [
  "alder_pollen",
  "birch_pollen",
  "grass_pollen",
  "mugwort_pollen",
  "olive_pollen",
  "ragweed_pollen",
] as const;

const AIR_QUALITY_CURRENT_FIELDS = [
  "european_aqi",
  "us_aqi",
  "pm10",
  "pm2_5",
  "carbon_monoxide",
  "nitrogen_dioxide",
  "sulphur_dioxide",
  "ozone",
];

const AIR_QUALITY_HOURLY_FIELDS = [
  "pm10",
  "pm2_5",
  "ozone",
  "nitrogen_dioxide",
  ...POLLEN_FIELDS,
];

type AirQualityResponse = {
  current?: Record<string, number | undefined> & { aqiLevel?: string };
  current_units?: Record<string, string>;
  hourly?: Record<string, Array<number | null> | undefined>;
  locationName?: string;
};

const airQualityResponseSchema = z
  .object({
    current: z.record(z.string(), z.number()).optional(),
    current_units: z.record(z.string(), z.string()).optional(),
    hourly: z
      .object({
        time: z.array(z.string()).optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export const getAirQuality = tool({
  description:
    "Obtenir l'indice de qualité de l'air (indice européen et américain), les polluants (PM10, PM2.5, O3, NO2, SO2, CO) et les concentrations de pollen d'une ville ou de coordonnées, avec prévisions horaires. Fournit une interprétation lisible du niveau de pollution.",
  execute: async (input) => {
    const location = await resolveLocation(input);
    if (!location.ok) {
      return { error: location.error };
    }

    const hours = Math.min(Math.max(input.hours ?? 24, 1), 72);
    const includePollen = input.includePollen !== false;
    const forecastDays = Math.min(Math.ceil(hours / 24) + 1, 5);

    const url = new URL(
      "https://air-quality-api.open-meteo.com/v1/air-quality"
    );
    url.searchParams.set("latitude", String(location.latitude));
    url.searchParams.set("longitude", String(location.longitude));
    url.searchParams.set("current", AIR_QUALITY_CURRENT_FIELDS.join(","));
    url.searchParams.set(
      "hourly",
      includePollen
        ? [...AIR_QUALITY_HOURLY_FIELDS, "temperature_2m"].join(",")
        : AIR_QUALITY_HOURLY_FIELDS.filter(
            (field) => !field.endsWith("_pollen")
          ).join(",")
    );
    url.searchParams.set("timezone", "auto");
    url.searchParams.set("forecast_days", String(forecastDays));

    const result = await fetchJson<AirQualityResponse>(url.toString());
    if (!result.ok) {
      return { error: `Qualité de l'air indisponible : ${result.error}` };
    }

    const parsedResponse = airQualityResponseSchema.safeParse(result.data);
    if (!parsedResponse.success) {
      return { error: "Réponse de qualité de l'air invalide." };
    }
    const data = parsedResponse.data as AirQualityResponse;
    const current = data.current ?? {};
    const aqiLevel = describeEuropeanAqi(current.european_aqi);

    // Résultat borné : uniquement les `hours` premières échéances horaires, pas
    // le dump complet renvoyé par l'API.
    const hourlySource = data.hourly ?? {};
    const timeIndex = (hourlySource.time ?? []) as Array<string | null>;
    const hourlyKeys = Object.keys(hourlySource).filter(
      (key) => key !== "time"
    );
    const hourly = hourlyKeys.map((key) => ({
      field: key,
      values: (hourlySource[key] ?? []).slice(0, hours),
    }));

    return {
      current: {
        ...current,
        ...(aqiLevel ? { aqiLevel } : {}),
      },
      currentUnits: data.current_units ?? {},
      hourly,
      hours,
      ...(location.label ? { locationName: location.label } : {}),
      time: timeIndex.slice(0, hours),
      timezone: "auto",
      units: {
        aqi: "indice européen 0-100",
        pollen: "grains/m³ (Europe uniquement)",
        pollutants: "µg/m³",
      },
    };
  },
  inputSchema: z.object({
    city: z
      .string()
      .min(1)
      .max(120)
      .optional()
      .describe("Nom de la ville (ex: 'Paris', 'Lyon', 'Berlin')"),
    hours: z
      .number()
      .int()
      .min(1)
      .max(72)
      .optional()
      .describe("Durée des prévisions horaires en heures (1-72, défaut 24)"),
    includePollen: z
      .boolean()
      .optional()
      .describe(
        "Inclure les concentrations de pollen (l'API ne les fournit qu'en Europe, défaut true)"
      ),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  }),
});

export const airQualityPlugin: PluginDefinition = {
  createTools: () => ({ getAirQuality }),
  manifest: manifest as PluginManifest,
};
