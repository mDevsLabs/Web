import type { ToolCategory } from "@/lib/agent/types";

// Familles d'outils : vocabulaire commun au sélecteur, au picker « Outils » du
// composer et aux réglages. Une famille regroupe des outils par usage perçu par
// l'utilisateur, alors qu'une ToolCategory décrit l'implémentation.
export type AgentToolFamily =
  | "web"
  | "files"
  | "library"
  | "project"
  | "artifact"
  | "plugins"
  | "mcp"
  | "skills"
  | "internal";

export const AGENT_TOOL_FAMILIES: AgentToolFamily[] = [
  "web",
  "files",
  "library",
  "project",
  "artifact",
  "plugins",
  "mcp",
  "skills",
  "internal",
];

export const AGENT_FAMILY_LABELS: Record<AgentToolFamily, string> = {
  artifact: "Livrables",
  files: "Fichiers",
  internal: "Outils internes",
  library: "Bibliothèque",
  mcp: "MCP",
  plugins: "Plugins",
  project: "Projet",
  skills: "Skills",
  web: "Recherche web",
};

export const AGENT_FAMILY_DESCRIPTIONS: Record<AgentToolFamily, string> = {
  artifact:
    "Créer et mettre à jour des livrables consultables (rapports, tableaux, code).",
  files: "Lire le contenu de fichiers joints ou téléversés.",
  internal: "Questions à l'utilisateur, calculs, date et heure.",
  library: "Explorer les fichiers enregistrés dans la bibliothèque mAI.",
  mcp: "Outils exposés par les serveurs MCP connectés.",
  plugins:
    "Consultation en lecture seule des sources publiques activées par les plugins.",
  project: "Exploiter les ressources et instructions du projet sélectionné.",
  skills: "Compétences spécialisées définies par l'utilisateur.",
  web: "Rechercher des informations à jour sur le Web et citer les sources.",
};

// Ensemble prudent utilisé quand la demande n'oriente vers aucune famille :
// lecture, recherche, livrable, questions. Rien de destructif, rien d'externe.
export const BASELINE_FAMILIES: AgentToolFamily[] = [
  "web",
  "files",
  "library",
  "artifact",
  "internal",
];

export const TOOL_CATEGORY_TO_FAMILY: Record<ToolCategory, AgentToolFamily> = {
  artifact: "artifact",
  files: "files",
  internal: "internal",
  library: "library",
  mcp: "mcp",
  plugins: "plugins",
  project: "project",
  skills: "skills",
  web: "web",
};

// Mots-clés d'intention, en français et en anglais. Volontairement lisibles et
// testables : le routeur LLM n'intervient qu'en cas d'ambiguïté réelle.
export const FAMILY_INTENT_KEYWORDS: Record<AgentToolFamily, string[]> = {
  artifact: [
    "rapport",
    "report",
    "livrable",
    "tableau",
    "synthese",
    "synthèse",
    "note",
    "presentation",
    "présentation",
    "markdown",
    "csv",
    "json",
    "script",
    "code",
    "redige",
    "rédige",
    "ecris",
    "écris",
    "genere un document",
    "génère un document",
    "resume en fichier",
  ],
  files: [
    "fichier",
    "fichiers",
    "file",
    "files",
    "pdf",
    "docx",
    "piece jointe",
    "pièce jointe",
    "document joint",
    "extrait",
    "contenu du",
    "lis ce",
    "lire ce",
  ],
  internal: [
    "question",
    "demande-moi",
    "precise",
    "précise",
    "calcul",
    "calculer",
    "date",
    "heure",
    "formule",
    "conversion",
  ],
  library: [
    "bibliotheque",
    "bibliothèque",
    "library",
    "mes fichiers",
    "mes documents",
    "cloud",
  ],
  mcp: ["mcp", "serveur mcp", "github", "gitlab", "jira", "notion"],
  plugins: [
    "plugin",
    "plugins",
    "github",
    "dépôt public",
    "issue",
    "release",
    "open food facts",
    "code-barres",
    "ingrédient",
    "allergène",
    "isbn",
    "open library",
    "livre",
    "ouvrage",
    "auteur",
    "crossref",
    "doi",
    "publication",
    "revue scientifique",
    "banque mondiale",
    "world bank",
    "indicateur économique",
    "tvmaze",
    "épisode",
    "série télé",
    "jour férié",
    "jours fériés",
    "gmail",
    "drive",
    "google agenda",
    "calendar",
    "email",
    "mail",
  ],
  project: [
    "projet",
    "project",
    "dossier",
    "repo",
    "depot",
    "contexte du projet",
  ],
  skills: ["skill", "competence", "compétence"],
  web: [
    "recherche",
    "rechercher",
    "cherche",
    "web",
    "internet",
    "actualite",
    "actualité",
    "source",
    "sources",
    "verifie",
    "vérifie",
    "compare",
    "tendance",
    "prix",
    "news",
    "documentation",
    "benchmark",
  ],
};

// Normalisation commune aux règles et aux métadonnées : minuscules sans accents.
export function normalizeTaskText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function detectFamiliesFromTask(task: string): AgentToolFamily[] {
  const normalized = normalizeTaskText(task);
  if (!normalized.trim()) {
    return [];
  }
  const matched: AgentToolFamily[] = [];
  for (const family of AGENT_TOOL_FAMILIES) {
    const keywords = FAMILY_INTENT_KEYWORDS[family].map(normalizeTaskText);
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      matched.push(family);
    }
  }
  return matched;
}

export function isAgentToolFamily(value: unknown): value is AgentToolFamily {
  return (
    typeof value === "string" &&
    (AGENT_TOOL_FAMILIES as string[]).includes(value)
  );
}

export function familyForCategory(category: ToolCategory): AgentToolFamily {
  return TOOL_CATEGORY_TO_FAMILY[category];
}
