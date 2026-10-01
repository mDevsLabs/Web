"use client";

import { cn } from "@/lib/utils";

// Contrôle de température.
//
// Un curseur nu de 0 à 2 ne dit rien : « 1,4 » n'est ni une intention, ni une
// conséquence. On donne donc trois points de repère nommés, et le curseur nu
// reste disponible entre eux pour les cas intermédiaires.
//
// Le garde-fou final n'est pas un avertissement mais une information : les
// modèles à réflexion ignorent la température, et le dire ici évite qu'on
// règle un curseur en croyant qu'il agit. On n'empêche pas d'agir — le réglage
// reste valable si le modèle du bot change.

// Les trois valeurs sont celles que les réglages du compte et le Chat
// présentent par défaut : « 0,7 » doit vouloir dire la même chose partout.
const PRESETS = [
  {
    description: "Répete la formulation de la demande, sans interpretation.",
    label: "Précis",
    value: 0.2,
  },
  {
    description: "Le compromis par défaut : varié sans dériver.",
    label: "Équilibré",
    value: 0.7,
  },
  {
    description:
      "Plus d'options retenues, au prix de l'écart au besoin exprimé.",
    label: "Créatif",
    value: 1.3,
  },
] as const;

export function TemperatureControl({
  className,
  onChange,
  /** Le modèle du bot raisonne : la température n'aura aucun effet. */
  reasoningModel = false,
  value,
}: {
  className?: string;
  onChange: (next: number) => void;
  reasoningModel?: boolean;
  value: number;
}) {
  const active = PRESETS.find((preset) => preset.value === value);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs">Température</span>
        <span className="font-mono text-muted-foreground">
          {value.toFixed(1)}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => (
          <button
            className="chip"
            data-active={active?.label === preset.label || undefined}
            key={preset.label}
            onClick={() => onChange(preset.value)}
            title={preset.description}
            type="button"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <input
        aria-label="Température"
        className="w-full accent-primary"
        max={2}
        min={0}
        onChange={(event) => onChange(Number(event.target.value))}
        step={0.1}
        type="range"
        value={value}
      />

      {/* Une phrase par préréglage, ou celle du curseur quand il est entre
          deux : l'utilisateur n'a jamais à deviner ce qu'un 0,9 signifie. */}
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {active?.description ??
          "Entre deux préréglages : ni formule rigoureuse, ni variation notable."}
      </p>

      {reasoningModel ? (
        <p className="rounded-lg border border-border/60 bg-muted/30 p-2 text-[11px] leading-relaxed text-muted-foreground">
          Le modèle choisi raisonne avant de répondre et n'utilise pas ce
          réglage : la température n'aura aucun effet tant qu'il est celui-là.
          Le niveau de réflexion prend sa place.
        </p>
      ) : null}
    </div>
  );
}
