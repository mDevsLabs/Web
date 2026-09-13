"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import {
  AGENT_MODE_LABELS,
  AGENT_MODES,
  type AgentMode,
} from "@/lib/agent/channel";
import { cn } from "@/lib/utils";

// Sélecteur Chat | Agent : un seul contrôle, animé, accessible au clavier
// (flèches gauche/droite, Origine/Fin). Le parent décide de ce qui se passe
// quand Agent est verrouillé pour l'utilisateur : le composant ne connaît ni
// les forfaits ni les flags.
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
  const containerRef = useRef<HTMLDivElement>(null);

  const select = (next: AgentMode) => {
    if (next === mode) {
      return;
    }
    if (next === "agent" && onBlockedAgentSelect) {
      onBlockedAgentSelect();
      return;
    }
    onModeChange(next);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const index = AGENT_MODES.indexOf(mode);
    if (event.key === "ArrowRight") {
      event.preventDefault();
      select(AGENT_MODES[(index + 1) % AGENT_MODES.length] as AgentMode);
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      select(
        AGENT_MODES[
          (index - 1 + AGENT_MODES.length) % AGENT_MODES.length
        ] as AgentMode
      );
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      select(AGENT_MODES[0] as AgentMode);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      select(AGENT_MODES.at(-1) as AgentMode);
    }
  };

  return (
    <div
      aria-label="Choisir entre Chat et Agent"
      className={cn(
        "relative inline-flex items-center rounded-full border border-border/40 bg-muted/50 p-1 shadow-inner",
        size === "sm" ? "gap-0.5" : "gap-1",
        className
      )}
      onKeyDown={handleKeyDown}
      ref={containerRef}
      role="tablist"
    >
      {AGENT_MODES.map((candidate) => {
        const isActive = candidate === mode;
        return (
          <button
            aria-selected={isActive}
            className={cn(
              "relative cursor-pointer rounded-full font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              size === "sm"
                ? "px-3 py-1 text-xs"
                : "px-5 py-1.5 text-sm sm:px-7 sm:py-2",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            data-testid={`agent-mode-${candidate}`}
            key={candidate}
            onClick={() => select(candidate)}
            role="tab"
            tabIndex={isActive ? 0 : -1}
            type="button"
          >
            {isActive ? (
              <motion.span
                aria-hidden
                className="absolute inset-0 rounded-full border border-border/50 bg-background shadow-sm"
                layoutId="agent-mode-pill"
                transition={{ damping: 26, stiffness: 380, type: "spring" }}
              />
            ) : null}
            <span className="relative z-10">
              {AGENT_MODE_LABELS[candidate]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
