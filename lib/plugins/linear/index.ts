import { tool } from "ai";
import { z } from "zod";
import { getIntegrationProvider } from "@/lib/integrations/providers";
import { jsonRecords, readBearer, textField } from "../shared/bearer-read";
import { sourceRef } from "../shared/public-api";
import type {
  PluginDefinition,
  PluginManifest,
  PluginToolDeps,
} from "../types";
import manifest from "./index.json";

/**
 * Linear en lecture seule, via la clé personnelle et l'API GraphQL.
 * Aucune mutation n'est exposée : créer une issue reste une action humaine.
 */

const descriptor = getIntegrationProvider("linear")!;
const BASE = "https://api.linear.app";

function linearQuery(
  deps: PluginToolDeps,
  query: string,
  variables: Record<string, string | number>
) {
  return readBearer({
    base: BASE,
    body: JSON.stringify({ query, variables }),
    deps,
    descriptor,
    headers: { "Content-Type": "application/json" },
    method: "POST",
    path: "/graphql",
    providerId: "linear",
  });
}

function linearListTeams(deps: PluginToolDeps) {
  return tool({
    description: "Liste les équipes Linear du compte.",
    execute: async ({ maxResults }) => {
      const result = await linearQuery(
        deps,
        "query Teams($first: Int) { teams(first: $first) { nodes { id name key } } }",
        { first: maxResults }
      );
      if (!result.ok) return { error: result.error };
      const teams = jsonRecords(result.data, "data.teams.nodes")
        .slice(0, maxResults)
        .map((row) => ({
          id: textField(row.id, 80),
          key: textField(row.key, 20),
          name: textField(row.name, 120),
        }));
      return {
        source: sourceRef(`${BASE}/graphql`, "Équipes Linear"),
        teams,
        total: teams.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(50).default(20),
    }),
  });
}

function linearListIssues(deps: PluginToolDeps) {
  return tool({
    description:
      "Liste les issues Linear récentes, filtrables par un mot du titre.",
    execute: async ({ maxResults, search }) => {
      const term = search?.trim();
      const query = term
        ? "query Issues($first: Int, $term: String) { issues(first: $first, filter: { title: { containsIgnoreCase: $term } }) { nodes { id identifier title url state { name } } } }"
        : "query Issues($first: Int) { issues(first: $first) { nodes { id identifier title url state { name } } } }";
      const result = await linearQuery(deps, query, {
        first: maxResults,
        ...(term ? { term } : {}),
      });
      if (!result.ok) return { error: result.error };
      const issues = jsonRecords(result.data, "data.issues.nodes")
        .slice(0, maxResults)
        .map((row) => {
          const state = row.state as { name?: unknown } | undefined;
          return {
            id: textField(row.id, 80),
            identifier: textField(row.identifier, 20),
            state: textField(state?.name, 40),
            title: textField(row.title, 200),
            url: textField(row.url, 300),
          };
        });
      return {
        issues,
        source: sourceRef(`${BASE}/graphql`, "Issues Linear"),
        total: issues.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(50).default(15),
      search: z.string().max(80).optional(),
    }),
  });
}

export const linearPlugin: PluginDefinition = {
  createTools: (deps) => ({
    linearListIssues: linearListIssues(deps),
    linearListTeams: linearListTeams(deps),
  }),
  manifest: manifest as PluginManifest,
};
