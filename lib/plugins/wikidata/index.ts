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

const WIKIDATA = "https://www.wikidata.org";
const headers = contactHeaders("mAI-Web");

const languageSchema = z
  .enum(["fr", "en", "de", "es", "it", "pt", "nl", "pl"])
  .default("fr");
const entityIdSchema = z
  .string()
  .trim()
  .min(2)
  .max(32)
  .regex(/^[A-Za-z][A-Za-z0-9]+$/, "Identifiant Wikidata invalide.")
  .transform((value) => value.toUpperCase());

const searchEntitySchema = z
  .object({
    description: z.string().nullable().optional(),
    id: z.string().regex(/^[A-Za-z][A-Za-z0-9]+$/),
    label: z.string().nullable().optional(),
    match: z
      .object({
        text: z.string().optional(),
        type: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

const searchResponseSchema = z
  .object({
    search: z.array(searchEntitySchema).max(50),
    "search-continue": z.number().int().optional(),
  })
  .passthrough();

const localizedValueSchema = z
  .object({
    language: z.string().optional(),
    value: z.string(),
  })
  .passthrough();

const claimSchema = z
  .object({
    mainsnak: z
      .object({
        datavalue: z
          .object({
            value: z.unknown(),
          })
          .passthrough()
          .optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

const entitySchema = z
  .object({
    aliases: z.record(z.string(), z.array(localizedValueSchema)).optional(),
    claims: z.record(z.string(), z.array(claimSchema)).optional(),
    descriptions: z.record(z.string(), localizedValueSchema).optional(),
    labels: z.record(z.string(), localizedValueSchema).optional(),
    sitelinks: z
      .record(
        z.string(),
        z
          .object({
            badges: z.array(z.unknown()).optional(),
            site: z.string().optional(),
            title: z.string().optional(),
          })
          .passthrough()
      )
      .optional(),
  })
  .passthrough();

const entityResponseSchema = z.object({
  entities: z.record(z.string(), entitySchema),
});

function localized(
  values: Record<string, { value: string }> | undefined,
  language: string
): string | null {
  return (
    values?.[language]?.value ??
    values?.mul?.value ??
    values?.en?.value ??
    Object.values(values ?? {})[0]?.value ??
    null
  );
}

function compactClaimValue(value: unknown): string | number | boolean | null {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (!value || typeof value !== "object") {
    return null;
  }
  const record = value as Record<string, unknown>;
  for (const key of ["id", "time", "amount", "text"]) {
    if (typeof record[key] === "string" || typeof record[key] === "number") {
      return record[key] as string | number;
    }
  }
  return null;
}

function entityView(
  id: string,
  entity: z.infer<typeof entitySchema>,
  language: string
) {
  const labels = Object.fromEntries(
    Object.entries(entity.labels ?? {})
      .slice(0, 12)
      .map(([key, value]) => [key, truncateText(value.value, 240)])
  );
  const descriptions = Object.fromEntries(
    Object.entries(entity.descriptions ?? {})
      .slice(0, 8)
      .map(([key, value]) => [key, truncateText(value.value, 500)])
  );
  const aliases = Object.values(entity.aliases ?? {})
    .flat()
    .slice(0, 12)
    .map((value) => truncateText(value.value, 240))
    .filter((value): value is string => value !== null);
  const claims = Object.entries(entity.claims ?? {})
    .slice(0, 40)
    .map(([property, values]) => ({
      property,
      values: values
        .slice(0, 8)
        .map((claim) => compactClaimValue(claim.mainsnak?.datavalue?.value))
        .filter((value): value is string | number | boolean => value !== null),
    }))
    .filter((claim) => claim.values.length > 0);
  const sitelinks = Object.entries(entity.sitelinks ?? {})
    .slice(0, 20)
    .map(([site, link]) => ({
      site,
      title: truncateText(link.title, 240),
      url: `https://${site}.wiki/${encodeURIComponent(link.title ?? "")}`,
    }));

  return {
    aliases,
    claims,
    description: localized(entity.descriptions, language),
    descriptions,
    id,
    label: localized(entity.labels, language),
    labels,
    sitelinks,
  };
}

export const searchWikidataEntities = tool({
  description:
    "Recherche des entités publiques de Wikidata par libellé, avec identifiant, description et lien vers la fiche.",
  execute: async ({ language = "fr", limit = 8, query }) => {
    const url = new URL(`${WIKIDATA}/w/api.php`);
    url.searchParams.set("action", "wbsearchentities");
    url.searchParams.set("format", "json");
    url.searchParams.set("language", language);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("search", query.trim());
    url.searchParams.set("uselang", language);

    const result = await fetchPublicJson<unknown>(url.href, headers);
    if (!result.ok) {
      return { error: result.error };
    }
    const parsed = searchResponseSchema.safeParse(result.data);
    if (!parsed.success) {
      return { error: "Réponse de recherche Wikidata invalide." };
    }

    return {
      entities: parsed.data.search.slice(0, limit).map((entity) => ({
        description: entity.description ?? null,
        id: entity.id.toUpperCase(),
        label: entity.label ?? null,
        matchedText: entity.match?.text ?? null,
        url: `${WIKIDATA}/wiki/${entity.id.toUpperCase()}`,
      })),
      source: sourceRef(url.href, "Wikidata — recherche"),
      totalReturned: Math.min(parsed.data.search.length, limit),
    };
  },
  inputSchema: z.object({
    language: languageSchema.describe("Langue des libellés (défaut fr)"),
    limit: z.number().int().min(1).max(20).default(8),
    query: z.string().trim().min(2).max(200),
  }),
});

export const getWikidataEntity = tool({
  description:
    "Lit une entité Wikidata publique et renvoie ses libellés, alias, propriétés et sitelinks dans une sortie bornée.",
  execute: async ({ entityId, language = "fr" }) => {
    const normalizedEntityId = entityId.toUpperCase();
    const url = `${WIKIDATA}/wiki/Special:EntityData/${normalizedEntityId}.json`;
    const result = await fetchPublicJson<unknown>(url, headers);
    if (!result.ok) {
      return { error: result.error };
    }
    const parsed = entityResponseSchema.safeParse(result.data);
    if (!parsed.success) {
      return { error: "Réponse d'entité Wikidata invalide." };
    }
    const entity =
      parsed.data.entities[normalizedEntityId] ??
      Object.values(parsed.data.entities)[0];
    if (!entity) {
      return { error: "Entité Wikidata introuvable." };
    }

    return {
      entity: entityView(normalizedEntityId, entity, language),
      source: sourceRef(
        `${WIKIDATA}/wiki/${normalizedEntityId}`,
        "Wikidata — entité"
      ),
    };
  },
  inputSchema: z.object({
    entityId: entityIdSchema.describe("Identifiant Wikidata, par exemple Q42"),
    language: languageSchema.describe(
      "Langue préférée pour le libellé (défaut fr)"
    ),
  }),
});

export const wikidataPlugin: PluginDefinition = {
  createTools: () => ({
    getWikidataEntity,
    searchWikidataEntities,
  }),
  manifest: manifest as PluginManifest,
};
