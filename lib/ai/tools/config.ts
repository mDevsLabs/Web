import {
  CloudSunIcon,
  FileTextIcon,
  ImageIcon,
  LightbulbIcon,
  PencilIcon,
  PlayIcon,
} from "lucide-react";
import type { ComponentType } from "react";

export const TOOL_IDS = [
  "getWeather",
  "createDocument",
  "editDocument",
  "updateDocument",
  "requestSuggestions",
  "imageGenerate",
  "codeExecution",
] as const;

export type ToolId = (typeof TOOL_IDS)[number];

export type ToolMeta = {
  id: ToolId;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  isArtifact?: boolean;
};

export const TOOLS_META: Record<ToolId, ToolMeta> = {
  codeExecution: {
    description: "Générer et exécuter code Python/JS côté navigateur (Pyodide)",
    icon: PlayIcon as any,
    id: "codeExecution",
    label: "Exécuter code",
  },
  createDocument: {
    description: "Créer un artifact texte/code/sheet/html",
    icon: FileTextIcon as any,
    id: "createDocument",
    isArtifact: true,
    label: "Créer document",
  },
  editDocument: {
    description: "Modification ciblée d'un artifact existant",
    icon: PencilIcon as any,
    id: "editDocument",
    isArtifact: true,
    label: "Éditer document",
  },
  getWeather: {
    description: "Obtenir la météo d'une ville (via Open-Meteo)",
    icon: CloudSunIcon as any,
    id: "getWeather",
    label: "Météo",
  },
  imageGenerate: {
    description: "Générer une image via mAI Studio (quota journalier)",
    icon: ImageIcon as any,
    id: "imageGenerate",
    label: "Générer image",
  },
  requestSuggestions: {
    description: "Suggérer des améliorations sur un document",
    icon: LightbulbIcon as any,
    id: "requestSuggestions",
    label: "Suggestions",
  },
  updateDocument: {
    description: "Réécriture complète d'un artifact",
    icon: FileTextIcon as any,
    id: "updateDocument",
    isArtifact: true,
    label: "Réécrire document",
  },
};

export const DEFAULT_ENABLED_TOOLS: ToolId[] = []; // tous désactivés par défaut
