import { tool } from "ai";
import { z } from "zod";
import { getIntegrationProvider } from "@/lib/integrations/providers";
import { readStoredField } from "@/lib/integrations/token-fields";
import {
  asRecord,
  callProvider,
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
 * Upstash Redis REST : l'URL de la base vient du coffre. SET peut écraser une
 * clé ; c'est une écriture, donc réservée à l'Agent.
 */

const descriptor = getIntegrationProvider("upstash")!;
const RECONNECT =
  "Connexion Upstash incomplète. Enregistrez à nouveau le jeton depuis la fiche du plugin.";

function redisKey(value: string): string | null {
  return /^[\x21-\x7E]{1,120}$/.test(value) ? value : null;
}

async function command(deps: PluginToolDeps, args: string[]) {
  const cred = await loadCredential(deps, "upstash");
  if (!cred.ok) {
    return cred;
  }
  const origin = readStoredField(
    cred.data.fields,
    "restOrigin",
    "upstash-origin"
  );
  if (!origin) {
    return { error: RECONNECT, ok: false as const };
  }
  return callProvider({
    base: origin,
    body: JSON.stringify(args),
    descriptor,
    headers: { "Content-Type": "application/json" },
    method: "POST",
    path: "/",
    signal: deps.signal,
    token: cred.data.token,
  });
}

function upstashGet(deps: PluginToolDeps) {
  return tool({
    description: "Lit une clé Redis Upstash.",
    execute: async ({ key }) => {
      const name = redisKey(key);
      if (!name) {
        return { error: "Clé Upstash invalide." };
      }
      const result = await command(deps, ["GET", name]);
      if (!result.ok) {
        return { error: result.error };
      }
      const record = asRecord(result.data);
      const value = record?.result;
      return {
        found: value !== null && value !== undefined,
        key: name,
        source: sourceRef("https://upstash.io", "Clé Upstash"),
        value: textField(value, 500),
      };
    },
    inputSchema: z.object({
      key: z.string().min(1).max(120),
    }),
  });
}

function upstashSet(deps: PluginToolDeps) {
  return tool({
    description:
      "Écrit une clé Redis Upstash. Une clé déjà présente est écrasée.",
    execute: async ({ key, value }) => {
      const name = redisKey(key);
      if (!name) {
        return { error: "Clé Upstash invalide." };
      }
      const result = await command(deps, ["SET", name, value]);
      if (!result.ok) {
        return { error: result.error };
      }
      const record = asRecord(result.data);
      return {
        key: name,
        source: sourceRef("https://upstash.io", "Écriture Upstash"),
        stored: record?.result === "OK",
      };
    },
    inputSchema: z.object({
      key: z.string().min(1).max(120),
      value: z.string().max(500),
    }),
  });
}

export const upstashPlugin: PluginDefinition = {
  createTools: (deps) => ({
    upstashGet: upstashGet(deps),
    upstashSet: upstashSet(deps),
  }),
  manifest: manifest as PluginManifest,
};
