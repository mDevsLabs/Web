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
 * npm en lecture. Publier un paquet enverrait du code au registre public :
 * cet outil n'existe pas.
 */

const descriptor = getIntegrationProvider("npm")!;
const BASE = "https://registry.npmjs.org";

function packagePath(name: string): string | null {
  if (
    name.length > 214 ||
    !/^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(name)
  ) {
    return null;
  }
  return `/${name
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/")}`;
}

async function npmCall(
  deps: PluginToolDeps,
  path: string,
  query?: Record<string, string | number | undefined>
) {
  const cred = await loadCredential(deps, "npm");
  if (!cred.ok) {
    return cred;
  }
  return callProvider({
    base: BASE,
    descriptor,
    path,
    query,
    signal: deps.signal,
    token: cred.data.token,
  });
}

function npmWhoami(deps: PluginToolDeps) {
  return tool({
    description: "Nom du compte npm relié par le jeton.",
    execute: async () => {
      const result = await npmCall(deps, "/-/whoami");
      if (!result.ok) {
        return { error: result.error };
      }
      const record = asRecord(result.data);
      return {
        source: sourceRef(`${BASE}/-/whoami`, "Compte npm"),
        username: textField(record?.username, 80),
      };
    },
    inputSchema: z.object({}),
  });
}

function npmGetPackage(deps: PluginToolDeps) {
  return tool({
    description:
      "Fiche publique d'un paquet npm : version, licence, description.",
    execute: async ({ name }) => {
      const path = packagePath(name.trim());
      if (!path) {
        return { error: "Nom de paquet npm invalide." };
      }
      const result = await npmCall(deps, path);
      if (!result.ok) {
        return { error: result.error };
      }
      const record = asRecord(result.data);
      const tags = asRecord(record?.["dist-tags"]);
      return {
        description: textField(record?.description, 300),
        latest: textField(tags?.latest, 40),
        license: textField(record?.license, 40),
        name: textField(record?.name, 214),
        source: sourceRef(`${BASE}${path}`, "Paquet npm"),
      };
    },
    inputSchema: z.object({
      name: z.string().trim().min(1).max(214),
    }),
  });
}

function npmSearch(deps: PluginToolDeps) {
  return tool({
    description: "Cherche des paquets npm par mot-clé.",
    execute: async ({ maxResults, text }) => {
      const result = await npmCall(deps, "/-/v1/search", {
        size: maxResults,
        text,
      });
      if (!result.ok) {
        return { error: result.error };
      }
      const packages = jsonRecords(result.data, "objects")
        .slice(0, maxResults)
        .map((row) => {
          const item = asRecord(row.package);
          return {
            description: textField(item?.description, 200),
            name: textField(item?.name, 214),
            version: textField(item?.version, 40),
          };
        });
      return {
        packages,
        source: sourceRef(`${BASE}/-/v1/search`, "Recherche npm"),
        total: packages.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(10).default(5),
      text: z.string().trim().min(1).max(80),
    }),
  });
}

export const npmPlugin: PluginDefinition = {
  createTools: (deps) => ({
    npmGetPackage: npmGetPackage(deps),
    npmSearch: npmSearch(deps),
    npmWhoami: npmWhoami(deps),
  }),
  manifest: manifest as PluginManifest,
};
