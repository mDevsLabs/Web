import { tool } from "ai";
import { z } from "zod";
import { getIntegrationProvider } from "@/lib/integrations/providers";
import type {
  PluginDefinition,
  PluginManifest,
  PluginToolDeps,
} from "../../../core/types";
import { encodeSegment } from "../../../shared/authorized-api";
import {
  asRecord,
  jsonRecords,
  readBearer,
  textField,
} from "../../../shared/bearer-read";
import { sourceRef } from "../../../shared/public-api";
import manifest from "./index.json";

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
          lastEvent: textField(row.last_event, 40),
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

function resendGetEmail(deps: PluginToolDeps) {
  return tool({
    description:
      "Lit le statut de livraison d'un e-mail Resend par son identifiant.",
    execute: async ({ emailId }) => {
      const path = `/emails/${encodeSegment(emailId)}`;
      const result = await readBearer({
        base: BASE,
        deps,
        descriptor,
        path,
        providerId: "resend",
      });
      if (!result.ok) return { error: result.error };
      const row = asRecord(result.data);
      return {
        email: row
          ? {
              createdAt: textField(row.created_at, 40),
              from: textField(row.from, 120),
              id: textField(row.id, 80),
              lastEvent: textField(row.last_event, 40),
              subject: textField(row.subject, 200),
              to: Array.isArray(row.to) ? row.to.slice(0, 10) : [],
            }
          : null,
        source: sourceRef(`${BASE}${path}`, "E-mail Resend"),
      };
    },
    inputSchema: z.object({
      emailId: z.string().trim().min(6).max(80),
    }),
  });
}

export const resendPlugin: PluginDefinition = {
  createTools: (deps) => ({
    resendGetEmail: resendGetEmail(deps),
    resendListDomains: resendListDomains(deps),
    resendListEmails: resendListEmails(deps),
  }),
  manifest: manifest as PluginManifest,
};
