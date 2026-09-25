import "server-only";

import { MAI_API_URL } from "@/lib/constants";
import { recordTokenUsage } from "@/lib/db/queries";

// Décompte des tokens : Agent réutilise exactement le quota hebdomadaire du
// Chat (décision de plan). Aucune donnée sensible n'est transmise : uniquement
// les compteurs de tokens et le modèle.

export type AgentUsageTotals = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export async function recordAgentUsage(params: {
  model: string;
  sessionToken: string;
  usage: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  } | null;
  idempotencyKey?: string;
  userEmail: string;
  userId: string;
}): Promise<AgentUsageTotals> {
  const inputTokens = params.usage?.inputTokens ?? 0;
  const outputTokens = params.usage?.outputTokens ?? 0;
  const totalTokens = params.usage?.totalTokens ?? inputTokens + outputTokens;

  if (totalTokens <= 0) {
    return { inputTokens, outputTokens, totalTokens };
  }

  await recordTokenUsage({
    idempotencyKey: params.idempotencyKey,
    inputTokens,
    isGhostMode: false,
    model: params.model,
    outputTokens,
    totalTokens,
    userEmail: params.userEmail,
    userId: params.userId,
  }).catch((error: unknown) => {
    console.warn(
      JSON.stringify({
        event: "agent_usage_persist_failed",
        message: error instanceof Error ? error.message : "unknown",
        userId: params.userId,
      })
    );
  });

  // Notification best-effort de l'endpoint de journalisation amont.
  try {
    await fetch(`${MAI_API_URL}/log-usage`, {
      body: JSON.stringify({
        inputTokens,
        isGhostMode: false,
        model: params.model,
        outputTokens,
        tokensUsed: totalTokens,
      }),
      headers: {
        Authorization: `Bearer ${params.sessionToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // Le décompte local a déjà été appliqué : un échec de journalisation ne
    // doit jamais interrompre un run.
  }

  return { inputTokens, outputTokens, totalTokens };
}
