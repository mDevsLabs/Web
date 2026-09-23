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
      "Pose de 1 à 6 questions précises à l'utilisateur (choix unique, choix multiples, texte, curseur numérique, oui/non, date) lorsqu'une information manque et qu'aucune hypothèse raisonnable n'est possible. Chaque question porte un identifiant unique, un type de réponse, des choix éventuels (obligatoires pour les types à choix), une valeur par défaut facultative et son caractère obligatoire. Le run se suspend jusqu'à la réponse de l'utilisateur, puis reprend au même endroit.",
    id: "ask_user",
    name: "Question à l'utilisateur",
    permissions: { default: "auto", impact: "read", readOnly: true },
  },
  attach_to_project: {
    availability: {
      categories: ["project"],
      requires: { tools: true },
      tiers: "all",
    },
    category: "project",
    description:
      "Enregistre un livrable déjà créé dans un projet de l'utilisateur, pour que le résultat reste consultable avec le reste du projet. Exige un accord explicite : la demande précise le livrable et le projet.",
    id: "attach_to_project",
    name: "Ajouter un résultat au projet",
    permissions: { default: "ask", impact: "external_mutation", readOnly: false },
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
    permissions: { default: "auto", impact: "local_creation" },
  },
  export_deliverable: {
    availability: {
      categories: ["artifact"],
      requires: { tools: true },
      tiers: "all",
    },
    category: "artifact",
    description:
      "Crée un livrable tabulaire consultable et téléchargeable (CSV, tableau Markdown ou page HTML) à partir de données structurées. À utiliser pour un export, un tableau de synthèse ou un comparatif plutôt que de déverser les lignes dans la réponse.",
    id: "export_deliverable",
    name: "Exporter un livrable",
    permissions: { default: "auto", impact: "local_creation", readOnly: false },
  },
  generate_audio: {
    availability: {
      categories: ["internal"],
      requires: { tools: true },
      tiers: "all",
    },
    category: "internal",
    description:
      "Synthétise un audio (voix) via mAI Audio Studio à partir d'un texte. Utilise cet outil dès que l'utilisateur demande de parler, synthétiser, vocaliser ou créer un son. Renvoie audio_url, à jouer directement dans la réponse.",
    id: "generate_audio",
    name: "Créer un audio",
    permissions: { default: "auto", impact: "local_creation", readOnly: false },
  },
  generate_image: {
    availability: {
      categories: ["internal"],
      requires: { tools: true },
      tiers: "all",
    },
    category: "internal",
    description:
      "Génère une image via mAI Studio à partir d'une description détaillée. Utilise cet outil dès que l'utilisateur demande de créer, générer, dessiner ou illustrer une image. L'URL de l'image produite est renvoyée et doit être présentée dans la réponse.",
    id: "generate_image",
    name: "Créer une image",
    permissions: { default: "auto", impact: "local_creation", readOnly: false },
  },
  manage_memory: {
    availability: {
      categories: ["internal"],
      requires: { tools: true },
      tiers: "all",
    },
    category: "internal",
    description:
      "Gère la mémoire personnalisée de l'utilisateur : ajouter (add), supprimer (delete), lister (list) ou rechercher (search) des informations durables le concernant (préférences, faits, contexte). Utilise cet outil quand l'utilisateur demande de retenir, d'oublier ou de retrouver des informations mémorisées.",
    id: "manage_memory",
    name: "Gérer la mémoire",
    permissions: { default: "ask", impact: "external_mutation", readOnly: false },
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
  read_url: {
    availability: {
      categories: ["web"],
      requires: { tools: true },
      tiers: "all",
    },
    category: "web",
    description:
      "Lit et extrait le texte propre d'une page Web ou d'une documentation technique à partir de son URL http(s), en retirant scripts, styles et menus. À utiliser pour analyser une source précise repérée par recherche, jamais en devinant son contenu.",
    id: "read_url",
    name: "Lire une page web",
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
  tasks: {
    availability: {
      categories: ["internal"],
      requires: { tools: true },
      tiers: "all",
    },
    category: "internal",
    description:
      "Structure un plan de travail réel avant d'exécuter quoi que ce soit : une liste ordonnée de tâches concrètes (2 à 8), chacune avec un intitulé clair commençant par un verbe à l'infinitif et un résultat attendu. À appeler EN PREMIER, avant tout autre outil, dès que l'utilisateur active l'option Tâches : le plan s'affiche ensuite dans la timeline et guide l'exécution.",
    id: "tasks",
    name: "Planifier les tâches",
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
