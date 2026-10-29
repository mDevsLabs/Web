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
 * Sentry en lecture seule, par jeton d'authentification.
 * Le jeton est validé sur `GET /api/0/` puis chiffré comme les autres porteurs.
 */

const descriptor = getIntegrationProvider("sentry")!;
const BASE = "https://sentry.io";

function sentryListOrganizations(deps: PluginToolDeps) {
  return tool({
    description: "Liste les organisations Sentry accessibles avec le jeton.",
    execute: async ({ maxResults }) => {
      const result = await readBearer({
        base: BASE,
        deps,
        descriptor,
        path: "/api/0/organizations/",
        providerId: "sentry",
      });
      if (!result.ok) return { error: result.error };
      const organizations = jsonRecords(result.data)
        .slice(0, maxResults)
        .map((row) => ({
          name: textField(row.name, 120),
          slug: textField(row.slug, 80),
        }));
      return {
        organizations,
        source: sourceRef(
          `${BASE}/api/0/organizations/`,
          "Organisations Sentry"
        ),
        total: organizations.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(50).default(20),
    }),
  });
}

function sentryListProjects(deps: PluginToolDeps) {
  return tool({
    description: "Liste les projets d'une organisation Sentry.",
    execute: async ({ maxResults, organization }) => {
      const result = await readBearer({
        base: BASE,
        deps,
        descriptor,
        path: `/api/0/organizations/${encodeSegment(organization)}/projects/`,
        providerId: "sentry",
      });
      if (!result.ok) return { error: result.error };
      const projects = jsonRecords(result.data)
        .slice(0, maxResults)
        .map((row) => ({
          name: textField(row.name, 120),
          platform: textField(row.platform, 40),
          slug: textField(row.slug, 80),
        }));
      return {
        projects,
        source: sourceRef(
          `${BASE}/api/0/organizations/${organization}/projects/`,
          "Projets Sentry"
        ),
        total: projects.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(50).default(20),
      organization: z.string().min(1).max(80),
    }),
  });
}

function sentryListIssues(deps: PluginToolDeps) {
  return tool({
    description: "Liste les issues récentes d'une organisation Sentry.",
    execute: async ({ maxResults, organization, query }) => {
      const result = await readBearer({
        base: BASE,
        deps,
        descriptor,
        path: `/api/0/organizations/${encodeSegment(organization)}/issues/`,
        providerId: "sentry",
        query: { limit: maxResults, query },
      });
      if (!result.ok) return { error: result.error };
      const issues = jsonRecords(result.data)
        .slice(0, maxResults)
        .map((row) => ({
          count: textField(row.count, 20),
          level: textField(row.level, 20),
          permalink: textField(row.permalink, 300),
          shortId: textField(row.shortId, 40),
          title: textField(row.title, 200),
        }));
      return {
        issues,
        source: sourceRef(
          `${BASE}/api/0/organizations/${organization}/issues/`,
          "Issues Sentry"
        ),
        total: issues.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(50).default(15),
      organization: z.string().min(1).max(80),
      query: z.string().max(120).optional(),
    }),
  });
}

export const sentryPlugin: PluginDefinition = {
  createTools: (deps) => ({
    sentryListIssues: sentryListIssues(deps),
    sentryListOrganizations: sentryListOrganizations(deps),
    sentryListProjects: sentryListProjects(deps),
  }),
  manifest: manifest as PluginManifest,
};
