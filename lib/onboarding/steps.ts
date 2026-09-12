import {
  BadgeCheckIcon,
  CloudIcon,
  FolderKanbanIcon,
  GaugeIcon,
  ImageIcon,
  MessagesSquareIcon,
  PenSquareIcon,
  SettingsIcon,
  SparklesIcon,
  Volume2Icon,
} from "lucide-react";
import type { ComponentType } from "react";

import { TIER_KEYS, TIER_LIMITS } from "@/lib/plans/tier-limits";

export type OnboardingStep = {
  id: string;
  title: string;
  content: string;
  bullets?: string[];
  route?: string;
  selector?: string;
  icon: ComponentType<{ className?: string }>;
};

function formatMillions(tokens: number): string {
  const millions = tokens / 1_000_000;
  return `${millionText(millions)} M`;
}

function millionText(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : value.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
}

function formatGiB(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024 * 1024))} Gio`;
}

// Résumé d'un forfait, dérivé du SSOT des quotas (lib/plans/tier-limits.ts)
export const PLAN_SUMMARY_BULLETS: string[] = TIER_KEYS.map((key) => {
  const limits = TIER_LIMITS[key];
  return `${limits.label} — ${formatMillions(limits.chatWeeklyTokens)} tokens chat/sem., ${formatMillions(limits.speechWeeklyTokens)} speech/sem., ${limits.imagesPerDay} images/jour, ${formatGiB(limits.storageBytes)} de stockage`;
});

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    content:
      "Félicitations, votre compte est confirmé ! Parcourons ensemble les fonctionnalités principales. Ce guide vous accompagne pas à pas.",
    icon: SparklesIcon,
    id: "welcome",
    title: "Bienvenue sur mAI Web",
  },
  {
    content:
      "Cliquez ici pour ouvrir une nouvelle conversation à tout moment. Votre historique est ensuite conservé dans la barre latérale.",
    icon: PenSquareIcon,
    id: "new-chat",
    route: "/",
    selector: '[data-onboarding="new-chat"]',
    title: "Démarrez une discussion",
  },
  {
    content:
      "Tapez votre message ici, ajoutez des fichiers ou utilisez les options (modèles, pièces jointes…). Appuyez sur Entrée pour lancer la réponse.",
    icon: MessagesSquareIcon,
    id: "chat-input",
    route: "/",
    selector: '[data-onboarding="chat-input"]',
    title: "Posez votre question à l'IA",
  },
  {
    bullets: [
      "Chat : un quota hebdomadaire de tokens mAI, affiché dans le bandeau au-dessus de la zone de saisie.",
      "Speech : la synthèse vocale consomme un quota séparé (visible dans Images → onglet Audio et dans vos Paramètres).",
      "Images : un quota journalier par forfait, réinitialisé chaque minuit UTC.",
    ],
    content:
      "Votre forfait inclut des quotas hebdomadaires et journaliers. Suivez votre consommation ici : le menu de votre compte donne accès au détail (« Consommation & Quotas »).",
    icon: GaugeIcon,
    id: "quota",
    route: "/",
    selector: '[data-onboarding="user-nav"]',
    title: "Forfait et quotas",
  },
  {
    content:
      "Retrouvez ici tous vos fichiers, documents et ressources générés. Le stockage centralise vos contenus pour les réutiliser dans vos discussions.",
    icon: CloudIcon,
    id: "library",
    route: "/library",
    selector: '[data-onboarding="nav-library"]',
    title: "Votre stockage cloud",
  },
  {
    content:
      "Créez des projets pour regrouper vos conversations par thématique. Idéal pour structurer vos travaux et y accéder rapidement.",
    icon: FolderKanbanIcon,
    id: "projects",
    route: "/projects",
    selector: '[data-onboarding="nav-projects"]',
    title: "Organisez avec les Projets",
  },
  {
    content:
      "Accédez à la génération d'images par intelligence artificielle. Décrivez ce que vous voulez créer et laissez l'IA le visualiser.",
    icon: ImageIcon,
    id: "images",
    route: "/images",
    selector: '[data-onboarding="nav-images"]',
    title: "Générez des images",
  },
  {
    content:
      "Transformez du texte en audio ou exploitez les outils vocaux. Parfait pour générer des lectures ou des contenus sonores.",
    icon: Volume2Icon,
    id: "audio",
    route: "/audio",
    selector: '[data-onboarding="nav-audio"]',
    title: "Créez du contenu audio",
  },
  {
    bullets: PLAN_SUMMARY_BULLETS,
    content:
      "Envie de plus de tokens chat, de synthèse vocale ou d'images ? Quatre forfaits sont disponibles. Chaque forfait débloque aussi les Agents, Skills et MCP connecteurs à partir de Plus.",
    icon: BadgeCheckIcon,
    id: "plans",
    route: "/settings",
    title: "Free, Plus, Pro et Max",
  },
  {
    content:
      "Gérez votre compte, vos préférences, votre abonnement et la confidentialité. Tout se configure depuis cette page.",
    icon: SettingsIcon,
    id: "settings",
    route: "/settings",
    selector: '[data-onboarding="nav-settings"]',
    title: "Personnalisez vos paramètres",
  },
  {
    content:
      "Voilà, vous connaissez les bases de mAI Web. Amusez-vous bien, et n'hésitez pas à explorer davantage par vous-même ! Astuce : vous pouvez revoir ce tutoriel depuis Paramètres → votre compte → « Revoir le tutoriel ».",
    icon: SparklesIcon,
    id: "finish",
    title: "Vous êtes prêt !",
  },
];
