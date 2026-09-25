import {
  type ChatModel,
  getModelCapabilities as getBaseModelCapabilities,
} from "@/lib/ai/models";
import {
  REASONING_LEVELS,
  type ReasoningLevel,
} from "@/lib/ai/registry/reasoning";

// Capacités étendues : superset de ModelCapabilities (lib/ai/models) utilisé par
// Agent pour décider quoi afficher dans le composer, quels outils proposer et
// quels fichiers accepter. Les heuristiques historiques de lib/ai/models.ts
// restent le repli de dernier recours, jamais la règle : toute précision
// s'écrit ici, dans les surcharges par identifiant de modèle.
export type ModelCapabilities = {
  audio: boolean;
  contextWindow: number | null;
  documents: boolean;
  file: boolean;
  image: boolean;
  images: boolean;
  maxFiles: number;
  reasoning: boolean;
  reasoningLevels: ReasoningLevel[];
  tools: boolean;
  vision: boolean;
};

export const DEFAULT_MAX_FILES = 10;

// Compatibilité Agent évaluée modèle par modèle (et adapter par adapter) :
// un simple booléen provider global ne suffit pas — un modèle peut exposer des
// définitions d'outils sans produire de ToolCalls structurés exploitables, ou
// sans pouvoir continuer après un ToolResult. Toute correction s'écrit dans
// MODEL_CAPABILITY_OVERRIDES ou AGENT_COMPATIBILITY_OVERRIDES, jamais dans un
// `if (model === "...")` dispersé.
export type AgentModelCompatibility = {
  // ToolResults acceptés après un appel (format de sortie exploitable).
  continuationAfterToolResult: boolean;
  // ToolCalls structurés réellement émis (et non du texte à parser).
  structuredToolCalls: boolean;
  // Définitions d'outils acceptées (tools/functions dans la requête).
  toolDefinitions: boolean;
};

export const DEFAULT_AGENT_COMPATIBILITY: AgentModelCompatibility = {
  continuationAfterToolResult: true,
  structuredToolCalls: true,
  toolDefinitions: true,
};

export const AGENT_COMPATIBILITY_OVERRIDES: Record<
  string,
  Partial<AgentModelCompatibility>
> = {};

export function agentCompatibilityFor(
  modelId: string,
  baseTools: boolean
): AgentModelCompatibility {
  if (!baseTools) {
    return {
      continuationAfterToolResult: false,
      structuredToolCalls: false,
      toolDefinitions: false,
    };
  }
  return {
    ...DEFAULT_AGENT_COMPATIBILITY,
    ...AGENT_COMPATIBILITY_OVERRIDES[modelId],
  };
}

// Surcharges explicites, par identifiant de modèle. Seule source autorisée pour
// corriger une capacité : aucun composant ne doit écrire `if (model === "...")`.
export const MODEL_CAPABILITY_OVERRIDES: Record<
  string,
  Partial<ModelCapabilities>
> = {};

function readInputModalities(model: ChatModel | string): string[] {
  if (typeof model === "string") {
    return [];
  }
  return model.architecture?.input_modalities ?? [];
}

export function deriveModelCapabilities(
  model: ChatModel | string
): ModelCapabilities {
  const base = getBaseModelCapabilities(model);
  const modelId = typeof model === "string" ? model : model.id;
  const inputModalities = readInputModalities(model);
  const contextWindow =
    typeof model === "string" ? null : (model.maxContext ?? null);

  const supportsFiles = base.file || base.image;

  const derived: ModelCapabilities = {
    audio:
      inputModalities.includes("audio") || inputModalities.includes("speech"),
    contextWindow,
    documents: base.file,
    file: base.file,
    image: base.image,
    images: base.image,
    maxFiles: supportsFiles ? DEFAULT_MAX_FILES : 0,
    reasoning: base.reasoning,
    reasoningLevels: base.reasoning ? [...REASONING_LEVELS] : [],
    tools: base.tools,
    vision: base.vision,
  };

  return { ...derived, ...MODEL_CAPABILITY_OVERRIDES[modelId] };
}

// Les modèles du catalogue évoluent rarement : mémoïsation par identifiant pour
// éviter de recalculer les heuristiques à chaque rendu ou appel serveur.
const capabilitiesCache = new Map<string, ModelCapabilities>();

export function getMemoizedCapabilities(
  model: ChatModel | string
): ModelCapabilities {
  const modelId = typeof model === "string" ? model : model.id;
  // Les métadonnées OpenRouter évoluent sans changer l'identifiant. Inclure leur
  // signature dans la clé évite de conserver les capacités d'un ancien snapshot
  // du catalogue pendant toute la vie du processus.
  const metadataKey =
    typeof model === "string"
      ? ""
      : JSON.stringify({
          architecture: model.architecture,
          maxContext: model.maxContext,
          supported_parameters: model.supported_parameters,
        });
  const cacheKey = `v2:${modelId}:${metadataKey}`;
  const cached = capabilitiesCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  const computed = deriveModelCapabilities(model);
  capabilitiesCache.set(cacheKey, computed);
  return computed;
}

export function resetCapabilitiesCache(): void {
  capabilitiesCache.clear();
}
