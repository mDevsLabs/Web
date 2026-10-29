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
 * Neon en lecture des projets et des branches. Créer une branche peut
 * démarrer du calcul : c'est une écriture, approuvée dans l'Agent. La réponse
 * n'est jamais recopiée entière : elle peut contenir des URI de connexion.
 */

const descriptor = getIntegrationProvider("neon")!;
const BASE = "https://console.neon.tech";

function projectId(value: string): string | null {
  return /^[a-z0-9-]{1,60}$/.test(value) ? value : null;
}

async function neon(
  deps: PluginToolDeps,
  path: string,
  init?: { body?: string; method?: "GET" | "POST" }
) {
  const cred = await loadCredential(deps, "neon");
  if (!cred.ok) {
    return cred;
  }
  return callProvider({
    base: BASE,
    descriptor,
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    path,
    signal: deps.signal,
    token: cred.data.token,
    ...init,
  });
}

function neonListProjects(deps: PluginToolDeps) {
  return tool({
    description: "Liste les projets Neon du compte.",
    execute: async ({ maxResults }) => {
      const result = await neon(deps, "/api/v2/projects");
      if (!result.ok) {
        return { error: result.error };
      }
      const projects = jsonRecords(result.data, "projects")
        .slice(0, maxResults)
        .map((row) => ({
          id: textField(row.id, 60),
          name: textField(row.name, 120),
          pgVersion: textField(row.pg_version, 8),
          region: textField(row.region_id, 40),
        }));
      return {
        projects,
        source: sourceRef(`${BASE}/api/v2/projects`, "Projets Neon"),
        total: projects.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(20).default(10),
    }),
  });
}

function neonListBranches(deps: PluginToolDeps) {
  return tool({
    description: "Liste les branches d'un projet Neon.",
    execute: async ({ maxResults, project }) => {
      const id = projectId(project);
      if (!id) {
        return { error: "Identifiant de projet Neon invalide." };
      }
      const result = await neon(
        deps,
        `/api/v2/projects/${encodeURIComponent(id)}/branches`
      );
      if (!result.ok) {
        return { error: result.error };
      }
      const branches = jsonRecords(result.data, "branches")
        .slice(0, maxResults)
        .map((row) => ({
          id: textField(row.id, 40),
          name: textField(row.name, 80),
          primary: row.primary === true,
        }));
      return {
        branches,
        source: sourceRef(`${BASE}/api/v2/projects`, "Branches Neon"),
        total: branches.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(20).default(10),
      project: z.string().trim().min(1).max(60),
    }),
  });
}

function neonCreateBranch(deps: PluginToolDeps) {
  return tool({
    description:
      "Crée une branche Neon. Cela peut consommer du calcul sur le projet.",
    execute: async ({ name, project }) => {
      const id = projectId(project);
      if (!id || !/^[a-z0-9][a-z0-9-]{0,39}$/.test(name)) {
        return { error: "Projet ou nom de branche Neon invalide." };
      }
      const result = await neon(
        deps,
        `/api/v2/projects/${encodeURIComponent(id)}/branches`,
        {
          body: JSON.stringify({ branch: { name } }),
          method: "POST",
        }
      );
      if (!result.ok) {
        return { error: result.error };
      }
      const payload = result.data as {
        branch?: { id?: unknown; name?: unknown };
      };
      return {
        created: true,
        id: textField(payload.branch?.id, 40),
        name: textField(payload.branch?.name, 80),
        source: sourceRef(`${BASE}/api/v2/projects`, "Branche Neon"),
      };
    },
    inputSchema: z.object({
      name: z.string().trim().min(1).max(40),
      project: z.string().trim().min(1).max(60),
    }),
  });
}

export const neonPlugin: PluginDefinition = {
  createTools: (deps) => ({
    neonCreateBranch: neonCreateBranch(deps),
    neonListBranches: neonListBranches(deps),
    neonListProjects: neonListProjects(deps),
  }),
  manifest: manifest as PluginManifest,
};
