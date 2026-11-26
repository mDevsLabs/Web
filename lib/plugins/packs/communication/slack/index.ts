import { tool } from "ai";
import { z } from "zod";
import { getIntegrationProvider } from "@/lib/integrations/providers";
import type {
  PluginDefinition,
  PluginManifest,
  PluginToolDeps,
} from "../../../core/types";
import {
  bearerFor,
  callAuthorized,
  clampLimit,
} from "../../../shared/authorized-api";
import { asRecord, jsonRecords, textField } from "../../../shared/bearer-read";
import { sourceRef, truncateText } from "../../../shared/public-api";
import manifest from "./index.json";

const descriptor = getIntegrationProvider("slack")!;
const BASE = "https://slack.com/api";

const channelIdSchema = z
  .string()
  .trim()
  .regex(/^[CGD][A-Z0-9]{6,20}$/, "Identifiant de salon Slack invalide.");

const tsSchema = z
  .string()
  .trim()
  .regex(
    /^\d{10}\.\d{6}$/,
    "Timestamp Slack invalide (ex. 1700000000.000100)."
  );

async function slackCall(
  deps: PluginToolDeps,
  endpoint: string,
  options: {
    body?: Record<string, unknown>;
    method?: "GET" | "POST";
    query?: Record<string, string | number | undefined>;
  } = {}
) {
  const token = await bearerFor(deps, "slack");
  if (!token.ok) {
    return token;
  }
  const result = await callAuthorized<Record<string, unknown>>({
    accessToken: token.data,
    base: BASE,
    body: options.body ? JSON.stringify(options.body) : undefined,
    descriptor,
    headers: options.body
      ? { "Content-Type": "application/json; charset=utf-8" }
      : undefined,
    method: options.method ?? "GET",
    path: `/${endpoint}`,
    query: options.query,
    signal: deps.signal,
  });
  if (!result.ok) {
    return result;
  }
  if (result.data.ok !== true) {
    const code = textField(result.data.error, 80) ?? "slack_error";
    return {
      error: `Slack a refusé l'appel (${code}). Vérifiez que le bot est invité dans le salon et dispose des portées requises.`,
      ok: false as const,
    };
  }
  return { data: result.data, ok: true as const };
}

function shapeMessage(row: Record<string, unknown>) {
  return {
    replyCount: typeof row.reply_count === "number" ? row.reply_count : 0,
    text: truncateText(row.text, 1800),
    threadTs: textField(row.thread_ts, 32),
    ts: textField(row.ts, 32),
    user: textField(row.user ?? row.bot_id, 40),
  };
}

function slackListChannels(deps: PluginToolDeps) {
  return tool({
    description: "Liste les salons publics et privés accessibles au bot Slack.",
    execute: async ({ maxResults, search }) => {
      const limit = clampLimit(maxResults, 25, 100);
      const result = await slackCall(deps, "conversations.list", {
        query: {
          exclude_archived: "true",
          limit: 100,
          types: "public_channel,private_channel",
        },
      });
      if (!result.ok) {
        return { error: result.error };
      }
      const term = search?.trim().toLowerCase();
      const channels = jsonRecords(result.data, "channels")
        .filter((row) =>
          term
            ? String(row.name ?? "")
                .toLowerCase()
                .includes(term)
            : true
        )
        .slice(0, limit)
        .map((row) => {
          const topic = asRecord(row.topic);
          return {
            id: textField(row.id, 32),
            isMember: row.is_member === true,
            isPrivate: row.is_private === true,
            name: textField(row.name, 100),
            topic: textField(topic?.value, 200),
          };
        });
      return {
        channels,
        source: sourceRef(`${BASE}/conversations.list`, "Salons Slack"),
        total: channels.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(100).default(25),
      search: z.string().max(80).optional(),
    }),
  });
}

function slackReadMessages(deps: PluginToolDeps) {
  return tool({
    description: "Lit les derniers messages d'un salon Slack.",
    execute: async ({ channelId, limit }) => {
      const capped = clampLimit(limit, 20, 50);
      const result = await slackCall(deps, "conversations.history", {
        query: { channel: channelId, limit: capped },
      });
      if (!result.ok) {
        return { error: result.error };
      }
      const messages = jsonRecords(result.data, "messages")
        .slice(0, capped)
        .map(shapeMessage);
      return {
        messages,
        source: sourceRef(`${BASE}/conversations.history`, "Messages Slack"),
        total: messages.length,
      };
    },
    inputSchema: z.object({
      channelId: channelIdSchema,
      limit: z.number().int().min(1).max(50).default(20),
    }),
  });
}

function slackGetThread(deps: PluginToolDeps) {
  return tool({
    description: "Lit les réponses d'un fil de discussion Slack.",
    execute: async ({ channelId, limit, threadTs }) => {
      const capped = clampLimit(limit, 30, 50);
      const result = await slackCall(deps, "conversations.replies", {
        query: { channel: channelId, limit: capped, ts: threadTs },
      });
      if (!result.ok) {
        return { error: result.error };
      }
      const messages = jsonRecords(result.data, "messages")
        .slice(0, capped)
        .map(shapeMessage);
      return {
        messages,
        source: sourceRef(`${BASE}/conversations.replies`, "Fil Slack"),
        total: messages.length,
      };
    },
    inputSchema: z.object({
      channelId: channelIdSchema,
      limit: z.number().int().min(1).max(50).default(30),
      threadTs: tsSchema,
    }),
  });
}

function slackSendMessage(deps: PluginToolDeps) {
  return tool({
    description:
      "Envoie un message dans un salon Slack (ou dans un fil via threadTs). Écriture soumise à approbation dans l'Agent.",
    execute: async ({ channelId, text, threadTs }) => {
      const result = await slackCall(deps, "chat.postMessage", {
        body: {
          channel: channelId,
          text: text.trim().slice(0, 3000),
          ...(threadTs ? { thread_ts: threadTs } : {}),
        },
        method: "POST",
      });
      if (!result.ok) {
        return { error: result.error };
      }
      return {
        channel: textField(result.data.channel, 32),
        sent: true,
        source: sourceRef(`${BASE}/chat.postMessage`, "Message Slack envoyé"),
        ts: textField(result.data.ts, 32),
      };
    },
    inputSchema: z.object({
      channelId: channelIdSchema,
      text: z.string().trim().min(1).max(3000),
      threadTs: tsSchema.optional(),
    }),
  });
}

export const slackPlugin: PluginDefinition = {
  createTools: (deps) => ({
    slackGetThread: slackGetThread(deps),
    slackListChannels: slackListChannels(deps),
    slackReadMessages: slackReadMessages(deps),
    slackSendMessage: slackSendMessage(deps),
  }),
  manifest: manifest as PluginManifest,
};
