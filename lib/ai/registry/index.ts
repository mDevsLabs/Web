import {
  type ChatModel,
  DEFAULT_CHAT_MODEL,
  FALLBACK_MODELS,
} from "@/lib/ai/models";
import {
  type AgentModelCompatibility,
  agentCompatibilityFor,
  getMemoizedCapabilities,
  type ModelCapabilities,
} from "@/lib/ai/registry/capabilities";
import type { ReasoningLevel } from "@/lib/ai/registry/reasoning";
import {
  filterModelsForTier,
  getModelTierAccess,
  isModelAllowedForTier,
  type ModelTierAccess,
} from "@/lib/ai/registry/tiers";

// Source de vérité unique sur les modèles : identité, capacités, réflexion,
// disponibilité par forfait. Aucun composant ne doit tester le nom d'un modèle
// ni relire les heuristiques de lib/ai/models.ts : tout passe par ici.

export type AgentModelEntry = {
  agentCompatibility: AgentModelCompatibility;
  capabilities: ModelCapabilities;
  description: string;
  id: string;
  isFree: boolean;
  name: string;
  provider: string;
  reasoningLevels: ReasoningLevel[];
  tierAccess: ModelTierAccess;
};

export function buildModelEntry(model: ChatModel | string): AgentModelEntry {
  const modelId = typeof model === "string" ? model : model.id;
  const capabilities = getMemoizedCapabilities(model);
  return {
    agentCompatibility: agentCompatibilityFor(modelId, capabilities.tools),
    capabilities,
    description: typeof model === "string" ? "" : (model.description ?? ""),
    id: modelId,
    isFree: typeof model === "string" ? false : Boolean(model.isFree),
    name: typeof model === "string" ? modelId : (model.name ?? modelId),
    provider: typeof model === "string" ? "" : (model.provider ?? ""),
    reasoningLevels: capabilities.reasoningLevels,
    tierAccess: getModelTierAccess(modelId),
  };
}

export type ModelRegistry = {
  byId: Map<string, AgentModelEntry>;
  capabilities: Record<string, ModelCapabilities>;
  entries: AgentModelEntry[];
  models: ChatModel[];
};

export function buildModelRegistry(models: ChatModel[]): ModelRegistry {
  const entries = models.map((model) => buildModelEntry(model));
  const capabilities: Record<string, ModelCapabilities> = {};
  const byId = new Map<string, AgentModelEntry>();

  for (const entry of entries) {
    byId.set(entry.id, entry);
    capabilities[entry.id] = entry.capabilities;
  }

  return { byId, capabilities, entries, models };
}

function findModel(
  modelId: string,
  models: ChatModel[]
): ChatModel | undefined {
  return models.find((model) => model.id === modelId);
}

export function getModelEntry(
  modelId: string,
  models: ChatModel[] = FALLBACK_MODELS
): AgentModelEntry {
  const found = findModel(modelId, models);
  return buildModelEntry(found ?? modelId);
}

export function getModelEntries(
  models: ChatModel[] = FALLBACK_MODELS
): AgentModelEntry[] {
  return models.map((model) => buildModelEntry(model));
}

export function getModelCapabilitiesFor(
  modelId: string,
  models: ChatModel[] = FALLBACK_MODELS
): ModelCapabilities {
  return getModelEntry(modelId, models).capabilities;
}

export function supportsReasoning(
  modelId: string,
  models: ChatModel[] = FALLBACK_MODELS
): boolean {
  return getModelEntry(modelId, models).capabilities.reasoning;
}

export function supportsTools(
  modelId: string,
  models: ChatModel[] = FALLBACK_MODELS
): boolean {
  return getModelEntry(modelId, models).capabilities.tools;
}

export function supportsFiles(
  modelId: string,
  models: ChatModel[] = FALLBACK_MODELS
): boolean {
  const capabilities = getModelEntry(modelId, models).capabilities;
  return capabilities.file || capabilities.image || capabilities.vision;
}

export function maxFilesFor(
  modelId: string,
  models: ChatModel[] = FALLBACK_MODELS
): number {
  return getModelEntry(modelId, models).capabilities.maxFiles;
}

export function contextWindowFor(
  modelId: string,
  models: ChatModel[] = FALLBACK_MODELS
): number | null {
  return getModelEntry(modelId, models).capabilities.contextWindow;
}

// Modèles utilisables par Agent : compatibilité complète outillage requise
// (définitions, ToolCalls structurés, continuation après ToolResult).
export function isAgentCompatible(entry: AgentModelEntry): boolean {
  return Boolean(
    entry.capabilities.tools &&
      entry.agentCompatibility?.toolDefinitions &&
      entry.agentCompatibility?.structuredToolCalls &&
      entry.agentCompatibility?.continuationAfterToolResult
  );
}

export function getAgentModelEntries(
  models: ChatModel[] = FALLBACK_MODELS
): AgentModelEntry[] {
  return getModelEntries(models).filter(isAgentCompatible);
}

// Fallback déterministe quand le modèle Agent demandé (ou par défaut) devient
// incompatible : premier modèle compatible dans l'ordre du catalogue — jamais
// une saisie utilisateur, jamais un choix aléatoire. Retourne null si aucun
// modèle compatible n'existe pour ce forfait.
export function pickAgentFallbackModel(
  models: ChatModel[] = FALLBACK_MODELS,
  tier?: string | null
): string | null {
  const candidates = getAgentModelEntries(filterModelsForTier(models, tier));
  return candidates[0]?.id ?? null;
}

export function getAgentModelsForTier(
  models: ChatModel[],
  tier: string | null | undefined
): AgentModelEntry[] {
  return getAgentModelEntries(filterModelsForTier(models, tier));
}

export function isModelAllowedForUser(
  modelId: string,
  tier: string | null | undefined
): boolean {
  return isModelAllowedForTier(modelId, tier);
}

// Choisit le modèle par défaut d'Agent : préférence utilisateur si elle est
// utilisable, sinon un modèle compatible outils (et réflexion de préférence,
// car Agent profite du raisonnement), sinon le modèle par défaut global.
export function pickDefaultAgentModel(
  models: ChatModel[] = FALLBACK_MODELS,
  preferred?: string | null,
  tier?: string | null
): string {
  const candidates = getAgentModelEntries(filterModelsForTier(models, tier));
  if (preferred) {
    const preferredEntry = candidates.find((entry) => entry.id === preferred);
    if (preferredEntry) {
      return preferredEntry.id;
    }
  }
  const withReasoning = candidates.find(
    (entry) => entry.capabilities.reasoning && !entry.isFree
  );
  if (withReasoning) {
    return withReasoning.id;
  }
  const paid = candidates.find((entry) => !entry.isFree);
  if (paid) {
    return paid.id;
  }
  return candidates[0]?.id ?? preferred ?? DEFAULT_CHAT_MODEL;
}

export {
  DEFAULT_MAX_FILES,
  deriveModelCapabilities,
  type ModelCapabilities,
} from "@/lib/ai/registry/capabilities";
export {
  DEFAULT_REASONING_LEVEL,
  isReasoningLevel,
  normalizeReasoningLevel,
  REASONING_LEVELS,
  type ReasoningLevel,
} from "@/lib/ai/registry/reasoning";
export {
  filterModelsForTier,
  getModelTierAccess,
  isModelAllowedForTier,
  type ModelTierAccess,
} from "@/lib/ai/registry/tiers";
