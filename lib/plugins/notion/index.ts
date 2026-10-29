import { tool } from "ai";
import { z } from "zod";
import {
  getIntegrationProvider,
  NOTION_API_VERSION,
} from "@/lib/integrations/providers";
import {
  bearerFor,
  callAuthorized,
  encodeSegment,
} from "../shared/authorized-api";
import { sourceRef, truncateText } from "../shared/public-api";
import type {
  PluginDefinition,
  PluginManifest,
  PluginToolDeps,
} from "../types";
import manifest from "./index.json";

/**
 * Connecteur Notion — les pages et bases partagées avec l'intégration, rien de
 * plus. Notion n'a pas de portées OAuth : c'est l'utilisateur qui choisit, dans
 * le portail de l'intégration, les pages qu'il partage. Un outil qui demande
 * une page non partagée reçoit un 404 du fournisseur, et le message le dit.
 *
 * Les écritures (créer une page, ajouter des blocs) sont `effect: "write"` :
 * elles ne sont instanciées que dans l'Agent, où l'approbation est demandée une
 * par une. Notion n'ayant pas de portées, `writeScopes` reste vide dans le
 * descripteur : c'est la connexion elle-même qui autorise l'écriture.
 */

const descriptor = getIntegrationProvider("notion")!;
const NOTION_BASE = "https://api.notion.com/v1";

const NOTION_HEADERS = {
  Accept: "application/json",
  "Notion-Version": NOTION_API_VERSION,
};

/**
 * Notion accepte l'identifiant avec ou sans tirets ; une URL collée est
 * tolérée. Une URL de base ressemble à `…/Ma-base-<32 hex>?v=…` : on prend le
 * DERNIER identifiant de 32 caractères, jamais le nom qui le précède (ses
 * lettres forment aussi des caractères hexadécimaux par hasard).
 */
function notionId(raw: string): string | null {
  const cleaned = raw
    .trim()
    .replace(/[?#].*$/, "")
    .replace(/-/g, "");
  const match = cleaned.match(/([0-9a-fA-F]{32})(?:[^0-9a-fA-F]*)$/);
  return match?.[1] ?? null;
}

type RichText = Array<{ plain_text?: string; text?: { content?: string } }>;

function richTextToPlain(value: unknown): string {
  if (!Array.isArray(value)) {
    return "";
  }
  return (value as RichText)
    .map((item) => item.plain_text ?? item.text?.content ?? "")
    .join("")
    .trim();
}

function titleOf(page: Record<string, unknown>): string {
  // Une base de données (ou une source de données depuis l'API 2025-09-03)
  // porte son titre à la racine, pas dans `properties`.
  const directTitle = richTextToPlain(page.title);
  if (directTitle) {
    return directTitle;
  }
  const properties = page.properties as
    | Record<string, { title?: unknown; type?: string }>
    | undefined;
  if (!properties) {
    return "Sans titre";
  }
  for (const property of Object.values(properties)) {
    if (property?.type === "title" && Array.isArray(property.title)) {
      const title = richTextToPlain(property.title);
      if (title) {
        return title;
      }
    }
  }
  return "Sans titre";
}

function shapePage(page: Record<string, unknown>) {
  return {
    createdAt: page.created_time,
    id: page.id,
    lastEditedAt: page.last_edited_time,
    title: truncateText(titleOf(page), 200),
    url: page.url,
  };
}

function notionSearch(deps: PluginToolDeps) {
  return tool({
    description:
      "Cherche des pages et bases Notion partagées avec l'intégration, par titre.",
    execute: async ({ maxResults, query }) => {
      const token = await bearerFor(deps, "notion");
      if (!token.ok) return { error: token.error };
      const result = await callAuthorized<Record<string, unknown>>({
        accessToken: token.data,
        base: NOTION_BASE,
        body: JSON.stringify({
          page_size: maxResults,
          query: query ?? "",
          sort: { direction: "descending", timestamp: "last_edited_time" },
        }),
        descriptor,
        headers: NOTION_HEADERS,
        method: "POST",
        path: "/search",
        signal: deps.signal,
      });
      if (!result.ok) return { error: result.error };
      const items = Array.isArray(result.data.results)
        ? (result.data.results as Record<string, unknown>[])
        : [];
      return {
        pages: items.map((item) => ({
          ...shapePage(item),
          object: item.object === "database" ? "base de données" : "page",
        })),
        source: sourceRef(`${NOTION_BASE}/search`, "Recherche Notion"),
        total: items.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(25).default(10),
      query: z.string().max(120).optional(),
    }),
  });
}

function notionReadPage(deps: PluginToolDeps) {
  return tool({
    description:
      "Lit une page Notion : titre, propriétés essentielles et début de son contenu.",
    execute: async ({ pageId }) => {
      const id = notionId(pageId);
      if (!id) return { error: "Identifiant de page Notion invalide." };
      const token = await bearerFor(deps, "notion");
      if (!token.ok) return { error: token.error };
      const page = await callAuthorized<Record<string, unknown>>({
        accessToken: token.data,
        base: NOTION_BASE,
        descriptor,
        headers: NOTION_HEADERS,
        path: `/pages/${encodeSegment(id)}`,
        signal: deps.signal,
      });
      if (!page.ok) return { error: page.error };
      const blocks = await callAuthorized<Record<string, unknown>>({
        accessToken: token.data,
        base: NOTION_BASE,
        descriptor,
        headers: NOTION_HEADERS,
        path: `/blocks/${encodeSegment(id)}/children`,
        query: { page_size: 50 },
        signal: deps.signal,
      });
      if (!blocks.ok) return { error: blocks.error };
      const content = Array.isArray(blocks.data.results)
        ? (blocks.data.results as Record<string, unknown>[])
            .map((block) => {
              const payload = block[String(block.type)] as
                | { rich_text?: unknown; title?: unknown }
                | undefined;
              const text =
                richTextToPlain(payload?.rich_text) ||
                richTextToPlain(payload?.title);
              if (!text) return "";
              return block.type === "heading_1" ||
                block.type === "heading_2" ||
                block.type === "heading_3"
                ? `## ${text}`
                : text;
            })
            .filter(Boolean)
            .join("\n\n")
        : "";
      return {
        content: truncateText(content, 6000) ?? "",
        source: sourceRef(String(page.data.url ?? NOTION_BASE), "Page Notion"),
        title: titleOf(page.data),
        url: page.data.url,
      };
    },
    inputSchema: z.object({
      pageId: z.string().min(8).max(200),
    }),
  });
}

function notionQueryDatabase(deps: PluginToolDeps) {
  return tool({
    description:
      "Liste les entrées d'une base de données Notion, les plus récemment modifiées d'abord.",
    execute: async ({ databaseId, maxResults }) => {
      const id = notionId(databaseId);
      if (!id) return { error: "Identifiant de base Notion invalide." };
      const token = await bearerFor(deps, "notion");
      if (!token.ok) return { error: token.error };

      // Depuis l'API 2025-09-03, une base contient une ou plusieurs SOURCES de
      // données, et c'est la source qui se requête. L'ancien
      // `/v1/databases/{id}/query` est déprécié : il est conservé en dernier
      // recours pour les espaces créés avant la scission.
      const database = await callAuthorized<Record<string, unknown>>({
        accessToken: token.data,
        base: NOTION_BASE,
        descriptor,
        headers: NOTION_HEADERS,
        path: `/databases/${encodeSegment(id)}`,
        signal: deps.signal,
      });
      if (!database.ok) return { error: database.error };

      const dataSources = Array.isArray(database.data.data_sources)
        ? (database.data.data_sources as { id?: string; name?: string }[])
        : [];
      const firstSource = dataSources[0]?.id;
      const path = firstSource
        ? `/data_sources/${encodeSegment(firstSource)}/query`
        : `/databases/${encodeSegment(id)}/query`;

      const result = await callAuthorized<Record<string, unknown>>({
        accessToken: token.data,
        base: NOTION_BASE,
        body: JSON.stringify({
          page_size: maxResults,
          sorts: [{ direction: "descending", timestamp: "last_edited_time" }],
        }),
        descriptor,
        headers: NOTION_HEADERS,
        method: "POST",
        path,
        signal: deps.signal,
      });
      if (!result.ok) return { error: result.error };
      const rows = Array.isArray(result.data.results)
        ? (result.data.results as Record<string, unknown>[])
        : [];
      return {
        database: titleOf(database.data),
        entries: rows.map(shapePage),
        source: sourceRef(`${NOTION_BASE}${path}`, "Base Notion"),
        total: rows.length,
      };
    },
    inputSchema: z.object({
      databaseId: z.string().min(8).max(200),
      maxResults: z.number().int().min(1).max(50).default(15),
    }),
  });
}

function notionCreatePage(deps: PluginToolDeps) {
  return tool({
    description:
      "Crée une page Notion sous une page parente, avec un titre et un premier paragraphe.",
    execute: async ({ content, parentPageId, title }) => {
      const parent = notionId(parentPageId);
      if (!parent) return { error: "Identifiant de page parente invalide." };
      const token = await bearerFor(deps, "notion");
      if (!token.ok) return { error: token.error };
      const children = content?.trim()
        ? [
            {
              object: "block",
              paragraph: {
                rich_text: [
                  {
                    text: { content: content.trim().slice(0, 1800) },
                    type: "text",
                  },
                ],
              },
              type: "paragraph",
            },
          ]
        : [];
      const result = await callAuthorized<Record<string, unknown>>({
        accessToken: token.data,
        base: NOTION_BASE,
        body: JSON.stringify({
          children,
          parent: { page_id: parent },
          properties: {
            title: {
              title: [
                {
                  text: { content: title.trim().slice(0, 1900) },
                  type: "text",
                },
              ],
            },
          },
        }),
        descriptor,
        headers: NOTION_HEADERS,
        method: "POST",
        path: "/pages",
        signal: deps.signal,
      });
      if (!result.ok) return { error: result.error };
      return {
        page: shapePage(result.data),
        source: sourceRef(String(result.data.url ?? NOTION_BASE), "Page créée"),
      };
    },
    inputSchema: z.object({
      content: z.string().max(1800).optional(),
      parentPageId: z.string().min(8).max(200),
      title: z.string().min(1).max(200),
    }),
  });
}

function notionAppendBlocks(deps: PluginToolDeps) {
  return tool({
    description: "Ajoute des paragraphes à la fin d'une page Notion existante.",
    execute: async ({ blocks, pageId }) => {
      const id = notionId(pageId);
      if (!id) return { error: "Identifiant de page Notion invalide." };
      const token = await bearerFor(deps, "notion");
      if (!token.ok) return { error: token.error };
      const children = blocks
        .map((block) => block.trim())
        .filter(Boolean)
        .slice(0, 20)
        .map((text) => ({
          object: "block",
          paragraph: {
            rich_text: [
              { text: { content: text.slice(0, 1800) }, type: "text" },
            ],
          },
          type: "paragraph",
        }));
      if (children.length === 0) {
        return { error: "Aucun paragraphe à ajouter." };
      }
      const result = await callAuthorized<Record<string, unknown>>({
        accessToken: token.data,
        base: NOTION_BASE,
        body: JSON.stringify({ children }),
        descriptor,
        headers: NOTION_HEADERS,
        method: "PATCH",
        path: `/blocks/${encodeSegment(id)}/children`,
        signal: deps.signal,
      });
      if (!result.ok) return { error: result.error };
      return {
        added: children.length,
        source: sourceRef(
          `${NOTION_BASE}/blocks/${id}/children`,
          "Blocs Notion"
        ),
      };
    },
    inputSchema: z.object({
      blocks: z.array(z.string().min(1).max(1800)).min(1).max(20),
      pageId: z.string().min(8).max(200),
    }),
  });
}

export const notionPlugin: PluginDefinition = {
  createTools: (deps) => ({
    notionAppendBlocks: notionAppendBlocks(deps),
    notionCreatePage: notionCreatePage(deps),
    notionQueryDatabase: notionQueryDatabase(deps),
    notionReadPage: notionReadPage(deps),
    notionSearch: notionSearch(deps),
  }),
  manifest: manifest as PluginManifest,
};
