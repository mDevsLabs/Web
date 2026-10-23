// Rendus de régression: un tour terminé sans texte doit le dire, et une
// réaction posée par un Wakie sur un message de l'utilisateur doit être VISIBLE.

import type { UIMessage } from "ai";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ChatTranscript } from "@/components/wakies/ChatTranscript";
import type { MessageReaction } from "@/lib/wakies/shared/types";

function reaction(emoji: string, messageId: string): MessageReaction {
  return { byWakieId: "wakie-1", createdAt: 0, emoji, messageId };
}

function rendu(
  messages: UIMessage[],
  reactions?: Map<string, MessageReaction[]>,
  enCours = false
) {
  return renderToStaticMarkup(
    createElement(ChatTranscript, {
      calls: [],
      enCours,
      messages,
      reactionsParMessage: reactions,
    })
  );
}

describe("transcript Wakies", () => {
  it("ne prétend plus « Réflexion en cours…» une fois la part close", () => {
    const html = rendu([
      {
        id: "a1",
        parts: [
          {
            state: "done",
            text: "Le modèle a réfléchi.",
            type: "reasoning",
          },
        ],
        role: "assistant",
      },
    ]);
    expect(html).toContain("A réfléchi");
    expect(html).not.toContain("Réflexion en cours");
  });

  it("signale un tour terminé sans réponse au lieu d'un blanc", () => {
    const html = rendu([
      {
        id: "a2",
        parts: [{ state: "done", text: "Analyse en cours", type: "reasoning" }],
        role: "assistant",
      },
    ]);
    expect(html).toContain("aucune réponse texte");
  });

  it("n'affiche pas ce constat pendant le tour", () => {
    const html = rendu(
      [
        {
          id: "a3",
          parts: [{ state: "streaming", text: "Analyse", type: "reasoning" }],
          role: "assistant",
        },
      ],
      undefined,
      true
    );
    expect(html).not.toContain("aucune réponse texte");
  });

  it("affiche la réaction d'un Wakie sur le message de l'utilisateur", () => {
    const html = rendu(
      [
        {
          id: "u1",
          parts: [{ text: "Salut", type: "text" }],
          role: "user",
        },
      ],
      new Map([["u1", [reaction("", "u1")]]])
    );
    expect(html).toContain("");
    // Aucun sélecteur sur une bulle du compte: le serveur refuse de réagir à
    // son propre message.
    expect(html).not.toContain("Réagir ");
  });
});
