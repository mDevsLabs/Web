"use client";

import { PillSwitcher } from "@/components/ui/pill-switcher";
import {
  AGENT_MODE_LABELS,
  AGENT_MODES,
  type AgentMode,
} from "@/lib/agent/channel";

// Sélecteur Chat | Agent : un seul contrôle, animé, accessible au clavier
// (flèches gauche/droite, Origine/Fin). Le rendu est délégué à la primitive
// partagée PillSwitcher ; le parent décide de ce qui se passe quand Agent est
// verrouillé pour l'utilisateur (le composant ne connaît ni les forfaits ni
// les flags).
export function AgentModeSwitcher({
  className,
  mode,
  onModeChange,
  onBlockedAgentSelect,
  size = "md",
}: {
  className?: string;
  mode: AgentMode;
  onBlockedAgentSelect?: () => void;
  onModeChange: (mode: AgentMode) => void;
  size?: "md" | "sm";
}) {
  return (
    <PillSwitcher
      activeId={mode}
      ariaLabel="Choisir entre Chat et Agent"
      className={className}
      items={AGENT_MODES.map((candidate) => ({
        id: candidate,
        label: AGENT_MODE_LABELS[candidate],
      }))}
      layoutId="agent-mode-pill"
      onBlockedSelect={
        onBlockedAgentSelect ? () => onBlockedAgentSelect() : undefined
      }
      onSelect={onModeChange}
      size={size}
    />
  );
}
