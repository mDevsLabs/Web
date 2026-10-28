import { tool } from "ai";
import { z } from "zod";
import { getIntegrationProvider } from "@/lib/integrations/providers";
import { readStoredField } from "@/lib/integrations/token-fields";
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
 * Docker Hub échange l'identifiant et le jeton contre un JWT. Le dépôt créé
 * est privé : un dépôt public ne se retire pas d'un geste.
 */

const descriptor = getIntegrationProvider("dockerhub")!;
const BASE = "https://hub.docker.com";
const RECONNECT =
  "Connexion Docker Hub incomplète. Enregistrez à nouveau le jeton depuis la fiche du plugin.";

function repoName(value: string): string | null {
  return /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(value) && value.length <= 80
    ? value
    : null;
}

async function session(deps: PluginToolDeps) {
  const cred = await loadCredential(deps, "dockerhub");
  if (!cred.ok) {
    return cred;
  }
  const username = readStoredField(
    cred.data.fields,
    "username",
    "docker-username"
  );
  if (!username) {
    return { error: RECONNECT, ok: false as const };
  }
  const login = await callProvider({
    auth: { kind: "none" },
    base: BASE,
    body: JSON.stringify({ password: cred.data.token, username }),
    descriptor,
    headers: { "Content-Type": "application/json" },
    method: "POST",
    path: "/v2/users/login/",
    signal: deps.signal,
    token: cred.data.token,
  });
  if (!login.ok) {
    return login;
  }
  const record = asRecord(login.data);
  const jwt =
    typeof record?.token === "string"
      ? record.token
      : typeof record?.access_token === "string"
        ? record.access_token
        : null;
  if (!jwt) {
    return {
      error: "Docker Hub n'a pas délivré de session.",
      ok: false as const,
    };
  }
  return { data: { jwt, username }, ok: true as const };
}

async function hub(
  deps: PluginToolDeps,
  path: string,
  init?: {
    body?: string;
    method?: "GET" | "POST";
    query?: Record<string, number>;
  }
) {
  const opened = await session(deps);
  if (!opened.ok) {
    return opened;
  }
  const result = await callProvider({
    auth: { kind: "prefix", prefix: "JWT" },
    base: BASE,
    body: init?.body,
    descriptor,
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    method: init?.method,
    path,
    query: init?.query,
    signal: deps.signal,
    token: opened.data.jwt,
  });
  if (!result.ok) {
    return result;
  }
  return {
    data: { payload: result.data, username: opened.data.username },
    ok: true as const,
  };
}

function dockerListRepos(deps: PluginToolDeps) {
  return tool({
    description: "Liste les dépôts Docker Hub du compte connecté.",
    execute: async ({ maxResults }) => {
      const opened = await session(deps);
      if (!opened.ok) {
        return { error: opened.error };
      }
      const path = `/v2/repositories/${encodeURIComponent(opened.data.username)}/`;
      const listed = await callProvider({
        auth: { kind: "prefix", prefix: "JWT" },
        base: BASE,
        descriptor,
        path,
        query: { page_size: maxResults },
        signal: deps.signal,
        token: opened.data.jwt,
      });
      if (!listed.ok) {
        return { error: listed.error };
      }
      const repos = jsonRecords(listed.data, "results")
        .slice(0, maxResults)
        .map((row) => ({
          description: textField(row.description, 160),
          name: textField(row.name, 80),
          private: row.is_private === true,
        }));
      return {
        repos,
        source: sourceRef(`${BASE}${path}`, "Dépôts Docker Hub"),
        total: repos.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(20).default(10),
    }),
  });
}

function dockerListTags(deps: PluginToolDeps) {
  return tool({
    description: "Liste les étiquettes d'un dépôt Docker Hub du compte.",
    execute: async ({ maxResults, repository }) => {
      const name = repoName(repository.trim());
      if (!name) {
        return { error: "Nom de dépôt Docker Hub invalide." };
      }
      const opened = await session(deps);
      if (!opened.ok) {
        return { error: opened.error };
      }
      const path = `/v2/repositories/${encodeURIComponent(opened.data.username)}/${encodeURIComponent(name)}/tags/`;
      const listed = await callProvider({
        auth: { kind: "prefix", prefix: "JWT" },
        base: BASE,
        descriptor,
        path,
        query: { page_size: maxResults },
        signal: deps.signal,
        token: opened.data.jwt,
      });
      if (!listed.ok) {
        return { error: listed.error };
      }
      const tags = jsonRecords(listed.data, "results")
        .slice(0, maxResults)
        .map((row) => ({
          lastUpdated: textField(row.last_updated, 40),
          name: textField(row.name, 80),
        }));
      return {
        source: sourceRef(`${BASE}${path}`, "Étiquettes Docker Hub"),
        tags,
        total: tags.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(20).default(10),
      repository: z.string().trim().min(1).max(80),
    }),
  });
}

function dockerCreateRepo(deps: PluginToolDeps) {
  return tool({
    description: "Crée un dépôt Docker Hub privé sur le compte connecté.",
    execute: async ({ description, name }) => {
      const repository = repoName(name.trim());
      if (!repository) {
        return { error: "Nom de dépôt Docker Hub invalide." };
      }
      const opened = await session(deps);
      if (!opened.ok) {
        return { error: opened.error };
      }
      const result = await hub(deps, "/v2/repositories/", {
        body: JSON.stringify({
          description: description?.slice(0, 200) ?? "",
          is_private: true,
          name: repository,
          namespace: opened.data.username,
        }),
        method: "POST",
      });
      if (!result.ok) {
        return { error: result.error };
      }
      return {
        created: true,
        name: repository,
        private: true,
        source: sourceRef(`${BASE}/v2/repositories/`, "Dépôt Docker Hub"),
      };
    },
    inputSchema: z.object({
      description: z.string().trim().max(200).optional(),
      name: z.string().trim().min(1).max(80),
    }),
  });
}

export const dockerhubPlugin: PluginDefinition = {
  createTools: (deps) => ({
    dockerCreateRepo: dockerCreateRepo(deps),
    dockerListRepos: dockerListRepos(deps),
    dockerListTags: dockerListTags(deps),
  }),
  manifest: manifest as PluginManifest,
};
