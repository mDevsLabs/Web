import { convertToModelMessages, type ModelMessage } from "ai";
import type { ChatModel } from "@/lib/ai/models";
import { getModelCapabilitiesFor } from "@/lib/ai/registry";
import {
  CHAT_FALLBACK_FINAL_RESPONSE,
  createChatStreamControls,
} from "@/lib/chat/loop";
import {
  chatModelToolParams,
  describeChatTool,
  readToolDescription,
} from "@/lib/chat/tool-policy";
import type { DBMessage } from "@/lib/db/schema";
import { type PromptToolKind, toolKindFor } from "@/lib/prompts/capabilities";
import { convertToUIMessages } from "@/lib/utils";

// Contrat d'une exécution planifiée : le même plateau que le Chat
// (réparation, synthèse sans tool_choice, descriptions utiles), avec un
// plafond plus court parce que le tick n'a pas d'utilisateur en attente.
// Ce module reste pur : l'exécuteur journalise et persiste, les tests
// n'ont pas besoin de la base.

export const PLANNING_MAX_STEPS = 6;

export const PLANNING_EMPTY_RESULT_ERROR =
  "Aucun texte n'a été produit : l'exécution est en échec.";

export type PlanningToolLayer = "custom" | "mcp" | "native" | "plugin";

export type PlanningToolCollision = {
  dropped: PlanningToolLayer;
  id: string;
  kept: PlanningToolLayer;
};

export type MergedPlanningTools<T> = {
  collisions: PlanningToolCollision[];
  owners: ReadonlyMap<string, PlanningToolLayer>;
  tools: Record<string, T>;
};

export type AnnouncedPlanningTool = {
  description: string;
  id: string;
  kind: PromptToolKind;
};

export type PlanningExecutionOutcome =
  | { status: "completed"; text: string }
  | { lastError: string; status: "failed"; text: string };

export type PlanningGenerationStep = {
  toolCalls?: ReadonlyArray<{
    input?: unknown;
    toolCallId?: string;
    toolName?: string;
  }>;
  toolResults?: ReadonlyArray<{
    output?: unknown;
    toolCallId?: string;
    toolName?: string;
  }>;
};

export type PlanningMessagePart =
  | { text: string; type: "text" }
  | { type: "step-start" }
  | {
      input: unknown;
      output: unknown;
      state: "output-available";
      toolCallId: string;
      type: `tool-${string}`;
    };

export type PlanningHistoryMessage = {
  createdAt: Date;
  id: string;
  parts: unknown;
  role: string;
};

const LAYER_ORDER: readonly PlanningToolLayer[] = [
  "plugin",
  "custom",
  "mcp",
  "native",
];

/**
 * Fusionne les couches d'outils. Les natifs passent en dernier : un plugin
 * ou un serveur MCP qui réutilise leur identifiant est écarté, et la
 * collision est renvoyée pour être journalisée. Entre couches non natives,
 * le premier arrivé reste.
 */
export function mergePlanningTools<T>(layers: {
  custom: Record<string, T>;
  mcp: Record<string, T>;
  native: Record<string, T>;
  plugin: Record<string, T>;
}): MergedPlanningTools<T> {
  const tools: Record<string, T> = {};
  const owners = new Map<string, PlanningToolLayer>();
  const collisions: PlanningToolCollision[] = [];
  const records: Record<PlanningToolLayer, Record<string, T>> = {
    custom: layers.custom,
    mcp: layers.mcp,
    native: layers.native,
    plugin: layers.plugin,
  };

  for (const layer of LAYER_ORDER) {
    for (const [id, tool] of Object.entries(records[layer])) {
      const existing = owners.get(id);
      if (existing) {
        if (layer === "native") {
          tools[id] = tool;
          owners.set(id, "native");
          collisions.push({ dropped: existing, id, kept: "native" });
        } else {
          collisions.push({ dropped: layer, id, kept: existing });
        }
        continue;
      }
      tools[id] = tool;
      owners.set(id, layer);
    }
  }

  return { collisions, owners, tools };
}

export function announcePlanningTools(params: {
  hints: Readonly<Record<string, string>>;
  owners: ReadonlyMap<string, PlanningToolLayer>;
  toolIds: readonly string[];
  tools: Readonly<Record<string, unknown>>;
}): AnnouncedPlanningTool[] {
  const announced: AnnouncedPlanningTool[] = [];
  const seen = new Set<string>();

  for (const toolId of params.toolIds) {
    if (seen.has(toolId) || !(toolId in params.tools)) {
      continue;
    }
    seen.add(toolId);
    const description = describeChatTool(toolId, {
      hints: params.hints,
      toolDescription: readToolDescription(params.tools[toolId]),
    });
    if (!description) {
      continue;
    }
    const layer = params.owners.get(toolId);
    announced.push({
      description,
      id: toolId,
      kind: toolKindFor({
        category:
          layer === "mcp"
            ? "mcp"
            : layer === "plugin" || layer === "custom"
              ? "plugins"
              : undefined,
        id: toolId,
      }),
    });
  }

  return announced;
}

/**
 * `capabilities.tools` du catalogue reçu, jamais une heuristique sur le nom.
 * Un identifiant absent de cette liste n'a pas d'outils : le repli par nom
 * classerait Flint sans tool calling alors que `supported_parameters`
 * contient `tools`.
 */
export function planningToolsSupported(params: {
  modelId: string;
  models: readonly ChatModel[];
}): boolean {
  if (!params.models.some((model) => model.id === params.modelId)) {
    return false;
  }
  return getModelCapabilitiesFor(params.modelId, [...params.models]).tools;
}

export function planningModelToolParams(params: {
  activeIds: readonly string[];
  tools: Record<string, unknown>;
  toolsSupported: boolean;
}):
  | { activeTools: string[]; tools: Record<string, any> }
  | Record<string, never> {
  if (!params.toolsSupported) {
    return {};
  }
  return chatModelToolParams(params.tools, params.activeIds) as
    | { activeTools: string[]; tools: Record<string, any> }
    | Record<string, never>;
}

export function createPlanningLoopControls(params: {
  instructions: string;
  supportsTools: boolean;
}) {
  return createChatStreamControls({
    instructions: params.instructions,
    maxSteps: PLANNING_MAX_STEPS,
    supportsTools: params.supportsTools,
  });
}

/**
 * Texte vide : échec explicite. Le message enregistré est le repli du Chat,
 * jamais une phrase de succès. Un texte utile clôt l'exécution.
 */
export function planningExecutionOutcome(
  text: string
): PlanningExecutionOutcome {
  if (text.trim().length === 0) {
    return {
      lastError: PLANNING_EMPTY_RESULT_ERROR,
      status: "failed",
      text: CHAT_FALLBACK_FINAL_RESPONSE,
    };
  }
  return { status: "completed", text };
}

/**
 * Parties persistées pour l'occurrence suivante.
 *
 * Un `step-start` sépare les étapes : sans lui, `convertToModelMessages`
 * regrouperait tous les appels dans un seul message et le modèle verrait
 * la synthèse avant les résultats. Le texte visible est celui du verdict
 * (réponse du modèle, ou repli en cas d'échec).
 */
export function planningAssistantParts(params: {
  steps: readonly PlanningGenerationStep[];
  text: string;
}): PlanningMessagePart[] {
  const parts: PlanningMessagePart[] = [];

  for (const step of params.steps) {
    const toolParts = toolPartsFromStep(step);
    if (toolParts.length === 0) {
      continue;
    }
    if (parts.length > 0) {
      parts.push({ type: "step-start" });
    }
    parts.push(...toolParts);
  }

  const text = params.text.trim();
  if (text.length > 0) {
    if (parts.length > 0) {
      parts.push({ type: "step-start" });
    }
    parts.push({ text, type: "text" });
  }

  return parts;
}

function toolPartsFromStep(
  step: PlanningGenerationStep
): PlanningMessagePart[] {
  const results = new Map<string, { output: unknown; toolName: string }>();
  for (const result of step.toolResults ?? []) {
    if (!result.toolCallId) {
      continue;
    }
    results.set(result.toolCallId, {
      output: result.output ?? null,
      toolName: result.toolName ?? "",
    });
  }

  const parts: PlanningMessagePart[] = [];
  for (const call of step.toolCalls ?? []) {
    const toolName = call.toolName?.trim();
    const toolCallId = call.toolCallId?.trim();
    if (!toolName || !toolCallId) {
      continue;
    }
    const result = results.get(toolCallId);
    if (!result) {
      continue;
    }
    parts.push({
      input: call.input ?? null,
      output: result.output,
      state: "output-available",
      toolCallId,
      type: `tool-${toolName}`,
    });
  }
  return parts;
}

const HISTORY_ROLES = new Set(["assistant", "system", "user"]);

/**
 * Historique envoyé au modèle : parties outil comprises. Le prompt de cette
 * occurrence est ajouté à la fin, il n'est pas encore dans les lignes lues.
 */
export async function toPlanningModelMessages(params: {
  messages: readonly PlanningHistoryMessage[];
  prompt: string;
}): Promise<ModelMessage[]> {
  const history = params.messages.flatMap((message) => {
    if (!HISTORY_ROLES.has(message.role) || !Array.isArray(message.parts)) {
      return [];
    }
    if (message.parts.length === 0) {
      return [];
    }
    return [
      {
        attachments: [],
        chatId: "planning",
        createdAt: message.createdAt,
        id: message.id,
        parts: message.parts,
        role: message.role,
      } satisfies DBMessage,
    ];
  });

  const uiMessages = convertToUIMessages(history);
  uiMessages.push({
    id: "planning-prompt",
    metadata: { createdAt: new Date().toISOString() },
    parts: [{ text: params.prompt, type: "text" }],
    role: "user",
  });

  return convertToModelMessages(uiMessages);
}
