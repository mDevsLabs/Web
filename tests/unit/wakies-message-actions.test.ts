import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  modifier: vi.fn(),
  user: vi.fn(),
}));

vi.mock("@/lib/wakies/http", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/wakies/http")>();
  return {
    ...actual,
    rejectCrossOriginMutation: () => null,
    requireWakiesUser: mocks.user,
  };
});

vi.mock("@/lib/wakies/queries", () => ({
  updateOwnMessageText: mocks.modifier,
}));

const MESSAGE_ID = "msg-1";

function requete(text: unknown) {
  return new Request("http://localhost/api/wakies/messages/msg-1", {
    body: JSON.stringify({ text }),
    headers: { "Content-Type": "application/json" },
    method: "PATCH",
  });
}

// Le premier import tire la route Next complète : sur un runner froid il dépasse
// le délai par défaut de 5 s, et le test suivant hériterait de ses mocks.
describe("PATCH /api/wakies/messages/:id", { timeout: 30_000 }, () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.user.mockResolvedValue({ userId: "alice" });
  });

  it("modifie un message du compte", async () => {
    mocks.modifier.mockResolvedValue(true);
    const { PATCH } = await import(
      "@/app/(chat)/api/wakies/messages/[id]/route"
    );

    const response = await PATCH(requete("  Bonjour corrigé  "), {
      params: Promise.resolve({ id: MESSAGE_ID }),
    });

    expect(response.status).toBe(200);
    expect(mocks.modifier).toHaveBeenCalledWith(
      "alice",
      MESSAGE_ID,
      "Bonjour corrigé"
    );
  });

  it("refuse un texte vide sans appeler la couche de données", async () => {
    const { PATCH } = await import(
      "@/app/(chat)/api/wakies/messages/[id]/route"
    );

    const response = await PATCH(requete("   "), {
      params: Promise.resolve({ id: MESSAGE_ID }),
    });

    expect(response.status).toBe(400);
    expect(mocks.modifier).not.toHaveBeenCalled();
  });

  it("renvoie 404 quand la réponse de Wakie n'est pas modifiable", async () => {
    mocks.modifier.mockResolvedValue(false);
    const { PATCH } = await import(
      "@/app/(chat)/api/wakies/messages/[id]/route"
    );

    const response = await PATCH(requete("Tentative"), {
      params: Promise.resolve({ id: MESSAGE_ID }),
    });

    expect(response.status).toBe(404);
  });
});
