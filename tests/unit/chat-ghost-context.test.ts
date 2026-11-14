import { beforeEach, describe, expect, it, vi } from "vitest";

// Contrat de contexte du mode Fantôme (issue #44) : la session garde son
// contexte entre deux tours SANS qu'une seule ligne Fantôme n'entre dans
// l'historique permanent ni dans les statistiques du compte. Aucun appel au
// modèle n'est fait ici — le contrat porte sur ce qui est envoyé au modèle et
// sur ce qui n'est PAS écrit en base.

const {
  getChatByIdMock,
  getMessagesByChatIdMock,
  getUserModelPreferencesMock,
  prepareSkillContextMock,
  saveChatMock,
  saveMessagesMock,
} = vi.hoisted(() => ({
  getChatByIdMock: vi.fn(async () => null),
  getMessagesByChatIdMock: vi.fn(async (): Promise<never[]> => []),
  getUserModelPreferencesMock: vi.fn(async () => ({
    customInstructions: null,
    customInstructionsEnabled: false,
    defaultTemperature: null,
    defaultTopP: null,
    reasoningLevel: null,
  })),
  prepareSkillContextMock: vi.fn(async () => ({
    parameterError: null,
    skillId: null,
  })),
  saveChatMock: vi.fn(async () => undefined),
  saveMessagesMock: vi.fn(async () => undefined),
}));

vi.mock("@vercel/functions", () => ({ geolocation: () => ({}) }));
vi.mock("@/lib/ai/models", () => ({
  DEFAULT_CHAT_MODEL: "modele-test",
  getModelCapabilities: () => ({ vision: true }),
}));
vi.mock("@/lib/chat/security", () => ({
  assertChatUnlocked: async () => undefined,
}));
vi.mock("@/lib/chat/skills", () => ({
  intersecterFiltres: (filters: unknown[]) => filters.find(Boolean) ?? null,
  prepareSkillContext: prepareSkillContextMock,
}));
vi.mock("@/lib/db/api-keys", () => ({ getUserApiKey: async () => null }));
vi.mock("@/lib/projects/access", () => ({
  getProjectAccess: async () => null,
}));
vi.mock("@/lib/db/queries", () => ({
  getAgentById: vi.fn(async () => null),
  getChatById: getChatByIdMock,
  getMessagesByChatId: getMessagesByChatIdMock,
  getProjectById: vi.fn(async () => null),
  getProjectFilesForInjection: vi.fn(async () => []),
  getSkillById: vi.fn(async () => null),
  getSkillsByUserId: vi.fn(async () => []),
  getUserModelPreferences: getUserModelPreferencesMock,
  saveChat: saveChatMock,
  saveMessages: saveMessagesMock,
  trackSkillUsage: vi.fn(async () => undefined),
  updateChatProjectById: vi.fn(async () => undefined),
}));

import { buildPostRequestBodySchema } from "@/app/(chat)/api/chat/schema";
import type { ChatAuth } from "@/lib/chat/auth";
import {
  buildChatContext,
  type ChatRequestBodyShape,
} from "@/lib/chat/context";
import type { ChatMessage } from "@/lib/types";

const MARKER = "LILAS-427";

function auth(): ChatAuth {
  return {
    isFreeUser: true,
    maiUser: {
      email: "utilisateur@test.local",
      id: "user-test",
      limit: 0,
      tier: "free",
      tokensUsed: 0,
      username: "utilisateur",
    },
    sessionToken: "jeton-test",
    userId: "user-test",
  };
}

function userMessage(id: string, text: string): ChatMessage {
  return {
    id,
    parts: [{ text, type: "text" }],
    role: "user",
  } as ChatMessage;
}

function assistantMessage(id: string, text: string): ChatMessage {
  return {
    id,
    parts: [{ text, type: "text" }],
    role: "assistant",
  } as ChatMessage;
}

function ghostBody(
  overrides: Partial<ChatRequestBodyShape>
): ChatRequestBodyShape {
  return {
    agentId: null,
    id: "chat-fantome",
    isGhostMode: true,
    message: null,
    messages: null,
    selectedAgentId: null,
    selectedChatModel: "modele-test",
    selectedVisibilityType: "private",
    ...overrides,
  };
}

function textsOf(messages: unknown): string {
  return JSON.stringify(messages);
}

describe("Mode Fantôme — contrat de contexte entre deux tours (issue #44)", () => {
  beforeEach(() => {
    saveChatMock.mockClear();
    saveMessagesMock.mockClear();
    getChatByIdMock.mockClear();
    getMessagesByChatIdMock.mockClear();
    getUserModelPreferencesMock.mockClear();
    prepareSkillContextMock.mockClear();
  });

  it("ne crée ni conversation ni message en base (aucune ligne Fantôme)", async () => {
    const ctx = await buildChatContext(
      new Request("https://test.local/api/chat"),
      auth(),
      ghostBody({
        message: userMessage("m1", `Pose le marqueur ${MARKER}.`),
      })
    );

    expect(saveChatMock).not.toHaveBeenCalled();
    expect(saveMessagesMock).not.toHaveBeenCalled();
    // Le marqueur est bien dans le contexte envoyé au modèle.
    expect(textsOf(ctx.modelMessages)).toContain(MARKER);
  });

  it("renvoie le marqueur du premier tour au second tour via ghostHistory", async () => {
    // Tour 1 : le marqueur est posé (accusé de réception).
    await buildChatContext(
      new Request("https://test.local/api/chat"),
      auth(),
      ghostBody({
        message: userMessage("m1", `Pose le marqueur ${MARKER}.`),
      })
    );

    // Tour 2 : le client renvoie la session en mémoire (ghostHistory) — c'est
    // le correctif : la base reste vide, le contexte voyage avec la requête.
    const ctx = await buildChatContext(
      new Request("https://test.local/api/chat"),
      auth(),
      ghostBody({
        ghostHistory: [
          userMessage("m1", `Pose le marqueur ${MARKER}.`),
          assistantMessage("a1", `Marqueur ${MARKER} accusé.`),
        ],
        message: userMessage("m2", "Quel marqueur ai-je posé ?"),
      })
    );

    // Le second tour reçoit le marqueur du premier.
    expect(textsOf(ctx.modelMessages)).toContain(MARKER);
    expect(textsOf(ctx.modelMessages)).toContain("Quel marqueur ai-je posé ?");
    // Et toujours rien en base : non-persistance garantie.
    expect(saveChatMock).not.toHaveBeenCalled();
    expect(saveMessagesMock).not.toHaveBeenCalled();
  });

  it("n'écrit pas le message courant en base en mode Fantôme même sans historique", async () => {
    const ctx = await buildChatContext(
      new Request("https://test.local/api/chat"),
      auth(),
      ghostBody({
        message: userMessage("m3", "Tour sans historique côté client."),
      })
    );

    expect(saveMessagesMock).not.toHaveBeenCalled();
    // Sans historique, seul le tour courant est présent — c'est exactement la
    // perte de contexte constatée, documentée ici comme limite du contrat.
    expect(textsOf(ctx.modelMessages)).not.toContain(MARKER);
    expect(ctx.uiMessages).toHaveLength(1);
  });

  it("accepte ghostHistory et truncateAfterMessageId dans le schéma de la requête", () => {
    const parsed = buildPostRequestBodySchema("free").safeParse({
      ghostHistory: [
        { id: "m1", parts: [{ text: MARKER, type: "text" }], role: "user" },
        {
          id: "a1",
          parts: [{ text: "accusé", type: "text" }],
          role: "assistant",
        },
      ],
      id: "chat-fantome",
      isGhostMode: true,
      message: {
        id: "message-2",
        parts: [{ text: "rappelle", type: "text" }],
        role: "user",
      },
      selectedChatModel: "modele-test",
      selectedVisibilityType: "private",
      truncateAfterMessageId: "message-cible",
    });
    expect(parsed.success).toBe(true);
  });
});
