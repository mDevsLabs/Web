import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  prepareOpenRouterRequestBody,
  resolveOpenRouterApiKey,
  resolveOpenRouterModelId,
} from "@/lib/ai/providers";

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
});

describe("Diagnostic d'erreur et protection contre les bulles vides (lib/chat/stream.ts)", () => {
  beforeEach(() => {
    saveMessagesMock.mockClear();
    createNotificationMock.mockClear();
    deleteMessagesAfterMessageIdMock.mockClear();
  });

  it("traduit les codes d'erreur OpenRouter (401, 402, 404, 429, 400) en français clair", () => {
    expect(formatChatStreamError({ statusCode: 401 })).toContain(
      "Clé API OpenRouter"
    );
    expect(formatChatStreamError({ statusCode: 402 })).toContain(
      "Crédits OpenRouter insuffisants"
    );
    expect(formatChatStreamError({ statusCode: 404 })).toContain(
      "pas disponible sur OpenRouter"
    );
    expect(formatChatStreamError({ statusCode: 429 })).toContain("429");
    expect(formatChatStreamError({ statusCode: 400 })).toContain(
      "paramètres incompatibles"
    );
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
