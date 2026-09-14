"use client";

import { AgentModeSwitcher } from "@/components/agent/agent-mode-switcher";
import type { AgentMode } from "@/lib/agent/channel";
import { cn } from "@/lib/utils";

// Emplacement unique du sélecteur Chat | Agent sur l'accueil.
//
// Les deux accueils (Chat et Agent) rendent ce même composant, à la même
// place : premier élément de la pile centrée de l'accueil, au-dessus de
// l'identité et du titre. Le shell ne fait que brancher l'état de mode ; il
// n'existe donc qu'un seul curseur animé à l'écran (layoutId commun dans
// PillSwitcher) et aucune position divergente entre les deux modes.
//
// Contrat d'espacement : l'écart entre le sélecteur et le titre vaut 32 px dans
// les deux accueils — l'accueil Agent le compose via `gap-6` + `mb-2`, l'accueil
// Chat via `mb-8` (sa pile n'utilise pas de gap). Le contrat est vérifié par
// tests/unit/home-mode-switcher.test.ts.
export function HomeModeSwitcher({
  className,
  mode,
  onBlockedAgentSelect,
  onModeChange,
}: {
  className?: string;
  mode: AgentMode;
  onBlockedAgentSelect?: () => void;
  onModeChange: (mode: AgentMode) => void;
}) {
  return (
    <div
      className={cn("flex w-full shrink-0 justify-center", className)}
      data-testid="home-mode-switcher"
    >
      <AgentModeSwitcher
        mode={mode}
        onBlockedAgentSelect={onBlockedAgentSelect}
        onModeChange={onModeChange}
      />
    </div>
  );
}
