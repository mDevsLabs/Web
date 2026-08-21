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
