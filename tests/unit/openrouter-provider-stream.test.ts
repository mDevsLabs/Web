import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  normalizeOpenRouterSsePayload,
  prepareOpenRouterRequestBody,
  resolveOpenRouterApiKey,
  resolveOpenRouterModelId,
} from "@/lib/ai/providers";
import {
  formatUserFacingAiError,
  MAI_SERVER_DIFFICULTIES_MESSAGE,
} from "@/lib/ai/server-error-message";
import { ChatbotError } from "@/lib/errors";

const {
  createNotificationMock,
  deleteMessagesAfterMessageIdMock,
  saveMessagesMock,
  updateMessageMock,
} = vi.hoisted(() => ({
  createNotificationMock: vi.fn(async () => undefined),
  deleteMessagesAfterMessageIdMock: vi.fn(async (): Promise<string[]> => []),
  saveMessagesMock: vi.fn(async () => undefined),
  updateMessageMock: vi.fn(async () => undefined),
}));

vi.mock("@/app/(chat)/actions", () => ({
  generateTitleFromConversation: async () => null,
}));
vi.mock("@/lib/db/queries", () => ({
  createNotification: createNotificationMock,
  createStreamId: vi.fn(async () => undefined),
  deleteMessagesAfterMessageId: deleteMessagesAfterMessageIdMock,
  recordTokenUsage: vi.fn(async () => undefined),
  saveMessages: saveMessagesMock,
  updateMessage: updateMessageMock,
}));

import type { ChatRequestContext } from "@/lib/chat/context";
import { formatChatStreamError, persistStreamEnd } from "@/lib/chat/stream";
import type { ChatMessage } from "@/lib/types";

describe("Routage et normalisation OpenRouter (lib/ai/providers.ts)", () => {
  const originalOpenRouterKey = process.env.OPENROUTER_API_KEY;
  const originalOpenRouterBase = process.env.OPENROUTER_BASE_URL;

  beforeEach(() => {
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_BASE_URL;
  });

  afterEach(() => {
    if (originalOpenRouterKey === undefined) {
      delete process.env.OPENROUTER_API_KEY;
    } else {
      process.env.OPENROUTER_API_KEY = originalOpenRouterKey;
    }
    if (originalOpenRouterBase === undefined) {
      delete process.env.OPENROUTER_BASE_URL;
    } else {
      process.env.OPENROUTER_BASE_URL = originalOpenRouterBase;
    }
  });

  it("refuse d'envoyer un JWT ou une clé mai_ vers openrouter.ai si OPENROUTER_API_KEY manque", () => {
    expect(() =>
      resolveOpenRouterApiKey({
        apiKey: "mai_secret_key",
        sessionToken: "eyJhbGciOiJIUzI1NiJ9.payload.sig",
      })
    ).toThrow(/OPENROUTER_API_KEY/i);
  });

  it("accepte OPENROUTER_API_KEY nettoyée des espaces/retours ligne", () => {
    process.env.OPENROUTER_API_KEY = "  sk-or-v1-test-key \n";
    expect(resolveOpenRouterApiKey()).toBe("sk-or-v1-test-key");
  });

  it("accepte une clé utilisateur OpenRouter (sk-or-) quand OPENROUTER_API_KEY est absente", () => {
    expect(resolveOpenRouterApiKey({ apiKey: " sk-or-v1-user-key " })).toBe(
      "sk-or-v1-user-key"
    );
  });

  it("résout les alias souverains mAI vers leurs modèles OpenRouter réels", () => {
    expect(resolveOpenRouterModelId("mai-2-mini")).toBe("minimax/minimax-m3");
    expect(resolveOpenRouterModelId("mai-2")).toBe(
      "deepseek/deepseek-v4.1-flash"
    );
    expect(resolveOpenRouterModelId("mai-2.5-opal")).toBe("openai/gpt-6.1-sol");
    expect(resolveOpenRouterModelId("mDevsLabs/mai-2.5-apex")).toBe(
      "openai/gpt-6.1-terra"
    );
    expect(resolveOpenRouterModelId("google/gemini-2.5-flash")).toBe(
      "google/gemini-2.5-flash"
    );
  });

  it("traduit reasoning_effort en reasoning.effort et injecte le prompt d'identité mAI", () => {
    const out = prepareOpenRouterRequestBody(
      {
        messages: [{ content: "Salut", role: "user" }],
        model: "minimax/minimax-m3",
        reasoning_effort: "high",
        temperature: 0.7,
      },
      "mai-2-mini",
      "minimax/minimax-m3"
    );

    expect("reasoning_effort" in out).toBe(false);
    expect(out.reasoning).toEqual({ effort: "high" });
    expect(out.temperature).toBe(0.7);
    expect(
      (out.messages as Array<{ content: string; role: string }>)[0]
    ).toEqual({
      content: "You are mAI-2 Mini, developed by mAI.",
      role: "system",
    });
  });

  it("retire temperature et top_p sur les modèles GPT-6 OpenRouter et retire reasoning_effort=none", () => {
    const out = prepareOpenRouterRequestBody(
      {
        messages: [{ content: "Salut", role: "user" }],
        model: "openai/gpt-6.1-sol",
        reasoning_effort: "none",
        temperature: 0.7,
        top_p: 0.9,
      },
      "mai-2.5-opal",
      "openai/gpt-6.1-sol"
    );

    expect("reasoning_effort" in out).toBe(false);
    expect("reasoning" in out).toBe(false);
    expect("temperature" in out).toBe(false);
    expect("top_p" in out).toBe(false);
  });

  it("n'injecte pas d'identité mAI pour un modèle tiers OpenRouter", () => {
    const out = prepareOpenRouterRequestBody(
      {
        messages: [{ content: "Salut", role: "user" }],
        model: "google/gemini-2.5-flash",
      },
      "google/gemini-2.5-flash",
      "google/gemini-2.5-flash"
    );

    expect(out.messages).toEqual([{ content: "Salut", role: "user" }]);
  });

  it("normalise les chunks SSE OpenRouter non standard (delta.role vide, index absent, annotations)", () => {
    const rawChunk = JSON.stringify({
      choices: [
        {
          delta: {
            annotations: [{ custom: "baidu" }],
            content: "Bonjour !",
            role: "",
            tool_calls: [
              {
                function: { arguments: "{}", name: "webSearch" },
                id: "call_1",
              },
            ],
          },
        },
      ],
      id: "gen-ernie-1",
    });

    const normalized = JSON.parse(normalizeOpenRouterSsePayload(rawChunk));
    expect(normalized.choices[0].index).toBe(0);
    expect("role" in normalized.choices[0].delta).toBe(false);
    expect("annotations" in normalized.choices[0].delta).toBe(false);
    expect(normalized.choices[0].delta.content).toBe("Bonjour !");
    expect(normalized.choices[0].delta.tool_calls[0].index).toBe(0);
  });
});

describe("Diagnostic d'erreur et protection contre les bulles vides (lib/chat/stream.ts)", () => {
  beforeEach(() => {
    saveMessagesMock.mockClear();
    createNotificationMock.mockClear();
    deleteMessagesAfterMessageIdMock.mockClear();
  });

  it("unifie toutes les pannes OpenRouter et serveur sur « Nos serveurs rencontrent des difficultés » tout en préservant les erreurs métier", () => {
    for (const statusCode of [400, 401, 402, 404, 429, 500, 502, 503]) {
      expect(formatChatStreamError({ statusCode })).toBe(
        MAI_SERVER_DIFFICULTIES_MESSAGE
      );
    }

    expect(
      formatUserFacingAiError(new Error("AI_TypeValidationError: delta.role"))
    ).toBe(MAI_SERVER_DIFFICULTIES_MESSAGE);
    expect(formatUserFacingAiError(new TypeError("Failed to fetch"))).toBe(
      MAI_SERVER_DIFFICULTIES_MESSAGE
    );
    expect(
      formatUserFacingAiError(new ChatbotError("bad_request:database"))
    ).toBe(MAI_SERVER_DIFFICULTIES_MESSAGE);

    // Préservation des messages métier actionnables (quota, forfait, média)
    const quotaErr = new ChatbotError("rate_limit:chat", undefined, {
      apiCode: "quota_exceeded",
      messageOverride: "Votre quota hebdomadaire est atteint.",
    });
    expect(formatUserFacingAiError(quotaErr)).toBe(
      "Votre quota hebdomadaire est atteint."
    );
    expect(
      formatUserFacingAiError({
        code: "plan_required",
        message: "Le mode Agent est réservé aux forfaits Plus, Pro et Max.",
        status: 403,
      })
    ).toBe("Le mode Agent est réservé aux forfaits Plus, Pro et Max.");
    expect(
      formatUserFacingAiError(
        new Error("Les images ne sont pas encore prises en charge par Coach.")
      )
    ).toBe("Les images ne sont pas encore prises en charge par Coach.");
  });

  it("ne persiste pas un message assistant totalement vide après un échec de flux", async () => {
    const ctx = {
      id: "chat-empty",
      isGhostMode: false,
      isToolApprovalFlow: false,
      truncateAfterMessageId: null,
      uiMessages: [],
      userId: "user-1",
    } as unknown as ChatRequestContext;

    const emptyAssistant = {
      id: "a-empty",
      parts: [],
      role: "assistant",
    } as unknown as ChatMessage;

    await persistStreamEnd(ctx, [emptyAssistant], { outcomeStatus: "failed" });
    expect(saveMessagesMock).not.toHaveBeenCalled();
  });
});
