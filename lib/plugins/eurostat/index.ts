import { tool } from "ai";
import { z } from "zod";
import {
  contactHeaders,
  fetchPublicJson,
  PUBLIC_API_LARGE_MAX_BYTES,
  sourceRef,
  truncateText,
} from "../shared/public-api";
import type { PluginDefinition, PluginManifest } from "../types";
import manifest from "./index.json";

const EUROSTAT = "https://ec.europa.eu/eurostat/api/dissemination";
const headers = contactHeaders("mAI-Web");
const MAX_OBSERVATIONS = 200;
const MAX_DIMENSION_VALUES = 100;
const MAX_COMPARE_COUNTRIES = 10;

// Un jeu Eurostat complet dépasse régulièrement le mégoctet : la requête est
// faite sans filtre `geo`/`time` serré, le plafond par défaut la refusait à tort.
const requestOptions = { maxBytes: PUBLIC_API_LARGE_MAX_BYTES } as const;

const datasetCodeSchema = z
  .string()
  .trim()
  .min(3)
  .max(80)
  .regex(/^[A-Za-z][A-Za-z0-9_]+$/, "Code de jeu Eurostat invalide.")
  .transform((value) => value.toLowerCase());
const filterCodeSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[A-Za-z0-9_.-]+$/, "Code de filtre Eurostat invalide.");
const filterValuesSchema = z.union([
  filterCodeSchema,
  z.array(filterCodeSchema).min(1).max(20),
]);
const filtersSchema = z
  .record(z.string().regex(/^[a-z][a-z0-9_]{0,39}$/), filterValuesSchema)
  .refine(
    (filters) =>
      Object.keys(filters).length <= 8 &&
      !Object.keys(filters).some((key) =>
        ["format", "lang", "callback"].includes(key.toLowerCase())
      ),
    "Trop de filtres Eurostat ou filtre réservé."
  );
const dimensionSchema = z
  .string()
  .trim()
  .regex(/^[a-z][a-z0-9_]{0,39}$/)
  .refine(
    (value) => !["callback", "format", "lang"].includes(value),
    "Dimension Eurostat réservée."
  )
  .default("indic_de");
const periodSchema = z
  .string()
  .trim()
  .regex(/^\d{4}(?:-\d{2})?(?:-Q[1-4])?$/, "Période Eurostat invalide.");

const eurostatDimensionSchema = z
  .object({
    category: z
      .object({
        index: z.record(z.string(), z.number().int().nonnegative()),
        label: z.record(z.string(), z.string()).optional(),
      })
      .passthrough(),
    label: z.string().optional(),
  })
  .passthrough();

const eurostatDataSchema = z
  .object({
    dimension: z.record(z.string(), eurostatDimensionSchema),
    id: z.array(z.string()).min(1).max(12),
    label: z.string().nullable().optional(),
    size: z.array(z.number().int().nonnegative()).min(1).max(12),
    updated: z.string().nullable().optional(),
    value: z.record(z.string(), z.unknown()),
  })
  .passthrough()
  .refine((data) => data.id.length === data.size.length, {
    message: "Les dimensions Eurostat sont incohérentes.",
  });

const metadataPartSchema = z
  .object({
    name: z.string().optional(),
    url: z.string().optional(),
  })
  .passthrough();
const eurostatMetadataSchema = z
  .object({
    dateModified: z.string().optional(),
    description: z.string().optional(),
    hasPart: z.array(metadataPartSchema).optional(),
    identifier: z.union([z.string(), z.array(z.string())]).optional(),
    keywords: z.union([z.string(), z.array(z.string())]).optional(),
    license: z.string().optional(),
    name: z.string().min(1),
    temporalCoverage: z.string().optional(),
    url: z.string().optional(),
  })
  .passthrough();

type EurostatData = z.infer<typeof eurostatDataSchema>;
type FilterValue = z.infer<typeof filterValuesSchema>;

function asValues(value: FilterValue | undefined): string[] {
  if (value === undefined) return [];
  const values = Array.isArray(value) ? value : [value];
  return [...new Set(values.map((entry) => entry.trim()).filter(Boolean))];
}

function setEurostatFilter(
  url: URL,
  key: string,
  value: FilterValue | undefined
) {
  const values = asValues(value);
  if (values.length > 0) {
    url.searchParams.set(key, values.join("+"));
  }
}

function compactEurostatValue(
  value: unknown
): string | number | boolean | null {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (value === null) return null;
  try {
    return truncateText(JSON.stringify(value), 500);
  } catch {
    return null;
  }
}

function positionToCode(
  dimension: EurostatData["dimension"][string],
  position: number
) {
  const match = Object.entries(dimension.category.index).find(
    ([, index]) => index === position
  );
  return match?.[0] ?? String(position);
}

function decodeEurostatIndex(rawIndex: string, data: EurostatData) {
  const [indexPart, status] = rawIndex.split(":", 2);
  const index = Number(indexPart);
  if (!Number.isSafeInteger(index) || index < 0) {
    return null;
  }
  const positions: number[] = new Array(data.size.length);
  let remainder = index;
  for (let cursor = data.size.length - 1; cursor >= 0; cursor -= 1) {
    const size = data.size[cursor] ?? 0;
    if (size <= 0) return null;
    positions[cursor] = remainder % size;
    remainder = Math.floor(remainder / size);
  }
  if (remainder !== 0) return null;
  return {
    dimensions: Object.fromEntries(
      data.id.map((dimensionId, cursor) => [
        dimensionId,
        positionToCode(
          data.dimension[dimensionId] ?? {
            category: { index: {} },
          },
          positions[cursor] ?? 0
        ),
      ])
    ),
    index: rawIndex,
    // Conservé pour retrouver un libellé de période : les positions sont la
    // seule voie inverse de `category.index`, qui est un code → position.
    positions,
    status: status ?? null,
  };
}

function eurostatDimensions(
  data: EurostatData,
  usedCodes?: Map<string, Set<string>>
) {
  return data.id.map((id) => {
    const dimension = data.dimension[id];
    // Détail « used » : on ne renvoie que les codes réellement présents dans les
    // observations retournées. Un jeu comme `demo_pjanind` déclare plusieurs
    // centaines de codes de fréquence, tous absents d'une lecture filtrée —
    // les renvoyer noie l'indicateur demandé sous des milliers de lignes.
    const used = usedCodes?.get(id);
    const values = Object.entries(dimension?.category.index ?? {})
      .filter(([code]) => !used || used.has(code))
      .sort(([, left], [, right]) => left - right)
      .slice(0, MAX_DIMENSION_VALUES)
      .map(([code, position]) => ({
        code: truncateText(code, 80) ?? String(position),
        label: truncateText(dimension?.category.label?.[code], 240),
        position,
      }));
    return {
      id,
      label: truncateText(dimension?.label, 240),
      values,
    };
  });
}

function eurostatUrl(dataset: string): string {
  return `${EUROSTAT}/statistics/1.0/data/${encodeURIComponent(dataset)}`;
}

export const getEurostatData = tool({
  description:
    "Lit des données Eurostat JSON-stat pour un jeu, des pays et des périodes, puis renvoie des observations compactes avec leurs dimensions. Le détail des dimensions est réductible pour ne pas noyer l'indicateur demandé.",
  execute: async ({
    dataset,
    dimensionsDetail = "full",
    filters,
    geo,
    indicator,
    indicatorDimension = "indic_de",
    limit = 100,
    sinceTimePeriod,
    time,
    untilTimePeriod,
  }) => {
    const normalizedDataset = dataset.toLowerCase();
    const url = new URL(eurostatUrl(normalizedDataset));
    url.searchParams.set("format", "JSON");
    for (const [key, value] of Object.entries(filters ?? {})) {
      setEurostatFilter(url, key, value);
    }
    setEurostatFilter(url, "geo", geo);
    setEurostatFilter(url, indicatorDimension, indicator);
    setEurostatFilter(url, "time", time);
    if (sinceTimePeriod)
      url.searchParams.set("sinceTimePeriod", sinceTimePeriod);
    if (untilTimePeriod)
      url.searchParams.set("untilTimePeriod", untilTimePeriod);

    const result = await fetchPublicJson<unknown>(
      url.href,
      headers,
      requestOptions
    );
    if (!result.ok) return { error: result.error };
    const parsed = eurostatDataSchema.safeParse(result.data);
    if (!parsed.success) {
      return { error: "Réponse de données Eurostat invalide." };
    }
    const data = parsed.data;
    const observations = Object.keys(data.value)
      .sort((left, right) => {
        const leftNumber = Number(left.split(":", 1)[0]);
        const rightNumber = Number(right.split(":", 1)[0]);
        return (
          (Number.isNaN(leftNumber) ? 0 : leftNumber) -
          (Number.isNaN(rightNumber) ? 0 : rightNumber)
        );
      })
      .map((index) => {
        const decoded = decodeEurostatIndex(index, data);
        return decoded
          ? {
              dimensions: decoded.dimensions,
              index: decoded.index,
              status: decoded.status,
              value: compactEurostatValue(data.value[index]),
            }
          : null;
      })
      .filter(
        (observation): observation is NonNullable<typeof observation> =>
          observation !== null
      );

    const returned = observations.slice(0, limit);
    // Codes effectivement rencontrés, servant au mode de détail « used ».
    const usedCodes =
      dimensionsDetail === "used"
        ? new Map(
            data.id.map((id) => [
              id,
              new Set(
                returned.flatMap((observation) => {
                  const code = observation.dimensions[id];
                  return code ? [code] : [];
                })
              ),
            ])
          )
        : undefined;

    return {
      dataset: normalizedDataset,
      dimensions:
        dimensionsDetail === "none" ? [] : eurostatDimensions(data, usedCodes),
      label: truncateText(data.label, 500),
      observations: returned,
      source: sourceRef(url.href, `Eurostat — ${normalizedDataset}`),
      totalMatches: observations.length,
      totalReturned: Math.min(observations.length, limit),
      updated: truncateText(data.updated, 100),
    };
  },
  inputSchema: z.object({
    dataset: datasetCodeSchema.describe(
      "Code du jeu Eurostat, par exemple nama_10_gdp"
    ),
    dimensionsDetail: z
      .enum(["full", "used", "none"])
      .default("full")
      .describe(
        "Détail des dimensions renvoyées : full (tous les codes), used (seuls ceux des observations retournées), none (dimensions omises)"
      ),
    filters: filtersSchema
      .optional()
      .describe("Filtres par dimension, par exemple na_item ou unit"),
    geo: filterValuesSchema
      .optional()
      .describe("Codes géographiques, par exemple FR ou DE"),
    indicator: filterValuesSchema
      .optional()
      .describe("Codes d’indicateur de la dimension du jeu"),
    indicatorDimension: dimensionSchema.describe(
      "Dimension qui reçoit l’indicateur (défaut indic_de)"
    ),
    limit: z.number().int().min(1).max(MAX_OBSERVATIONS).default(100),
    sinceTimePeriod: periodSchema
      .optional()
      .describe("Première période incluse"),
    time: filterValuesSchema
      .optional()
      .describe("Périodes Eurostat, par exemple 2020 ou 2020-Q1"),
    untilTimePeriod: periodSchema
      .optional()
      .describe("Dernière période incluse"),
  }),
});

export const getEurostatDatasetMetadata = tool({
  description:
    "Récupère les métadonnées publiques d’un jeu Eurostat : nom, description, couverture, licence et jeux liés.",
  execute: async ({ dataset }) => {
    const normalizedDataset = dataset.toLowerCase();
    const url = new URL(
      `${EUROSTAT}/catalogue/jsonld/ESTAT/${encodeURIComponent(normalizedDataset)}/latest`
    );
    url.searchParams.set("lang", "fr");
    const result = await fetchPublicJson<unknown>(
      url.href,
      headers,
      requestOptions
    );
    if (!result.ok) return { error: result.error };
    const parsed = eurostatMetadataSchema.safeParse(result.data);
    if (!parsed.success) {
      return { error: "Réponse de métadonnées Eurostat invalide." };
    }
    const metadata = parsed.data;
    const identifiers = Array.isArray(metadata.identifier)
      ? metadata.identifier
      : metadata.identifier
        ? [metadata.identifier]
        : [];
    const keywords = Array.isArray(metadata.keywords)
      ? metadata.keywords
      : metadata.keywords
        ? [metadata.keywords]
        : [];

    return {
      dataset: normalizedDataset,
      dateModified: metadata.dateModified ?? null,
      description: truncateText(metadata.description, 5000),
      identifiers: identifiers
        .slice(0, 8)
        .map((identifier) => truncateText(identifier, 300))
        .filter((identifier): identifier is string => identifier !== null),
      keywords: keywords
        .slice(0, 12)
        .map((keyword) => truncateText(keyword, 240))
        .filter((keyword): keyword is string => keyword !== null),
      license: truncateText(metadata.license, 500),
      name: truncateText(metadata.name, 500),
      relatedDatasets: (metadata.hasPart ?? []).slice(0, 20).map((part) => ({
        name: truncateText(part.name, 300),
        url: typeof part.url === "string" ? part.url.slice(0, 2000) : null,
      })),
      source: sourceRef(
        url.href,
        `Eurostat — métadonnées ${normalizedDataset}`
      ),
      temporalCoverage: truncateText(metadata.temporalCoverage, 200),
      url:
        typeof metadata.url === "string" ? metadata.url.slice(0, 2000) : null,
    };
  },
  inputSchema: z.object({
    dataset: datasetCodeSchema.describe("Code du jeu Eurostat à documenter"),
  }),
});

/**
 * Comparaison de pays sur un indicateur Eurostat. Elle ne réinvente rien : elle
 * prépare la requête, puis classe et met en forme ce que l'API a renvoyé. Sans
 * cela le modele doit faire l'addition, l'écart et le rang lui-même sur une
 * grille d'observations, ce qu'il rate régulièrement.
 */
export const compareEurostatCountries = tool({
  description:
    "Comparer un indicateur Eurostat entre deux à dix pays pour une période donnée : valeur par pays, rang, écart avec le leader, moyenne de l'échantillon et évolution sur la période.",
  execute: async ({
    dataset,
    geo,
    indicator,
    indicatorDimension = "indic_de",
    sinceTimePeriod,
    time,
    untilTimePeriod,
  }) => {
    const countries = [...new Set(asValues(geo))].slice(
      0,
      MAX_COMPARE_COUNTRIES
    );
    if (countries.length < 2) {
      return {
        error: `Indiquez au moins deux codes pays distincts (maximum ${MAX_COMPARE_COUNTRIES}).`,
      };
    }

    const normalizedDataset = dataset.toLowerCase();
    const url = new URL(eurostatUrl(normalizedDataset));
    url.searchParams.set("format", "JSON");
    setEurostatFilter(url, "geo", countries);
    setEurostatFilter(url, indicatorDimension, indicator);
    setEurostatFilter(url, "time", time);
    if (sinceTimePeriod)
      url.searchParams.set("sinceTimePeriod", sinceTimePeriod);
    if (untilTimePeriod)
      url.searchParams.set("untilTimePeriod", untilTimePeriod);

    const result = await fetchPublicJson<unknown>(
      url.href,
      headers,
      requestOptions
    );
    if (!result.ok) return { error: result.error };
    const parsed = eurostatDataSchema.safeParse(result.data);
    if (!parsed.success) {
      return { error: "Réponse de données Eurostat invalide." };
    }
    const data = parsed.data;
    if (!data.id.includes("geo")) {
      return {
        error:
          "Ce jeu Eurostat n'est pas ventilé par pays (dimension « geo » absente).",
      };
    }

    const geoLabels = data.dimension.geo?.category.label ?? {};
    const timePosition = data.id.indexOf("time");
    const timeCodes = new Map(
      Object.entries(data.dimension.time?.category.index ?? {}).map(
        ([code, position]) => [position, code]
      )
    );

    // Par pays : série période → valeur, l'ordre de la grille n'est pas garanti.
    const byCountry = new Map<
      string,
      Array<{ period: string | null; value: number | null }>
    >();
    for (const [index, raw] of Object.entries(data.value)) {
      const decoded = decodeEurostatIndex(index, data);
      if (!decoded) continue;
      const country = decoded.dimensions.geo;
      if (!country) continue;
      const rawValue = data.value[index];
      const value =
        typeof rawValue === "number" && Number.isFinite(rawValue)
          ? rawValue
          : null;
      const period =
        timePosition >= 0
          ? (timeCodes.get(decoded.positions[timePosition] ?? -1) ?? null)
          : null;
      const bucket = byCountry.get(country) ?? [];
      bucket.push({ period, value });
      byCountry.set(country, bucket);
    }

    const ranked = [...byCountry.entries()]
      .map(([country, series]) => {
        const usable = series
          .filter(
            (point): point is { period: string; value: number } =>
              typeof point.value === "number"
          )
          .sort((left, right) => left.period.localeCompare(right.period));
        const last = usable.at(-1) ?? null;
        const first = usable[0] ?? null;
        return {
          change:
            last && first && first.value !== 0
              ? Number(
                  (
                    ((last.value - first.value) / Math.abs(first.value)) *
                    100
                  ).toFixed(1)
                )
              : null,
          country,
          label: truncateText(geoLabels[country], 200),
          period: last?.period ?? null,
          series: usable.slice(-12),
          value: last?.value ?? null,
        };
      })
      .sort(
        (left, right) =>
          (right.value ?? Number.NEGATIVE_INFINITY) -
          (left.value ?? Number.NEGATIVE_INFINITY)
      )
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    const values = ranked
      .map((entry) => entry.value)
      .filter((value): value is number => value !== null);
    const leader = values.length > 0 ? Math.max(...values) : null;

    return {
      countries: ranked.map((entry) => ({
        ...entry,
        gapToLeader:
          leader !== null && entry.value !== null
            ? Number((entry.value - leader).toFixed(4))
            : null,
      })),
      dataset: normalizedDataset,
      leader: ranked.find((entry) => entry.value !== null)?.country ?? null,
      mean:
        values.length > 0
          ? Number(
              (
                values.reduce((sum, value) => sum + value, 0) / values.length
              ).toFixed(4)
            )
          : null,
      missing: countries.filter((country) => !byCountry.has(country)),
      source: sourceRef(
        url.href,
        `Eurostat — comparaison ${normalizedDataset}`
      ),
      totalCompared: values.length,
    };
  },
  inputSchema: z.object({
    dataset: datasetCodeSchema.describe(
      "Code du jeu Eurostat, par exemple nama_10_gdp"
    ),
    geo: filterValuesSchema.describe(
      "Codes pays géographiques à comparer, par exemple FR et DE"
    ),
    indicator: filterValuesSchema
      .optional()
      .describe("Codes d’indicateur de la dimension du jeu"),
    indicatorDimension: dimensionSchema.describe(
      "Dimension qui reçoit l’indicateur (défaut indic_de)"
    ),
    sinceTimePeriod: periodSchema
      .optional()
      .describe("Première période incluse"),
    time: filterValuesSchema
      .optional()
      .describe("Périodes Eurostat, par exemple 2020 ou 2020-Q1"),
    untilTimePeriod: periodSchema
      .optional()
      .describe("Dernière période incluse"),
  }),
});

export const eurostatPlugin: PluginDefinition = {
  createTools: () => ({
    compareEurostatCountries,
    getEurostatData,
    getEurostatDatasetMetadata,
  }),
  manifest: manifest as PluginManifest,
};
