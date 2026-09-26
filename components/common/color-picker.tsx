"use client";

import { CheckIcon, PipetteIcon } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

/**
 * Sélecteur de couleur partagé (agents, skills, commandes personnalisées).
 *
 * 10 couleurs classiques disposées sur deux lignes de 5, complétées par une
 * couleur libre : le `<input type="color">` et le champ hex restent
 * synchronisés, et la saisie est validée avant remontée.
 */
export function ColorPicker({
  className,
  colors,
  onChange,
  value,
}: {
  className?: string;
  colors: readonly string[];
  onChange: (color: string) => void;
  value: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  // Tant que l'utilisateur tape, on n'écrase pas sa saisie avec la valeur
  // externe ; la validation est faite à la sortie du champ.
  const hexDraft = draft ?? value;
  const isValid = HEX_COLOR_RE.test(hexDraft);

  const commitHex = () => {
    if (draft === null) {
      return;
    }
    if (HEX_COLOR_RE.test(draft)) {
      onChange(draft.toLowerCase());
    }
    setDraft(null);
  };

  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="grid grid-cols-5 gap-2">
        {colors.map((color) => {
          const selected = value.toLowerCase() === color.toLowerCase();
          return (
            <button
              aria-label={`Couleur ${color}`}
              aria-pressed={selected}
              className={cn(
                "aspect-square w-full rounded-full transition-transform",
                selected &&
                  "ring-2 ring-foreground ring-offset-1 ring-offset-background scale-105"
              )}
              key={color}
              onClick={() => {
                setDraft(null);
                onChange(color);
              }}
              style={{ backgroundColor: color }}
              title={color}
              type="button"
            />
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <label
          className="relative inline-flex size-7 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-border/60"
          style={{ backgroundColor: isValid ? value : "transparent" }}
          title="Couleur personnalisée"
        >
          <PipetteIcon className="size-3.5 text-white mix-blend-difference" />
          <input
            aria-label="Couleur personnalisée"
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={(event) => {
              setDraft(null);
              onChange(event.target.value.toLowerCase());
            }}
            type="color"
            value={isValid ? value : "#6366f1"}
          />
        </label>
        <Input
          aria-label="Couleur personnalisée (hex)"
          className="h-7 font-mono text-xs uppercase"
          maxLength={7}
          onBlur={commitHex}
          onChange={(event) => setDraft(event.target.value.trim())}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
          placeholder="#6366f1"
          spellCheck={false}
          value={hexDraft}
        />
        {isValid && value.toLowerCase() === hexDraft.toLowerCase() && (
          <CheckIcon className="size-3.5 shrink-0 text-muted-foreground" />
        )}
      </div>
    </div>
  );
}
