"use client";

/**
 * Icône d'une source de recherche mAI Search.
 *
 * La correspondance source → icône vit ici, et non dans le composant qui
 * l'affiche : ajouter une source ne doit pas obliger à modifier chaque
 * interface qui liste les sources. `lib/search/sources.ts` reste le
 * vocabulaire (libellés, descriptions) et ne dépend pas de React.
 */

import {
  BookIcon,
  GlobeIcon,
  ImageIcon,
  NewspaperIcon,
  VideoIcon,
} from "@mdevs/icons";
import type { MaiSearchSourceKey } from "@/lib/search/sources";

const SOURCE_ICONS: Record<MaiSearchSourceKey, typeof GlobeIcon> = {
  images: ImageIcon,
  news: NewspaperIcon,
  videos: VideoIcon,
  web: GlobeIcon,
  wikipedia: BookIcon,
};

export type SourceIconProps = {
  className?: string;
  source: MaiSearchSourceKey;
};

export function SourceIcon({ className, source }: SourceIconProps) {
  const Icone = SOURCE_ICONS[source] ?? GlobeIcon;
  return <Icone className={className} />;
}
