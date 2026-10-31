/**
 * Conversions de documents textuels (Markdown) vers HTML et DOCX.
 *
 * Centralisation demandée : les composants React n'importent jamais ces
 * fonctions pour produire un fichier — ils passent par la route
 * /api/document/export qui renvoie le bon MIME et le bon nom de fichier.
 * Ces helpers restent testables hors Next (Vitest, Node pur).
 *
 * Choix délibérés :
 * - markdown-it avec `html: false` : tout HTML brut dans le Markdown est
 *   échappé par construction (rendu texte), pas besoin de sanitizer serveur ;
 * - `docx` (dolanmiu) : pur JS, aucune dépendance native, compatible runtime
 *   Node des routes Next/Vercel. Import dynamique pour ne pas alourdir le
 *   bundle des routes qui n'exportent pas en DOCX.
 */

import type { Paragraph, Table, TableCell, TableRow } from "docx";
import MarkdownItConstructor, {
  type MarkdownIt,
  type Token as MarkdownItToken,
} from "markdown-it";

/** Bloc de contenu DOCX (paragraphe ou tableau) assemblé depuis le Markdown. */
type DocxBlock = Paragraph | Table;

export type DocumentExportFormat = "html" | "md";

export const DOCUMENT_EXPORT_MIME: Record<
  "docx" | "html" | "md" | "pdf" | "txt",
  string
> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  html: "text/html;charset=utf-8",
  md: "text/markdown;charset=utf-8",
  pdf: "application/pdf",
  txt: "text/plain;charset=utf-8",
};

/** Slug minimal : accents translittérés, caractères non sûrs en tiret. */
export function buildExportFilename(title: string, extension: string): string {
  const slug = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  const safe = slug || "document";
  return `${safe}.${extension}`;
}

function createMarkdownRenderer(): MarkdownIt {
  return new MarkdownItConstructor({
    // html:false => le HTML brut est échappé, jamais interprété.
    html: false,
    linkify: true,
    typographer: false,
  });
}

/**
 * Produit un document HTML complet et autonome : le corps est le rendu
 * markdown-it (HTML brut échappé grâce à html:false), l'enveloppe ajoute
 * l'encodage, un titre dérivé du premier heading et un style minimal lisible.
 */
export function markdownToHtml(markdown: string, title?: string): string {
  const md = createMarkdownRenderer();
  const body = md.render(markdown ?? "");

  const headingMatch = /^#\s+(.+)$/m.exec(markdown ?? "");
  const derivedTitle = (
    title ?? (headingMatch ? headingMatch[1].trim() : "Document")
  )
    // Le titre est interpolé dans du HTML : échappement explicite.
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${derivedTitle}</title>
<style>
  :root { color-scheme: light dark; }
  body {
    margin: 0 auto;
    max-width: 50rem;
    padding: 3rem 1.5rem;
    font: 16px/1.7 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      "Helvetica Neue", Arial, sans-serif;
    color: #1a1a1a;
    background: #ffffff;
  }
  pre {
    background: #f4f4f5;
    border: 1px solid #e4e4e7;
    border-radius: 8px;
    overflow-x: auto;
    padding: 1rem;
  }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.9em; }
  p > code, li > code { background: #f4f4f5; border-radius: 4px; padding: 0.1em 0.35em; }
  blockquote { border-left: 4px solid #d4d4d8; color: #52525b; margin-left: 0; padding-left: 1rem; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #d4d4d8; padding: 0.5rem 0.75rem; text-align: left; }
  img { max-width: 100%; }
  @media (prefers-color-scheme: dark) {
    body { background: #101012; color: #e7e7ea; }
    pre, p > code, li > code { background: #1c1c1f; border-color: #2e2e33; }
    blockquote { border-color: #3f3f46; color: #a1a1aa; }
    th, td { border-color: #3f3f46; }
  }
</style>
</head>
<body>
${body.trimEnd()}
</body>
</html>
`;
}

type Token = MarkdownItToken;

const DOCX_STYLES = {
  codeBackground: "F4F4F5",
  codeFont: "Consolas",
  quoteColor: "52525B",
} as const;

/** Construit les runs inline (gras, italique, code, lien) d'un token parent. */
function buildInlineRuns(
  children: Token[],
  inherited: { bold?: boolean; italic?: boolean; strike?: boolean }
): Record<string, unknown>[] {
  const runs: Record<string, unknown>[] = [];

  const walk = (
    tokens: Token[],
    style: {
      bold?: boolean;
      italic?: boolean;
      strike?: boolean;
      code?: boolean;
    }
  ) => {
    // Lien courant : le href capturé à link_open est rappelé à link_close.
    let openHref: string | null = null;
    for (const token of tokens) {
      if (token.type === "text" && token.content) {
        const run: Record<string, unknown> = { text: token.content };
        if (style.bold) {
          run.bold = true;
        }
        if (style.italic) {
          run.italics = true;
        }
        if (style.strike) {
          run.strike = true;
        }
        if (style.code) {
          run.font = DOCX_STYLES.codeFont;
          run.shading = { fill: DOCX_STYLES.codeBackground };
        }
        runs.push(run);
        continue;
      }
      if (token.type === "code_inline") {
        runs.push({
          font: DOCX_STYLES.codeFont,
          shading: { fill: DOCX_STYLES.codeBackground },
          text: token.content,
        });
        continue;
      }
      if (token.type === "softbreak" || token.type === "hardbreak") {
        runs.push({ break: 1, text: "" });
        continue;
      }
      if (token.type === "link_open" && token.attrs) {
        const attr = token.attrs.find(([k]) => k === "href");
        openHref = typeof attr?.[1] === "string" ? attr[1] : "";
        continue;
      }
      if (token.type === "link_close") {
        // Dégradation propre : l'URL est rappelée entre parenthèses après le
        // texte du lien (pas de champ hyperlink Word fragile).
        if (openHref) {
          runs.push({ text: ` (${openHref})` });
          openHref = null;
        }
        continue;
      }
      if (token.children) {
        walk(token.children, {
          ...style,
          bold: style.bold || token.type === "strong_open",
          code: style.code || token.type === "code_inline",
          italic:
            style.italic ||
            token.type === "em_open" ||
            token.type === "link_open",
          strike: style.strike || token.type === "s_open",
        });
      }
    }
  };

  walk(children, inherited);
  return runs.length > 0 ? runs : [{ text: "" }];
}

/**
 * Convertit un Markdown en DOCX (Uint8Array). Dégradation propre : les
 * éléments non représentables (images, HTML brut déjà échappé en texte)
 * tombent en paragraphe simple ; rien ne casse la conversion.
 *
 * Retourne un Uint8Array pour éviter les problèmes de transfert Buffer entre
 * runtimes Node (route Next) et Vitest.
 */
export async function markdownToDocx(
  markdown: string,
  title?: string
): Promise<Uint8Array> {
  const {
    Document,
    HeadingLevel,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
  } = await import("docx");
  const md = createMarkdownRenderer();
  const tokens = md.parse(markdown ?? "", {});

  const blocks: DocxBlock[] = [];
  const headingLevels = [
    HeadingLevel.HEADING_1,
    HeadingLevel.HEADING_2,
    HeadingLevel.HEADING_3,
    HeadingLevel.HEADING_4,
    HeadingLevel.HEADING_5,
    HeadingLevel.HEADING_6,
  ];

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];

    switch (token.type) {
      case "heading_open": {
        const level = Number.parseInt(token.tag.slice(1), 10) || 1;
        const inline = tokens[i + 1];
        blocks.push(
          new Paragraph({
            children: buildInlineRuns(inline?.children ?? [], {}).map(
              (run) => new TextRun(run as never)
            ),
            heading: headingLevels[Math.min(level, 6) - 1],
          })
        );
        i += 1; // consomme heading_close
        break;
      }
      case "paragraph_open": {
        const inline = tokens[i + 1];
        blocks.push(
          new Paragraph({
            children: buildInlineRuns(inline?.children ?? [], {}).map(
              (run) => new TextRun(run as never)
            ),
          })
        );
        i += 1; // consomme paragraph_close
        break;
      }
      case "bullet_list_open":
      case "ordered_list_open": {
        const ordered = token.type === "ordered_list_open";
        // Parcours linéaire des tokens de la liste : chaque list_item_open
        // incrémente un compteur (pour les listes ordonnées) et son premier
        // paragraphe devient une puce. Les sous-listes imbriquées augmentent
        // le niveau d'indentation via la profondeur de listes ouverte.
        let listDepth = 1;
        let itemCounter = 0;
        let j = i + 1;
        while (j < tokens.length) {
          const t = tokens[j];
          if (t.type === "list_item_open") {
            itemCounter += 1;
            let k = j + 1;
            let firstParagraph = true;
            while (k < tokens.length && tokens[k].type !== "list_item_close") {
              if (tokens[k].type === "paragraph_open") {
                const inline = tokens[k + 1];
                const runs = buildInlineRuns(inline?.children ?? [], {}).map(
                  (run) => new TextRun(run as never)
                );
                const prefix =
                  ordered && firstParagraph ? `${itemCounter}. ` : "";
                blocks.push(
                  new Paragraph({
                    bullet:
                      firstParagraph && !ordered
                        ? { level: Math.min(listDepth - 1, 8) }
                        : undefined,
                    children: [
                      ...(prefix ? [new TextRun({ text: prefix })] : []),
                      ...runs,
                    ],
                    indent:
                      ordered && firstParagraph
                        ? { left: 720 * listDepth }
                        : undefined,
                  })
                );
                firstParagraph = false;
                k += 1; // consomme paragraph_close
              } else if (tokens[k].type.endsWith("_list_open")) {
                listDepth += 1;
                itemCounter = 0;
              } else if (tokens[k].type.endsWith("_list_close")) {
                listDepth -= 1;
              }
              k += 1;
            }
            j = k;
            continue;
          }
          if (t.type === "bullet_list_open" || t.type === "ordered_list_open") {
            listDepth += 1;
            itemCounter = 0;
          }
          if (
            t.type === "bullet_list_close" ||
            t.type === "ordered_list_close"
          ) {
            listDepth -= 1;
            if (listDepth === 0) {
              break;
            }
          }
          j += 1;
        }
        i = j;
        break;
      }
      case "fence":
      case "code_block": {
        const lines = (token.content || "").replace(/\n$/, "").split("\n");
        for (const line of lines) {
          blocks.push(
            new Paragraph({
              children: [
                new TextRun({
                  font: DOCX_STYLES.codeFont,
                  shading: { fill: DOCX_STYLES.codeBackground },
                  text: line,
                }),
              ],
            })
          );
        }
        break;
      }
      case "blockquote_open": {
        let depth = 1;
        let j = i + 1;
        while (j < tokens.length && depth > 0) {
          if (tokens[j].type === "blockquote_open") {
            depth += 1;
          }
          if (tokens[j].type === "blockquote_close") {
            depth -= 1;
            if (depth === 0) {
              break;
            }
          }
          if (tokens[j].type === "paragraph_open") {
            const inline = tokens[j + 1];
            blocks.push(
              new Paragraph({
                children: buildInlineRuns(inline?.children ?? [], {}).map(
                  (run) => new TextRun(run as never)
                ),
                indent: { left: 720 },
                // Couleur via run-level : appliquée après coup pour rester simple.
              })
            );
            j += 1;
          }
          j += 1;
        }
        i = j;
        break;
      }
      case "table_open": {
        const rows: TableRow[] = [];
        let j = i + 1;
        while (j < tokens.length && tokens[j].type !== "table_close") {
          if (tokens[j].type === "tr_open") {
            const cells: TableCell[] = [];
            let k = j + 1;
            while (k < tokens.length && tokens[k].type !== "tr_close") {
              if (
                tokens[k].type === "th_open" ||
                tokens[k].type === "td_open"
              ) {
                const inline = tokens[k + 1];
                cells.push(
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: buildInlineRuns(
                          inline?.children ?? [],
                          {}
                        ).map((run) => new TextRun(run as never)),
                      }),
                    ],
                  })
                );
                k += 1;
              }
              k += 1;
            }
            rows.push(new TableRow({ children: cells }));
            j = k;
          }
          j += 1;
        }
        if (rows.length > 0) {
          blocks.push(
            new Table({
              rows,
              width: { size: 100, type: WidthType.PERCENTAGE },
            })
          );
        }
        i = j;
        break;
      }
      case "hr": {
        blocks.push(
          new Paragraph({
            border: { bottom: { color: "D4D4D8", size: 6, style: "single" } },
            children: [],
          })
        );
        break;
      }
      default:
        // inline/« *_close »/html_block (déjà neutralisé) : ignorés.
        break;
    }
  }

  if (blocks.length === 0) {
    blocks.push(new Paragraph({ children: [new TextRun("")] }));
  }

  const headingMatch = /^#\s+(.+)$/m.exec(markdown ?? "");
  const docTitle =
    title ?? (headingMatch ? headingMatch[1].trim() : "Document");

  const doc = new Document({
    sections: [
      {
        children: blocks as never,
        properties: {},
      },
    ],
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22 },
        },
      },
    },
    title: docTitle,
  } as never);

  const buffer = await Packer.toBuffer(doc);
  // Packer.toBuffer renvoie un Buffer Node selon les versions : normalise.
  return new Uint8Array(
    buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    ) as ArrayBuffer
  );
}

type ExportBlock =
  | { level: number; text: string; type: "heading" }
  | { text: string; type: "paragraph" }
  | { items: string[]; ordered: boolean; type: "list" }
  | { text: string; type: "code" }
  | { text: string; type: "quote" }
  | { rows: string[][]; type: "table" }
  | { type: "hr" };

function inlineToText(children: MarkdownItToken[] | null | undefined): string {
  if (!children) {
    return "";
  }
  let out = "";
  for (const token of children) {
    if (token.type === "text" || token.type === "code_inline") {
      out += token.content;
    } else if (token.type === "softbreak" || token.type === "hardbreak") {
      out += "\n";
    } else if (token.type === "image") {
      const alt = token.content?.trim();
      if (alt) {
        out += alt;
      }
    } else if (token.children) {
      out += inlineToText(token.children);
    }
  }
  return out;
}

/** Blocs communs au texte brut et au PDF. Les images deviennent leur texte alternatif. */
function markdownBlocks(markdown: string): ExportBlock[] {
  const tokens = createMarkdownRenderer().parse(markdown ?? "", {});
  const blocks: ExportBlock[] = [];

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (!token) {
      continue;
    }
    if (token.type === "heading_open") {
      const level = Number.parseInt(token.tag.slice(1), 10) || 1;
      blocks.push({
        level,
        text: inlineToText(tokens[i + 1]?.children),
        type: "heading",
      });
      i += 1;
      continue;
    }
    if (token.type === "paragraph_open") {
      blocks.push({
        text: inlineToText(tokens[i + 1]?.children),
        type: "paragraph",
      });
      i += 1;
      continue;
    }
    if (token.type === "fence" || token.type === "code_block") {
      blocks.push({
        text: (token.content || "").replace(/\n$/, ""),
        type: "code",
      });
      continue;
    }
    if (token.type === "hr") {
      blocks.push({ type: "hr" });
      continue;
    }
    if (
      token.type === "bullet_list_open" ||
      token.type === "ordered_list_open"
    ) {
      const ordered = token.type === "ordered_list_open";
      const items: string[] = [];
      let depth = 1;
      let j = i + 1;
      while (j < tokens.length && depth > 0) {
        const current = tokens[j];
        if (!current) {
          break;
        }
        if (
          current.type === "bullet_list_open" ||
          current.type === "ordered_list_open"
        ) {
          depth += 1;
        } else if (
          current.type === "bullet_list_close" ||
          current.type === "ordered_list_close"
        ) {
          depth -= 1;
        } else if (current.type === "paragraph_open" && depth === 1) {
          items.push(inlineToText(tokens[j + 1]?.children));
        }
        j += 1;
      }
      blocks.push({ items, ordered, type: "list" });
      i = j - 1;
      continue;
    }
    if (token.type === "blockquote_open") {
      const parts: string[] = [];
      let depth = 1;
      let j = i + 1;
      while (j < tokens.length && depth > 0) {
        const current = tokens[j];
        if (!current) {
          break;
        }
        if (current.type === "blockquote_open") {
          depth += 1;
        } else if (current.type === "blockquote_close") {
          depth -= 1;
        } else if (current.type === "paragraph_open") {
          parts.push(inlineToText(tokens[j + 1]?.children));
        }
        j += 1;
      }
      blocks.push({ text: parts.join("\n"), type: "quote" });
      i = j - 1;
      continue;
    }
    if (token.type === "table_open") {
      const rows: string[][] = [];
      let j = i + 1;
      while (j < tokens.length && tokens[j]?.type !== "table_close") {
        if (tokens[j]?.type === "tr_open") {
          const cells: string[] = [];
          let k = j + 1;
          while (k < tokens.length && tokens[k]?.type !== "tr_close") {
            if (
              tokens[k]?.type === "th_open" ||
              tokens[k]?.type === "td_open"
            ) {
              cells.push(inlineToText(tokens[k + 1]?.children));
            }
            k += 1;
          }
          rows.push(cells);
          j = k;
        }
        j += 1;
      }
      blocks.push({ rows, type: "table" });
      i = j;
    }
  }

  return blocks;
}

export function markdownToText(markdown: string): string {
  const lines: string[] = [];
  for (const block of markdownBlocks(markdown)) {
    if (block.type === "heading") {
      lines.push(block.text, "");
    } else if (block.type === "paragraph" || block.type === "quote") {
      lines.push(block.text, "");
    } else if (block.type === "code") {
      lines.push(block.text, "");
    } else if (block.type === "list") {
      block.items.forEach((item, index) => {
        lines.push(`${block.ordered ? `${index + 1}. ` : "• "}${item}`);
      });
      lines.push("");
    } else if (block.type === "table") {
      for (const row of block.rows) {
        lines.push(row.join(" | "));
      }
      lines.push("");
    } else if (block.type === "hr") {
      lines.push("---", "");
    }
  }
  return lines.join("\n").trim();
}

/** Polices standard PDF (WinAnsi) : les accents français passent, pas les emoji. */
function pdfSafe(value: string): string {
  let out = "";
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    if (code === 0x20_18 || code === 0x20_19) {
      out += "'";
      continue;
    }
    if (code === 0x20_1c || code === 0x20_1d) {
      out += '"';
      continue;
    }
    if (code === 0x20_13 || code === 0x20_14) {
      out += "-";
      continue;
    }
    if (code === 0x20_26) {
      out += "...";
      continue;
    }
    if (code === 0x00_a0) {
      out += " ";
      continue;
    }
    if (code === 10 || code === 13 || (code >= 32 && code <= 255)) {
      out += char;
      continue;
    }
    out += "·";
  }
  return out;
}

type PdfDoc = {
  end: () => void;
  font: (name: string) => PdfDoc;
  fontSize: (size: number) => PdfDoc;
  info: { Title?: string };
  moveDown: (lines?: number) => PdfDoc;
  on: (event: string, listener: (...args: never[]) => void) => PdfDoc;
  text: (value: string, options?: { indent?: number }) => PdfDoc;
};

export async function markdownToPdf(
  markdown: string,
  title?: string
): Promise<Uint8Array> {
  const imported = (await import("pdfkit")) as {
    default?: new (options?: { margin?: number; size?: string }) => PdfDoc;
  };
  const Ctor =
    imported.default ??
    (imported as unknown as new (options?: {
      margin?: number;
      size?: string;
    }) => PdfDoc);
  const doc = new Ctor({ margin: 56, size: "A4" });
  const chunks: Buffer[] = [];
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk) => {
      chunks.push(chunk);
    });
    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on("error", (error) => {
      reject(error);
    });
  });

  const headingMatch = /^#\s+(.+)$/m.exec(markdown ?? "");
  const docTitle =
    title ?? (headingMatch ? headingMatch[1].trim() : "Document");
  doc.info.Title = pdfSafe(docTitle);

  const blocks = markdownBlocks(markdown);
  if (blocks.length === 0) {
    doc.font("Helvetica").fontSize(11).text("");
  }
  for (const block of blocks) {
    if (block.type === "heading") {
      const size = block.level === 1 ? 20 : block.level === 2 ? 16 : 13;
      doc.font("Helvetica-Bold").fontSize(size).text(pdfSafe(block.text));
      doc.moveDown(0.4);
    } else if (block.type === "paragraph") {
      doc.font("Helvetica").fontSize(11).text(pdfSafe(block.text));
      doc.moveDown(0.6);
    } else if (block.type === "quote") {
      doc.font("Helvetica-Oblique").fontSize(11).text(pdfSafe(block.text), {
        indent: 16,
      });
      doc.moveDown(0.6);
    } else if (block.type === "code") {
      doc.font("Courier").fontSize(9).text(pdfSafe(block.text));
      doc.moveDown(0.6);
    } else if (block.type === "list") {
      block.items.forEach((item, index) => {
        const prefix = block.ordered ? `${index + 1}. ` : "• ";
        doc
          .font("Helvetica")
          .fontSize(11)
          .text(pdfSafe(`${prefix}${item}`), {
            indent: 12,
          });
      });
      doc.moveDown(0.6);
    } else if (block.type === "table") {
      for (const row of block.rows) {
        doc
          .font("Helvetica")
          .fontSize(10)
          .text(pdfSafe(row.join("  |  ")));
      }
      doc.moveDown(0.6);
    } else if (block.type === "hr") {
      doc.moveDown(0.3);
      doc.font("Helvetica").fontSize(11).text("―");
      doc.moveDown(0.3);
    }
  }

  doc.end();
  const buffer = await done;
  return new Uint8Array(
    buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    ) as ArrayBuffer
  );
}
