import type { ModelMessage } from "ai";
import { describe, expect, it } from "vitest";
import { injectUserInputAnswers } from "@/lib/agent/user-input/inject";
import type { AgentUserInputRow } from "@/lib/db/agent-user-input-queries";

// Réinjection d'une réponse enregistrée dans le MÊME run : la sortie du tool
// call de question est remplacée par la réponse validée relue en base. Aucune
// donnée cliente, aucune invention : une ligne illisible n'injecte rien.

function requestRow(overrides: Partial<AgentUserInputRow>) {
  return {
    answers: [{ questionId: "format", value: "PDF" }],
    chatId: "chat-1",
    context: null,
    createdAt: new Date(),
    expiresAt: new Date(),
    id: "request-1",
    questions: [
      {
        id: "format",
        options: ["PDF", "Markdown"],
        question: "Quel format ?",
        required: true,
        type: "single_choice",
      },
    ],
    questionsHash: "hash",
    revision: 1,
    runId: "run-1",
    status: "answered",
    stepId: null,
    title: "Précisions",
    toolCallId: "call-1",
    toolExecutionId: null,
    toolId: "ask_user",
    ...overrides,
  } as unknown as AgentUserInputRow;
}

function toolMessage(toolCallId: string): ModelMessage {
  return {
    content: [
      {
        output: { type: "text", value: "en attente" },
        toolCallId,
        toolName: "ask_user",
        type: "tool-result",
      },
    ],
    role: "tool",
  };
}

describe("Réinjection de la réponse utilisateur", () => {
  it("remplace la sortie du tool call concerné et signale l'injection", () => {
    const messages = [toolMessage("call-1")];

    const injected = injectUserInputAnswers({
      messages,
      requests: [requestRow({})],
    });

    expect(injected).toHaveLength(1);
    expect(injected[0].toolCallId).toBe("call-1");
    const part = messages[0].content[0] as { output: { value: string } };
    expect(JSON.parse(part.output.value)).toEqual({
      answers: [{ questionId: "format", value: "PDF" }],
      status: "answered",
    });
  });

  it("ne touche à aucun autre appel d'outil", () => {
    const untouched = toolMessage("call-2");

    injectUserInputAnswers({
      messages: [toolMessage("call-1"), untouched],
      requests: [requestRow({})],
    });

    const part = untouched.content[0] as { output: { value: string } };
    expect(part.output.value).toBe("en attente");
  });

  it("n'injecte rien quand la ligne persistée est illisible", () => {
    const messages = [toolMessage("call-1")];

    const injected = injectUserInputAnswers({
      messages,
      requests: [requestRow({ questions: [{ id: "inconnu" }] })],
    });

    expect(injected).toHaveLength(0);
    const part = messages[0].content[0] as { output: { value: string } };
    expect(part.output.value).toBe("en attente");
  });

  it("n'injecte rien quand aucune réponse n'est enregistrée", () => {
    const injected = injectUserInputAnswers({
      messages: [toolMessage("call-1")],
      requests: [requestRow({ answers: null })],
    });

    expect(injected).toHaveLength(0);
  });
});
