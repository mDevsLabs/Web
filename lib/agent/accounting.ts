import "server-only";

import { readReasoningTokens, resolveBillableTotal } from "@/lib/agent/usage";
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
  // Conversation porteuse du run (migration 0033). `AgentRun.chatId` est NOT
  // NULL, donc la valeur est toujours connue du runtime ; elle reste
  // facultative dans la signature parce que le sélecteur de modèle et le
  // routeur LLM dédupliquent leur comptage et peuvent être appelés avant que
  // le run ne soit attaché à une conversation.
  chatId?: string | null;
  // Projet effectif du run. Un run Agent est TOUJOURS de mode `agent`, le mode
  // est donc connu sans lecture (migration 0035) ; le projet, lui, vient du
  // contexte d'exécution.
  projectId?: string | null;
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
    chatId: params.chatId ?? null,
    // Attribution figée à l'écriture (migration 0035) : un run Agent ne peut
    // être qu'en mode `agent`, et son projet vient du contexte. Les filtres
    // « mode » et « projet » de la page Statistiques lisent ces colonnes, donc
    // ils continuent de fonctionner après la suppression de la conversation.
    chatMode: params.chatId ? "agent" : null,
    chatProjectId: params.projectId ?? null,
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

  return { inputTokens, outputTokens, reasoningTokens, totalTokens };
}
