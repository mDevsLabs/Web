/** Les préférences et la relève gardent l'identité serveur et refusent les entrées ambiguës. */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createConversation: vi.fn(),
  ensureSettings: vi.fn(),
  listConversations: vi.fn(),
  releverNotifications: vi.fn(),
  updateConversation: vi.fn(),
  user: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getMaiUser: mocks.user }));
vi.mock("@/lib/wakies/queries", () => mocks);
vi.mock("@/lib/wakies/model-access", () => ({
  validateWakiesModel: vi.fn().mockResolvedValue(null),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.user.mockResolvedValue({ id: "alice", tier: "plus" });
  mocks.ensureSettings.mockResolvedValue({ paused: false });
  mocks.listConversations.mockResolvedValue([]);
  mocks.updateConversation.mockResolvedValue({
    favorite: false,
    id: "conversation",
    muted: true,
  });
  mocks.releverNotifications.mockResolvedValue({
    cursor: 10,
    notifications: [],
  });
});

// Charger les routes avant les tests : le coût initial de transformation ne
// doit pas laisser une requête du test précédent se terminer dans le suivant.
beforeEach(async () => {
  await import("@/app/(chat)/api/wakies/conversations/[id]/route");
}, 60_000);

describe("préférences de conversation", () => {
  it("enregistre false explicitement sans modifier le titre ou les outils", async () => {
    const { PATCH } = await import(
      "@/app/(chat)/api/wakies/conversations/[id]/route"
    );
    const response = await PATCH(
      new Request("https://mai.test/api/wakies/conversations/conversation", {
        body: JSON.stringify({ favorite: false, muted: true }),
        headers: {
          "Content-Type": "application/json",
          Origin: "https://mai.test",
        },
        method: "PATCH",
      }),
      { params: Promise.resolve({ id: "conversation" }) }
    );
    expect(response.status).toBe(200);
    expect(mocks.updateConversation).toHaveBeenCalledWith(
      "alice",
      "conversation",
      { favorite: false, muted: true }
    );
  });
  it("refuse les pseudo-booléens et les mutations d'une autre origine", async () => {
    const { PATCH } = await import(
      "@/app/(chat)/api/wakies/conversations/[id]/route"
    );
    for (const [favorite, origin] of [
      ["false", "https://mai.test"],
      [true, "https://evil.test"],
    ]) {
      const response = await PATCH(
        new Request("https://mai.test/api/wakies/conversations/conversation", {
          body: JSON.stringify({ favorite }),
          headers: {
            "Content-Type": "application/json",
            Origin: origin as string,
          },
          method: "PATCH",
        }),
        { params: Promise.resolve({ id: "conversation" }) }
      );
      expect(response.status).toBeGreaterThanOrEqual(400);
    }
    expect(mocks.updateConversation).not.toHaveBeenCalled();
  });
  it("ne divulgue pas une conversation extérieure au compte", async () => {
    mocks.updateConversation.mockResolvedValue(null);
    const { PATCH } = await import(
      "@/app/(chat)/api/wakies/conversations/[id]/route"
    );
    const response = await PATCH(
      new Request("https://mai.test/api/wakies/conversations/autre", {
        body: JSON.stringify({ muted: true }),
        method: "PATCH",
      }),
      { params: Promise.resolve({ id: "autre" }) }
    );
    expect(response.status).toBe(404);
    expect(mocks.updateConversation).toHaveBeenCalledWith("alice", "autre", {
      muted: true,
    });
  });
});

describe("relève des notifications", () => {
  it("initialise sans curseur et ne transmet pas l'identité du compte", async () => {
    const { GET } = await import("@/app/(chat)/api/wakies/notifications/route");
    const response = await GET(
      new Request("https://mai.test/api/wakies/notifications")
    );
    expect(mocks.releverNotifications).toHaveBeenCalledWith("alice", undefined);
    const body = await response.json();
    expect(body.scope).toMatch(/^[a-f0-9]{64}$/);
    expect(body).not.toHaveProperty("userId");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("transmet un curseur entier et refuse les valeurs hors contrat", async () => {
    const { GET } = await import("@/app/(chat)/api/wakies/notifications/route");
    await GET(new Request("https://mai.test/api/wakies/notifications?after=9"));
    expect(mocks.releverNotifications).toHaveBeenCalledWith("alice", 9);
    for (const value of ["", " ", "-1", "1.5", "NaN", "9007199254740992"]) {
      const response = await GET(
        new Request(`https://mai.test/api/wakies/notifications?after=${value}`)
      );
      expect(response.status).toBe(400);
    }
  });
  it("refuse un utilisateur déconnecté avant toute lecture", async () => {
    mocks.user.mockResolvedValue(null);
    const { GET } = await import("@/app/(chat)/api/wakies/notifications/route");
    expect(
      (await GET(new Request("https://mai.test/api/wakies/notifications")))
        .status
    ).toBe(401);
    expect(mocks.releverNotifications).not.toHaveBeenCalled();
  });
});

describe("création d'une conversation", () => {
  it("ouvre un fil pour le Wakie demandé", async () => {
    mocks.createConversation.mockResolvedValue({ id: "conversation" });
    const { POST } = await import(
      "@/app/(chat)/api/wakies/conversations/route"
    );
    const response = await POST(
      new Request("https://mai.test/api/wakies/conversations", {
        body: JSON.stringify({ title: "Une idée", wakieId: "wakie" }),
        method: "POST",
      })
    );
    expect(response.status).toBe(201);
    expect(mocks.createConversation).toHaveBeenCalledWith("alice", {
      title: "Une idée",
      wakieId: "wakie",
    });
  });

  it("refuse les champs du contrat de groupe, désormais retirés", async () => {
    const { POST } = await import(
      "@/app/(chat)/api/wakies/conversations/route"
    );
    const response = await POST(
      new Request("https://mai.test/api/wakies/conversations", {
        body: JSON.stringify({
          inviteWakieIds: ["ami"],
          isGroup: true,
          wakieId: "organisateur",
        }),
        method: "POST",
      })
    );
    expect(response.status).toBe(400);
    expect(mocks.createConversation).not.toHaveBeenCalled();
  });
});
