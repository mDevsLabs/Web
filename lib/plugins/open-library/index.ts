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

const BASE = "https://openlibrary.org";
const headers = contactHeaders("mAI-Web");
const fields =
  "key,title,author_name,author_key,first_publish_year,edition_count,isbn,subject,cover_i";
function bookView(book: Record<string, unknown>) {
  return {
    authorIds: Array.isArray(book.author_key)
      ? book.author_key.slice(0, 8)
      : [],
    authors: Array.isArray(book.author_name)
      ? book.author_name.slice(0, 8)
      : [],
    coverId: book.cover_i ?? null,
    editions: book.edition_count ?? null,
    firstPublished: book.first_publish_year ?? null,
    id: book.key ?? null,
    isbns: Array.isArray(book.isbn) ? book.isbn.slice(0, 5) : [],
    subjects: Array.isArray(book.subject) ? book.subject.slice(0, 10) : [],
    title: truncateText(book.title, 300),
  };
}

export const searchBooks = tool({
  description: "Recherche des livres dans le catalogue public Open Library.",
  execute: async ({ limit, query }) => {
    const url = new URL(`${BASE}/search.json`);
    url.searchParams.set("q", query);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("fields", fields);
    const result = await fetchPublicJson<{
      docs?: Array<Record<string, unknown>>;
      numFound?: number;
    }>(url.href, headers);
    if (!result.ok) return { error: result.error };
    return {
      books: (result.data.docs ?? []).slice(0, limit).map(bookView),
      source: sourceRef(url.href, "Open Library"),
      totalMatches: result.data.numFound ?? null,
    };
  },
  inputSchema: z.object({
    limit: z.number().int().min(1).max(15).default(10),
    query: z.string().min(2).max(120),
  }),
});

export const searchBookByIsbn = tool({
  description: "Recherche une édition de livre par son ISBN-10 ou ISBN-13.",
  execute: async ({ isbn }) => {
    const url = new URL(`${BASE}/search.json`);
    url.searchParams.set("isbn", isbn.replaceAll("-", ""));
    url.searchParams.set("limit", "1");
    url.searchParams.set("fields", fields);
    const result = await fetchPublicJson<{
      docs?: Array<Record<string, unknown>>;
    }>(url.href, headers);
    if (!result.ok) return { error: result.error };
    const book = result.data.docs?.[0];
    return book
      ? {
          book: bookView(book),
          source: sourceRef(url.href, "Open Library ISBN"),
        }
      : { error: "Aucune édition trouvée pour cet ISBN." };
  },
  inputSchema: z.object({
    isbn: z
      .string()
      .min(10)
      .max(17)
      .regex(/^[0-9Xx-]+$/),
  }),
});

export const getBookWork = tool({
  description:
    "Récupère les détails d'une œuvre Open Library à partir de son identifiant OLID.",
  execute: async ({ workId }) => {
    const id = workId.toUpperCase();
    const url = `${BASE}/works/${id}.json`;
    const result = await fetchPublicJson<Record<string, unknown>>(url, headers);
    if (!result.ok) return { error: result.error };
    const description =
      typeof result.data.description === "string"
        ? result.data.description
        : (result.data.description as { value?: string } | undefined)?.value;
    return {
      description: truncateText(description, 3000),
      firstPublished: result.data.first_publish_date ?? null,
      id,
      source: sourceRef(url, "Open Library — œuvre"),
      subjects: Array.isArray(result.data.subjects)
        ? result.data.subjects.slice(0, 20)
        : [],
      title: truncateText(result.data.title, 300),
    };
  },
  inputSchema: z.object({ workId: z.string().regex(/^OL\d+W$/i) }),
});

export const getAuthorBooks = tool({
  description:
    "Recherche les ouvrages associés au nom d'un auteur dans Open Library.",
  execute: async ({ author, limit }) => {
    const url = new URL(`${BASE}/search.json`);
    url.searchParams.set("author", author);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("fields", fields);
    const result = await fetchPublicJson<{
      docs?: Array<Record<string, unknown>>;
      numFound?: number;
    }>(url.href, headers);
    if (!result.ok) return { error: result.error };
    return {
      author,
      books: (result.data.docs ?? []).slice(0, limit).map(bookView),
      source: sourceRef(url.href, "Open Library — auteur"),
      totalMatches: result.data.numFound ?? null,
    };
  },
  inputSchema: z.object({
    author: z.string().min(2).max(120),
    limit: z.number().int().min(1).max(15).default(10),
  }),
});

export const openLibraryPlugin: PluginDefinition = {
  createTools: () => ({
    getAuthorBooks,
    getBookWork,
    searchBookByIsbn,
    searchBooks,
  }),
  manifest: manifest as PluginManifest,
};
