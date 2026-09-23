import { tool } from "ai";
import { z } from "zod";
import { contactHeaders, fetchPublicJson, sourceRef, truncateText } from "../shared/public-api";
import type { PluginDefinition, PluginManifest } from "../types";
import manifest from "./index.json";

const BASE = "https://api.crossref.org";
const headers = contactHeaders("mAI-Web");
type CrossrefWork = Record<string, unknown>;
type CrossrefMessage = { items?: CrossrefWork[]; "total-results"?: number };
function titleOf(work: CrossrefWork): string | null {
  return Array.isArray(work.title) ? truncateText(work.title[0], 350) : null;
}
function workView(work: CrossrefWork) {
  const authors = Array.isArray(work.author) ? work.author.slice(0, 8).map((item) => {
    const author = item as { family?: string; given?: string; ORCID?: string };
    return { name: [author.given, author.family].filter(Boolean).join(" "), orcid: author.ORCID ?? null };
  }) : [];
  const dateParts = (work.published as { "date-parts"?: number[][] } | undefined)?.["date-parts"]?.[0];
  return {
    title: titleOf(work),
    doi: work.DOI ?? null,
    type: work.type ?? null,
    publishedYear: dateParts?.[0] ?? null,
    journal: Array.isArray(work["container-title"]) ? work["container-title"][0] : null,
    authors,
    url: work.URL ?? (work.DOI ? `https://doi.org/${work.DOI}` : null),
    abstract: truncateText(work.abstract, 2_000),
    citations: work["is-referenced-by-count"] ?? null,
  };
}
function crossrefUrl(endpoint: string, query: Record<string, string>) {
  const url = new URL(`${BASE}${endpoint}`);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  const email = process.env.PUBLIC_API_CONTACT_EMAIL?.trim();
  if (email) url.searchParams.set("mailto", email);
  return url;
}

export const searchPublications = tool({
  description: "Recherche des publications scientifiques et DOI à partir d'un sujet ou d'une citation.",
  inputSchema: z.object({ limit: z.number().int().min(1).max(15).default(10), query: z.string().min(2).max(200) }),
  execute: async ({ limit, query }) => {
    const url = crossrefUrl("/works", { "query.bibliographic": query, rows: String(limit), select: "DOI,title,type,published,container-title,author,URL,is-referenced-by-count" });
    const result = await fetchPublicJson<{ message?: CrossrefMessage }>(url.href, headers);
    if (!result.ok) return { error: result.error };
    const message = result.data.message;
    return { publications: (message?.items ?? []).slice(0, limit).map(workView), totalMatches: message?.["total-results"] ?? null, source: sourceRef(url.href, "Crossref") };
  },
});

export const getPublicationByDoi = tool({
  description: "Récupère les métadonnées d'une publication à partir d'un DOI.",
  inputSchema: z.object({ doi: z.string().min(5).max(180).regex(/^10\.\d{4,9}\/\S+$/) }),
  execute: async ({ doi }) => {
    const doiPath = doi.split("/").map(encodeURIComponent).join("/");
    const url = `${BASE}/works/${doiPath}`;
    const result = await fetchPublicJson<{ message?: CrossrefWork }>(url, headers);
    if (!result.ok) return { error: result.error };
    return { publication: workView(result.data.message ?? {}), source: sourceRef(`https://doi.org/${doi}`, "DOI / Crossref") };
  },
});

export const searchAuthorPublications = tool({
  description: "Recherche des publications Crossref associées à un auteur.",
  inputSchema: z.object({ author: z.string().min(2).max(120), limit: z.number().int().min(1).max(15).default(10) }),
  execute: async ({ author, limit }) => {
    const url = crossrefUrl("/works", { "query.author": author, rows: String(limit), select: "DOI,title,type,published,container-title,author,URL,is-referenced-by-count" });
    const result = await fetchPublicJson<{ message?: CrossrefMessage }>(url.href, headers);
    if (!result.ok) return { error: result.error };
    const message = result.data.message;
    return { author, publications: (message?.items ?? []).slice(0, limit).map(workView), totalMatches: message?.["total-results"] ?? null, source: sourceRef(url.href, "Crossref — auteur") };
  },
});

export const searchJournals = tool({
  description: "Recherche des revues académiques dans le registre Crossref.",
  inputSchema: z.object({ limit: z.number().int().min(1).max(15).default(10), query: z.string().min(2).max(120) }),
  execute: async ({ limit, query }) => {
    const url = crossrefUrl("/journals", { query, rows: String(limit), select: "ISSN,title,publisher,subjects,counts" });
    const result = await fetchPublicJson<{ message?: { items?: Array<Record<string, unknown>>; "total-results"?: number } }>(url.href, headers);
    if (!result.ok) return { error: result.error };
    const message = result.data.message;
    const journals = (message?.items ?? []).slice(0, limit).map((journal) => ({
      title: Array.isArray(journal.title) ? journal.title[0] : journal.title,
      issn: Array.isArray(journal.ISSN) ? journal.ISSN.slice(0, 4) : [],
      publisher: truncateText(journal.publisher, 200),
      works: (journal.counts as { "total-dois"?: number } | undefined)?.["total-dois"] ?? null,
    }));
    return { journals, totalMatches: message?.["total-results"] ?? null, source: sourceRef(url.href, "Crossref — revues") };
  },
});

export const crossrefPlugin: PluginDefinition = {
  createTools: () => ({ searchPublications, getPublicationByDoi, searchAuthorPublications, searchJournals }),
  manifest: manifest as PluginManifest,
};
