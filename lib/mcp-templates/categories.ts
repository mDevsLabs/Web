// Catalogue public des catégories de modèles MCP.
import type { McpTemplateCategory } from "./types";

export const MCP_CATEGORIES: McpTemplateCategory[] = [
  { icon: "Cloud", id: "cloud", label: "Cloud & fichiers" },
  { icon: "Database", id: "data", label: "Données & DB" },
  { icon: "MessageSquare", id: "collab", label: "Collaboration" },
  { icon: "Map", id: "maps", label: "Cartographie" },
  { icon: "Bug", id: "devtools", label: "DevOps & monitoring" },
  { icon: "Globe", id: "web", label: "Web & API" },
];
