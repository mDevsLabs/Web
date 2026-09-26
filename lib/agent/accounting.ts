import "server-only";

import { readReasoningTokens, resolveBillableTotal } from "@/lib/agent/usage";
import { MAI_API_URL } from "@/lib/constants";
import { recordTokenUsage } from "@/lib/db/queries";

// Décompte des tokens : Agent réutilise exactement le quota hebdomadaire du
// Chat (décision de plan). Aucune donnée sensible n'est transmise : uniquement
// les compteurs de tokens et le modèle.

export type AgentUsageTotals = {
  inputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  totalTokens: number;
};

export async function recordAgentUsage(params: {
  model: string;
  sessionToken: string;
  usage: Record<string, unknown> | null;
  idempotencyKey?: string;
  userEmail: string;
  userId: string;
}): Promise<AgentUsageTotals> {
  const usage = params.usage ?? {};
  const inputTokens =
    typeof usage.inputTokens === "number" ? usage.inputTokens : 0;
  const outputTokens =
    typeof usage.outputTokens === "number" ? usage.outputTokens : 0;
  // L'AI SDK sort déjà la réflexion de `outputTokens` (text = completion −
  // reasoning). La règle de total sans double comptage est partagée avec
  // lib/db/queries.ts : une seule implémentation, sinon les deux chemins
  // divergent sur les fournisseurs qui comptent la réflexion dans la sortie.
  const reasoningTokens = readReasoningTokens(usage);
  const totalTokens = resolveBillableTotal({
    inputTokens,
    outputTokens,
    reasoningTokens,
    totalTokens: typeof usage.totalTokens === "number" ? usage.totalTokens : 0,
  });

  if (totalTokens <= 0) {
    return { inputTokens, outputTokens, reasoningTokens, totalTokens };
  }

  await recordTokenUsage({
    idempotencyKey: params.idempotencyKey,
    inputTokens,
    isGhostMode: false,
    model: params.model,
    outputTokens,
    reasoningTokens,
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

  // Notification best-effort de l'endpoint de journalisation amont. Le total
  // part déjà décomposé : le proxy ne doit pas recomposer et risquer un double
  // comptage de la réflexion.
  try {
    await fetch(`${MAI_API_URL}/log-usage`, {
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
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // Le décompte local a déjà été appliqué : un échec de journalisation ne
    // doit jamais interrompre un run.
  }

  return { inputTokens, outputTokens, reasoningTokens, totalTokens };
}
