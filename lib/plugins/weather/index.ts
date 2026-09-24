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

export const getWeather = tool({
  description:
    "Obtenir la météo actuelle et/ou les prévisions d'une ville ou de coordonnées géographiques. Supporte Celsius/Fahrenheit, prévisions jusqu'à 7 jours. Fournit température, conditions, vent, humidité, lever/coucher du soleil.",
  execute: async (input) => {
    const location = await resolveLocation(input);
    if (!location.ok) {
      return { error: location.error };
    }

    const unit = input.units === "fahrenheit" ? "fahrenheit" : "celsius";
    const tempUnit = unit === "fahrenheit" ? "°F" : "°C";
    const forecastDays = Math.min(Math.max(input.forecastDays ?? 1, 1), 7);

    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(location.latitude));
    url.searchParams.set("longitude", String(location.longitude));
    url.searchParams.set(
      "current",
      "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,apparent_temperature"
    );
    url.searchParams.set(
      "hourly",
      "temperature_2m,weather_code,precipitation_probability"
    );
    url.searchParams.set(
      "daily",
      "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,wind_speed_10m_max"
    );
    url.searchParams.set("timezone", "auto");
    url.searchParams.set("temperature_unit", unit);
    url.searchParams.set("wind_speed_unit", "kmh");
    url.searchParams.set("forecast_days", String(forecastDays));

    const result = await fetchJson<OpenMeteoForecast>(url.toString());
    if (!result.ok) {
      return { error: `Météo indisponible : ${result.error}` };
    }

    const parsedForecast = openMeteoForecastSchema.safeParse(result.data);
    if (!parsedForecast.success) {
      return { error: "Réponse météo invalide." };
    }
    const weatherData = parsedForecast.data as OpenMeteoForecast;
    if (location.label) {
      weatherData.cityName = location.label;
    }
    weatherData.units = { temperature: tempUnit, wind: "km/h" };

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

    return weatherData;
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
    units: z
      .enum(["celsius", "fahrenheit"])
      .optional()
      .describe("Unité de température (défaut celsius)"),
  }),
});

export const weatherPlugin: PluginDefinition = {
  createTools: () => ({ getWeather }),
  manifest: manifest as PluginManifest,
};
