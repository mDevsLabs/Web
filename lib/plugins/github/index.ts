import { tool } from "ai";
import { z } from "zod";
import { getIntegrationProvider } from "@/lib/integrations/providers";
import {
  bearerFor,
  callAuthorized,
  encodeSegment,
} from "../shared/authorized-api";
import { sourceRef, truncateText } from "../shared/public-api";
import type {
  PluginDefinition,
  PluginManifest,
  PluginToolDeps,
} from "../types";
import manifest from "./index.json";

/**
 * Connecteur GitHub — le compte de l'utilisateur, ses dépôts privés compris, là
 * où l'ancien plugin `github-public` ne savait lire que le domaine public avec
 * une clé globale.
 *
 * Les écritures (ouvrir une issue, commenter, créer une pull request) sont
 * déclarées `effect: "write"` : elles ne sont instanciées que dans l'Agent, où le
 * moteur de permissions les fait approuver une par une.
 */

const descriptor = getIntegrationProvider("github")!;
const GITHUB_BASE = "https://api.github.com";

const GITHUB_HEADERS = {
  Accept: "application/vnd.github+json",
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

/** owner/repo est découpé puis ré-encodé : le modèle ne pose jamais d'URL. */
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
      const result = await callAuthorized<Record<string, unknown>[]>({
        accessToken: token.data,
        base: GITHUB_BASE,
        descriptor,
        headers: GITHUB_HEADERS,
        path: repoPath(repository, withPullRequests ? "/pulls" : "/issues"),
        query: {
          per_page: limit,
          sort: "updated",
          state,
        },
        signal: deps.signal,
      });
      if (!result.ok) return { error: result.error };
      const items = (Array.isArray(result.data) ? result.data : [])
        .filter((item) => (withPullRequests ? true : !item.pull_request))
        .slice(0, limit)
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
      "Liste les dépôts du compte GitHub connecté — privés compris — avec une filtration possible par nom.",
    execute: async ({ maxResults, search }) => {
      const token = await bearerFor(deps, "github");
      if (!token.ok) return { error: token.error };
      const result = await callAuthorized<Record<string, unknown>[]>({
        accessToken: token.data,
        base: GITHUB_BASE,
        descriptor,
        headers: GITHUB_HEADERS,
        path: "/user/repos",
        query: { affiliation: "owner", per_page: 100, sort: "updated" },
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
        .slice(0, maxResults)
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
    listGithubIssues: listIssues(deps, false),
    listGithubPullRequests: listIssues(deps, true),
    readGithubFile: readGithubFile(deps),
  }),
  manifest: manifest as PluginManifest,
};
