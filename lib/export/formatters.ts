export type ExportFormat = "json" | "csv" | "md" | "txt";

function escapeCsv(val: unknown): string {
  const s = String(val ?? "");
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

export function toCsv(
  rows: Record<string, unknown>[],
  columns?: string[]
): string {
  if (rows.length === 0) {
    return "";
  }
  const cols = columns ?? Object.keys(rows[0]);
  const header = cols.map(escapeCsv).join(",");
  const lines = rows.map((r) => cols.map((c) => escapeCsv(r[c])).join(","));
  return [header, ...lines].join("\n");
}

export function toMd(
  rows: Record<string, unknown>[],
  columns?: string[]
): string {
  if (rows.length === 0) {
    return "_Aucune donnée_";
  }
  const cols = columns ?? Object.keys(rows[0]);
  const header = `| ${cols.join(" | ")} |`;
  const sep = `| ${cols.map(() => "---").join(" | ")} |`;
  const body = rows
    .map(
      (r) =>
        `| ${cols.map((c) => String(r[c] ?? "").replace(/\|/g, "\\|")).join(" | ")} |`
    )
    .join("\n");
  return [header, sep, body].join("\n");
}

export function toTxt(
  rows: Record<string, unknown>[],
  columns?: string[]
): string {
  if (rows.length === 0) {
    return "Aucune donnée.";
  }
  const cols = columns ?? Object.keys(rows[0]);
  return rows
    .map(
      (r, i) =>
        `#${i + 1} — ${cols.map((c) => `${c}: ${String(r[c] ?? "")}`).join(" | ")}`
    )
    .join("\n");
}

export function formatExport(
  data: Record<string, unknown>[],
  format: ExportFormat,
  columns?: string[]
): { content: string; mime: string; ext: string } {
  switch (format) {
    case "csv":
      return {
        content: toCsv(data, columns),
        ext: "csv",
        mime: "text/csv;charset=utf-8",
      };
    case "md":
      return {
        content: toMd(data, columns),
        ext: "md",
        mime: "text/markdown;charset=utf-8",
      };
    case "txt":
      return {
        content: toTxt(data, columns),
        ext: "txt",
        mime: "text/plain;charset=utf-8",
      };
    default:
      return {
        content: toJson(data),
        ext: "json",
        mime: "application/json;charset=utf-8",
      };
  }
}
