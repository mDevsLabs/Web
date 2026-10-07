"use client";

import { Gauge, Rocket, Sparkles } from "lucide-react";
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
      "Tokens, requêtes, images et stockage Cloud viennent de bondir. Et les modèles payants :free → premium sont maintenant accessibles.",
    icon: Gauge,
    id: "quotas-up",
    title: "Nouvelles limites",
    titleAccent: "× plus de puissance",
  },
  {
    ctaAction: "goModels",
    ctaLabel: "Explorer les modèles",
    description:
      "Parcours le hub modèles ou crée une clé dédiée à ton nouveau forfait.",
    icon: Rocket,
    id: "next",
    title: "À toi de jouer",
    titleAccent: "explore",
  },
];
