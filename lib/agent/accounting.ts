import "server-only";

import { readReasoningTokens, resolveBillableTotal } from "@/lib/agent/usage";
import { upstreamJson } from "@/lib/api/upstream";
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

  // Noter `chatId` (migration 0033) n'a de sens que pour les appelants qui
  // fournissent une `idempotencyKey` : `recordTokenUsage` n'insère une ligne
  // `UsageEvent` que dans ce cas. Le sélecteur de modèle, le routeur LLM et la
  // compaction de contexte appellent bien `recordAgentUsage`, mais SANS clé —
  // ils débitent le quota hebdomadaire et ne laissent aucune ligne événementielle.
  // Leur consommation n'apparaît donc dans aucune série de la page Statistiques,
  // par construction ; le commenter évite qu'on leur ajoute un `chatId` en
  // croyant améliorer la restitution.
  //
  // Notification best-effort de l'endpoint de journalisation amont. Le total
  // part déjà décomposé : le proxy ne doit pas recomposer et risquer un double
  // comptage de la réflexion.
  try {
    await upstreamJson({
      body: {
        inputTokens,
        isGhostMode: false,
        model: params.model,
        outputTokens,
        reasoningTokens,
        tokensUsed: totalTokens,
      },
      method: "POST",
      path: "/log-usage",
      timeoutMs: 3000,
      token: params.sessionToken,
    });
  } catch {
    // Le décompte local a déjà été appliqué : un échec de journalisation ne
    // doit jamais interrompre un run.
  }

  return { inputTokens, outputTokens, reasoningTokens, totalTokens };
}
