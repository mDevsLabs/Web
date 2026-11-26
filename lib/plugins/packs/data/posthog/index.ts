import { tool } from "ai";
import { z } from "zod";
import { getIntegrationProvider } from "@/lib/integrations/providers";
import { readStoredField } from "@/lib/integrations/token-fields";
import type {
  PluginDefinition,
  PluginManifest,
  PluginToolDeps,
} from "../../../core/types";
import { encodeSegment } from "../../../shared/authorized-api";
import {
  callProvider,
  jsonRecords,
  loadCredential,
  textField,
} from "../../../shared/bearer-read";
import { sourceRef, truncateText } from "../../../shared/public-api";
import manifest from "./index.json";

const descriptor = getIntegrationProvider("posthog")!;

async function posthogCall(
  deps: PluginToolDeps,
  path: string,
  query?: Record<string, string | number | undefined>
) {
  const cred = await loadCredential(deps, "posthog");
  if (!cred.ok) {
    return cred;
  }
  const region =
    readStoredField(cred.data.fields, "region", "posthog-region") ?? "us";
  const base = `https://${region}.posthog.com`;
  const result = await callProvider({
    base,
    descriptor,
    path,
    query,
    signal: deps.signal,
    token: cred.data.token,
  });
  return { ...result, base };
}

function posthogListProjects(deps: PluginToolDeps) {
  return tool({
    description: "Liste les projets PostHog du compte.",
    execute: async ({ maxResults }) => {
      const result = await posthogCall(deps, "/api/projects/", {
        limit: maxResults,
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
        source: sourceRef(`${result.base}/api/projects/`, "Projets PostHog"),
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
      const result = await posthogCall(
        deps,
        `/api/projects/${encodeSegment(projectId)}/feature_flags/`,
        { limit: maxResults }
      );
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
          `${result.base}/api/projects/${projectId}/feature_flags/`,
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

function posthogListInsights(deps: PluginToolDeps) {
  return tool({
    description: "Liste les insights analytiques d'un projet PostHog.",
    execute: async ({ maxResults, projectId }) => {
      const result = await posthogCall(
        deps,
        `/api/projects/${encodeSegment(projectId)}/insights/`,
        { limit: maxResults }
      );
      if (!result.ok) return { error: result.error };
      const insights = jsonRecords(result.data, "results")
        .slice(0, maxResults)
        .map((row) => ({
          description: truncateText(row.description, 200),
          id: textField(row.id, 40),
          lastModifiedAt: textField(row.last_modified_at, 40),
          name: textField(row.name ?? row.derived_name, 160),
          shortId: textField(row.short_id, 40),
        }));
      return {
        insights,
        source: sourceRef(
          `${result.base}/api/projects/${projectId}/insights/`,
          "Insights PostHog"
        ),
        total: insights.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(50).default(15),
      projectId: z.string().min(1).max(40),
    }),
  });
}

export const posthogPlugin: PluginDefinition = {
  createTools: (deps) => ({
    posthogListFlags: posthogListFlags(deps),
    posthogListInsights: posthogListInsights(deps),
    posthogListProjects: posthogListProjects(deps),
  }),
  manifest: manifest as PluginManifest,
};
