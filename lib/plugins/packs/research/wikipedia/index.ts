import { tool } from "ai";
import { z } from "zod";
import type { PluginDefinition, PluginManifest } from "../../../core/types";
import {
  contactHeaders,
  fetchPublicJson,
  sourceRef,
  truncateText,
} from "../../../shared/public-api";
import manifest from "./index.json";

const LANGS = ["fr", "en", "es", "de", "it"] as const;
const headers = contactHeaders("mAI-Web");

function wikiOrigin(lang: (typeof LANGS)[number]): string {
  return `https://${lang}.wikipedia.org`;
}

function stripHtml(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export const wikipediaSearch = tool({
  description: "Recherche des articles Wikipédia par mots-clés.",
  execute: async ({ language, limit, query }) => {
    const origin = wikiOrigin(language);
    const url = new URL(`${origin}/w/api.php`);
    url.searchParams.set("action", "query");
    url.searchParams.set("list", "search");
    url.searchParams.set("srsearch", query.trim());
    url.searchParams.set("srlimit", String(limit));
    url.searchParams.set("format", "json");
    const result = await fetchPublicJson<{
      query?: {
        search?: Array<{
          pageid?: number;
          snippet?: string;
          title?: string;
          wordcount?: number;
        }>;
      };
    }>(url.href, headers);
    if (!result.ok) return { error: result.error };
    const articles = (result.data.query?.search ?? [])
      .slice(0, limit)
      .map((item) => {
        const title = item.title ?? "";
        return {
          pageId: item.pageid ?? null,
          snippet: truncateText(stripHtml(item.snippet), 300),
          title,
          url: `${origin}/wiki/${encodeURIComponent(title.replace(/\s+/g, "_"))}`,
          wordCount: item.wordcount ?? null,
        };
      });
    return {
      articles,
      language,
      source: sourceRef(url.href, `Wikipédia (${language})`),
      total: articles.length,
    };
  },
  inputSchema: z.object({
    language: z.enum(LANGS).default("fr"),
    limit: z.number().int().min(1).max(20).default(8),
    query: z.string().trim().min(1).max(200),
  }),
});

export const wikipediaGetSummary = tool({
  description:
    "Récupère le résumé officiel d'un article Wikipédia par son titre.",
  execute: async ({ language, title }) => {
    const origin = wikiOrigin(language);
    const normalized = title.trim().replace(/\s+/g, "_");
    const url = `${origin}/api/rest_v1/page/summary/${encodeURIComponent(normalized)}`;
    const result = await fetchPublicJson<{
      content_urls?: { desktop?: { page?: string } };
      description?: string;
      extract?: string;
      title?: string;
      type?: string;
    }>(url, headers);
    if (!result.ok) return { error: result.error };
    const pageUrl =
      result.data.content_urls?.desktop?.page ??
      `${origin}/wiki/${encodeURIComponent(normalized)}`;
    return {
      description: truncateText(result.data.description, 300),
      extract: truncateText(result.data.extract, 4000),
      language,
      source: sourceRef(pageUrl, result.data.title ?? title),
      title: result.data.title ?? title,
      type: result.data.type ?? "standard",
      url: pageUrl,
    };
  },
  inputSchema: z.object({
    language: z.enum(LANGS).default("fr"),
    title: z.string().trim().min(1).max(200),
  }),
});

export const wikipediaGetArticleContent = tool({
  description:
    "Lit le texte brut et les sections d'un article Wikipédia (sortie bornée).",
  execute: async ({ language, title }) => {
    const origin = wikiOrigin(language);
    const url = new URL(`${origin}/w/api.php`);
    url.searchParams.set("action", "query");
    url.searchParams.set("prop", "extracts");
    url.searchParams.set("explaintext", "1");
    url.searchParams.set("exchars", "12000");
    url.searchParams.set("titles", title.trim());
    url.searchParams.set("redirects", "1");
    url.searchParams.set("format", "json");
    const result = await fetchPublicJson<{
      query?: {
        pages?: Record<
          string,
          {
            extract?: string;
            missing?: string;
            pageid?: number;
            title?: string;
          }
        >;
      };
    }>(url.href, headers);
    if (!result.ok) return { error: result.error };
    const pages = Object.values(result.data.query?.pages ?? {});
    const page = pages[0];
    if (!page || "missing" in page) {
      return { error: `Article Wikipédia introuvable : « ${title} ».` };
    }
    const resolvedTitle = page.title ?? title;
    const pageUrl = `${origin}/wiki/${encodeURIComponent(resolvedTitle.replace(/\s+/g, "_"))}`;
    return {
      content: truncateText(page.extract, 12_000) ?? "",
      language,
      source: sourceRef(pageUrl, resolvedTitle),
      title: resolvedTitle,
      url: pageUrl,
    };
  },
  inputSchema: z.object({
    language: z.enum(LANGS).default("fr"),
    title: z.string().trim().min(1).max(200),
  }),
});

export const wikipediaPlugin: PluginDefinition = {
  createTools: () => ({
    wikipediaGetArticleContent,
    wikipediaGetSummary,
    wikipediaSearch,
  }),
  manifest: manifest as PluginManifest,
};
