import { tool } from "ai";
import { z } from "zod";
import { fetchPublicJson, sourceRef, truncateText } from "../shared/public-api";
import type { PluginDefinition, PluginManifest } from "../types";
import manifest from "./index.json";

const BASE = "https://api.tvmaze.com";
const attribution = "Données TVmaze (CC BY-SA). Attribuer TVmaze et conserver le lien source.";
const headers = { "User-Agent": "mAI-Web/1.0" };
function showView(show: Record<string, unknown>) {
  const image = show.image as { medium?: string; original?: string } | null;
  return {
    id: show.id,
    name: truncateText(show.name, 200),
    type: show.type ?? null,
    language: show.language ?? null,
    genres: Array.isArray(show.genres) ? show.genres.slice(0, 8) : [],
    status: show.status ?? null,
    premiered: show.premiered ?? null,
    ended: show.ended ?? null,
    network: (show.network as { name?: string } | null)?.name ?? (show.webChannel as { name?: string } | null)?.name ?? null,
    rating: (show.rating as { average?: number } | null)?.average ?? null,
    summary: truncateText(typeof show.summary === "string" ? show.summary.replace(/<[^>]*>/g, " ") : "", 1_500),
    url: show.url ?? null,
    image: image?.medium ?? null,
  };
}
function episodeView(episode: Record<string, unknown>) {
  return { id: episode.id, name: truncateText(episode.name, 180), season: episode.season, number: episode.number, airdate: episode.airdate ?? null, airtime: episode.airtime ?? null, runtime: episode.runtime ?? null, summary: truncateText(typeof episode.summary === "string" ? episode.summary.replace(/<[^>]*>/g, " ") : "", 800), url: episode.url ?? null };
}

export const searchTvShows = tool({
  description: "Recherche des séries et émissions dans le catalogue TVmaze.",
  inputSchema: z.object({ limit: z.number().int().min(1).max(10).default(5), query: z.string().min(1).max(100) }),
  execute: async ({ limit, query }) => {
    const url = new URL(`${BASE}/search/shows`);
    url.searchParams.set("q", query);
    const result = await fetchPublicJson<Array<{ score?: number; show: Record<string, unknown> }>>(url.href, headers);
    if (!result.ok) return { error: result.error };
    return { shows: result.data.slice(0, limit).map(({ score, show }) => ({ ...showView(show), matchScore: score ?? null })), attribution, source: sourceRef(url.href, "TVmaze — recherche") };
  },
});

export const getTvShow = tool({
  description: "Récupère la fiche détaillée d'une série TVmaze à partir de son identifiant numérique.",
  inputSchema: z.object({ showId: z.number().int().positive() }),
  execute: async ({ showId }) => {
    const url = `${BASE}/shows/${showId}`;
    const result = await fetchPublicJson<Record<string, unknown>>(url, headers);
    if (!result.ok) return { error: result.error };
    return { show: showView(result.data), attribution, source: sourceRef(String(result.data.url ?? url), "TVmaze — fiche série") };
  },
});

export const listTvEpisodes = tool({
  description: "Liste les épisodes d'une série TVmaze, triés dans l'ordre de diffusion.",
  inputSchema: z.object({ limit: z.number().int().min(1).max(30).default(20), showId: z.number().int().positive() }),
  execute: async ({ limit, showId }) => {
    const url = `${BASE}/shows/${showId}/episodes`;
    const result = await fetchPublicJson<Array<Record<string, unknown>>>(url, headers);
    if (!result.ok) return { error: result.error };
    return { episodes: result.data.slice(0, limit).map(episodeView), totalReturned: Math.min(limit, result.data.length), attribution, source: sourceRef(url, "TVmaze — épisodes") };
  },
});

export const getTvSchedule = tool({
  description: "Recherche les émissions diffusées à une date dans un pays selon le calendrier TVmaze.",
  inputSchema: z.object({ country: z.string().length(2).regex(/^[A-Za-z]{2}$/).default("US"), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), limit: z.number().int().min(1).max(30).default(20) }),
  execute: async ({ country, date, limit }) => {
    const parsedDate = new Date(`${date}T00:00:00Z`);
    if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) return { error: "Date invalide." };
    const url = new URL(`${BASE}/schedule`);
    url.searchParams.set("country", country.toUpperCase());
    url.searchParams.set("date", date);
    const result = await fetchPublicJson<Array<Record<string, unknown>>>(url.href, headers);
    if (!result.ok) return { error: result.error };
    const entries = result.data.slice(0, limit).map((episode) => ({ episode: episodeView(episode), show: showView((episode._embedded as { show?: Record<string, unknown> } | undefined)?.show ?? {}) }));
    return { entries, date, country: country.toUpperCase(), attribution, source: sourceRef(url.href, "TVmaze — programme TV") };
  },
});

export const tvmazePlugin: PluginDefinition = {
  createTools: () => ({ searchTvShows, getTvShow, listTvEpisodes, getTvSchedule }),
  manifest: manifest as PluginManifest,
};
