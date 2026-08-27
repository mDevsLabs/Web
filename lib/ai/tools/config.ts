import {
  CalculatorIcon,
  CalendarIcon,
  CloudSunIcon,
  FileTextIcon,
  GlobeIcon,
  ImageIcon,
  LightbulbIcon,
  NotebookIcon,
  PencilIcon,
  PlayIcon,
  Volume2Icon,
} from "lucide-react";
import type { ComponentType } from "react";

export const TOOL_IDS = [
  "getWeather",
  "createDocument",
  "editDocument",
  "updateDocument",
  "requestSuggestions",
  "imageGenerate",
  "audioGenerate",
  "codeExecution",
  "webSearch",
  "calculator",
  "dateTime",
  "note",
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
  audioGenerate: {
    description: "Générer une voix ou extrait audio via mAI Audio Studio",
    icon: Volume2Icon as any,
    id: "audioGenerate",
    label: "Générer audio",
  },
  calculator: {
    description:
      "Calculs mathématiques, fonctions trigonométriques, conversions d'unités (longueur, masse, température, etc.)",
    icon: CalculatorIcon as any,
    id: "calculator",
    label: "Calculatrice",
  },
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
  dateTime: {
    description:
      "Date, heure, fuseaux horaires, différences, calculs sur dates",
    icon: CalendarIcon as any,
    id: "dateTime",
    label: "Date & heure",
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
  note: {
    description:
      "Créer une note téléchargeable (markdown, texte, JSON, CSV, HTML, code)",
    icon: NotebookIcon as any,
    id: "note",
    label: "Créer note",
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
  webSearch: {
    description: "Recherche sur le Web en temps réel",
    icon: GlobeIcon as any,
    id: "webSearch",
    label: "Recherche Web",
  },
};

export const DEFAULT_ENABLED_TOOLS: ToolId[] = []; // tous désactivés par défaut
