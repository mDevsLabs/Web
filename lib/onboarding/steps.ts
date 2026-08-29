import {
  CloudIcon,
  FolderKanbanIcon,
  ImageIcon,
  MessagesSquareIcon,
  PenSquareIcon,
  SettingsIcon,
  SparklesIcon,
  Volume2Icon,
} from "lucide-react";
import type { ComponentType } from "react";

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
      "Voilà, vous connaissez les bases de mAI Web. Amusez-vous bien, et n'hésitez pas à explorer davantage par vous-même !",
    icon: SparklesIcon,
    id: "finish",
    title: "Vous êtes prêt !",
  },
];
