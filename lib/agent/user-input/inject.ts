import "server-only";

import type { ModelMessage } from "ai";
import { z } from "zod";
import {
  askUserQuestionSchema,
  type UserInputAnswer,
  userInputAnswerSchema,
} from "@/lib/agent/contracts";
import type { AgentUserInputRow } from "@/lib/db/agent-user-input-queries";

// Réinjection de la réponse utilisateur dans le MÊME run : la sortie du tool
// call de question est remplacée par la réponse validée, lue depuis la base.
// Le modèle reçoit donc une réponse structurée associée à SA question — jamais
// du texte libre réinterprété, jamais une valeur transmise par le client.

const questionsSchema = z.array(askUserQuestionSchema);
const answersSchema = z.array(userInputAnswerSchema);

export type InjectedUserInput = {
  answers: UserInputAnswer[];
  toolCallId: string;
};

function parseRequest(row: AgentUserInputRow): InjectedUserInput | null {
  const questions = questionsSchema.safeParse(row.questions);
  const answers = answersSchema.safeParse(row.answers ?? []);
  if (!questions.success || !answers.success || answers.data.length === 0) {
    // Données corrompues, version antérieure, ou réponse vide : on n'injecte
    // rien plutôt que d'inventer une réponse ou de clore une question ouverte.
    return null;
  }
  return { answers: answers.data, toolCallId: row.toolCallId };
}

// Remplace la sortie du tool call de question par la réponse enregistrée.
// Retourne les réponses réellement injectées (pour la traçabilité du run).
export function injectUserInputAnswers(params: {
  messages: ModelMessage[];
  requests: AgentUserInputRow[];
}): InjectedUserInput[] {
  const byToolCallId = new Map<string, InjectedUserInput>();
  for (const row of params.requests) {
    const parsed = parseRequest(row);
    if (parsed) {
      byToolCallId.set(parsed.toolCallId, parsed);
    }
  }
  if (byToolCallId.size === 0) {
    return [];
  }

  const injected: InjectedUserInput[] = [];

  for (const message of params.messages) {
    if (message.role !== "tool") {
      continue;
    }
    const content = message.content.map((part) => {
      if (part.type !== "tool-result") {
        return part;
      }
      const pending = byToolCallId.get(part.toolCallId);
      if (!pending) {
        return part;
      }
      injected.push(pending);
      return {
        ...part,
        output: {
          type: "text" as const,
          value: JSON.stringify({
            answers: pending.answers.map((answer) => ({
              questionId: answer.questionId,
              value: answer.value,
            })),
            status: "answered",
          }),
        },
      };
    });
    message.content = content;
  }

  return injected;
}
