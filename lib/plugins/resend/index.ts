import { tool } from "ai";
import { z } from "zod";
import { getIntegrationProvider } from "@/lib/integrations/providers";
import { jsonRecords, readBearer, textField } from "../shared/bearer-read";
import { sourceRef } from "../shared/public-api";
import type {
  PluginDefinition,
  PluginManifest,
  PluginToolDeps,
} from "../types";
import manifest from "./index.json";

/**
 * Resend en lecture seule.
 * L'envoi d'e-mail n'est pas exposé : une clé API Resend peut écrire à n'importe
 * quel destinataire, et une erreur de modèle ne se rattrape pas.
 */

const descriptor = getIntegrationProvider("resend")!;
const BASE = "https://api.resend.com";

function resendListDomains(deps: PluginToolDeps) {
  return tool({
    description: "Liste les domaines Resend et leur état de vérification.",
    execute: async ({ maxResults }) => {
      const result = await readBearer({
        base: BASE,
        deps,
        descriptor,
        path: "/domains",
        providerId: "resend",
      });
      if (!result.ok) return { error: result.error };
      const domains = jsonRecords(result.data, "data")
        .slice(0, maxResults)
        .map((row) => ({
          id: textField(row.id, 80),
          name: textField(row.name, 120),
          status: textField(row.status, 40),
        }));
      return {
        domains,
        source: sourceRef(`${BASE}/domains`, "Domaines Resend"),
        total: domains.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(50).default(20),
    }),
  });
}

function resendListEmails(deps: PluginToolDeps) {
  return tool({
    description: "Liste les e-mails récemment envoyés via Resend.",
    execute: async ({ maxResults }) => {
      const result = await readBearer({
        base: BASE,
        deps,
        descriptor,
        path: "/emails",
        providerId: "resend",
      });
      if (!result.ok) return { error: result.error };
      const emails = jsonRecords(result.data, "data")
        .slice(0, maxResults)
        .map((row) => ({
          createdAt: textField(row.created_at, 40),
          id: textField(row.id, 80),
          subject: textField(row.subject, 200),
          to: Array.isArray(row.to)
            ? row.to
                .filter((item) => typeof item === "string")
                .slice(0, 5)
                .map((item) => item.slice(0, 120))
            : [],
        }));
      return {
        emails,
        source: sourceRef(`${BASE}/emails`, "E-mails Resend"),
        total: emails.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(50).default(15),
    }),
  });
}

export const resendPlugin: PluginDefinition = {
  createTools: (deps) => ({
    resendListDomains: resendListDomains(deps),
    resendListEmails: resendListEmails(deps),
  }),
  manifest: manifest as PluginManifest,
};
