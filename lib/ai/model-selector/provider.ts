/**
 * Résolution du fournisseur d'un modèle, et libellés lisibles.
 *
 * Les modèles d'image/audio du gateway n'ont pas de champ `provider` : leur
 * laboratoire est porté par `owned_by`, et certains ids ne contiennent pas de
 * préfixe. Une seule fonction de résolution pour que groupe, titre et logo
 * restent d'accord entre eux. Gère aussi le préfixe ~ (modèles Latest).
 *
 * Logique pure : partagée par le sélecteur de l'hôte (chat, agent, Wakies,
 * création, réglages) et par celui du Site officiel.
 */

import type { SharedModel } from "./types";

/**
 * Clé canonique du fournisseur mAI.
 *
 * Le même fournisseur s'écrit de trois façons selon la source : le backend
 * expose `owned_by: "mDevsLabs"`, la liste embarquée porte
 * `provider: "mdevslabs"`, et les catalogues sans préfixe tombent sur « mAI »
 * par défaut. Toutes ces écritures désignent le MÊME fournisseur : sans
 * normalisation, l'interface affichait deux groupes (« mAI » et « mAI
 * Exclusif ») pour un catalogue unique, et le même modèle changeait de
 * groupe selon l'origine de la donnée.
 */
export const MAI_PROVIDER_KEY = "mai";

/** Alias historiques du fournisseur mAI, tous normalisés vers `mai`. */
const MAI_PROVIDER_ALIASES = new Set([
  MAI_PROVIDER_KEY,
  "maidevs",
  "mdevs",
  "mdevslabs",
]);

/**
 * Label porté par le fournisseur mAI.
 *
 * Le fournisseur mAI n'est pas « un groupe parmi d'autres » : c'est celui
 * que la maison recommande. Le label est porté par le GROUPE, pas par
 * chaque modèle — la recommandation porte sur la source, pas sur une
 * entrée de catalogue.
 */
export const MAI_PROVIDER_RECOMMENDED_LABEL = "Recommandé";

export const PROVIDER_NAMES: Record<string, string> = {
  "01-ai": "01.AI (Yi)",
  ai21: "AI21 Labs",
  aionlabs: "Aion Labs",
  alibaba: "Alibaba Cloud",
  amazon: "Amazon Bedrock",
  "amazon-bedrock": "Amazon Bedrock",
  anthropic: "Anthropic",
  arceeai: "Arcee AI",
  aws: "Amazon AWS",
  azure: "Microsoft Azure",
  baichuan: "Baichuan",
  "black-forest-labs": "Black Forest Labs",
  bytedance: "ByteDance (Doubao)",
  cartesia: "Cartesia",
  cerebras: "Cerebras",
  cohere: "Cohere",
  deepgram: "Deepgram",
  deepinfra: "DeepInfra",
  deepseek: "DeepSeek",
  "dots-studio": "Dots Studio",
  doubao: "ByteDance (Doubao)",
  elevenlabs: "ElevenLabs",
  fal: "fal.ai",
  "fireworks-ai": "Fireworks AI",
  google: "Google",
  granite: "IBM Granite",
  grok: "xAI (Grok)",
  groq: "Groq",
  hunyuan: "Tencent Hunyuan",
  ibm: "IBM Granite",
  "ideogram-ai": "Ideogram",
  "inclusion-ai": "Inclusion AI",
  internlm: "InternLM",
  kwaipilot: "Kwaipilot (Kuaishou)",
  lepton: "Lepton AI",
  "liquid-ai": "Liquid AI (LFM)",
  luma: "Luma AI",
  mai: "mAI",
  meituan: "Meituan",
  "meta-llama": "Meta Llama",
  midjourney: "Midjourney",
  minimax: "MiniMax",
  mistral: "Mistral AI",
  mistralai: "Mistral AI",
  moonshotai: "Moonshot AI (Kimi)",
  nebius: "Nebius AI",
  nextagi: "Next AGI",
  nvidia: "NVIDIA",
  openai: "OpenAI",
  openrouter: "OpenRouter",
  perceptron: "Perceptron",
  perplexity: "Perplexity",
  playht: "PlayHT",
  poolside: "Poolside (Laguna)",
  qwen: "Qwen / Alibaba",
  "recraft-ai": "Recraft",
  "reka-ai": "Reka AI",
  rekaai: "Reka AI",
  runway: "Runway",
  sambanova: "SambaNova",
  sensetime: "SenseTime",
  "stability-ai": "Stability AI",
  stabilityai: "Stability AI",
  stepfun: "StepFun",
  tencent: "Tencent (Hunyuan)",
  togetherai: "Together AI",
  upstage: "Upstage",
  writer: "Writer (Palmyra)",
  xai: "xAI (Grok)",
  zai: "Zhipu AI (Z-AI)",
  zhipuai: "Zhipu AI (GLM)",
};

/**
 * Normalise un fournisseur brut vers sa clé canonique.
 *
 * Fonction PURE et exportée : la résolution du logo, le libellé et le
 * regroupement doivent désigner le même laboratoire. La table vivait
 * auparavant dans deux fichiers (le logo en avait sa copie), ce qui avait
 * déjà produit une divergence : `maidevs` était reconnu par l'un et pas
 * l'autre.
 */
export function normalizeProviderKey(rawProvider: string): string {
  const raw = String(rawProvider ?? "")
    .toLowerCase()
    .trim();

  // Retirer le préfixe ~ éventuel (~openai, ~anthropic, etc.)
  const p = raw.replace(/^~+/, "");

  // Le fournisseur mAI se dit « mAI », « mDevsLabs » ou « mdevslabs » selon
  // la source : c'est le même fournisseur, donc la même clé et le même
  // groupe. Sans cette normalisation, mAI-2 (alias cloud) et mAI-2-Mini
  // (modèle embarqué) atterrissaient dans deux groupes distincts.
  if (MAI_PROVIDER_ALIASES.has(p)) {
    return MAI_PROVIDER_KEY;
  }

  if (p === "granite" || p === "ibm" || p.includes("granite")) return "ibm";
  if (
    p === "tencent" ||
    p === "hunyuan" ||
    p.startsWith("hy3") ||
    p.startsWith("hy4")
  )
    return "tencent";
  if (p === "qwen" || p === "alibaba" || p === "alibaba-cn") return "qwen";
  if (
    p === "zhipu" ||
    p === "zhipuai" ||
    p === "zai" ||
    p === "z-ai" ||
    p === "glm" ||
    p === "bigmodel"
  )
    return "zhipuai";
  if (p === "inclusion" || p === "inclusion-ai" || p === "inclusionai")
    return "inclusion-ai";
  if (p === "dots" || p === "dots-studio" || p === "dotsstudio")
    return "dots-studio";
  if (p === "bytedance" || p === "doubao" || p === "volcengine")
    return "bytedance";
  if (p === "xai" || p === "x-ai" || p === "grok") return "xai";
  if (p === "liquid" || p === "liquid-ai" || p === "liquidai" || p === "lfm")
    return "liquid-ai";
  if (p === "meituan" || p === "longcat") return "meituan";
  if (p === "kwaipilot" || p === "kuaishou" || p === "kwai" || p === "kolors")
    return "kwaipilot";
  if (p === "next-agi" || p === "nextagi") return "nextagi";
  if (p === "aion" || p === "aion-labs" || p === "aionlabs") return "aionlabs";
  if (p === "perceptron" || p === "perceptron-ai") return "perceptron";
  if (
    p === "mistral" ||
    p === "mistralai" ||
    p === "mistral-ai" ||
    p === "codestral" ||
    p === "pixtral" ||
    p === "ministral"
  )
    return "mistral";
  if (p === "arcee" || p === "arcee-ai" || p === "arceeai") return "arceeai";
  if (p === "reka" || p === "reka-ai" || p === "rekaai") return "rekaai";
  if (p === "writer" || p === "palmyra") return "writer";
  if (
    p === "amazon" ||
    p === "amazon-bedrock" ||
    p === "bedrock" ||
    p === "aws" ||
    p === "nova" ||
    p === "titan"
  )
    return "amazon";
  if (p === "meta" || p === "meta-llama" || p === "llama") return "meta-llama";
  if (p === "poolside" || p === "laguna") return "poolside";
  if (p === "kimi" || p === "moonshot" || p === "moonshotai")
    return "moonshotai";
  if (p === "01-ai" || p === "yi") return "01-ai";
  if (p === "microsoft" || p === "azure") return "azure";
  if (p === "together" || p === "togetherai") return "togetherai";
  if (p === "fireworks" || p === "fireworks-ai") return "fireworks-ai";
  if (p === "stability" || p === "stability-ai" || p === "stabilityai")
    return "stability-ai";
  if (p === "recraft" || p === "recraft-ai") return "recraft-ai";
  if (p === "google-vertex" || p === "google") return "google";

  return p || MAI_PROVIDER_KEY;
}

export function resolveProviderKey(model: SharedModel): string {
  // Un identifiant SANS préfixe (`mai-2`, `mai-2-mini`) est par construction
  // un modèle mAI : `id.split("/")[0]` renverrait sinon l'identifiant
  // entier, qui deviendrait un groupe à lui seul.
  const prefixe = model.id.includes("/") ? model.id.split("/")[0] : "";
  return normalizeProviderKey(
    model.provider || model.owned_by || prefixe || MAI_PROVIDER_KEY
  );
}

/** Libellé lisible d'un fournisseur, avec repli sur l'identifiant brut. */
export function providerLabel(model: SharedModel): string {
  const key = resolveProviderKey(model);
  return (
    PROVIDER_NAMES[key.toLowerCase()] ||
    PROVIDER_NAMES[model.provider?.toLowerCase() ?? ""] ||
    model.provider ||
    "mAI"
  );
}

/**
 * Le fournisseur mAI est-il celui que la maison recommande ?
 *
 * Sert à porter le label « Recommandé » sur le GROUPE mAI, une seule fois,
 * plutôt que sur chaque modèle : un label répété dix fois n'informe plus.
 */
export function isMaiProvider(model: SharedModel): boolean {
  return resolveProviderKey(model) === MAI_PROVIDER_KEY;
}
