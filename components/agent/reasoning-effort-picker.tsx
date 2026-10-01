"use client";

import { BrainIcon, ChevronDownIcon } from "lucide-react";
import { useCallback, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  levelToRatio,
  REASONING_LEVEL_DESCRIPTIONS,
  REASONING_LEVEL_LABELS,
  type ReasoningLevel,
  ratioToLevel,
  toAscendingLevels,
} from "@/lib/ai/registry/reasoning";
import { cn } from "@/lib/utils";

// Sélecteur de réflexion du composer Agent.
//
// Les niveaux affichés ne sont jamais écrits ici : ils viennent des capacités du
// modèle sélectionné (reasoning.supported_efforts, lu via /api/models). Un
// modèle qui en propose trois, cinq ou aucun doit fonctionner sans toucher à ce
// fichier — c'est tout l'intérêt d'une piste dont le nombre de crans suit la
// donnée.
//
// ORIENTATION. La piste se lit comme un curseur de volume : « Faible » à gauche,
// « Maximale » à droite. Les capacités arrivent dans l'ordre décroissant
// (max → none), on les inverse une fois (`toAscendingLevels`) et toute la
// géométrie — remplissage, repères, curseur, clic, flèches — découle de cet
// ordre. Inverser les calculs un par un serait le meilleur moyen d'en laisser un
// derrière.
//
// ACCESSIBILITÉ. `role="slider"` et non `radiogroup` : le nombre de positions est
// variable (3, 5 ou 7 selon le modèle) et la sémantique de curseur tient dans un
// seul élément focusable. `ArrowRight` augmente l'intensité, comme sur toute
// glissière — la flèche droite va donc vers la droite de la piste.

export type ReasoningEffortPickerProps = {
  /** Niveau effectif, déjà recalé sur le modèle par le serveur. */
  level: ReasoningLevel;
  /** Niveaux réellement acceptés par le modèle, dans l'ordre décroissant. */
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

  const ascending = toAscendingLevels(levels);
  const single = ascending.length === 1;
  // Un niveau hors de la liste ne se produit pas en pratique — le serveur
  // renvoie toujours l'effort qu'il a appliqué — mais l'interface ne doit pas
  // non plus afficher un curseur sans position. On se rabat sur le niveau le
  // plus faible, qui est aussi le moins cher de tout l'intervalle.
  const activeIndex = Math.max(0, ascending.indexOf(level));
  const current = ascending[activeIndex] ?? ascending[0];
  // Un cran unique n'a pas de géométrie : la piste est pleine et le curseur au
  // centre, plutôt qu'un curseur collé au bord sur une piste vide de sens.
  const percent = single ? 100 : levelToRatio(ascending, current) * 100;

  const move = (delta: number) => {
    const next =
      ascending[
        Math.min(ascending.length - 1, Math.max(0, activeIndex + delta))
      ];
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
          <span>Réflexion</span>
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
          positions est variable et la position réelle est continue.
        */}
        <div className="relative h-6">
          {/* Piste remplie jusqu'au curseur. */}
          <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${percent}%` }}
            />
          </div>

          {/* Repères : un point par niveau réellement supporté. */}
          {ascending.map((item, itemIndex) => {
            const position = single ? 50 : levelToRatio(ascending, item) * 100;
            return (
              <span
                aria-hidden
                className={cn(
                  "absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full",
                  itemIndex <= activeIndex ? "bg-background" : "bg-border"
                )}
                key={item}
                style={{ left: `${position}%` }}
              />
            );
          })}

          <div
            aria-label="Réflexion"
            aria-orientation="horizontal"
            aria-valuemax={ascending.length - 1}
            aria-valuemin={0}
            aria-valuenow={activeIndex}
            aria-valuetext={REASONING_LEVEL_LABELS[current]}
            className="absolute inset-0 cursor-pointer focus:outline-none"
            // Un clic dans la piste saute au niveau le plus proche, sans inverse :
            // `ratioToLevel` raisonne sur la position, pas sur l'index.
            onClick={(event) => {
              const bounds = event.currentTarget.getBoundingClientRect();
              const ratio = bounds.width
                ? (event.clientX - bounds.left) / bounds.width
                : 0;
              const next = ratioToLevel(ascending, ratio);
              if (next) {
                onLevelChange(next);
              }
            }}
            onKeyDown={(event) => {
              // Vers la droite = plus intense, comme sur toute glissière.
              if (event.key === "ArrowRight" || event.key === "ArrowUp") {
                event.preventDefault();
                move(1);
              } else if (
                event.key === "ArrowLeft" ||
                event.key === "ArrowDown"
              ) {
                event.preventDefault();
                move(-1);
              }
            }}
            role="slider"
            tabIndex={0}
          >
            <span
              className="absolute top-1/2 block size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background shadow-sm"
              style={{ left: `${percent}%` }}
            />
          </div>
        </div>

        {/* Les deux extrémités de la piste, dans l'ordre où on les lit. */}
        <div className="mt-2 flex justify-between text-[10.5px] text-muted-foreground">
          <span>{REASONING_LEVEL_LABELS[ascending[0]]}</span>
          <span>
            {REASONING_LEVEL_LABELS[ascending.at(-1) ?? ascending[0]]}
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
