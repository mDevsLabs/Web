import { tool } from "ai";
import { z } from "zod";
import { getIntegrationProvider } from "@/lib/integrations/providers";
import {
  hasControlCharacter,
  readStoredField,
} from "@/lib/integrations/token-fields";
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
 * Jira Cloud : le site et l'e-mail viennent du coffre, le jeton sert de mot
 * de passe Basic. Le modèle ne choisit pas l'hôte.
 */

const descriptor = getIntegrationProvider("jira")!;
const RECONNECT =
  "Connexion Jira incomplète. Enregistrez à nouveau le jeton depuis la fiche du plugin.";

function projectKey(value: string): string | null {
  const key = value.trim().toUpperCase();
  return /^[A-Z][A-Z0-9]{1,9}$/.test(key) ? key : null;
}

async function jira(
  deps: PluginToolDeps,
  path: string,
  init?: {
    body?: string;
    method?: "GET" | "POST";
    query?: Record<string, string | number | undefined>;
  }
) {
  const cred = await loadCredential(deps, "jira");
  if (!cred.ok) {
    return cred;
  }
  const site = readStoredField(cred.data.fields, "site", "jira-site");
  const email = readStoredField(cred.data.fields, "email", "email");
  if (!site || !email) {
    return { error: RECONNECT, ok: false as const };
  }
  return callProvider({
    auth: { kind: "basic", userField: "email" },
    base: `https://${site}`,
    descriptor,
    fields: { email },
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    path,
    signal: deps.signal,
    token: cred.data.token,
    ...init,
  });
}

function jiraListProjects(deps: PluginToolDeps) {
  return tool({
    description: "Liste les projets Jira Cloud du site connecté.",
    execute: async ({ maxResults }) => {
      const result = await jira(deps, "/rest/api/3/project/search", {
        query: { maxResults },
      });
      if (!result.ok) {
        return { error: result.error };
      }
      const projects = jsonRecords(result.data, "values")
        .slice(0, maxResults)
        .map((row) => ({
          key: textField(row.key, 12),
          name: textField(row.name, 120),
        }));
      return {
        projects,
        source: sourceRef(
          "https://api.atlassian.com/jira/project/search",
          "Projets Jira"
        ),
        total: projects.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(20).default(10),
    }),
  });
}

function jiraSearchIssues(deps: PluginToolDeps) {
  return tool({
    description: "Cherche des tickets Jira avec une requête JQL courte.",
    execute: async ({ jql, maxResults }) => {
      const query = (jql ?? "updated >= -30d order by updated DESC").trim();
      if (
        hasControlCharacter(query) ||
        query.length < 3 ||
        query.length > 180
      ) {
        return { error: "Requête JQL trop courte ou trop longue." };
      }
      const result = await jira(deps, "/rest/api/3/search/jql", {
        query: { fields: "summary,status", jql: query, maxResults },
      });
      if (!result.ok) {
        return { error: result.error };
      }
      const issues = jsonRecords(result.data, "issues")
        .slice(0, maxResults)
        .map((row) => {
          const fields = row.fields as
            | { status?: { name?: unknown }; summary?: unknown }
            | undefined;
          return {
            key: textField(row.key, 20),
            status: textField(fields?.status?.name, 40),
            summary: textField(fields?.summary, 200),
          };
        });
      return {
        issues,
        source: sourceRef(
          "https://api.atlassian.com/jira/search",
          "Tickets Jira"
        ),
        total: issues.length,
      };
    },
    inputSchema: z.object({
      jql: z.string().trim().max(180).optional(),
      maxResults: z.number().int().min(1).max(20).default(10),
    }),
  });
}

function jiraCreateIssue(deps: PluginToolDeps) {
  return tool({
    description: "Crée un ticket Jira dans un projet du site connecté.",
    execute: async ({ description, issueType, project, summary }) => {
      const key = projectKey(project);
      if (!key) {
        return { error: "Clé de projet Jira invalide." };
      }
      const result = await jira(deps, "/rest/api/3/issue", {
        body: JSON.stringify({
          fields: {
            description: {
              content: [
                {
                  content: [{ text: description ?? summary, type: "text" }],
                  type: "paragraph",
                },
              ],
              type: "doc",
              version: 1,
            },
            issuetype: { name: issueType },
            project: { key },
            summary,
          },
        }),
        method: "POST",
      });
      if (!result.ok) {
        return { error: result.error };
      }
      const payload = result.data as { id?: unknown; key?: unknown };
      return {
        created: true,
        id: textField(payload.id, 20),
        key: textField(payload.key, 20),
        source: sourceRef(
          "https://api.atlassian.com/jira/issue",
          "Ticket Jira"
        ),
      };
    },
    inputSchema: z.object({
      description: z.string().trim().max(2000).optional(),
      issueType: z.string().trim().min(1).max(40).default("Task"),
      project: z.string().trim().min(2).max(10),
      summary: z.string().trim().min(1).max(200),
    }),
  });
}

export const jiraPlugin: PluginDefinition = {
  createTools: (deps) => ({
    jiraCreateIssue: jiraCreateIssue(deps),
    jiraListProjects: jiraListProjects(deps),
    jiraSearchIssues: jiraSearchIssues(deps),
  }),
  manifest: manifest as PluginManifest,
};
