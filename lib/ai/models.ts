export type ModelCapabilities = {
  tools: boolean;
  vision: boolean;
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
    description: "Modèle multimodal ultra-rapide de Google",
    id: "google/gemini-2.5-flash",
    isFree: false,
    name: "Gemini 2.5 Flash",
    provider: "google",
  },
  {
    description: "Modèle open-source de pointe par Meta",
    id: "meta-llama/llama-3.3-70b-instruct:free",
    isFree: true,
    name: "Llama 3.3 70B",
    provider: "meta-llama",
  },
  {
    description: "Modèle de raisonnement avancé DeepSeek",
    id: "deepseek/deepseek-r1:free",
    isFree: true,
    name: "DeepSeek R1",
    provider: "deepseek",
  },
  {
    description: "Spécialisé pour le code et le développement",
    id: "qwen/qwen-2.5-coder-32b-instruct:free",
    isFree: true,
    name: "Qwen 2.5 Coder 32B",
    provider: "qwen",
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
