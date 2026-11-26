/**
 * Contenu d'assistance local et typé.
 *
 * Le support reste utile même si la recherche globale ou un service externe
 * est momentanément indisponible. Les liens pointent vers les pages déjà
 * publiées du site ; aucun contenu n'est chargé depuis le navigateur.
 */

export const SUPPORT_CONTENT_CATEGORIES = [
  {
    description: "Connexion, sessions et compte mAI",
    id: "account",
    label: "Compte & accès",
  },
  {
    description: "Modèles cloud, Ollama, quotas et inférence",
    id: "models",
    label: "Modèles & quotas",
  },
  {
    description: "Vibe, Web, Pulse, CLI et Coder",
    id: "apps",
    label: "Applications",
  },
  {
    description: "Fichiers Z1 et limites de transfert",
    id: "storage",
    label: "Stockage & pièces jointes",
  },
  {
    description: "Diagnostic, statut et signalement",
    id: "incident",
    label: "Incident & dépannage",
  },
] as const;

export type SupportContentCategoryId =
  (typeof SUPPORT_CONTENT_CATEGORIES)[number]["id"];

export type SupportContentLink = {
  label: string;
  href: string;
  external?: boolean;
};

export interface SupportFaq {
  answer: string;
  category: SupportContentCategoryId;
  id: string;
  keywords: readonly string[];
  link?: SupportContentLink;
  question: string;
}

export interface SupportGuide {
  category: SupportContentCategoryId;
  description: string;
  href: string;
  id: string;
  keywords: readonly string[];
  readTime: string;
  title: string;
}

export const SUPPORT_FAQS = [
  {
    answer:
      "Pour protéger votre compte, une session inactive peut être invalidée. Reconnectez-vous puis rouvrez votre ticket : l'historique reste attaché à votre compte.",
    category: "account",
    id: "session-expired",
    keywords: ["session", "connexion", "expiration", "login"],
    link: { external: false, href: "/account", label: "Ouvrir mon compte" },
    question: "Pourquoi ma session expire-t-elle ?",
  },
  {
    answer:
      "Un quota atteint (tokens mAI, audio ou images quotidiennes) limite temporairement les générations jusqu'à la prochaine réinitialisation automatique. Vous pouvez consulter l'ensemble de vos compteurs et réinitialisations disponibles depuis votre espace compte.",
    category: "models",
    id: "quota",
    keywords: ["quota", "limite", "débit", "tokens", "images"],
    link: {
      external: false,
      href: "/account#usage-mai",
      label: "Consulter mes quotas",
    },
    question: "Comment vérifier mes quotas d'utilisation ?",
  },
  {
    answer:
      "Oui. Les modèles mAI-1 / 1.2 / 1.5 peuvent être exécutés localement avec Ollama, tandis que les gammes mAI-2 et mAI-2.5 sont accessibles dans le cloud sur mAI Web et nos applications.",
    category: "models",
    id: "local-or-cloud",
    keywords: ["local", "cloud", "ollama", "modèle", "inférence"],
    link: { external: false, href: "/models", label: "Découvrir les modèles" },
    question: "Puis-je utiliser un modèle en local ou dans le cloud ?",
  },
  {
    answer:
      "Accédez à votre espace de discussion mAI Web pour utiliser nos modèles et agents autonomes, ou retrouvez toutes les applications bureau, navigateur et CLI sur la page Téléchargements.",
    category: "apps",
    id: "web-guide",
    keywords: ["web", "application", "démarrage", "guide"],
    link: {
      external: false,
      href: "/downloads",
      label: "Téléchargements & applications",
    },
    question: "Par où commencer avec mAI Web ?",
  },
  {
    answer:
      "Les captures JPG, PNG, WEBP ou GIF et les fichiers texte .txt ou .md sont acceptés. Chaque fichier fait au maximum 8 Mo et cinq fichiers sont autorisés à la création.",
    category: "storage",
    id: "attachment-z1",
    keywords: ["fichier", "pièce jointe", "z1", "image", "log", "limite"],
    link: { external: false, href: "/support/new", label: "Créer un ticket" },
    question: "Quels fichiers puis-je joindre à un ticket ?",
  },
  {
    answer:
      "La page de statut indique l'état global et, lorsqu'ils sont publiés, les composants concernés. Une indisponibilité peut aussi être suivie depuis la page publique Instatus.",
    category: "incident",
    id: "service-status",
    keywords: ["statut", "indisponible", "panne", "instatus", "service"],
    link: {
      external: true,
      href: "https://mai.instatus.com/",
      label: "Voir la page de statut",
    },
    question: "Comment savoir si un service est indisponible ?",
  },
  {
    answer:
      "Décrivez les étapes, le résultat attendu et le résultat obtenu. Ajoutez une capture ou un log expurgé, puis choisissez la priorité qui correspond à l'impact réel.",
    category: "incident",
    id: "report-bug",
    keywords: ["bug", "anomalie", "erreur", "reproduction", "incident"],
    link: {
      external: false,
      href: "/support/new?type=bug",
      label: "Signaler un incident",
    },
    question: "Comment signaler une anomalie reproductible ?",
  },
] as const satisfies readonly SupportFaq[];

export const SUPPORT_GUIDES = [
  {
    category: "models",
    description:
      "Comparer les modèles cloud mAI-2 / mAI-2.5 et les modèles locaux Ollama.",
    href: "/models",
    id: "models-catalog",
    keywords: ["modèles", "opal", "apex", "omni", "ollama"],
    readTime: "4 min",
    title: "Catalogue des modèles mAI",
  },
  {
    category: "models",
    description:
      "Suivre votre consommation hebdomadaire (mAI, Audio, Images et Cloud) et réinitialiser vos compteurs.",
    href: "/account",
    id: "account-quotas",
    keywords: ["quota", "limite", "compte", "réinitialisation"],
    readTime: "3 min",
    title: "Gérer ses quotas & forfaits",
  },
  {
    category: "apps",
    description:
      "Repérer les fonctions principales et organiser un premier espace de travail.",
    href: "/projects/vibe",
    id: "app-vibe",
    keywords: ["vibe", "application", "projet", "démarrage"],
    readTime: "6 min",
    title: "Premiers pas avec Vibe",
  },
  {
    category: "apps",
    description:
      "Découvrir les projets de l'écosystème mAI (Web, Pulse, CLI, Coder, Wakies).",
    href: "/projects",
    id: "apps-ecosystem",
    keywords: ["web", "pulse", "coder", "écosystème"],
    readTime: "5 min",
    title: "Découvrir les projets mAI",
  },
  {
    category: "apps",
    description:
      "Télécharger mAI CLI, Coder, les extensions et les modèles locaux.",
    href: "/downloads",
    id: "app-downloads",
    keywords: ["cli", "terminal", "installation", "téléchargement"],
    readTime: "4 min",
    title: "Installer nos applications & CLI",
  },
  {
    category: "models",
    description:
      "Suivre vos générations d'images quotidiennes et comparer les plafonds par forfait.",
    href: "/account#usage-images",
    id: "images",
    keywords: ["image", "génération", "visuel", "quota"],
    readTime: "3 min",
    title: "Quotas de génération d'images",
  },
  {
    category: "incident",
    description:
      "Consulter l'historique des dernières versions et améliorations publiées.",
    href: "/changelog",
    id: "changelog",
    keywords: ["changelog", "versions", "notes", "mises à jour"],
    readTime: "3 min",
    title: "Notes de version mAI",
  },
  {
    category: "incident",
    description:
      "Réunir les informations qui accélèrent la reproduction et la résolution.",
    href: "/support/new?type=bug",
    id: "bug-checklist",
    keywords: ["bug", "checklist", "diagnostic", "ticket"],
    readTime: "3 min",
    title: "Checklist avant de signaler un bug",
  },
] as const satisfies readonly SupportGuide[];

export const SUPPORT_CONTENT_CATEGORY_BY_ID = Object.fromEntries(
  SUPPORT_CONTENT_CATEGORIES.map((category) => [category.id, category])
) as Record<
  SupportContentCategoryId,
  (typeof SUPPORT_CONTENT_CATEGORIES)[number]
>;
