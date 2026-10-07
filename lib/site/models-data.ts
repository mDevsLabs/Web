export type ModelInfo = {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  parameters?: string;
  vision: boolean;
  context: string;
  releaseDate: string;
  bannerImage: string;
  squareImage: string;
  /**
   * Identifiant YouTube de la vidéo de présentation du modèle. La lecture passe
   * par un iframe d'embed YouTube : aucun fichier vidéo n'est stocké ni servi
   * depuis `public/` (les fichiers locaux pesaient plus de 140 Mo par modèle et
   * alourdissaient à la fois le dépôt et le chargement de la page).
   */
  introVideoId?: string;
  /** Tag Ollama du modèle local (`ollama run …`). */
  ollamaTag?: string;
  /**
   * Dépôt Hugging Face correspondant. Distinct d'`ollamaTag` : les deux registries
   * ne publient pas les mêmes dépôts, et la commande `hf download` doit viser le
   * bon. Par défaut, le dépôt Ollama.
   */
  huggingFaceTag?: string;
  /** Modèle servi dans le cloud via l'API mAI (pas d'exécution locale). */
  cloud?: boolean;
  /** Alias d'appel de l'API mAI (ex: "mai-2"). */
  apiAlias?: string;
  /** Modèle fournisseur sous-jacent (routage API, non affiché). */
  backingModel?: string;
  /** Sortie maximale de tokens (modèles cloud). */
  maxOutput?: string;
  readmeContent?: string;
};

export const modelsData: Omit<ModelInfo, "readmeContent">[] = [
  // ─── Série mAI-2 (génération cloud) ────────────────────────────────────────
  {
    apiAlias: "mai-2",
    backingModel: "deepseek/deepseek-v4.1-flash",
    badge: "Cloud • Texte + images • 1M",
    bannerImage: "/site/mai-2/mai-2-169.PNG",
    cloud: true,
    context: "1M",
    id: "mai-2",
    introVideoId: "C6rJKVFhXOY",
    maxOutput: "384K",
    name: "mAI-2",
    releaseDate: "25/10/2026",
    squareImage: "/site/mai-2/icon.PNG",
    tagline: "Our flagship model, for the best price.",
    vision: true,
  },
  {
    apiAlias: "mai-2-mini",
    backingModel: "minimax/minimax-m3",
    badge: "Cloud • Texte + images • 1M",
    bannerImage: "/site/mai-2/mai-2-169.PNG",
    cloud: true,
    context: "1M",
    id: "mai-2-mini",
    introVideoId: "DTeAjTqBKJc",
    maxOutput: "128K",
    name: "mAI-2-Mini",
    releaseDate: "25/10/2026",
    squareImage: "/site/mai-2/mai-galaxy.PNG",
    tagline: "Our balanced model, for increased price.",
    vision: true,
  },
  // ─── Série mAI-1.5 (nouvelle génération 1.5) ───────────────────────────────
  {
    badge: "4B • Vision • Tools • 256K",
    bannerImage: "/site/mai-1.5-light/mAI-1.5-Light.png",
    context: "256K",
    id: "mai-1.5-light",
    name: "mAI-1.5-Light",
    ollamaTag: "mDevsLabs/mAI-1.5-Light",
    parameters: "4B",
    releaseDate: "28/08/2026",
    squareImage: "/site/mai-1.5-light/mAI-1.5-Light.png",
    tagline:
      "Assistant IA local ultra-rapide et multimodal. Vision intégrée, thinking & tools (4B).",
    vision: true,
  },
  {
    badge: "9B • Vision • Tools • 256K",
    bannerImage: "/site/mai-1.5-apex/mAI-1.5-Apex.png",
    context: "256K",
    id: "mai-1.5-apex",
    name: "mAI-1.5-Apex",
    ollamaTag: "mDevsLabs/mAI-1.5-Apex",
    parameters: "9B",
    releaseDate: "28/08/2026",
    squareImage: "/site/mai-1.5-apex/mAI-1.5-Apex.png",
    tagline:
      "Le haut de gamme de la famille mAI. Puissance maximale, vision multimodale, thinking & tools (9B).",
    vision: true,
  },
  {
    badge: "27B • Vision • Tools • 256K",
    bannerImage: "/site/mai-1.5-opal/mAI-1.5-Opal.png",
    context: "256K",
    id: "mai-1.5-opal",
    name: "mAI-1.5-Opal",
    ollamaTag: "mDevsLabs/mAI-1.5-Opal",
    parameters: "27B",
    releaseDate: "28/08/2026",
    squareImage: "/site/mai-1.5-opal/mAI-1.5-Opal.png",
    tagline:
      "L'équilibre parfait entre vitesse et intelligence élevée. Multimodal 27B avec vision, thinking & tools.",
    vision: true,
  },
  // ─── Série mAI-1.2 (génération 1.2) ───────────────────────────────────
  {
    badge: "3B • Vision • 256K",
    bannerImage: "/site/mai-1.2-light/mai-1.2-light.png",
    context: "256K",
    id: "mai-1.2-light",
    name: "mAI-1.2-Light",
    ollamaTag: "mDevsLabs/mAI-1.2-Light",
    parameters: "3B",
    releaseDate: "22/07/2026",
    squareImage: "/site/mai-1.2-light/mai-1.2-light.png",
    tagline:
      "Assistant IA local ultra-rapide et multimodal. Légèreté maximale, vision intégrée et productivité au quotidien.",
    vision: true,
  },
  {
    badge: "9B • Vision • 256K",
    bannerImage: "/site/mai-1.2-apex/mai-1.2-apex.png",
    context: "256K",
    id: "mai-1.2-apex",
    name: "mAI-1.2-Apex",
    ollamaTag: "mDevsLabs/mAI-1.2-Apex",
    parameters: "9B",
    releaseDate: "22/07/2026",
    squareImage: "/site/mai-1.2-apex/mai-1.2-apex.png",
    tagline:
      "Le top tier de la famille mAI. Performances maximales, vision multimodale et raisonnement avancé.",
    vision: true,
  },
  {
    badge: "33B • 256K",
    bannerImage: "/site/mai-1.2-opal/mai-1.2-opal.png",
    context: "256K",
    id: "mai-1.2-opal",
    name: "mAI-1.2-Opal",
    ollamaTag: "mDevsLabs/mAI-1.2-Opal",
    parameters: "33B",
    releaseDate: "22/07/2026",
    squareImage: "/site/mai-1.2-opal/mai-1.2-opal.png",
    tagline:
      "Le sweet spot parfait entre rapidité et intelligence. Multimodal, équilibré et fluide pour toutes vos tâches.",
    vision: false,
  },
  // ─── Série mAI-1 (première génération) ────────────────────────────────────
  {
    badge: "12B • Multimodal • 256K",
    bannerImage: "/site/mai-1/mai-1.png",
    context: "256K",
    id: "mai-1",
    name: "mAI-1",
    ollamaTag: "mDevsLabs/mAI-1",
    parameters: "12B",
    releaseDate: "11/07/2026",
    squareImage: "/site/mai-1/mai-1-carre.png",
    tagline:
      "Assistant IA local multimodal puissant de 12B paramètres pour le raisonnement, le code et l'analyse d'images.",
    vision: true,
  },
  {
    badge: "3B • Ultra Rapide • 128K",
    bannerImage: "/site/mai-1-light/mai-1-light.png",
    context: "128K",
    id: "mai-1-light",
    name: "mAI-1-Light",
    ollamaTag: "mDevsLabs/mAI-1-Light",
    parameters: "3B",
    releaseDate: "11/07/2026",
    squareImage: "/site/mai-1-light/mai-1-light-carre.png",
    tagline:
      "Assistant IA local ultraléger et rapide de 3B paramètres, optimisé pour les machines modestes.",
    vision: false,
  },
];
