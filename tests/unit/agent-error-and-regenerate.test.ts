import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  deleteMessagesAfterMessageIdMock,
  getAgentRunByIdMock,
  saveMessagesMock,
  updateChatTitleByIdMock,
  updateMessageMock,
} = vi.hoisted(() => ({
  deleteMessagesAfterMessageIdMock: vi.fn(async (): Promise<string[]> => []),
  getAgentRunByIdMock: vi.fn(async () => ({
    executionOwner: "owner-1",
    id: "run-1",
  })),
  saveMessagesMock: vi.fn(async () => undefined),
  updateChatTitleByIdMock: vi.fn(async () => undefined),
  updateMessageMock: vi.fn(async () => undefined),
}));

vi.mock("@/app/(chat)/actions", () => ({
  generateTitleFromConversation: async () => null,
}));

vi.mock("@/lib/db/agent-queries", () => ({
  getAgentRunById: getAgentRunByIdMock,
}));

vi.mock("@/lib/db/queries", () => ({
  deleteMessagesAfterMessageId: deleteMessagesAfterMessageIdMock,
  saveMessages: saveMessagesMock,
  updateChatTitleById: updateChatTitleByIdMock,
  updateMessage: updateMessageMock,
}));

import {
  isMeaningfulAgentMessage,
  persistAgentRunMessages,
} from "@/lib/agent/persist";
import { buildCatalogModelsFromStored } from "@/lib/ai/models.server";
import { createReasoningChunkWriter } from "@/lib/ai/reasoning-stream";
import type { ChatMessage } from "@/lib/types";
import type { StoredModel } from "@/openrouter-models";

const ROOT = path.resolve(import.meta.dirname, "..", "..");

describe("Agent : badge ERREUR, réflexion, filtrage des bulles vides et régénération", () => {
  beforeEach(() => {
    deleteMessagesAfterMessageIdMock.mockClear();
    getAgentRunByIdMock.mockClear();
    saveMessagesMock.mockClear();
    updateMessageMock.mockClear();
  });

  it("affiche le badge ERREUR (et non Échec) ainsi que le label rouge dans AgentRunTimeline", () => {
    const timelineSource = readFileSync(
      path.join(ROOT, "components/agent/agent-run-timeline.tsx"),
      "utf8"
    );
    expect(timelineSource).toContain('label: "Erreur"');
    expect(timelineSource).toContain('data-testid="agent-run-error-label"');

    const runtimeSource = readFileSync(
      path.join(ROOT, "lib/agent/runtime.ts"),
      "utf8"
    );
    expect(runtimeSource).not.toContain('"Agent travaille…"');
  });

  it("émet onBeforeFirstPush avant reasoning-start pour éviter la course d'identifiant de message", () => {
    const events: unknown[] = [];
    const writer = createReasoningChunkWriter(
      { write: (chunk) => events.push(chunk) },
      "r-agent",
      { onBeforeFirstPush: () => events.push({ type: "start" }) }
    );

    writer.push("Analyse ");
    writer.push("terminée");
    writer.finish();

    expect(events).toEqual([
      { type: "start" },
      { id: "r-agent", type: "reasoning-start" },
      { delta: "Analyse ", id: "r-agent", type: "reasoning-delta" },
      { delta: "terminée", id: "r-agent", type: "reasoning-delta" },
      { id: "r-agent", type: "reasoning-end" },
    ]);
  });

  it("ignore les bulles assistant vides et n'exécute la troncature différée qu'en cas de succès", async () => {
    const emptyAssistant = {
      id: "assist-empty",
      parts: [{ text: "   ", type: "text" }],
      role: "assistant",
    } as unknown as ChatMessage;

    expect(isMeaningfulAgentMessage(emptyAssistant)).toBe(false);

    await persistAgentRunMessages({
      chatId: "chat-1",
      executionOwner: "owner-1",
      existingMessages: [],
      finishedMessages: [emptyAssistant],
      firstUserMessageForTitle: null,
      isContinuation: false,
      outcomeStatus: "failed",
      runId: "run-1",
      shouldRenameAfterFirst: false,
      truncateAfterMessageId: "user-salut",
      userId: "user-1",
    });

    expect(saveMessagesMock).not.toHaveBeenCalled();
    expect(deleteMessagesAfterMessageIdMock).not.toHaveBeenCalled();

    const validAssistant = {
      id: "assist-ok",
      parts: [{ text: "Bonjour ! Comment puis-je vous aider ?", type: "text" }],
      role: "assistant",
    } as unknown as ChatMessage;

    await persistAgentRunMessages({
      chatId: "chat-1",
      executionOwner: "owner-1",
      existingMessages: [],
      finishedMessages: [validAssistant],
      firstUserMessageForTitle: null,
      isContinuation: false,
      outcomeStatus: "completed",
      runId: "run-1",
      shouldRenameAfterFirst: false,
      truncateAfterMessageId: "user-salut",
      userId: "user-1",
    });

    expect(saveMessagesMock).toHaveBeenCalledTimes(1);
    expect(deleteMessagesAfterMessageIdMock).toHaveBeenCalledWith({
      chatId: "chat-1",
      keepIds: ["assist-ok"],
      messageId: "user-salut",
    });
  });

  it("filtre les modèles Neon par forfait tout en conservant les modèles souverains mAI autorisés", async () => {
    const stored: StoredModel[] = [
      {
        architecture: { modality: "text->text", output_modalities: ["text"] },
        context_length: 128_000,
        created: 1_750_000_000,
        description: "Modèle payant",
        fournisseur: "openrouter",
        id: "baidu/ernie-5.5-flash-preview",
        is_available: true,
        isActive: true,
        max_output_tokens: 16_384,
        model_number: 1,
        name: "ERNIE-5.5-Flash-Preview",
        overrides: {},
        pricing: {},
        provider: "baidu",
        supported_parameters: ["tools", "stream"],
        type: "chat",
        upstream: {},
      },
      {
        architecture: { modality: "text->text", output_modalities: ["text"] },
        context_length: 128_000,
        created: 1_750_000_000,
        description: "Modèle gratuit",
        fournisseur: "openrouter",
        id: "google/gemma-4-26b-a4b-it:free",
        is_available: true,
        isActive: true,
        max_output_tokens: 16_384,
        model_number: 2,
        name: "Google: Gemma 4 26B (free)",
        overrides: {},
        pricing: {},
        provider: "google",
        supported_parameters: ["tools", "stream"],
        type: "chat",
        upstream: {},
      },
    ];

    const freeList = await buildCatalogModelsFromStored(stored, "Free");
    expect(freeList.map((m) => m.id)).toContain("mai-2-mini");
    expect(freeList.map((m) => m.id)).toContain("mai-2.5-omni");
    expect(freeList.map((m) => m.id)).toContain(
      "google/gemma-4-26b-a4b-it:free"
    );
    expect(freeList.map((m) => m.id)).not.toContain("mai-2.5-opal");
    expect(freeList.map((m) => m.id)).not.toContain(
      "baidu/ernie-5.5-flash-preview"
    );

    const plusList = await buildCatalogModelsFromStored(stored, "Plus");
    expect(plusList.map((m) => m.id)).toContain("mai-2.5-opal");
    expect(plusList.map((m) => m.id)).toContain(
      "baidu/ernie-5.5-flash-preview"
    );
  });
});
