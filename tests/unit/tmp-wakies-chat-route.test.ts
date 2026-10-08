import { MockLanguageModelV3, simulateReadableStream } from "ai/test";
import { beforeEach, describe, expect, it, vi } from "vitest";

const recorded: unknown[] = [];
const appended: unknown[] = [];

vi.mock("@/lib/chat/auth", () => ({
  authenticateChatRequest: vi.fn(async () => ({
    auth: {
      isFreeUser: false,
      maiUser: {
        email: "test@example.fr",
        id: "u1",
        limit: 1_000_000,
        resetAt: null,
        tier: "plus",
        tokensUsed: 0,
      },
      sessionToken: "session-token",
      userId: "u1",
    },
  })),
  enforceChatRateLimit: vi.fn(async () => {}),
  weeklyQuotaExceeded: vi.fn(() => false),
}));

vi.mock("@/lib/wakies/queries", () => ({
  appendMessages: vi.fn(async (rows: unknown[]) => {
    appended.push(...rows);
  }),
  ensureSettings: vi.fn(async () => ({
    memoryAllowed: true,
    name: "Wakie",
    paused: false,
    researchAllowed: true,
    userId: "u1",
  })),
  findConversation: vi.fn(async () => ({
    id: "c1",
    title: "Test",
    userId: "u1",
    wakieId: "w1",
  })),
  findWakie: vi.fn(async () => ({
    id: "w1",
    instructions: "Tu es un assistant.",
    memoryAllowed: true,
    name: "Wakie",
    researchAllowed: false,
    spaceId: "s1",
    spaceIds: ["s1"],
    userId: "u1",
  })),
  listMemories: vi.fn(async () => []),
  messageExists: vi.fn(async () => false),
  pageForConversation: vi.fn(async () => null),
  touchConversation: vi.fn(async () => {}),
}));

vi.mock("@/lib/db/queries", () => ({
  dbReady: vi.fn(async () => {}),
  getDb: vi.fn(() => {
    throw new Error("pas de base dans ce test");
  }),
  recordTokenUsage: vi.fn(async (event: unknown) => {
    recorded.push(event);
  }),
}));

vi.mock("@/lib/ai/providers", () => ({
  getLanguageModel: vi.fn(
    () =>
      new MockLanguageModelV3({
        doStream: async () => ({
          stream: simulateReadableStream({
            chunks: [
              { type: "stream-start", warnings: [] },
              { id: "t1", type: "text-start" },
              { delta: "Bonjour", id: "t1", type: "text-delta" },
              { id: "t1", type: "text-end" },
              {
                finishReason: { raw: "stop", unified: "stop" },
                type: "finish",
                usage: {
                  inputTokens: {
                    cacheRead: 0,
                    cacheWrite: 0,
                    noCache: 10,
                    text: 10,
                    total: 10,
                  },
                  outputTokens: { reasoning: 0, text: 5, total: 5 },
                },
              },
            ],
          }),
        }),
      })
  ),
}));

describe("POST /api/wakies/chat", () => {
  beforeEach(() => {
    recorded.length = 0;
    appended.length = 0;
  });

  it("répond au message et écrit les messages", async () => {
    const { POST } = await import("@/app/(chat)/api/wakies/chat/route");
    const request = new Request("http://localhost/api/wakies/chat", {
      body: JSON.stringify({
        conversationId: "c1",
        id: "c1",
        messages: [
          {
            id: "m1",
            parts: [{ text: "Bonjour", type: "text" }],
            role: "user",
          },
        ],
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    const response = await POST(request);
    console.log("status", response.status);
    console.log("content-type", response.headers.get("content-type"));
    const text = await response.text();
    console.log("flux:", JSON.stringify(text));
    console.log("messages persistés:", JSON.stringify(appended));
    console.log("usage:", JSON.stringify(recorded));
    expect(response.status).toBe(200);
  });
});
