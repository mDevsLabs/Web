import { tool } from "ai";
import { z } from "zod";
import { getIntegrationProvider } from "@/lib/integrations/providers";
import {
  bearerFor,
  callAuthorized,
  encodeSegment,
} from "../shared/authorized-api";
import { sourceRef, truncateText } from "../shared/public-api";
import type {
  PluginDefinition,
  PluginManifest,
  PluginToolDeps,
} from "../types";
import manifest from "./index.json";

/**
 * Connecteur Discord.
 *
 * Deux porteurs, et ce n'est pas un détail d'implémentation :
 *
 *  - le jeton OAuth de l'utilisateur identifie la personne et liste SES
 *    serveurs (`/users/@me`, `/users/@me/guilds`) ;
 *  - un jeton UTILISATEUR ne permet PAS de lire les messages d'un serveur ;
 *    il faut un bot, présent dans le serveur, avec la permission « Voir les
 *    salons » et « Lire l'historique ». C'est `DISCORD_BOT_TOKEN`, une
 *    variable d'INSTANCE : le bot appartient au déploiement, pas au compte.
 *
 * L'absence du bot n'empêche donc pas la connexion : la fiche l'annonce en
 * avertissement, et les outils qui en dépendent répondent par une phrase
 * explicite au lieu d'un 401 opaque.
 */

const descriptor = getIntegrationProvider("discord")!;
const DISCORD_BASE = "https://discord.com/api/v10";

const DISCORD_HEADERS = {
  Accept: "application/json",
  "User-Agent": "mAI (https://mai.example, 1.0)",
};

/** Le bot d'instance, ou `null` : jamais une variable vide prise pour un jeton. */
function botToken(): string | null {
  const value = process.env.DISCORD_BOT_TOKEN?.trim();
  return value ? value : null;
}

const NO_BOT =
  "Le bot Discord de cette instance n'est pas configuré (DISCORD_BOT_TOKEN absent) : les messages d'un serveur ne sont pas lisibles sans lui.";

function guildIdSchema() {
  return z
    .string()
    .regex(/^\d{5,24}$/, "Un identifiant Discord est numérique.");
}

function channelIdSchema() {
  return z
    .string()
    .regex(/^\d{5,24}$/, "Un identifiant de salon est numérique.");
}

function shapeMessage(message: Record<string, unknown>) {
  const author = message.author as
    | { bot?: boolean; global_name?: string; username?: string }
    | undefined;
  return {
    attachments: Array.isArray(message.attachments)
      ? (message.attachments as { url?: string }[])
          .slice(0, 5)
          .map((item) => item.url)
          .filter(Boolean)
      : [],
    author: author?.global_name ?? author?.username ?? "Inconnu",
    content: truncateText(message.content, 1800),
    id: message.id,
    isBot: author?.bot === true,
    timestamp: message.timestamp,
  };
}

function discordProfile(deps: PluginToolDeps) {
  return tool({
    description:
      "Profil Discord du compte connecté : nom affiché, identifiant, adresse de contact si accordée.",
    execute: async () => {
      const token = await bearerFor(deps, "discord");
      if (!token.ok) return { error: token.error };
      const result = await callAuthorized<Record<string, unknown>>({
        accessToken: token.data,
        base: DISCORD_BASE,
        descriptor,
        headers: DISCORD_HEADERS,
        path: "/users/@me",
        signal: deps.signal,
      });
      if (!result.ok) return { error: result.error };
      return {
        account: {
          email: result.data.email ?? null,
          globalName: result.data.global_name ?? null,
          id: result.data.id,
          username: result.data.username,
          verified: result.data.verified === true,
        },
        source: sourceRef(`${DISCORD_BASE}/users/@me`, "Profil Discord"),
      };
    },
    inputSchema: z.object({}),
  });
}

function discordListGuilds(deps: PluginToolDeps) {
  return tool({
    description:
      "Liste les serveurs Discord du compte connecté, avec l'indication de ceux où le bot d'instance est présent.",
    execute: async ({ maxResults, search }) => {
      const token = await bearerFor(deps, "discord");
      if (!token.ok) return { error: token.error };
      const result = await callAuthorized<Record<string, unknown>[]>({
        accessToken: token.data,
        base: DISCORD_BASE,
        descriptor,
        headers: DISCORD_HEADERS,
        path: "/users/@me/guilds",
        query: { limit: 200 },
        signal: deps.signal,
      });
      if (!result.ok) return { error: result.error };
      const term = search?.toLowerCase().trim();
      const guilds = (Array.isArray(result.data) ? result.data : [])
        .filter((guild) =>
          term
            ? String(guild.name ?? "")
                .toLowerCase()
                .includes(term)
            : true
        )
        .slice(0, maxResults)
        .map((guild) => ({
          id: guild.id,
          name: guild.name,
          owner: guild.owner === true,
        }));
      return {
        guilds,
        source: sourceRef(
          `${DISCORD_BASE}/users/@me/guilds`,
          "Serveurs Discord"
        ),
        total: guilds.length,
      };
    },
    inputSchema: z.object({
      maxResults: z.number().int().min(1).max(100).default(20),
      search: z.string().max(80).optional(),
    }),
  });
}

function discordListChannels(deps: PluginToolDeps) {
  return tool({
    description:
      "Liste les salons textuels d'un serveur Discord, via le bot de l'instance.",
    execute: async ({ guildId }) => {
      const bot = botToken();
      if (!bot) return { error: NO_BOT };
      const result = await callAuthorized<Record<string, unknown>[]>({
        accessToken: bot,
        base: DISCORD_BASE,
        descriptor,
        headers: DISCORD_HEADERS,
        path: `/guilds/${encodeSegment(guildId)}/channels`,
        signal: deps.signal,
      });
      if (!result.ok) {
        return {
          error:
            result.error.includes("HTTP 403") ||
            result.error.includes("HTTP 404")
              ? "Le bot d'instance n'a pas accès à ce serveur : ajoutez-le au serveur avant de lire ses salons."
              : result.error,
        };
      }
      const channels = (Array.isArray(result.data) ? result.data : [])
        .filter((channel) => channel.type === 0 || channel.type === 5)
        .map((channel) => ({
          id: channel.id,
          name: channel.name,
          topic: truncateText(channel.topic, 200),
        }));
      return {
        channels,
        source: sourceRef(
          `${DISCORD_BASE}/guilds/${guildId}/channels`,
          "Salons Discord"
        ),
        total: channels.length,
      };
    },
    inputSchema: z.object({
      guildId: guildIdSchema(),
    }),
  });
}

function discordReadMessages(deps: PluginToolDeps) {
  return tool({
    description:
      "Lit les derniers messages d'un salon Discord, via le bot de l'instance.",
    execute: async ({ channelId, limit }) => {
      const bot = botToken();
      if (!bot) return { error: NO_BOT };
      const result = await callAuthorized<Record<string, unknown>[]>({
        accessToken: bot,
        base: DISCORD_BASE,
        descriptor,
        headers: DISCORD_HEADERS,
        path: `/channels/${encodeSegment(channelId)}/messages`,
        query: { limit },
        signal: deps.signal,
      });
      if (!result.ok) {
        return {
          error:
            result.error.includes("HTTP 403") ||
            result.error.includes("HTTP 404")
              ? "Ce salon est inaccessible au bot d'instance : vérifiez qu'il est bien ajouté au serveur et qu'il voit ce salon."
              : result.error,
        };
      }
      const messages = (Array.isArray(result.data) ? result.data : [])
        .slice(0, limit)
        .map(shapeMessage);
      return {
        messages,
        source: sourceRef(
          `${DISCORD_BASE}/channels/${channelId}/messages`,
          "Messages Discord"
        ),
        total: messages.length,
      };
    },
    inputSchema: z.object({
      channelId: channelIdSchema(),
      limit: z.number().int().min(1).max(50).default(20),
    }),
  });
}

function discordSendMessage(deps: PluginToolDeps) {
  return tool({
    description:
      "Envoie un message dans un salon Discord, sous l'identité du bot de l'instance.",
    execute: async ({ channelId, content }) => {
      const bot = botToken();
      if (!bot) return { error: NO_BOT };
      const result = await callAuthorized<Record<string, unknown>>({
        accessToken: bot,
        base: DISCORD_BASE,
        body: JSON.stringify({ content: content.trim().slice(0, 2000) }),
        descriptor,
        headers: DISCORD_HEADERS,
        method: "POST",
        path: `/channels/${encodeSegment(channelId)}/messages`,
        signal: deps.signal,
      });
      if (!result.ok) {
        return {
          error: result.error.includes("HTTP 403")
            ? "Le bot d'instance n'a pas la permission d'écrire dans ce salon."
            : result.error,
        };
      }
      return {
        message: shapeMessage(result.data),
        source: sourceRef(
          `${DISCORD_BASE}/channels/${channelId}/messages`,
          "Message envoyé"
        ),
      };
    },
    inputSchema: z.object({
      channelId: channelIdSchema(),
      content: z.string().min(1).max(2000),
    }),
  });
}

export const discordPlugin: PluginDefinition = {
  createTools: (deps) => ({
    discordListChannels: discordListChannels(deps),
    discordListGuilds: discordListGuilds(deps),
    discordProfile: discordProfile(deps),
    discordReadMessages: discordReadMessages(deps),
    discordSendMessage: discordSendMessage(deps),
  }),
  manifest: manifest as PluginManifest,
};
