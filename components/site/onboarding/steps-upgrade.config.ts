"use client";

import {
  GaugeIcon as Gauge,
  RocketIcon as Rocket,
  SparklesIcon as Sparkles,
} from "@mdevs/icons";
import type { StepDef } from "./types";

export const UPGRADE_STEPS: StepDef[] = [
  {
    description:
      "Ton nouveau forfait est actif. Découvre l'ampleur de tes nouvelles limites.",
    icon: Sparkles,
    id: "unlock",
    title: "Forfait débloqué",
    titleAccent: "félicitations",
  },
  {
    description:
      "Tokens mAI, synthèse audio, images et stockage Cloud viennent de bondir avec votre nouveau forfait.",
    icon: Gauge,
    id: "quotas-up",
    title: "Nouvelles limites",
    titleAccent: "× plus de puissance",
  },
  {
    ctaAction: "goModels",
    ctaLabel: "Explorer les modèles",
    description:
      "Parcours le catalogue des modèles ou retrouve tes nouveaux plafonds sur ton espace compte.",
    icon: Rocket,
    id: "next",
    title: "À toi de jouer",
    titleAccent: "explore",
  },
];
