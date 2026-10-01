import { tool } from "ai";
import { z } from "zod";
import { fetchJson, resolveLocation } from "../shared/open-meteo";
import type { PluginDefinition, PluginManifest } from "../types";
import manifest from "./index.json";

const WEATHER_DESCRIPTION: Record<number, string> = {
  0: "Ciel dégagé",
  1: "Principalement dégagé",
  2: "Partiellement nuageux",
  3: "Couvert",
  45: "Brouillard",
  48: "Brouillard givrant",
  51: "Bruine légère",
  53: "Bruine modérée",
  55: "Bruine dense",
  56: "Bruine verglaçante légère",
  57: "Bruine verglaçante dense",
  61: "Pluie légère",
  63: "Pluie modérée",
  65: "Pluie forte",
  66: "Pluie verglaçante légère",
  67: "Pluie verglaçante forte",
  71: "Chute de neige légère",
  73: "Chute de neige modérée",
  75: "Chute de neige forte",
  77: "Grains de neige",
  80: "Averses de pluie légères",
  81: "Averses de pluie modérées",
  82: "Averses de pluie violentes",
  85: "Averses de neige légères",
  86: "Averses de neige fortes",
  95: "Orage",
  96: "Orage avec grêle légère",
  99: "Orage avec grêle forte",
};

function describeCode(code: number): string {
  return WEATHER_DESCRIPTION[code] || `Code météo ${code}`;
}

const WIND_UNITS = ["kmh", "ms", "mph", "kn"] as const;
type WindUnit = (typeof WIND_UNITS)[number];

const WIND_UNIT_LABELS: Record<WindUnit, string> = {
  kmh: "km/h",
  kn: "nœuds",
  mph: "mph",
  ms: "m/s",
};

const MAX_COMPARE_CITIES = 5;

// Réponse Open-Meteo telle que renvoyée par l'API (et transmise telle quelle au
// modèle, enrichie des libellés de conditions et du nom de lieu). Le type
// reprend les champs consommés par la carte météo du chat.
type OpenMeteoForecast = {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current_units: {
    time: string;
    interval: string;
    temperature_2m: string;
    [key: string]: unknown;
  };
  current: {
    time: string;
    interval: number;
    temperature_2m: number;
    apparent_temperature?: number;
    is_day?: number;
    precipitation?: number;
    relative_humidity_2m?: number;
    weather_code?: number;
    wind_direction_10m?: number;
    wind_speed_10m?: number;
    description?: string;
    [key: string]: unknown;
  };
  hourly_units: {
    time: string;
    temperature_2m: string;
    [key: string]: unknown;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability?: number[];
    [key: string]: unknown;
  };
  daily_units: {
    time: string;
    sunrise: string;
    sunset: string;
    [key: string]: unknown;
  };
  daily: {
    time: string[];
    sunrise: string[];
    sunset: string[];
    descriptions?: string[];
    precipitation_sum?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    weather_code?: number[];
    wind_speed_10m_max?: number[];
    [key: string]: unknown;
  };
  cityName?: string;
  units?: { temperature: string; wind: string };
};

const openMeteoForecastSchema = z
  .object({
    current: z
      .object({
        interval: z.number(),
        temperature_2m: z.number(),
        time: z.string(),
      })
      .passthrough(),
    daily: z
      .object({
        sunrise: z.array(z.string()),
        sunset: z.array(z.string()),
        time: z.array(z.string()),
      })
      .passthrough(),
    hourly: z
      .object({
        temperature_2m: z.array(z.number()),
        time: z.array(z.string()),
      })
      .passthrough(),
    latitude: z.number(),
    longitude: z.number(),
  })
  .passthrough();

type ForecastRequest = {
  forecastDays: number;
  pastDays: number;
  temperatureUnit: "celsius" | "fahrenheit";
  windSpeedUnit: WindUnit;
};

function normalizeWindUnit(value: unknown): WindUnit {
  return WIND_UNITS.includes(value as WindUnit) ? (value as WindUnit) : "kmh";
}

function buildForecastUrl(
  location: { latitude: number; longitude: number },
  request: ForecastRequest
): string {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(location.latitude));
  url.searchParams.set("longitude", String(location.longitude));
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,apparent_temperature,is_day,precipitation"
  );
  url.searchParams.set(
    "hourly",
    "temperature_2m,weather_code,precipitation_probability"
  );
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max"
  );
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("temperature_unit", request.temperatureUnit);
  url.searchParams.set("wind_speed_unit", request.windSpeedUnit);
  url.searchParams.set("forecast_days", String(request.forecastDays));
  if (request.pastDays > 0) {
    url.searchParams.set("past_days", String(request.pastDays));
  }
  return url.toString();
}

// Phrase unique et citée : le modèle la recopie telle quelle dans une réponse
// conversationnelle, elle doit donc se lire sans le tableau de chiffres.
function buildSummary(
  data: OpenMeteoForecast,
  cityName: string | undefined,
  temperatureUnit: "celsius" | "fahrenheit"
): string {
  const parts: string[] = [];
  const temperature = data.current.temperature_2m;
  const description =
    data.current.description ?? describeCode(data.current.weather_code ?? -1);
  const place = cityName ?? "la localité demandée";
  if (Number.isFinite(temperature)) {
    parts.push(
      `${Math.round(temperature)} °${temperatureUnit === "fahrenheit" ? "F" : "C"}`
    );
  }
  if (description && !description.startsWith("Code météo")) {
    parts.push(description.toLowerCase());
  }
  const wind = data.current.wind_speed_10m;
  if (typeof wind === "number") {
    parts.push(`vent ${Math.round(wind)} ${data.units?.wind ?? "km/h"}`);
  }
  const humidity = data.current.relative_humidity_2m;
  if (typeof humidity === "number") {
    parts.push(`humidité ${Math.round(humidity)} %`);
  }
  if (parts.length === 0) {
    return `Aucune donnée exploitable pour ${place}.`;
  }
  return `À ${place} : ${parts.join(", ")}.`;
}

async function fetchForecast(
  location: { latitude: number; longitude: number; label?: string },
  request: ForecastRequest
): Promise<
  { data: OpenMeteoForecast; url: string } | { error: string; url: string }
> {
  const url = buildForecastUrl(location, request);
  const result = await fetchJson<OpenMeteoForecast>(url);
  if (!result.ok) {
    return { error: `Météo indisponible : ${result.error}`, url };
  }

  const parsedForecast = openMeteoForecastSchema.safeParse(result.data);
  if (!parsedForecast.success) {
    return { error: "Réponse météo invalide.", url };
  }
  const weatherData = parsedForecast.data as OpenMeteoForecast;
  if (location.label) {
    weatherData.cityName = location.label;
  }
  weatherData.units = {
    temperature: request.temperatureUnit === "fahrenheit" ? "°F" : "°C",
    wind: WIND_UNIT_LABELS[request.windSpeedUnit],
  };

  if (weatherData.current.weather_code !== undefined) {
    weatherData.current.description = describeCode(
      weatherData.current.weather_code
    );
  }

  if (Array.isArray(weatherData.daily.weather_code)) {
    weatherData.daily.descriptions = weatherData.daily.weather_code.map(
      (code: number) => describeCode(code)
    );
  }

  return { data: weatherData, url };
}

export const getWeather = tool({
  description:
    "Obtenir la météo actuelle et/ou les prévisions d'une ville ou de coordonnées géographiques. Supporte Celsius/Fahrenheit, unités de vent (km/h, m/s, mph, nœuds), historique jusqu'à 92 jours et prévisions jusqu'à 7 jours. Fournit température, conditions, vent, humidité, lever/coucher du soleil et un résumé en une phrase.",
  execute: async (input) => {
    const location = await resolveLocation(input);
    if (!location.ok) {
      return { error: location.error };
    }

    const request: ForecastRequest = {
      forecastDays: Math.min(Math.max(input.forecastDays ?? 1, 1), 7),
      pastDays: Math.min(Math.max(input.pastDays ?? 0, 0), 92),
      temperatureUnit: input.units === "fahrenheit" ? "fahrenheit" : "celsius",
      windSpeedUnit: normalizeWindUnit(input.windSpeedUnit),
    };

    const result = await fetchForecast(location, request);
    if ("error" in result) {
      return { error: result.error };
    }

    const weatherData = result.data;
    // Lever/coucher du jour remontés dans `current` : c'est la question la
    // plus fréquente et elle ne doit pas obliger à fouiller `daily`.
    const currentWithSun = {
      ...weatherData.current,
      ...(weatherData.daily.time[0]
        ? {
            sunrise: weatherData.daily.sunrise[0] ?? null,
            sunset: weatherData.daily.sunset[0] ?? null,
          }
        : {}),
    };

    return {
      ...weatherData,
      current: currentWithSun,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        name: location.label ?? null,
      },
      source: { title: "Open-Meteo", url: result.url },
      summary: buildSummary(
        { ...weatherData, current: currentWithSun },
        location.label,
        request.temperatureUnit
      ),
    };
  },
  inputSchema: z.object({
    city: z
      .string()
      .min(1)
      .max(120)
      .optional()
      .describe("Nom de la ville (ex: 'Paris', 'New York', 'Tokyo')"),
    forecastDays: z
      .number()
      .int()
      .min(1)
      .max(7)
      .optional()
      .describe("Nombre de jours de prévisions (1-7, défaut 1 = aujourd'hui)"),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    pastDays: z
      .number()
      .int()
      .min(0)
      .max(92)
      .optional()
      .describe(
        "Nombre de jours d'historique à inclure avant aujourd'hui (0-92, défaut 0)"
      ),
    units: z
      .enum(["celsius", "fahrenheit"])
      .optional()
      .describe("Unité de température (défaut celsius)"),
    windSpeedUnit: z
      .enum(WIND_UNITS)
      .optional()
      .describe("Unité du vent (défaut kmh)"),
  }),
});

type CityObservation = {
  city: string;
  conditions: string | null;
  feelsLike: number | null;
  humidity: number | null;
  isDay: boolean;
  name: string;
  temperature: number;
  windSpeed: number | null;
};

export const compareWeather = tool({
  description:
    "Comparer la météo actuelle de deux à cinq villes en un seul appel : températures, conditions, vent et humidité, avec le classement et l'écart entre la plus chaude et la plus froide.",
  execute: async (input) => {
    const cities = [
      ...new Set(input.cities.map((city) => city.trim()).filter(Boolean)),
    ];
    if (cities.length < 2) {
      return {
        error:
          "Indiquez au moins deux villes distinctes à comparer, idéalement « Ville, pays ».",
      };
    }

    const temperatureUnit =
      input.units === "fahrenheit" ? "fahrenheit" : "celsius";
    const request: ForecastRequest = {
      forecastDays: 1,
      pastDays: 0,
      temperatureUnit,
      windSpeedUnit: normalizeWindUnit(input.windSpeedUnit),
    };

    const located = await Promise.all(
      cities.map(async (city) => ({
        city,
        location: await resolveLocation({ city }),
      }))
    );

    const observations = await Promise.all(
      located.map(
        async ({
          city,
          location,
        }): Promise<CityObservation | { city: string; error: string }> => {
          if (!location.ok) {
            return { city, error: location.error };
          }
          const result = await fetchForecast(location, request);
          if ("error" in result) {
            return { city, error: result.error };
          }
          const current = result.data.current;
          return {
            city,
            conditions: current.description ?? null,
            feelsLike:
              typeof current.apparent_temperature === "number"
                ? current.apparent_temperature
                : null,
            humidity:
              typeof current.relative_humidity_2m === "number"
                ? current.relative_humidity_2m
                : null,
            isDay: current.is_day === 1,
            name: location.label ?? city,
            temperature: current.temperature_2m,
            windSpeed:
              typeof current.wind_speed_10m === "number"
                ? current.wind_speed_10m
                : null,
          };
        }
      )
    );

    const available = observations.filter(
      (entry): entry is CityObservation => !("error" in entry)
    );
    const byWarmest = [...available].sort(
      (left, right) => right.temperature - left.temperature
    );
    const byWindy = [...available].sort(
      (left, right) => (right.windSpeed ?? -1) - (left.windSpeed ?? -1)
    );
    const temperatures = available.map((entry) => entry.temperature);
    const spread =
      temperatures.length >= 2
        ? Number(
            (Math.max(...temperatures) - Math.min(...temperatures)).toFixed(1)
          )
        : null;

    return {
      cities: observations,
      compared: available.length,
      failed: observations.length - available.length,
      ranking: {
        coldest: byWarmest.at(-1)?.name ?? null,
        mostWindy: byWindy[0]?.name ?? null,
        warmest: byWarmest[0]?.name ?? null,
      },
      source: { title: "Open-Meteo", url: "https://open-meteo.com" },
      temperatureSpread: spread,
      units: {
        temperature: temperatureUnit === "fahrenheit" ? "°F" : "°C",
        wind: WIND_UNIT_LABELS[request.windSpeedUnit],
      },
    };
  },
  inputSchema: z.object({
    cities: z
      .array(z.string().min(1).max(120))
      .min(2)
      .max(MAX_COMPARE_CITIES)
      .describe(
        "Deux à cinq villes à comparer, idéalement « Ville, pays » pour lever l'ambiguïté"
      ),
    units: z
      .enum(["celsius", "fahrenheit"])
      .optional()
      .describe("Unité de température (défaut celsius)"),
    windSpeedUnit: z
      .enum(WIND_UNITS)
      .optional()
      .describe("Unité du vent (défaut kmh)"),
  }),
});

export const weatherPlugin: PluginDefinition = {
  createTools: () => ({ compareWeather, getWeather }),
  manifest: manifest as PluginManifest,
};
