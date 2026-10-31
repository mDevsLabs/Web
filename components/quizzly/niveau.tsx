"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function BarreMesure({
  couleur,
  label,
  max,
  valeur,
}: {
  couleur: string;
  label: string;
  max: number;
  valeur: number;
}) {
  const borne = Math.max(0, max);
  const atteint = Math.max(0, Math.min(valeur, borne));
  const ratio = borne > 0 ? atteint / borne : 0;
  return (
    <div
      aria-label={label}
      aria-valuemax={borne}
      aria-valuemin={0}
      aria-valuenow={atteint}
      className="h-2.5 overflow-hidden rounded-full bg-foreground/10"
      role="progressbar"
    >
      <motion.div
        animate={{ width: `${ratio * 100}%` }}
        className={cn("h-full rounded-full", couleur)}
        initial={false}
        transition={{ duration: 0.45, ease: "easeOut" }}
      />
    </div>
  );
}

export function BarreNiveau({
  compact = false,
  niveau,
  xpDansPalier,
  xpPalier,
}: {
  compact?: boolean;
  niveau: number;
  xpDansPalier: number;
  xpPalier: number;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1",
        compact ? "w-36" : "w-full max-w-xs"
      )}
    >
      <div className="flex items-baseline justify-between gap-3 text-xs font-semibold">
        <span className="text-q-level">Niveau {niveau}</span>
        <span className="text-muted-foreground">
          {xpDansPalier} / {xpPalier} XP
        </span>
      </div>
      <BarreMesure
        couleur="bg-q-level"
        label={`Niveau ${niveau}`}
        max={xpPalier}
        valeur={xpDansPalier}
      />
    </div>
  );
}
