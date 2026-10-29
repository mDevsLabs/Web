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
 * SonarCloud : lecture des projets et des issues. Le commentaire est une
 * écriture, donc réservé à l'Agent après approbation.
 */

const descriptor = getIntegrationProvider("sonarcloud")!;
const BASE = "https://sonarcloud.io";

function issueKey(value: string): string | null {
  return /^[A-Za-z0-9:._-]{1,200}$/.test(value) ? value : null;
}

async function sonar(
  deps: PluginToolDeps,
  path: string,
  init?: {
    body?: string;
    headers?: Record<string, string>;
    method?: "GET" | "POST";
    query?: Record<string, string | number | undefined>;
  }
) {
  const cred = await loadCredential(deps, "sonarcloud");
  if (!cred.ok) {
    return cred;
  }
  return callProvider({
    base: BASE,
    descriptor,
    path,
    signal: deps.signal,
    token: cred.data.token,
    ...init,
  });
}

function sonarListProjects(deps: PluginToolDeps) {
  return tool({
    description: "Liste les projets SonarCloud accessibles avec le jeton.",
    execute: async ({ maxResults }) => {
      const result = await sonar(deps, "/api/components/search", {
        query: { ps: maxResults, qualifiers: "TRK" },
      });
      if (!result.ok) {
        return { error: result.error };
      }
      const projects = jsonRecords(result.data, "components")
        .slice(0, maxResults)
        .map((row) => ({
          key: textField(row.key, 200),
          name: textField(row.name, 160),
        }));
      return {
        projects,
        source: sourceRef(
          `${BASE}/api/components/search`,
          "Projets SonarCloud"
        ),
        total: projects.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(20).default(10),
    }),
  });
}

function sonarSearchIssues(deps: PluginToolDeps) {
  return tool({
    description: "Liste les issues SonarCloud, éventuellement d'un projet.",
    execute: async ({ maxResults, projectKey }) => {
      const key = projectKey ? issueKey(projectKey) : null;
      if (projectKey && !key) {
        return { error: "Clé de projet SonarCloud invalide." };
      }
      const result = await sonar(deps, "/api/issues/search", {
        query: {
          componentKeys: key ?? undefined,
          ps: maxResults,
        },
      });
      if (!result.ok) {
        return { error: result.error };
      }
      const issues = jsonRecords(result.data, "issues")
        .slice(0, maxResults)
        .map((row) => ({
          key: textField(row.key, 80),
          message: textField(row.message, 240),
          severity: textField(row.severity, 20),
          status: textField(row.status, 20),
        }));
      return {
        issues,
        source: sourceRef(`${BASE}/api/issues/search`, "Issues SonarCloud"),
        total: issues.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(20).default(10),
      projectKey: z.string().trim().max(200).optional(),
    }),
  });
}

function sonarCommentIssue(deps: PluginToolDeps) {
  return tool({
    description: "Ajoute un commentaire sur une issue SonarCloud.",
    execute: async ({ issue, text }) => {
      const key = issueKey(issue);
      if (!key) {
        return { error: "Identifiant d'issue SonarCloud invalide." };
      }
      const result = await sonar(deps, "/api/issues/add_comment", {
        body: new URLSearchParams({ issue: key, text }).toString(),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        method: "POST",
      });
      if (!result.ok) {
        return { error: result.error };
      }
      return {
        commented: true,
        issue: key,
        source: sourceRef(
          `${BASE}/api/issues/add_comment`,
          "Commentaire SonarCloud"
        ),
      };
    },
    inputSchema: z.object({
      issue: z.string().trim().min(1).max(200),
      text: z.string().trim().min(1).max(1000),
    }),
  });
}

export const sonarcloudPlugin: PluginDefinition = {
  createTools: (deps) => ({
    sonarCommentIssue: sonarCommentIssue(deps),
    sonarListProjects: sonarListProjects(deps),
    sonarSearchIssues: sonarSearchIssues(deps),
  }),
  manifest: manifest as PluginManifest,
};
