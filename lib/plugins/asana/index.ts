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
 * Asana en lecture des espaces et des tâches, création d'une tâche seulement
 * dans l'Agent. L'identifiant d'espace vient de la liste, pas d'une URL.
 */

const descriptor = getIntegrationProvider("asana")!;
const BASE = "https://app.asana.com";

function gid(value: string): string | null {
  return /^\d{1,20}$/.test(value) ? value : null;
}

async function asana(
  deps: PluginToolDeps,
  path: string,
  init?: {
    body?: string;
    method?: "GET" | "POST";
    query?: Record<string, string | number | undefined>;
  }
) {
  const cred = await loadCredential(deps, "asana");
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

function asanaListWorkspaces(deps: PluginToolDeps) {
  return tool({
    description: "Liste les espaces de travail Asana du compte.",
    execute: async () => {
      const result = await asana(deps, "/api/1.0/workspaces");
      if (!result.ok) {
        return { error: result.error };
      }
      const workspaces = jsonRecords(result.data, "data")
        .slice(0, 20)
        .map((row) => ({
          gid: textField(row.gid, 20),
          name: textField(row.name, 120),
        }));
      return {
        source: sourceRef(`${BASE}/api/1.0/workspaces`, "Espaces Asana"),
        total: workspaces.length,
        workspaces,
      };
    },
    inputSchema: z.object({}),
  });
}

function asanaListTasks(deps: PluginToolDeps) {
  return tool({
    description: "Liste les tâches Asana assignées au compte dans un espace.",
    execute: async ({ maxResults, workspace }) => {
      const workspaceGid = gid(workspace);
      if (!workspaceGid) {
        return { error: "Identifiant d'espace Asana invalide." };
      }
      const result = await asana(deps, "/api/1.0/tasks", {
        query: {
          assignee: "me",
          limit: maxResults,
          workspace: workspaceGid,
        },
      });
      if (!result.ok) {
        return { error: result.error };
      }
      const tasks = jsonRecords(result.data, "data")
        .slice(0, maxResults)
        .map((row) => ({
          completed: row.completed === true,
          gid: textField(row.gid, 20),
          name: textField(row.name, 200),
        }));
      return {
        source: sourceRef(`${BASE}/api/1.0/tasks`, "Tâches Asana"),
        tasks,
        total: tasks.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(20).default(10),
      workspace: z.string().trim().min(1).max(20),
    }),
  });
}

function asanaCreateTask(deps: PluginToolDeps) {
  return tool({
    description: "Crée une tâche Asana dans un espace de travail.",
    execute: async ({ name, notes, workspace }) => {
      const workspaceGid = gid(workspace);
      if (!workspaceGid) {
        return { error: "Identifiant d'espace Asana invalide." };
      }
      const result = await asana(deps, "/api/1.0/tasks", {
        body: JSON.stringify({
          data: {
            name,
            notes: notes ?? "",
            workspace: workspaceGid,
          },
        }),
        method: "POST",
      });
      if (!result.ok) {
        return { error: result.error };
      }
      const created = (
        result.data as { data?: { gid?: unknown; permalink_url?: unknown } }
      ).data;
      return {
        created: true,
        gid: textField(created?.gid, 20),
        source: sourceRef(`${BASE}/api/1.0/tasks`, "Tâche Asana"),
        url: textField(created?.permalink_url, 300),
      };
    },
    inputSchema: z.object({
      name: z.string().trim().min(1).max(200),
      notes: z.string().trim().max(2000).optional(),
      workspace: z.string().trim().min(1).max(20),
    }),
  });
}

export const asanaPlugin: PluginDefinition = {
  createTools: (deps) => ({
    asanaCreateTask: asanaCreateTask(deps),
    asanaListTasks: asanaListTasks(deps),
    asanaListWorkspaces: asanaListWorkspaces(deps),
  }),
  manifest: manifest as PluginManifest,
};
