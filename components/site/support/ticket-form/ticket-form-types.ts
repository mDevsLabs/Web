import type { SupportPriority } from "@/components/site/support/support-config";

export const PROJECT_OPTIONS = [
  "Vibe",
  "Web",
  "Pulse",
  "CLI",
  "Coder",
  "API & Modèles IA",
  "Autre",
] as const;

export const CATEGORY_OPTIONS = [
  "Bug / Anomalie technique",
  "Authentification & Sessions",
  "Modèles d'IA & Inférence",
  "Clés d'API & Quotas",
  "Facturation & Forfaits",
  "Stockage Cloud (Z1)",
  "Génération d'images",
  "Synthèse & Audio",
  "Suggestion / Évolution",
  "Autre demande",
] as const;

export const WIZARD_STEPS = [
  {
    description: "Pour router votre demande vers la bonne équipe.",
    title: "Catégorie & projet",
  },
  {
    description: "Donnez un titre et un contexte facile à reproduire.",
    title: "Votre problème",
  },
  {
    description: "Choisissez l'impact et joignez les éléments utiles.",
    title: "Priorité & pièces",
  },
  {
    description: "Vérifiez les informations avant l'envoi.",
    title: "Revue",
  },
] as const;

export const BUG_CATEGORY = "Bug / Anomalie technique";
export const DEFAULT_CATEGORY = "Modèles d'IA & Inférence";

export type TicketStep = 0 | 1 | 2 | 3;

export type TicketEnvInfo = {
  userAgent: string;
  platform: string;
  screenResolution: string;
};

export type TicketPriority = SupportPriority;
