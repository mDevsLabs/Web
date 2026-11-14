export type MemoryEntry = {
  agentId: string | null;
  agentName?: string | null;
  content: string;
  createdAt: string;
  id: string;
  isEnabled?: boolean;
  isImportant?: boolean;
  projectId: string | null;
  projectName?: string | null;
  tags?: string[] | null;
  updatedAt?: string;
};

export type MemoryCardProps = {
  agentId?: string;
  /** Onglet Mémoire: liste toutes les portées avec un filtre. */
  allScopes?: boolean;
  projectId?: string;
};

export type ScopeFilter = "agent" | "all" | "global" | "project";

export const SCOPE_FILTERS: { id: ScopeFilter; label: string }[] = [
  { id: "all", label: "Toutes les portées" },
  { id: "global", label: "Globales" },
  { id: "agent", label: "Bots" },
  { id: "project", label: "Projets" },
];

export function formatMemoryDate(value: string): string {
  try {
    return new Date(value).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function isGlobalScope(entry: MemoryEntry): boolean {
  return !entry.agentId && !entry.projectId;
}

export function matchesScopeFilter(
  entry: MemoryEntry,
  filter: ScopeFilter
): boolean {
  if (filter === "all") return true;
  if (filter === "global") return isGlobalScope(entry);
  if (filter === "agent") return Boolean(entry.agentId);
  if (filter === "project") return Boolean(entry.projectId);
  return true;
}

export function scopeLabel(entry: MemoryEntry): string {
  if (entry.agentId) {
    return entry.agentName ? `Bot: ${entry.agentName}` : "Bot";
  }
  if (entry.projectId) {
    return entry.projectName ? `Projet: ${entry.projectName}` : "Projet";
  }
  return "Globale";
}

export function normalizeStr(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
