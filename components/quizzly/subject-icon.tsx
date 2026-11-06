"use client";

import {
  AtomIcon,
  BookOpenIcon,
  CalculatorIcon,
  CpuIcon,
  DramaIcon,
  FlaskConicalIcon,
  GlobeIcon,
  LandmarkIcon,
  LanguagesIcon,
  LeafIcon,
  MicroscopeIcon,
  PaletteIcon,
  ScaleIcon,
  ScrollIcon,
  WrenchIcon,
} from "@mdevs/icons";
import type { ComponentType } from "react";

type Icone = ComponentType<{ className?: string }>;

const PAR_MATIERE: Record<string, Icone> = {
  allemand: LanguagesIcon,
  anglais: LanguagesIcon,
  arabe: LanguagesIcon,
  arts: PaletteIcon,
  chinois: LanguagesIcon,
  coreen: LanguagesIcon,
  "enseignement-scientifique": MicroscopeIcon,
  espagnol: LanguagesIcon,
  francais: BookOpenIcon,
  grec: LanguagesIcon,
  hebreu: LanguagesIcon,
  hggsp: GlobeIcon,
  "histoire-geographie": LandmarkIcon,
  hlp: DramaIcon,
  italien: LanguagesIcon,
  japonais: LanguagesIcon,
  latin: LanguagesIcon,
  mathematiques: CalculatorIcon,
  nsi: CpuIcon,
  philosophie: ScrollIcon,
  "physique-chimie": AtomIcon,
  portugais: LanguagesIcon,
  russe: LanguagesIcon,
  "sciences-et-technologie": FlaskConicalIcon,
  ses: ScaleIcon,
  snt: WrenchIcon,
  svt: LeafIcon,
  technologie: WrenchIcon,
  turc: LanguagesIcon,
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
      className="inline-flex"
      style={{ color: `var(--q-subject-${id}, var(--q-level))` }}
    >
      <Icone aria-hidden className={className ?? "size-4"} />
    </span>
  );
}
