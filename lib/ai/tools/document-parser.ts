import { tool } from "ai";
import Papa from "papaparse";
import { z } from "zod";
import {
  DOCUMENT_MAX_BYTES,
  safeFetchBuffer,
} from "@/lib/web/safe-fetch";
import { checkDocumentShape } from "@/lib/web/zip-guard";

const MAX_CHARS = 100_000;

function tableToCsv(rows: string[][]): string {
  return Papa.unparse(rows);
}

function detectHeadingsFromDocxHtml(html: string): string[] {
  const headings: string[] = [];
  const re = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const text = m[1]
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
  return headings;
}

function docxHtmlToText(html: string): string {
  // Les tableaux DOCX sont convertis en blocs lisibles
  let out = html
    .replace(/<\/(td|th)>/gi, " | ")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/(p|h[1-6]|li)>/gi, "\n");
  out = out
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
  return out
    .split("\n")
    .map((l) => l.trim().replace(/[ \t]+/g, " "))
    .filter(Boolean)
    .join("\n")
    .trim();
}

// Tableaux détectés heuristiquement dans du texte brut PDF/CSV-like :
// lignes consécutives contenant au moins 2 séparateurs de colonnes.
function detectTablesInText(text: string): string[][][] {
  const tables: string[][][] = [];
  const lines = text.split("\n");
  let current: string[] = [];
  const looksTabular = (l: string) =>
    (l.match(/ ?\| ?/g)?.length ?? 0) >= 2 ||
    (l.match(/\t/g)?.length ?? 0) >= 1;

  for (const line of lines) {
    if (looksTabular(line)) {
      current.push(
        line.includes("\t")
          ? line
              .split("\t")
              .map((c) => c.trim())
              .join("|")
          : line
      );
    } else if (current.length >= 3) {
      tables.push(
        current.map((row) =>
          row
            .split("|")
            .map((c) => c.trim())
            .filter((c) => c.length > 0)
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
          .map((c) => c.trim())
          .filter((c) => c.length > 0)
      )
    );
  }
  return tables.filter((t) => t.every((r) => r.length >= 2) && t.length >= 3);
}

export const documentParser = tool({
  description:
    "Analyse avancée d'un document long (PDF, DOCX, CSV) : extraction sémantique du texte, découpage par pages/chapitres, détection des titres et extraction des tableaux vers le tableur interactif. Le paramètre url doit être l'URL publique d'un fichier (pièce jointe téléversée ou fichier bibliothèque). À activer quand l'utilisateur joint un document à analyser, résumer ou dont il faut extraire les données.",
  execute: async ({ extractTables, maxChars, url }) => {
    try {
      // Téléchargement borné via le client unique : redirections revalidées,
      // plafond d'octets appliqué PENDANT la lecture (l'ancien
      // `res.arrayBuffer()` allouait le corps entier avant tout contrôle).
      const fetched = await safeFetchBuffer(url, {
        maxBytes: DOCUMENT_MAX_BYTES,
        timeoutMs: 60_000,
      });
      if (!fetched.ok) {
        return {
          error: `Impossible de télécharger le document (${fetched.error}).`,
          url,
        };
      }

      const contentType = fetched.contentType.split(";")[0]?.trim() || "";
      const urlLower = fetched.finalUrl.toLowerCase().split("?")[0];
      const buffer = fetched.buffer;
      const shape = checkDocumentShape({ buffer, contentType, urlLower });
      if (shape.error) {
        return { error: shape.error, url };
      }

      // ---- PDF ----
      if (contentType === "application/pdf" || urlLower.endsWith(".pdf")) {
        const { PDFParse } = await import("pdf-parse");
        const parser = new PDFParse({ data: new Uint8Array(buffer) });
        try {
          const textResult = await parser.getText();
          const pages = textResult.pages ?? [];
          const fullText = pages
            .map((p) => `--- Page ${p.num} ---\n${p.text.trim()}`)
            .join("\n\n");

          let tablesCsv: string[] = [];
          if (extractTables) {
            try {
              const tableResult = await parser.getTable();
              tablesCsv = (tableResult?.mergedTables ?? [])
                .filter((t) => t.length >= 2)
                .slice(0, 10)
                .map((t) => tableToCsv(t));
            } catch {}
            if (tablesCsv.length === 0) {
              tablesCsv = detectTablesInText(fullText)
                .slice(0, 10)
                .map((t) => tableToCsv(t));
            }
          }

          const limit = Math.min(
            Math.max(maxChars ?? MAX_CHARS, 2000),
            200_000
          );
          const isTruncated = fullText.length > limit;
          return {
            contentType: "application/pdf",
            isTruncated,
            length: fullText.length,
            pages: pages.length,
            structure: pages.slice(0, 30).map((p) => ({
              page: p.num,
              preview: p.text.trim().slice(0, 120),
            })),
            tables: tablesCsv,
            text: isTruncated
              ? `${fullText.slice(0, limit)}\n\n[... document tronqué à ${limit} caractères sur ${fullText.length}]`
              : fullText,
            url,
          };
        } finally {
          await parser.destroy().catch(() => {});
        }
      }

      // ---- DOCX ----
      if (
        contentType ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        urlLower.endsWith(".docx")
      ) {
        const mammoth = await import("mammoth");
        const { value: html } = await mammoth.convertToHtml({ buffer });
        const headings = detectHeadingsFromDocxHtml(html);
        const text = docxHtmlToText(html);
        const limit = Math.min(Math.max(maxChars ?? MAX_CHARS, 2000), 200_000);
        const isTruncated = text.length > limit;
        return {
          contentType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          headings,
          isTruncated,
          length: text.length,
          tables: extractTables
            ? detectTablesInText(text).slice(0, 10).map(tableToCsv)
            : [],
          text: isTruncated
            ? `${text.slice(0, limit)}\n\n[... document tronqué à ${limit} caractères sur ${text.length}]`
            : text,
          url,
        };
      }

      // ---- CSV ----
      if (contentType === "text/csv" || urlLower.endsWith(".csv")) {
        const csvText = buffer.toString("utf-8");
        const parsed = Papa.parse<string[]>(csvText, { skipEmptyLines: true });
        const rows = parsed.data ?? [];
        const header = rows[0] ?? [];
        return {
          contentType: "text/csv",
          isTruncated: false,
          length: csvText.length,
          rows: rows.length,
          structure: header.map((h, i) => ({
            column: i + 1,
            name: h || `colonne_${i + 1}`,
          })),
          tables: [tableToCsv(rows.slice(0, 500))],
          text: csvText.slice(0, Math.min(maxChars ?? MAX_CHARS, 200_000)),
          url,
        };
      }

      // ---- Texte brut / Markdown / JSON ----
      if (
        contentType.startsWith("text/") ||
        contentType === "application/json" ||
        /\.(txt|md|json)$/i.test(urlLower)
      ) {
        const text = buffer.toString("utf-8");
        const limit = Math.min(Math.max(maxChars ?? MAX_CHARS, 2000), 200_000);
        return {
          contentType: contentType || "text/plain",
          isTruncated: text.length > limit,
          length: text.length,
          tables: [],
          text: text.slice(0, limit),
          url,
        };
      }

      return {
        error: `Type de document non supporté (${contentType || "inconnu"}). Formats supportés : PDF, DOCX, CSV, texte.`,
        url,
      };
    } catch (err: any) {
      return {
        error: `Erreur d'analyse du document : ${err?.message || "inconnue"}`,
        url,
      };
    }
  },
  inputSchema: z.object({
    extractTables: z
      .boolean()
      .default(false)
      .describe(
        "Extraire aussi les tableaux du document, renvoyés en CSV. Renvoie ensuite chaque tableau vers l'utilisateur via createDocument (kind='sheet') pour le tableur interactif."
      ),
    maxChars: z
      .number()
      .int()
      .min(2000)
      .max(200_000)
      .optional()
      .describe(
        "Nombre maximum de caractères de texte renvoyés (défaut 100000)."
      ),
    url: z.string().url().describe("URL publique du document à analyser."),
  }),
});
