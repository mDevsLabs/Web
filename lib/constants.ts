import {
  getTierImageDailyLimit as getTierImageDailyLimitFromPlan,
  getTierSpeechWeeklyLimit,
} from "@/lib/plans/tier-limits";

export const isProductionEnvironment = process.env.NODE_ENV === "production";
export const isDevelopmentEnvironment = process.env.NODE_ENV === "development";
export const isTestEnvironment = Boolean(
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
    process.env.PLAYWRIGHT ||
    process.env.CI_PLAYWRIGHT
);

export const MAI_SESSION_COOKIE = "mai_session_token";
export const MAI_API_URL =
  process.env.NEXT_PUBLIC_MAI_API_URL || "https://mai.val.run";
export const MAI_UPGRADE_URL = "https://mai-devs.vercel.app";

// Handoff Cloud -> chat : pièce jointe en attente (sessionStorage)
export const MAI_PENDING_ATTACHMENT_KEY = "mai-pending-attachment";

// Plafond de caractères d'une entrée de mémoire — aligné sur la contrainte
// CHECK `char_length(content) <= 2000` de la table UserMemory (migration 0010).
// Partagé client/serveur (lib/db/queries est server-only), d'où sa place ici.
export const MEMORY_CONTENT_MAX_LENGTH = 2000;

// ─────────────────────────────────────────────
// App version & legal — SSOT: version from package.json ("0.5.5")
// ─────────────────────────────────────────────
export const APP_VERSION = "0.5.5";
export const APP_NAME = "mAI";
export const APP_COPYRIGHT = `© ${new Date().getFullYear()} mAI — Tous droits réservés`;
export const APP_SUPPORT_URL = "https://mai-devs.vercel.app/support";
export const LEGAL_LINKS = [
  { href: "https://mai-devs.vercel.app/legal", label: "Mentions légales" },
  { href: "https://mai-devs.vercel.app/privacy", label: "Confidentialité" },
  { href: "https://mai-devs.vercel.app/terms", label: "CGU" },
] as const;
export const TERMS_URL = LEGAL_LINKS[2].href;

// Limites quotidiennes de génération d'images par tier.
// Source unique de vérité : lib/plans/tier-limits.ts (miroir du backend Val Town).
export function getTierImageDailyLimit(tier?: string | null): number {
  return getTierImageDailyLimitFromPlan(tier);
}

// Limites hebdomadaires de tokens Speech par tier.
// Source unique de vérité : lib/plans/tier-limits.ts (miroir du backend Val Town).
export function getTierSpeechLimit(tier?: string | null): number {
  return getTierSpeechWeeklyLimit(tier);
}

export const suggestions = [
  "Analyse ce concept et explique-le avec des analogies simples et concrètes",
  "Rédige un e-mail professionnel pour relancer un client de manière courtoise",
  "Aide-moi à structurer et découper un projet complexe en étapes claires",
  "Explique-moi les principes fondamentaux de l'architecture logicielle moderne",
  "Propose-moi un plan détaillé pour rédiger un rapport stratégique convaincant",
  "Optimise cette fonction pour améliorer ses performances et sa lisibilité",
  "Génère un modèle de contrat de prestation de services adapté au freelancing",
  "Quelles sont les meilleures pratiques pour sécuriser une application web en production ?",
  "Aide-moi à préparer un entretien technique avec des questions ciblées",
  "Rédige une synthèse claire et concise à partir de plusieurs sources d'information",
  "Comment mettre en place une veille technologique efficace et automatisée ?",
  "Propose une stratégie de contenu hebdomadaire pour accroître ma visibilité",
  "Conçois une structure de base de données relationnelle pour une plateforme e-commerce",
  "Rédige une introduction percutante pour une présentation commerciale",
  "Explique la différence entre l'apprentissage supervisé et non supervisé",
  "Aide-moi à identifier les goulots d'étranglement dans un workflow d'équipe",
  "Propose-moi un plan d'action pour améliorer la gestion de mes priorités au quotidien",
  "Écris un script d'automatisation pour le traitement et le tri de fichiers",
  "Quelles sont les méthodes éprouvées pour concevoir une API REST robuste ?",
  "Rédige une note de cadrage pour le lancement d'une nouvelle fonctionnalité logicielle",
  "Comment élaborer un pitch de projet percutant en moins de deux minutes ?",
  "Explique les concepts clés de TypeScript comme les types génériques et conditionnels",
  "Aide-moi à synthétiser un document volumineux en points clés actionnables",
  "Quelles stratégies adopter pour réduire le temps de chargement d'un site web ?",
];
