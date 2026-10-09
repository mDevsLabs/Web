import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  actionTask: vi.fn(),
  createConversation: vi.fn(),
  deleteConversation: vi.fn(),
  ensureSettings: vi.fn(),
  findConversation: vi.fn(),
  listConversations: vi.fn(),
  scheduleTask: vi.fn(),
  updateConversation: vi.fn(),
  user: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getMaiUser: mocks.user }));
vi.mock("@/lib/wakies/queries", () => ({
  actionTask: mocks.actionTask,
  createConversation: mocks.createConversation,
  deleteConversation: mocks.deleteConversation,
  ensureSettings: mocks.ensureSettings,
  findConversation: mocks.findConversation,
  listConversations: mocks.listConversations,
  scheduleTask: mocks.scheduleTask,
  updateConversation: mocks.updateConversation,
}));
vi.mock("@/lib/wakies/model-access", () => ({
  validateWakiesModel: vi.fn().mockResolvedValue(null),
}));

describe("routes d'API Wakies", { timeout: 30_000 }, () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.user.mockResolvedValue({
      email: "alice@example.test",
      id: "alice",
      tier: "plus",
    });
    mocks.ensureSettings.mockResolvedValue({
      memoryAllowed: true,
      name: "Wakie",
      paused: false,
      researchAllowed: true,
      userId: "alice",
    });
  });

  describe("GET /api/wakies/conversations", () => {
    it("renvoie la liste des conversations du compte", async () => {
      const { GET } = await import(
        "@/app/(chat)/api/wakies/conversations/route"
      );
      mocks.listConversations.mockResolvedValue([
        { id: "conv-1", title: "Idée 1", userId: "alice", wakieId: "w-1" },
      ]);

      const res = await GET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe("conv-1");
      expect(mocks.listConversations).toHaveBeenCalledWith("alice");
    });

    it("refuse l'accès si l'utilisateur est déconnecté", async () => {
      mocks.user.mockResolvedValue(null);
      const { GET } = await import(
        "@/app/(chat)/api/wakies/conversations/route"
      );
      const res = await GET();
      expect(res.status).toBe(401);
    });

    it("refuse l'accès pour un compte Free", async () => {
      mocks.user.mockResolvedValue({
        email: "free@example.test",
        id: "free-user",
        tier: "free",
      });
      const { GET } = await import(
        "@/app/(chat)/api/wakies/conversations/route"
      );
      const res = await GET();
      expect(res.status).toBe(403);
    });
  });

  describe("POST /api/wakies/conversations", () => {
    it("crée une conversation avec succès", async () => {
      const { POST } = await import(
        "@/app/(chat)/api/wakies/conversations/route"
      );
      mocks.listConversations.mockResolvedValue([]);
      mocks.createConversation.mockResolvedValue({
        id: "conv-new",
        title: "Nouvelle réflexion",
        userId: "alice",
        wakieId: "w-1",
      });

      const res = await POST(
        new Request("http://localhost/api/wakies/conversations", {
          body: JSON.stringify({
            title: "Nouvelle réflexion",
            wakieId: "w-1",
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        })
      );

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.id).toBe("conv-new");
      expect(mocks.createConversation).toHaveBeenCalledWith("alice", {
        title: "Nouvelle réflexion",
        wakieId: "w-1",
      });
    });

    it("refuse la création si les Wakies sont en pause", async () => {
      const { POST } = await import(
        "@/app/(chat)/api/wakies/conversations/route"
      );
      mocks.ensureSettings.mockResolvedValue({
        paused: true,
        userId: "alice",
      });

      const res = await POST(
        new Request("http://localhost/api/wakies/conversations", {
          body: JSON.stringify({
            title: "Nouvelle réflexion",
            wakieId: "w-1",
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        })
      );

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.message).toContain("pause");
    });

    it("refuse un corps de requête invalide", async () => {
      const { POST } = await import(
        "@/app/(chat)/api/wakies/conversations/route"
      );
      const res = await POST(
        new Request("http://localhost/api/wakies/conversations", {
          body: JSON.stringify({}),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        })
      );
      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /api/wakies/conversations/[id]", () => {
    it("met à jour le titre d'une conversation", async () => {
      const { PATCH } = await import(
        "@/app/(chat)/api/wakies/conversations/[id]/route"
      );
      mocks.updateConversation.mockResolvedValue({
        id: "conv-1",
        title: "Titre modifié",
        userId: "alice",
        wakieId: "w-1",
      });

      const res = await PATCH(
        new Request("http://localhost/api/wakies/conversations/conv-1", {
          body: JSON.stringify({ title: "Titre modifié" }),
          headers: { "Content-Type": "application/json" },
          method: "PATCH",
        }),
        { params: Promise.resolve({ id: "conv-1" }) }
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.title).toBe("Titre modifié");
      expect(mocks.updateConversation).toHaveBeenCalledWith("alice", "conv-1", {
        title: "Titre modifié",
      });
    });

    it("refuse un patch vide sans aucun champ", async () => {
      const { PATCH } = await import(
        "@/app/(chat)/api/wakies/conversations/[id]/route"
      );
      const res = await PATCH(
        new Request("http://localhost/api/wakies/conversations/conv-1", {
          body: JSON.stringify({}),
          headers: { "Content-Type": "application/json" },
          method: "PATCH",
        }),
        { params: Promise.resolve({ id: "conv-1" }) }
      );
      expect(res.status).toBe(400);
    });

    it("renvoie 404 si la conversation n'appartient pas au compte", async () => {
      const { PATCH } = await import(
        "@/app/(chat)/api/wakies/conversations/[id]/route"
      );
      mocks.updateConversation.mockResolvedValue(null);

      const res = await PATCH(
        new Request(
          "http://localhost/api/wakies/conversations/conv-introuvable",
          {
            body: JSON.stringify({ title: "Nouveau titre" }),
            headers: { "Content-Type": "application/json" },
            method: "PATCH",
          }
        ),
        { params: Promise.resolve({ id: "conv-introuvable" }) }
      );

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/wakies/tasks/[id]/actions", () => {
    it("exécute une action valide ('pause')", async () => {
      const { POST } = await import(
        "@/app/(chat)/api/wakies/tasks/[id]/actions/route"
      );
      mocks.actionTask.mockResolvedValue({ id: "task-1", status: "paused" });

      const res = await POST(
        new Request("http://localhost/api/wakies/tasks/task-1/actions", {
          body: JSON.stringify({ action: "pause" }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        }),
        { params: Promise.resolve({ id: "task-1" }) }
      );

      expect(res.status).toBe(200);
      expect(mocks.actionTask).toHaveBeenCalledWith("alice", "task-1", "pause");
    });

    it("refuse l'action 'run' si la recherche est désactivée", async () => {
      const { POST } = await import(
        "@/app/(chat)/api/wakies/tasks/[id]/actions/route"
      );
      mocks.ensureSettings.mockResolvedValue({
        researchAllowed: false,
        userId: "alice",
      });

      const res = await POST(
        new Request("http://localhost/api/wakies/tasks/task-1/actions", {
          body: JSON.stringify({ action: "run" }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        }),
        { params: Promise.resolve({ id: "task-1" }) }
      );

      expect(res.status).toBe(403);
      expect(mocks.actionTask).not.toHaveBeenCalled();
    });

    it("refuse une action inconnue", async () => {
      const { POST } = await import(
        "@/app/(chat)/api/wakies/tasks/[id]/actions/route"
      );
      const res = await POST(
        new Request("http://localhost/api/wakies/tasks/task-1/actions", {
          body: JSON.stringify({ action: "detruire" }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        }),
        { params: Promise.resolve({ id: "task-1" }) }
      );
      expect(res.status).toBe(400);
    });
  });

  describe("PUT /api/wakies/tasks/[id]/schedule", () => {
    it("enregistre un intervalle valide en secondes", async () => {
      const { PUT } = await import(
        "@/app/(chat)/api/wakies/tasks/[id]/schedule/route"
      );
      mocks.scheduleTask.mockResolvedValue({
        id: "task-1",
        intervalSeconds: 3600,
      });

      const res = await PUT(
        new Request("http://localhost/api/wakies/tasks/task-1/schedule", {
          body: JSON.stringify({ intervalSeconds: 3600 }),
          headers: { "Content-Type": "application/json" },
          method: "PUT",
        }),
        { params: Promise.resolve({ id: "task-1" }) }
      );

      expect(res.status).toBe(200);
      expect(mocks.scheduleTask).toHaveBeenCalledWith("alice", "task-1", 3600);
    });

    it("accepte null pour annuler la planification", async () => {
      const { PUT } = await import(
        "@/app/(chat)/api/wakies/tasks/[id]/schedule/route"
      );
      mocks.scheduleTask.mockResolvedValue({
        id: "task-1",
        intervalSeconds: null,
      });

      const res = await PUT(
        new Request("http://localhost/api/wakies/tasks/task-1/schedule", {
          body: JSON.stringify({ intervalSeconds: null }),
          headers: { "Content-Type": "application/json" },
          method: "PUT",
        }),
        { params: Promise.resolve({ id: "task-1" }) }
      );

      expect(res.status).toBe(200);
      expect(mocks.scheduleTask).toHaveBeenCalledWith("alice", "task-1", null);
    });

    it("refuse un intervalle inférieur à 60 secondes", async () => {
      const { PUT } = await import(
        "@/app/(chat)/api/wakies/tasks/[id]/schedule/route"
      );
      const res = await PUT(
        new Request("http://localhost/api/wakies/tasks/task-1/schedule", {
          body: JSON.stringify({ intervalSeconds: 30 }),
          headers: { "Content-Type": "application/json" },
          method: "PUT",
        }),
        { params: Promise.resolve({ id: "task-1" }) }
      );
      expect(res.status).toBe(400);
    });
  });
});
