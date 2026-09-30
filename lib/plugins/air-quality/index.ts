import { tool } from "ai";
import { z } from "zod";
import { fetchJson, resolveLocation } from "../shared/open-meteo";
import type { PluginDefinition, PluginManifest } from "../types";
import manifest from "./index.json";

// Indice européen de qualité de l'air (EEA) : seuils officiels sur 0-100, et
// pour chaque palier la conduite à tenir. Sans ce texte, le modèle se contente
// de recopier « Mauvais » sans jamais dire ce que la personne doit en faire.
const EUROPEAN_AQI_LEVELS: Array<{
  advice: string;
  label: string;
  max: number;
  sport: string;
}> = [
  {
    advice:
      "Aucune précaution particulière : l'air est bon pour tous, y compris pour les enfants et les personnes asthmatiques.",
    label: "Bon",
    max: 20,
    sport: "Activité physique en extérieur sans restriction.",
  },
  {
    advice:
      "L'air est acceptable. Les personnes particulièrement sensibles peuvent réduire les efforts physiques soutenus en extérieur.",
    label: "Correct",
    max: 40,
    sport: "Activité physique en extérieur sans restriction.",
  },
  {
    advice:
      "Des symptômes (nez irrité, gêne respiratoire) sont possibles chez les personnes sensibles : limitez l'effort intense en extérieur aux heures les plus chargées.",
    label: "Moyen",
    max: 60,
    sport:
      "Privilégiez l'intérieur ou le matin tôt ; efforts modérés uniquement.",
  },
  {
    advice:
      "Évitez l'effort physique prolongé en extérieur. Les groupes sensibles (asthme, allergies, maladies cardiovasculaires) doivent rester à l'intérieur si possible.",
    label: "Mauvais",
    max: 80,
    sport: "Sport en intérieur ; marche courte avec masque si indispensable.",
  },
  {
    advice:
      "Restez à l'intérieur et aérez brièvement aux heures où la pollution est la plus basse. Un avis médical est recommandé aux personnes sensibles.",
    label: "Très mauvais",
    max: 100,
    sport: "Pas d'activité physique en extérieur.",
  },
  {
    advice:
      "Épisode de pollution sévère : restez dans un espace clos, filtrez l'air si vous en disposez et évitez tout effort extérieur.",
    label: "Extrêmement mauvais",
    max: Number.POSITIVE_INFINITY,
    sport:
      "Aucune activité en extérieur ; suivez les alertes des autorités sanitaires.",
  },
];

// Lignes directrices 2021 de l'OMS sur la qualité de l'air, en µg/m³ (24 h pour
// les particules et le NO2, 8 h pour l'ozone). Elles servent à nommer le
// polluant dominant : l'indice européen renvoie le maximum des sous-indices
// sans dire lequel, ce qui laisse le modèle deviner.
const WHO_2021_GUIDELINES: Record<string, number> = {
  carbon_monoxide: 4000,
  nitrogen_dioxide: 25,
  ozone: 100,
  pm2_5: 15,
  pm10: 45,
  sulphur_dioxide: 40,
};

const POLLUTANT_LABELS: Record<string, string> = {
  carbon_monoxide: "Monoxyde de carbone (CO)",
  nitrogen_dioxide: "Dioxyde d'azote (NO2)",
  ozone: "Ozone (O3)",
  pm2_5: "Particules fines PM2.5",
  pm10: "Particules fines PM10",
  sulphur_dioxide: "Dioxyde de soufre (SO2)",
};

type AirQualityLevel = (typeof EUROPEAN_AQI_LEVELS)[number];

function aqiLevelFor(value: number | undefined): AirQualityLevel | undefined {
  if (typeof value !== "number") {
    return;
  }
  return EUROPEAN_AQI_LEVELS.find((candidate) => value <= candidate.max);
}

function describeEuropeanAqi(value: number | undefined): string | undefined {
  return aqiLevelFor(value)?.label;
}

type PollutantReading = {
  concentration: number;
  exceedsGuideline: boolean;
  guideline: number;
  guidelineExceededBy: number;
  label: string;
  name: string;
  ratioToGuideline: number;
};

// Compare chaque polluant à sa ligne directrice : le plus haut ratio désigne le
// facteur dominant. Le détail est renvoyé pour éviter que le modèle refasse
// lui-même la comparaison sur des concentrations brutes.
function analyzePollutants(current: Record<string, number | undefined>): {
  dominantPollutant: string | null;
  pollutants: PollutantReading[];
} {
  const pollutants = Object.entries(WHO_2021_GUIDELINES)
    .map(([field, guideline]): PollutantReading | null => {
      const concentration = current[field];
      if (typeof concentration !== "number") {
        return null;
      }
      return {
        concentration,
        exceedsGuideline: concentration > guideline,
        guideline,
        guidelineExceededBy: Number((concentration - guideline).toFixed(1)),
        label: POLLUTANT_LABELS[field] ?? field,
        name: field,
        ratioToGuideline: Number((concentration / guideline).toFixed(2)),
      };
    })
    .filter((entry): entry is PollutantReading => entry !== null)
    .sort((left, right) => right.ratioToGuideline - left.ratioToGuideline);

  return { dominantPollutant: pollutants[0]?.label ?? null, pollutants };
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
  "european_aqi",
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

const MAX_OUTLOOK_DAYS = 5;
const MAX_HOURS = 72;
/** Longueur de la fenêtre « favorable » : 3 h, soit un créneau utilisable. */
const OUTLOOK_WINDOW_HOURS = 3;

function buildAirQualityUrl(
  location: { latitude: number; longitude: number },
  options: { forecastDays: number; includePollen: boolean }
): string {
  const url = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
  url.searchParams.set("latitude", String(location.latitude));
  url.searchParams.set("longitude", String(location.longitude));
  url.searchParams.set("current", AIR_QUALITY_CURRENT_FIELDS.join(","));
  url.searchParams.set(
    "hourly",
    options.includePollen
      ? [...AIR_QUALITY_HOURLY_FIELDS, "temperature_2m"].join(",")
      : AIR_QUALITY_HOURLY_FIELDS.join(",")
  );
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", String(options.forecastDays));
  return url.href;
}

async function fetchAirQuality(
  location: { latitude: number; longitude: number; label?: string },
  options: { forecastDays: number; includePollen: boolean }
): Promise<
  { data: AirQualityResponse; url: string } | { error: string; url: string }
> {
  const url = buildAirQualityUrl(location, options);
  const result = await fetchJson<AirQualityResponse>(url);
  if (!result.ok) {
    return {
      error: `Qualité de l'air indisponible : ${result.error}`,
      url,
    };
  }
  const parsedResponse = airQualityResponseSchema.safeParse(result.data);
  if (!parsedResponse.success) {
    return { error: "Réponse de qualité de l'air invalide.", url };
  }
  const data = parsedResponse.data as AirQualityResponse;
  if (location.label) {
    data.locationName = location.label;
  }
  return { data, url };
}

export const getAirQuality = tool({
  description:
    "Obtenir l'indice de qualité de l'air (indice européen et américain), les polluants (PM10, PM2.5, O3, NO2, SO2, CO) et les concentrations de pollen d'une ville ou de coordonnées, avec prévisions horaires. Fournit le polluant dominant, le niveau de pollution et des conseils de santé.",
  execute: async (input) => {
    const location = await resolveLocation(input);
    if (!location.ok) {
      return { error: location.error };
    }

    const hours = Math.min(Math.max(input.hours ?? 24, 1), MAX_HOURS);
    const includePollen = input.includePollen !== false;
    const forecastDays = Math.min(Math.ceil(hours / 24) + 1, 5);

    const result = await fetchAirQuality(location, {
      forecastDays,
      includePollen,
    });
    if ("error" in result) {
      return { error: result.error };
    }

    const data = result.data;
    const current = data.current ?? {};
    const aqiLevel = aqiLevelFor(current.european_aqi);
    const analysis = analyzePollutants(current);

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
        ...(aqiLevel ? { aqiLevel: aqiLevel.label } : {}),
      },
      currentUnits: data.current_units ?? {},
      dominantPollutant: analysis.dominantPollutant,
      healthAdvice: aqiLevel?.advice ?? null,
      hourly,
      hours,
      ...(location.label ? { locationName: location.label } : {}),
      outdoorAdvice: aqiLevel?.sport ?? null,
      pollutants: analysis.pollutants,
      source: { title: "Open-Meteo Air Quality", url: result.url },
      time: timeIndex.slice(0, hours),
      timezone: "auto",
      units: {
        aqi: "indice européen 0-100",
        guidelineBasis:
          "lignes directrices OMS 2021 (24 h, 8 h pour l'ozone) : base indicative du polluant dominant",
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
      .max(MAX_HOURS)
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

export const getAirQualityOutlook = tool({
  description:
    "Prévoir la pollution jour par jour sur plusieurs jours et identifier la meilleure fenêtre pour une activité en extérieur : minimum, maximum et moyenne de l'indice européen, et créneau horaire le plus favorable.",
  execute: async (input) => {
    const location = await resolveLocation(input);
    if (!location.ok) {
      return { error: location.error };
    }

    const days = Math.min(Math.max(input.days ?? 3, 1), MAX_OUTLOOK_DAYS);
    const result = await fetchAirQuality(location, {
      forecastDays: days,
      includePollen: false,
    });
    if ("error" in result) {
      return { error: result.error };
    }

    const data = result.data;
    const times = (data.hourly?.time ?? []) as Array<string | null>;
    const aqi = (data.hourly?.european_aqi ?? []) as Array<number | null>;
    if (times.length === 0 || aqi.length === 0) {
      return {
        error:
          "Aucune prévision horaire de qualité de l'air renvoyée par le service.",
      };
    }

    // Regroupement par journée locale : l'API renvoie des horodatages déjà
    // décalés sur le fuseau du lieu (timezone=auto).
    const byDay = new Map<string, number[]>();
    for (const [index, stamp] of times.entries()) {
      const value = aqi[index];
      if (!stamp || typeof value !== "number") {
        continue;
      }
      const day = stamp.slice(0, 10);
      const bucket = byDay.get(day) ?? [];
      bucket.push(value);
      byDay.set(day, bucket);
    }

    const perDay = [...byDay.entries()].slice(0, days).map(([day, values]) => {
      const sorted = [...values].sort((left, right) => left - right);
      const mean =
        values.reduce((sum, value) => sum + value, 0) / values.length;
      // Fenêtre favorable = les N heures consécutives les plus propres, pas un
      // point isolé : une accalmie au milieu d'un pic n'est pas praticable.
      let bestStart = -1;
      let bestSum = Number.POSITIVE_INFINITY;
      for (
        let index = 0;
        index + OUTLOOK_WINDOW_HOURS <= values.length;
        index += 1
      ) {
        let sum = 0;
        for (let offset = 0; offset < OUTLOOK_WINDOW_HOURS; offset += 1) {
          sum += values[index + offset] ?? 0;
        }
        if (sum < bestSum) {
          bestSum = sum;
          bestStart = index;
        }
      }
      const windowStart = bestStart >= 0 ? times[bestStart] : null;
      const windowLevel = windowStart
        ? aqiLevelFor(aqi[bestStart + 1] ?? aqi[bestStart] ?? undefined)?.label
        : null;
      const windowFavorable =
        windowLevel === "Bon" || windowLevel === "Correct";
      return {
        bestOutdoorWindow: windowStart
          ? {
              advice: windowFavorable
                ? "Fenêtre favorable à une activité en extérieur."
                : "Activité en extérieur plutôt à éviter pendant ce créneau.",
              from: windowStart,
              hours: OUTLOOK_WINDOW_HOURS,
              level: windowLevel,
            }
          : null,
        date: day,
        healthAdvice: aqiLevelFor(mean)?.advice ?? null,
        level:
          aqiLevelFor(sorted[Math.floor(sorted.length / 2)])?.label ?? null,
        max: sorted.at(-1) ?? null,
        mean: Number(mean.toFixed(1)),
        min: sorted[0] ?? null,
        samples: values.length,
      };
    });

    const average =
      perDay.reduce((sum, day) => sum + day.mean, 0) / (perDay.length || 1);

    return {
      days: perDay,
      overallLevel: aqiLevelFor(average)?.label ?? null,
      overallMean: Number(average.toFixed(1)),
      source: { title: "Open-Meteo Air Quality", url: result.url },
      units: { aqi: "indice européen 0-100" },
      ...(location.label ? { locationName: location.label } : {}),
    };
  },
  inputSchema: z.object({
    city: z
      .string()
      .min(1)
      .max(120)
      .optional()
      .describe("Nom de la ville (ex: 'Paris', 'Lyon', 'Berlin')"),
    days: z
      .number()
      .int()
      .min(1)
      .max(MAX_OUTLOOK_DAYS)
      .optional()
      .describe("Nombre de jours à prévoir (1-5, défaut 3)"),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  }),
});

export const airQualityPlugin: PluginDefinition = {
  createTools: () => ({ getAirQuality, getAirQualityOutlook }),
  manifest: manifest as PluginManifest,
};
