import { tool, type UIMessageStreamWriter } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import type { ChatMessage } from "@/lib/types";

type NoteProps = {
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
};

const ALLOWED_FORMATS = [
  "markdown",
  "text",
  "json",
  "csv",
  "html",
  "code",
] as const;

type NoteFormat = (typeof ALLOWED_FORMATS)[number];

function getExtension(format: NoteFormat): string {
  switch (format) {
    case "markdown":
      return "md";
    case "code":
      return "txt";
    case "text":
      return "txt";
    case "json":
      return "json";
    case "csv":
      return "csv";
    case "html":
      return "html";
  }
}

function getMimeType(format: NoteFormat): string {
  switch (format) {
    case "markdown":
      return "text/markdown";
    case "code":
      return "text/plain";
    case "text":
      return "text/plain";
    case "json":
      return "application/json";
    case "csv":
      return "text/csv";
    case "html":
      return "text/html";
  }
}

function sanitizeFilename(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9-_ ]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 80) || "note"
  );
}

function isValidIsoDate(d: Date): boolean {
  return d instanceof Date && !Number.isNaN(d.getTime());
}

function buildNote(
  format: NoteFormat,
  title: string,
  content: string,
  language: string | undefined
): string {
  switch (format) {
    case "markdown": {
      const date = new Date().toISOString();
      return `# ${title}\n\n_Créé le ${date}_\n\n${content}\n`;
    }
    case "html": {
      const escapedTitle = title
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      const escapedContent = content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      const date = new Date().toISOString();
      return `<!DOCTYPE html>\n<html lang="fr">\n<head>\n<meta charset="UTF-8" />\n<title>${escapedTitle}</title>\n</head>\n<body>\n<h1>${escapedTitle}</h1>\n<p><em>Créé le ${date}</em></p>\n<pre>${escapedContent}</pre>\n</body>\n</html>\n`;
    }
    case "json": {
      return JSON.stringify(
        {
          content,
          createdAt: new Date().toISOString(),
          title,
        },
        null,
        2
      );
    }
    case "csv": {
      const lines = content.split(/\r?\n/);
      const escaped = lines
        .map((line) => {
          if (line.includes(",") || line.includes('"') || line.includes("\n")) {
            return `"${line.replace(/"/g, '""')}"`;
          }
          return line;
        })
        .join("\n");
      return `title,created_at,content\n"${title.replace(/"/g, '""')}",${new Date().toISOString()},"${escaped.replace(/"/g, '""')}"\n`;
    }
    case "code": {
      const lang = language || "text";
      return `// ${title}\n// ${new Date().toISOString()}\n// language: ${lang}\n\n${content}\n`;
    }
    default:
      return `${title}\n${"=".repeat(title.length)}\n\n${content}\n`;
  }
}

export const note = ({ session: _session, dataStream }: NoteProps) =>
  tool({
    description:
      "Créer une note structurée prête à être téléchargée ou copiée. Supporte les formats markdown, texte brut, JSON, CSV, HTML, et code. Le contenu est formaté et exposé à l'utilisateur pour téléchargement (il faut appeler download côté client). Utilisez pour générer un livrable texte téléchargeable (résumé, compte-rendu, mémo, snippet, liste, plan, etc.).",
    execute: async ({ title, content, format, language, tags, filename }) => {
      const safeTitle = (title || "Note").trim().slice(0, 200);
      const safeContent = (content || "").slice(0, 200_000);
      if (!safeContent) {
        return { error: "Le contenu de la note est vide." };
      }

      const fmt = (format || "markdown") as NoteFormat;
      if (!ALLOWED_FORMATS.includes(fmt)) {
        return {
          allowedFormats: ALLOWED_FORMATS,
          error: `Format invalide. Formats autorisés : ${ALLOWED_FORMATS.join(", ")}`,
        };
      }

      const built = buildNote(fmt, safeTitle, safeContent, language);
      const now = new Date();
      const ext = getExtension(fmt);
      const safeFilename = `${sanitizeFilename(filename || safeTitle)}-${now
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, 19)}.${ext}`;
      const mimeType = getMimeType(fmt);
      const safeTags = (tags || []).slice(0, 20).map((t) => t.slice(0, 40));

      // Stream le contenu pour affichage côté client (chunked if very long)
      const chunkSize = 5000;
      for (let i = 0; i < built.length; i += chunkSize) {
        dataStream.write({
          data: built.slice(i, i + chunkSize),
          transient: true,
          type: "data-textDelta",
        });
      }

      return {
        contentLength: built.length,
        createdAt: isValidIsoDate(now)
          ? now.toISOString()
          : new Date().toISOString(),
        // Le client doit déclencher le téléchargement à partir de ces métadonnées + dernier textDelta
        downloadable: true,
        filename: safeFilename,
        format: fmt,
        language: language || null,
        mimeType,
        preview: built.slice(0, 500),
        sizeBytes: new TextEncoder().encode(built).length,
        tags: safeTags,
        title: safeTitle,
      };
    },
    inputSchema: z.object({
      content: z
        .string()
        .min(1)
        .max(200_000)
        .describe(
          "Contenu brut de la note. Pour le markdown, fournissez du markdown. Pour le code, fournissez le code brut."
        ),
      filename: z
        .string()
        .min(1)
        .max(120)
        .optional()
        .describe("Nom de fichier (sans extension). Si vide, dérivé du titre."),
      format: z
        .enum(ALLOWED_FORMATS)
        .optional()
        .default("markdown")
        .describe("Format de sortie de la note"),
      language: z
        .string()
        .min(1)
        .max(40)
        .optional()
        .describe(
          "Langage de code (pour format='code', ex: 'python', 'javascript')"
        ),
      tags: z
        .array(z.string().min(1).max(40))
        .max(20)
        .optional()
        .describe("Tags métadonnées (max 20, chacun 1-40 chars)"),
      title: z
        .string()
        .min(1)
        .max(200)
        .describe("Titre de la note (1-200 caractères)"),
    }),
  });
