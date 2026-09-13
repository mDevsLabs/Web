import type { ToolResult } from "@/lib/agent/types";

// Résumés lisibles affichés dans la timeline d'activité. Volontairement
// factuels et courts (« ✓ 8 résultats ») : jamais de raisonnement privé, jamais
// de sortie brute d'outil.

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function readNumber(
  record: Record<string, unknown>,
  key: string
): number | undefined {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function readString(
  record: Record<string, unknown>,
  key: string
): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function plural(value: number, singular: string, pluralForm: string): string {
  return `${value} ${value > 1 ? pluralForm : singular}`;
}

export function summarizeToolResult(params: {
  result: ToolResult;
  toolId: string;
}): string {
  if (!params.result.success) {
    return params.result.error.message.slice(0, 160);
  }

  const data = asRecord(params.result.data);

  switch (params.toolId) {
    case "search_web": {
      const count = readNumber(data, "count") ?? 0;
      return count > 0
        ? `${plural(count, "résultat", "résultats")} trouvé${count > 1 ? "s" : ""}`
        : "Aucun résultat";
    }
    case "read_file": {
      const name = readString(data, "name") ?? "document";
      const length = readNumber(data, "length") ?? 0;
      const truncated = data.isTruncated === true ? " (tronqué)" : "";
      return `${name} · ${length.toLocaleString("fr-FR")} caractères${truncated}`;
    }
    case "create_artifact": {
      const title = readString(data, "title") ?? "livrable";
      return `Livrable « ${title} » créé`;
    }
    case "ask_user": {
      const questions = Array.isArray(data.questions) ? data.questions : [];
      return `${plural(questions.length, "question posée", "questions posées")}`;
    }
    default: {
      const sources = params.result.sources?.length ?? 0;
      return sources > 0
        ? `Terminé · ${plural(sources, "source", "sources")}`
        : "Terminé";
    }
  }
}

export function summarizeToolFailure(message: string): string {
  return message.slice(0, 160);
}
