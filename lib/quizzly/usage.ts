/**
 * Décompte du Coach sur le quota hebdomadaire du chat.
 *
 * Une réponse du Coach est un appel de modèle : elle consomme le même
 * quota qu'un message, sinon le Coach serait un second plafond invisible.
 */

import "server-only";

import { readReasoningTokens, resolveBillableTotal } from "@/lib/agent/usage";
import { MAI_API_URL } from "@/lib/constants";
import { recordTokenUsage } from "@/lib/db/queries/chats";

export async function enregistrerUsageCoach(params: {
  model: string;
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
    chatProjectId: null,
    idempotencyKey: params.usageEventKey,
    inputTokens,
    model: params.model,
    outputTokens,
    reasoningTokens,
    totalTokens,
    userEmail: params.userEmail,
    userId: params.userId,
  });
  if (!params.sessionToken) {
    return;
  }
  try {
    const logRes = await fetch(`${MAI_API_URL}/log-usage`, {
      body: JSON.stringify({
        inputTokens,
        isGhostMode: false,
        model: params.model,
        outputTokens,
        reasoningTokens,
        tokensUsed: totalTokens,
      }),
      headers: {
        Authorization: `Bearer ${params.sessionToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    if (!logRes.ok) {
      console.error("[quizzly][coach][log-usage]", logRes.status);
    }
  } catch (error) {
    console.error("[quizzly][coach][log-usage]", error);
  }
}
