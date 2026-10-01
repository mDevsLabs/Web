import { tool } from "ai";
import { z } from "zod";
import { fetchPublicJson, sourceRef, truncateText } from "../shared/public-api";
import type { PluginDefinition, PluginManifest } from "../types";
import manifest from "./index.json";

const repoSchema = z
  .string()
  .min(3)
  .max(201)
  .regex(
    /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/,
    "Utilisez owner/repository, sans URL."
  );
const githubHeaders = (): Record<string, string> => ({
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  ...(process.env.GITHUB_PUBLIC_TOKEN
    ? { Authorization: `Bearer ${process.env.GITHUB_PUBLIC_TOKEN}` }
    : {}),
});
function repoUrl(repo: string, suffix = ""): string {
  const [owner, name] = repo.split("/");
  return `https://api.github.com/repos/${encodeURIComponent(owner!)}/${encodeURIComponent(name!)}${suffix}`;
}

async function ensurePublicRepository(
  repository: string
): Promise<{ error: string; ok: false } | { ok: true }> {
  const result = await fetchPublicJson<{ private?: unknown }>(
    repoUrl(repository),
    githubHeaders()
  );
  if (!result.ok) return { error: result.error, ok: false };
  if (result.data.private !== false) {
    return {
      error: "Ce dépôt n'est pas confirmé comme public.",
      ok: false,
    };
  }
  return { ok: true };
}

export const getGithubRepositorySummary = tool({
  description:
    "Résumé vérifiable d'un dépôt GitHub public : description, étoiles, forks, licence et activité récente.",
  execute: async ({ repository }) => {
    const result = await fetchPublicJson<Record<string, unknown>>(
      repoUrl(repository),
      githubHeaders()
    );
    if (!result.ok) return { error: result.error };
    if (result.data.private !== false) {
      return { error: "Ce dépôt n'est pas confirmé comme public." };
    }
    return {
      defaultBranch: result.data.default_branch,
      description: truncateText(result.data.description, 1000),
      forks: result.data.forks_count,
      license:
        (result.data.license as { spdx_id?: string } | null)?.spdx_id ?? null,
      name: result.data.full_name,
      openIssues: result.data.open_issues_count,
      source: sourceRef(
        String(result.data.html_url ?? repoUrl(repository)),
        "Dépôt GitHub"
      ),
      stars: result.data.stargazers_count,
      updatedAt: result.data.updated_at,
      url: result.data.html_url,
    };
  },
  inputSchema: z.object({
    repository: repoSchema.describe("Dépôt public au format owner/repository"),
  }),
});

export const listGithubIssues = tool({
  description:
    "Liste les issues publiques récentes d'un dépôt GitHub, sans inclure les pull requests.",
  execute: async ({ limit, repository, state }) => {
    const publicCheck = await ensurePublicRepository(repository);
    if (!publicCheck.ok) return { error: publicCheck.error };
    const url = new URL(repoUrl(repository, "/issues"));
    url.searchParams.set("state", state);
    url.searchParams.set("per_page", String(limit));
    url.searchParams.set("sort", "updated");
    const result = await fetchPublicJson<Record<string, unknown>[]>(
      url.href,
      githubHeaders()
    );
    if (!result.ok) return { error: result.error };
    const issues = result.data
      .filter((issue) => !issue.pull_request)
      .slice(0, limit)
      .map((issue) => ({
        author: (issue.user as { login?: string } | null)?.login ?? null,
        comments: issue.comments,
        createdAt: issue.created_at,
        labels: Array.isArray(issue.labels)
          ? issue.labels
              .slice(0, 8)
              .map((label) => (label as { name?: string }).name)
              .filter(Boolean)
          : [],
        number: issue.number,
        state: issue.state,
        title: truncateText(issue.title, 300),
        updatedAt: issue.updated_at,
        url: issue.html_url,
      }));
    return { issues, source: sourceRef(url.href, "Issues GitHub") };
  },
  inputSchema: z.object({
    limit: z.number().int().min(1).max(20).default(10),
    repository: repoSchema,
    state: z.enum(["open", "closed", "all"]).default("open"),
  }),
});

export const listGithubReleases = tool({
  description:
    "Liste les dernières releases publiques d'un dépôt, avec version, date et notes abrégées.",
  execute: async ({ limit, repository }) => {
    const publicCheck = await ensurePublicRepository(repository);
    if (!publicCheck.ok) return { error: publicCheck.error };
    const url = new URL(repoUrl(repository, "/releases"));
    url.searchParams.set("per_page", String(limit));
    const result = await fetchPublicJson<Record<string, unknown>[]>(
      url.href,
      githubHeaders()
    );
    if (!result.ok) return { error: result.error };
    return {
      releases: result.data.slice(0, limit).map((release) => ({
        name: truncateText(release.name, 200),
        notes: truncateText(release.body, 2500),
        publishedAt: release.published_at,
        tag: release.tag_name,
        url: release.html_url,
      })),
      source: sourceRef(url.href, "Releases GitHub"),
    };
  },
  inputSchema: z.object({
    limit: z.number().int().min(1).max(15).default(5),
    repository: repoSchema,
  }),
});

export const readGithubFile = tool({
  description:
    "Lit un fichier texte depuis la branche par défaut d'un dépôt GitHub public, avec une sortie plafonnée.",
  execute: async ({ path, repository }) => {
    const publicCheck = await ensurePublicRepository(repository);
    if (!publicCheck.ok) return { error: publicCheck.error };
    const result = await fetchPublicJson<{
      content?: string;
      encoding?: string;
      html_url?: string;
      message?: string;
      size?: number;
    }>(
      repoUrl(
        repository,
        `/contents/${path.split("/").map(encodeURIComponent).join("/")}`
      ),
      githubHeaders()
    );
    if (!result.ok) return { error: result.error };
    if (
      result.data.encoding !== "base64" ||
      typeof result.data.content !== "string"
    )
      return { error: "Ce chemin ne désigne pas un fichier texte public." };
    const content = Buffer.from(
      result.data.content.replace(/\s/g, ""),
      "base64"
    ).toString("utf8");
    return {
      bytes: result.data.size ?? null,
      content: content.slice(0, 15_000),
      source: sourceRef(
        result.data.html_url ?? repoUrl(repository),
        `GitHub ${repository}/${path}`
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
    repository: repoSchema,
  }),
});

export const githubPublicPlugin: PluginDefinition = {
  createTools: () => ({
    getGithubRepositorySummary,
    listGithubIssues,
    listGithubReleases,
    readGithubFile,
  }),
  manifest: manifest as PluginManifest,
};
