import {
  ImageIcon,
  MonitorIcon,
  RectangleVerticalIcon,
  SmartphoneIcon,
  SquareIcon,
} from "@mdevs/icons";
import type React from "react";

export interface ImageModel {
  created?: number;
  description: string;
  features?: string[];
  id: string;
  name: string;
}

export interface GeneratedImage {
  created_at: string;
  height: number;
  id: string;
  image_url: string;
  model: string;
  negative_prompt?: string;
  pinned?: boolean;
  prompt: string;
  title?: string | null;
  user_id: string;
  width: number;
}

export const ASPECT_RATIOS: {
  id: string;
  label: string;
  width: number;
  height: number;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    height: 1024,
    icon: SquareIcon,
    id: "1:1",
    label: "1:1 Carré",
    width: 1024,
  },
  {
    height: 768,
    icon: MonitorIcon,
    id: "16:9",
    label: "16:9 Paysage",
    width: 1344,
  },
  {
    height: 1344,
    icon: SmartphoneIcon,
    id: "9:16",
    label: "9:16 Story / Mobile",
    width: 768,
  },
  {
    height: 864,
    icon: ImageIcon,
    id: "4:3",
    label: "4:3 Standard",
    width: 1152,
  },
  {
    height: 1152,
    icon: RectangleVerticalIcon,
    id: "3:4",
    label: "3:4 Portrait",
    width: 864,
  },
];

export const PROMPT_SUGGESTIONS = [
  "Un paysage cyber-futuriste néon sous une pluie légère au coucher de soleil, ultra détaillé, 8k, photoréaliste",
  "Portrait artistique d'un renard astronaute explorant une planète cristalline luminescente, rendu cinématique octane",
  "Design d'intérieur scandinave minimaliste moderne avec grandes baies vitrées et vue sur les fjords enneigés",
  "Illustration vectorielle épurée d'une fusée spatiale décollant vers la lune avec des couleurs pastel douces",
  "Concept art d'une ville flottante dans les nuages avec des cascades volantes et des aéronefs à vapeur",
];

export interface ImageWorkspaceProps {
  modeSwitcher?: React.ReactNode;
}
