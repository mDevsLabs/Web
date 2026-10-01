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

const OPENALEX = "https://api.openalex.org";
const headers = contactHeaders("mAI-Web");
const MAX_AUTHORS = 12;

const openAlexAuthorSchema = z
  .object({
    cited_by_count: z.number().int().nonnegative().optional(),
    display_name: z.string().nullable().optional(),
    id: z.string().regex(/^https:\/\/openalex\.org\/A\d+$/),
    last_known_institutions: z
      .array(
        z
          .object({
            country_code: z.string().nullable().optional(),
            display_name: z.string().nullable().optional(),
          })
          .passthrough()
      )
      .nullable()
      .optional(),
    orcid: z.string().max(200).nullable().optional(),
    works_count: z.number().int().nonnegative().optional(),
  })
  .passthrough();

const authorshipSchema = z
  .object({
    author: openAlexAuthorSchema.nullable().optional(),
    author_position: z.string().nullable().optional(),
    raw_author_name: z.string().nullable().optional(),
  })
  .passthrough();

const openAlexWorkSchema = z
  .object({
    authorships: z.array(authorshipSchema).max(200).nullable().optional(),
    cited_by_count: z.number().int().nonnegative().optional(),
    doi: z.string().max(500).nullable().optional(),
    id: z.string().regex(/^https:\/\/openalex\.org\/W\d+$/),
    open_access: z
      .object({
        is_oa: z.boolean().optional(),
        oa_status: z.string().nullable().optional(),
        oa_url: z.string().max(2000).nullable().optional(),
      })
      .passthrough()
      .optional(),
    primary_location: z
      .object({
        landing_page_url: z.string().nullable().optional(),
        pdf_url: z.string().nullable().optional(),
        source: z
          .object({ display_name: z.string().nullable().optional() })
          .passthrough()
          .nullable()
          .optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    publication_year: z.number().int().nullable().optional(),
    title: z.string().nullable().optional(),
    type: z.string().nullable().optional(),
  })
  .passthrough();

const openAlexSearchSchema = z
  .object({
    meta: z
      .object({ count: z.number().int().nonnegative().optional() })
      .passthrough()
      .optional(),
    results: z.array(openAlexWorkSchema).max(100),
  })
  .passthrough();

const openAlexAuthorSearchSchema = z
  .object({
    meta: z
      .object({ count: z.number().int().nonnegative().optional() })
      .passthrough()
      .optional(),
    results: z.array(openAlexAuthorSchema).max(100),
  })
  .passthrough();

type OpenAlexWork = z.infer<typeof openAlexWorkSchema>;
type OpenAlexAuthor = z.infer<typeof openAlexAuthorSchema>;

function addPoliteContact(url: URL) {
  const email = process.env.PUBLIC_API_CONTACT_EMAIL?.trim();
  if (email) url.searchParams.set("mailto", email);
}

function workView(work: OpenAlexWork) {
  return {
    authors: (work.authorships ?? [])
      .slice(0, MAX_AUTHORS)
      .map((authorship) => ({
        id: authorship.author?.id ?? null,
        name:
          truncateText(authorship.author?.display_name, 200) ??
          truncateText(authorship.raw_author_name, 200),
        orcid: truncateText(authorship.author?.orcid, 200),
        position: authorship.author_position ?? null,
      })),
    citedBy: work.cited_by_count ?? null,
    doi: truncateText(work.doi, 300),
    id: work.id,
    isOpenAccess: work.open_access?.is_oa ?? null,
    openAccessUrl: truncateText(work.open_access?.oa_url, 1000),
    publicationYear: work.publication_year ?? null,
    title: truncateText(work.title, 500),
    type: truncateText(work.type, 100),
    url: work.id,
    venue: truncateText(work.primary_location?.source?.display_name, 300),
  };
}

function authorView(author: OpenAlexAuthor) {
  return {
    citedBy: author.cited_by_count ?? null,
    displayName: truncateText(author.display_name, 300),
    id: author.id,
    institutions: (author.last_known_institutions ?? [])
      .slice(0, 8)
      .map((institution) => ({
        countryCode: institution.country_code ?? null,
        name: truncateText(institution.display_name, 300),
      })),
    orcid: truncateText(author.orcid, 200),
    source: sourceRef(author.id, "OpenAlex — auteur"),
    worksCount: author.works_count ?? null,
  };
}

function workApiUrl(identifier: string): string {
  if (/^W\d+$/i.test(identifier)) {
    return `${OPENALEX}/works/${identifier.toUpperCase()}`;
  }
  if (identifier.startsWith("https://doi.org/")) {
    return `${OPENALEX}/works/${identifier}`;
  }
  return `${OPENALEX}/works/https://doi.org/${identifier}`;
}

const workIdentifierSchema = z
  .string()
  .trim()
  .min(6)
  .max(300)
  .refine(
    (value) =>
      /^W\d+$/i.test(value) ||
      /^10\.\d{4,9}\/[^\s?#]+$/.test(value) ||
      /^https:\/\/doi\.org\/10\.\d{4,9}\/[^\s?#]+$/.test(value),
    "Identifiant OpenAlex ou DOI invalide."
  );
const authorIdentifierSchema = z
  .string()
  .trim()
  .max(100)
  .regex(
    /^(?:A\d+|https:\/\/openalex\.org\/A\d+)$/i,
    "Identifiant d’auteur OpenAlex invalide."
  );

export const searchOpenAlexWorks = tool({
  description:
    "Recherche des travaux scientifiques indexés par OpenAlex avec auteurs, année, citations et accès ouvert.",
  execute: async ({ fromYear, limit = 10, query, toYear }) => {
    const url = new URL(`${OPENALEX}/works`);
    url.searchParams.set("search", query.trim());
    url.searchParams.set("per-page", String(limit));
    url.searchParams.set(
      "select",
      "id,title,doi,publication_year,cited_by_count,authorships,primary_location,open_access,type"
    );
    if (fromYear !== undefined || toYear !== undefined) {
      const from = fromYear ?? 1800;
      const to = toYear ?? new Date().getUTCFullYear();
      if (from > to) {
        return { error: "La première année doit précéder la dernière année." };
      }
      url.searchParams.set(
        "filter",
        `from_publication_date:${from}-01-01,to_publication_date:${to}-12-31`
      );
    }
    addPoliteContact(url);

    const result = await fetchPublicJson<unknown>(url.href, headers);
    if (!result.ok) return { error: result.error };
    const parsed = openAlexSearchSchema.safeParse(result.data);
    if (!parsed.success) {
      return { error: "Réponse de recherche OpenAlex invalide." };
    }

    return {
      source: sourceRef(url.href, "OpenAlex — recherche de travaux"),
      totalMatches: parsed.data.meta?.count ?? null,
      works: parsed.data.results.slice(0, limit).map(workView),
    };
  },
  inputSchema: z.object({
    fromYear: z.number().int().min(1800).max(2200).optional(),
    limit: z.number().int().min(1).max(25).default(10),
    query: z.string().trim().min(2).max(200),
    toYear: z.number().int().min(1800).max(2200).optional(),
  }),
});

export const getOpenAlexWork = tool({
  description:
    "Récupère une publication OpenAlex à partir de son identifiant W ou de son DOI, avec une sortie bornée.",
  execute: async ({ workId }) => {
    const url = workApiUrl(workId);
    const result = await fetchPublicJson<unknown>(url, headers);
    if (!result.ok) return { error: result.error };
    const parsed = openAlexWorkSchema.safeParse(result.data);
    if (!parsed.success) {
      return { error: "Réponse de publication OpenAlex invalide." };
    }
    return {
      source: sourceRef(parsed.data.id, "OpenAlex — publication"),
      work: workView(parsed.data),
    };
  },
  inputSchema: z.object({
    workId: workIdentifierSchema.describe(
      "Identifiant W123 ou DOI d’une publication"
    ),
  }),
});

export const searchOpenAlexAuthors = tool({
  description:
    "Recherche des auteurs et chercheurs dans OpenAlex par nom, avec institutions et nombre de publications.",
  execute: async ({ limit = 10, query }) => {
    const url = new URL(`${OPENALEX}/authors`);
    url.searchParams.set("search", query.trim());
    url.searchParams.set("per-page", String(limit));
    url.searchParams.set(
      "select",
      "id,display_name,orcid,works_count,cited_by_count,last_known_institutions"
    );
    addPoliteContact(url);

    const result = await fetchPublicJson<unknown>(url.href, headers);
    if (!result.ok) return { error: result.error };
    const parsed = openAlexAuthorSearchSchema.safeParse(result.data);
    if (!parsed.success) {
      return { error: "Réponse de recherche d’auteurs OpenAlex invalide." };
    }

    return {
      authors: parsed.data.results.slice(0, limit).map(authorView),
      source: sourceRef(url.href, "OpenAlex — recherche d’auteurs"),
      totalMatches: parsed.data.meta?.count ?? null,
    };
  },
  inputSchema: z.object({
    limit: z.number().int().min(1).max(25).default(10),
    query: z.string().trim().min(2).max(200),
  }),
});

export const getOpenAlexAuthor = tool({
  description:
    "Récupère le profil public d’un auteur OpenAlex à partir de son identifiant A.",
  execute: async ({ authorId }) => {
    const normalized = authorId.replace(/^https:\/\/openalex\.org\//i, "");
    const url = `${OPENALEX}/authors/${normalized.toUpperCase()}`;
    const result = await fetchPublicJson<unknown>(url, headers);
    if (!result.ok) return { error: result.error };
    const parsed = openAlexAuthorSchema.safeParse(result.data);
    if (!parsed.success) {
      return { error: "Réponse d’auteur OpenAlex invalide." };
    }
    return {
      author: authorView(parsed.data),
      source: sourceRef(parsed.data.id, "OpenAlex — auteur"),
    };
  },
  inputSchema: z.object({
    authorId: authorIdentifierSchema.describe(
      "Identifiant A123 ou URL OpenAlex d’un auteur"
    ),
  }),
});

export const openalexPlugin: PluginDefinition = {
  createTools: () => ({
    getOpenAlexAuthor,
    getOpenAlexWork,
    searchOpenAlexAuthors,
    searchOpenAlexWorks,
  }),
  manifest: manifest as PluginManifest,
};
