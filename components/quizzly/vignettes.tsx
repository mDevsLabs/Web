"use client";

/**
 * Vignettes de la boutique Quizzly.
 * Strictement des icônes issues de @mdevs/icons, aucun dessin ni bitmap ad-hoc.
 */

import {
  AwardIcon,
  CrownIcon,
  GemIcon,
  GiftIcon,
  HeartIcon,
  HourglassIcon,
  ShieldIcon,
  SparklesIcon,
  UserIcon,
  ZapIcon,
} from "@mdevs/icons";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

type IconeType = ComponentType<{ className?: string }>;

const ICONES_ARTICLES: Record<
  string,
  { icone: IconeType; fond: string; couleur: string }
> = {
  "booster-xp": {
    couleur: "text-blue-600 dark:text-blue-400",
    fond: "bg-blue-500/10 dark:bg-blue-500/20",
    icone: ZapIcon,
  },
  "bouclier-ligue": {
    couleur: "text-sky-600 dark:text-sky-400",
    fond: "bg-sky-500/10 dark:bg-sky-500/20",
    icone: ShieldIcon,
  },
  "cadre-amethyste": {
    couleur: "text-purple-600 dark:text-purple-400",
    fond: "bg-purple-500/10 dark:bg-purple-500/20",
    icone: GemIcon,
  },
  "cadre-ardoise": {
    couleur: "text-blue-600 dark:text-blue-400",
    fond: "bg-blue-500/10 dark:bg-blue-500/20",
    icone: UserIcon,
  },
  "cadre-diamant": {
    couleur: "text-cyan-500 dark:text-cyan-400",
    fond: "bg-cyan-500/10 dark:bg-cyan-500/20",
    icone: SparklesIcon,
  },
  "cadre-laurier": {
    couleur: "text-emerald-600 dark:text-emerald-400",
    fond: "bg-emerald-500/10 dark:bg-emerald-500/20",
    icone: AwardIcon,
  },
  "cadre-or": {
    couleur: "text-amber-500 dark:text-amber-400",
    fond: "bg-amber-500/10 dark:bg-amber-500/20",
    icone: CrownIcon,
  },
  "gel-serie": {
    couleur: "text-blue-600 dark:text-blue-400",
    fond: "bg-blue-500/10 dark:bg-blue-500/20",
    icone: HourglassIcon,
  },
  "offre-jour": {
    couleur: "text-blue-600 dark:text-blue-400",
    fond: "bg-blue-500/10 dark:bg-blue-500/20",
    icone: GiftIcon,
  },
  "recharge-coeurs": {
    couleur: "text-rose-500 dark:text-rose-400",
    fond: "bg-rose-500/10 dark:bg-rose-500/20",
    icone: HeartIcon,
  },
};

export function VignetteArticle({ id }: { id: string }) {
  const conf = ICONES_ARTICLES[id] ?? {
    couleur: "text-blue-600 dark:text-blue-400",
    fond: "bg-blue-500/10 dark:bg-blue-500/20",
    icone: SparklesIcon,
  };
  const Icone = conf.icone;

  return (
    <div
      className={cn(
        "flex size-20 sm:size-24 items-center justify-center rounded-3xl transition-transform duration-200 group-hover:scale-105",
        conf.fond,
        conf.couleur
      )}
    >
      <Icone className="size-10 sm:size-12 stroke-[2.2]" />
    </div>
  );
}
