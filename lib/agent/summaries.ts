import type { ToolResult } from "@/lib/agent/types";

// Synthèse lisible affichée dans la timeline. Volontairement factuelle et
// courte : jamais de raisonnement privé, jamais de sortie brute d'outil.
// Le résumé d'un outil est déclaré par l'outil lui-même (`summarize`) : cette
// couche ne connaît donc aucun identifiant d'outil et n'a pas à être modifiée
// quand une capacité est ajoutée.

export const SUMMARY_MAX_LENGTH = 160;

export function truncateSummary(value: string): string {
  return value.slice(0, SUMMARY_MAX_LENGTH);
}

export function plural(value: number, singular: string, pluralForm: string) {
  return `${value} ${value > 1 ? pluralForm : singular}`;
}

export function summarizeToolResult(params: {
  result: ToolResult;
  summarize?: (data: unknown) => string;
}): string {
  if (!params.result.success) {
    return truncateSummary(params.result.error.message);
  }

  const declared = params.summarize?.(params.result.data);
  if (declared?.trim()) {
    return truncateSummary(declared.trim());
  }

  const sources = params.result.sources?.length ?? 0;
  return sources > 0
    ? `Terminé · ${plural(sources, "source", "sources")}`
    : "Terminé";
}

export function summarizeToolFailure(message: string): string {
  return truncateSummary(message);
}
