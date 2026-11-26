import { tool } from "ai";
import { z } from "zod";
import type { PluginDefinition, PluginManifest } from "../../../core/types";
import {
  contactHeaders,
  fetchPublicText,
  sourceRef,
  truncateText,
} from "../../../shared/public-api";
import manifest from "./index.json";

const ARXIV_API = "https://export.arxiv.org/api/query";
const headers = contactHeaders("mAI-Web");

function decodeXmlEntities(text: string): string {
  return text
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replace(/\s+/g, " ")
    .trim();
}

function matchTag(block: string, tag: string): string {
  const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i").exec(
    block
  );
  return match?.[1] ? decodeXmlEntities(match[1]) : "";
}

function parseEntries(xml: string) {
  const entries: Array<{
    authors: string[];
    categories: string[];
    id: string;
    pdfUrl: string;
    published: string;
    summary: string;
    title: string;
    updated: string;
    url: string;
  }> = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
  let match: RegExpExecArray | null;
  while ((match = entryRegex.exec(xml)) !== null) {
    const block = match[1] ?? "";
    const rawId = matchTag(block, "id");
    const shortId = rawId
      .replace(/^https?:\/\/arxiv\.org\/abs\//i, "")
      .replace(/v\d+$/, "");
    const title = matchTag(block, "title");
    if (!shortId || !title) continue;

    const authors = [...block.matchAll(/<author>\s*<name>([\s\S]*?)<\/name>/gi)]
      .slice(0, 12)
      .map((item) => decodeXmlEntities(item[1] ?? ""))
      .filter(Boolean);

    const categories = [...block.matchAll(/<category[^>]*term="([^"]+)"/gi)]
      .slice(0, 8)
      .map((item) => item[1] ?? "")
      .filter(Boolean);

    entries.push({
      authors,
      categories,
      id: shortId,
      pdfUrl: `https://arxiv.org/pdf/${shortId}`,
      published: matchTag(block, "published"),
      summary: truncateText(matchTag(block, "summary"), 2500) ?? "",
      title: truncateText(title, 300) ?? title,
      updated: matchTag(block, "updated"),
      url: `https://arxiv.org/abs/${shortId}`,
    });
  }
  return entries;
}

export const arxivSearchPapers = tool({
  description:
    "Recherche des articles scientifiques sur arXiv par mots-clés, auteur ou catégorie (ex. cs.AI).",
  execute: async ({ category, limit, query, sortBy }) => {
    const terms = [`all:${query.trim()}`];
    if (category?.trim()) {
      terms.push(`cat:${category.trim()}`);
    }
    const url = new URL(ARXIV_API);
    url.searchParams.set("search_query", terms.join(" AND "));
    url.searchParams.set("start", "0");
    url.searchParams.set("max_results", String(limit));
    url.searchParams.set("sortBy", sortBy);
    url.searchParams.set("sortOrder", "descending");

    const result = await fetchPublicText(url.href, headers);
    if (!result.ok) return { error: result.error };
    const papers = parseEntries(result.data).slice(0, limit);
    return {
      papers,
      source: sourceRef(url.href, "Recherche arXiv"),
      total: papers.length,
    };
  },
  inputSchema: z.object({
    category: z.string().trim().max(40).optional(),
    limit: z.number().int().min(1).max(20).default(8),
    query: z.string().trim().min(1).max(200),
    sortBy: z
      .enum(["relevance", "submittedDate", "lastUpdatedDate"])
      .default("relevance"),
  }),
});

export const arxivGetPaper = tool({
  description:
    "Récupère la fiche détaillée d'un préprint arXiv par son identifiant.",
  execute: async ({ arxivId }) => {
    const clean = arxivId
      .trim()
      .replace(/^arxiv:/i, "")
      .replace(/^https?:\/\/arxiv\.org\/(?:abs|pdf)\//i, "")
      .replace(/\.pdf$/i, "");
    if (!/^(?:\d{4}\.\d{4,5}|[a-z-]+\/\d{7})(?:v\d+)?$/i.test(clean)) {
      return { error: "Identifiant arXiv invalide (ex. 2401.12345)." };
    }
    const url = new URL(ARXIV_API);
    url.searchParams.set("id_list", clean);
    const result = await fetchPublicText(url.href, headers);
    if (!result.ok) return { error: result.error };
    const paper = parseEntries(result.data)[0];
    if (!paper) {
      return { error: `Préprint arXiv introuvable : « ${clean} ».` };
    }
    return {
      paper,
      source: sourceRef(paper.url, `arXiv:${paper.id}`),
    };
  },
  inputSchema: z.object({
    arxivId: z.string().trim().min(4).max(80),
  }),
});

export const arxivPlugin: PluginDefinition = {
  createTools: () => ({
    arxivGetPaper,
    arxivSearchPapers,
  }),
  manifest: manifest as PluginManifest,
};
