import { tool } from "ai";
import { z } from "zod";
import { getIntegrationProvider } from "@/lib/integrations/providers";
import { encodeSegment } from "../shared/authorized-api";
import { jsonRecords, readBearer, textField } from "../shared/bearer-read";
import { sourceRef } from "../shared/public-api";
import type {
  PluginDefinition,
  PluginManifest,
  PluginToolDeps,
} from "../types";
import manifest from "./index.json";

/**
 * PostHog en lecture seule, hôte US fixé.
 * Une clé personnelle ne dit pas la région : l'UE n'est pas interrogée.
 */

const descriptor = getIntegrationProvider("posthog")!;
const BASE = "https://us.posthog.com";

function posthogListProjects(deps: PluginToolDeps) {
  return tool({
    description: "Liste les projets PostHog du compte sur l'hôte US.",
    execute: async ({ maxResults }) => {
      const result = await readBearer({
        base: BASE,
        deps,
        descriptor,
        path: "/api/projects/",
        providerId: "posthog",
        query: { limit: maxResults },
      });
      if (!result.ok) return { error: result.error };
      const projects = jsonRecords(result.data, "results")
        .slice(0, maxResults)
        .map((row) => ({
          id: textField(row.id, 40),
          name: textField(row.name, 120),
        }));
      return {
        projects,
        source: sourceRef(`${BASE}/api/projects/`, "Projets PostHog"),
        total: projects.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(50).default(20),
    }),
  });
}

function posthogListFlags(deps: PluginToolDeps) {
  return tool({
    description: "Liste les feature flags d'un projet PostHog.",
    execute: async ({ maxResults, projectId }) => {
      const result = await readBearer({
        base: BASE,
        deps,
        descriptor,
        path: `/api/projects/${encodeSegment(projectId)}/feature_flags/`,
        providerId: "posthog",
        query: { limit: maxResults },
      });
      if (!result.ok) return { error: result.error };
      const flags = jsonRecords(result.data, "results")
        .slice(0, maxResults)
        .map((row) => ({
          active: row.active === true,
          key: textField(row.key, 80),
          name: textField(row.name, 120),
        }));
      return {
        flags,
        source: sourceRef(
          `${BASE}/api/projects/${projectId}/feature_flags/`,
          "Feature flags PostHog"
        ),
        total: flags.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(50).default(20),
      projectId: z.string().min(1).max(40),
    }),
  });
}

export const posthogPlugin: PluginDefinition = {
  createTools: (deps) => ({
    posthogListFlags: posthogListFlags(deps),
    posthogListProjects: posthogListProjects(deps),
  }),
  manifest: manifest as PluginManifest,
};
