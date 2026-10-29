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
 * Zapier ne délivre pas de jeton permanent : l'utilisateur colle un jeton
 * d'accès, qui expire. Activer un Zap lancerait des automatisations ; ce
 * n'est pas exposé.
 */

const descriptor = getIntegrationProvider("zapier")!;
const BASE = "https://api.zapier.com";

function zapierListZaps(deps: PluginToolDeps) {
  return tool({
    description: "Liste les Zaps accessibles avec le jeton d'accès.",
    execute: async ({ maxResults }) => {
      const cred = await loadCredential(deps, "zapier");
      if (!cred.ok) {
        return { error: cred.error };
      }
      const result = await callProvider({
        base: BASE,
        descriptor,
        path: "/v2/zaps",
        query: { limit: maxResults },
        signal: deps.signal,
        token: cred.data.token,
      });
      if (!result.ok) {
        return { error: result.error };
      }
      const rows = jsonRecords(result.data, "data");
      const fallback =
        rows.length > 0 ? rows : jsonRecords(result.data, "results");
      const zaps = fallback.slice(0, maxResults).map((row) => ({
        id: textField(row.id, 40),
        status: textField(row.status ?? row.state, 40),
        title: textField(row.title ?? row.name, 160),
      }));
      return {
        source: sourceRef(`${BASE}/v2/zaps`, "Zaps"),
        total: zaps.length,
        zaps,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(20).default(10),
    }),
  });
}

export const zapierPlugin: PluginDefinition = {
  createTools: (deps) => ({
    zapierListZaps: zapierListZaps(deps),
  }),
  manifest: manifest as PluginManifest,
};
