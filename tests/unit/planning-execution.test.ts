import { readFileSync } from "node:fs";
import { generateText, tool } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { ChatModel } from "@/lib/ai/models";
import {
  CHAT_FALLBACK_FINAL_RESPONSE,
  CHAT_FINAL_RESPONSE_INSTRUCTION,
} from "@/lib/chat/loop";
import {
  announcePlanningTools,
  createPlanningLoopControls,
  mergePlanningTools,
  PLANNING_EMPTY_RESULT_ERROR,
  PLANNING_MAX_STEPS,
  planningAssistantParts,
  planningExecutionOutcome,
  planningModelToolParams,
  planningToolsSupported,
  toPlanningModelMessages,
} from "@/lib/planning/generation";
import { buildChatSystemPrompt } from "@/lib/prompts/chat";

const FLINT_MODEL_ID = "recursive/flint-v1.0:free";
const FALSE_SUCCESS = "Message exécuté avec succès.";

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

function toolResult(toolName: string, input: string, toolCallId: string) {
  return {
    content: [
      {
        input,
        toolCallId,
        toolName,
        type: "tool-call" as const,
      },
    ],
    finishReason: { raw: "tool_calls", unified: "tool-calls" as const },
    usage: usage(),
    warnings: [],
  };
}

function textResult(text: string) {
  return {
    content: [{ text, type: "text" as const }],
    finishReason: { raw: "stop", unified: "stop" as const },
    usage: usage(),
    warnings: [],
  };
}

function flintModel(
  next: () => ReturnType<typeof toolResult> | ReturnType<typeof textResult>
) {
  return new MockLanguageModelV4({
    doGenerate: async () => next(),
    modelId: FLINT_MODEL_ID,
  });
}

function flintCatalog(supported: string[]): ChatModel {
  return {
    description: "Flint",
    id: FLINT_MODEL_ID,
    name: "Flint",
    provider: "recursive",
    supported_parameters: supported,
  };
}

function searchTools(order: string[]) {
  return {
    readUrl: tool({
      description: "Lit le texte d'une page.",
      execute: async () => {
        order.push("readUrl");
        return { text: "contenu de la page" };
      },
      inputSchema: z.object({
        url: z.string(),
      }),
    }),
    webSearch: tool({
      description: "Recherche sur le Web.",
      execute: async () => {
        order.push("webSearch");
        return {
          results: [{ title: "Doc", url: "https://example.com/doc" }],
        };
      },
      inputSchema: z.object({
        query: z.string(),
      }),
    }),
  };
}

describe("Planification Flint — webSearch puis readUrl", () => {
  it("enchaîne les deux outils et synthétise, sans tool_choice", async () => {
    const supported = planningToolsSupported({
      modelId: FLINT_MODEL_ID,
      models: [flintCatalog(["tools"])],
    });
    expect(supported).toBe(true);

    const order: string[] = [];
    const tools = searchTools(order);
    let step = 0;
    const model = flintModel(() => {
      step += 1;
      if (step === 1) {
        return toolResult(
          "webSearch",
          '{"query":"documentation"}',
          "call-search"
        );
      }
      if (step === 2) {
        return toolResult(
          "readUrl",
          '{"url":"https://example.com/doc"}',
          "call-read"
        );
      }
      return textResult("Synthèse des sources.");
    });

    const result = await generateText({
      model,
      prompt: "Documente ce sujet.",
      ...planningModelToolParams({
        activeIds: ["webSearch", "readUrl"],
        tools,
        toolsSupported: supported,
      }),
      ...createPlanningLoopControls({
        instructions: "INSTRUCTIONS",
        supportsTools: true,
      }),
    });

    expect(model.modelId).toBe(FLINT_MODEL_ID);
    expect(result.finishReason).not.toBe("error");
    expect(result.text).toBe("Synthèse des sources.");
    expect(order).toEqual(["webSearch", "readUrl"]);
    expect(model.doGenerateCalls).toHaveLength(3);
    expect(JSON.stringify(model.doGenerateCalls[1])).toContain(
      "https://example.com/doc"
    );
    expect(JSON.stringify(model.doGenerateCalls[0])).not.toContain(
      CHAT_FINAL_RESPONSE_INSTRUCTION
    );
    for (const call of model.doGenerateCalls) {
      expect(call.toolChoice).not.toEqual({ type: "none" });
    }

    const parts = planningAssistantParts({
      steps: result.steps.map((step) => ({
        toolCalls: step.toolCalls,
        toolResults: step.toolResults,
      })),
      text: result.text,
    });
    expect(parts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          state: "output-available",
          type: "tool-webSearch",
        }),
        expect.objectContaining({
          output: { text: "contenu de la page" },
          state: "output-available",
          type: "tool-readUrl",
        }),
      ])
    );
  });

  it("répare une virgule finale et exécute webSearch", async () => {
    const order: string[] = [];
    const tools = searchTools(order);
    let step = 0;
    const model = flintModel(() => {
      step += 1;
      if (step === 1) {
        return toolResult("webSearch", '{"query":"docs",}', "call-search");
      }
      return textResult("Recherche corrigée.");
    });

    const result = await generateText({
      model,
      prompt: "cherche",
      tools,
      ...createPlanningLoopControls({
        instructions: "INSTRUCTIONS",
        supportsTools: true,
      }),
    });

    expect(result.text).toBe("Recherche corrigée.");
    expect(result.finishReason).not.toBe("error");
    expect(order).toEqual(["webSearch"]);
    expect(model.modelId).toBe(FLINT_MODEL_ID);
  });

  it("réserve une synthèse sans outils quand le plafond de 6 est un appel", async () => {
    expect(PLANNING_MAX_STEPS).toBe(6);
    const order: string[] = [];
    const tools = searchTools(order);
    let step = 0;
    const model = flintModel(() => {
      step += 1;
      return toolResult("webSearch", '{"query":"encore"}', `call-${step}`);
    });

    const result = await generateText({
      model,
      prompt: "continue",
      tools,
      ...createPlanningLoopControls({
        instructions: "INSTRUCTIONS",
        supportsTools: true,
      }),
    });

    expect(result.finishReason).not.toBe("error");
    expect(model.doGenerateCalls).toHaveLength(7);
    expect(model.modelId).toBe(FLINT_MODEL_ID);
    expect(model.doGenerateCalls[4]?.tools?.length).toBeGreaterThan(0);
    expect(model.doGenerateCalls[5]?.tools).toBeUndefined();
    expect(model.doGenerateCalls[6]?.tools).toBeUndefined();
    expect(model.doGenerateCalls[5]?.toolChoice).not.toEqual({ type: "none" });
    expect(model.doGenerateCalls[6]?.toolChoice).not.toEqual({ type: "none" });
    const synthesis = JSON.stringify(model.doGenerateCalls[5]);
    expect(synthesis).toContain(CHAT_FINAL_RESPONSE_INSTRUCTION);
    expect(JSON.stringify(model.doGenerateCalls[0])).not.toContain(
      CHAT_FINAL_RESPONSE_INSTRUCTION
    );
    expect(order).toHaveLength(5);
  });
});

describe("Verdict d'une exécution planifiée", () => {
  it("marque un texte vide comme un échec, sans faux succès", async () => {
    const model = flintModel(() => textResult(""));
    const result = await generateText({
      model,
      prompt: "résume",
      ...createPlanningLoopControls({
        instructions: "INSTRUCTIONS",
        supportsTools: false,
      }),
    });

    const outcome = planningExecutionOutcome(result.text);
    expect(outcome).toEqual({
      lastError: PLANNING_EMPTY_RESULT_ERROR,
      status: "failed",
      text: CHAT_FALLBACK_FINAL_RESPONSE,
    });
    expect(JSON.stringify(outcome)).not.toContain(FALSE_SUCCESS);
    const executor = readFileSync("lib/planning/executor.ts", "utf8");
    expect(executor).not.toContain(FALSE_SUCCESS);
    expect(executor).toContain("guardNativeChatTools");
    expect(executor).toContain("readUrl");
    expect(executor).toContain("createPlanningLoopControls");
    expect(executor).toContain("fetchModelsForUser");
    expect(executor).toContain("...(wantsNativeTools ? nativeTools : {})");
  });

  it("conserve un texte utile comme exécution terminée", () => {
    expect(planningExecutionOutcome("Voici le résumé.")).toEqual({
      status: "completed",
      text: "Voici le résumé.",
    });
  });
});

describe("Plateau de la planification", () => {
  it("laisse l'outil natif gagner et signale la collision", () => {
    const native = { description: "Recherche native." };
    const plugin = { description: "Recherche d'un plugin." };
    const merged = mergePlanningTools({
      custom: {},
      mcp: {},
      native: { webSearch: native },
      plugin: { webSearch: plugin },
    });

    expect(merged.tools.webSearch).toBe(native);
    expect(merged.collisions).toEqual([
      { dropped: "plugin", id: "webSearch", kept: "native" },
    ]);
  });

  it("n'envoie aucun outil quand le catalogue refuse le tool calling", () => {
    expect(
      planningToolsSupported({
        modelId: FLINT_MODEL_ID,
        models: [flintCatalog(["temperature"])],
      })
    ).toBe(false);
    expect(
      planningToolsSupported({
        modelId: FLINT_MODEL_ID,
        models: [],
      })
    ).toBe(false);

    const params = planningModelToolParams({
      activeIds: ["webSearch", "readUrl"],
      tools: { readUrl: {}, webSearch: {} },
      toolsSupported: false,
    });
    expect(params).toEqual({});
  });

  it("n'annonce pas un outil sans description utile", () => {
    const announced = announcePlanningTools({
      hints: {},
      owners: new Map([["mystery", "plugin"]]),
      toolIds: ["mystery", "webSearch"],
      tools: {
        mystery: { description: "Outil disponible pour cette tâche." },
        webSearch: { description: "Recherche puis readUrl." },
      },
    });

    expect(announced.map((tool) => tool.id)).toEqual(["webSearch"]);
    const prompt = buildChatSystemPrompt({
      addendum: null,
      artifactsAvailable: false,
      capabilities: {
        attachments: 0,
        memory: null,
        plan: null,
        reasoning: false,
        tools: announced.map((tool) => ({
          description: tool.description,
          id: tool.id,
          kind: tool.kind,
          label: tool.id,
        })),
        toolsSupported: true,
      },
      requestHints: null,
    });
    expect(prompt).not.toContain("Outil disponible pour cette tâche.");
    expect(prompt).not.toContain("mystery");
    expect(prompt).toContain("webSearch");
  });
});

describe("Historique envoyé au modèle", () => {
  it("conserve l'appel et le résultat d'outil d'un message précédent", async () => {
    const parts = planningAssistantParts({
      steps: [
        {
          toolCalls: [
            {
              input: { query: "docs" },
              toolCallId: "call-search",
              toolName: "webSearch",
            },
          ],
          toolResults: [
            {
              output: { url: "https://example.com/doc" },
              toolCallId: "call-search",
              toolName: "webSearch",
            },
          ],
        },
      ],
      text: "Page retenue.",
    });
    const textOnly = parts
      .flatMap((part) => (part.type === "text" ? [part.text] : []))
      .join("\n");
    expect(textOnly).not.toContain("https://example.com/doc");

    const messages = await toPlanningModelMessages({
      messages: [
        {
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          id: "assistant-1",
          parts,
          role: "assistant",
        },
      ],
      prompt: "Lis cette page.",
    });

    const serialized = JSON.stringify(messages);
    expect(serialized).toContain("tool-call");
    expect(serialized).toContain("tool-result");
    expect(serialized).toContain("webSearch");
    expect(serialized).toContain("https://example.com/doc");
    expect(serialized).toContain("Lis cette page.");
  });
});
