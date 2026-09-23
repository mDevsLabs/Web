import {
  AGENT_TOOL_FAMILIES,
  type AgentToolFamily,
  BASELINE_FAMILIES,
  detectFamiliesFromTask,
  familyForCategory,
} from "@/lib/agent/tools/selector/families";
import type { RegisteredAgentTool, ToolCategory } from "@/lib/agent/types";

// Sélection déterministe : coût et latence nuls, comportement prévisible et
// testable. Le routeur LLM (selector/llm-router.ts) n'intervient qu'au-dessus,
// et seulement si cette première passe signale une ambiguïté.

export type ToolSelectionMode = "auto" | "all" | "categories";

export type ToolSelectionContext = {
  capabilities: {
    files: boolean;
    tools: boolean;
  };
  enabledCategories: ToolCategory[] | null;
  mode: ToolSelectionMode;
  task: string;
  tools: RegisteredAgentTool[];
  userTier: string | null;
};

export type ToolSelectionResult = {
  families: AgentToolFamily[];
  reason: string;
  tools: RegisteredAgentTool[];
  uncertain: boolean;
};

function isToolAvailable(
  tool: RegisteredAgentTool,
  context: ToolSelectionContext
): boolean {
  const requires = tool.availability.requires;

  if (
    requires?.tools !== false &&
    requires?.tools &&
    !context.capabilities.tools
  ) {
    return false;
  }
  if (requires?.files && !context.capabilities.files) {
    return false;
  }

  const tiers = tool.availability.tiers;
  if (tiers && tiers !== "all") {
    const tier = (context.userTier ?? "free").toLowerCase().trim();
    if (!tiers.map((value) => value.toLowerCase()).includes(tier)) {
      return false;
    }
  }

  return true;
}

function isToolAllowedByUser(
  tool: RegisteredAgentTool,
  context: ToolSelectionContext
): boolean {
  const enabled = context.enabledCategories;
  if (!enabled || enabled.length === 0) {
    return true;
  }
  return enabled.includes(tool.category);
}

export function availableTools(
  context: ToolSelectionContext
): RegisteredAgentTool[] {
  return context.tools.filter(
    (tool) =>
      isToolAvailable(tool, context) && isToolAllowedByUser(tool, context)
  );
}

export function toolsForFamilies(params: {
  families: AgentToolFamily[];
  tools: RegisteredAgentTool[];
}): RegisteredAgentTool[] {
  if (params.families.length === 0) {
    return [];
  }
  const families = new Set(params.families);
  return params.tools.filter((tool) =>
    families.has(familyForCategory(tool.category))
  );
}

export function selectToolsByRules(
  context: ToolSelectionContext
): ToolSelectionResult {
  const available = availableTools(context);

  if (context.mode === "all") {
    return {
      families: uniqueFamilies(available),
      reason: "Tous les outils compatibles avec ce modèle ont été envoyés.",
      tools: available,
      uncertain: false,
    };
  }

  const detected = detectFamiliesFromTask(context.task);
  const enabledFamilies = new Set(uniqueFamilies(available));

  // Une famille détectée n'est retenue que si elle apporte au moins un outil
  // réellement disponible (modèle, forfait, filtres utilisateur).
  const matched = detected.filter((family) => enabledFamilies.has(family));
  const families =
    matched.length > 0
      ? matched
      : BASELINE_FAMILIES.filter((family) => enabledFamilies.has(family));

  const distinctEnabledFamilies = enabledFamilies.size;
  const uncertain =
    matched.length >= 3 ||
    (matched.length === 0 && distinctEnabledFamilies > 3) ||
    (matched.length >= 2 &&
      matched.includes("web") &&
      matched.includes("files") &&
      distinctEnabledFamilies > 4);

  return {
    families,
    reason:
      matched.length > 0
        ? `Familles déduites de la demande : ${families.join(", ")}.`
        : "Aucune intention explicite : sélection prudente par défaut.",
    tools: toolsForFamilies({ families, tools: available }),
    uncertain,
  };
}

export function uniqueFamilies(
  tools: RegisteredAgentTool[]
): AgentToolFamily[] {
  const families = new Set<AgentToolFamily>();
  for (const tool of tools) {
    families.add(familyForCategory(tool.category));
  }
  return AGENT_TOOL_FAMILIES.filter((family) => families.has(family));
}

export function isToolSelectionMode(
  value: unknown
): value is ToolSelectionMode {
  return value === "auto" || value === "all" || value === "categories";
}
