export type ModelCapabilities = {
  tools: boolean;
  vision: boolean;
  image: boolean;
  file: boolean;
  reasoning: boolean;
};

/**
 * Capacités de réflexion déclarées par le fournisseur pour ce modèle.
 *
 * Relevé tel quel sur `GET /v1/models` (models.ts) : la forme est celle
 * d'OpenRouter, et chaque champ est facultatif — `supported_efforts` manque
 * notamment sur les modèles qui raisonnent sans exposer de niveaux
 * (ex. `minimax/minimax-m3`, alias mAI-2-Mini).
 */
export type ChatModelReasoning = {
  /** Le modèle ne peut pas produire de réponse sans raisonner. */
  mandatory?: boolean;
  /** La réflexion est-elle active par défaut chez ce fournisseur ? */
  default_enabled?: boolean;
  /** Niveau appliqué en l'absence de choix explicite. */
  default_effort?: string;
  /** Niveaux réellement acceptés, du plus intense au plus faible. */
  supported_efforts?: string[];
};

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
  maxContext?: number;
  maxOutput?: number;
  isFree?: boolean;
  architecture?: {
    modality?: string;
    input_modalities?: string[];
    output_modalities?: string[];
    [key: string]: any;
  };
  reasoning?: ChatModelReasoning | null;
  supported_parameters?: string[];
};

// Modèle par défaut unique de l'application : preference « Modèle par défaut »
// des réglages, modèles d'agents, agents, planification et résumés de mémoire.
// Toute évolution doit être répercutée dans la migration 0029 (valeurs
// existantes + DEFAULT des colonnes) pour rester cohérente avec les données.
export const DEFAULT_CHAT_MODEL = "mai-2-mini";

export const titleModel = {
  description: "Modèle équilibré et rapide de la génération mAI-2",
  id: DEFAULT_CHAT_MODEL,
  name: "mAI-2-Mini",
  provider: "mdevslabs",
};

export const FALLBACK_MODELS: ChatModel[] = [
  {
    architecture: {
      input_modalities: ["text", "image", "file"],
      modality: "text+image+file->text",
      output_modalities: ["text"],
    },
    description:
      "Fleuron de la génération mAI-2.5 : raisonnement approfondi, ingénierie logicielle et computer use",
    id: "mai-2.5-opal",
    isFree: false,
    maxContext: 1_000_000,
    maxOutput: 128_000,
    name: "mAI-2.5-Opal",
    provider: "mdevslabs",
    reasoning: {
      default_effort: "high",
      default_enabled: true,
      mandatory: false,
      supported_efforts: ["max", "high", "low"],
    },
    supported_parameters: [
      "temperature",
      "top_p",
      "max_tokens",
      "stream",
      "stop",
      "tools",
      "tool_choice",
      "reasoning",
      "include_reasoning",
      "response_format",
      "seed",
    ],
  },
  {
    architecture: {
      input_modalities: ["text", "image", "file"],
      modality: "text+image+file->text",
      output_modalities: ["text"],
    },
    description:
      "Modèle cloud d'élite mAI-2.5 : rigueur analytique absolue, audit de code et mathématiques",
    id: "mai-2.5-apex",
    isFree: false,
    maxContext: 1_000_000,
    maxOutput: 128_000,
    name: "mAI-2.5-Apex",
    provider: "mdevslabs",
    reasoning: {
      default_effort: "high",
      default_enabled: true,
      mandatory: false,
      supported_efforts: ["max", "high", "low"],
    },
    supported_parameters: [
      "temperature",
      "top_p",
      "max_tokens",
      "stream",
      "stop",
      "tools",
      "tool_choice",
      "reasoning",
      "include_reasoning",
      "response_format",
      "seed",
    ],
  },
  {
    architecture: {
      input_modalities: ["text", "image"],
      modality: "text+image->text",
      output_modalities: ["text"],
    },
    description:
      "Modèle agile et polyvalent mAI-2.5 pour la productivité au quotidien et l'automatisation",
    id: "mai-2.5-omni",
    isFree: true,
    maxContext: 1_000_000,
    maxOutput: 128_000,
    name: "mAI-2.5-Omni",
    provider: "mdevslabs",
    reasoning: {
      default_effort: "high",
      default_enabled: true,
      mandatory: false,
      supported_efforts: ["max", "high", "low"],
    },
    supported_parameters: [
      "temperature",
      "top_p",
      "max_tokens",
      "stream",
      "stop",
      "tools",
      "tool_choice",
      "reasoning",
      "include_reasoning",
      "response_format",
      "seed",
    ],
  },
  {
    architecture: {
      input_modalities: ["text", "image", "file"],
      modality: "text+image->text",
      output_modalities: ["text"],
    },
    description:
      "Modèle phare de la génération mAI-2 : raisonnement avancé, vision et contexte long",
    id: "mai-2",
    isFree: true,
    maxContext: 1_000_000,
    maxOutput: 384_000,
    name: "mAI-2",
    provider: "mdevslabs",
    reasoning: {
      default_effort: "high",
      default_enabled: true,
      mandatory: false,
      supported_efforts: ["max", "high", "low"],
    },
    supported_parameters: [
      "temperature",
      "top_p",
      "max_tokens",
      "stream",
      "stop",
      "tools",
      "tool_choice",
      "reasoning",
      "include_reasoning",
      "response_format",
    ],
  },
  {
    architecture: {
      input_modalities: ["text", "image"],
      modality: "text+image->text",
      output_modalities: ["text"],
    },
    description:
      "Modèle équilibré de la génération mAI-2, rapide et polyvalent",
    id: DEFAULT_CHAT_MODEL,
    isFree: true,
    maxContext: 1_000_000,
    maxOutput: 128_000,
    name: "mAI-2-Mini",
    provider: "mdevslabs",
    reasoning: {
      default_enabled: true,
      mandatory: false,
    },
    supported_parameters: [
      "temperature",
      "top_p",
      "max_tokens",
      "tools",
      "tool_choice",
      "reasoning",
      "include_reasoning",
      "response_format",
      "stop",
    ],
  },
  {
    architecture: {
      input_modalities: ["text", "image", "file"],
      modality: "text+image->text",
      output_modalities: ["text"],
    },
    description: "Modèle multimodal ultra-rapide de Google",
    id: "google/gemini-2.5-flash",
    isFree: false,
    name: "Gemini 2.5 Flash",
    provider: "google",
    supported_parameters: [
      "temperature",
      "top_p",
      "top_k",
      "max_tokens",
      "tools",
      "response_format",
    ],
  },
  {
    architecture: {
      input_modalities: ["text", "image"],
      modality: "text+image->text",
      output_modalities: ["text"],
    },
    description: "Modèle rapide et polyvalent Gemma 4 de Google",
    id: "google/gemma-4-26b-a4b-it:free",
    isFree: true,
    maxContext: 262_144,
    maxOutput: 32_768,
    name: "Gemma 4 26B",
    provider: "google",
    supported_parameters: [
      "temperature",
      "top_p",
      "max_tokens",
      "tools",
      "tool_choice",
      "response_format",
    ],
  },
  {
    architecture: {
      input_modalities: ["text", "image"],
      modality: "text+image->text",
      output_modalities: ["text"],
    },
    description: "Modèle dense haute qualité Gemma 4 31B de Google",
    id: "google/gemma-4-31b-it:free",
    isFree: true,
    maxContext: 262_144,
    maxOutput: 32_768,
    name: "Gemma 4 31B",
    provider: "google",
    supported_parameters: [
      "temperature",
      "top_p",
      "max_tokens",
      "tools",
      "tool_choice",
      "response_format",
    ],
  },
  {
    architecture: {
      input_modalities: ["text"],
      modality: "text->text",
      output_modalities: ["text"],
    },
    description: "Modèle rapide à long contexte de NVIDIA",
    id: "nvidia/nemotron-3.5-lightning:free",
    isFree: true,
    maxContext: 1_000_000,
    maxOutput: 65_536,
    name: "Nemotron 3.5 Lightning",
    provider: "nvidia",
    supported_parameters: [
      "temperature",
      "top_p",
      "max_tokens",
      "tools",
      "tool_choice",
      "response_format",
    ],
  },
  {
    architecture: {
      input_modalities: ["text"],
      modality: "text->text",
      output_modalities: ["text"],
    },
    description: "Modèle de raisonnement avancé Nemotron 3 Ultra",
    id: "nvidia/nemotron-3-ultra-550b-a55b:free",
    isFree: true,
    maxContext: 1_000_000,
    maxOutput: 65_536,
    name: "Nemotron 3 Ultra",
    provider: "nvidia",
    supported_parameters: [
      "temperature",
      "top_p",
      "max_tokens",
      "stream",
      "tools",
      "reasoning",
    ],
  },
];

export const chatModels = FALLBACK_MODELS;
export const allowedModelIds = new Set(FALLBACK_MODELS.map((m) => m.id));

/**
 * Identifie les variantes « batch » (traitement différé asynchrone) d'un
 * catalogue fournisseur, reconnaissables au suffixe ou segment `:batch`.
 */
export function isBatchModelId(modelId: string | null | undefined): boolean {
  return (
    typeof modelId === "string" && modelId.toLowerCase().includes(":batch")
  );
}

/**
 * Exclut les modèles `:batch` d'une liste de modèles, sans muter l'entrée.
 */
export function excludeBatchModels<T extends { id: string }>(
  models: readonly T[]
): T[] {
  return models.filter((model) => !isBatchModelId(model.id));
}

/**
 * Supprime tous les commentaires entre parenthèses d'un nom de modèle
 * (ex. "(Free)", "(Preview)", "(Raisonnement)") et normalise les espaces.
 */
export function stripModelNameParentheses(rawName: string): string {
  return rawName
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const MODEL_TOKEN_UPPERCASE: Record<string, string> = {
  ai: "AI",
  bfl: "BFL",
  chat: "Chat",
  dall: "DALL",
  deepseek: "DeepSeek",
  ernie: "ERNIE",
  fp8: "FP8",
  glm: "GLM",
  gpt: "GPT",
  hd: "HD",
  instruct: "Instruct",
  it: "IT",
  llm: "LLM",
  mai: "mAI",
  minimax: "MiniMax",
  ocr: "OCR",
  qwq: "QwQ",
  r1: "R1",
  sd: "SD",
  sd3: "SD3",
  "sd3.5": "SD3.5",
  sdxl: "SDXL",
  tts: "TTS",
  vl: "VL",
  xl: "XL",
};

function formatSlugToken(token: string): string {
  const lower = token.toLowerCase();
  if (MODEL_TOKEN_UPPERCASE[lower]) {
    return MODEL_TOKEN_UPPERCASE[lower];
  }
  if (/^v\d+(?:\.\d+)*$/i.test(token)) {
    return `V${token.slice(1)}`;
  }
  if (/^\d+(?:\.\d+)?[bmk]$/i.test(token)) {
    return token.toUpperCase();
  }
  return token.charAt(0).toUpperCase() + token.slice(1);
}

function formatTechnicalModelSlug(rawSlug: string): string {
  const trimmed = rawSlug.replace(/:free/gi, "").trim();
  const lower = trimmed.toLowerCase();

  // Mappings élégants des modèles courants
  const nameMap: Record<string, string> = {
    "claude-3-5-haiku": "Claude 3.5 Haiku",
    "claude-3-5-sonnet": "Claude 3.5 Sonnet",
    "dall-e-2": "DALL-E 2",
    "dall-e-3": "DALL-E 3",
    "deepseek-chat": "DeepSeek Chat",
    "deepseek-r1": "DeepSeek R1",
    "deepseek-v3": "DeepSeek V3",
    "flux-1-dev": "Flux 1 Dev",
    "flux-1-pro": "Flux 1 Pro",
    "flux-1-schnell": "Flux 1 Schnell",
    "flux-1.1-pro": "Flux 1.1 Pro",
    "flux-1.1-pro-ultra": "Flux 1.1 Pro Ultra",
    "gemini-1.5-flash": "Gemini 1.5 Flash",
    "gemini-1.5-pro": "Gemini 1.5 Pro",
    "gemini-2.0-flash": "Gemini 2.0 Flash",
    "gemini-2.5-flash": "Gemini 2.5 Flash",
    "gpt-4o": "GPT-4o",
    "gpt-4o-mini": "GPT-4o Mini",
    "gpt-image-1": "GPT Image 1",
    "llama-3.1-8b-instruct": "Llama 3.1 8B Instruct",
    "llama-3.1-70b-instruct": "Llama 3.1 70B Instruct",
    "llama-3.3-70b-instruct": "Llama 3.3 70B Instruct",
    "mai-2": "mAI-2",
    "mai-2-mini": "mAI-2 Mini",
    "mai-2.5-apex": "mAI-2.5 Apex",
    "mai-2.5-omni": "mAI-2.5 Omni",
    "mai-2.5-opal": "mAI-2.5 Opal",
    "mistral-large": "Mistral Large",
    "mistral-small": "Mistral Small",
    "mixtral-8x7b-instruct": "Mixtral 8x7B",
    "o1-mini": "OpenAI o1 Mini",
    "o1-preview": "OpenAI o1 Preview",
    "qwen-2.5-72b-instruct": "Qwen 2.5 72B Instruct",
    "qwen-2.5-coder-32b-instruct": "Qwen 2.5 Coder 32B",
  };

  if (nameMap[lower]) {
    return nameMap[lower];
  }

  // Préserver le tiret de DALL-E avant découpage générique
  const normalizedDallE = trimmed.replace(/\bdall-e\b/gi, "DALL_E_TOKEN");
  return normalizedDallE
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word) =>
      word === "DALL" ? "DALL" : word === "TOKEN" ? "" : formatSlugToken(word)
    )
    .join(" ")
    .replace(/\bDALL E\b/g, "DALL-E")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function isRawTechnicalModelSlug(candidate: string, id: string): boolean {
  if (!candidate) {
    return true;
  }
  const slugFromId =
    id
      .replace(/^~+/, "")
      .replace(/:free$/i, "")
      .split("/")
      .slice(1)
      .join("/") || id.replace(/^~+/, "").replace(/:free$/i, "");

  // Identique au slug technique en minuscules (ex. "flux-1.1-pro", "sdxl")
  if (
    candidate === candidate.toLowerCase() &&
    candidate.toLowerCase() === slugFromId.toLowerCase()
  ) {
    return true;
  }

  // Chaîne technique sans espace, tout en minuscules avec tirets/underscores
  if (!/\s/.test(candidate) && /^[a-z0-9._-]+$/.test(candidate)) {
    return candidate.includes("-") || candidate.includes("_");
  }

  return false;
}

// Nom affichable : retire le préfixe fournisseur ("Poolside: Laguna xs 2.1" ->
// "Laguna xs 2.1"), le suffixe ":free", tout commentaire entre parenthèses, et
// reformate les slugs techniques bruts ("flux-1.1-pro" -> "Flux 1.1 Pro").
export function normalizeModelDisplayName(
  id: string,
  rawName?: string
): string {
  const base =
    rawName?.trim() && rawName.trim() !== id
      ? rawName.trim()
      : formatModelName(id).name;
  const cleaned = stripModelNameParentheses(
    base.replace(/^[^:]{1,30}:\s+/, "").replace(/:free/gi, "")
  );
  if (!cleaned) {
    return formatModelName(id).name;
  }
  if (isRawTechnicalModelSlug(cleaned, id)) {
    return stripModelNameParentheses(formatTechnicalModelSlug(cleaned));
  }
  return cleaned;
}

export function formatModelName(modelId: string): {
  name: string;
  provider: string;
  isFree: boolean;
} {
  const cleanId = modelId.replace(/^~+/, "");
  const parts = cleanId.split("/");
  const provider = parts.length > 1 ? parts[0] : "mAI";
  const rawName = parts.length > 1 ? parts.slice(1).join("/") : cleanId;
  const isFree = modelId.toLowerCase().includes("free");
  const cleanName = formatTechnicalModelSlug(rawName);

  return {
    isFree,
    name: stripModelNameParentheses(cleanName),
    provider,
  };
}

// Paramètres déclarés par le catalogue, normalisés (casse, espaces).
// Une liste absente reste vide : on n'invente pas `tool_choice` à partir du nom.
export function readSupportedParameters(
  modelInput: string | Partial<ChatModel> | null | undefined
): string[] {
  const model: Partial<ChatModel> =
    typeof modelInput === "string" ? { id: modelInput } : modelInput || {};
  const rawSupportedParams =
    model.supported_parameters || (model as any)?.supported_parameters || [];
  return Array.isArray(rawSupportedParams)
    ? rawSupportedParams
        .filter(
          (parameter): parameter is string => typeof parameter === "string"
        )
        .map((parameter) => parameter.trim().toLowerCase())
        .filter(Boolean)
    : [];
}

export function getModelCapabilities(
  modelInput: string | Partial<ChatModel> | any
): ModelCapabilities {
  const model: Partial<ChatModel> =
    typeof modelInput === "string" ? { id: modelInput } : modelInput || {};
  const modelId = model.id || "";
  const lower = modelId.toLowerCase();

  const inputModalities: string[] =
    model.architecture?.input_modalities ||
    (model as any)?.input_modalities ||
    [];
  const modality = (
    model.architecture?.modality ||
    (model as any)?.modality ||
    ""
  ).toLowerCase();
  const supportedParams = readSupportedParameters(model);

  const hasArchitecture = inputModalities.length > 0 || modality.length > 0;

  // 1. Détection prise en charge images (stricte si architecture fournie)
  const hasImageModal =
    inputModalities.includes("image") ||
    modality.includes("image") ||
    modality.includes("multimodal");

  // 2. Détection prise en charge fichiers (documents, pdf, code, etc.)
  const hasFileModal =
    inputModalities.includes("file") ||
    inputModalities.includes("document") ||
    inputModalities.includes("pdf") ||
    modality.includes("file") ||
    modality.includes("document");

  // Heuristique de secours par nom de modèle si aucune métadonnée n'est fournie par l'API
  // Restreinte aux familles dont la capacité vision est documentée publiquement
  const isVisionHeuristic =
    lower.includes("gemini") ||
    lower.includes("gpt-4o") ||
    lower.includes("gpt-4-turbo") ||
    lower.includes("gpt-4-vision") ||
    lower.includes("claude-3") ||
    lower.includes("claude-4") ||
    lower.includes("pixtral") ||
    lower.includes("qwen-vl") ||
    lower.includes("qwen2-vl") ||
    lower.includes("vision") ||
    lower.includes("multimodal") ||
    lower.includes("mdevslabs/mai") ||
    lower.includes("mai-1.5");

  let isImage: boolean;
  let isFile: boolean;

  if (hasArchitecture) {
    // Architecture présente -> on s'y fie strictement, pas de heuristique
    isImage = hasImageModal;
    isFile = hasFileModal;
    // Certains fournisseurs exposent "image" mais acceptent aussi les PDF comme file
    // On ne propage image->file que si file explicit, sinon file reste false
  } else {
    // Pas d'architecture -> heuristique restreinte
    isImage = isVisionHeuristic;
    isFile = isVisionHeuristic;
  }

  const isVision = isImage || isFile;

  // 3. Détection des outils supportés
  const isTools =
    supportedParams.length > 0
      ? supportedParams.includes("tools") ||
        supportedParams.includes("function_calling")
      : lower.includes("gemini") ||
        lower.includes("gpt-4") ||
        lower.includes("gpt-3.5") ||
        lower.includes("claude") ||
        lower.includes("llama-3.3") ||
        lower.includes("llama-3.1") ||
        lower.includes("qwen-2.5") ||
        lower.includes("mistral") ||
        lower.includes("apex") ||
        lower.includes("opal") ||
        lower.includes("light");

  // 4. Détection du raisonnement (Reasoning / Thinking)
  //
  // L'objet `reasoning` du catalogue est la source de vérité : il dit ce que le
  // modèle sait faire, pas ce que son nom laisse deviner. `supported_parameters`
  // sert de repli pour les entrées de catalogue qui ne le portent pas encore,
  // et les heuristiques par nom uniquement en dernier recours (catalogue de
  // repli, où aucun metadata n'est disponible).
  const declaredReasoning =
    typeof model === "object" && model ? model.reasoning : null;
  const isReasoning = declaredReasoning
    ? true
    : supportedParams.length > 0 &&
        (supportedParams.includes("thinking") ||
          supportedParams.includes("reasoning") ||
          supportedParams.includes("reasoning_effort") ||
          supportedParams.includes("include_reasoning"))
      ? true
      : lower.includes("r1") ||
        lower.includes("o1") ||
        lower.includes("o3") ||
        lower.includes("reasoning") ||
        lower.includes("thinking") ||
        lower.includes("qwq");

  return {
    file: isFile,
    image: isImage,
    reasoning: isReasoning,
    tools: isTools,
    vision: isVision,
  };
}

/**
 * Sortie maximale quand le catalogue embarqué ne la connaît pas.
 *
 * Assez large pour qu'une réflexion ne mange pas la réponse visible : sur les
 * modèles à raisonnement, `max_tokens` compte aussi les jetons de réflexion.
 * Omettre la limite laisse certains fournisseurs s'arrêter au milieu d'un mot.
 */
export const UNKNOWN_MODEL_MAX_OUTPUT = 32_768;

export function resolveModelMaxOutput(
  modelId: string,
  models: ReadonlyArray<{ id: string; maxOutput?: number }> = FALLBACK_MODELS
): number {
  const declared = models.find((model) => model.id === modelId)?.maxOutput;
  if (
    typeof declared === "number" &&
    Number.isSafeInteger(declared) &&
    declared > 0
  ) {
    return declared;
  }
  return UNKNOWN_MODEL_MAX_OUTPUT;
}
