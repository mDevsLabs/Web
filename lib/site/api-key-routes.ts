export type ApiRouteMethod = "GET" | "POST" | "PUT" | "DELETE";

export type ApiRouteCategory =
  | "Projets"
  | "LLM & Modèles"
  | "Images & Web Search"
  | "Audio & Speech"
  | "SDK Google & Anthropic"
  | "Clés & Quotas"
  | "Système";

export interface RouteDefinition {
  category: ApiRouteCategory;
  defaultBody?: unknown;
  defaultHeaders: Record<string, string>;
  description: string;
  id: string;
  method: ApiRouteMethod;
  name: string;
  path: string;
  requiresAuth: boolean;
}

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

/** Catalogue public du studio, partagé avec l'exécuteur via ses allowlists. */
export const API_ROUTE_DEFINITIONS: readonly RouteDefinition[] = [
  {
    category: "Projets",
    defaultHeaders: { ...JSON_HEADERS },
    description:
      "Récupère la liste globale de tous les projets de la plateforme mAI (Web, Pulse, CLI, Coder).",
    id: "projects-list",
    method: "GET",
    name: "Lister les projets",
    path: "v1/projects",
    requiresAuth: true,
  },
  {
    category: "Projets",
    defaultHeaders: { ...JSON_HEADERS },
    description: "Obtient les détails et l'état de l'application mAI Web.",
    id: "projects-web",
    method: "GET",
    name: "Projet Web",
    path: "v1/projects/web",
    requiresAuth: true,
  },
  {
    category: "Projets",
    defaultHeaders: { ...JSON_HEADERS },
    description: "Obtient les détails de la suite d'extensions mAI Pulse.",
    id: "projects-pulse",
    method: "GET",
    name: "Projet Pulse",
    path: "v1/projects/pulse",
    requiresAuth: true,
  },
  {
    category: "Projets",
    defaultHeaders: { ...JSON_HEADERS },
    description: "Obtient les détails de l'assistant de terminal mAI CLI.",
    id: "projects-cli",
    method: "GET",
    name: "Projet CLI",
    path: "v1/projects/cli",
    requiresAuth: true,
  },
  {
    category: "Projets",
    defaultHeaders: { ...JSON_HEADERS },
    description:
      "Obtient les détails de l'IDE IA mAI Coder avec agents et outils MCP.",
    id: "projects-coder",
    method: "GET",
    name: "Projet Coder",
    path: "v1/projects/coder",
    requiresAuth: true,
  },
  {
    category: "LLM & Modèles",
    defaultBody: {
      messages: [
        {
          content:
            "Tu es un assistant IA précis, souverain et hautement qualifié.",
          role: "system",
        },
        {
          content:
            "Présente l'écosystème mAI et ses avantages en deux phrases !",
          role: "user",
        },
      ],
      model: "poolside/laguna-xs-2.1:free",
      temperature: 0.7,
    },
    defaultHeaders: { ...JSON_HEADERS },
    description:
      "Génère une réponse LLM mAI / OpenRouter compatible OpenAI avec streaming ou JSON.",
    id: "chat-completions",
    method: "POST",
    name: "Chat Completions mAI",
    path: "v1/chat/completions",
    requiresAuth: true,
  },
  {
    category: "LLM & Modèles",
    defaultHeaders: { ...JSON_HEADERS },
    description:
      "Liste tous les modèles d'intelligence artificielle disponibles sur l'API publique.",
    id: "models-list-public",
    method: "GET",
    name: "Catalogue global des modèles",
    path: "v1/models",
    requiresAuth: false,
  },
  {
    category: "LLM & Modèles",
    defaultHeaders: { ...JSON_HEADERS },
    description:
      "Liste les modèles d'IA souverains de la famille mAI (série 1.5, 1.2, 1.0) pour Ollama / GGUF.",
    id: "models-mai-list",
    method: "GET",
    name: "Catalogue Modèles mAI (Locaux)",
    path: "v1/models/mai",
    requiresAuth: false,
  },
  {
    category: "LLM & Modèles",
    defaultHeaders: { ...JSON_HEADERS },
    description:
      "Récupère les métadonnées détaillées, le contexte et les capacités d'un modèle précis.",
    id: "models-single-detail",
    method: "GET",
    name: "Détail d'un Modèle Spécifique",
    path: "v1/models/mai-1.5-light",
    requiresAuth: true,
  },
  {
    category: "Images & Web Search",
    defaultHeaders: { ...JSON_HEADERS },
    description:
      "Liste les modèles de génération d'images haute qualité (Comet API & Flux Schnell/Dev/Pro).",
    id: "models-images-list",
    method: "GET",
    name: "Catalogue Modèles Images",
    path: "v1/models/images",
    requiresAuth: false,
  },
  {
    category: "Images & Web Search",
    defaultBody: {
      model: "black-forest-labs/flux-1-schnell",
      prompt:
        "Un paysage futuriste avec des néons sous la pluie, photoréaliste, 8k, éclairage cinématographique",
      response_format: "url",
      size: "1024x1024",
    },
    defaultHeaders: { ...JSON_HEADERS },
    description:
      "Génère une image par IA avec prompt, négatif, format, dimensions et modèle sélectionné.",
    id: "images-generations",
    method: "POST",
    name: "Générer une Image (Comet & Flux)",
    path: "v1/images/generations",
    requiresAuth: true,
  },
  {
    category: "Images & Web Search",
    defaultHeaders: { ...JSON_HEADERS },
    description:
      "Consulte le quota journalier et le nombre d'images générées aujourd'hui selon votre forfait.",
    id: "images-usage-quota",
    method: "GET",
    name: "Quota & Consommation Images",
    path: "v1/images/usage",
    requiresAuth: true,
  },
  {
    category: "Images & Web Search",
    defaultHeaders: { ...JSON_HEADERS },
    description:
      "Consulte l'historique complet de vos générations d'images avec URLs et prompts associés.",
    id: "images-history-list",
    method: "GET",
    name: "Historique des Générations d'Images",
    path: "v1/images/history",
    requiresAuth: true,
  },
  {
    category: "Images & Web Search",
    defaultBody: {
      count: 5,
      query:
        "dernières actualités intelligence artificielle et modèles souverains 2026",
    },
    defaultHeaders: { ...JSON_HEADERS },
    description:
      "Recherche web en temps réel enrichie avec triple fallback automatique pour l'actualité.",
    id: "web-search-query",
    method: "POST",
    name: "Recherche Web (You.com & Fallback)",
    path: "v1/web/search",
    requiresAuth: false,
  },
  {
    category: "Audio & Speech",
    defaultHeaders: { ...JSON_HEADERS },
    description:
      "Liste les modèles de synthèse vocale (TTS) disponibles via OpenRouter (Deepgram Flux TTS).",
    id: "audio-models-list",
    method: "GET",
    name: "Catalogue Modèles Audio (Speech)",
    path: "v1/audio/models",
    requiresAuth: false,
  },
  {
    category: "Audio & Speech",
    defaultHeaders: { ...JSON_HEADERS },
    description:
      "Liste toutes les voix disponibles pour la synthèse vocale (Alexis, Michael, Stacy, Sam, Asteria, Orion).",
    id: "audio-voices-list",
    method: "GET",
    name: "Catalogue des Voix TTS",
    path: "v1/audio/voices",
    requiresAuth: false,
  },
  {
    category: "Audio & Speech",
    defaultBody: {
      input: "Bonjour, je suis mAI, votre assistant vocal souverain.",
      model: "deepgram/flux-tts:free",
      response_format: "mp3",
      speed: 1.0,
      voice: "flux-alexis-en",
    },
    defaultHeaders: { ...JSON_HEADERS },
    description:
      "Convertit du texte en audio avec Deepgram Flux TTS. Retourne un fichier MP3/audio binaire.",
    id: "audio-speech-generate",
    method: "POST",
    name: "Générer une Synthèse Vocale (TTS)",
    path: "v1/audio/speech",
    requiresAuth: true,
  },
  {
    category: "Audio & Speech",
    defaultHeaders: { ...JSON_HEADERS },
    description:
      "Consulte le quota hebdomadaire de tokens TTS et le nombre de requêtes vocales effectuées.",
    id: "audio-usage-quota",
    method: "GET",
    name: "Quota & Consommation Audio",
    path: "v1/audio/usage",
    requiresAuth: true,
  },
  {
    category: "SDK Google & Anthropic",
    defaultBody: {
      max_tokens: 1024,
      messages: [
        {
          content: "Bonjour Claude, résume les capacités de l'écosystème mAI !",
          role: "user",
        },
      ],
      model: "poolside/laguna-xs-2.1:free",
    },
    defaultHeaders: { ...JSON_HEADERS },
    description:
      "Endpoint compatible avec le SDK officiel Anthropic (@anthropic-ai/sdk).",
    id: "anthropic-messages",
    method: "POST",
    name: "Anthropic Messages SDK",
    path: "v1/messages",
    requiresAuth: true,
  },
  {
    category: "SDK Google & Anthropic",
    defaultBody: {
      contents: [
        {
          parts: [
            {
              text: "Bonjour Gemini, présente brièvement les fonctionnalités mAI.",
            },
          ],
          role: "user",
        },
      ],
    },
    defaultHeaders: { ...JSON_HEADERS },
    description:
      "Endpoint compatible avec le SDK officiel Google Generative AI (@google/generative-ai).",
    id: "google-generative-ai",
    method: "POST",
    name: "Google Generative AI SDK",
    path: "v1beta/models/poolside/laguna-xs-2.1:free:generateContent",
    requiresAuth: true,
  },
  {
    category: "Système",
    defaultHeaders: { ...JSON_HEADERS },
    description:
      "Vérifie l'état de santé, la latence et la disponibilité globale de l'infrastucture mAI.",
    id: "system-status",
    method: "GET",
    name: "Statut des services",
    path: "v1/status",
    requiresAuth: false,
  },
];

const EXECUTOR_EXACT_METHODS: Readonly<Record<string, ApiRouteMethod>> = {
  ...Object.fromEntries(
    API_ROUTE_DEFINITIONS.map((route) => [route.path, route.method] as const)
  ),
  "v1/log-usage": "POST",
};

const EXECUTOR_METHOD_PATTERNS: Readonly<
  Record<ApiRouteMethod, readonly RegExp[]>
> = {
  DELETE: [],
  GET: [/^v1\/models\/[A-Za-z0-9._-]+$/],
  POST: [
    /^v1beta\/models\/[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*:(?:generateContent|streamGenerateContent)$/,
  ],
  PUT: [],
};

export function isAllowedExecutorRoute(
  method: ApiRouteMethod,
  path: string
): boolean {
  if (EXECUTOR_EXACT_METHODS[path]) {
    return EXECUTOR_EXACT_METHODS[path] === method;
  }
  return EXECUTOR_METHOD_PATTERNS[method].some((pattern) => pattern.test(path));
}

export function isPublicExecutorRoute(
  method: ApiRouteMethod,
  path: string
): boolean {
  if (method === "GET" && path === "v1/models/audio") return true;
  return API_ROUTE_DEFINITIONS.some(
    (route) =>
      route.path === path && route.method === method && !route.requiresAuth
  );
}
