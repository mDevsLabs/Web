import "server-only";

import { readReasoningTokens, resolveBillableTotal } from "@/lib/agent/usage";
import { recordTokenUsage } from "@/lib/db/queries/chats";

export async function recordPageTokenUsage(params: {
  model: string;
  projectId: string | null;
  sessionToken: string | null;
  usage: {
    inputTokens?: number;
    outputTokens?: number;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  usageEventKey: string;
  userEmail?: string | null;
  userId: string;
}) {
  const inputTokens =
    params.usage.inputTokens ?? params.usage.promptTokens ?? 0;
  const outputTokens =
    params.usage.outputTokens ?? params.usage.completionTokens ?? 0;
  const reasoningTokens = readReasoningTokens(params.usage);
  const totalTokens = resolveBillableTotal({
    inputTokens,
    outputTokens,
    reasoningTokens,
    totalTokens: params.usage.totalTokens ?? 0,
  });
  if (totalTokens <= 0) {
    return;
  }
  await recordTokenUsage({
    chatId: null,
    chatMode: "chat",
    chatProjectId: params.projectId,
    idempotencyKey: params.usageEventKey,
    inputTokens,
    model: params.model,
    outputTokens,
    reasoningTokens,
    totalTokens,
    userEmail: params.userEmail,
    userId: params.userId,
  });
}
