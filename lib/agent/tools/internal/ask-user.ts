import {
  type AskUserQuestion,
  askUserRequestSchema,
} from "@/lib/agent/contracts";
import { paramsHashOf } from "@/lib/agent/params-hash";
import { requireAgentToolMetadata } from "@/lib/agent/tools/catalog";
import { defineTool } from "@/lib/agent/tools/define-tool";
import { toolFailure, toolSuccess } from "@/lib/agent/types";
import { createAgentUserInputRequest } from "@/lib/db/agent-user-input-queries";

// Demande d'information manquante : au lieu d'inventer une valeur, Agent pose
// une question structurée. Le questionnaire validé est PERSISTÉ et rattaché au
// ToolCall exact (toolCallId) : il reste consultable après refresh ou fermeture
// de l'application, la réponse est validée côté serveur, puis réinjectée dans
// le même AgentRun à partir du checkpoint.

export const ASK_USER_TTL_MS = 24 * 60 * 60 * 1000;

function pendingQuestions(data: unknown): AskUserQuestion[] {
  if (!data || typeof data !== "object") {
    return [];
  }
  const value = (data as { questions?: unknown }).questions;
  return Array.isArray(value) ? (value as AskUserQuestion[]) : [];
}

function readStatus(data: unknown): string {
  if (!data || typeof data !== "object") {
    return "";
  }
  const value = (data as { status?: unknown }).status;
  return typeof value === "string" ? value : "";
}

export const askUserTool = defineTool({
  ...requireAgentToolMetadata("ask_user"),
  execute: async (input, context) => {
    const expiresAt = new Date(Date.now() + ASK_USER_TTL_MS);

    let request: Awaited<ReturnType<typeof createAgentUserInputRequest>>;
    try {
      request = await createAgentUserInputRequest({
        chatId: context.chatId,
        context: input.description ?? null,
        expiresAt,
        questions: input.questions,
        questionsHash: paramsHashOf(input.questions),
        runId: context.runId,
        stepId: context.stepId,
        title: input.title,
        toolCallId: context.toolCallId,
        toolExecutionId: context.toolExecutionId,
        toolId: "ask_user",
      });
    } catch {
      return toolFailure(
        "ask_user_failed",
        "Impossible d'enregistrer la question pour le moment.",
        { category: "transient", retryable: true }
      );
    }

    // Demande déjà répondue (retry, rejeu du flux) : la réponse enregistrée est
    // renvoyée telle quelle, sans attendre une seconde fois.
    if (request.status === "answered") {
      return toolSuccess({
        answers: request.answers ?? [],
        requestId: request.id,
        runId: context.runId,
        status: "answered",
        title: request.title,
      });
    }

    return toolSuccess(
      {
        context: request.context,
        expiresAt: request.expiresAt.toISOString(),
        questions: input.questions,
        requestId: request.id,
        revision: request.revision,
        // Le run est transmis à la carte : la réponse est adressée au run
        // exact, y compris après un refresh où l'état de flux est vide.
        runId: context.runId,
        status: "waiting_for_user",
        title: request.title,
      },
      undefined,
      {
        awaitingUser: {
          expiresAt: request.expiresAt.toISOString(),
          requestId: request.id,
        },
      }
    );
  },
  schema: askUserRequestSchema,
  summarize: (data) => {
    if (readStatus(data) === "answered") {
      return "Réponse reçue";
    }
    const count = pendingQuestions(data).length;
    return count > 0
      ? `${count} question${count > 1 ? "s" : ""} · en attente de votre réponse`
      : "En attente de votre réponse";
  },
});
