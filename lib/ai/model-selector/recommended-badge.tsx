"use client";

/**
 * Pastille « Recommandé » portée par le groupe mAI.
 *
 * La recommandation porte sur le FOURNISSEUR — c'est mAI que la maison
 * recommande, pas un modèle en particulier. Le porter une seule fois, sur
 * l'en-tête du groupe, dit plus juste qu'un badge répété sur chaque ligne :
 * dix badges « Recommandé » côte à côte n'informent plus personne.
 *
 * L'accent est celui de l'information (`--info`) : c'est une indication, pas
 * une validation — le vert (`--success`) est réservé aux permissions
 * accordées.
 *
 * Le Site officiel a sa propre palette (`purple-*`) et ne connaît pas les
 * jetons de l'hôte : la variante `site` porte donc les classes du Site, et
 * `host` celles de l'hôte. Jamais de mélange — les deux mondes n'ont pas les
 * mêmes variables CSS.
 */

import { cn } from "@/lib/utils";

export type RecommendedBadgeProps = {
  className?: string;
  /**
   * `host` : palette de l'application hôte (jetons `--info`).
   * `site` : palette du Site officiel (`purple-*`).
   */
  variant?: "host" | "site";
};

const VARIANT_CLASSES: Record<
  NonNullable<RecommendedBadgeProps["variant"]>,
  string
> = {
  host: "border-info/25 bg-info/10 text-info",
  site: "border-purple-200/70 bg-purple-50 text-purple-700",
};

export function RecommendedBadge({
  className,
  variant = "host",
}: RecommendedBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide",
        VARIANT_CLASSES[variant],
        className
      )}
    >
      Recommandé
    </span>
  );
}
