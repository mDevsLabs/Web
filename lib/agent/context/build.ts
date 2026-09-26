import "server-only";

import type { ModelMessage } from "ai";
import {
  buildCompactedMessages,
  estimateTokens,
  messagesBeyondBudget,
  summarizeContext,
  tokenBudgetFor,
  trimToKeepRecent,
} from "@/lib/agent/context/compaction";
import {
  type AgentAttachment,
  attachmentsInstructions,
} from "@/lib/agent/context/files";
import type { AgentProjectContext } from "@/lib/agent/context/project";
import type {
  AgentAutonomy,
  AgentPlan,
  ReasoningLevel,
} from "@/lib/agent/types";
import { buildAgentSystemPrompt } from "@/lib/prompts/agent";
import type { PromptToolDescriptor } from "@/lib/prompts/capabilities";

// ContextBuilder : construit exactement ce qui part au modèle — instructions
// ciblées et messages dans le budget. Ni tout l'historique, ni tous les
// fichiers, ni tout le projet ; la compaction n'affecte jamais l'affichage.
//
// Le prompt, lui, est composé par lib/prompts/ à partir de ce que la requête
// permet RÉELLEMENT (voir PromptCapabilities). Ce module ne décide plus du
// texte : il décide seulement de ce qui est envoyé, et dans quel budget.

export type AgentContextInput = {
  assistantInstructions: string | null;
  attachments: AgentAttachment[];
  autonomy: AgentAutonomy;
  /** Consignes de cette conversation : one-shot, reprise, surcharge locale. */
  chatInstructions: string | null;
  contextWindow: number | null;
  /** Mémoire fusionnée (utilisateur + projet), ou null si inaccessible. */
  memoryBlock: string | null;
  /** L'utilisateur peut-il encore ajouter des mémoires (quota de forfait) ? */
  memoryWritable: boolean;
  messages: ModelMessage[];
  plan: AgentPlan | null;
  project: AgentProjectContext;
  /** Le modèle sait-il produire un raisonnement visible ? */
  reasoningSupported: boolean;
  reasoningLevel: ReasoningLevel;
  sessionToken: string;
  skillInstructions: string | null;
  task: string;
  /** Outils réellement disponibles pour ce run. */
  tools: PromptToolDescriptor[];
  /** Le modèle accepte-t-il des appels d'outils structurés ? */
  toolsSupported: boolean;
  userId: string;
  userInstructions: string | null;
};

export type AgentContextResult = {
  compacted: boolean;
  estimatedTokens: number;
  instructions: string;
  messages: ModelMessage[];
  tokenBudget: number;
};

export async function buildAgentContext(
  input: AgentContextInput
): Promise<AgentContextResult> {
  const projectBlock = input.project.resourcesBlock
    ? `${input.project.resourcesBlock}${
        input.project.memories.length > 0
          ? `\n\nÉléments retenus liés au projet :\n${input.project.memories.join("\n")}`
          : ""
      }`
    : input.project.memories.length > 0
      ? `Éléments retenus liés au projet :\n${input.project.memories.join("\n")}`
      : null;

  const attachmentsBlock = attachmentsInstructions(input.attachments);
  const memoryBlocks = [
    input.memoryBlock,
    projectBlock,
    attachmentsBlock,
  ].filter((block): block is string => Boolean(block));

  const instructions = buildAgentSystemPrompt({
    assistantInstructions: input.assistantInstructions,
    autonomy: input.autonomy,
    capabilities: {
      attachments: input.attachments.length,
      memory: input.memoryBlock
        ? { block: memoryBlocks.join("\n\n"), writable: input.memoryWritable }
        : null,
      plan: input.plan,
      reasoning: input.reasoningSupported,
      tools: input.tools,
      toolsSupported: input.toolsSupported,
    },
    chatInstructions: input.chatInstructions,
    projectInstructions: input.project.instructions,
    requestHints: null,
    skillInstructions: input.skillInstructions,
    userInstructions: input.userInstructions,
  });

  const tokenBudget = tokenBudgetFor(input.contextWindow);
  const overBudget = messagesBeyondBudget({
    contextWindow: input.contextWindow,
    instructions,
    messages: input.messages,
  });

  if (!overBudget) {
    return {
      compacted: false,
      estimatedTokens: estimateTokens({
        instructions,
        messages: input.messages,
      }),
      instructions,
      messages: input.messages,
      tokenBudget,
    };
  }

  const summary = await summarizeContext({
    messages: input.messages,
    sessionToken: input.sessionToken,
    task: input.task,
    userId: input.userId,
  });

  const messages = summary
    ? buildCompactedMessages({ messages: input.messages, summary })
    : trimToKeepRecent({ messages: input.messages });

  return {
    compacted: true,
    estimatedTokens: estimateTokens({ instructions, messages }),
    instructions,
    messages,
    tokenBudget,
  };
}
