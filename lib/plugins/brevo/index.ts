import { tool } from "ai";
import { z } from "zod";
import { getIntegrationProvider } from "@/lib/integrations/providers";
import { normalizeEmail } from "@/lib/integrations/token-fields";
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
 * Brevo : lecture des contacts et des listes. L'envoi est un seul e-mail
 * texte, dans l'Agent, après approbation. L'expéditeur doit déjà être vérifié
 * chez Brevo, sinon l'API refuse.
 */

const descriptor = getIntegrationProvider("brevo")!;
const BASE = "https://api.brevo.com";

async function brevo(
  deps: PluginToolDeps,
  path: string,
  init?: {
    body?: string;
    method?: "GET" | "POST";
    query?: Record<string, string | number | undefined>;
  }
) {
  const cred = await loadCredential(deps, "brevo");
  if (!cred.ok) {
    return cred;
  }
  return callProvider({
    auth: { kind: "header", name: "api-key" },
    base: BASE,
    descriptor,
    headers:
      init?.method === "POST"
        ? { "Content-Type": "application/json" }
        : undefined,
    path,
    signal: deps.signal,
    token: cred.data.token,
    ...init,
  });
}

function brevoListContacts(deps: PluginToolDeps) {
  return tool({
    description: "Liste des contacts Brevo récents.",
    execute: async ({ maxResults }) => {
      const result = await brevo(deps, "/v3/contacts", {
        query: { limit: maxResults, offset: 0 },
      });
      if (!result.ok) {
        return { error: result.error };
      }
      const contacts = jsonRecords(result.data, "contacts")
        .slice(0, maxResults)
        .map((row) => ({
          email: textField(row.email, 180),
          id: textField(row.id, 20),
        }));
      return {
        contacts,
        source: sourceRef(`${BASE}/v3/contacts`, "Contacts Brevo"),
        total: contacts.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(20).default(10),
    }),
  });
}

function brevoListLists(deps: PluginToolDeps) {
  return tool({
    description: "Liste des listes de contacts Brevo.",
    execute: async ({ maxResults }) => {
      const result = await brevo(deps, "/v3/contacts/lists", {
        query: { limit: maxResults, offset: 0 },
      });
      if (!result.ok) {
        return { error: result.error };
      }
      const lists = jsonRecords(result.data, "lists")
        .slice(0, maxResults)
        .map((row) => ({
          id: textField(row.id, 20),
          name: textField(row.name, 120),
        }));
      return {
        lists,
        source: sourceRef(`${BASE}/v3/contacts/lists`, "Listes Brevo"),
        total: lists.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(20).default(10),
    }),
  });
}

function brevoSendEmail(deps: PluginToolDeps) {
  return tool({
    description:
      "Envoie un e-mail texte Brevo à un seul destinataire, depuis une adresse déjà vérifiée.",
    execute: async ({ senderEmail, subject, text, to }) => {
      const sender = normalizeEmail(senderEmail);
      const recipient = normalizeEmail(to);
      if (!sender || !recipient) {
        return { error: "Adresse e-mail invalide." };
      }
      const result = await brevo(deps, "/v3/smtp/email", {
        body: JSON.stringify({
          sender: { email: sender },
          subject,
          textContent: text,
          to: [{ email: recipient }],
        }),
        method: "POST",
      });
      if (!result.ok) {
        return { error: result.error };
      }
      const payload = result.data as { messageId?: unknown };
      return {
        messageId: textField(payload.messageId, 80),
        sent: true,
        source: sourceRef(`${BASE}/v3/smtp/email`, "E-mail Brevo"),
        to: recipient,
      };
    },
    inputSchema: z.object({
      senderEmail: z.string().trim().max(254),
      subject: z.string().trim().min(1).max(200),
      text: z.string().trim().min(1).max(2000),
      to: z.string().trim().max(254),
    }),
  });
}

export const brevoPlugin: PluginDefinition = {
  createTools: (deps) => ({
    brevoListContacts: brevoListContacts(deps),
    brevoListLists: brevoListLists(deps),
    brevoSendEmail: brevoSendEmail(deps),
  }),
  manifest: manifest as PluginManifest,
};
