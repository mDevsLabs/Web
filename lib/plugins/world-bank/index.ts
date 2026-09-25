import { tool } from "ai";
import { z } from "zod";
import { fetchPublicJson, sourceRef, truncateText } from "../shared/public-api";
import type { PluginDefinition, PluginManifest } from "../types";
import manifest from "./index.json";

const BASE = "https://api.worldbank.org/v2";
type WorldBankRow = Record<string, unknown>;
type WorldBankResponse = [Record<string, unknown>, WorldBankRow[] | null];
const headers = { "User-Agent": "mAI-Web/1.0" };
function wbUrl(path: string, query: Record<string, string> = {}) {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("format", "json");
  for (const [key, value] of Object.entries(query))
    url.searchParams.set(key, value);
  return url;
}
function validCountries(input: string): string[] {
  return input
    .split(/[;,\s]+/)
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean);
}
function responseRows(result: WorldBankResponse): WorldBankRow[] {
  return Array.isArray(result[1]) ? result[1] : [];
}
function observationView(row: WorldBankRow) {
  const country = row.country as { id?: string; value?: string } | undefined;
  const indicator = row.indicator as
    | { id?: string; value?: string }
    | undefined;
  return {
    country: country?.value ?? null,
    countryCode: country?.id ?? null,
    indicator: indicator?.value ?? null,
    indicatorCode: indicator?.id ?? null,
    unit: row.unit ?? null,
    value: row.value ?? null,
    year: row.date ?? null,
  };
}

export const listWorldBankCountries = tool({
  description:
    "Liste les pays et économies du catalogue Banque mondiale par région et code ISO.",
  execute: async ({ limit, query }) => {
    const url = wbUrl("/country", { page: "1", per_page: "300" });
    const result = await fetchPublicJson<WorldBankResponse>(url.href, headers);
    if (!result.ok) return { error: result.error };
    const q = query?.trim().toLowerCase();
    const countries = responseRows(result.data)
      .filter((row) => {
        const region = row.region as { id?: string } | undefined;
        const matches =
          !q ||
          String(row.name ?? "")
            .toLowerCase()
            .includes(q) ||
          String(row.id ?? "")
            .toLowerCase()
            .includes(q);
        return region?.id !== "NA" && matches;
      })
      .slice(0, limit)
      .map((row) => ({
        code: row.id,
        incomeLevel: (row.incomeLevel as { value?: string } | undefined)?.value,
        iso2: row.iso2Code,
        name: row.name,
        region: (row.region as { value?: string } | undefined)?.value,
      }));
    return { countries, source: sourceRef(url.href, "Banque mondiale — pays") };
  },
  inputSchema: z.object({
    limit: z.number().int().min(1).max(60).default(40),
    query: z.string().max(80).optional(),
  }),
});

export const searchWorldBankIndicators = tool({
  description: "Recherche des indicateurs Banque mondiale par mot-clé.",
  execute: async ({ limit, query }) => {
    // L'API de métadonnées expose sa recherche par chemin /sources/{id}/search/{mot}.
    // L'endpoint /indicator ne documente pas de paramètre `q` et retournerait
    // alors une page arbitraire au lieu des correspondances demandées.
    const url = wbUrl(`/sources/2/search/${encodeURIComponent(query)}`, {
      per_page: "100",
    });
    const result = await fetchPublicJson<{
      source?: Array<{
        id?: string;
        name?: string;
        concept?: Array<{
          id?: string;
          variable?: Array<{
            id?: string;
            name?: string;
            metatype?: Array<{ id?: string; value?: string }>;
          }>;
        }>;
      }>;
    }>(url.href, headers);
    if (!result.ok) return { error: result.error };
    const indicators = (result.data.source ?? [])
      .flatMap((source) =>
        (source.concept ?? [])
          .filter((concept) => concept.id?.toLowerCase() === "series")
          .flatMap((concept) =>
            (concept.variable ?? []).map((variable) => ({
              id: variable.id ?? null,
              matches: (variable.metatype ?? [])
                .slice(0, 3)
                .map((metadata) => ({
                  text: truncateText(metadata.value, 500),
                  type: truncateText(metadata.id, 120),
                })),
              name: truncateText(variable.name, 300),
              source: source.name ?? "World Development Indicators",
            }))
          )
      )
      .slice(0, limit);
    return {
      indicators,
      source: sourceRef(url.href, "Banque mondiale — indicateurs"),
    };
  },
  inputSchema: z.object({
    limit: z.number().int().min(1).max(20).default(10),
    query: z.string().min(2).max(120),
  }),
});

export const getWorldBankSeries = tool({
  description:
    "Récupère une série chronologique d'indicateur pour un pays, avec années bornées.",
  execute: async ({
    country,
    from = 2015,
    indicator,
    to = new Date().getUTCFullYear(),
  }) => {
    if (from > to || to - from > 60)
      return { error: "Intervalle invalide ou trop large (60 ans maximum)." };
    const url = wbUrl(
      `/country/${country.toUpperCase()}/indicator/${encodeURIComponent(indicator)}`,
      { date: `${from}:${to}`, per_page: "80" }
    );
    const result = await fetchPublicJson<WorldBankResponse>(url.href, headers);
    if (!result.ok) return { error: result.error };
    return {
      observations: responseRows(result.data).slice(0, 80).map(observationView),
      source: sourceRef(url.href, "Banque mondiale — série"),
    };
  },
  inputSchema: z.object({
    country: z.string().regex(/^[A-Za-z]{2,3}$/),
    from: z.number().int().min(1960).max(2035).optional(),
    indicator: z.string().regex(/^[A-Za-z0-9_.-]+$/),
    to: z.number().int().min(1960).max(2035).optional(),
  }),
});

export const compareWorldBankCountries = tool({
  description:
    "Compare un indicateur Banque mondiale entre deux à cinq pays sur une même période.",
  execute: async ({
    countries,
    from = 2015,
    indicator,
    to = new Date().getUTCFullYear(),
  }) => {
    if (from > to || to - from > 30)
      return {
        error:
          "Intervalle invalide ou trop large (30 ans maximum pour une comparaison).",
      };
    const codes = validCountries(countries.join(";"));
    const url = wbUrl(
      `/country/${codes.join(";")}/indicator/${encodeURIComponent(indicator)}`,
      { date: `${from}:${to}`, per_page: "200" }
    );
    const result = await fetchPublicJson<WorldBankResponse>(url.href, headers);
    if (!result.ok) return { error: result.error };
    return {
      indicator,
      observations: responseRows(result.data)
        .slice(0, 200)
        .map(observationView),
      source: sourceRef(url.href, "Banque mondiale — comparaison"),
    };
  },
  inputSchema: z.object({
    countries: z
      .array(z.string().regex(/^[A-Za-z]{2,3}$/))
      .min(2)
      .max(5),
    from: z.number().int().min(1960).max(2035).optional(),
    indicator: z.string().regex(/^[A-Za-z0-9_.-]+$/),
    to: z.number().int().min(1960).max(2035).optional(),
  }),
});

export const worldBankPlugin: PluginDefinition = {
  createTools: () => ({
    compareWorldBankCountries,
    getWorldBankSeries,
    listWorldBankCountries,
    searchWorldBankIndicators,
  }),
  manifest: manifest as PluginManifest,
};
