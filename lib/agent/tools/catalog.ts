import type {
  AgentToolAvailability,
  AgentToolPermissions,
  ToolCategory,
} from "@/lib/agent/types";

// Catalogue des outils Agent : source unique des métadonnées (libellé, famille,
// permission par défaut) partagée entre l'exécution serveur et l'interface.
// Module neutre, importable côté client : le sélecteur d'outils et la timeline
// n'importent donc jamais une fonction serveur juste pour afficher un libellé.

export type AgentToolMetadata = {
  availability: AgentToolAvailability;
  category: ToolCategory;
  description: string;
  id: string;
  name: string;
  permissions: AgentToolPermissions;
};

export const AGENT_TOOL_CATALOG: Record<string, AgentToolMetadata> = {
  ask_user: {
    availability: {
      categories: ["internal"],
      requires: { tools: true },
      tiers: "all",
    },
    category: "internal",
    description:
      "Pose une question précise à l'utilisateur (choix unique, choix multiples, texte, curseur, oui/non, date) lorsqu'une information manque et qu'aucune hypothèse raisonnable n'est possible.",
    id: "ask_user",
    name: "Question à l'utilisateur",
    permissions: { default: "auto", readOnly: true },
  },
  create_artifact: {
    availability: {
      categories: ["artifact"],
      requires: { tools: true },
      tiers: "all",
    },
    category: "artifact",
    description:
      "Crée un livrable consultable à côté de la conversation : document texte, code, feuille de calcul ou page HTML. À utiliser pour tout contenu long ou structuré plutôt que de le déverser dans le message.",
    id: "create_artifact",
    name: "Créer un livrable",
    permissions: { default: "auto" },
  },
  read_file: {
    availability: {
      categories: ["files", "library"],
      requires: { files: true, tools: true },
      tiers: "all",
    },
    category: "files",
    description:
      "Lit un document (PDF, DOCX, CSV, texte, JSON) depuis la bibliothèque de l'utilisateur ou depuis une URL publique, et renvoie son texte par pages ou sections. À utiliser avant d'analyser un fichier, jamais en devinant son contenu.",
    id: "read_file",
    name: "Lire un fichier",
    permissions: { default: "auto", readOnly: true },
  },
  search_web: {
    availability: {
      categories: ["web"],
      requires: { tools: true },
      tiers: "all",
    },
    category: "web",
    description:
      "Recherche des informations à jour sur le Web et renvoie des résultats structurés (titre, extrait, URL, source). Les sources peuvent être citées directement dans la réponse finale.",
    id: "search_web",
    name: "Recherche Web",
    permissions: { default: "auto", readOnly: true },
  },
};

export const AGENT_TOOL_IDS = Object.keys(AGENT_TOOL_CATALOG);

export function getAgentToolMetadata(
  toolId: string
): AgentToolMetadata | undefined {
  return AGENT_TOOL_CATALOG[toolId];
}

// Variante stricte utilisée par les définitions d'outils : une métadonnée
// manquante est une erreur de développement, pas un cas d'exécution.
export function requireAgentToolMetadata(toolId: string): AgentToolMetadata {
  const metadata = AGENT_TOOL_CATALOG[toolId];
  if (!metadata) {
    throw new Error(
      `Métadonnées d'outil Agent manquantes pour « ${toolId} » : déclarez-les dans lib/agent/tools/catalog.ts.`
    );
  }
  return metadata;
}

export function isKnownAgentToolId(toolId: string): boolean {
  return toolId in AGENT_TOOL_CATALOG;
}

export function getAgentToolLabel(toolId: string): string {
  return AGENT_TOOL_CATALOG[toolId]?.name ?? toolId;
}

export function getAgentToolCategory(toolId: string): ToolCategory {
  return AGENT_TOOL_CATALOG[toolId]?.category ?? "internal";
}

export function listAgentToolMetadata(): AgentToolMetadata[] {
  return Object.values(AGENT_TOOL_CATALOG);
}
