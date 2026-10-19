/**
 * Protocole de la synthèse mAI Search.
 *
 * La route renvoyait un texte brut : les sources réellement envoyées au modèle
 * n'atteignaient jamais l'interface, et la réponse ne pouvait pas être mise en
 * forme autrement qu'en Markdown. Ce module définit un petit flux SSE
 * (`sources`, `text-delta`, `error`, `done`) et les fonctions pures qui
 * collectent les sources, afin que le serveur et le client partagent la même
 * définition.
 *
 * Aucun import `server-only` : le parseur est utilisé dans le navigateur.
 */

export type SummarySourceType = "web" | "news" | "image" | "video" | "target";

export type SummarySource = {
  id: string;
  title: string;
  url: string;
  domain: string;
  type: SummarySourceType;
};

export type SummaryStreamEvent =
  | { type: "sources"; sources: SummarySource[] }
  | { type: "text-delta"; delta: string }
  | { type: "error"; message: string }
  | { type: "done" };

type SourceInput = {
  title?: unknown;
  url?: unknown;
  source?: unknown;
  snippet?: unknown;
  type?: unknown;
};

const MAX_SOURCES = 12;

function normalizeDomain(url: string, fallback?: unknown): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return typeof fallback === "string" ? fallback.trim() : "";
  }
}

export function toSummarySource(
  input: SourceInput,
  type: SummarySourceType
): SummarySource | null {
  const url = typeof input.url === "string" ? input.url.trim() : "";
  if (!url || !/^https?:\/\//i.test(url)) {
    return null;
  }
  const domain = normalizeDomain(url, input.source);
  const title =
    (typeof input.title === "string" && input.title.trim()) || domain || url;
  return {
    domain,
    id: url,
    title: title.slice(0, 240),
    type,
    url,
  };
}

function pushUnique(
  target: SummarySource[],
  source: SummarySource | null
): boolean {
  if (!source) {
    return false;
  }
  if (target.length >= MAX_SOURCES) {
    return false;
  }
  if (target.some((item) => item.url === source.url)) {
    return false;
  }
  target.push(source);
  return true;
}

/**
 * Sources réellement données au modèle :
 * - la cible elle-même dans le tiroir ;
 * - les résultats web du premier tour ;
 * - les résultats des appels `webSearch` exécutés pendant la génération.
 */
export function collectSummarySources(params: {
  initial?: SourceInput[];
  target?: SourceInput | null;
  toolResults?: unknown[];
}): SummarySource[] {
  const sources: SummarySource[] = [];
  if (params.target) {
    pushUnique(sources, toSummarySource(params.target, "target"));
  }
  for (const item of params.initial ?? []) {
    pushUnique(sources, toSummarySource(item, "web"));
  }
  for (const raw of params.toolResults ?? []) {
    const output = (raw as { output?: unknown } | null)?.output;
    const results = (output as { results?: unknown } | null)?.results;
    if (!Array.isArray(results)) {
      continue;
    }
    for (const item of results) {
      if (item && typeof item === "object") {
        pushUnique(sources, toSummarySource(item as SourceInput, "web"));
      }
    }
  }
  return sources;
}

export function encodeSummaryEvent(event: SummaryStreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * Lit le flux SSE de la synthèse. Tolérant aux fragments : un chunk réseau peut
 * couper une ligne JSON au milieu, on ne désérialise que les lignes complètes.
 */
export async function readSummaryStream(
  response: Response,
  onEvent: (event: SummaryStreamEvent) => void
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) {
    return;
  }
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        const block = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        for (const line of block.split("\n")) {
          if (!line.startsWith("data:")) {
            continue;
          }
          const payload = line.slice(5).trim();
          if (!payload) {
            continue;
          }
          try {
            onEvent(JSON.parse(payload) as SummaryStreamEvent);
          } catch {
            // Une ligne illisible est ignorée : le reste du flux reste utile.
          }
        }
        boundary = buffer.indexOf("\n\n");
      }
    }
  } finally {
    reader.releaseLock();
  }
}
