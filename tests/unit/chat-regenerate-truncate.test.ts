import { beforeEach, describe, expect, it, vi } from "vitest";

// Contrat de régénération « truncate » (issues #45 et #46) au niveau de la
// construction du contexte : la nouvelle génération ne doit recevoir que la
// conversation jusqu'au message régénéré, et le message utilisateur déjà en
// base ne doit jamais être ré-inséré — la ré-insertion lèvait une clé primaire
// dupliquée (SQLSTATE 23505 sur Message_v2.id), mappée en `bad_request:database`
// puis en HTTP 500 par la route /api/chat.

const {
  getChatByIdMock,
  getMessagesByChatIdMock,
  getUserModelPreferencesMock,
  saveChatMock,
  saveMessagesMock,
} = vi.hoisted(() => ({
  getChatByIdMock: vi.fn(async (): Promise<unknown> => null),
  getMessagesByChatIdMock: vi.fn(async (): Promise<unknown[]> => []),
  getUserModelPreferencesMock: vi.fn(async () => ({
    customInstructions: null,
    customInstructionsEnabled: false,
    defaultTemperature: null,
    defaultTopP: null,
    reasoningLevel: null,
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
  prepareSkillContext: async () => ({ parameterError: null, skillId: null }),
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
import type { DBMessage } from "@/lib/db/schema";
import { ChatbotError } from "@/lib/errors";
import type { ChatMessage } from "@/lib/types";

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

function chat(): Record<string, unknown> {
  return {
    agentId: null,
    customInstructions: null,
    id: "chat-regen",
    mode: "chat",
    projectId: null,
    skillId: null,
    tags: [],
    temperatureOverride: null,
    title: "Conversation QA",
    userId: "user-test",
    visibility: "private",
  };
}

function dbMessage(
  id: string,
  role: "assistant" | "user",
  text: string,
  createdAt: Date
): DBMessage {
  return {
    attachments: [],
    chatId: "chat-regen",
    createdAt,
    id,
    parts: [{ text, type: "text" }],
    role,
  } as DBMessage;
}

function userMessage(id: string, text: string): ChatMessage {
  return { id, parts: [{ text, type: "text" }], role: "user" } as ChatMessage;
}

function baseBody(
  overrides: Partial<ChatRequestBodyShape>
): ChatRequestBodyShape {
  return {
    agentId: null,
    id: "chat-regen",
    isGhostMode: false,
    message: null,
    messages: null,
    selectedAgentId: null,
    selectedChatModel: "modele-test",
    selectedVisibilityType: "private",
    ...overrides,
  };
}

// Fixture « document Markdown long » de l'issue #45 : code, tableau, liens et
// Unicode — sous la borne de 8000 caractères par part de texte du schéma.
const LONG_DOCUMENT = [
  "# Copie exacte du document",
  "",
  "Voici la copie demandée, avec **gras**, *italique* et accents : été, œuvre, ça.",
  "",
  "```typescript",
  "export function doublon(n: number): number {",
  "  return n * 2; // ← commentaire unicode ✓",
  "}",
  "```",
  "",
  "| Colonne A | Colonne B |",
  "| --------- | --------- |",
  ...Array.from({ length: 40 }, (_, index) => {
    const row = `| ligne ${index} | valeur ${index} avec accent é à ü |`;
    return row;
  }),
  "",
  ...Array.from({ length: 20 }, (_, index) => {
    const line = `- [lien ${index}](https://example.com/document/${index}?q=été) : paragraphe ${index} — texte de remplissage, chiffres ${index * 7}, emoji 🎯.`;
    return line;
  }),
  "",
  "FIN-DU-DOCUMENT",
].join("\n");

describe("Régénération truncate — contrat de contexte (issues #45/#46)", () => {
  beforeEach(() => {
    getChatByIdMock.mockReset();
    getMessagesByChatIdMock.mockReset();
    getUserModelPreferencesMock.mockClear();
    saveChatMock.mockClear();
    saveMessagesMock.mockClear();
  });

  it("arrête le contexte au message régénéré : l'ancienne réponse ne nourrit pas le modèle", async () => {
    getChatByIdMock.mockResolvedValue(chat());
    getMessagesByChatIdMock.mockResolvedValue([
      dbMessage("u1", "user", "Question 1", new Date("2026-01-01T10:00:00Z")),
      dbMessage(
        "a1",
        "assistant",
        "Réponse 1 MARQUEUR-CONSERVÉ",
        new Date("2026-01-01T10:00:01Z")
      ),
      dbMessage("u2", "user", "Question 2", new Date("2026-01-01T10:01:00Z")),
      dbMessage(
        "a2",
        "assistant",
        "Réponse 2 ANCIENNE-RÉPONSE",
        new Date("2026-01-01T10:01:01Z")
      ),
    ]);

    const ctx = await buildChatContext(
      new Request("https://test.local/api/chat"),
      auth(),
      baseBody({
        message: userMessage("u2", "Question 2"),
        truncateAfterMessageId: "u2",
      })
    );

    const sent = JSON.stringify(ctx.modelMessages);
    // Le tour précédent (avant le message régénéré) reste dans le contexte.
    expect(sent).toContain("MARQUEUR-CONSERVÉ");
    // L'ancienne réponse remplacée n'y est plus.
    expect(sent).not.toContain("ANCIENNE-RÉPONSE");
    // Le message régénéré apparaît une seule fois.
    expect(sent.split("Question 2").length - 1).toBe(1);
  });

  it("ne ré-insère pas le message utilisateur déjà en base (cause de l'exception 23505 observée)", async () => {
    getChatByIdMock.mockResolvedValue(chat());
    getMessagesByChatIdMock.mockResolvedValue([
      dbMessage("u1", "user", "Question 1", new Date("2026-01-01T10:00:00Z")),
      dbMessage(
        "a1",
        "assistant",
        "Réponse 1",
        new Date("2026-01-01T10:00:01Z")
      ),
    ]);

    await buildChatContext(
      new Request("https://test.local/api/chat"),
      auth(),
      baseBody({
        message: userMessage("u1", "Question 1"),
        truncateAfterMessageId: "u1",
      })
    );

    // Aucune écriture : la ligne existe déjà, la ré-insérer lèverait
    // `duplicate key value violates unique constraint` → HTTP 500.
    expect(saveMessagesMock).not.toHaveBeenCalled();
  });

  it("reste silencieux sur un rejeu réseau sans truncateAfterMessageId (pas de doublon)", async () => {
    getChatByIdMock.mockResolvedValue(chat());
    getMessagesByChatIdMock.mockResolvedValue([
      dbMessage("u1", "user", "Question 1", new Date("2026-01-01T10:00:00Z")),
    ]);

    const ctx = await buildChatContext(
      new Request("https://test.local/api/chat"),
      auth(),
      baseBody({ message: userMessage("u1", "Question 1") })
    );

    expect(saveMessagesMock).not.toHaveBeenCalled();
    expect(ctx.uiMessages).toHaveLength(1);
  });

  it("régénère la fixture longue (code, tableau, liens, Unicode) sans exception", async () => {
    expect(LONG_DOCUMENT.length).toBeGreaterThan(3000);
    expect(LONG_DOCUMENT.length).toBeLessThan(8000);

    const parsed = buildPostRequestBodySchema("free").safeParse({
      id: "chat-regen",
      message: {
        id: "message-long-1",
        parts: [{ text: LONG_DOCUMENT, type: "text" }],
        role: "user",
      },
      selectedChatModel: "modele-test",
      selectedVisibilityType: "private",
      truncateAfterMessageId: "message-long-1",
    });
    expect(parsed.success).toBe(true);

    getChatByIdMock.mockResolvedValue(chat());
    getMessagesByChatIdMock.mockResolvedValue([
      dbMessage(
        "message-long-1",
        "user",
        LONG_DOCUMENT,
        new Date("2026-01-01T10:00:00Z")
      ),
      dbMessage(
        "a-long",
        "assistant",
        "Réponse longue ANCIENNE-RÉPONSE",
        new Date("2026-01-01T10:00:05Z")
      ),
    ]);

    const ctx = await buildChatContext(
      new Request("https://test.local/api/chat"),
      auth(),
      baseBody({
        message: userMessage("message-long-1", LONG_DOCUMENT),
        truncateAfterMessageId: "message-long-1",
      })
    );

    expect(JSON.stringify(ctx.modelMessages)).toContain("FIN-DU-DOCUMENT");
    expect(JSON.stringify(ctx.modelMessages)).not.toContain("ANCIENNE-RÉPONSE");
    expect(saveMessagesMock).not.toHaveBeenCalled();
  });

  it("régénère aussi une réponse courte sans changement de régime", async () => {
    getChatByIdMock.mockResolvedValue(chat());
    getMessagesByChatIdMock.mockResolvedValue([
      dbMessage(
        "u-c",
        "user",
        "Question courte",
        new Date("2026-01-01T10:00:00Z")
      ),
    ]);

    const ctx = await buildChatContext(
      new Request("https://test.local/api/chat"),
      auth(),
      baseBody({
        message: userMessage("u-c", "Question courte"),
        truncateAfterMessageId: "u-c",
      })
    );

    expect(JSON.stringify(ctx.modelMessages)).toContain("Question courte");
  });

  it("documente la chaîne d'exception observée : clé primaire dupliquée → HTTP 500", () => {
    // L'exception capturée en reproduction contrôlée (insertion du message
    // utilisateur déjà présent) est un échec `bad_request:database`, dont la
    // route /api/chat renvoie un HTTP 500 — exactement le statut observé sur
    // les régénérations. Le contrat ci-dessus supprime cette insertion.
    const error = new ChatbotError("bad_request:database", {
      cause: new Error(
        'duplicate key value violates unique constraint "Message_v2_pkey"'
      ),
    });
    expect(error.toResponse().status).toBe(500);
  });
});
