// Source unique des onglets de la page Applications (route /tools). Module
// neutre (ni "server-only" ni "use client") : importable aussi bien par le
// composant serveur que par le sélecteur client.

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

// Point d'ancrage de la rangée d'actions de l'en-tête Applications : chaque
// panneau (Plugins, MCP, Skills) y porte ses boutons (Nouveau, Importer,
// Exporter…) via un portail, pour qu'ils se placent sur la même rangée que la
// barre de recherche globale — sur toute la largeur de la page. Défini dans ce
// module neutre pour éviter les imports circulaires entre le shell et les
// panneaux.
export const TOOLS_ACTIONS_ID = "tools-actions-slot";
