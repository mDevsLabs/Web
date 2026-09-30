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

// `wbgetentities` refuse au-delà de 50 identifiants par requête : on reste
// largement en dessous, le but est de nommer les propriétés et les entités les
// plus citées, pas de tout résoudre.
const MAX_RESOLVED_IDS = 24;

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

type Labels = Record<string, string>;

function emptyLabels(): Labels {
  return {};
}

/**
 * Traduit les identifiants bruts (« P31 », « Q5 ») en libellés lisibles. Sans
 * cela la sortie ne contient que `{"property":"P31","values":["Q5"]}`, que ni un
 * humain ni le modèle ne peut interpréter. L'appel est facultatif : en cas
 * d'échec on conserve les identifiants, jamais on ne perd la donnée.
 */
async function resolveLabels(ids: string[], language: string): Promise<Labels> {
  const wanted = [...new Set(ids)]
    .filter((id) => /^[PQ]\d+$/i.test(id))
    .slice(0, MAX_RESOLVED_IDS);
  if (wanted.length === 0) {
    return emptyLabels();
  }

  const url = new URL(`${WIKIDATA}/w/api.php`);
  url.searchParams.set("action", "wbgetentities");
  url.searchParams.set("format", "json");
  url.searchParams.set("ids", wanted.join("|"));
  url.searchParams.set("props", "labels");
  url.searchParams.set("languages", language);
  url.searchParams.set("languagefallback", "1");

  const result = await fetchPublicJson<unknown>(url.href, headers);
  if (!result.ok) {
    return emptyLabels();
  }
  const parsed = entityResponseSchema.safeParse(result.data);
  if (!parsed.success) {
    return emptyLabels();
  }
  const labels = emptyLabels();
  for (const [id, entity] of Object.entries(parsed.data.entities)) {
    const label = localized(entity.labels, language);
    if (label) {
      labels[id.toUpperCase()] = label;
    }
  }
  return labels;
}

function claimValues(
  claims: z.infer<typeof claimSchema>[] | undefined,
  labels: Labels
): Array<{
  entityId?: string;
  label: string | number | boolean | null;
}> {
  return (claims ?? [])
    .slice(0, 8)
    .map((claim) => {
      const value = compactClaimValue(claim.mainsnak?.datavalue?.value);
      const entityId = typeof value === "string" ? value : null;
      const resolved = entityId ? labels[entityId.toUpperCase()] : undefined;
      return {
        ...(entityId ? { entityId } : {}),
        // `id` est prioritaire : c'est un identifiant d'entité, donc résoluble.
        label: resolved ?? value,
      };
    })
    .filter((entry) => entry.label !== null);
}

function referencedIds(
  claims: Record<string, z.infer<typeof claimSchema>[]> | undefined
): string[] {
  const ids: string[] = [];
  for (const [property, values] of Object.entries(claims ?? {})) {
    ids.push(property);
    for (const claim of values) {
      const value = compactClaimValue(claim.mainsnak?.datavalue?.value);
      if (typeof value === "string" && /^[PQ]\d+$/i.test(value)) {
        ids.push(value);
      }
    }
  }
  return ids;
}

function entityView(
  id: string,
  entity: z.infer<typeof entitySchema>,
  language: string,
  labels: Labels
) {
  const localizedLabels = Object.fromEntries(
    Object.entries(entity.labels ?? {})
      .slice(0, 12)
      .map(([key, value]) => [key, truncateText(value.value, 240)])
  );
  const localizedDescriptions = Object.fromEntries(
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
      label: labels[property.toUpperCase()] ?? null,
      property,
      values: claimValues(values, labels),
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
    descriptions: localizedDescriptions,
    id,
    label: localized(entity.labels, language),
    labels: localizedLabels,
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
    "Lit une entité Wikidata publique et renvoie ses libellés, alias, propriétés et sitelinks dans une sortie bornée. Les identifiants de propriétés (P) et d'entités (Q) sont traduits en libellés lisibles.",
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

    const labels = await resolveLabels(referencedIds(entity.claims), language);

    return {
      entity: entityView(normalizedEntityId, entity, language, labels),
      source: sourceRef(
        `${WIKIDATA}/wiki/${normalizedEntityId}`,
        "Wikidata — entité"
      ),
      unresolvedLabels: Object.keys(labels).length === 0,
    };
  },
  inputSchema: z.object({
    entityId: entityIdSchema.describe("Identifiant Wikidata, par exemple Q42"),
    language: languageSchema.describe(
      "Langue préférée pour le libellé (défaut fr)"
    ),
  }),
});

export const getWikidataEntities = tool({
  description:
    "Lit jusqu'à dix entités Wikidata en une seule requête pour les comparer : libellé, description, instance de, nombre de sitelinks et lien vers la fiche.",
  execute: async ({ entityIds, language = "fr" }) => {
    const normalized = [
      ...new Set(entityIds.map((id) => id.toUpperCase())),
    ].slice(0, 10);
    if (normalized.length === 0) {
      return { error: "Indiquez au moins un identifiant Wikidata." };
    }

    const url = new URL(`${WIKIDATA}/w/api.php`);
    url.searchParams.set("action", "wbgetentities");
    url.searchParams.set("format", "json");
    url.searchParams.set("ids", normalized.join("|"));
    url.searchParams.set("props", "labels|descriptions|claims|sitelinks");
    url.searchParams.set("languages", language);
    url.searchParams.set("languagefallback", "1");

    const result = await fetchPublicJson<unknown>(url.href, headers);
    if (!result.ok) {
      return { error: result.error };
    }
    const parsed = entityResponseSchema.safeParse(result.data);
    if (!parsed.success) {
      return { error: "Réponse d'entité Wikidata invalide." };
    }

    const missing = normalized.filter((id) => !parsed.data.entities[id]);
    const found = normalized
      .filter((id) => parsed.data.entities[id])
      .map((id) => {
        const entity = parsed.data.entities[id];
        const view = entityView(id, entity, language, emptyLabels());
        return {
          description: view.description,
          id,
          label: view.label,
          properties: view.claims.length,
          sitelinkCount: view.sitelinks.length,
          url: `${WIKIDATA}/wiki/${id}`,
        };
      });

    return {
      entities: found,
      missing,
      source: sourceRef(`${WIKIDATA}/wiki/Special:EntityData`, "Wikidata"),
      totalReturned: found.length,
    };
  },
  inputSchema: z.object({
    entityIds: z
      .array(entityIdSchema)
      .min(1)
      .max(10)
      .describe("Identifiants Wikidata à lire, par exemple Q42, Q90, Q935"),
    language: languageSchema.describe(
      "Langue préférée pour les libellés (défaut fr)"
    ),
  }),
});

export const wikidataPlugin: PluginDefinition = {
  createTools: () => ({
    getWikidataEntities,
    getWikidataEntity,
    searchWikidataEntities,
  }),
  manifest: manifest as PluginManifest,
};
