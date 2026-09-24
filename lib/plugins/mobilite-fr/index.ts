import { tool } from "ai";
import { z } from "zod";
import type { PluginDefinition, PluginManifest } from "../types";
import { sourceRef, truncateText } from "../shared/public-api";
import manifest from "./index.json";

const BASE = "https://transport.data.gouv.fr";
const TIMEOUT_MS = 15_000;
const MAX_BYTES = 300_000;

type PageResult =
  | { data: string; ok: true; url: string }
  | { error: string; ok: false; url: string };

async function fetchCatalogPage(path: string): Promise<PageResult> {
  let url: URL;
  try {
    url = new URL(path, BASE);
  } catch {
    return { error: "Adresse de source invalide.", ok: false, url: "" };
  }
  if (url.origin !== BASE || !url.pathname.startsWith("/datasets")) {
    return { error: "Domaine de source non autorisé.", ok: false, url: "" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { Accept: "text/html", "User-Agent": "mAI-Web/1.0" },
      method: "GET",
      redirect: "error",
      signal: controller.signal,
    });
    if (!response.ok) {
      return {
        error: response.status === 404
          ? "Jeu de données introuvable (HTTP 404)."
          : `Service de données indisponible (HTTP ${response.status}).`,
        ok: false,
        url: url.href,
      };
    }
    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (contentLength > MAX_BYTES) {
      return { error: "Page trop volumineuse; résultat refusé.", ok: false, url: url.href };
    }
    const reader = response.body?.getReader();
    if (!reader) return { error: "Réponse vide ou illisible.", ok: false, url: url.href };

    const chunks: Uint8Array[] = [];
    let byteCount = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      byteCount += chunk.value.byteLength;
      if (byteCount > MAX_BYTES) {
        await reader.cancel();
        return { error: "Page trop volumineuse; résultat refusé.", ok: false, url: url.href };
      }
      chunks.push(chunk.value);
    }
    const bytes = new Uint8Array(byteCount);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return { data: new TextDecoder().decode(bytes), ok: true, url: url.href };
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError");
    const redirected = error instanceof TypeError && /redirect/i.test(error.message);
    return {
      error: timedOut ? `Délai dépassé (${TIMEOUT_MS / 1000}s).` : redirected ? "Redirection de la source refusée." : "Erreur réseau lors de la lecture du catalogue.",
      ok: false,
      url: url.href,
    };
  } finally {
    clearTimeout(timer);
  }
}

function decodeHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&#x27;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function capture(html: string, pattern: RegExp): string | null {
  const match = pattern.exec(html);
  return match?.[1] ? decodeHtml(match[1]) : null;
}

const mobilityTypes = [
  "public-transit",
  "vehicles-sharing",
  "carpooling-areas",
  "bike-data",
  "charging-stations",
  "parking",
  "road-data",
] as const;

function listingPath({
  query,
  type,
  region,
  realtimeOnly,
}: {
  query: string;
  type: (typeof mobilityTypes)[number] | "all";
  region?: string;
  realtimeOnly: boolean;
}): string {
  const pathname = region ? `/datasets/region/${encodeURIComponent(region)}` : "/datasets";
  const url = new URL(pathname, BASE);
  url.searchParams.set("locale", "fr");
  url.searchParams.set("order_by", "most_recent");
  if (query.trim()) url.searchParams.set("q", query.trim());
  if (type !== "all") url.searchParams.set("type", type);
  if (realtimeOnly) url.searchParams.set("filter", "has_realtime");
  return `${url.pathname}${url.search}`;
}

function parseDatasetCards(html: string, limit: number, realtimeOnly: boolean) {
  const starts = [...html.matchAll(/<div class="panel dataset__panel">/g)].map((match) => match.index ?? 0);
  return starts.slice(0, limit).map((start, index) => {
    const end = starts[index + 1] ?? html.indexOf("<nav class=\"pagination", start);
    const card = html.slice(start, end > start ? end : undefined);
    const href = capture(card, /<h3 class="dataset__title">\s*<a href="([^"]+)"/i);
    const name = capture(card, /<h3 class="dataset__title">\s*<a href="[^"]+">([\s\S]*?)<\/a>/i);
    if (!href || !name || !/^\/datasets\/[a-z0-9-]+$/i.test(href)) return null;
    const location = capture(card, /<div class="dataset-localization">([\s\S]*?)<\/div>/i);
    const dataType = capture(card, /<img alt="([^"]+)" src="\/images\/icons\//i);
    const typeLabel = capture(card, /<div class="dataset-type-text">([\s\S]*?)<\/div>/i);
    const formats = [...card.matchAll(/<dd class="label">([^<]+)<\/dd>/gi)]
      .map((match) => decodeHtml(match[1] ?? ""))
      .filter(Boolean);
    const createdAt = capture(card, /dataset-udpate-date[^>]*>\s*créé le\s*([^<]+)/i);
    const realtimeFormats = formats.some((format) => /gtfs-rt|siri|gbfs/i.test(format));
    return {
      createdAt,
      formats: [...new Set(formats)].slice(0, 12),
      hasRealtimeData: realtimeOnly || realtimeFormats,
      location,
      name: truncateText(name, 200),
      slug: href.slice("/datasets/".length),
      type: dataType,
      typeLabel,
      url: `${BASE}${href}`,
    };
  }).filter((item): item is NonNullable<typeof item> => item !== null);
}

export const searchMobilityDatasets = tool({
  description: "Recherche dans le catalogue officiel du Point d’Accès National des données de mobilité en France.",
  inputSchema: z.object({
    limit: z.number().int().min(1).max(15).default(8),
    query: z.string().max(100).default("").describe("Ville, territoire, réseau ou mot-clé"),
    realtimeOnly: z.boolean().default(false).describe("Ne montrer que les jeux indiqués comme ayant des données temps réel"),
    region: z.string().regex(/^(FR|0[1-9]|[1-9][0-9])$/).optional().describe("Code de région INSEE, ou FR pour le niveau national"),
    type: z.enum(["all", ...mobilityTypes]).default("all").describe("Mode ou type de mobilité"),
  }),
  execute: async ({ limit, query, realtimeOnly, region, type }) => {
    const path = listingPath({ query, type, region, realtimeOnly });
    const result = await fetchCatalogPage(path);
    if (!result.ok) return { error: result.error };
    const datasets = parseDatasetCards(result.data, limit, realtimeOnly);
    return {
      count: datasets.length,
      datasets,
      note: "Le catalogue référence des jeux de données et leurs ressources. La couverture, la fraîcheur et le temps réel varient selon le territoire; cette recherche ne calcule pas d’itinéraire.",
      source: sourceRef(result.url, "Point d’Accès National — données de mobilité"),
    };
  },
});

export const getMobilityDatasetDetails = tool({
  description: "Récupère les ressources publiées, leurs formats et les dates de dernière mise à jour du contenu.",
  inputSchema: z.object({ slug: z.string().min(1).max(180).regex(/^[a-z0-9][a-z0-9-]*$/i).describe("Slug du jeu fourni par searchMobilityDatasets") }),
  execute: async ({ slug }) => {
    const url = new URL(`/datasets/${encodeURIComponent(slug)}`, BASE);
    url.searchParams.set("locale", "fr");
    const result = await fetchCatalogPage(`${url.pathname}${url.search}`);
    if (!result.ok) return { error: result.error };
    const title = capture(result.data, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (!title) return { error: "La page ne contient pas de fiche de jeu de données exploitable." };

    const starts = [...result.data.matchAll(/<div class="panel resource [^"]*">/g)].map((match) => match.index ?? 0);
    const resources = starts.slice(0, 20).map((start, index) => {
      const end = starts[index + 1] ?? result.data.indexOf("</section>", start);
      const panel = result.data.slice(start, end > start ? end : undefined);
      const name = capture(panel, /<h4>([\s\S]*?)<\/h4>/i);
      const formats = [...panel.matchAll(/<span class="label">([^<]+)<\/span>/gi)]
        .map((match) => decodeHtml(match[1] ?? ""))
        .filter(Boolean);
      const updatedAt = capture(panel, /([0-3]\d\/[01]\d\/\d{4})\s*<span class="small">\s*Dernière modification du contenu/i);
      const downloadPath = capture(panel, /<a class="download-button" href="([^"]+)"/i);
      const downloadUrl = downloadPath ? new URL(downloadPath, BASE) : null;
      return {
        downloadUrl: downloadUrl?.origin === BASE ? downloadUrl.href : null,
        formats: [...new Set(formats)].slice(0, 8),
        name: truncateText(name, 180),
        updatedAt,
      };
    }).filter((resource) => resource.name);

    return {
      dataset: title,
      resources,
      source: sourceRef(result.url, "Fiche du jeu — transport.data.gouv.fr"),
      note: "La date indique la dernière modification du contenu constatée pour chaque ressource; elle ne garantit pas la disponibilité d’un calculateur d’itinéraire.",
    };
  },
});

export const mobiliteFrPlugin: PluginDefinition = {
  manifest: manifest as PluginManifest,
  createTools: () => ({ searchMobilityDatasets, getMobilityDatasetDetails }),
};
