import {
  BrainIcon,
  FolderIcon,
  GlobeIcon,
  ImageIcon,
  LibraryIcon,
  ListChecksIcon,
  type LucideIcon,
  MicIcon,
  PaperclipIcon,
  WrenchIcon,
} from "lucide-react";
import type { AgentFlagKey } from "@/lib/agent/flags";
import type { ModelCapabilities } from "@/lib/ai/registry/capabilities";

// Registre des actions du menu « + » d'AgentComposer. Ajouter une capacité ne
// demande aucune modification du composer : on déclare une entrée ici, puis on
// enregistre son panneau dans `AGENT_COMPOSER_PANELS`. Les entrées
// indisponibles sont automatiquement grisées avec leur explication.
//
// Les entrées « one-shot » (image, audio, web, mémoire, tâches) activent une
// option pour le PROCHAIN envoi uniquement — même contrat que les outils
// one-shot du Chat. Elles ne portent pas de panneau : leur état est rendu par
// des chips sous la barre.

export type AgentComposerActionId =
  | "audio"
  | "files"
  | "image"
  | "library"
  | "memory"
  | "project"
  | "tasks"
  | "tools"
  | "web";

export type AgentComposerAvailability = {
  capabilities?: Pick<ModelCapabilities, "file" | "image" | "tools" | "vision">;
  flags: Partial<Record<AgentFlagKey, boolean>>;
};

export type AgentComposerAction = {
  description: string;
  icon: LucideIcon;
  id: AgentComposerActionId;
  label: string;
  requiresFlag?: AgentFlagKey;
  unavailableReason?: (
    availability: AgentComposerAvailability
  ) => string | null;
};

function modelLacksFiles(
  availability: AgentComposerAvailability
): string | null {
  const capabilities = availability.capabilities;
  if (!capabilities) {
    return null;
  }
  if (capabilities.file || capabilities.image || capabilities.vision) {
    return null;
  }
  return "Ce modèle ne prend pas en charge ce type de fichier.";
}

export const AGENT_COMPOSER_ACTIONS: AgentComposerAction[] = [
  {
    description: "Ajouter des fichiers depuis la bibliothèque ou l'appareil.",
    icon: PaperclipIcon,
    id: "files",
    label: "Fichiers",
    requiresFlag: "agent.files",
    unavailableReason: modelLacksFiles,
  },
  {
    description:
      "Choisir des fichiers déjà enregistrés dans votre bibliothèque.",
    icon: LibraryIcon,
    id: "library",
    label: "Bibliothèque",
    requiresFlag: "agent.files",
    unavailableReason: modelLacksFiles,
  },
  {
    description:
      "Activer la génération d'image pour la prochaine tâche (one-shot).",
    icon: ImageIcon,
    id: "image",
    label: "Créer une image",
  },
  {
    description:
      "Activer la synthèse vocale pour la prochaine tâche (one-shot).",
    icon: MicIcon,
    id: "audio",
    label: "Créer un audio",
  },
  {
    description: "Activer la recherche Web pour la prochaine tâche (one-shot).",
    icon: GlobeIcon,
    id: "web",
    label: "Recherche Web",
  },
  {
    description:
      "Activer la gestion de la mémoire pour la prochaine tâche (one-shot).",
    icon: BrainIcon,
    id: "memory",
    label: "Mémoire",
  },
  {
    description:
      "Demander à Agent de concevoir un plan et une liste de tâches avant d'agir (one-shot).",
    icon: ListChecksIcon,
    id: "tasks",
    label: "Tâches",
  },
  {
    description: "Relier la tâche à un projet et à ses ressources.",
    icon: FolderIcon,
    id: "project",
    label: "Projet",
    requiresFlag: "agent.projects",
  },
  {
    description: "Choisir les familles d'outils autorisées pour cette tâche.",
    icon: WrenchIcon,
    id: "tools",
    label: "Outils",
  },
];

export function getAgentComposerAction(
  id: AgentComposerActionId
): AgentComposerAction {
  const found = AGENT_COMPOSER_ACTIONS.find((action) => action.id === id);
  if (!found) {
    throw new Error(`Action de composer Agent inconnue : ${id}`);
  }
  return found;
}

export function resolveComposerActionAvailability(
  action: AgentComposerAction,
  availability: AgentComposerAvailability
): { available: boolean; reason?: string } {
  if (action.requiresFlag && !availability.flags[action.requiresFlag]) {
    return { available: false, reason: "Fonctionnalité désactivée." };
  }
  const reason = action.unavailableReason?.(availability);
  if (reason) {
    return { available: false, reason };
  }
  return { available: true };
}
