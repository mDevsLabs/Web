import { randomUUID } from "node:crypto";
import { streamText } from "ai";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { getLanguageModel } from "@/lib/ai/providers";
import { errorResponse } from "@/lib/api/error-response";
import { isPaidTier } from "@/lib/auth/plan";
import { getPersistedTier } from "@/lib/db/users";
import { timingSafeCompare } from "@/lib/security/timing";
import {
  addTaskEvent,
  appendMessages,
  claimDueTask,
  failTask,
  findConversation,
  findWakie,
  finishTask,
  listMessages,
  listUsersWithWakies,
  taskConversation,
} from "@/lib/wakies/queries";

/**
 * ============================================================================
 * GET /api/cron/wakies — tick des tâches planifiées
 * ============================================================================
 *
 * POURQUOI UNE ROUTE ET PAS UN `setInterval`
 *
 * Le gabarit exécutait ses tâches dans un `setInterval` du process Node
 * (`Runner`). Dans l'hôte, ce process est éphémère : il n'existe que le temps
 * d'une requête, se réveille pour une conversation et se rendort. Une boucle
 * locale n'y aurait jamais son tick — et sur Vercel, aucun intervalle ne survit
 * à l'extinction d'une instance. La planification passe donc par le même
 * mécanisme que l'Agent et la planification mAI : une route cron.
 *
 * Ce qu'elle change, et qui compte :
 *
 *   - une tâche est EXÉCUTÉE pour le compte concerné, dans la conversation
 *     qu'elle a créée ;
 *   - le résultat est écrit comme un message de cette conversation — donc
 *     lisible là où l'utilisateur a créé la tâche, et pas dans un journal ;
 *   - le bail (`lease`, `leaseUntil`) est posé dans une transaction : deux ticks
 *     concurrents ne peuvent pas exécuter la même tâche.
 *
 * AUTHENTIFICATION : identique aux autres routes cron de l'hôte — `CRON_SECRET`
 * par en-tête uniquement, fail-closed en production.
 */

export const maxDuration = 300;

async function isAuthorized(request: Request): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const enTete = request.headers.get("authorization");
    const secret = request.headers.get("x-cron-secret");
    return (
      timingSafeCompare(enTete, `Bearer ${cronSecret}`) ||
      timingSafeCompare(secret, cronSecret)
    );
  }
  if (process.env.NODE_ENV === "production") {
    console.error("[cron/wakies] CRON_SECRET manquant en production — refusé");
    return false;
  }
  return true;
}

export async function GET(request: Request) {
  if (!(await isAuthorized(request))) {
    return errorResponse("auth_required", { message: "Non autorisé." });
  }

  const comptes = await listUsersWithWakies();
  const resumes: { taskId: string; userId: string }[] = [];
  const echecs: { taskId: string; message: string; userId: string }[] = [];

  for (const userId of comptes) {
    const persisted = await getPersistedTier({ userId }).catch(() => null);
    if (!persisted?.ok || !isPaidTier(persisted.tier)) {
      continue;
    }

    for (let tour = 0; tour < 3; tour++) {
      const claim = await claimDueTask(userId);
      if (!claim) {
        break;
      }
      try {
        const conversationId = await taskConversation(claim.task.id);
        if (!conversationId) {
          throw new Error(
            "Cette tâche n'est liée à aucune conversation. Recréez-la depuis une conversation."
          );
        }
        const conversation = await findConversation(userId, conversationId);
        const wakie = conversation
          ? await findWakie(userId, conversation.wakieId)
          : null;
        if (!conversation || !wakie) {
          throw new Error("Conversation ou Wakie introuvable.");
        }
        if (!wakie.researchAllowed) {
          throw new Error("La recherche est désactivée pour ce Wakie.");
        }
        const historique = await listMessages(userId, conversationId);
        const texte = await runTurn({
          conversationId,
          historique,
          model: getLanguageModel(DEFAULT_CHAT_MODEL),
          prompt: claim.task.prompt,
        });
        await appendMessages(userId, [
          {
            conversationId,
            id: `wakies-task-${claim.lease}`,
            parts: [{ text: texte, type: "text" }],
            role: "assistant",
          },
        ]);
        await finishTask(claim.task.id, claim.lease, {
          sample: false,
          sources: [],
          text: texte,
        });
        resumes.push({ taskId: claim.task.id, userId });
      } catch (erreur) {
        const message =
          erreur instanceof Error ? erreur.message : "Erreur inconnue.";
        await addTaskEvent(claim.task.id, message, claim.lease);
        await failTask(claim.task.id, claim.lease, message);
        echecs.push({ message, taskId: claim.task.id, userId });
      }
    }
  }

  return Response.json({
    echecs,
    resumes,
    traites: resumes.length + echecs.length,
    worker: `cron-${randomUUID().slice(0, 8)}`,
  });
}

/**
 * Un tour de recherche, sans flux : la tâche doit produire un RÉSULTAT complet,
 * pas un texte progressif que personne ne lit. Une réponse tronquée est une
 * tâche ratée, pas une tâche à moitié faite.
 */
async function runTurn(params: {
  conversationId: string;
  historique: { parts: unknown; role: string }[];
  model: ReturnType<typeof getLanguageModel>;
  prompt: string;
}): Promise<string> {
  const source = [
    "Tu exécutes une tâche planifiée. Produis un brief court et factuel en français,",
    " appuyé sur ce que tu sais. Si tu n'as pas de fait frais, dis-le clairement.",
  ].join(" ");

  const reprise = contexte(params.historique)
    .map((partie) => partie.text)
    .join("\n");

  const result = await streamText({
    messages: [
      { content: reprise ? `${source}\n\n${reprise}` : source, role: "system" },
      { content: params.prompt, role: "user" },
    ],
    model: params.model,
  });

  return (await result.text).trim() || "Aucune conclusion.";
}

/** Les six derniers tours, pour que la tâche s'insère dans l'échange. */
function contexte(
  historique: { parts: unknown; role: string }[]
): { text: string; type: "text" }[] {
  const sorties: { text: string; type: "text" }[] = [];
  for (const message of historique.slice(-6)) {
    const parts = Array.isArray(message.parts) ? message.parts : [];
    const texte = parts
      .map((partie) => {
        const p = partie as { type?: string; text?: string };
        return p?.type === "text" ? (p.text ?? "") : "";
      })
      .join("")
      .trim();
    if (!texte) {
      continue;
    }
    const prefixe = message.role === "user" ? "Utilisateur" : "Wakie";
    sorties.push({ text: `${prefixe} : ${texte}`, type: "text" });
  }
  return sorties;
}
