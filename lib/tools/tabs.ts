// Source unique des onglets de la page Outils. Module neutre (ni "server-only"
// ni "use client") : importable aussi bien par le composant serveur que par le
// sélecteur client.

export const TOOLS_TABS = ["plugins", "mcp", "skills"] as const;

export type ToolsTab = (typeof TOOLS_TABS)[number];

export const TOOLS_TAB_LABELS: Record<ToolsTab, string> = {
  mcp: "MCP",
  plugins: "Plugins",
  skills: "Skills",
};

export function isToolsTab(
  value: string | null | undefined
): value is ToolsTab {
  return (TOOLS_TABS as readonly string[]).includes(value ?? "");
}

export function normalizeToolsTab(value: string | null | undefined): ToolsTab {
  return isToolsTab(value) ? value : "plugins";
}
