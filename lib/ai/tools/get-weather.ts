import { tool } from "ai";
import { z } from "zod";

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

async function geocodeCity(city: string): Promise<{
  country: string;
  latitude: number;
  longitude: number;
  name: string;
} | null> {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      city
    )}&count=1&language=fr&format=json`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      results?: Array<{
        country?: string;
        latitude: number;
        longitude: number;
        name: string;
      }>;
    };

    if (!data.results || data.results.length === 0) {
      return null;
    }

    const [result] = data.results;
    return {
      country: result.country || "",
      latitude: result.latitude,
      longitude: result.longitude,
      name: result.name,
    };
  } catch {
    return null;
  }
}

function describeCode(code: number): string {
  return WEATHER_DESCRIPTION[code] || `Code météo ${code}`;
}

export const getWeather = tool({
  description:
    "Obtenir la météo actuelle et/ou les prévisions d'une ville ou de coordonnées géographiques. Supporte Celsius/Fahrenheit, prévisions jusqu'à 7 jours. Fournit température, conditions, vent, humidité, lever/coucher du soleil.",
  execute: async (input) => {
    let latitude: number;
    let longitude: number;
    let locationName: string | undefined;

    if (input.city) {
      const coords = await geocodeCity(input.city);
      if (!coords) {
        return {
          error: `Ville introuvable : "${input.city}". Vérifiez l'orthographe.`,
        };
      }
      latitude = coords.latitude;
      longitude = coords.longitude;
      locationName = `${coords.name}${coords.country ? `, ${coords.country}` : ""}`;
    } else if (input.latitude !== undefined && input.longitude !== undefined) {
      latitude = input.latitude;
      longitude = input.longitude;
    } else {
      return {
        error:
          "Fournissez soit un nom de ville, soit des coordonnées latitude et longitude.",
      };
    }

    const unit = input.units === "fahrenheit" ? "fahrenheit" : "celsius";
    const tempUnit = unit === "fahrenheit" ? "°F" : "°C";
    const forecastDays = Math.min(Math.max(input.forecastDays ?? 1, 1), 7);

    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(latitude));
    url.searchParams.set("longitude", String(longitude));
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

    let weatherData: any;
    try {
      const response = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        return {
          error: `Service météo indisponible (HTTP ${response.status}).`,
        };
      }
      weatherData = await response.json();
    } catch (e: any) {
      return { error: `Erreur réseau météo : ${e?.message || "inconnue"}` };
    }

    if (locationName) {
      weatherData.locationName = locationName;
    }
    weatherData.units = {
      temperature: tempUnit,
      wind: "km/h",
    };

    if (weatherData.current?.weather_code !== undefined) {
      weatherData.current.description = describeCode(
        weatherData.current.weather_code
      );
    }

    if (Array.isArray(weatherData.daily?.weather_code)) {
      weatherData.daily.descriptions = weatherData.daily.weather_code.map(
        (c: number) => describeCode(c)
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
