import { z } from "zod";
import { requireAgentToolMetadata } from "@/lib/agent/tools/catalog";
import { defineTool } from "@/lib/agent/tools/define-tool";
import { toolFailure, toolSuccess } from "@/lib/agent/types";
import { saveDocument } from "@/lib/db/queries";
import { generateUUID } from "@/lib/utils";

const EXPORT_FORMATS = ["csv", "markdown", "html"] as const;
const MAX_ROWS = 500;
const MAX_COLUMNS = 30;
const MAX_CELL_CHARS = 2000;
const MAX_OUTPUT_CHARS = 200_000;

const cellSchema = z.union([
  z.string().max(MAX_CELL_CHARS),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

const exportDeliverableInputSchema = z
  .object({
    columns: z
      .array(z.string().min(1).max(80))
      .min(1)
      .max(MAX_COLUMNS)
      .optional()
      .describe(
        "En-têtes de colonnes. Fournis de préférence : ils rendent le livrable lisible."
      ),
    format: z
      .enum(EXPORT_FORMATS)
      .describe(
        "'csv' (tableur), 'markdown' (tableau lisible) ou 'html' (page)."
      ),
    rows: z
      .array(z.array(cellSchema).min(1).max(MAX_COLUMNS))
      .min(1)
      .max(MAX_ROWS)
      .describe("Lignes de données : chaque ligne a la même longueur."),
    title: z.string().min(1).max(120),
  })
  .superRefine((value, ctx) => {
    // Une colonne déclarée doit correspondre à une valeur par ligne : un
    // tableau désaligné produirait un livrable faux.
    if (!value.columns) {
      return;
    }
    const width = value.columns.length;
    if (value.rows.some((row) => row.length !== width)) {
      ctx.addIssue({
        code: "custom",
        message: `Chaque ligne doit contenir ${width} valeur(s), comme les colonnes déclarées.`,
        path: ["rows"],
      });
    }
  });

function csvCell(value: unknown): string {
  const text =
    value === null || value === undefined ? "" : String(value as string);
  const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[",;\n\r]/.test(safeText)
    ? `"${safeText.replace(/"/g, '""')}"`
    : safeText;
}

function markdownCell(value: unknown): string {
  const text =
    value === null || value === undefined ? "" : String(value as string);
  return text.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function escapeHtml(value: unknown): string {
  return (value === null || value === undefined ? "" : String(value as string))
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildContent(input: {
  columns?: string[];
  format: (typeof EXPORT_FORMATS)[number];
  rows: (string | number | boolean | null)[][];
  title: string;
}): { content: string; kind: "html" | "sheet" | "text" } {
  const width = Math.max(
    input.columns?.length ?? 0,
    ...input.rows.map((row) => row.length)
  );
  const columns =
    input.columns ??
    Array.from({ length: width }, (_, i) => `Colonne ${i + 1}`);
  const rows = input.rows.map((row) => [
    ...row,
    ...Array.from({ length: Math.max(0, width - row.length) }, () => null),
  ]);

  if (input.format === "csv") {
    return {
      content: [columns, ...rows]
        .map((row) => row.map(csvCell).join(","))
        .join("\n"),
      kind: "sheet",
    };
  }

  if (input.format === "markdown") {
    const header = `| ${columns.map(markdownCell).join(" | ")} |`;
    const separator = `| ${columns.map(() => "---").join(" | ")} |`;
    const body = rows.map((row) => `| ${row.map(markdownCell).join(" | ")} |`);
    return {
      content: `# ${input.title}\n\n${[header, separator, ...body].join("\n")}\n`,
      kind: "text",
    };
  }

  const table = [
    `<table><thead><tr>${columns
      .map((column) => `<th>${escapeHtml(column)}</th>`)
      .join("")}</tr></thead>`,
    `<tbody>${rows
      .map(
        (row) =>
          `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`
      )
      .join("")}</tbody></table>`,
  ].join("");
  return {
    content: `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${escapeHtml(
      input.title
    )}</title></head><body><h1>${escapeHtml(input.title)}</h1>${table}</body></html>`,
    kind: "html",
  };
}

// Livrable tabulaire : le contenu est construit côté serveur à partir de
// données structurées validées, enregistré comme document (même infrastructure
// que create_artifact) et référencé par `outcome.artifact` — le runtime n'a
// donc aucune connaissance particulière de cet outil.
export const exportDeliverableTool = defineTool({
  ...requireAgentToolMetadata("export_deliverable"),
  execute: async (input, context) => {
    const built = buildContent({
      columns: input.columns,
      format: input.format,
      rows: input.rows,
      title: input.title,
    });

    if (built.content.length > MAX_OUTPUT_CHARS) {
      return toolFailure(
        "deliverable_too_large",
        `Livrable trop volumineux (${built.content.length} caractères, maximum ${MAX_OUTPUT_CHARS}). Réduisez le nombre de lignes ou de colonnes.`,
        { category: "invalid_arguments", retryable: false }
      );
    }

    const documentId = generateUUID();
    try {
      await saveDocument({
        content: built.content,
        id: documentId,
        kind: built.kind,
        title: input.title,
        userId: context.userId,
      });
    } catch {
      return toolFailure(
        "artifact_failed",
        "Création du livrable impossible.",
        { category: "transient", retryable: true }
      );
    }

    return toolSuccess(
      {
        columns: input.columns?.length ?? null,
        documentId,
        format: input.format,
        kind: built.kind,
        rows: input.rows.length,
        title: input.title,
      },
      undefined,
      {
        artifact: { documentId, kind: built.kind, title: input.title },
      }
    );
  },
  schema: exportDeliverableInputSchema,
  summarize: (data) => {
    const value = (data ?? {}) as { rows?: number; title?: string };
    return `Livrable « ${(value.title ?? "export").slice(0, 60)} » (${value.rows ?? 0} ligne${
      (value.rows ?? 0) > 1 ? "s" : ""
    })`;
  },
});
