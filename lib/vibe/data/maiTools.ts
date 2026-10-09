/**
 * Liste statique de repli des outils mAI, régénérée depuis lib/tools/index.json
 * (23 outils). Source de vérité = GET /v1/mai/tools via useAvailableMAITools ;
 * cette liste sert d'offline/fallback et de référence typée.
 */
export interface MAITool {
  category: "creation" | "search" | "analysis" | "account";
  description: string;
  iconName: string;
  id: string;
  mentionTag: string;
  name: string;
  samplePrompt: string;
  slashCommand: string;
}

export const FALLBACK_MAI_TOOLS: MAITool[] = [
  {
    category: "creation",
    description:
      "Génère une image IA artistique en haute résolution (ratios 1:1, 16:9, 4:5, 9:16).",
    iconName: "Image",
    id: "generate_vibe_image",
    mentionTag: "@image",
    name: "Génération d'Image",
    samplePrompt:
      "/image une ville futuriste sous la pluie au coucher de soleil",
    slashCommand: "/image",
  },
  {
    category: "search",
    description:
      "Recherche sur le web des informations vérifiées et actualités récentes.",
    iconName: "Globe",
    id: "search_web",
    mentionTag: "@search",
    name: "Recherche Web en Direct",
    samplePrompt:
      "/search dernières découvertes en intelligence artificielle 2026",
    slashCommand: "/search",
  },
  {
    category: "analysis",
    description:
      "Analyse et vérifie la véracité d'une information avec sources et indice de confiance.",
    iconName: "ShieldCheck",
    id: "fact_check",
    mentionTag: "@fact_check",
    name: "Vérification des Faits",
    samplePrompt: "/fact_check La mission Artemis III a-t-elle aluni ?",
    slashCommand: "/fact_check",
  },
  {
    category: "creation",
    description:
      "Reformule un texte (Viral, Professionnel, Humoristique, Concis, Poétique).",
    iconName: "Sparkles",
    id: "rewrite_post",
    mentionTag: "@rewrite",
    name: "Reformulation de Style",
    samplePrompt:
      "/rewrite viral Nous venons de lancer la nouvelle version de Vibe !",
    slashCommand: "/rewrite",
  },
  {
    category: "creation",
    description:
      "Traduit un texte dans la langue souhaitée (Anglais, Espagnol, etc.).",
    iconName: "Languages",
    id: "translate",
    mentionTag: "@translate",
    name: "Traduction Instantanée",
    samplePrompt: "/translate anglais Bienvenue sur la plateforme Vibe mAI",
    slashCommand: "/translate",
  },
  {
    category: "creation",
    description:
      "Publie directement une publication sur le profil Vibe de l'utilisateur.",
    iconName: "Send",
    id: "create_post",
    mentionTag: "@publish",
    name: "Publier un Post",
    samplePrompt: "/publish Ravi de rejoindre la communauté Vibe !",
    slashCommand: "/publish",
  },
  {
    category: "account",
    description: "Supprime une publication appartenant à l'utilisateur.",
    iconName: "Trash2",
    id: "delete_post",
    mentionTag: "@delete_post",
    name: "Supprimer un Post",
    samplePrompt: "/delete_post <uuid-du-post>",
    slashCommand: "/delete_post",
  },
  {
    category: "creation",
    description:
      "Génère des idées de publications originales sur un thème (sans les publier).",
    iconName: "Lightbulb",
    id: "suggest_post",
    mentionTag: "@inspire",
    name: "Idées de Posts",
    samplePrompt: "/inspire sur les voyages spatiaux et le futur",
    slashCommand: "/inspire",
  },
  {
    category: "analysis",
    description:
      "Détecte les sujets chauds et discussions émergentes de la plateforme.",
    iconName: "TrendingUp",
    id: "analyze_trends",
    mentionTag: "@trends",
    name: "Tendances en Temps Réel",
    samplePrompt: "/trends",
    slashCommand: "/trends",
  },
  {
    category: "search",
    description:
      "Recherche des publications Vibe par mot-clé (titre, contenu).",
    iconName: "Search",
    id: "search_posts",
    mentionTag: "@find",
    name: "Recherche de Posts",
    samplePrompt: "/find intelligence artificielle",
    slashCommand: "/find",
  },
  {
    category: "account",
    description:
      "Affiche réputation, nombre de posts, abonnés et forfait du compte.",
    iconName: "BarChart3",
    id: "get_account_stats",
    mentionTag: "@stats",
    name: "Statistiques du Compte",
    samplePrompt: "/stats",
    slashCommand: "/stats",
  },
  {
    category: "analysis",
    description:
      "Analyse approfondie des stats créateur (vues, engagement, sources) et produit des recommandations concrètes.",
    iconName: "Activity",
    id: "analyze_creator_stats",
    mentionTag: "@analyze_stats",
    name: "Analyse des Statistiques Créateur",
    samplePrompt: "/analyze_stats 30d",
    slashCommand: "/analyze_stats",
  },
  {
    category: "analysis",
    description:
      "Analyse vues, likes, engagement détaillé d'une publication précise.",
    iconName: "Activity",
    id: "get_post_stats",
    mentionTag: "@analyze",
    name: "Analyser un Post",
    samplePrompt: "/analyze <uuid-du-post>",
    slashCommand: "/analyze",
  },
  {
    category: "account",
    description:
      "Consulte l'état des tokens mAI hebdomadaires et images quotidiennes.",
    iconName: "Zap",
    id: "check_quotas",
    mentionTag: "@quotas",
    name: "Vérifier mes Quotas",
    samplePrompt: "/quotas",
    slashCommand: "/quotas",
  },
  {
    category: "account",
    description:
      "Suit (ou ne suit plus) un compte Vibe désigné par son @username.",
    iconName: "UserPlus",
    id: "follow_user",
    mentionTag: "@follow",
    name: "Suivre un Compte",
    samplePrompt: "/follow @mai_officiel",
    slashCommand: "/follow",
  },
  {
    category: "account",
    description:
      "Affiche les dernières notifications (likes, réponses, follows, DMs).",
    iconName: "Bell",
    id: "get_notifications",
    mentionTag: "@notifications",
    name: "Mes Notifications",
    samplePrompt: "/notifications",
    slashCommand: "/notifications",
  },
  {
    category: "account",
    description: "Like (ou unlike) une publication par son UUID.",
    iconName: "Heart",
    id: "like_post",
    mentionTag: "@like",
    name: "Liker un Post",
    samplePrompt: "/like <uuid-du-post>",
    slashCommand: "/like",
  },
  {
    category: "account",
    description:
      "Envoie un message privé à un @username (approbation requise).",
    iconName: "MessageCircle",
    id: "send_message",
    mentionTag: "@dm",
    name: "Envoyer un DM",
    samplePrompt: "/dm @mai_officiel Salut, bravo pour Vibe !",
    slashCommand: "/dm",
  },
  {
    category: "account",
    description:
      "Modifie thème, langue, fil, notifications, mAI (approbation requise).",
    iconName: "Settings",
    id: "update_settings",
    mentionTag: "@settings",
    name: "Modifier mes Paramètres",
    samplePrompt: "/settings theme dark",
    slashCommand: "/settings",
  },
  {
    category: "account",
    description: "Met à jour le nom affiché et/ou la bio du profil Vibe.",
    iconName: "User",
    id: "update_profile",
    mentionTag: "@profile",
    name: "Modifier mon Profil",
    samplePrompt: "/profile display_name: Nouveau Nom",
    slashCommand: "/profile",
  },
  {
    category: "account",
    description:
      "Ajoute (ou retire) une publication des favoris de l'utilisateur.",
    iconName: "Bookmark",
    id: "bookmark_post",
    mentionTag: "@bookmark",
    name: "Sauvegarder un Post",
    samplePrompt: "/bookmark <uuid-du-post>",
    slashCommand: "/bookmark",
  },
  {
    category: "account",
    description:
      "Republie (ou annule) une publication sur le profil de l'utilisateur.",
    iconName: "Repeat2",
    id: "repost_post",
    mentionTag: "@repost",
    name: "Reposter",
    samplePrompt: "/repost <uuid-du-post>",
    slashCommand: "/repost",
  },
  {
    category: "creation",
    description: "Commente une publication via mAI (approbation requise).",
    iconName: "MessageSquare",
    id: "comment_post",
    mentionTag: "@comment",
    name: "Commenter un Post",
    samplePrompt: "/comment <uuid-du-post> Super post, merci !",
    slashCommand: "/comment",
  },
  {
    category: "analysis",
    description:
      "Sources de vues, visiteurs uniques, heures de pointe et followers les plus engagés.",
    iconName: "Users",
    id: "analyze_audience",
    mentionTag: "@audience",
    name: "Analyse d'Audience",
    samplePrompt: "/audience 30d",
    slashCommand: "/audience",
  },
  {
    category: "analysis",
    description:
      "Meilleures heures et jours de publication selon tes vues et ton engagement réels.",
    iconName: "Clock",
    id: "best_time_to_post",
    mentionTag: "@besttime",
    name: "Meilleur Moment pour Publier",
    samplePrompt: "/besttime 90d",
    slashCommand: "/besttime",
  },
  {
    category: "analysis",
    description:
      "Croissance vs période précédente : vues, likes, reposts, réponses, followers, visites de profil.",
    iconName: "ArrowLeftRight",
    id: "compare_periods",
    mentionTag: "@compare",
    name: "Comparaison de Périodes",
    samplePrompt: "/compare 30d",
    slashCommand: "/compare",
  },
  {
    category: "analysis",
    description:
      "Score et estimation de portée/engagement d'un brouillon avant publication.",
    iconName: "Target",
    id: "predict_post_performance",
    mentionTag: "@predict",
    name: "Prévision de Performance",
    samplePrompt: "/predict Voici mon brouillon de post...",
    slashCommand: "/predict",
  },
  {
    category: "analysis",
    description:
      "Performance par format (texte, image, sondage, citation) et par hashtag.",
    iconName: "LayoutGrid",
    id: "analyze_content_performance",
    mentionTag: "@formats",
    name: "Performance par Format",
    samplePrompt: "/formats 30d",
    slashCommand: "/formats",
  },
  {
    category: "analysis",
    description:
      "Volumes de messages, conversations actives, temps de réponse moyen, top correspondants.",
    iconName: "MessagesSquare",
    id: "analyze_dm_activity",
    mentionTag: "@dmstats",
    name: "Activité de Messagerie",
    samplePrompt: "/dmstats 30d",
    slashCommand: "/dmstats",
  },
  {
    category: "analysis",
    description:
      "Livres collaboratifs : contributions par membre, activité récente, posts populaires.",
    iconName: "BookOpen",
    id: "analyze_book_stats",
    mentionTag: "@bookstats",
    name: "Statistiques des Livres",
    samplePrompt: "/bookstats 30d",
    slashCommand: "/bookstats",
  },
  {
    category: "analysis",
    description:
      "Tes hashtags : vues et likes moyens, meilleurs performers, suggestions tendance.",
    iconName: "Hash",
    id: "analyze_hashtags",
    mentionTag: "@hashtags",
    name: "Analyse des Hashtags",
    samplePrompt: "/hashtags 30d",
    slashCommand: "/hashtags",
  },
];

/** @deprecated Utiliser useAvailableMAITools() (serveur + repli). */
export const AVAILABLE_MAI_TOOLS: MAITool[] = FALLBACK_MAI_TOOLS;
