import { safeExternalUrl } from "@/lib/web/ssrf";

// Extraction serveur de contenu, partagée par les outils Agent (read_file).
// Aucun navigateur, aucune VM : le fichier est récupéré par HTTP puis analysé
// avec pdf-parse (v2), mammoth et Papa, déjà présents dans le projet.
//
// Note d'architecture : le tool `documentParser` du Chat conserve sa propre
// implémentation (il alimente le tableur interactif côté Chat). L'unification
// des deux est un chantier Beta listé dans docs/AGENT.md.

export const MAX_EXTRACT_CHARS = 200_000;
export const MIN_EXTRACT_CHARS = 2000;

export type ExtractedDocument = {
  contentType: string;
  isTruncated: boolean;
  length: number;
  text: string;
  headings?: string[];
  pages?: number;
  tables?: string[];
};

export type FetchDocumentResult =
  | { buffer: Buffer; contentType: string }
  | { error: string };

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function clampMaxChars(maxChars?: number): number {
  return Math.min(
    Math.max(maxChars ?? 100_000, MIN_EXTRACT_CHARS),
    MAX_EXTRACT_CHARS
  );
}

function isTextLike(contentType: string, urlLower: string): boolean {
  return (
    contentType.startsWith("text/") ||
    contentType === "application/json" ||
    /\.(txt|md|markdown|json|csv|log|yaml|yml)$/i.test(urlLower)
  );
}

// Détection heuristique de tableaux dans du texte brut (PDF notamment) :
// lignes consécutives présentant au moins deux séparateurs de colonnes.
export function detectTablesInText(text: string): string[][][] {
  const tables: string[][][] = [];
  const lines = text.split("\n");
  let current: string[] = [];
  const looksTabular = (line: string) =>
    (line.match(/ ?\| ?/g)?.length ?? 0) >= 2 ||
    (line.match(/\t/g)?.length ?? 0) >= 1;

  for (const line of lines) {
    if (looksTabular(line)) {
      current.push(
        line.includes("\t")
          ? line
              .split("\t")
              .map((cell) => cell.trim())
              .join("|")
          : line
      );
    } else if (current.length >= 3) {
      tables.push(
        current.map((row) =>
          row
            .split("|")
            .map((cell) => cell.trim())
            .filter((cell) => cell.length > 0)
        )
      );
      current = [];
    } else {
      current = [];
    }
  }

  if (current.length >= 3) {
    tables.push(
      current.map((row) =>
        row
          .split("|")
          .map((cell) => cell.trim())
          .filter((cell) => cell.length > 0)
      )
    );
  }

  return tables;
}

function toCsv(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) =>
          cell.includes(",") ? `"${cell.replace(/"/g, '""')}"` : cell
        )
        .join(",")
    )
    .join("\n");
}

export async function fetchDocumentBuffer(params: {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  url: string;
}): Promise<FetchDocumentResult> {
  const target = safeExternalUrl(params.url);
  if (target.error || !target.url) {
    return { error: target.error ?? "URL invalide." };
  }

  try {
    const response = await fetch(target.url.toString(), {
      cache: "no-store",
      headers: { Accept: "*/*", ...params.headers },
      signal: params.signal ?? AbortSignal.timeout(20_000),
    });
    if (!response.ok) {
      return {
        error: `Téléchargement impossible (HTTP ${response.status}) pour ${target.url.hostname}.`,
      };
    }
    const arrayBuffer = await response.arrayBuffer();
    const contentType = (
      response.headers.get("content-type") ?? ""
    ).toLowerCase();
    return { buffer: Buffer.from(arrayBuffer), contentType };
  } catch (error) {
    const message = error instanceof Error ? error.message : "inconnue";
    return { error: `Téléchargement impossible : ${message}.` };
  }
}

export async function extractDocument(params: {
  contentType: string;
  extractTables?: boolean;
  maxChars?: number;
  url: string;
  buffer: Buffer;
}): Promise<{ data?: ExtractedDocument; error?: string }> {
  const { buffer, contentType, url } = params;
  const urlLower = url.toLowerCase();
  const limit = clampMaxChars(params.maxChars);

  try {
    if (contentType.includes("pdf") || urlLower.endsWith(".pdf")) {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      try {
        const textResult = await parser.getText();
        const pages = textResult.pages ?? [];
        const fullText = pages
          .map((page) => `--- Page ${page.num} ---\n${page.text.trim()}`)
          .join("\n\n");
        const isTruncated = fullText.length > limit;

        let tables: string[] = [];
        if (params.extractTables) {
          try {
            const tableResult = await parser.getTable();
            tables = (tableResult?.mergedTables ?? [])
              .filter((table) => table.length >= 2)
              .slice(0, 10)
              .map((table) => toCsv(table));
          } catch {
            tables = [];
          }
        }

        return {
          data: {
            contentType: "application/pdf",
            isTruncated,
            length: fullText.length,
            pages: pages.length,
            tables,
            text: isTruncated
              ? `${fullText.slice(0, limit)}\n\n[... document tronqué à ${limit} caractères sur ${fullText.length}]`
              : fullText,
          },
        };
      } finally {
        await parser.destroy().catch(() => {});
      }
    }

    if (
      contentType.includes("wordprocessingml") ||
      urlLower.endsWith(".docx")
    ) {
      const mammoth = await import("mammoth");
      const { value: html } = await mammoth.convertToHtml({ buffer });
      const headings: string[] = [];
      const headingRe = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;
      let match: RegExpExecArray | null;
      while ((match = headingRe.exec(html)) !== null) {
        const text = match[1]
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (text) {
          headings.push(text);
        }
        if (headings.length >= 50) {
          break;
        }
      }

      const text = html
        .replace(/<\/(td|th)>/gi, " | ")
        .replace(/<\/tr>/gi, "\n")
        .replace(/<\/(p|h[1-6]|li)>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .split("\n")
        .map((line) => line.trim().replace(/[ \t]+/g, " "))
        .filter(Boolean)
        .join("\n")
        .trim();

      const isTruncated = text.length > limit;
      return {
        data: {
          contentType: DOCX_MIME,
          headings,
          isTruncated,
          length: text.length,
          tables: params.extractTables
            ? detectTablesInText(text)
                .slice(0, 10)
                .map((table) => toCsv(table))
            : [],
          text: isTruncated
            ? `${text.slice(0, limit)}\n\n[... document tronqué à ${limit} caractères sur ${text.length}]`
            : text,
        },
      };
    }

    if (contentType.includes("csv") || urlLower.endsWith(".csv")) {
      const csvText = buffer.toString("utf-8");
      const rows = csvText.split("\n").slice(0, 500);
      return {
        data: {
          contentType: "text/csv",
          isTruncated: csvText.length > limit,
          length: csvText.length,
          tables: [toCsv(rows.map((row) => row.split(",")))],
          text: csvText.slice(0, limit),
        },
      };
    }

    if (isTextLike(contentType, urlLower)) {
      const text = buffer.toString("utf-8");
      return {
        data: {
          contentType: contentType || "text/plain",
          isTruncated: text.length > limit,
          length: text.length,
          text: text.slice(0, limit),
        },
      };
    }

    return {
      error: `Type de document non pris en charge (${contentType || "inconnu"}). Formats acceptés : PDF, DOCX, CSV, texte, JSON, Markdown.`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "inconnue";
    return { error: `Analyse du document impossible : ${message}.` };
  }
}
