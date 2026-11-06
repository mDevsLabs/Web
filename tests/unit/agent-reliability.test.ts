import { InvalidToolInputError, NoSuchToolError, streamText, tool } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { agentRequestBodySchema } from "@/app/(chat)/api/agent/schema";
import { validateAttachmentsAgainstModel } from "@/lib/agent/context/files";
import { AGENT_ERROR_CODES } from "@/lib/agent/errors";
import { DEFAULT_AGENT_FLAGS } from "@/lib/agent/flags";
import { AGENT_FINAL_RESPONSE_INSTRUCTION } from "@/lib/agent/instructions";
import {
  agentFinalStepToolControl,
  shouldForceAgentFinalResponse,
} from "@/lib/agent/runtime";
import {
  repairAgentToolCall,
  repairAgentToolCallWithinBudget,
  repairToolInputJson,
} from "@/lib/agent/tool-call-repair";
import { toAgentToolError } from "@/lib/agent/tool-errors";
import { resolveToolPermission } from "@/lib/agent/tools/permissions";
import { type ModelCapabilities, supportsToolChoice } from "@/lib/ai/registry";

describe("Agent — garde des outils et médias", () => {
  it("ne permet jamais auto pour une mutation externe, même avec surcharge", () => {
    const tool = {
      id: "external",
      permissions: {
        default: "auto" as const,
        impact: "external_mutation" as const,
      },
    };
    expect(
      resolveToolPermission({
        autonomy: "high",
        overrides: { external: "auto" },
        tool,
      })
    ).toBe("ask");
    expect(
      resolveToolPermission({
        autonomy: "high",
        overrides: { external: "off" },
        tool,
      })
    ).toBe("off");
  });

  it("conserve l'automatisme possible pour un livrable local", () => {
    const tool = {
      id: "artifact",
      permissions: {
        default: "auto" as const,
        impact: "local_creation" as const,
      },
    };
    expect(resolveToolPermission({ autonomy: "high", tool })).toBe("auto");
  });

  it("refuse un média incompatible avec les capacités détaillées", () => {
    const capabilities = {
      documents: true,
      images: false,
      maxFiles: 2,
    } as ModelCapabilities;
    expect(
      validateAttachmentsAgainstModel({
        attachments: [
          {
            contentType: "image/png",
            name: "image.png",
            url: "https://example.com/a",
          },
        ],
        capabilities,
      }).error
    ).toContain("images");
    expect(
      validateAttachmentsAgainstModel({
        attachments: [
          {
            contentType: "application/pdf",
            name: "rapport.pdf",
            url: "https://example.com/a",
          },
        ],
        capabilities,
      }).error
    ).toBeUndefined();
  });
});

describe("Agent — déploiement progressif", () => {
  it("garde les nouvelles interfaces derrière leurs flags", () => {
    expect(DEFAULT_AGENT_FLAGS["agent.approvalPreview"]).toBe(false);
    expect(DEFAULT_AGENT_FLAGS["agent.guidedResume"]).toBe(false);
    expect(DEFAULT_AGENT_FLAGS["agent.scheduleHistory"]).toBe(false);
    expect(DEFAULT_AGENT_FLAGS["agent.activity"]).toBe(false);
  });

  it("valide l'identifiant du run parent", () => {
    const base = {
      id: "11111111-1111-4111-8111-111111111111",
      message: {
        id: "22222222-2222-4222-8222-222222222222",
        parts: [{ text: "Poursuis", type: "text" }],
        role: "user",
      },
      modelId: "model",
    };
    expect(
      agentRequestBodySchema.safeParse({
        ...base,
        resumeFromRunId: "33333333-3333-4333-8333-333333333333",
      }).success
    ).toBe(true);
    expect(
      agentRequestBodySchema.safeParse({ ...base, resumeFromRunId: "invalide" })
        .success
    ).toBe(false);
  });
});

const FLINT_MODEL_ID = "recursive/flint-v1.0:free";
const SECRET = "secret-token";

function safeText(error: unknown): string {
  return JSON.stringify(toAgentToolError(error).toSafeShape());
}

describe("Agent — classement des erreurs d'outils", () => {
  it("classe un échec réseau, un 503 et un 429 comme transitoires", () => {
    const network = new TypeError("fetch failed", {
      cause: new Error(`connect ECONNREFUSED ${SECRET}`),
    });
    const networkShape = toAgentToolError(network).toSafeShape();
    expect(networkShape).toMatchObject({
      category: "transient",
      code: AGENT_ERROR_CODES.toolFailed,
      retryable: true,
    });
    expect(safeText(network)).not.toContain(SECRET);

    const unavailable = new Error(`corps amont ${SECRET}`);
    Object.assign(unavailable, { status: 503 });
    const unavailableShape = toAgentToolError(unavailable).toSafeShape();
    expect(unavailableShape.category).toBe("transient");
    expect(unavailableShape.retryable).toBe(true);
    expect(JSON.stringify(unavailableShape)).not.toContain(SECRET);

    const limited = new Error(`corps amont ${SECRET}`);
    Object.assign(limited, {
      responseHeaders: { "Retry-After": "2" },
      statusCode: 429,
    });
    const limitedShape = toAgentToolError(limited).toSafeShape();
    expect(limitedShape).toMatchObject({
      category: "transient",
      retryAfterMs: 2000,
      retryable: true,
    });
    expect(JSON.stringify(limitedShape)).not.toContain(SECRET);

    const capped = new Error("HTTP 429");
    Object.assign(capped, { headers: { "Retry-After": "120" }, status: 429 });
    expect(toAgentToolError(capped).retryAfterMs).toBe(60_000);
  });

  it("laisse un quota en 429 non retentable, sans détail interne", () => {
    const error = new Error(`quota_exceeded ${SECRET}`);
    Object.assign(error, {
      headers: new Headers({ "Retry-After": "2" }),
      status: 429,
    });
    const shape = toAgentToolError(error).toSafeShape();
    expect(shape).toEqual({
      category: "permanent",
      code: AGENT_ERROR_CODES.budgetExceeded,
      message: "Le quota de cette action est atteint.",
      retryable: false,
    });
    expect(JSON.stringify(shape)).not.toContain(SECRET);
  });

  it("classe une permission sans exposer le secret", () => {
    const error = new Error(`permission_denied ${SECRET}`);
    Object.assign(error, { statusCode: 403 });
    const shape = toAgentToolError(error).toSafeShape();
    expect(shape).toEqual({
      category: "permission",
      code: AGENT_ERROR_CODES.permissionDenied,
      message: "Cette action n'est pas autorisée.",
      retryable: false,
    });
    expect(JSON.stringify(shape)).not.toContain(SECRET);
  });

  it("classe une erreur zod comme des arguments à corriger", () => {
    const parsed = z.object({ query: z.number() }).safeParse({ query: SECRET });
    expect(parsed.success).toBe(false);
    if (parsed.success) {
      return;
    }
    const shape = toAgentToolError(parsed.error).toSafeShape();
    expect(shape.category).toBe("invalid_arguments");
    expect(shape.code).toBe(AGENT_ERROR_CODES.invalidInput);
    expect(shape.retryable).toBe(false);
    expect(shape.message).toContain("query");
    expect(JSON.stringify(shape)).not.toContain(SECRET);
    expect(shape.message).not.toContain("at ");
  });
});

describe("Agent — synthèse sans tool_choice", () => {
  it("ne déclare tool_choice que si le catalogue le porte", () => {
    const flint = {
      description: "Flint",
      id: FLINT_MODEL_ID,
      name: "Flint",
      provider: "recursive",
      supported_parameters: ["tools"],
    };
    const withChoice = {
      ...flint,
      id: "mai-2",
      supported_parameters: ["tools", " Tool_Choice "],
    };
    expect(supportsToolChoice(FLINT_MODEL_ID, [flint])).toBe(false);
    expect(supportsToolChoice(FLINT_MODEL_ID)).toBe(false);
    expect(supportsToolChoice("mai-2", [withChoice])).toBe(true);
  });

  it("retire les outils quand tool_choice n'est pas déclaré", () => {
    const without = agentFinalStepToolControl(false);
    expect(without).toEqual({ activeTools: [] });
    expect(without).not.toHaveProperty("toolChoice");

    const withChoice = agentFinalStepToolControl(true);
    expect(withChoice).toEqual({ toolChoice: "none" });
    expect(withChoice).not.toHaveProperty("activeTools");
  });
});

describe("Agent — réparation des appels d'outils", () => {
  it("corrige une virgule finale et refuse un JSON déjà valide ou un nom inventé", async () => {
    expect(repairToolInputJson('{"value":"ok",}')).toBe('{"value":"ok"}');
    expect(repairToolInputJson('{"value":"ok"}')).toBeNull();
    expect(repairToolInputJson("{")).toBeNull();

    const repaired = await repairAgentToolCall({
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
    expect(repaired?.input).toBe('{"value":"ok"}');

    const unknown = await repairAgentToolCall({
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
    expect(unknown).toBeNull();

    const schema = await repairAgentToolCall({
      error: new InvalidToolInputError({
        cause: new Error("schéma"),
        toolInput: '{"value":1}',
        toolName: "ping",
      }),
      toolCall: {
        input: '{"value":1}',
        toolCallId: "call-1",
        toolName: "ping",
      },
    });
    expect(schema).toBeNull();
  });

  it("ne répare pas quand le budget du run est épuisé", async () => {
    const call = {
      input: '{"value":"ok",}',
      toolCallId: "call-1",
      toolName: "ping",
    };
    const error = new InvalidToolInputError({
      cause: new SyntaxError("virgule"),
      toolInput: call.input,
      toolName: "ping",
    });
    await expect(
      repairAgentToolCallWithinBudget({
        budgetExhausted: true,
        error,
        toolCall: call,
      })
    ).resolves.toBeNull();
    await expect(
      repairAgentToolCallWithinBudget({
        budgetExhausted: false,
        error,
        toolCall: call,
      })
    ).resolves.toMatchObject({ input: '{"value":"ok"}' });
  });
});

function usage() {
  return {
    inputTokens: { cacheRead: 0, cacheWrite: 0, noCache: 4, total: 4 },
    outputTokens: { reasoning: 0, text: 2, total: 2 },
  };
}

function toolStream(toolName: string, input: string, toolCallId: string) {
  return {
    stream: new ReadableStream({
      start(controller) {
        controller.enqueue({ input, toolCallId, toolName, type: "tool-call" });
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

function pingTool(executed: unknown[]) {
  return tool({
    description: "Répond à un ping.",
    execute: async (input) => {
      executed.push(input);
      return { ok: true };
    },
    inputSchema: z.object({ value: z.string() }),
  });
}

describe("Agent — boucle Flint bornée", () => {
  const maxSteps = 4;

  function flintLoop(doStream: () => ReturnType<typeof toolStream>) {
    const model = new MockLanguageModelV4({
      doStream: async () => doStream(),
      modelId: FLINT_MODEL_ID,
    });
    const executed: unknown[] = [];
    const result = streamText({
      model,
      prepareStep: ({ steps }) => {
        const force = shouldForceAgentFinalResponse({
          elapsedMs: 0,
          maxDurationMs: 60_000,
          maxSteps,
          maxToolCalls: 24,
          productLimitReached: false,
          stepCount: steps.length,
          toolCallCount: steps.reduce(
            (total, step) => total + (step.toolCalls?.length ?? 0),
            0
          ),
        });
        if (!force) {
          return;
        }
        return {
          ...agentFinalStepToolControl(false),
          instructions: AGENT_FINAL_RESPONSE_INSTRUCTION,
        };
      },
      prompt: "continue",
      repairToolCall: (options) =>
        repairAgentToolCallWithinBudget({
          budgetExhausted: false,
          error: options.error,
          toolCall: options.toolCall,
        }),
      stopWhen: ({ steps }) => {
        const stepCountNow = steps.length;
        const lastStepHasToolCalls = (steps.at(-1)?.toolCalls?.length ?? 0) > 0;
        if (stepCountNow > maxSteps) {
          return true;
        }
        return stepCountNow >= maxSteps && !lastStepHasToolCalls;
      },
      tools: { ping: pingTool(executed) },
    });
    return { executed, model, result };
  }

  it("retire les outils à la synthèse, sans envoyer tool_choice", async () => {
    let call = 0;
    const { executed, model, result } = flintLoop(() => {
      call += 1;
      return toolStream("ping", '{"value":"x"}', `call-${call}`);
    });

    await expect(result.finishReason).resolves.not.toBe("error");
    expect(model.modelId).toBe(FLINT_MODEL_ID);
    expect(model.doStreamCalls).toHaveLength(maxSteps + 1);
    expect(model.doStreamCalls[2]?.tools?.length).toBeGreaterThan(0);
    expect(model.doStreamCalls[3]?.tools).toBeUndefined();
    expect(model.doStreamCalls[4]?.tools).toBeUndefined();
    expect(model.doStreamCalls[3]?.toolChoice).not.toEqual({ type: "none" });
    expect(model.doStreamCalls[4]?.toolChoice).not.toEqual({ type: "none" });
    expect(JSON.stringify(model.doStreamCalls[3])).toContain(
      "ÉTAPE FINALE OBLIGATOIRE"
    );
    expect(executed.length).toBeLessThanOrEqual(maxSteps);
  });

  it("arrête une série d'appels invalides au plafond d'étapes", async () => {
    let call = 0;
    const { executed, model, result } = flintLoop(() => {
      call += 1;
      return toolStream("sendEmail", "{", `call-${call}`);
    });

    await expect(result.finishReason).resolves.not.toBe("error");
    expect(model.doStreamCalls.length).toBeLessThanOrEqual(maxSteps + 1);
    expect(model.doStreamCalls.length).toBeGreaterThan(1);
    expect(executed).toEqual([]);
  });
});
