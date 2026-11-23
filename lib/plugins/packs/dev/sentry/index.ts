import { tool } from "ai";
import { z } from "zod";
import { getIntegrationProvider } from "@/lib/integrations/providers";
import type {
  PluginDefinition,
  PluginManifest,
  PluginToolDeps,
} from "../../../core/types";
import { encodeSegment } from "../../../shared/authorized-api";
import {
  asRecord,
  jsonRecords,
  readBearer,
  textField,
} from "../../../shared/bearer-read";
import { sourceRef, truncateText } from "../../../shared/public-api";
import manifest from "./index.json";

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
          id: textField(row.id, 40),
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

function sentryGetIssue(deps: PluginToolDeps) {
  return tool({
    description:
      "Lit le détail d'une issue Sentry et le contexte de son dernier événement.",
    execute: async ({ issueId }) => {
      const id = encodeSegment(issueId);
      const [issueRes, eventRes] = await Promise.all([
        readBearer({
          base: BASE,
          deps,
          descriptor,
          path: `/api/0/issues/${id}/`,
          providerId: "sentry",
        }),
        readBearer({
          base: BASE,
          deps,
          descriptor,
          path: `/api/0/issues/${id}/events/latest/`,
          providerId: "sentry",
        }),
      ]);
      if (!issueRes.ok) return { error: issueRes.error };
      const issue = asRecord(issueRes.data);
      const latest = eventRes.ok ? asRecord(eventRes.data) : null;
      return {
        issue: {
          count: textField(issue?.count, 20),
          culprit: textField(issue?.culprit, 200),
          firstSeen: textField(issue?.firstSeen, 40),
          id: textField(issue?.id, 40),
          lastSeen: textField(issue?.lastSeen, 40),
          level: textField(issue?.level, 20),
          permalink: textField(issue?.permalink, 300),
          shortId: textField(issue?.shortId, 40),
          status: textField(issue?.status, 30),
          title: textField(issue?.title, 240),
        },
        latestEvent: latest
          ? {
              dateCreated: textField(latest.dateCreated, 40),
              eventID: textField(latest.eventID, 64),
              message: truncateText(latest.message, 1000),
              tags: jsonRecords(latest, "tags")
                .slice(0, 12)
                .map((tag) => ({
                  key: textField(tag.key, 40),
                  value: textField(tag.value, 120),
                })),
            }
          : null,
        source: sourceRef(
          textField(issue?.permalink, 300) ?? `${BASE}/api/0/issues/${id}/`,
          textField(issue?.shortId, 40) ?? "Issue Sentry"
        ),
      };
    },
    inputSchema: z.object({
      issueId: z
        .string()
        .trim()
        .regex(/^\d{1,30}$/, "Identifiant numérique d'issue Sentry attendu."),
    }),
  });
}

export const sentryPlugin: PluginDefinition = {
  createTools: (deps) => ({
    sentryGetIssue: sentryGetIssue(deps),
    sentryListIssues: sentryListIssues(deps),
    sentryListOrganizations: sentryListOrganizations(deps),
    sentryListProjects: sentryListProjects(deps),
  }),
  manifest: manifest as PluginManifest,
};
