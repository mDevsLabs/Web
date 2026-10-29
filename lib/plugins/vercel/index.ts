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
 * Connecteur Vercel — projet, déploiements et journaux, en LECTURE SEULE.
 *
 * Vercel se connecte par JETON PERSONNEL, pas par OAuth : son flux public ne
 * délivre aujourd'hui que l'identité, les permissions d'accès aux projets étant
 * en bêta privée. Le jeton est créé sur vercel.com/account/tokens, validé par
 * `GET /v2/user`, puis chiffré comme n'importe quel porteur.
 *
 * Aucun outil d'écriture n'est exposé : un jeton personnel porte souvent les
 * droits du compte entier, et une promotion ou un redéploiement déclenché par
 * une erreur de modèle ne se rattrape pas. Le plugin reste donc un miroir.
 */

const descriptor = getIntegrationProvider("vercel")!;
const VERCEL_BASE = "https://api.vercel.com";

function shapeProject(project: Record<string, unknown>) {
  return {
    framework: project.framework ?? null,
    id: project.id,
    name: project.name,
    updatedAt: project.updatedAt,
  };
}

function shapeDeployment(deployment: Record<string, unknown>) {
  const meta = deployment.meta as
    | { githubCommitMessage?: string; githubCommitRef?: string }
    | undefined;
  return {
    commitMessage: truncateText(meta?.githubCommitMessage, 200),
    createdAt: deployment.createdAt ?? deployment.created,
    id: deployment.uid ?? deployment.id,
    name: deployment.name,
    readyAt: deployment.ready,
    state: deployment.state ?? deployment.readyState,
    target: deployment.target ?? null,
    url: deployment.url ? `https://${deployment.url}` : null,
  };
}

function vercelListProjects(deps: PluginToolDeps) {
  return tool({
    description:
      "Liste les projets Vercel du compte connecté, filtrables par nom.",
    execute: async ({ maxResults, search }) => {
      const token = await bearerFor(deps, "vercel");
      if (!token.ok) return { error: token.error };
      const result = await callAuthorized<Record<string, unknown>>({
        accessToken: token.data,
        base: VERCEL_BASE,
        descriptor,
        path: "/v9/projects",
        query: { limit: maxResults },
        signal: deps.signal,
      });
      if (!result.ok) return { error: result.error };
      const term = search?.toLowerCase().trim();
      const projects = (
        Array.isArray(result.data.projects)
          ? (result.data.projects as Record<string, unknown>[])
          : []
      )
        .filter((project) =>
          term
            ? String(project.name ?? "")
                .toLowerCase()
                .includes(term)
            : true
        )
        .slice(0, maxResults)
        .map(shapeProject);
      return {
        projects,
        source: sourceRef(`${VERCEL_BASE}/v9/projects`, "Projets Vercel"),
        total: projects.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(50).default(20),
      search: z.string().max(80).optional(),
    }),
  });
}

function vercelGetProject(deps: PluginToolDeps) {
  return tool({
    description:
      "Détail d'un projet Vercel : domaine de production, framework, dépôt lié.",
    execute: async ({ project }) => {
      const token = await bearerFor(deps, "vercel");
      if (!token.ok) return { error: token.error };
      const result = await callAuthorized<Record<string, unknown>>({
        accessToken: token.data,
        base: VERCEL_BASE,
        descriptor,
        path: `/v9/projects/${encodeSegment(project)}`,
        signal: deps.signal,
      });
      if (!result.ok) return { error: result.error };
      const link = result.data.link as
        | { org?: string; repo?: string; type?: string }
        | undefined;
      return {
        project: {
          ...shapeProject(result.data),
          createdAt: result.data.createdAt,
          repository: link ? `${link.org ?? ""}/${link.repo ?? ""}` : null,
        },
        source: sourceRef(
          `${VERCEL_BASE}/v9/projects/${project}`,
          "Projet Vercel"
        ),
      };
    },
    inputSchema: z.object({
      project: z.string().min(1).max(120),
    }),
  });
}

function vercelListDeployments(deps: PluginToolDeps) {
  return tool({
    description:
      "Liste les déploiements Vercel récents, éventuellement d'un projet ou dans un état donné.",
    execute: async ({ limit, project, state }) => {
      const token = await bearerFor(deps, "vercel");
      if (!token.ok) return { error: token.error };
      const result = await callAuthorized<Record<string, unknown>>({
        accessToken: token.data,
        base: VERCEL_BASE,
        descriptor,
        path: "/v6/deployments",
        query: {
          limit,
          projectId: project,
          state,
        },
        signal: deps.signal,
      });
      if (!result.ok) return { error: result.error };
      const deployments = (
        Array.isArray(result.data.deployments)
          ? (result.data.deployments as Record<string, unknown>[])
          : []
      )
        .slice(0, limit)
        .map(shapeDeployment);
      return {
        deployments,
        source: sourceRef(
          `${VERCEL_BASE}/v6/deployments`,
          "Déploiements Vercel"
        ),
        total: deployments.length,
      };
    },
    inputSchema: z.object({
      limit: z.number().int().min(1).max(50).default(15),
      project: z.string().max(120).optional(),
      state: z
        .enum([
          "BUILDING",
          "ERROR",
          "INITIALIZING",
          "QUEUED",
          "READY",
          "CANCELED",
        ])
        .optional(),
    }),
  });
}

function vercelGetDeployment(deps: PluginToolDeps) {
  return tool({
    description:
      "Détail d'un déploiement Vercel : état, URL, commit et durée de construction.",
    execute: async ({ deploymentId }) => {
      const token = await bearerFor(deps, "vercel");
      if (!token.ok) return { error: token.error };
      const result = await callAuthorized<Record<string, unknown>>({
        accessToken: token.data,
        base: VERCEL_BASE,
        descriptor,
        path: `/v13/deployments/${encodeSegment(deploymentId)}`,
        signal: deps.signal,
      });
      if (!result.ok) return { error: result.error };
      return {
        deployment: {
          ...shapeDeployment(result.data),
          buildingAt: result.data.buildingAt,
          errorMessage: truncateText(result.data.errorMessage, 500),
        },
        source: sourceRef(
          `${VERCEL_BASE}/v13/deployments/${deploymentId}`,
          "Déploiement Vercel"
        ),
      };
    },
    inputSchema: z.object({
      deploymentId: z.string().min(3).max(120),
    }),
  });
}

function vercelDeploymentLogs(deps: PluginToolDeps) {
  return tool({
    description:
      "Extrait les derniers journaux de construction d'un déploiement Vercel, erreurs en tête.",
    execute: async ({ deploymentId, limit }) => {
      const token = await bearerFor(deps, "vercel");
      if (!token.ok) return { error: token.error };
      const result = await callAuthorized<unknown>({
        accessToken: token.data,
        base: VERCEL_BASE,
        descriptor,
        path: `/v3/deployments/${encodeSegment(deploymentId)}/events`,
        query: { direction: "backward", limit },
        signal: deps.signal,
      });
      if (!result.ok) return { error: result.error };
      const events = Array.isArray(result.data) ? result.data : [];
      const lines = events
        .map((event) => {
          const record = event as {
            payload?: { text?: string };
            text?: string;
            type?: string;
          };
          const text = record.text ?? record.payload?.text;
          return text ? `[${record.type ?? "log"}] ${text}` : "";
        })
        .filter(Boolean)
        .reverse();
      return {
        lines: lines.slice(-limit).map((line) => truncateText(line, 500)),
        source: sourceRef(
          `${VERCEL_BASE}/v3/deployments/${deploymentId}/events`,
          "Journaux Vercel"
        ),
        total: lines.length,
      };
    },
    inputSchema: z.object({
      deploymentId: z.string().min(3).max(120),
      limit: z.number().int().min(1).max(200).default(80),
    }),
  });
}

export const vercelPlugin: PluginDefinition = {
  createTools: (deps) => ({
    vercelDeploymentLogs: vercelDeploymentLogs(deps),
    vercelGetDeployment: vercelGetDeployment(deps),
    vercelGetProject: vercelGetProject(deps),
    vercelListDeployments: vercelListDeployments(deps),
    vercelListProjects: vercelListProjects(deps),
  }),
  manifest: manifest as PluginManifest,
};
