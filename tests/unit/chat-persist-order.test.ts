import { beforeEach, describe, expect, it, vi } from "vitest";

// Ordre persister / supprimer de la fin de flux (issue #46). La règle est
// simple et définitive : la suppression des anciens messages n'a lieu qu'APRÈS
// la persistance de la nouvelle réponse, et jamais quand la génération a
// échoué — un échec ne détruit plus le tour valide.

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
import { persistStreamEnd } from "@/lib/chat/stream";
import type { ChatMessage } from "@/lib/types";

// Double de test : seuls les champs lus par `persistStreamEnd` sont remplis.
function ctxWith(overrides: Partial<ChatRequestContext>): ChatRequestContext {
  return {
    id: "chat-regen",
    isGhostMode: false,
    isToolApprovalFlow: false,
    truncateAfterMessageId: "u2",
    uiMessages: [],
    userId: "user-test",
    ...overrides,
  } as unknown as ChatRequestContext;
}

function assistantMessage(id: string, text: string): ChatMessage {
  return {
    id,
    parts: [{ text, type: "text" }],
    role: "assistant",
  } as ChatMessage;
}

describe("Fin de flux — remplacement différé des messages (issue #46)", () => {
  beforeEach(() => {
    createNotificationMock.mockClear();
    deleteMessagesAfterMessageIdMock.mockClear();
    saveMessagesMock.mockClear();
    updateMessageMock.mockClear();
    deleteMessagesAfterMessageIdMock.mockResolvedValue([]);
  });

  it("persiste la nouvelle réponse AVANT de supprimer l'ancienne (ordre non-régressif)", async () => {
    await persistStreamEnd(
      ctxWith({}),
      [assistantMessage("a2-new", "Nouvelle")],
      {
        outcomeStatus: "completed",
      }
    );

    expect(saveMessagesMock).toHaveBeenCalledTimes(1);
    expect(deleteMessagesAfterMessageIdMock).toHaveBeenCalledTimes(1);
    // Ordre strict : persister puis supprimer, jamais l'inverse.
    const saveOrder = saveMessagesMock.mock.invocationCallOrder[0];
    const deleteOrder =
      deleteMessagesAfterMessageIdMock.mock.invocationCallOrder[0];
    expect(saveOrder).toBeLessThan(deleteOrder);

    // La suppression ne cible que les messages APRÈS le repère, et protège les
    // messages de ce tour : le remplacement a lieu une seule fois.
    expect(deleteMessagesAfterMessageIdMock).toHaveBeenCalledWith({
      chatId: "chat-regen",
      keepIds: ["a2-new"],
      messageId: "u2",
    });
  });

  it("ne supprime rien quand la génération a échoué (tour précédent conservé)", async () => {
    await persistStreamEnd(ctxWith({}), [], { outcomeStatus: "failed" });

    expect(deleteMessagesAfterMessageIdMock).not.toHaveBeenCalled();
  });

  it("ne supprime rien quand un échec partiel a tout de même persisté un message", async () => {
    // Le message partiel reste en base (comportement existant), mais l'ancien
    // tour n'est pas effacé pour autant : le remplacement n'est pas consommé.
    await persistStreamEnd(ctxWith({}), [assistantMessage("a2-partiel", "…")], {
      outcomeStatus: "failed",
    });

    expect(saveMessagesMock).toHaveBeenCalledTimes(1);
    expect(deleteMessagesAfterMessageIdMock).not.toHaveBeenCalled();
  });

  it("ne supprime rien quand le flux est interrompu ou inconnu", async () => {
    await persistStreamEnd(ctxWith({}), [assistantMessage("a2-x", "x")], {
      outcomeStatus: "aborted",
    });
    await persistStreamEnd(ctxWith({}), [assistantMessage("a2-y", "y")], {
      outcomeStatus: "unknown",
    });

    expect(deleteMessagesAfterMessageIdMock).not.toHaveBeenCalled();
  });

  it("n'écrit rien en mode Fantôme, suppression comprise", async () => {
    await persistStreamEnd(
      ctxWith({ isGhostMode: true, truncateAfterMessageId: "u2" }),
      [assistantMessage("a2-ghost", "Fantôme")],
      { outcomeStatus: "completed" }
    );

    expect(saveMessagesMock).not.toHaveBeenCalled();
    expect(deleteMessagesAfterMessageIdMock).not.toHaveBeenCalled();
    expect(createNotificationMock).not.toHaveBeenCalled();
  });

  it("supporte une suppression ratée sans faire échouer la fin de flux", async () => {
    deleteMessagesAfterMessageIdMock.mockRejectedValueOnce(
      new Error("base indisponible")
    );

    await expect(
      persistStreamEnd(ctxWith({}), [assistantMessage("a2-new", "Nouvelle")], {
        outcomeStatus: "completed",
      })
    ).resolves.toBeUndefined();

    // La nouvelle réponse est déjà en base : l'ancien tour reste visible en
    // plus, jamais l'inverse.
    expect(saveMessagesMock).toHaveBeenCalledTimes(1);
  });
});
