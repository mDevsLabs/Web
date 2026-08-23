export type ModelCapabilities = {
  tools: boolean;
  vision: boolean;
  image: boolean;
  file: boolean;
  reasoning: boolean;
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
  supported_parameters?: string[];
};

export const DEFAULT_CHAT_MODEL = "google/gemini-2.5-flash";

export const titleModel = {
  description: "Modèle rapide pour la génération de titres",
  id: "google/gemini-2.5-flash",
  name: "Gemini 2.5 Flash",
  provider: "google",
};

export const FALLBACK_MODELS: ChatModel[] = [
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
      input_modalities: ["text"],
      modality: "text->text",
      output_modalities: ["text"],
    },
    description: "Modèle open-source de pointe par Meta",
    id: "meta-llama/llama-3.3-70b-instruct:free",
    isFree: true,
    name: "Llama 3.3 70B",
    provider: "meta-llama",
    supported_parameters: [
      "temperature",
      "top_p",
      "max_tokens",
      "tools",
      "response_format",
    ],
  },
  {
    architecture: {
      input_modalities: ["text"],
      modality: "text->text",
      output_modalities: ["text"],
    },
    description: "Modèle de raisonnement avancé DeepSeek",
    id: "deepseek/deepseek-r1:free",
    isFree: true,
    name: "DeepSeek R1",
    provider: "deepseek",
    supported_parameters: [
      "temperature",
      "top_p",
      "max_tokens",
      "stream",
      "thinking",
      "reasoning",
    ],
  },
  {
    architecture: {
      input_modalities: ["text"],
      modality: "text->text",
      output_modalities: ["text"],
    },
    description: "Spécialisé pour le code et le développement",
    id: "qwen/qwen-2.5-coder-32b-instruct:free",
    isFree: true,
    name: "Qwen 2.5 Coder 32B",
    provider: "qwen",
    supported_parameters: ["temperature", "top_p", "max_tokens", "stop", "tools"],
  },
];

export const chatModels = FALLBACK_MODELS;
export const allowedModelIds = new Set(FALLBACK_MODELS.map((m) => m.id));

export function formatModelName(modelId: string): {
  name: string;
  provider: string;
  isFree: boolean;
} {
  const parts = modelId.split("/");
  const provider = parts.length > 1 ? parts[0] : "mAI";
  const rawName = parts.length > 1 ? parts.slice(1).join("/") : modelId;
  const isFree = modelId.toLowerCase().includes("free");

  let cleanName = rawName.replace(/:free/gi, "").trim();

  // Mappings élégants des modèles courants
  const nameMap: Record<string, string> = {
    "claude-3-5-haiku": "Claude 3.5 Haiku",
    "claude-3-5-sonnet": "Claude 3.5 Sonnet",
    "deepseek-chat": "DeepSeek Chat",
    "deepseek-r1": "DeepSeek R1 (Raisonnement)",
    "deepseek-v3": "DeepSeek V3",
    "gemini-1.5-flash": "Gemini 1.5 Flash",
    "gemini-1.5-pro": "Gemini 1.5 Pro",
    "gemini-2.0-flash": "Gemini 2.0 Flash",
    "gemini-2.5-flash": "Gemini 2.5 Flash",
    "gpt-4o": "GPT-4o",
    "gpt-4o-mini": "GPT-4o Mini",
    "llama-3.1-8b-instruct": "Llama 3.1 8B Instruct",
    "llama-3.1-70b-instruct": "Llama 3.1 70B Instruct",
    "llama-3.3-70b-instruct": "Llama 3.3 70B Instruct",
    "mistral-large": "Mistral Large",
    "mistral-small": "Mistral Small",
    "mixtral-8x7b-instruct": "Mixtral 8x7B",
    "o1-mini": "OpenAI o1 Mini",
    "o1-preview": "OpenAI o1 Preview",
    "qwen-2.5-72b-instruct": "Qwen 2.5 72B Instruct",
    "qwen-2.5-coder-32b-instruct": "Qwen 2.5 Coder 32B",
  };

  if (nameMap[cleanName.toLowerCase()]) {
    cleanName = nameMap[cleanName.toLowerCase()];
  } else {
    cleanName = cleanName
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  return {
    isFree,
    name: cleanName + (isFree ? " (Gratuit)" : ""),
    provider,
  };
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
  const supportedParams: string[] =
    model.supported_parameters ||
    (model as any)?.supported_parameters ||
    [];

  // 1. Détection prise en charge images
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
    modality.includes("document") ||
    modality.includes("multimodal");

  // Heuristique de secours par nom de modèle si aucune métadonnée n'est fournie par l'API
  const isVisionHeuristic =
    lower.includes("gemini") ||
    lower.includes("gpt-4o") ||
    lower.includes("gpt-4-turbo") ||
    lower.includes("claude-3") ||
    lower.includes("pixtral") ||
    lower.includes("qwen-vl") ||
    lower.includes("vision") ||
    lower.includes("vl") ||
    lower.includes("multimodal") ||
    lower.includes("apex") ||
    lower.includes("opal") ||
    lower.includes("light");

  const isImage =
    inputModalities.length > 0 || modality
      ? hasImageModal
      : isVisionHeuristic;

  const isFile =
    inputModalities.length > 0 || modality
      ? hasFileModal || hasImageModal
      : (lower.includes("gemini") ||
          lower.includes("gpt-4o") ||
          lower.includes("claude-3") ||
          isVisionHeuristic);

  const isVision = isImage || isFile;

  // 3. Détection des outils supportés
  const isTools =
    supportedParams.length > 0
      ? supportedParams.includes("tools") ||
        supportedParams.includes("function_calling")
      : (
          lower.includes("gemini") ||
          lower.includes("gpt-4") ||
          lower.includes("gpt-3.5") ||
          lower.includes("claude") ||
          lower.includes("llama-3.3") ||
          lower.includes("llama-3.1") ||
          lower.includes("qwen-2.5") ||
          lower.includes("mistral") ||
          lower.includes("apex") ||
          lower.includes("opal") ||
          lower.includes("light")
        );

  // 4. Détection du raisonnement (Reasoning / Thinking)
  const isReasoning =
    supportedParams.length > 0 &&
    (supportedParams.includes("thinking") ||
      supportedParams.includes("reasoning"))
      ? true
      : (
          lower.includes("r1") ||
          lower.includes("o1") ||
          lower.includes("o3") ||
          lower.includes("reasoning") ||
          lower.includes("thinking") ||
          lower.includes("qwq")
        );

  return {
    file: isFile,
    image: isImage,
    reasoning: isReasoning,
    tools: isTools,
    vision: isVision,
  };
}


