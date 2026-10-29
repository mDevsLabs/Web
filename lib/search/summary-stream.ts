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

/**
 * Origine d'une source : un article d'encyclopédie n'est pas une page web.
 *
 * Le champ est informatif : il permet à l'interface d'afficher « Wikipédia »
 * à côté d'une source, et au prompt de dire « article d'encyclopédie » plutôt
 * que « page web ». Il ne change rien à la collecte.
 */
export type SummarySourceOrigin = "wikipedia" | "web";

export type SummarySource = {
  domain: string;
  id: string;
  origin?: SummarySourceOrigin;
  title: string;
  type: SummarySourceType;
  url: string;
};

export type SummaryStreamEvent =
  | { type: "sources"; sources: SummarySource[] }
  | { type: "reasoning-delta"; delta: string }
  | { type: "text-delta"; delta: string }
  | { type: "error"; message: string }
  | { type: "done" };

export type ThinkPiece = {
  delta: string;
  kind: "reasoning" | "text";
};

const THINK_OPEN = "<think>";
const THINK_CLOSE = "</think>";

function partialTagSuffix(buffer: string, tag: string): number {
  const lower = buffer.toLowerCase();
  const needle = tag.toLowerCase();
  const max = Math.min(buffer.length, needle.length - 1);
  for (let size = max; size > 0; size -= 1) {
    if (needle.startsWith(lower.slice(lower.length - size))) {
      return size;
    }
  }
  return 0;
}

function indexOfTag(buffer: string, tag: string): number {
  return buffer.toLowerCase().indexOf(tag.toLowerCase());
}

/**
 * Sépare la réflexion écrite dans le texte (`<think>…</think>`) de la réponse.
 *
 * Le fournisseur mélange parfois les deux dans le même flux de contenu. Tant
 * que la balise n'est pas complète, le fragment est retenu : un chunk peut
 * couper `<think>` au milieu.
 */
export function createThinkSplitter(): {
  flush: () => ThinkPiece[];
  push: (delta: string) => ThinkPiece[];
} {
  let pending = "";
  let inThink = false;

  const drain = (final: boolean): ThinkPiece[] => {
    const pieces: ThinkPiece[] = [];
    while (pending.length > 0) {
      if (!inThink) {
        const open = indexOfTag(pending, THINK_OPEN);
        if (open === -1) {
          const hold = final ? 0 : partialTagSuffix(pending, THINK_OPEN);
          const emit = pending.slice(0, pending.length - hold);
          pending = pending.slice(pending.length - hold);
          if (emit) {
            pieces.push({ delta: emit, kind: "text" });
          }
          break;
        }
        if (open > 0) {
          pieces.push({ delta: pending.slice(0, open), kind: "text" });
        }
        pending = pending.slice(open + THINK_OPEN.length);
        inThink = true;
        continue;
      }

      const close = indexOfTag(pending, THINK_CLOSE);
      if (close === -1) {
        const hold = final ? 0 : partialTagSuffix(pending, THINK_CLOSE);
        const emit = pending.slice(0, pending.length - hold);
        pending = pending.slice(pending.length - hold);
        if (emit) {
          pieces.push({ delta: emit, kind: "reasoning" });
        }
        break;
      }
      if (close > 0) {
        pieces.push({ delta: pending.slice(0, close), kind: "reasoning" });
      }
      pending = pending.slice(close + THINK_CLOSE.length);
      inThink = false;
    }
    return pieces;
  };

  return {
    flush: () => drain(true),
    push: (delta: string) => {
      if (!delta) {
        return [];
      }
      pending += delta;
      return drain(false);
    },
  };
}

/** Réponse visible, une fois les balises de réflexion retirées. */
export function stripThinkTags(text: string): string {
  const splitter = createThinkSplitter();
  const pieces = [...splitter.push(text), ...splitter.flush()];
  return pieces
    .filter((piece) => piece.kind === "text")
    .map((piece) => piece.delta)
    .join("");
}

/**
 * Ajoute un delta sans le répéter.
 *
 * Certains fournisseurs renvoient le texte cumulé à chaque chunk, d'autres
 * un suffixe. Les deux formes doivent produire la même chaîne.
 */
export function mergeStreamText(current: string, delta: string): string {
  if (!delta) {
    return current;
  }
  if (current.endsWith(delta)) {
    return current;
  }
  if (current && delta.startsWith(current)) {
    return delta;
  }
  return current + delta;
}

type SourceInput = {
  origin?: unknown;
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
  // Une origine inconnue vaut « web » : c'est le cas par défaut historique,
  // et inventer une origine serait pire que de ne pas en donner.
  const origin: SummarySourceOrigin =
    input.origin === "wikipedia" ? "wikipedia" : "web";
  return {
    domain,
    id: url,
    origin,
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
