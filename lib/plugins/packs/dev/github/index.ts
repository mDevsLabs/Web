import { tool } from "ai";
import { z } from "zod";
import { getIntegrationProvider } from "@/lib/integrations/providers";
import type {
  PluginDefinition,
  PluginManifest,
  PluginToolDeps,
} from "../../../core/types";
import {
  bearerFor,
  callAuthorized,
  clampLimit,
  encodeSegment,
} from "../../../shared/authorized-api";
import { sourceRef, truncateText } from "../../../shared/public-api";
import manifest from "./index.json";

/**
 * Connecteur GitHub par jeton personnel (PAT) — dépôts privés inclus.
 *
 * Les écritures (`effect: "write"`) ne sont instanciées que dans l'Agent, où le
 * moteur de permissions les soumet à approbation utilisateur.
 */

const descriptor = getIntegrationProvider("github")!;
const GITHUB_BASE = "https://api.github.com";

const GITHUB_HEADERS = {
  Accept: "application/vnd.github+json",
  "User-Agent": "mAI-Web/1.0",
  "X-GitHub-Api-Version": "2022-11-28",
};

const repoSchema = z
  .string()
  .min(3)
  .max(201)
  .regex(
    /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/,
    "Utilisez owner/repository, sans URL."
  );

function repoPath(repository: string, suffix = ""): string {
  const [owner = "", name = ""] = repository.split("/");
  return `/repos/${encodeSegment(owner)}/${encodeSegment(name)}${suffix}`;
}

const numberSchema = z.number().int().min(1).max(1_000_000);

function shapeIssue(item: Record<string, unknown>) {
  const user = item.user as { login?: string } | null | undefined;
  return {
    author: user?.login ?? null,
    comments: item.comments,
    createdAt: item.created_at,
    labels: Array.isArray(item.labels)
      ? (item.labels as { name?: string }[])
          .slice(0, 8)
          .map((label) => label.name)
          .filter(Boolean)
      : [],
    number: item.number,
    state: item.state,
    title: truncateText(item.title, 300),
    updatedAt: item.updated_at,
    url: item.html_url,
  };
}

function listIssues(deps: PluginToolDeps, withPullRequests: boolean) {
  return tool({
    description: withPullRequests
      ? "Liste les pull requests d'un dépôt GitHub accessible à votre compte."
      : "Liste les issues d'un dépôt GitHub accessible à votre compte, pull requests exclues.",
    execute: async ({ limit, repository, state }) => {
      const token = await bearerFor(deps, "github");
      if (!token.ok) return { error: token.error };
      const capped = clampLimit(limit, 10, 30);
      const result = await callAuthorized<Record<string, unknown>[]>({
        accessToken: token.data,
        base: GITHUB_BASE,
        descriptor,
        headers: GITHUB_HEADERS,
        path: repoPath(repository, withPullRequests ? "/pulls" : "/issues"),
        query: {
          per_page: capped,
          sort: "updated",
          state,
        },
        signal: deps.signal,
      });
      if (!result.ok) return { error: result.error };
      const items = (Array.isArray(result.data) ? result.data : [])
        .filter((item) => (withPullRequests ? true : !item.pull_request))
        .slice(0, capped)
        .map((item) => ({
          ...shapeIssue(item),
          head: withPullRequests
            ? ((item.head as { ref?: string } | undefined)?.ref ?? null)
            : undefined,
        }));
      return {
        source: sourceRef(
          `${GITHUB_BASE}${repoPath(repository, withPullRequests ? "/pulls" : "/issues")}`,
          withPullRequests ? "Pull requests GitHub" : "Issues GitHub"
        ),
        total: items.length,
        [withPullRequests ? "pullRequests" : "issues"]: items,
      };
    },
    inputSchema: z.object({
      limit: numberSchema.int().min(1).max(30).default(10),
      repository: repoSchema,
      state: z.enum(["open", "closed", "all"]).default("open"),
    }),
  });
}

function getGithubRepositories(deps: PluginToolDeps) {
  return tool({
    description:
      "Liste les dépôts du compte GitHub connecté — privés compris — avec filtrage optionnel par nom.",
    execute: async ({ maxResults, search }) => {
      const token = await bearerFor(deps, "github");
      if (!token.ok) return { error: token.error };
      const limit = clampLimit(maxResults, 15, 50);
      const result = await callAuthorized<Record<string, unknown>[]>({
        accessToken: token.data,
        base: GITHUB_BASE,
        descriptor,
        headers: GITHUB_HEADERS,
        path: "/user/repos",
        query: {
          affiliation: "owner,collaborator,organization_member",
          per_page: 100,
          sort: "updated",
        },
        signal: deps.signal,
      });
      if (!result.ok) return { error: result.error };
      const term = search?.toLowerCase().trim();
      const repositories = (Array.isArray(result.data) ? result.data : [])
        .filter((item) =>
          term
            ? String(item.full_name ?? "")
                .toLowerCase()
                .includes(term)
            : true
        )
        .slice(0, limit)
        .map((item) => ({
          description: truncateText(item.description, 300),
          forks: item.forks_count,
          isPrivate: item.private,
          name: item.full_name,
          openIssues: item.open_issues_count,
          stars: item.stargazers_count,
          updatedAt: item.updated_at,
          url: item.html_url,
        }));
      return {
        repositories,
        source: sourceRef(`${GITHUB_BASE}/user/repos`, "Dépôts GitHub"),
        total: repositories.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(50).default(15),
      search: z.string().max(80).optional(),
    }),
  });
}

function getGithubRepositoryDetails(deps: PluginToolDeps) {
  return tool({
    description:
      "Détail vérifiable d'un dépôt GitHub : description, étoiles, forks, licence, branche par défaut et activité.",
    execute: async ({ repository }) => {
      const token = await bearerFor(deps, "github");
      if (!token.ok) return { error: token.error };
      const result = await callAuthorized<Record<string, unknown>>({
        accessToken: token.data,
        base: GITHUB_BASE,
        descriptor,
        headers: GITHUB_HEADERS,
        path: repoPath(repository),
        signal: deps.signal,
      });
      if (!result.ok) return { error: result.error };
      const payload = result.data;
      const license = payload.license as
        | { spdx_id?: string }
        | null
        | undefined;
      return {
        defaultBranch: payload.default_branch,
        description: truncateText(payload.description, 1000),
        forks: payload.forks_count,
        isPrivate: payload.private,
        language: payload.language,
        license: license?.spdx_id ?? null,
        name: payload.full_name,
        openIssues: payload.open_issues_count,
        source: sourceRef(
          String(payload.html_url ?? `${GITHUB_BASE}${repoPath(repository)}`),
          "Dépôt GitHub"
        ),
        stars: payload.stargazers_count,
        updatedAt: payload.updated_at,
      };
    },
    inputSchema: z.object({ repository: repoSchema }),
  });
}

function searchGithubRepositories(deps: PluginToolDeps) {
  return tool({
    description: "Recherche des dépôts sur GitHub par mots-clés.",
    execute: async ({ maxResults, query, sort }) => {
      const token = await bearerFor(deps, "github");
      if (!token.ok) return { error: token.error };
      const limit = clampLimit(maxResults, 10, 30);
      const result = await callAuthorized<Record<string, unknown>>({
        accessToken: token.data,
        base: GITHUB_BASE,
        descriptor,
        headers: GITHUB_HEADERS,
        path: "/search/repositories",
        query: { per_page: limit, q: query.trim(), sort },
        signal: deps.signal,
      });
      if (!result.ok) return { error: result.error };
      const items = Array.isArray(result.data.items)
        ? (result.data.items as Record<string, unknown>[])
        : [];
      const repositories = items.slice(0, limit).map((item) => ({
        description: truncateText(item.description, 300),
        isPrivate: item.private === true,
        language: item.language ?? null,
        name: item.full_name,
        stars: item.stargazers_count,
        url: item.html_url,
      }));
      return {
        repositories,
        source: sourceRef(
          `${GITHUB_BASE}/search/repositories`,
          "Recherche dépôts GitHub"
        ),
        total: repositories.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(30).default(10),
      query: z.string().trim().min(1).max(160),
      sort: z.enum(["stars", "forks", "updated"]).optional(),
    }),
  });
}

function searchGithubCode(deps: PluginToolDeps) {
  return tool({
    description:
      "Recherche du code sur GitHub (optionnellement limité à un dépôt).",
    execute: async ({ maxResults, query, repository }) => {
      const token = await bearerFor(deps, "github");
      if (!token.ok) return { error: token.error };
      const limit = clampLimit(maxResults, 10, 25);
      const q = repository
        ? `${query.trim()} repo:${repository}`
        : query.trim();
      const result = await callAuthorized<Record<string, unknown>>({
        accessToken: token.data,
        base: GITHUB_BASE,
        descriptor,
        headers: GITHUB_HEADERS,
        path: "/search/code",
        query: { per_page: limit, q },
        signal: deps.signal,
      });
      if (!result.ok) return { error: result.error };
      const items = Array.isArray(result.data.items)
        ? (result.data.items as Record<string, unknown>[])
        : [];
      const matches = items.slice(0, limit).map((item) => {
        const repo = item.repository as { full_name?: string } | undefined;
        return {
          name: item.name,
          path: item.path,
          repository: repo?.full_name ?? null,
          url: item.html_url,
        };
      });
      return {
        matches,
        source: sourceRef(
          `${GITHUB_BASE}/search/code`,
          "Recherche code GitHub"
        ),
        total: matches.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(25).default(10),
      query: z.string().trim().min(1).max(160),
      repository: repoSchema.optional(),
    }),
  });
}

function listGithubBranches(deps: PluginToolDeps) {
  return tool({
    description: "Liste les branches d'un dépôt GitHub.",
    execute: async ({ maxResults, repository }) => {
      const token = await bearerFor(deps, "github");
      if (!token.ok) return { error: token.error };
      const limit = clampLimit(maxResults, 20, 50);
      const path = repoPath(repository, "/branches");
      const result = await callAuthorized<Record<string, unknown>[]>({
        accessToken: token.data,
        base: GITHUB_BASE,
        descriptor,
        headers: GITHUB_HEADERS,
        path,
        query: { per_page: limit },
        signal: deps.signal,
      });
      if (!result.ok) return { error: result.error };
      const branches = (Array.isArray(result.data) ? result.data : [])
        .slice(0, limit)
        .map((row) => {
          const commit = row.commit as { sha?: string } | undefined;
          return {
            name: row.name,
            protected: row.protected === true,
            sha: commit?.sha ? commit.sha.slice(0, 7) : null,
          };
        });
      return {
        branches,
        source: sourceRef(`${GITHUB_BASE}${path}`, `Branches ${repository}`),
        total: branches.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(50).default(20),
      repository: repoSchema,
    }),
  });
}

function listGithubCommits(deps: PluginToolDeps) {
  return tool({
    description: "Liste les derniers commits d'un dépôt GitHub.",
    execute: async ({ maxResults, repository, sha }) => {
      const token = await bearerFor(deps, "github");
      if (!token.ok) return { error: token.error };
      const limit = clampLimit(maxResults, 15, 30);
      const path = repoPath(repository, "/commits");
      const result = await callAuthorized<Record<string, unknown>[]>({
        accessToken: token.data,
        base: GITHUB_BASE,
        descriptor,
        headers: GITHUB_HEADERS,
        path,
        query: { per_page: limit, sha: sha?.trim() || undefined },
        signal: deps.signal,
      });
      if (!result.ok) return { error: result.error };
      const commits = (Array.isArray(result.data) ? result.data : [])
        .slice(0, limit)
        .map((row) => {
          const commit = row.commit as
            | {
                author?: { date?: string; name?: string };
                message?: string;
              }
            | undefined;
          const author = row.author as { login?: string } | null | undefined;
          return {
            author: author?.login ?? commit?.author?.name ?? null,
            date: commit?.author?.date ?? null,
            message: truncateText(commit?.message, 240),
            sha: typeof row.sha === "string" ? row.sha.slice(0, 7) : null,
            url: row.html_url,
          };
        });
      return {
        commits,
        source: sourceRef(`${GITHUB_BASE}${path}`, `Commits ${repository}`),
        total: commits.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(30).default(15),
      repository: repoSchema,
      sha: z.string().max(120).optional(),
    }),
  });
}

function listGithubDirectory(deps: PluginToolDeps) {
  return tool({
    description:
      "Liste les fichiers et sous-dossiers d'un répertoire dans un dépôt GitHub.",
    execute: async ({ path = "", ref, repository }) => {
      const token = await bearerFor(deps, "github");
      if (!token.ok) return { error: token.error };
      const cleanPath = path.trim().replace(/^\/+|\/+$/g, "");
      const encoded = cleanPath
        ? cleanPath.split("/").map(encodeSegment).join("/")
        : "";
      const apiPath = `${repoPath(repository, "/contents")}${encoded ? `/${encoded}` : ""}`;
      const result = await callAuthorized<unknown>({
        accessToken: token.data,
        base: GITHUB_BASE,
        descriptor,
        headers: GITHUB_HEADERS,
        path: apiPath,
        query: ref ? { ref } : undefined,
        signal: deps.signal,
      });
      if (!result.ok) return { error: result.error };
      if (!Array.isArray(result.data)) {
        return { error: "Ce chemin désigne un fichier, pas un dossier." };
      }
      const entries = (result.data as Record<string, unknown>[])
        .slice(0, 100)
        .map((entry) => ({
          name: entry.name,
          path: entry.path,
          size: entry.size ?? null,
          type: entry.type,
        }));
      return {
        entries,
        path: cleanPath || "/",
        source: sourceRef(
          `${GITHUB_BASE}${apiPath}`,
          `${repository}/${cleanPath}`
        ),
        total: entries.length,
      };
    },
    inputSchema: z.object({
      path: z
        .string()
        .max(300)
        .regex(/^[A-Za-z0-9_./ -]*$/)
        .refine((value) => !value.split("/").includes(".."), "Chemin invalide")
        .default(""),
      ref: z.string().max(120).optional(),
      repository: repoSchema,
    }),
  });
}

function getGithubIssue(deps: PluginToolDeps) {
  return tool({
    description:
      "Récupère une issue ou une pull request précise d'un dépôt, avec son corps.",
    execute: async ({ issueNumber, repository }) => {
      const token = await bearerFor(deps, "github");
      if (!token.ok) return { error: token.error };
      const result = await callAuthorized<Record<string, unknown>>({
        accessToken: token.data,
        base: GITHUB_BASE,
        descriptor,
        headers: GITHUB_HEADERS,
        path: repoPath(repository, `/issues/${issueNumber}`),
        signal: deps.signal,
      });
      if (!result.ok) return { error: result.error };
      const payload = result.data;
      return {
        body: truncateText(payload.body, 6000),
        issue: shapeIssue(payload),
        source: sourceRef(
          String(payload.html_url ?? ""),
          `GitHub ${repository}#${issueNumber}`
        ),
      };
    },
    inputSchema: z.object({
      issueNumber: numberSchema,
      repository: repoSchema,
    }),
  });
}

function listGithubIssueComments(deps: PluginToolDeps) {
  return tool({
    description: "Lit les commentaires d'une issue ou pull request GitHub.",
    execute: async ({ issueNumber, limit, repository }) => {
      const token = await bearerFor(deps, "github");
      if (!token.ok) return { error: token.error };
      const capped = clampLimit(limit, 20, 50);
      const path = repoPath(repository, `/issues/${issueNumber}/comments`);
      const result = await callAuthorized<Record<string, unknown>[]>({
        accessToken: token.data,
        base: GITHUB_BASE,
        descriptor,
        headers: GITHUB_HEADERS,
        path,
        query: { per_page: capped },
        signal: deps.signal,
      });
      if (!result.ok) return { error: result.error };
      const comments = (Array.isArray(result.data) ? result.data : [])
        .slice(0, capped)
        .map((row) => {
          const user = row.user as { login?: string } | null | undefined;
          return {
            author: user?.login ?? null,
            body: truncateText(row.body, 1800),
            createdAt: row.created_at,
            id: row.id,
            url: row.html_url,
          };
        });
      return {
        comments,
        source: sourceRef(
          `${GITHUB_BASE}${path}`,
          `Commentaires ${repository}#${issueNumber}`
        ),
        total: comments.length,
      };
    },
    inputSchema: z.object({
      issueNumber: numberSchema,
      limit: z.number().int().min(1).max(50).default(20),
      repository: repoSchema,
    }),
  });
}

function readGithubFile(deps: PluginToolDeps) {
  return tool({
    description:
      "Lit un fichier dans un dépôt GitHub accessible à votre compte, sur la branche choisie. Sortie plafonnée.",
    execute: async ({ path, ref, repository }) => {
      const token = await bearerFor(deps, "github");
      if (!token.ok) return { error: token.error };
      const result = await callAuthorized<{
        content?: string;
        encoding?: string;
        message?: string;
        size?: number;
      }>({
        accessToken: token.data,
        base: GITHUB_BASE,
        descriptor,
        headers: GITHUB_HEADERS,
        path: `${repoPath(repository, "/contents/")}${path
          .split("/")
          .map(encodeSegment)
          .join("/")}`,
        query: ref ? { ref } : undefined,
        signal: deps.signal,
      });
      if (!result.ok) return { error: result.error };
      if (result.data.encoding !== "base64" || !result.data.content) {
        return { error: "Ce chemin ne désigne pas un fichier lisible." };
      }
      const content = Buffer.from(
        result.data.content.replace(/\s/g, ""),
        "base64"
      ).toString("utf8");
      return {
        bytes: result.data.size ?? null,
        content: content.slice(0, 15_000),
        source: sourceRef(
          `${GITHUB_BASE}${repoPath(repository, `/contents/${path}`)}`,
          `${repository}/${path}`
        ),
        truncated: content.length > 15_000,
      };
    },
    inputSchema: z.object({
      path: z
        .string()
        .min(1)
        .max(300)
        .regex(/^[A-Za-z0-9_./ -]+$/)
        .refine((value) => !value.split("/").includes(".."), "Chemin invalide"),
      ref: z.string().max(120).optional(),
      repository: repoSchema,
    }),
  });
}

function createGithubIssue(deps: PluginToolDeps) {
  return tool({
    description:
      "OUVRE une issue dans un dépôt GitHub du compte. Action d'écriture visible des autres : soumise à approbation, disponible seulement dans l'Agent.",
    execute: async ({ assignees, body, labels, repository, title }) => {
      const token = await bearerFor(deps, "github");
      if (!token.ok) return { error: token.error };
      const result = await callAuthorized<Record<string, unknown>>({
        accessToken: token.data,
        base: GITHUB_BASE,
        body: JSON.stringify({ assignees, body, labels, title }),
        descriptor,
        headers: GITHUB_HEADERS,
        method: "POST",
        path: repoPath(repository, "/issues"),
        signal: deps.signal,
      });
      if (!result.ok) return { error: result.error };
      return {
        created: true,
        number: result.data.number,
        source: sourceRef(
          String(result.data.html_url ?? ""),
          `GitHub ${repository}#${String(result.data.number ?? "")}`
        ),
        title: result.data.title,
        url: result.data.html_url,
      };
    },
    inputSchema: z.object({
      assignees: z.array(z.string().min(1).max(39)).max(10).optional(),
      body: z.string().max(20_000).optional(),
      labels: z.array(z.string().min(1).max(50)).max(10).optional(),
      repository: repoSchema,
      title: z.string().min(1).max(256),
    }),
  });
}

function commentGithubIssue(deps: PluginToolDeps) {
  return tool({
    description:
      "AJOUTE un commentaire à une issue ou une pull request GitHub. Écriture visible : soumise à approbation, Agent uniquement.",
    execute: async ({ body, issueNumber, repository }) => {
      const token = await bearerFor(deps, "github");
      if (!token.ok) return { error: token.error };
      const result = await callAuthorized<Record<string, unknown>>({
        accessToken: token.data,
        base: GITHUB_BASE,
        body: JSON.stringify({ body }),
        descriptor,
        headers: GITHUB_HEADERS,
        method: "POST",
        path: repoPath(repository, `/issues/${issueNumber}/comments`),
        signal: deps.signal,
      });
      if (!result.ok) return { error: result.error };
      return {
        created: true,
        id: result.data.id,
        source: sourceRef(
          String(result.data.html_url ?? ""),
          `Commentaire ${repository}#${issueNumber}`
        ),
        url: result.data.html_url,
      };
    },
    inputSchema: z.object({
      body: z.string().min(1).max(60_000),
      issueNumber: numberSchema,
      repository: repoSchema,
    }),
  });
}

function createGithubPullRequest(deps: PluginToolDeps) {
  return tool({
    description:
      "OUVRE une pull request entre deux branches d'un dépôt GitHub. Écriture visible : soumise à approbation, Agent uniquement.",
    execute: async ({ base, body, draft, head, repository, title }) => {
      const token = await bearerFor(deps, "github");
      if (!token.ok) return { error: token.error };
      const result = await callAuthorized<Record<string, unknown>>({
        accessToken: token.data,
        base: GITHUB_BASE,
        body: JSON.stringify({ base, body, draft, head, title }),
        descriptor,
        headers: GITHUB_HEADERS,
        method: "POST",
        path: repoPath(repository, "/pulls"),
        signal: deps.signal,
      });
      if (!result.ok) return { error: result.error };
      return {
        created: true,
        number: result.data.number,
        source: sourceRef(
          String(result.data.html_url ?? ""),
          `Pull request ${repository}#${String(result.data.number ?? "")}`
        ),
        state: result.data.state,
        url: result.data.html_url,
      };
    },
    inputSchema: z.object({
      base: z.string().min(1).max(120),
      body: z.string().max(60_000).optional(),
      draft: z.boolean().default(false),
      head: z
        .string()
        .min(1)
        .max(255)
        .describe("branche source, ou owner:branche"),
      repository: repoSchema,
      title: z.string().min(1).max(256),
    }),
  });
}

export const githubPlugin: PluginDefinition = {
  createTools: (deps) => ({
    commentGithubIssue: commentGithubIssue(deps),
    createGithubIssue: createGithubIssue(deps),
    createGithubPullRequest: createGithubPullRequest(deps),
    getGithubIssue: getGithubIssue(deps),
    getGithubRepositories: getGithubRepositories(deps),
    getGithubRepositoryDetails: getGithubRepositoryDetails(deps),
    listGithubBranches: listGithubBranches(deps),
    listGithubCommits: listGithubCommits(deps),
    listGithubDirectory: listGithubDirectory(deps),
    listGithubIssueComments: listGithubIssueComments(deps),
    listGithubIssues: listIssues(deps, false),
    listGithubPullRequests: listIssues(deps, true),
    readGithubFile: readGithubFile(deps),
    searchGithubCode: searchGithubCode(deps),
    searchGithubRepositories: searchGithubRepositories(deps),
  }),
  manifest: manifest as PluginManifest,
};
