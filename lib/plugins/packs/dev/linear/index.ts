import { tool } from "ai";
import { z } from "zod";
import { getIntegrationProvider } from "@/lib/integrations/providers";
import type {
  PluginDefinition,
  PluginManifest,
  PluginToolDeps,
} from "../../../core/types";
import {
  asRecord,
  jsonRecords,
  readBearer,
  textField,
} from "../../../shared/bearer-read";
import { sourceRef, truncateText } from "../../../shared/public-api";
import manifest from "./index.json";

const descriptor = getIntegrationProvider("linear")!;
const BASE = "https://api.linear.app";

async function linearQuery(
  deps: PluginToolDeps,
  query: string,
  variables: Record<string, string | number>
) {
  const result = await readBearer({
    base: BASE,
    body: JSON.stringify({ query, variables }),
    deps,
    descriptor,
    headers: { "Content-Type": "application/json" },
    method: "POST",
    path: "/graphql",
    providerId: "linear",
  });
  if (!result.ok) {
    return result;
  }
  const errors = jsonRecords(result.data, "errors");
  if (errors.length > 0) {
    const message = textField(errors[0]?.message, 200) ?? "Erreur Linear.";
    return { error: message, ok: false as const };
  }
  return result;
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

function linearGetIssue(deps: PluginToolDeps) {
  return tool({
    description: "Lit le détail complet d'une issue Linear (ex. ENG-123).",
    execute: async ({ id }) => {
      const result = await linearQuery(
        deps,
        "query Issue($id: String!) { issue(id: $id) { id identifier title description priorityLabel url state { name } assignee { name } comments(first: 10) { nodes { body user { name } createdAt } } } }",
        { id: id.trim() }
      );
      if (!result.ok) return { error: result.error };
      const record = asRecord(result.data);
      const data = asRecord(record?.data);
      const issue = asRecord(data?.issue);
      if (!issue) {
        return { error: `Issue Linear introuvable : « ${id} ».` };
      }
      const state = asRecord(issue.state);
      const assignee = asRecord(issue.assignee);
      const comments = jsonRecords(issue, "comments.nodes").map((comment) => ({
        author: textField(asRecord(comment.user)?.name, 80),
        body: truncateText(comment.body, 800),
        createdAt: textField(comment.createdAt, 40),
      }));
      return {
        issue: {
          assignee: textField(assignee?.name, 80),
          comments,
          description: truncateText(issue.description, 4000),
          id: textField(issue.id, 80),
          identifier: textField(issue.identifier, 20),
          priority: textField(issue.priorityLabel, 30),
          state: textField(state?.name, 40),
          title: textField(issue.title, 200),
          url: textField(issue.url, 300),
        },
        source: sourceRef(
          textField(issue.url, 300) ?? `${BASE}/graphql`,
          textField(issue.identifier, 20) ?? "Issue Linear"
        ),
      };
    },
    inputSchema: z.object({
      id: z.string().trim().min(2).max(80),
    }),
  });
}

function linearCreateIssue(deps: PluginToolDeps) {
  return tool({
    description:
      "Crée une issue Linear dans une équipe donnée. Écriture soumise à approbation dans l'Agent.",
    execute: async ({ description, teamId, title }) => {
      const result = await linearQuery(
        deps,
        "mutation CreateIssue($teamId: String!, $title: String!, $description: String) { issueCreate(input: { teamId: $teamId, title: $title, description: $description }) { success issue { id identifier title url } } }",
        {
          description: description?.trim() ?? "",
          teamId: teamId.trim(),
          title: title.trim(),
        }
      );
      if (!result.ok) return { error: result.error };
      const record = asRecord(result.data);
      const data = asRecord(record?.data);
      const payload = asRecord(data?.issueCreate);
      const issue = asRecord(payload?.issue);
      return {
        created: payload?.success === true,
        issue: issue
          ? {
              id: textField(issue.id, 80),
              identifier: textField(issue.identifier, 20),
              title: textField(issue.title, 200),
              url: textField(issue.url, 300),
            }
          : null,
        source: sourceRef(
          textField(issue?.url, 300) ?? `${BASE}/graphql`,
          "Issue Linear créée"
        ),
      };
    },
    inputSchema: z.object({
      description: z.string().max(4000).optional(),
      teamId: z.string().trim().min(2).max(80),
      title: z.string().trim().min(1).max(200),
    }),
  });
}

export const linearPlugin: PluginDefinition = {
  createTools: (deps) => ({
    linearCreateIssue: linearCreateIssue(deps),
    linearGetIssue: linearGetIssue(deps),
    linearListIssues: linearListIssues(deps),
    linearListTeams: linearListTeams(deps),
  }),
  manifest: manifest as PluginManifest,
};
