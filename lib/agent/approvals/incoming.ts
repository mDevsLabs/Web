import "server-only";

import { z } from "zod";
import type { ApprovalRequestRecord } from "@/lib/agent/db-schema";
import { paramsHashOf } from "@/lib/agent/params-hash";
import { getAgentToolLabel } from "@/lib/agent/tools/catalog";
import {
  decideApprovalRequest,
  expireApprovalRequestById,
  getApprovalRequestByToolCall,
} from "@/lib/db/agent-foundation-queries";
import { updateAgentStep } from "@/lib/db/agent-queries";

// Application des décisions d'approbation portées par les messages entrants.
//
// Protocole : le SDK annonce une demande d'approbation (part d'appel d'outil
// marquée `approval.id`) ; l'utilisateur décide côté client ; le SDK rejoue
// ensuite la requête avec le même appel marqué `approval.approved`. Le serveur
// relit donc la décision DANS les messages, la rattache à l'appel d'outil exact
// (toolCallId) et à la demande persistée du run, puis n'applique l'accord que
// si les paramètres présentés n'ont pas changé depuis.
//
// La base reste la seule autorité : `needsApproval` consulte ensuite la
// décision persistée à chaque appel, et le contrôleur revérifie l'empreinte des
// paramètres avant d'exécuter. Rien ici ne dépend du nom d'un outil.

const approvalResponsePartSchema = z.object({
  approval: z
    .object({
      approved: z.boolean(),
      id: z.string().min(1).max(200),
      reason: z.string().max(400).optional(),
    })
    .optional(),
  input: z.unknown().optional(),
  toolCallId: z.string().min(1).max(200),
});

export type AppliedApprovalDecisions = {
  approved: number;
  denied: number;
  invalidated: number;
};

type IncomingApprovalDecision = {
  approvalId: string;
  approved: boolean;
  input: unknown;
  reason?: string;
  toolCallId: string;
};

// Lecture défensive : la charge utile vient du client, donc rien n'est supposé
// valide. Une partie illisible est ignorée, jamais interprétée.
function collectIncomingDecisions(
  messages: unknown
): IncomingApprovalDecision[] {
  if (!Array.isArray(messages)) {
    return [];
  }
  const decisions: IncomingApprovalDecision[] = [];
  const seen = new Set<string>();

  for (const message of messages) {
    const parts = (message as { parts?: unknown } | null)?.parts;
    if (!Array.isArray(parts)) {
      continue;
    }
    for (const part of parts) {
      const parsed = approvalResponsePartSchema.safeParse(part);
      if (!parsed.success) {
        continue;
      }
      const approval = parsed.data.approval;
      if (!approval) {
        continue;
      }
      // Une seule décision par demande : un double clic (ou un message rejoué)
      // ne peut pas décider deux fois le même appel.
      if (seen.has(approval.id)) {
        continue;
      }
      seen.add(approval.id);
      decisions.push({
        approvalId: approval.id,
        approved: approval.approved,
        input: parsed.data.input,
        ...(approval.reason === undefined ? {} : { reason: approval.reason }),
        toolCallId: parsed.data.toolCallId,
      });
    }
  }

  return decisions;
}

// Trace dans la timeline : l'étape « Approbation requise » devient la décision
// réellement appliquée, avec son statut — l'utilisateur voit ce qui a été
// accordé, refusé ou devenu caduc.
async function traceDecision(params: {
  request: ApprovalRequestRecord;
  reason?: string | null;
  status: "completed" | "failed" | "skipped";
  title: string;
}): Promise<void> {
  const stepId = params.request.stepId;
  if (!stepId) {
    return;
  }
  // La trace est un confort : elle ne doit jamais changer le résultat de la
  // décision, qui est déjà persistée.
  try {
    await updateAgentStep({
      completedAt: new Date(),
      id: stepId,
      status: params.status,
      summary:
        params.reason ??
        `Décision appliquée pour « ${getAgentToolLabel(params.request.toolId)} ».`,
      title: params.title,
    });
  } catch {
    // Échec de traçabilité ignoré : la décision reste appliquée.
  }
}

export async function applyIncomingApprovalDecisions(params: {
  messages: unknown;
  runId: string;
}): Promise<AppliedApprovalDecisions> {
  const applied: AppliedApprovalDecisions = {
    approved: 0,
    denied: 0,
    invalidated: 0,
  };

  for (const decision of collectIncomingDecisions(params.messages)) {
    try {
      const request = await getApprovalRequestByToolCall({
        runId: params.runId,
        toolCallId: decision.toolCallId,
      });
      // Demande inconnue de ce run, ou déjà décidée (rejeu du flux) : rien à
      // appliquer. Une demande absente sera recréée par le contrôleur.
      if (request?.status !== "pending") {
        continue;
      }

      // Les paramètres que l'utilisateur a vus sont ceux de l'appel d'outil
      // transmis : s'ils diffèrent de la demande persistée, l'accord est caduc
      // au lieu d'être appliqué à une action qui n'a pas été présentée.
      if (
        decision.input !== undefined &&
        paramsHashOf(decision.input) !== request.paramsHash
      ) {
        await expireApprovalRequestById({ id: request.id });
        // Le compteur est incrémenté avant la trace : une décision appliquée
        // ne dépend jamais de la réussite d'une écriture de confort.
        applied.invalidated += 1;
        await traceDecision({
          reason:
            "Les paramètres de l'action avaient changé : une nouvelle approbation est nécessaire.",
          request,
          status: "skipped",
          title: "Approbation caduque",
        });
        continue;
      }

      const result = await decideApprovalRequest({
        decision: decision.approved ? "approve" : "deny",
        denyReason: decision.approved ? null : (decision.reason ?? null),
        id: request.id,
        paramsHash: request.paramsHash,
      });
      if (!result.ok) {
        continue;
      }

      if (decision.approved) {
        applied.approved += 1;
        await traceDecision({
          request,
          status: "completed",
          title: "Approbation accordée",
        });
      } else {
        applied.denied += 1;
        await traceDecision({
          reason: decision.reason ?? "Action refusée pour cet appel.",
          request,
          status: "failed",
          title: "Action refusée",
        });
      }
    } catch {
      // Une décision non appliquée ne doit jamais interrompre la reprise : le
      // contrôleur refusera l'exécution faute d'accord persisté.
    }
  }

  return applied;
}
