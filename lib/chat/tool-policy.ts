// Qui a le droit d'être annoncé au modèle, et donc instancié.
//
// Le prompt et `streamText` lisaient deux listes différentes : le mode fantôme
// retirait `audioGenerate` du texte mais laissait `audioPodcast`, et un modèle
// sans tool calling recevait quand même tout le plateau parce qu'`activeTools`
// absent signifie « tous les outils » pour le SDK. Cette fonction est la seule
// liste. Elle est client-safe : le menu fantôme s'en sert aussi.

import { isNativeToolId } from "@/lib/ai/tools/ids";

export const GHOST_EXCLUDED_CHAT_TOOL_IDS = [
  "imageGenerate",
  "audioGenerate",
  "audioPodcast",
  "updateAccountProfile",
  "updateProfilePicture",
] as const;

export type GhostExcludedChatToolId =
  (typeof GHOST_EXCLUDED_CHAT_TOOL_IDS)[number];

const GHOST_EXCLUDED_SET: ReadonlySet<string> = new Set(
  GHOST_EXCLUDED_CHAT_TOOL_IDS
);

/** Audio de compte : sans jeton de session, l'exécution échoue. */
const SESSION_BOUND_CHAT_TOOL_IDS = ["audioGenerate", "audioPodcast"] as const;

const SESSION_BOUND_SET: ReadonlySet<string> = new Set(
  SESSION_BOUND_CHAT_TOOL_IDS
);

export const ARTIFACT_CHAT_TOOL_IDS = [
  "createDocument",
  "editDocument",
  "updateDocument",
  "requestSuggestions",
] as const;

const ARTIFACT_SET: ReadonlySet<string> = new Set(ARTIFACT_CHAT_TOOL_IDS);

export const GHOST_EXCLUDED_CHAT_TOOL_MESSAGE: Record<
  GhostExcludedChatToolId,
  string
> = {
  audioGenerate: "La synthèse vocale est indisponible en Mode fantôme",
  audioPodcast: "Le podcast audio est indisponible en Mode fantôme",
  imageGenerate: "La génération d'image est indisponible en Mode fantôme",
  updateAccountProfile:
    "La modification de profil est indisponible en Mode fantôme",
  updateProfilePicture:
    "Le changement de photo de profil est indisponible en Mode fantôme",
};

/** Phrases qui ne disent rien au modèle : elles ne doivent plus être émises. */
export const GENERIC_TOOL_DESCRIPTIONS = [
  "Outil disponible pour cet échange.",
  "Outil disponible pour cette tâche.",
] as const;

const GENERIC_DESCRIPTION_SET: ReadonlySet<string> = new Set(
  GENERIC_TOOL_DESCRIPTIONS
);

export type ChatToolEligibility = {
  /** Jeton de session non vide. Les outils audio en dépendent. */
  hasSessionToken: boolean;
  isGhostMode: boolean;
  /** Mémoire lisible pour cette requête (`ghostMemoryEnabled` compris). */
  memoryActive: boolean;
  /** `capabilities.tools` du catalogue, jamais une heuristique sur le nom. */
  toolsSupported: boolean;
};

export type AnnouncedChatTool = {
  description: string;
  id: string;
};

export type ResolveActiveChatToolsInput = {
  customPluginIds: readonly string[];
  eligibility: ChatToolEligibility;
  hints: Readonly<Record<string, string>>;
  installedPluginToolIds: readonly string[];
  mcpEnabled: boolean;
  mcpToolIds: readonly string[];
  requestedIds: readonly string[];
  tools: Readonly<Record<string, unknown>>;
};

export function isGhostExcludedChatTool(
  toolId: string
): toolId is GhostExcludedChatToolId {
  return GHOST_EXCLUDED_SET.has(toolId);
}

export function isChatToolEligible(
  toolId: string,
  eligibility: ChatToolEligibility
): boolean {
  if (!eligibility.toolsSupported) {
    return false;
  }
  if (eligibility.isGhostMode && isGhostExcludedChatTool(toolId)) {
    return false;
  }
  if (!eligibility.hasSessionToken && SESSION_BOUND_SET.has(toolId)) {
    return false;
  }
  if (toolId === "memory" && !eligibility.memoryActive) {
    return false;
  }
  return true;
}

export function hasArtifactChatTool(toolIds: readonly string[]): boolean {
  return toolIds.some((toolId) => ARTIFACT_SET.has(toolId));
}

export function isGenericToolDescription(text: string): boolean {
  return GENERIC_DESCRIPTION_SET.has(text.trim());
}

export function readToolDescription(tool: unknown): string | null {
  if (!tool || typeof tool !== "object") {
    return null;
  }
  const description = (tool as { description?: unknown }).description;
  return typeof description === "string" ? description : null;
}

/**
 * Hint du catalogue d'abord, puis la description portée par l'objet outil.
 * `null` si aucune des deux n'est une phrase spécifique : l'outil n'est pas
 * annoncé, plutôt que d'être présenté par une formule vide.
 */
export function describeChatTool(
  toolId: string,
  options: {
    hints: Readonly<Record<string, string>>;
    toolDescription?: string | null;
  }
): string | null {
  const hint = specificDescription(toolId, options.hints[toolId]);
  if (hint) {
    return hint;
  }
  return specificDescription(toolId, options.toolDescription);
}

function specificDescription(
  toolId: string,
  text: string | null | undefined
): string | null {
  const value = text?.trim() ?? "";
  if (!value || value === toolId || isGenericToolDescription(value)) {
    return null;
  }
  return value;
}

function isMcpToolId(toolId: string): boolean {
  return (
    toolId === "mcp" || toolId.startsWith("mcp_") || toolId.startsWith("mcp:")
  );
}

/**
 * Liste unique des outils de CET échange.
 *
 * Candidats : outils demandés (menu, skills), outils de lecture des plugins
 * installés, clés MCP exécutables, plugins OAuth personnels. Ensuite trois
 * retraits : inéligible (modèle, fantôme, session, mémoire), absent de l'objet
 * instancié, ou sans description utile. `toolsSupported` faux vide la liste,
 * plugins et MCP compris.
 */
export function resolveActiveChatTools(
  input: ResolveActiveChatToolsInput
): AnnouncedChatTool[] {
  if (!input.eligibility.toolsSupported) {
    return [];
  }

  const installed = new Set(input.installedPluginToolIds);
  const mcpKeys = new Set(input.mcpToolIds);
  const custom = new Set(input.customPluginIds);
  const ordered: string[] = [];
  const seen = new Set<string>();
  const push = (toolId: string) => {
    if (seen.has(toolId)) {
      return;
    }
    seen.add(toolId);
    ordered.push(toolId);
  };

  for (const toolId of input.requestedIds) {
    if (isMcpToolId(toolId)) {
      if (mcpKeys.has(toolId)) {
        push(toolId);
      }
      continue;
    }
    if (installed.has(toolId) || custom.has(toolId) || isNativeToolId(toolId)) {
      push(toolId);
    }
  }

  if (input.mcpEnabled) {
    for (const toolId of input.mcpToolIds) {
      push(toolId);
    }
  }

  for (const toolId of input.customPluginIds) {
    push(toolId);
  }

  const announced: AnnouncedChatTool[] = [];
  for (const toolId of ordered) {
    if (!isChatToolEligible(toolId, input.eligibility)) {
      continue;
    }
    if (!(toolId in input.tools)) {
      continue;
    }
    const description = describeChatTool(toolId, {
      hints: input.hints,
      toolDescription: readToolDescription(input.tools[toolId]),
    });
    if (!description) {
      continue;
    }
    announced.push({ description, id: toolId });
  }
  return announced;
}

/**
 * Paramètres `tools` / `activeTools` de `streamText`.
 *
 * Une liste vide omet les deux clés. `activeTools: undefined` réactiverait
 * chaque entrée de `tools`, y compris celles que la sélection a exclues.
 * Les deux tableaux portent les mêmes identifiants.
 */
export function chatModelToolParams(
  tools: Record<string, unknown> | undefined,
  activeToolsList: readonly string[]
):
  | { activeTools: string[]; tools: Record<string, unknown> }
  | Record<string, never> {
  if (!tools || activeToolsList.length === 0) {
    return {};
  }
  const picked: Record<string, unknown> = {};
  const ids: string[] = [];
  for (const toolId of activeToolsList) {
    if (!(toolId in tools) || ids.includes(toolId)) {
      continue;
    }
    picked[toolId] = tools[toolId];
    ids.push(toolId);
  }
  if (ids.length === 0) {
    return {};
  }
  return { activeTools: ids, tools: picked };
}
