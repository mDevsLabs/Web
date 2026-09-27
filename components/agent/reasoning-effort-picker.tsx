"use client";

import { BrainIcon, ChevronDownIcon } from "lucide-react";
import { useCallback, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  REASONING_LEVEL_DESCRIPTIONS,
  REASONING_LEVEL_LABELS,
  type ReasoningLevel,
} from "@/lib/ai/registry/reasoning";
import { cn } from "@/lib/utils";

// Sélecteur d'effort de réflexion du composer Agent.
//
// Les niveaux affichés ne sont jamais écrits ici : ils viennent des capacités du
// modèle sélectionné (reasoning.supported_efforts, lu via /api/models). Un
// modèle qui en propose trois, cinq ou aucun doit fonctionner sans toucher à ce
// fichier — c'est tout l'intérêt d'une piste dont le nombre de crans suit la
// donnée.
//
// Le curseur est un radiogroup plutôt qu'un <input type="range"> : le nombre de
// positions est variable, et un radiogroup donne les flèches gauche/droite, la
// tabulation et l'annonce par les lecteurs d'écran sans code supplémentaire.

export type ReasoningEffortPickerProps = {
  /** Niveau effectif, déjà recalé sur le modèle par le serveur. */
  level: ReasoningLevel;
  /** Niveaux réellement acceptés par le modèle, du plus intense au plus faible. */
  levels: readonly ReasoningLevel[];
  /** Le modèle ne peut pas produire de réponse sans raisonner. */
  mandatory?: boolean;
  onLevelChange: (level: ReasoningLevel) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function ReasoningEffortPicker({
  level,
  levels,
  mandatory = false,
  onLevelChange,
  onOpenChange,
  open: controlledOpen,
}: ReasoningEffortPickerProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = useCallback(
    (next: boolean) => {
      setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange]
  );

  // Aucun niveau : le modèle décide seul de son effort. Ne pas afficher un
  // réglage qui ne changerait rien.
  if (levels.length === 0) {
    return null;
  }

  const index = Math.max(0, levels.indexOf(level));
  const current = levels[index] ?? levels[0];

  const move = (delta: number) => {
    const next =
      levels[Math.min(levels.length - 1, Math.max(0, index + delta))];
    if (next) {
      onLevelChange(next);
    }
  };

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <button
          className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          data-testid="agent-reasoning-effort"
          type="button"
        >
          <BrainIcon className="size-3.5" />
          <span>Effort de réflexion</span>
          <ChevronDownIcon className="size-3 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3" side="top">
        <p className="text-center text-sm font-medium">
          {REASONING_LEVEL_LABELS[current]}
        </p>
        <p className="mt-1 mb-3 min-h-8 text-center text-[11.5px] leading-snug text-muted-foreground">
          {mandatory
            ? "Ce modèle raisonne obligatoirement : l'effort ne peut pas être coupé."
            : REASONING_LEVEL_DESCRIPTIONS[current]}
        </p>

        {/*
          Une piste et un curseur, pas une liste de boutons : le nombre de
          positions est variable (3, 5, 7 selon le modèle) et la position réelle
          est continue. `slider` est la sémantique exacte — un seul élément
          focusable, les flèches font le reste — là où `radiogroup` aurait
          imposé N boutons pour N positions.
        */}
        <div className="relative h-6">
          {/* Piste remplie jusqu'au curseur. */}
          <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{
                width: `${
                  levels.length === 1
                    ? 100
                    : (index / (levels.length - 1)) * 100
                }%`,
              }}
            />
          </div>

          {/* Repères : un point par niveau réellement supporté. */}
          {levels.map((item, itemIndex) => {
            const position =
              levels.length === 1
                ? 50
                : (itemIndex / (levels.length - 1)) * 100;
            return (
              <span
                aria-hidden
                className={cn(
                  "absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full",
                  itemIndex <= index ? "bg-background" : "bg-border"
                )}
                key={item}
                style={{ left: `${position}%` }}
              />
            );
          })}

          <div
            aria-label="Effort de réflexion"
            aria-orientation="horizontal"
            aria-valuemax={levels.length - 1}
            aria-valuemin={0}
            aria-valuenow={index}
            aria-valuetext={REASONING_LEVEL_LABELS[current]}
            className="absolute inset-0 cursor-pointer focus:outline-none"
            // Un clic dans la piste saute au niveau le plus proche, sans
            // inverse : la piste est déjà orientée du plus cher au moins cher.
            onClick={(event) => {
              const bounds = event.currentTarget.getBoundingClientRect();
              const ratio = bounds.width
                ? (event.clientX - bounds.left) / bounds.width
                : 0;
              const target = Math.round(ratio * (levels.length - 1));
              const next =
                levels[Math.min(levels.length - 1, Math.max(0, target))];
              if (next) {
                onLevelChange(next);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
                event.preventDefault();
                move(-1);
              } else if (
                event.key === "ArrowRight" ||
                event.key === "ArrowUp"
              ) {
                event.preventDefault();
                move(1);
              }
            }}
            role="slider"
            tabIndex={0}
          >
            <span
              className="absolute top-1/2 block size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background shadow-sm"
              style={{
                left: `${
                  levels.length === 1 ? 50 : (index / (levels.length - 1)) * 100
                }%`,
              }}
            />
          </div>
        </div>

        <div className="mt-2 flex justify-between text-[10.5px] text-muted-foreground">
          <span>{REASONING_LEVEL_LABELS[levels[0]]}</span>
          <span>{REASONING_LEVEL_LABELS[levels.at(-1) ?? levels[0]]}</span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
