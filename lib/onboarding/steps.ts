import type { ComponentType } from "react";
import {
  FolderKanbanIcon,
  ImageIcon,
  MessagesSquareIcon,
  PenSquareIcon,
  SettingsIcon,
  SparklesIcon,
  Volume2Icon,
  CloudIcon,
} from "lucide-react";

export type OnboardingStep = {
  id: string;
  title: string;
  content: string;
  route?: string;
  selector?: string;
  icon: ComponentType<{ className?: string }>;
};

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Bienvenue sur mAI Web",
    content:
      "Félicitations, votre compte est confirmé ! Parcourons ensemble les fonctionnalités principales. Ce guide vous accompagne pas à pas.",
    icon: SparklesIcon,
  },
  {
    id: "new-chat",
    title: "Démarrez une discussion",
    content:
      "Cliquez ici pour ouvrir une nouvelle conversation à tout moment. Votre historique est ensuite conservé dans la barre latérale.",
    route: "/",
    selector: '[data-onboarding="new-chat"]',
    icon: PenSquareIcon,
  },
  {
    id: "chat-input",
    title: "Posez votre question à l'IA",
    content:
      "Tapez votre message ici, ajoutez des fichiers ou utilisez les options (modèles, pièces jointes…). Appuyez sur Entrée pour lancer la réponse.",
    route: "/",
    selector: '[data-onboarding="chat-input"]',
    icon: MessagesSquareIcon,
  },
  {
    id: "library",
    title: "Votre stockage cloud",
    content:
      "Retrouvez ici tous vos fichiers, documents et ressources générés. Le stockage centralise vos contenus pour les réutiliser dans vos discussions.",
    route: "/library",
    selector: '[data-onboarding="nav-library"]',
    icon: CloudIcon,
  },
  {
    id: "projects",
    title: "Organisez avec les Projets",
    content:
      "Créez des projets pour regrouper vos conversations par thématique. Idéal pour structurer vos travaux et y accéder rapidement.",
    route: "/projects",
    selector: '[data-onboarding="nav-projects"]',
    icon: FolderKanbanIcon,
  },
  {
    id: "images",
    title: "Générez des images",
    content:
      "Accédez à la génération d'images par intelligence artificielle. Décrivez ce que vous voulez créer et laissez l'IA le visualiser.",
    route: "/images",
    selector: '[data-onboarding="nav-images"]',
    icon: ImageIcon,
  },
  {
    id: "audio",
    title: "Créez du contenu audio",
    content:
      "Transformez du texte en audio ou exploitez les outils vocaux. Parfait pour générer des lectures ou des contenus sonores.",
    route: "/audio",
    selector: '[data-onboarding="nav-audio"]',
    icon: Volume2Icon,
  },
  {
    id: "settings",
    title: "Personnalisez vos paramètres",
    content:
      "Gérez votre compte, vos préférences, votre abonnement et la confidentialité. Tout se configure depuis cette page.",
    route: "/settings",
    selector: '[data-onboarding="nav-settings"]',
    icon: SettingsIcon,
  },
  {
    id: "finish",
    title: "Vous êtes prêt !",
    content:
      "Voilà, vous connaissez les bases de mAI Web. Amusez-vous bien, et n'hésitez pas à explorer davantage par vous-même !",
    icon: SparklesIcon,
  },
];
