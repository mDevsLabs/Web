import { tool } from "ai";
import { z } from "zod";
import { getIntegrationProvider } from "@/lib/integrations/providers";
import { readStoredField } from "@/lib/integrations/token-fields";
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
 * Make : la zone (eu1, eu2, us1, us2) vient du coffre et fixe l'hôte.
 * Exécuter un scénario le lance vraiment : écriture, Agent, approbation.
 */

const descriptor = getIntegrationProvider("make")!;
const RECONNECT =
  "Connexion Make incomplète. Enregistrez à nouveau le jeton depuis la fiche du plugin.";

async function make(
  deps: PluginToolDeps,
  path: string,
  init?: {
    body?: string;
    method?: "GET" | "POST";
    query?: Record<string, string | number | undefined>;
  }
) {
  const cred = await loadCredential(deps, "make");
  if (!cred.ok) {
    return cred;
  }
  const zone = readStoredField(cred.data.fields, "zone", "make-zone");
  if (!zone) {
    return { error: RECONNECT, ok: false as const };
  }
  return callProvider({
    auth: { kind: "prefix", prefix: "Token" },
    base: `https://${zone}.make.com`,
    descriptor,
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    path,
    signal: deps.signal,
    token: cred.data.token,
    ...init,
  });
}

function rows(payload: unknown, key: string) {
  const found = jsonRecords(payload, key);
  return found.length > 0 ? found : jsonRecords(payload, "data");
}

function makeListOrganizations(deps: PluginToolDeps) {
  return tool({
    description: "Liste les organisations Make de la zone connectée.",
    execute: async ({ maxResults }) => {
      const result = await make(deps, "/api/v2/organizations", {
        query: { "pg[limit]": maxResults },
      });
      if (!result.ok) {
        return { error: result.error };
      }
      const organizations = rows(result.data, "organizations")
        .slice(0, maxResults)
        .map((row) => ({
          id: textField(row.id, 20),
          name: textField(row.name, 120),
        }));
      return {
        organizations,
        source: sourceRef(
          "https://www.make.com/en/api-documentation",
          "Organisations Make"
        ),
        total: organizations.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(20).default(10),
    }),
  });
}

function makeListScenarios(deps: PluginToolDeps) {
  return tool({
    description: "Liste les scénarios Make d'une organisation.",
    execute: async ({ maxResults, organizationId }) => {
      const result = await make(deps, "/api/v2/scenarios", {
        query: { organizationId, "pg[limit]": maxResults },
      });
      if (!result.ok) {
        return { error: result.error };
      }
      const scenarios = rows(result.data, "scenarios")
        .slice(0, maxResults)
        .map((row) => ({
          id: textField(row.id, 20),
          name: textField(row.name, 160),
        }));
      return {
        scenarios,
        source: sourceRef(
          "https://www.make.com/en/api-documentation",
          "Scénarios Make"
        ),
        total: scenarios.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(20).default(10),
      organizationId: z.number().int().positive().max(1_000_000_000_000),
    }),
  });
}

function makeRunScenario(deps: PluginToolDeps) {
  return tool({
    description:
      "Exécute un scénario Make déjà actif. Les entrées obligatoires du scénario ne sont pas envoyées.",
    execute: async ({ scenarioId }) => {
      const result = await make(deps, `/api/v2/scenarios/${scenarioId}/run`, {
        body: "{}",
        method: "POST",
      });
      if (!result.ok) {
        return { error: result.error };
      }
      return {
        ran: true,
        scenarioId,
        source: sourceRef(
          "https://www.make.com/en/api-documentation",
          "Exécution Make"
        ),
      };
    },
    inputSchema: z.object({
      scenarioId: z.number().int().positive().max(1_000_000_000_000),
    }),
  });
}

export const makePlugin: PluginDefinition = {
  createTools: (deps) => ({
    makeListOrganizations: makeListOrganizations(deps),
    makeListScenarios: makeListScenarios(deps),
    makeRunScenario: makeRunScenario(deps),
  }),
  manifest: manifest as PluginManifest,
};
