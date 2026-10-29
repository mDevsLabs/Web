import { tool } from "ai";
import { z } from "zod";
import { getIntegrationProvider } from "@/lib/integrations/providers";
import {
  callProvider,
  jsonRecords,
  loadCredential,
  textField,
} from "../shared/bearer-read";
import { sourceRef } from "../shared/public-api";
import type {
  PluginDefinition,
  PluginManifest,
  PluginToolDeps,
} from "../types";
import manifest from "./index.json";

/**
 * Brave Search est une API de consultation : le jeton ouvre la recherche web
 * et les actualités, rien n'est publié chez Brave.
 */

const descriptor = getIntegrationProvider("brave")!;
const BASE = "https://api.search.brave.com";

function shapeHit(row: Record<string, unknown>) {
  return {
    description: textField(row.description, 240),
    title: textField(row.title, 180),
    url: textField(row.url, 400),
  };
}

async function search(
  deps: PluginToolDeps,
  path: string,
  query: string,
  count: number
) {
  const cred = await loadCredential(deps, "brave");
  if (!cred.ok) {
    return cred;
  }
  return callProvider({
    auth: { kind: "header", name: "X-Subscription-Token" },
    base: BASE,
    descriptor,
    path,
    query: { count, q: query },
    signal: deps.signal,
    token: cred.data.token,
  });
}

function braveWebSearch(deps: PluginToolDeps) {
  return tool({
    description: "Recherche web Brave : titres, adresses et extraits.",
    execute: async ({ count, query }) => {
      const result = await search(deps, "/res/v1/web/search", query, count);
      if (!result.ok) {
        return { error: result.error };
      }
      const payload = result.data as { web?: { results?: unknown } };
      const hits = jsonRecords(payload.web?.results)
        .slice(0, count)
        .map(shapeHit);
      return {
        results: hits,
        source: sourceRef(`${BASE}/res/v1/web/search`, "Recherche Brave"),
        total: hits.length,
      };
    },
    inputSchema: z.object({
      count: z.number().int().min(1).max(10).default(5),
      query: z.string().trim().min(1).max(200),
    }),
  });
}

function braveNewsSearch(deps: PluginToolDeps) {
  return tool({
    description: "Actualités Brave pour une requête.",
    execute: async ({ count, query }) => {
      const result = await search(deps, "/res/v1/news/search", query, count);
      if (!result.ok) {
        return { error: result.error };
      }
      const payload = result.data as { results?: unknown };
      const hits = jsonRecords(payload.results).slice(0, count).map(shapeHit);
      return {
        results: hits,
        source: sourceRef(`${BASE}/res/v1/news/search`, "Actualités Brave"),
        total: hits.length,
      };
    },
    inputSchema: z.object({
      count: z.number().int().min(1).max(10).default(5),
      query: z.string().trim().min(1).max(200),
    }),
  });
}

export const bravePlugin: PluginDefinition = {
  createTools: (deps) => ({
    braveNewsSearch: braveNewsSearch(deps),
    braveWebSearch: braveWebSearch(deps),
  }),
  manifest: manifest as PluginManifest,
};
