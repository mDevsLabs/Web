import { tool } from "ai";
import { z } from "zod";
import { getIntegrationProvider } from "@/lib/integrations/providers";
import {
  asRecord,
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
 * API de gestion Supabase, pas l'API de données d'un projet. Créer un projet
 * facture le compte et demande un mot de passe de base : ce n'est pas exposé.
 */

const descriptor = getIntegrationProvider("supabase")!;
const BASE = "https://api.supabase.com";

function projectRef(value: string): string | null {
  return /^[a-z]{20}$/.test(value) ? value : null;
}

async function supabase(deps: PluginToolDeps, path: string) {
  const cred = await loadCredential(deps, "supabase");
  if (!cred.ok) {
    return cred;
  }
  return callProvider({
    base: BASE,
    descriptor,
    path,
    signal: deps.signal,
    token: cred.data.token,
  });
}

function supabaseListOrganizations(deps: PluginToolDeps) {
  return tool({
    description: "Liste les organisations Supabase du compte.",
    execute: async () => {
      const result = await supabase(deps, "/v1/organizations");
      if (!result.ok) {
        return { error: result.error };
      }
      const organizations = jsonRecords(result.data)
        .slice(0, 20)
        .map((row) => ({
          id: textField(row.id, 40),
          name: textField(row.name, 120),
          slug: textField(row.slug, 80),
        }));
      return {
        organizations,
        source: sourceRef(`${BASE}/v1/organizations`, "Organisations Supabase"),
        total: organizations.length,
      };
    },
    inputSchema: z.object({}),
  });
}

function supabaseListProjects(deps: PluginToolDeps) {
  return tool({
    description: "Liste les projets Supabase du compte.",
    execute: async ({ maxResults }) => {
      const result = await supabase(deps, "/v1/projects");
      if (!result.ok) {
        return { error: result.error };
      }
      const projects = jsonRecords(result.data)
        .slice(0, maxResults)
        .map((row) => ({
          name: textField(row.name, 120),
          ref: textField(row.ref, 20),
          region: textField(row.region, 40),
          status: textField(row.status, 20),
        }));
      return {
        projects,
        source: sourceRef(`${BASE}/v1/projects`, "Projets Supabase"),
        total: projects.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(20).default(10),
    }),
  });
}

function supabaseGetProject(deps: PluginToolDeps) {
  return tool({
    description: "Détail d'un projet Supabase : nom, région et état.",
    execute: async ({ ref }) => {
      const id = projectRef(ref);
      if (!id) {
        return { error: "Référence de projet Supabase invalide." };
      }
      const result = await supabase(deps, `/v1/projects/${id}`);
      if (!result.ok) {
        return { error: result.error };
      }
      const row = asRecord(result.data);
      return {
        name: textField(row?.name, 120),
        ref: textField(row?.ref, 20),
        region: textField(row?.region, 40),
        source: sourceRef(`${BASE}/v1/projects/${id}`, "Projet Supabase"),
        status: textField(row?.status, 20),
      };
    },
    inputSchema: z.object({
      ref: z.string().trim().length(20),
    }),
  });
}

export const supabasePlugin: PluginDefinition = {
  createTools: (deps) => ({
    supabaseGetProject: supabaseGetProject(deps),
    supabaseListOrganizations: supabaseListOrganizations(deps),
    supabaseListProjects: supabaseListProjects(deps),
  }),
  manifest: manifest as PluginManifest,
};
