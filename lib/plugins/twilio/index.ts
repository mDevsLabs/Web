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
 * Twilio s'authentifie en Basic : Account SID et Auth Token. Le SID est un
 * identifiant, le token est le secret. L'envoi de SMS est une écriture.
 */

const descriptor = getIntegrationProvider("twilio")!;
const BASE = "https://api.twilio.com";
const RECONNECT =
  "Connexion Twilio incomplète. Enregistrez à nouveau le jeton depuis la fiche du plugin.";

function e164(value: string): string | null {
  return /^\+[1-9]\d{7,14}$/.test(value) ? value : null;
}

async function twilio(
  deps: PluginToolDeps,
  path: string,
  init?: {
    body?: string;
    method?: "GET" | "POST";
    query?: Record<string, string | number | undefined>;
  }
) {
  const cred = await loadCredential(deps, "twilio");
  if (!cred.ok) {
    return cred;
  }
  const accountSid = readStoredField(
    cred.data.fields,
    "accountSid",
    "twilio-sid"
  );
  if (!accountSid) {
    return { error: RECONNECT, ok: false as const };
  }
  const result = await callProvider({
    auth: { kind: "basic", userField: "accountSid" },
    base: BASE,
    descriptor,
    fields: { accountSid },
    headers:
      init?.method === "POST"
        ? { "Content-Type": "application/x-www-form-urlencoded" }
        : undefined,
    path: path.replace("{sid}", encodeURIComponent(accountSid)),
    signal: deps.signal,
    token: cred.data.token,
    ...init,
  });
  if (!result.ok) {
    return result;
  }
  return { data: result.data, ok: true as const };
}

function twilioListNumbers(deps: PluginToolDeps) {
  return tool({
    description: "Liste les numéros Twilio du compte.",
    execute: async ({ maxResults }) => {
      const result = await twilio(
        deps,
        "/2010-04-01/Accounts/{sid}/IncomingPhoneNumbers.json",
        { query: { PageSize: maxResults } }
      );
      if (!result.ok) {
        return { error: result.error };
      }
      const numbers = jsonRecords(result.data, "incoming_phone_numbers")
        .slice(0, maxResults)
        .map((row) => ({
          friendlyName: textField(row.friendly_name, 80),
          phoneNumber: textField(row.phone_number, 20),
        }));
      return {
        numbers,
        source: sourceRef(`${BASE}/2010-04-01/Accounts`, "Numéros Twilio"),
        total: numbers.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(20).default(10),
    }),
  });
}

function twilioListMessages(deps: PluginToolDeps) {
  return tool({
    description: "Liste les SMS Twilio récents du compte.",
    execute: async ({ maxResults }) => {
      const result = await twilio(
        deps,
        "/2010-04-01/Accounts/{sid}/Messages.json",
        {
          query: { PageSize: maxResults },
        }
      );
      if (!result.ok) {
        return { error: result.error };
      }
      const messages = jsonRecords(result.data, "messages")
        .slice(0, maxResults)
        .map((row) => ({
          body: textField(row.body, 160),
          date: textField(row.date_sent, 40),
          from: textField(row.from, 20),
          status: textField(row.status, 20),
          to: textField(row.to, 20),
        }));
      return {
        messages,
        source: sourceRef(`${BASE}/2010-04-01/Accounts`, "Messages Twilio"),
        total: messages.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(20).default(10),
    }),
  });
}

function twilioSendSms(deps: PluginToolDeps) {
  return tool({
    description: "Envoie un SMS depuis un numéro Twilio du compte.",
    execute: async ({ body, from, to }) => {
      const sender = e164(from);
      const recipient = e164(to);
      if (!sender || !recipient) {
        return {
          error:
            "Numéro invalide : utilisez le format international +33612345678.",
        };
      }
      const result = await twilio(
        deps,
        "/2010-04-01/Accounts/{sid}/Messages.json",
        {
          body: new URLSearchParams({
            Body: body,
            From: sender,
            To: recipient,
          }).toString(),
          method: "POST",
        }
      );
      if (!result.ok) {
        return { error: result.error };
      }
      const payload = result.data as { sid?: unknown; status?: unknown };
      return {
        sent: true,
        sid: textField(payload.sid, 40),
        source: sourceRef(`${BASE}/2010-04-01/Accounts`, "SMS Twilio"),
        status: textField(payload.status, 20),
        to: recipient,
      };
    },
    inputSchema: z.object({
      body: z.string().trim().min(1).max(320),
      from: z.string().trim().max(20),
      to: z.string().trim().max(20),
    }),
  });
}

export const twilioPlugin: PluginDefinition = {
  createTools: (deps) => ({
    twilioListMessages: twilioListMessages(deps),
    twilioListNumbers: twilioListNumbers(deps),
    twilioSendSms: twilioSendSms(deps),
  }),
  manifest: manifest as PluginManifest,
};
