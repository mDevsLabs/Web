"use client";

import {
  AtomIcon,
  BookOpenIcon,
  CalculatorIcon,
  CastleIcon,
  ChartColumnIcon,
  CoffeeIcon,
  Columns3Icon,
  CpuIcon,
  DraftingCompassIcon,
  DramaIcon,
  FeatherIcon,
  FlameIcon,
  FlaskConicalIcon,
  GlobeIcon,
  LandmarkIcon,
  LaptopIcon,
  LeafIcon,
  MicroscopeIcon,
  MoonIcon,
  OrigamiIcon,
  PaletteIcon,
  SailboatIcon,
  ScaleIcon,
  ScrollIcon,
  SnowflakeIcon,
  SparklesIcon,
  SpeechIcon,
  StarIcon,
  SunIcon,
  TvIcon,
  WrenchIcon,
} from "@mdevs/icons";
import type { ComponentType } from "react";

type Icone = ComponentType<{ className?: string }>;

/**
 * Chaque matière dispose d'une icône unique issue de @mdevs/icons.
 * La même icône s'applique à une matière donnée à travers toutes les classes.
 */
const PAR_MATIERE: Record<string, Icone> = {
  allemand: CastleIcon,
  anglais: SpeechIcon,
  arabe: MoonIcon,
  arts: PaletteIcon,
  chinois: SparklesIcon,
  coreen: TvIcon,
  emc: ScaleIcon,
  "enseignement-scientifique": MicroscopeIcon,
  espagnol: FlameIcon,
  francais: BookOpenIcon,
  grec: FeatherIcon,
  hebreu: StarIcon,
  hggsp: LandmarkIcon,
  "histoire-geographie": GlobeIcon,
  hlp: DramaIcon,
  italien: CoffeeIcon,
  japonais: OrigamiIcon,
  latin: Columns3Icon,
  mathematiques: CalculatorIcon,
  nsi: CpuIcon,
  philosophie: ScrollIcon,
  "physique-chimie": AtomIcon,
  portugais: SailboatIcon,
  russe: SnowflakeIcon,
  "sciences-de-lingenieur": DraftingCompassIcon,
  "sciences-et-technologie": FlaskConicalIcon,
  ses: ChartColumnIcon,
  snt: LaptopIcon,
  svt: LeafIcon,
  technologie: WrenchIcon,
  turc: SunIcon,
};

export function IconeMatiere({
  className,
  id,
}: {
  className?: string;
  id: string;
}) {
  const Icone = PAR_MATIERE[id] ?? BookOpenIcon;
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center transition-transform duration-200 group-hover:scale-110"
      style={{ color: `var(--q-subject-${id}, var(--q-level))` }}
    >
      <Icone aria-hidden className={className ?? "size-4"} />
    </span>
  );
}
