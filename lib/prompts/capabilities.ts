import { getAgentToolMetadata } from "@/lib/agent/tools/catalog";
import type { AgentPlan, ToolCategory } from "@/lib/agent/types";

// Contrat de capacités des prompts.
//
// Le prompt système ne doit jamais annoncer ce que le modèle ou la requête ne
// permettent pas. Un modèle sans tool calling ne reçoit AUCUNE section outil ; un
// run sans outil activé n'en reçoit pas non plus ; une mémoire saturée ne
// parle que de lecture. La source de vérité est ce contrat, rempli par l'appelant
// à partir de l'état RÉEL de la requête (plateau d'outils retenu par le serveur,
// contexte mémoire, pièces jointes, plan) — jamais une liste théorique.

// Un outil disponible, décrit pour le modèle : ce qu'il fait et son identifiant
// réel (celui qu'il devra renvoyer dans son appel).
export type PromptToolDescriptor = {
  description: string;
  id: string;
  // Sert à regrouper les outils externes dans leur propre section, avec des
  // consignes de robustesse adaptées.
  kind: PromptToolKind;
  label: string;
};

export type PromptToolKind = "mcp" | "native" | "plugin";

// Mémoire : ce qui est déjà retenu + la capacité à en ajouter.
export type PromptMemory = {
  block: string | null;
  writable: boolean;
};

export type PromptCapabilities = {
  /** Pièces jointes transmises avec le message (déjà inlinées dans le prompt). */
  attachments: number;
  /** Mémoire, ou `null` si elle n'est ni lisible ni modifiable ici. */
  memory: PromptMemory | null;
  /** Plan de travail du run. */
  plan: AgentPlan | null;
  /** Le modèle sait produire un raisonnement visible (provider compatible). */
  reasoning: boolean;
  /** Outils réellement disponibles pour CETTE requête. */
  tools: PromptToolDescriptor[];
  /**
   * Le modèle accepte-t-il des appels d'outils structurés ? C'est LA porte
   * d'entrée : à `false`, aucune section outil n'est produite, quelle que soit
   * la liste demandée.
   */
  toolsSupported: boolean;
};

export const EMPTY_PROMPT_CAPABILITIES: PromptCapabilities = {
  attachments: 0,
  memory: null,
  plan: null,
  reasoning: false,
  tools: [],
  toolsSupported: false,
};

/** Les outils ne sont exploitables que si le modèle sait les appeler. */
export function effectiveTools(
  input: PromptCapabilities
): PromptToolDescriptor[] {
  return input.toolsSupported ? input.tools : [];
}

/**
 * Détermine l'origine d'un outil. La catégorie du plateau serveur est la source
 * préférée ; à défaut, on retombe sur les conventions d'identifiant réellement
 * employées (`mcp_<serveur>_<outil>` côté Agent, `mcp…` et outils de plugin côté
 * Chat) plutôt que sur une liste figée.
 */
export function toolKindFor(tool: {
  category?: ToolCategory;
  id: string;
}): PromptToolKind {
  if (tool.category === "mcp") {
    return "mcp";
  }
  if (tool.category === "plugins") {
    return "plugin";
  }
  return tool.id.startsWith("mcp") ? "mcp" : "native";
}

/**
 * Construit la liste d'outils annoncée au modèle à partir du plateau réellement
 * retenu pour le run. Le libellé vient du catalogue (source unique) et non de
 * l'implémentation : le prompt décrit ce que l'outil FAIT, jamais son code.
 */
export function describeTools(
  tools: readonly { category?: ToolCategory; id: string }[]
): PromptToolDescriptor[] {
  return tools.map((tool) => {
    const meta = getAgentToolMetadata(tool.id);
    return {
      description: meta?.description ?? "Outil disponible pour cette tâche.",
      id: tool.id,
      kind: toolKindFor(tool),
      label: meta?.name ?? tool.id,
    };
  });
}

export function hasTool(input: PromptCapabilities, toolId: string): boolean {
  return effectiveTools(input).some((tool) => tool.id === toolId);
}
