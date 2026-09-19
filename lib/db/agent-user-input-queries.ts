import "server-only";

import { and, desc, eq, gt, sql } from "drizzle-orm";
import type { AskUserQuestion, UserInputAnswer } from "@/lib/agent/contracts";
import { dbReady } from "@/lib/db/queries";
import { agentUserInputRequest } from "@/lib/db/schema";
import { ChatbotError } from "@/lib/errors";

// Persistance des questionnaires Agent : la question posée et sa réponse
// restent consultables après un refresh ou la fermeture de l'application, et la
// réponse est toujours relue depuis la base — jamais depuis ce que transmet le
// client.

export type AgentUserInputRow = typeof agentUserInputRequest.$inferSelect;

export async function createAgentUserInputRequest(params: {
  chatId: string;
  context?: string | null;
  expiresAt: Date;
  questions: AskUserQuestion[];
  questionsHash: string;
  runId: string;
  stepId?: string | null;
  title: string;
  toolCallId: string;
  toolExecutionId?: string | null;
  toolId: string;
}): Promise<AgentUserInputRow> {
  try {
    const db = await dbReady();
    const values = {
      chatId: params.chatId,
      context: params.context ?? null,
      expiresAt: params.expiresAt,
      questions: params.questions as never,
      questionsHash: params.questionsHash,
      runId: params.runId,
      stepId: params.stepId ?? null,
      title: params.title,
      toolCallId: params.toolCallId,
      toolExecutionId: params.toolExecutionId ?? null,
      toolId: params.toolId,
    };

    // Idempotence : un même appel d'outil ne crée qu'une seule demande (retry,
    // reprise ou rejeu du flux renvoient la question déjà posée, avec sa
    // réponse éventuelle).
    const [row] = params.toolExecutionId
      ? await db
          .insert(agentUserInputRequest)
          .values(values)
          .onConflictDoUpdate({
            set: { revision: sql`${agentUserInputRequest.revision}` },
            target: agentUserInputRequest.toolExecutionId,
          })
          .returning()
      : await db.insert(agentUserInputRequest).values(values).returning();

    return row;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getAgentUserInputRequestById({
  id,
}: {
  id: string;
}): Promise<AgentUserInputRow | null> {
  try {
    const db = await dbReady();
    const [row] = await db
      .select()
      .from(agentUserInputRequest)
      .where(eq(agentUserInputRequest.id, id))
      .limit(1);
    return row ?? null;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getAgentUserInputByToolCall({
  runId,
  toolCallId,
}: {
  runId: string;
  toolCallId: string;
}): Promise<AgentUserInputRow | null> {
  try {
    const db = await dbReady();
    const [row] = await db
      .select()
      .from(agentUserInputRequest)
      .where(
        and(
          eq(agentUserInputRequest.runId, runId),
          eq(agentUserInputRequest.toolCallId, toolCallId)
        )
      )
      .orderBy(desc(agentUserInputRequest.createdAt))
      .limit(1);
    return row ?? null;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

// Demande encore ouverte d'un run : la reprise doit répondre à cette question
// précise, jamais à une autre.
export async function getPendingAgentUserInputForRun({
  runId,
}: {
  runId: string;
}): Promise<AgentUserInputRow | null> {
  try {
    const db = await dbReady();
    const [row] = await db
      .select()
      .from(agentUserInputRequest)
      .where(
        and(
          eq(agentUserInputRequest.runId, runId),
          eq(agentUserInputRequest.status, "pending"),
          gt(agentUserInputRequest.expiresAt, new Date())
        )
      )
      .orderBy(desc(agentUserInputRequest.createdAt))
      .limit(1);
    return row ?? null;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

// Réponses enregistrées d'un run : réinjectées dans le contexte du modèle au
// moment de la reprise, depuis la base uniquement.
export async function getAnsweredAgentUserInputsForRun({
  runId,
}: {
  runId: string;
}): Promise<AgentUserInputRow[]> {
  try {
    const db = await dbReady();
    return await db
      .select()
      .from(agentUserInputRequest)
      .where(
        and(
          eq(agentUserInputRequest.runId, runId),
          eq(agentUserInputRequest.status, "answered")
        )
      )
      .orderBy(agentUserInputRequest.createdAt);
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function listAgentUserInputsByRunId({
  runId,
}: {
  runId: string;
}): Promise<AgentUserInputRow[]> {
  try {
    const db = await dbReady();
    return await db
      .select()
      .from(agentUserInputRequest)
      .where(eq(agentUserInputRequest.runId, runId))
      .orderBy(agentUserInputRequest.createdAt);
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export type UserInputDecisionFailure =
  | "already_answered"
  | "expired"
  | "invalidated"
  | "not_found"
  | "revision_mismatch";

// Décision de réponse : écriture ATOMIQUE conditionnée par le statut, la
// révision et l'empreinte des questions. Deux soumissions concurrentes ne
// peuvent pas aboutir ; une question expirée, un questionnaire modifié après
// affichage ou une réponse à une version périmée sont refusés.
export async function decideAgentUserInput(params: {
  answers: UserInputAnswer[];
  answeredBy: string;
  expectedRevision: number;
  id: string;
  questionsHash: string;
}): Promise<
  | { ok: true; row: AgentUserInputRow }
  | { ok: false; reason: UserInputDecisionFailure }
> {
  try {
    const db = await dbReady();
    const rows = await db
      .update(agentUserInputRequest)
      .set({
        answeredAt: new Date(),
        answeredBy: params.answeredBy,
        answers: params.answers as never,
        revision: sql`${agentUserInputRequest.revision} + 1`,
        status: "answered",
      })
      .where(
        and(
          eq(agentUserInputRequest.id, params.id),
          eq(agentUserInputRequest.status, "pending"),
          eq(agentUserInputRequest.revision, params.expectedRevision),
          eq(agentUserInputRequest.questionsHash, params.questionsHash),
          gt(agentUserInputRequest.expiresAt, new Date())
        )
      )
      .returning();

    if (rows[0]) {
      return { ok: true, row: rows[0] };
    }

    const [existing] = await db
      .select()
      .from(agentUserInputRequest)
      .where(eq(agentUserInputRequest.id, params.id))
      .limit(1);

    if (!existing) {
      return { ok: false, reason: "not_found" };
    }
    if (existing.status === "answered") {
      return { ok: false, reason: "already_answered" };
    }
    if (existing.expiresAt.getTime() <= Date.now()) {
      return { ok: false, reason: "expired" };
    }
    if (existing.questionsHash !== params.questionsHash) {
      return { ok: false, reason: "invalidated" };
    }
    return { ok: false, reason: "revision_mismatch" };
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

// Une demande laissée ouverte sur un run terminé ne pourra plus jamais être
// appliquée : elle est marquée expirée plutôt que laissée « pending ».
export async function expireAgentUserInputsForRun({
  runId,
}: {
  runId: string;
}): Promise<void> {
  try {
    const db = await dbReady();
    await db
      .update(agentUserInputRequest)
      .set({ status: "expired" })
      .where(
        and(
          eq(agentUserInputRequest.runId, runId),
          eq(agentUserInputRequest.status, "pending")
        )
      );
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}
