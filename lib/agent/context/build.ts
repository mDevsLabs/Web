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
import { agentInstructions } from "@/lib/agent/prompts";
import type { AgentToolFamily } from "@/lib/agent/tools/selector/families";
import type {
  AgentAutonomy,
  AgentPlan,
  ReasoningLevel,
} from "@/lib/agent/types";

// ContextBuilder : construit exactement ce qui part au modèle — instructions
// ciblées et messages dans le budget. Ni tout l'historique, ni tous les
// fichiers, ni tout le projet ; la compaction n'affecte jamais l'affichage.

export type AgentContextInput = {
  attachments: AgentAttachment[];
  autonomy: AgentAutonomy;
  chatInstructions: string | null;
  contextWindow: number | null;
  families: AgentToolFamily[];
  memoryBlock: string | null;
  messages: ModelMessage[];
  plan: AgentPlan | null;
  project: AgentProjectContext;
  reasoningLevel: ReasoningLevel;
  sessionToken: string;
  skillInstructions: string | null;
  task: string;
  userId: string;
  assistantInstructions: string | null;
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

  const instructions = agentInstructions({
    assistantInstructions: input.assistantInstructions,
    autonomy: input.autonomy,
    chatInstructions: input.chatInstructions,
    families: input.families,
    memoryBlock: [
      input.memoryBlock,
      projectBlock,
      attachmentsInstructions(input.attachments),
    ]
      .filter(Boolean)
      .join("\n\n"),
    plan: input.plan,
    projectInstructions: input.project.instructions,
    reasoningLevel: input.reasoningLevel,
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
