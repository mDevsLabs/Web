/** La messagerie conserve l'historique et n'alerte jamais deux fois une même réponse. */

import type { UIMessage } from "ai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { alerterUneFois } from "@/lib/wakies/client/notifications";
import {
  fusionnerHistorique,
  trierConversations,
} from "@/lib/wakies/shared/messaging";
import type { Conversation } from "@/lib/wakies/shared/types";

const message = (id: string, seq: number, text = id): UIMessage => ({
  id,
  metadata: { seq },
  parts: [{ text, type: "text" }],
  role: "assistant",
});

describe("historique synchronisé", () => {
  it("conserve les pages anciennes, actualise les messages connus et déduplique par id", () => {
    const fusion = fusionnerHistorique(
      [message("ancien", 1), message("recent", 20)],
      [message("recent", 20, "Final"), message("nouveau", 21)]
    );
    expect(fusion.map((item) => item.id)).toEqual([
      "ancien",
      "recent",
      "nouveau",
    ]);
    expect(fusion[1].parts).toEqual([{ text: "Final", type: "text" }]);
  });
  it("replace dans l'ordre un message reçu tardivement", () => {
    expect(
      fusionnerHistorique(
        [message("a", 1), message("c", 3)],
        [message("b", 2)]
      ).map((item) => item.id)
    ).toEqual(["a", "b", "c"]);
  });
  it("classe les favoris puis l'activité sans modifier la liste d'origine", () => {
    const rows = [
      { createdAt: 20, id: "recent" },
      { createdAt: 1, favorite: true, id: "favori" },
      { createdAt: 2, dernierMessageAt: 30, id: "actif" },
    ] as Conversation[];
    expect(trierConversations(rows).map((item) => item.id)).toEqual([
      "favori",
      "actif",
      "recent",
    ]);
    expect(rows[0].id).toBe("recent");
  });
});

describe("notifications navigateur", () => {
  const notifier = vi.fn();
  const item = {
    conversationId: "conversation",
    id: "reponse",
    muted: false,
    preview: "Bonjour",
    seq: 4,
    title: "Muse",
  };
  beforeEach(() => {
    const stockage = new Map<string, string>();
    notifier.mockReset();
    class FakeNotification {
      static permission = "granted";
      constructor(title: string, options: unknown) {
        notifier(title, options);
      }
    }
    vi.stubGlobal("Notification", FakeNotification);
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => stockage.get(key) ?? null,
      setItem: (key: string, value: string) => stockage.set(key, value),
    });
    let dernierVerrou = Promise.resolve();
    vi.stubGlobal("navigator", {
      locks: {
        request: (_name: string, callback: () => void) => {
          dernierVerrou = dernierVerrou.then(callback);
          return dernierVerrou;
        },
      },
    });
  });
  afterEach(() => vi.unstubAllGlobals());
  it("déduplique deux onglets concurrents et permet la réponse suivante", async () => {
    await Promise.all([
      alerterUneFois("compte", item),
      alerterUneFois("compte", item),
    ]);
    expect(notifier).toHaveBeenCalledTimes(1);
    await alerterUneFois("compte", { ...item, id: "suivante", seq: 5 });
    expect(notifier).toHaveBeenCalledTimes(2);
  });
  it("sépare les comptes et respecte la sourdine", async () => {
    await alerterUneFois("alice", item);
    await alerterUneFois("bob", item);
    await alerterUneFois("bob", { ...item, muted: true, seq: 5 });
    expect(notifier).toHaveBeenCalledTimes(2);
  });
  it("respecte un refus de permission et supporte l'absence de Notification", async () => {
    vi.stubGlobal("Notification", { permission: "denied" });
    await alerterUneFois("compte", item);
    vi.stubGlobal("Notification", undefined);
    await alerterUneFois("compte", item);
    expect(notifier).not.toHaveBeenCalled();
  });
});
