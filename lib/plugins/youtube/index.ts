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
 * YouTube Data API v3, en lecture. La clé voyage en paramètre `key`.
 * Les chemins sont fixés sur `/youtube/v3` : l'hôte `www.googleapis.com`
 * sert d'autres API Google, que ce plugin n'appelle pas.
 */

const descriptor = getIntegrationProvider("youtube")!;
const BASE = "https://www.googleapis.com";
const VIDEO_ID = /^[\w-]{6,20}$/;

function watchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

async function youtube(
  deps: PluginToolDeps,
  path: string,
  query?: Record<string, string | number | undefined>
) {
  if (!path.startsWith("/youtube/v3/")) {
    return {
      error: "Chemin YouTube refusé.",
      ok: false as const,
    };
  }
  const cred = await loadCredential(deps, "youtube");
  if (!cred.ok) {
    return cred;
  }
  return callProvider({
    auth: { kind: "query", name: "key" },
    base: BASE,
    descriptor,
    path,
    query,
    signal: deps.signal,
    token: cred.data.token,
  });
}

function snippetOf(row: Record<string, unknown>) {
  return asRecord(row.snippet);
}

function videoCard(row: Record<string, unknown>, videoId: string | null) {
  const snippet = snippetOf(row);
  const id = videoId ?? textField(row.id, 20);
  return {
    channel: textField(snippet?.channelTitle, 180),
    channelId: textField(snippet?.channelId, 40),
    description: textField(snippet?.description, 280),
    publishedAt: textField(snippet?.publishedAt, 40),
    title: textField(snippet?.title, 180),
    url: id ? watchUrl(id) : null,
    videoId: id,
  };
}

function youtubeSearchVideos(deps: PluginToolDeps) {
  return tool({
    description: "Cherche des vidéos publiques sur YouTube.",
    execute: async ({ limit, query }) => {
      const result = await youtube(deps, "/youtube/v3/search", {
        maxResults: limit,
        part: "snippet",
        q: query,
        type: "video",
      });
      if (!result.ok) {
        return { error: result.error };
      }
      const videos = jsonRecords(result.data, "items")
        .slice(0, limit)
        .map((row) => {
          const id = asRecord(row.id);
          const videoId = textField(id?.videoId, 20);
          return videoCard(row, videoId);
        });
      return {
        source: sourceRef(`${BASE}/youtube/v3/search`, "Recherche YouTube"),
        total: videos.length,
        videos,
      };
    },
    inputSchema: z.object({
      limit: z.number().int().min(1).max(10).default(5),
      query: z.string().trim().min(1).max(160),
    }),
  });
}

function youtubeVideoDetails(deps: PluginToolDeps) {
  return tool({
    description:
      "Lit la fiche publique d'une vidéo YouTube : titre, durée et statistiques.",
    execute: async ({ videoId }) => {
      if (!VIDEO_ID.test(videoId)) {
        return { error: "Identifiant de vidéo YouTube invalide." };
      }
      const result = await youtube(deps, "/youtube/v3/videos", {
        id: videoId,
        part: "snippet,contentDetails,statistics",
      });
      if (!result.ok) {
        return { error: result.error };
      }
      const row = jsonRecords(result.data, "items")[0];
      if (!row) {
        return { error: "Aucune vidéo publique pour cet identifiant." };
      }
      const content = asRecord(row.contentDetails);
      const stats = asRecord(row.statistics);
      return {
        ...videoCard(row, videoId),
        duration: textField(content?.duration, 40),
        likeCount: textField(stats?.likeCount, 20),
        source: sourceRef(`${BASE}/youtube/v3/videos`, "Fiche vidéo YouTube"),
        viewCount: textField(stats?.viewCount, 20),
      };
    },
    inputSchema: z.object({
      videoId: z.string().trim().min(6).max(20),
    }),
  });
}

function youtubeChannelDetails(deps: PluginToolDeps) {
  return tool({
    description: "Lit la fiche publique d'une chaîne YouTube.",
    execute: async ({ channelId, handle }) => {
      const id = channelId?.trim();
      const name = handle?.trim().replace(/^@/, "");
      if (!id && !name) {
        return { error: "Indiquez un identifiant de chaîne ou un pseudo." };
      }
      if (id && !/^UC[\w-]{10,}$/.test(id)) {
        return { error: "Identifiant de chaîne YouTube invalide." };
      }
      const result = await youtube(deps, "/youtube/v3/channels", {
        ...(id ? { id } : { forHandle: name }),
        part: "snippet,statistics",
      });
      if (!result.ok) {
        return { error: result.error };
      }
      const row = jsonRecords(result.data, "items")[0];
      if (!row) {
        return { error: "Aucune chaîne publique pour cette demande." };
      }
      const snippet = snippetOf(row);
      const stats = asRecord(row.statistics);
      const resolvedId = textField(row.id, 40);
      return {
        channelId: resolvedId,
        customUrl: textField(snippet?.customUrl, 80),
        description: textField(snippet?.description, 280),
        source: sourceRef(
          `${BASE}/youtube/v3/channels`,
          "Fiche chaîne YouTube"
        ),
        subscriberCount: textField(stats?.subscriberCount, 20),
        title: textField(snippet?.title, 180),
        url: resolvedId
          ? `https://www.youtube.com/channel/${resolvedId}`
          : null,
        videoCount: textField(stats?.videoCount, 20),
      };
    },
    inputSchema: z.object({
      channelId: z.string().trim().min(12).max(40).optional(),
      handle: z.string().trim().min(2).max(40).optional(),
    }),
  });
}

export const youtubePlugin: PluginDefinition = {
  createTools: (deps) => ({
    youtubeChannelDetails: youtubeChannelDetails(deps),
    youtubeSearchVideos: youtubeSearchVideos(deps),
    youtubeVideoDetails: youtubeVideoDetails(deps),
  }),
  manifest: manifest as PluginManifest,
};
