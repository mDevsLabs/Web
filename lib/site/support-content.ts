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
    description: "Clés, requêtes, quotas et inférence",
    id: "api",
    label: "API & modèles",
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
      "Les clés sont gérées depuis votre espace développeur. Si une clé est compromise, révoquez-la immédiatement puis créez-en une nouvelle avant de reprendre vos appels.",
    category: "api",
    id: "api-key",
    keywords: ["clé", "api", "token", "révoquer", "secret"],
    link: { external: false, href: "/account/keys", label: "Gérer mes clés" },
    question: "Où créer ou révoquer une clé d'API ?",
  },
  {
    answer:
      "Un 429 indique généralement une limite de débit ou un quota atteint. Attendez la fenêtre indiquée dans la réponse, puis vérifiez votre consommation dans le compte avant de réessayer.",
    category: "api",
    id: "quota",
    keywords: ["429", "quota", "limite", "débit", "rate limit"],
    link: {
      external: false,
      href: "/docs?doc=6-erreurs-et-limites",
      label: "Lire le guide des quotas",
    },
    question: "Comment vérifier un quota ou une erreur 429 ?",
  },
  {
    answer:
      "Oui. Les modèles mAI peuvent être exécutés localement avec Ollama ou appelés depuis l'API cloud. Choisissez le mode adapté à votre matériel et à vos exigences de confidentialité.",
    category: "api",
    id: "local-or-cloud",
    keywords: ["local", "cloud", "ollama", "modèle", "inférence"],
    link: { external: false, href: "/models", label: "Découvrir les modèles" },
    question: "Puis-je utiliser un modèle en local ou dans le cloud ?",
  },
  {
    answer:
      "Commencez par le guide de l'application pour découvrir les espaces de travail, puis consultez les exemples d'intégration avant de brancher vos propres données.",
    category: "apps",
    id: "web-guide",
    keywords: ["web", "application", "démarrage", "guide"],
    link: {
      external: false,
      href: "/docs?doc=app-web",
      label: "Guide de l'application Web",
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
    category: "api",
    description:
      "Comprendre les endpoints, les formats et le parcours d'une première requête.",
    href: "/docs?doc=1-introduction",
    id: "api-introduction",
    keywords: ["api", "introduction", "endpoint", "requête"],
    readTime: "5 min",
    title: "Premiers pas avec l'API",
  },
  {
    category: "api",
    description:
      "Utiliser une clé de manière sûre et diagnostiquer les erreurs d'accès.",
    href: "/docs?doc=2-authentification",
    id: "api-auth",
    keywords: ["api", "authentification", "clé", "token"],
    readTime: "7 min",
    title: "Authentification de l'API",
  },
  {
    category: "api",
    description:
      "Lire les réponses de limite et planifier un appel sans interruption.",
    href: "/docs?doc=6-erreurs-et-limites",
    id: "api-quotas",
    keywords: ["quota", "limite", "429", "débit"],
    readTime: "4 min",
    title: "Quotas et limites d'appel",
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
      "Un guide rapide des parcours et des intégrations disponibles dans Web.",
    href: "/docs?doc=app-web",
    id: "app-web",
    keywords: ["web", "application", "intégration"],
    readTime: "6 min",
    title: "Utiliser mAI Web",
  },
  {
    category: "apps",
    description:
      "Découvrir les vues et les indicateurs de suivi disponibles dans Pulse.",
    href: "/docs?doc=app-pulse",
    id: "app-pulse",
    keywords: ["pulse", "application", "tableau de bord"],
    readTime: "5 min",
    title: "Utiliser mAI Pulse",
  },
  {
    category: "apps",
    description:
      "Installer l'outil en ligne de commande et vérifier une première exécution.",
    href: "/docs?doc=app-cli",
    id: "app-cli",
    keywords: ["cli", "terminal", "installation", "ligne de commande"],
    readTime: "8 min",
    title: "Installer et utiliser la CLI",
  },
  {
    category: "apps",
    description:
      "Relier votre environnement de développement et préparer vos premiers changements.",
    href: "/docs?doc=app-coder",
    id: "app-coder",
    keywords: ["coder", "code", "configuration", "développement"],
    readTime: "7 min",
    title: "Configuration de Coder",
  },
  {
    category: "api",
    description:
      "Paramétrer une génération d'image et lire les erreurs de quota ou de format.",
    href: "/docs?doc=image-generation",
    id: "images",
    keywords: ["image", "génération", "visuel", "modèle"],
    readTime: "6 min",
    title: "Générer des images",
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
