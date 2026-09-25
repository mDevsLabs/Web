import { tool } from "ai";
import { z } from "zod";
import {
  contactHeaders,
  fetchPublicJson,
  sourceRef,
  truncateText,
} from "../shared/public-api";
import type { PluginDefinition, PluginManifest } from "../types";
import manifest from "./index.json";

const EUROSTAT = "https://ec.europa.eu/eurostat/api/dissemination";
const headers = contactHeaders("mAI-Web");
const MAX_OBSERVATIONS = 200;
const MAX_DIMENSION_VALUES = 100;

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
    status: status ?? null,
  };
}

function eurostatDimensions(data: EurostatData) {
  return data.id.map((id) => {
    const dimension = data.dimension[id];
    const values = Object.entries(dimension?.category.index ?? {})
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
    "Lit des données Eurostat JSON-stat pour un jeu, des pays et des périodes, puis renvoie des observations compactes avec leurs dimensions.",
  execute: async ({
    dataset,
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

    const result = await fetchPublicJson<unknown>(url.href, headers);
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

    return {
      dataset: normalizedDataset,
      dimensions: eurostatDimensions(data),
      label: truncateText(data.label, 500),
      observations: observations.slice(0, limit),
      source: sourceRef(url.href, `Eurostat — ${normalizedDataset}`),
      totalReturned: Math.min(observations.length, limit),
      updated: truncateText(data.updated, 100),
    };
  },
  inputSchema: z.object({
    dataset: datasetCodeSchema.describe(
      "Code du jeu Eurostat, par exemple nama_10_gdp"
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
    const result = await fetchPublicJson<unknown>(url.href, headers);
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

export const eurostatPlugin: PluginDefinition = {
  createTools: () => ({
    getEurostatData,
    getEurostatDatasetMetadata,
  }),
  manifest: manifest as PluginManifest,
};
