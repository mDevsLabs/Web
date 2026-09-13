"use client";

import { LockIcon } from "lucide-react";
import { TOOLS_TAB_LABELS, TOOLS_TABS, type ToolsTab } from "@/lib/tools/tabs";
import { cn } from "@/lib/utils";

// Reproduit le « curseur » de la maquette : un conteneur arrondi clair et un
// indicateur blanc qui glisse derrière l'onglet actif.
export function ToolsSwitcher({
  activeTab,
  isPaid,
  onChange,
}: {
  activeTab: ToolsTab;
  isPaid: boolean;
  onChange: (tab: ToolsTab) => void;
}) {
  const activeIndex = TOOLS_TABS.indexOf(activeTab);

  return (
    <div
      aria-label="Sections d'outils"
      className="relative grid w-full max-w-md grid-cols-3 rounded-full bg-muted/60 p-1 ring-1 ring-border/50"
      role="tablist"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-1 left-1 rounded-full bg-background shadow-sm ring-1 ring-border/40 transition-transform duration-300 ease-out"
        style={{
          transform: `translateX(calc(${activeIndex} * 100%))`,
          width: "calc((100% - 0.5rem) / 3)",
        }}
      />
      {TOOLS_TABS.map((tab) => {
        const locked = !isPaid && tab !== "skills";
        const isActive = tab === activeTab;
        return (
          <button
            aria-selected={isActive}
            className={cn(
              "relative z-10 flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors cursor-pointer",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground/80"
            )}
            key={tab}
            onClick={() => onChange(tab)}
            role="tab"
            type="button"
          >
            <span>{TOOLS_TAB_LABELS[tab]}</span>
            {locked ? <LockIcon className="size-3 text-amber-500" /> : null}
          </button>
        );
      })}
    </div>
  );
}
