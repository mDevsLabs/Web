"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

// Primitive de « curseur à onglets » : un conteneur pill, un indicateur animé
// (framer-motion layoutId) et la navigation clavier standard d'une tablist
// (flèches gauche/droite, Origine/Fin). Une seule implémentation pour le
// sélecteur Chat | Agent et le sélecteur Applications, pour éviter deux
// copies divergentes du même contrôle.
//
// Le composant ne connaît ni les forfaits ni les flags : le verrouillage est
// exprimé par onBlockedSelect — le parent décide de ce qui se passe quand
// l'utilisateur choisit un onglet verrouillé (dialogue d'upgrade, toast…).

export type PillSwitcherItem<T extends string> = {
  id: T;
  label: string;
  locked?: boolean;
};

export function PillSwitcher<T extends string>({
  activeId,
  ariaLabel,
  className,
  items,
  layoutId,
  onBlockedSelect,
  onSelect,
  size = "md",
}: {
  activeId: T;
  ariaLabel: string;
  className?: string;
  items: ReadonlyArray<PillSwitcherItem<T>>;
  // layoutId framer-motion : unique par usage pour que deux sélecteurs à
  // l'écran n'animent pas le même indicateur.
  layoutId: string;
  onBlockedSelect?: (id: T) => void;
  onSelect: (id: T) => void;
  size?: "md" | "sm";
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const select = (id: T) => {
    if (id === activeId) {
      return;
    }
    const item = items.find((candidate) => candidate.id === id);
    if (item?.locked && onBlockedSelect) {
      onBlockedSelect(id);
      return;
    }
    onSelect(id);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const index = items.findIndex((item) => item.id === activeId);
    const count = items.length;
    if (count === 0) {
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      select(items[(index + 1) % count]!.id);
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      select(items[(index - 1 + count) % count]!.id);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      select(items[0]!.id);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      select(items.at(-1)!.id);
    }
  };

  return (
    <div
      aria-label={ariaLabel}
      className={cn(
        "relative inline-flex items-center rounded-full border border-border/40 bg-muted/50 p-1 shadow-inner",
        size === "sm" ? "gap-0.5" : "gap-1",
        className
      )}
      onKeyDown={handleKeyDown}
      ref={containerRef}
      role="tablist"
    >
      {items.map((item) => {
        const isActive = item.id === activeId;
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
            data-testid={`pill-switcher-${item.id}`}
            key={item.id}
            onClick={() => select(item.id)}
            role="tab"
            tabIndex={isActive ? 0 : -1}
            type="button"
          >
            {isActive ? (
              <motion.span
                aria-hidden
                className="absolute inset-0 rounded-full border border-border/50 bg-background shadow-sm"
                layoutId={layoutId}
                transition={{ damping: 26, stiffness: 380, type: "spring" }}
              />
            ) : null}
            <span className="relative z-10 flex items-center gap-1.5">
              {item.label}
              {item.locked ? (
                <span
                  aria-hidden
                  className="inline-block size-1.5 rounded-full bg-amber-500"
                  title="Réservé aux forfaits payants"
                />
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
