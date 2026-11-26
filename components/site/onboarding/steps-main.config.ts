"use client";

import {
  GaugeIcon as Gauge,
  LayersIcon as Layers,
  RocketIcon as Rocket,
  SparklesIcon as Sparkles,
} from "@mdevs/icons";
import type { StepDef } from "./types";

export const MAIN_STEPS: StepDef[] = [
  {
    description:
      "Ton compte est prêt. En 90 secondes, découvre les modèles, tes quotas et l'écosystème mAI.",
    icon: Sparkles,
    id: "welcome",
    title: "Bienvenue",
    titleAccent: "sur mAI",
  },
  {
    description:
      "Le catalogue /models rassemble nos modèles cloud mAI-2 / mAI-2.5 et nos modèles open-weights exécutables en local via Ollama.",
    icon: Layers,
    id: "models-hub",
    title: "Catalogue Modèles",
    titleAccent: "Cloud & Local",
  },
  {
    description:
      "Tokens hebdomadaires mAI, audio TTS, images par jour et stockage Cloud — tout est détaillé dans /account. Chaque forfait supérieur augmente tes limites.",
    icon: Gauge,
    id: "quotas",
    title: "Tes quotas",
    titleAccent: "en clair",
  },
  {
    ctaAction: "goAccount",
    ctaLabel: "Ouvrir mon compte",
    description:
      "Consulte ton espace compte ou explore le catalogue des modèles. Le support et les applications sont accessibles à tout moment.",
    icon: Rocket,
    id: "finish",
    title: "Prêt à démarrer",
    titleAccent: "sur mAI.",
  },
];
