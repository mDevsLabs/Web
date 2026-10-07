/**
 * Données des projets mAI.
 *
 * Module volontairement sans dépendance React : il est consommé à la fois
 * par la page /projects (composant client) et par l'index de recherche
 * côté serveur (app/api/search).
 */

export type Project = {
  id: string;
  name: string;
  /** Numéro décoratif affiché sur la carte (projets actifs). */
  number?: string;
  /** Statut affiché sous forme d'étiquette. */
  label?: string;
  /** Clé d'icône lucide, résolue par la page. */
  iconKey?: string;
  /** Image affichée à la place de l'icône (projets archivés). */
  image?: string;
  tagline?: string;
  description: string;
  /** Page de détail du projet — absente pour les archives sans page publiée. */
  link?: string;
  repo?: string;
  /** Page de téléchargement publique du projet, si elle existe. */
  releaseUrl?: string;
  platforms: string[];
};

export const activeProjects: Project[] = [
  {
    description:
      "Application d'IA en ligne web directement et simplement pour discuter avec l'IA mAI.",
    iconKey: "globe",
    id: "web",
    link: "/projects/web",
    name: "Web",
    number: "01",
    platforms: ["Web", "Multi-plateforme"],
    repo: "mDevsLabs/Web",
    tagline: "Application d'IA en ligne web directe et intuitive.",
  },
  {
    description:
      "Publiez, discutez et créez avec mAI intégré nativement : fil personnalisé, messages privés, cercles, collections et assistants IA. Disponible sur le web, Android et iOS.",
    iconKey: "messages-square",
    id: "vibe",
    link: "/projects/vibe",
    name: "Vibe",
    number: "02",
    platforms: ["Web", "Android", "iOS"],
    releaseUrl: "https://github.com/mDevsLabs/Vibe/releases/latest",
    repo: "mDevsLabs/Vibe",
    tagline: "Le réseau social où l'IA fait partie de la conversation.",
  },
  {
    description:
      "IDE IA de nouvelle génération avec agents IA autonomes, orchestration multi-modèles et support natif des outils MCP.",
    iconKey: "code",
    id: "coder",
    link: "/projects/coder",
    name: "Coder",
    number: "03",
    platforms: ["macOS", "Windows", "Linux"],
    repo: "mDevsLabs/Coder",
    tagline: "L'IDE IA pensé pour les agents autonomes et les outils MCP.",
  },
  {
    description:
      "Discussions et séances de codage dans le terminal CLI via mAI.",
    iconKey: "terminal",
    id: "cli",
    link: "/projects/cli",
    name: "CLI",
    number: "04",
    platforms: ["macOS", "Linux", "Windows"],
    repo: "mDevsLabs/CLI",
    tagline: "L'assistant de développement qui vit dans votre terminal.",
  },
  {
    description:
      "Ensemble d'extensions pour diverses applications pour discuter avec mAI directement (navigateur, VS Code...).",
    iconKey: "cpu",
    id: "pulse",
    link: "/projects/pulse",
    name: "Pulse",
    number: "05",
    platforms: ["Navigateur", "VS Code", "Extensions"],
    repo: "mDevsLabs/Pulse",
    tagline: "L'IA intégrée directement dans vos outils du quotidien.",
  },
];

export const archivedProjects: Project[] = [
  {
    description: "Site officiel et web mAI.",
    iconKey: "globe",
    id: "site",
    name: "Site",
    platforms: ["Web"],
    repo: "mDevsLabs/Site",
  },
  {
    description:
      "Ancienne version web de mAI avec intégration locale et cloud.",
    iconKey: "layers",
    id: "mai-legacy",
    link: "/projects/mai",
    name: "mAI Web (Legacy)",
    platforms: ["Web"],
    repo: "mDevsLabs/mAI",
  },
  {
    description: "Première itération de l'assistant terminal et messageries.",
    iconKey: "terminal",
    id: "mai-cli-legacy",
    link: "/projects/mai-cli",
    name: "mAI CLI (Legacy)",
    platforms: ["CLI"],
    repo: "mDevsLabs/mAI-CLI",
  },
  {
    description: "Extension Pulse pour le navigateur web.",
    iconKey: "cpu",
    id: "pulse-web",
    link: "/projects/pulse",
    name: "Pulse - Web",
    platforms: ["Navigateur"],
    repo: "mDevsLabs/Pulse",
  },
  {
    description: "Extension Pulse pour l'IDE JetBrains.",
    iconKey: "cpu",
    id: "pulse-jetbrains",
    link: "/projects/pulse",
    name: "Pulse - JetBrains",
    platforms: ["JetBrains"],
    repo: "mDevsLabs/Pulse",
  },
  {
    description: "Extension Pulse pour VS Code.",
    iconKey: "cpu",
    id: "pulse-vscode",
    link: "/projects/pulse",
    name: "Pulse - VS Code",
    platforms: ["VS Code"],
    repo: "mDevsLabs/Pulse",
  },
  {
    description: "Application desktop intégrée mAI.",
    iconKey: "layers",
    id: "desktop",
    name: "Desktop",
    platforms: ["Desktop"],
    repo: "mDevsLabs/Desktop",
  },
  {
    description: "Compétences et agents spécialisés mAI.",
    iconKey: "file-text",
    id: "skills",
    name: "Skills",
    platforms: ["Agents"],
    repo: "mDevsLabs/Skills",
  },
  {
    description: "Écosystème de plugins mAI.",
    iconKey: "file-text",
    id: "plugins",
    name: "Plugins",
    platforms: ["Plugins"],
    repo: "mDevsLabs/Plugins",
  },
  {
    description: "Hub API et agrégation de modèles LLM.",
    iconKey: "layers",
    id: "api",
    name: "API",
    platforms: ["API"],
    repo: "mDevsLabs/API",
  },
  {
    description:
      "Moteur de recherche sémantique et d'indexation vectorielle unifié.",
    iconKey: "search",
    id: "msearch",
    image: "/site/msearch.PNG",
    label: "Archivé",
    link: "/projects/msearch",
    name: "mSearch",
    platforms: ["Windows", "macOS", "Linux"],
    repo: "mDevsLabs/mSearch",
  },
  {
    description:
      "Proxy universel de routage de modèles LLM et compatibilité Codex.",
    iconKey: "layers",
    id: "openprovider",
    image: "/site/openprovider.png",
    label: "Archivé",
    link: "/projects/openprovider",
    name: "OpenProvider",
    platforms: ["CLI", "Proxy"],
    repo: "mDevsLabs/OpenProvider",
  },
  {
    description: "Jeu de réflexion et puzzle inspiré de Block Blast.",
    iconKey: "gamepad",
    id: "snob",
    image: "/site/snob.png",
    label: "Archivé",
    link: "/projects/snob",
    name: "Snob",
    platforms: ["Web", "Android"],
    repo: "mDevsLabs/Snob",
  },
  {
    description: "Autres projets et expérimentations.",
    iconKey: "archive",
    id: "autre",
    name: "Autre",
    platforms: ["Divers"],
  },
];

/**
 * Archives publiées sur la page /projects.
 *
 * Les autres archives restent dans `archivedProjects` (et donc dans
 * `allProjects`) pour préserver l'historique et les usages API.
 */
const publicArchivedProjectIds = new Set(["msearch", "openprovider", "snob"]);

export const publicArchivedProjects: Project[] = archivedProjects.filter(
  ({ id }) => publicArchivedProjectIds.has(id)
);

/** Tous les projets, actifs puis archivés. */
export const allProjects: Project[] = [...activeProjects, ...archivedProjects];

/**
 * Icônes système associées à certaines plateformes, pour afficher un label
 * illustré (Android / iOS) plutôt qu'une simple pastille textuelle.
 */
export const PLATFORM_DEVICE_ICONS: Record<
  string,
  { src: string; alt: string }
> = {
  Android: { alt: "Android", src: "/site/devices/google.png" },
  iOS: { alt: "iOS", src: "/site/devices/apple.png" },
  Linux: { alt: "Linux", src: "/site/devices/linux.png" },
  macOS: { alt: "macOS", src: "/site/devices/apple.png" },
  Windows: { alt: "Windows", src: "/site/devices/microsoft.png" },
};
