import { InvalidToolInputError, NoSuchToolError, streamText, tool } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { AGENT_ERROR_CODES } from "@/lib/agent/errors";
import { AgentToolError } from "@/lib/agent/tool-errors";
import {
  CHAT_FINAL_RESPONSE_INSTRUCTION,
  CHAT_MAX_STEPS,
  chatEndedOnQuizzly,
  createChatStreamControls,
  prepareChatStep,
  shouldForceChatSynthesis,
  shouldStopChatLoop,
  shouldWriteChatFallback,
} from "@/lib/chat/loop";
import { guardNativeChatTool } from "@/lib/chat/native-tool-guard";
import {
  repairChatToolCall,
  repairToolInputJson,
} from "@/lib/chat/tool-call-repair";

const FLINT_MODEL_ID = "recursive/flint-v1.0:free";

function usage() {
  return {
    inputTokens: {
      cacheRead: 0,
      cacheWrite: 0,
      noCache: 4,
      total: 4,
    },
    outputTokens: { reasoning: 0, text: 2, total: 2 },
  };
}

function textStream(text: string) {
  return {
    stream: new ReadableStream({
      start(controller) {
        controller.enqueue({ id: "text", type: "text-start" });
        controller.enqueue({ delta: text, id: "text", type: "text-delta" });
        controller.enqueue({ id: "text", type: "text-end" });
        controller.enqueue({
          finishReason: { raw: "stop", unified: "stop" },
          type: "finish",
          usage: usage(),
        });
        controller.close();
      },
    }),
  };
}

function toolStream(toolName: string, input: string, toolCallId: string) {
  return {
    stream: new ReadableStream({
      start(controller) {
        controller.enqueue({
          input,
          toolCallId,
          toolName,
          type: "tool-call",
        });
        controller.enqueue({
          finishReason: { raw: "tool_calls", unified: "tool-calls" },
          type: "finish",
          usage: usage(),
        });
        controller.close();
      },
    }),
  };
}

function flintModel(
  doStream: () => ReturnType<typeof textStream> | ReturnType<typeof toolStream>
) {
  return new MockLanguageModelV4({
    doStream: async () => doStream(),
    modelId: FLINT_MODEL_ID,
  });
}

function pingTool(executed: unknown[]) {
  return tool({
    description: "Répond à un ping.",
    execute: async (input) => {
      executed.push(input);
      return { ok: true };
    },
    inputSchema: z.object({
      value: z.string(),
    }),
  });
}

describe("Réparation des appels d'outils", () => {
  it("corrige une virgule finale et exécute l'outil", async () => {
    const repaired = repairToolInputJson('{"value":"ok",}');
    expect(repaired).toBe('{"value":"ok"}');

    const call = await repairChatToolCall({
      error: new InvalidToolInputError({
        cause: new SyntaxError("virgule"),
        toolInput: '{"value":"ok",}',
        toolName: "ping",
      }),
      toolCall: {
        input: '{"value":"ok",}',
        toolCallId: "call-1",
        toolName: "ping",
      },
    });
    expect(call?.input).toBe('{"value":"ok"}');

    const executed: unknown[] = [];
    let step = 0;
    const model = flintModel(() => {
      step += 1;
      if (step === 1) {
        return toolStream("ping", '{"value":"ok",}', "call-1");
      }
      return textStream("Ping reçu.");
    });
    const result = streamText({
      model,
      prompt: "ping",
      tools: { ping: pingTool(executed) },
      ...createChatStreamControls({
        instructions: "INSTRUCTIONS",
        supportsTools: true,
      }),
    });

    await expect(result.text).resolves.toBe("Ping reçu.");
    await expect(result.finishReason).resolves.not.toBe("error");
    expect(executed).toEqual([{ value: "ok" }]);
    expect(model.modelId).toBe(FLINT_MODEL_ID);
  });

  it("renvoie un JSON irrattrapable au modèle, sans faire échouer l'échange", async () => {
    expect(repairToolInputJson("{")).toBeNull();
    expect(repairToolInputJson('{"value":1}')).toBeNull();

    const executed: unknown[] = [];
    let step = 0;
    const model = flintModel(() => {
      step += 1;
      if (step === 1) {
        return toolStream("ping", "{", "call-1");
      }
      return textStream("Je reformule.");
    });
    const result = streamText({
      model,
      prompt: "ping",
      tools: { ping: pingTool(executed) },
      ...createChatStreamControls({
        instructions: "INSTRUCTIONS",
        supportsTools: true,
      }),
    });

    await expect(result.text).resolves.toBe("Je reformule.");
    await expect(result.finishReason).resolves.not.toBe("error");
    expect(executed).toEqual([]);
    const followUp = JSON.stringify(model.doStreamCalls[1]);
    expect(followUp).toContain("ping");
    expect(followUp.toLowerCase()).toContain("invalid");
  });

  it("renvoie un nom d'outil inventé au modèle sans l'exécuter", async () => {
    const call = await repairChatToolCall({
      error: new NoSuchToolError({
        availableTools: ["ping"],
        toolName: "sendEmail",
      }),
      toolCall: {
        input: '{"to":"a@b.c"}',
        toolCallId: "call-1",
        toolName: "sendEmail",
      },
    });
    expect(call).toBeNull();

    const executed: unknown[] = [];
    let step = 0;
    const model = flintModel(() => {
      step += 1;
      if (step === 1) {
        return toolStream("sendEmail", '{"to":"a@b.c"}', "call-1");
      }
      return textStream("Je n'ai pas cet outil.");
    });
    const result = streamText({
      model,
      prompt: "envoie un email",
      tools: { ping: pingTool(executed) },
      ...createChatStreamControls({
        instructions: "INSTRUCTIONS",
        supportsTools: true,
      }),
    });

    await expect(result.text).resolves.toBe("Je n'ai pas cet outil.");
    await expect(result.finishReason).resolves.not.toBe("error");
    expect(executed).toEqual([]);
    expect(JSON.stringify(model.doStreamCalls[1])).toContain("sendEmail");
    expect(model.doStreamCalls).toHaveLength(2);
  });
});

describe("Boucle Chat — synthèse sans tool_choice", () => {
  const toolStep = { toolCalls: [{ toolName: "ping" }] };
  const textStep = { toolCalls: [] as { toolName?: string }[] };

  it("réserve la dernière place et une synthèse si le plafond est un outil", () => {
    expect(CHAT_MAX_STEPS).toBe(12);
    expect(shouldForceChatSynthesis(10)).toBe(false);
    expect(shouldForceChatSynthesis(11)).toBe(true);

    expect(shouldStopChatLoop({ steps: new Array(11).fill(toolStep) })).toBe(
      false
    );
    expect(shouldStopChatLoop({ steps: new Array(12).fill(toolStep) })).toBe(
      false
    );
    expect(shouldStopChatLoop({ steps: new Array(13).fill(toolStep) })).toBe(
      true
    );
    expect(
      shouldStopChatLoop({
        steps: [...new Array(11).fill(toolStep), textStep],
      })
    ).toBe(true);
  });

  it("coupe dès qu'un quiz a été généré", () => {
    const steps = [{ toolCalls: [{ toolName: "quizzly" }] }];
    expect(chatEndedOnQuizzly(steps)).toBe(true);
    expect(shouldStopChatLoop({ steps })).toBe(true);
    expect(shouldWriteChatFallback({ endedOnQuizzly: true, text: "" })).toBe(
      false
    );
  });

  it("prépare une synthèse sans toolChoice et sans outils", () => {
    expect(
      prepareChatStep({
        instructions: "INSTRUCTIONS",
        steps: new Array(10).fill(toolStep),
        supportsTools: true,
      })
    ).toBeUndefined();

    const patch = prepareChatStep({
      instructions: "INSTRUCTIONS",
      steps: new Array(11).fill(toolStep),
      supportsTools: true,
    });
    expect(patch?.activeTools).toEqual([]);
    expect(patch).not.toHaveProperty("toolChoice");
    expect(patch?.instructions).toContain("INSTRUCTIONS");
    expect(patch?.instructions).toContain(CHAT_FINAL_RESPONSE_INSTRUCTION);
    expect(
      prepareChatStep({
        instructions: "INSTRUCTIONS",
        steps: new Array(11).fill(toolStep),
        supportsTools: false,
      })
    ).toBeUndefined();
    expect(shouldWriteChatFallback({ endedOnQuizzly: false, text: "" })).toBe(
      true
    );
    expect(
      shouldWriteChatFallback({ endedOnQuizzly: false, text: "Déjà répondu." })
    ).toBe(false);
  });

  it("retire les outils à la 12e étape Flint, et autorise une 13e si elle appelle encore", async () => {
    let step = 0;
    const executed: unknown[] = [];
    const model = flintModel(() => {
      step += 1;
      return toolStream("ping", '{"value":"x"}', `call-${step}`);
    });
    const result = streamText({
      model,
      prompt: "continue",
      tools: { ping: pingTool(executed) },
      ...createChatStreamControls({
        instructions: "INSTRUCTIONS",
        supportsTools: true,
      }),
    });

    await expect(result.finishReason).resolves.not.toBe("error");
    expect(model.doStreamCalls).toHaveLength(13);
    expect(model.modelId).toBe(FLINT_MODEL_ID);
    expect(model.doStreamCalls[10]?.tools?.length).toBeGreaterThan(0);
    expect(model.doStreamCalls[11]?.tools).toBeUndefined();
    expect(model.doStreamCalls[12]?.tools).toBeUndefined();
    expect(model.doStreamCalls[11]?.toolChoice).not.toEqual({ type: "none" });
    expect(model.doStreamCalls[12]?.toolChoice).not.toEqual({ type: "none" });
    const synthesis = JSON.stringify(model.doStreamCalls[11]);
    expect(synthesis).toContain(CHAT_FINAL_RESPONSE_INSTRUCTION);
    expect(JSON.stringify(model.doStreamCalls[0])).not.toContain(
      CHAT_FINAL_RESPONSE_INSTRUCTION
    );
    expect(executed.length).toBe(11);
  });

  it("s'arrête après un quiz, avant une seconde étape", async () => {
    let step = 0;
    const model = flintModel(() => {
      step += 1;
      if (step === 1) {
        return toolStream("quizzly", "{}", "call-quiz");
      }
      return textStream("ne devrait pas partir");
    });
    const quizzly = tool({
      description: "Quiz interactif.",
      execute: async () => ({ questions: [] }),
      inputSchema: z.object({}),
    });
    const result = streamText({
      model,
      prompt: "fais un quiz",
      tools: { quizzly },
      ...createChatStreamControls({
        instructions: "INSTRUCTIONS",
        supportsTools: true,
      }),
    });

    await expect(result.finishReason).resolves.not.toBe("error");
    expect(model.doStreamCalls).toHaveLength(1);
    expect(await result.text).toBe("");
  });
});

describe("Erreurs des outils natifs", () => {
  it("classe une exception inconnue comme permanente, sans détail interne", async () => {
    const guarded = guardNativeChatTool({
      async execute() {
        throw new Error("password=secret");
      },
    });

    const result = await guarded.execute();
    expect(result).toMatchObject({
      category: "permanent",
      code: AGENT_ERROR_CODES.toolFailed,
      retryable: false,
    });
    expect(JSON.stringify(result)).not.toContain("password=secret");
    expect(JSON.stringify(result)).not.toContain("internalDetails");
  });

  it("classe un dépassement de délai comme réessayable", async () => {
    const timeout = new Error("trop lent");
    timeout.name = "TimeoutError";
    const guarded = guardNativeChatTool({
      async execute() {
        throw timeout;
      },
    });

    await expect(guarded.execute()).resolves.toMatchObject({
      category: "transient",
      code: AGENT_ERROR_CODES.toolTimeout,
      message: "L'outil a dépassé son délai d'exécution.",
      retryable: true,
    });
  });

  it("conserve un AgentToolError déjà classé, sans ses détails internes", async () => {
    const guarded = guardNativeChatTool({
      async execute() {
        throw new AgentToolError({
          category: "permission",
          code: AGENT_ERROR_CODES.permissionDenied,
          internalDetails: { token: "secret-token" },
          message: "Action refusée.",
        });
      },
    });

    const result = await guarded.execute();
    expect(result).toEqual({
      category: "permission",
      code: AGENT_ERROR_CODES.permissionDenied,
      message: "Action refusée.",
      retryable: false,
    });
    expect(JSON.stringify(result)).not.toContain("secret-token");
  });

  it("laisse passer un résultat réussi tel quel", async () => {
    const guarded = guardNativeChatTool({
      async execute() {
        return { error: "Expression vide" };
      },
    });
    const untouched = { description: "sans exécution" };
    const plain = guardNativeChatTool(untouched);

    await expect(guarded.execute()).resolves.toEqual({
      error: "Expression vide",
    });
    expect(plain).toBe(untouched);
  });
});
