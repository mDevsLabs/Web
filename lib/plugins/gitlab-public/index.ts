import { tool } from "ai";
import { z } from "zod";
import {
  contactHeaders,
  fetchPublicJson,
  sourceRef,
  truncateText,
} from "../shared/public-api";
import type { PluginDefinition, PluginManifest } from "../types";
import manifest from "./index.json";

const GITLAB_API = "https://gitlab.com/api/v4";
const headers = contactHeaders("mAI-Web");
const MAX_FILE_BYTES = 500_000;
const MAX_FILE_OUTPUT = 15_000;

const projectSchema = z
  .string()
  .trim()
  .min(2)
  .max(200)
  .regex(
    /^(?:\d+|[A-Za-z0-9][A-Za-z0-9_.-]*(?:\/[A-Za-z0-9][A-Za-z0-9_.-]*)+)$/,
    "Utilisez un chemin de projet GitLab ou son identifiant numérique."
  )
  .refine(
    (value) => !value.split("/").includes(".."),
    "Chemin de projet invalide."
  );
const refSchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .regex(/^[A-Za-z0-9._/-]+$/, "Référence de branche invalide.")
  .refine((value) => !value.split("/").includes(".."), "Référence invalide.");
const filePathSchema = z
  .string()
  .trim()
  .min(1)
  .max(300)
  .regex(/^[A-Za-z0-9._/-]+$/, "Chemin de fichier invalide.")
  .refine(
    (value) => !value.startsWith("/") && !value.split("/").includes(".."),
    "Chemin de fichier invalide."
  );

const gitlabProjectSchema = z
  .object({
    default_branch: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    forks_count: z.number().int().nonnegative().optional(),
    id: z.union([z.number().int(), z.string()]),
    last_activity_at: z.string().nullable().optional(),
    name: z.string().max(300).nullable().optional(),
    open_issues_count: z.number().int().nonnegative().optional(),
    path: z.string().max(300).nullable().optional(),
    path_with_namespace: z.string().max(300).optional(),
    star_count: z.number().int().nonnegative().optional(),
    topics: z.array(z.string()).nullable().optional(),
    visibility: z.enum(["public", "private", "internal"]),
    web_url: z.string().nullable().optional(),
  })
  .passthrough();

const gitlabIssueSchema = z
  .object({
    author: z
      .object({ username: z.string().nullable().optional() })
      .passthrough()
      .nullable()
      .optional(),
    confidential: z.boolean().optional(),
    created_at: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    iid: z.union([z.number().int(), z.string().max(50)]),
    labels: z.array(z.string()).optional(),
    state: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
    updated_at: z.string().nullable().optional(),
    web_url: z.string().nullable().optional(),
  })
  .passthrough();

const gitlabReleaseSchema = z
  .object({
    _links: z
      .object({ self: z.string().nullable().optional() })
      .passthrough()
      .optional(),
    description: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
    released_at: z.string().nullable().optional(),
    tag_name: z.string(),
  })
  .passthrough();

const gitlabFileSchema = z
  .object({
    blob_id: z.string().nullable().optional(),
    content: z.string(),
    content_sha256: z.string().nullable().optional(),
    encoding: z.string(),
    file_name: z.string().max(300).nullable().optional(),
    file_path: z.string().max(300).nullable().optional(),
    ref: z.string().nullable().optional(),
    size: z.number().int().nonnegative().optional(),
  })
  .passthrough();

type GitlabProject = z.infer<typeof gitlabProjectSchema>;

function projectApiUrl(project: string, suffix = ""): string {
  return `${GITLAB_API}/projects/${encodeURIComponent(project)}${suffix}`;
}

function safeGitlabUrl(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "gitlab.com"
      ? url.href
      : fallback;
  } catch {
    return fallback;
  }
}

async function getPublicProject(
  project: string
): Promise<
  { data: GitlabProject; ok: true; url: string } | { error: string; ok: false }
> {
  const url = projectApiUrl(project);
  const result = await fetchPublicJson<unknown>(url, headers);
  if (!result.ok) return { error: result.error, ok: false };
  const parsed = gitlabProjectSchema.safeParse(result.data);
  if (!parsed.success) {
    return { error: "Réponse de projet GitLab invalide.", ok: false };
  }
  if (parsed.data.visibility !== "public") {
    return {
      error: "Ce projet n'est pas confirmé comme public.",
      ok: false,
    };
  }
  return { data: parsed.data, ok: true, url };
}

function projectSource(project: GitlabProject, fallbackPath: string): string {
  return safeGitlabUrl(
    project.web_url,
    `https://gitlab.com/${project.path_with_namespace ?? fallbackPath}`
  );
}

export const getGitlabProjectSummary = tool({
  description:
    "Résumé vérifiable d’un projet GitLab public : visibilité, activité, étoiles, forks et nombre d’issues ouvertes.",
  execute: async ({ project }) => {
    const result = await getPublicProject(project);
    if (!result.ok) return { error: result.error };
    const data = result.data;
    const projectPath = data.path_with_namespace ?? project;
    const source = projectSource(data, project);
    return {
      defaultBranch: data.default_branch ?? null,
      description: truncateText(data.description, 1000),
      forks: data.forks_count ?? null,
      id: data.id,
      lastActivityAt: data.last_activity_at ?? null,
      name: data.name ?? data.path ?? projectPath,
      openIssues: data.open_issues_count ?? null,
      path: projectPath,
      source: sourceRef(source, "GitLab — projet public"),
      stars: data.star_count ?? null,
      topics: (data.topics ?? [])
        .slice(0, 12)
        .map((topic) => truncateText(topic, 100))
        .filter((topic): topic is string => topic !== null),
      url: source,
    };
  },
  inputSchema: z.object({
    project: projectSchema.describe(
      "Chemin namespace/projet ou identifiant GitLab"
    ),
  }),
});

export const listGitlabIssues = tool({
  description:
    "Liste les issues publiques récentes d’un projet GitLab, sans pull requests ni issues confidentielles.",
  execute: async ({ limit = 10, project, state = "opened" }) => {
    const publicProject = await getPublicProject(project);
    if (!publicProject.ok) return { error: publicProject.error };
    const url = new URL(projectApiUrl(project, "/issues"));
    url.searchParams.set("state", state);
    url.searchParams.set("per_page", String(limit));
    url.searchParams.set("order_by", "updated_at");
    url.searchParams.set("sort", "desc");

    const result = await fetchPublicJson<unknown>(url.href, headers);
    if (!result.ok) return { error: result.error };
    const parsed = z.array(gitlabIssueSchema).max(100).safeParse(result.data);
    if (!parsed.success) {
      return { error: "Réponse d’issues GitLab invalide." };
    }

    const issues = parsed.data
      .filter((issue) => issue.confidential !== true)
      .slice(0, limit)
      .map((issue) => ({
        author: issue.author?.username ?? null,
        createdAt: issue.created_at ?? null,
        description: truncateText(issue.description, 1000),
        iid: issue.iid,
        labels: (issue.labels ?? [])
          .slice(0, 8)
          .map((label) => truncateText(label, 100))
          .filter((label): label is string => label !== null),
        state: issue.state ?? null,
        title: truncateText(issue.title, 300),
        updatedAt: issue.updated_at ?? null,
        url: safeGitlabUrl(
          issue.web_url,
          projectApiUrl(
            project,
            `/issues/${encodeURIComponent(String(issue.iid))}`
          )
        ),
      }));
    return { issues, source: sourceRef(url.href, "GitLab — issues publiques") };
  },
  inputSchema: z.object({
    limit: z.number().int().min(1).max(20).default(10),
    project: projectSchema.describe(
      "Chemin namespace/projet ou identifiant GitLab"
    ),
    state: z.enum(["opened", "closed", "all"]).default("opened"),
  }),
});

export const listGitlabReleases = tool({
  description:
    "Liste les dernières releases publiques d’un projet GitLab avec version, date et notes abrégées.",
  execute: async ({ limit = 5, project }) => {
    const publicProject = await getPublicProject(project);
    if (!publicProject.ok) return { error: publicProject.error };
    const url = new URL(projectApiUrl(project, "/releases"));
    url.searchParams.set("per_page", String(limit));

    const result = await fetchPublicJson<unknown>(url.href, headers);
    if (!result.ok) return { error: result.error };
    const parsed = z.array(gitlabReleaseSchema).max(100).safeParse(result.data);
    if (!parsed.success) {
      return { error: "Réponse de releases GitLab invalide." };
    }

    return {
      releases: parsed.data.slice(0, limit).map((release) => ({
        description: truncateText(release.description, 2500),
        name: truncateText(release.name, 200),
        publishedAt: release.released_at ?? null,
        tag: truncateText(release.tag_name, 200) ?? "",
        url: safeGitlabUrl(
          release._links?.self,
          projectApiUrl(
            project,
            `/releases/${encodeURIComponent(release.tag_name)}`
          )
        ),
      })),
      source: sourceRef(url.href, "GitLab — releases publiques"),
    };
  },
  inputSchema: z.object({
    limit: z.number().int().min(1).max(15).default(5),
    project: projectSchema.describe(
      "Chemin namespace/projet ou identifiant GitLab"
    ),
  }),
});

export const readGitlabFile = tool({
  description:
    "Lit un fichier texte depuis une branche ou un tag d’un projet GitLab public, avec une sortie strictement bornée.",
  execute: async ({ filePath, project, ref = "HEAD" }) => {
    const publicProject = await getPublicProject(project);
    if (!publicProject.ok) return { error: publicProject.error };
    const url = new URL(
      projectApiUrl(
        project,
        `/repository/files/${encodeURIComponent(filePath)}`
      )
    );
    url.searchParams.set("ref", ref);
    const result = await fetchPublicJson<unknown>(url.href, headers);
    if (!result.ok) return { error: result.error };
    const parsed = gitlabFileSchema.safeParse(result.data);
    if (!parsed.success) {
      return { error: "Réponse de fichier GitLab invalide." };
    }
    const file = parsed.data;
    if (file.encoding !== "base64") {
      return { error: "Ce chemin ne désigne pas un fichier texte public." };
    }
    if (file.size !== undefined && file.size > MAX_FILE_BYTES) {
      return { error: "Fichier trop volumineux; résultat refusé." };
    }

    let decoded: string;
    try {
      const bytes = Buffer.from(file.content.replace(/\s/g, ""), "base64");
      if (bytes.byteLength > MAX_FILE_BYTES) {
        return { error: "Fichier trop volumineux; résultat refusé." };
      }
      decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      return {
        error: "Ce chemin ne désigne pas un fichier texte UTF-8 public.",
      };
    }

    return {
      bytes: file.size ?? decoded.length,
      content: decoded.slice(0, MAX_FILE_OUTPUT),
      path: file.file_path ?? filePath,
      ref: file.ref ?? ref,
      source: sourceRef(
        safeGitlabUrl(
          file.file_path
            ? `https://gitlab.com/${publicProject.data.path_with_namespace ?? project}/-/blob/${encodeURIComponent(ref)}/${file.file_path
                .split("/")
                .map(encodeURIComponent)
                .join("/")}`
            : undefined,
          url.href
        ),
        "GitLab — fichier public"
      ),
      truncated: decoded.length > MAX_FILE_OUTPUT,
    };
  },
  inputSchema: z.object({
    filePath: filePathSchema.describe("Chemin du fichier dans le dépôt"),
    project: projectSchema.describe(
      "Chemin namespace/projet ou identifiant GitLab"
    ),
    ref: refSchema.default("HEAD").describe("Branche, tag ou HEAD"),
  }),
});

export const gitlabPublicPlugin: PluginDefinition = {
  createTools: () => ({
    getGitlabProjectSummary,
    listGitlabIssues,
    listGitlabReleases,
    readGitlabFile,
  }),
  manifest: manifest as PluginManifest,
};
