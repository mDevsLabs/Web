import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  actionTask: vi.fn(),
  chercherDansWakies: vi.fn(),
  chercherDansWakiesMessages: vi.fn(),
  createConversation: vi.fn(),
  createPage: vi.fn(),
  definirEpingle: vi.fn(),
  deleteConversation: vi.fn(),
  ensureSettings: vi.fn(),
  findConversation: vi.fn(),
  listConversations: vi.fn(),
  marquerConversationLue: vi.fn(),
  messageDuCompte: vi.fn(),
  profilVibe: vi.fn(),
  scheduleTask: vi.fn(),
  searchWakiesMemories: vi.fn(),
  searchWakiesTasks: vi.fn(),
  searchWakiesWorkspace: vi.fn(),
  spaceExists: vi.fn(),
  transfererMessage: vi.fn(),
  updateConversation: vi.fn(),
  user: vi.fn(),
}));

/**
 * Identifiants de conversation de test.
 *
 * Ils doivent être des UUID valides au sens RFC 9562 (version et variante) :
 * les schémas de route utilisent `z.string().uuid()`, et un identifiant
 * « presque » UUID est refusé en 400 avant d'atteindre la couche de données.
 */
const CIDBLE = "0f8fad5b-d9cb-469f-a165-70867728950e";
const CIDBLE_ABSENTE = "9c858901-8a57-4791-81fe-4c455b099bc9";

vi.mock("@/lib/auth/session", () => ({ getMaiUser: mocks.user }));
vi.mock("@/lib/vibe/server/profil", () => ({
  lireProfilVibe: mocks.profilVibe,
}));
vi.mock("@/lib/wakies/queries", () => ({
  actionTask: mocks.actionTask,
  chercherDansWakies: mocks.chercherDansWakies,
  chercherDansWakiesMessages: mocks.chercherDansWakiesMessages,
  createConversation: mocks.createConversation,
  createPage: mocks.createPage,
  definirEpingle: mocks.definirEpingle,
  deleteConversation: mocks.deleteConversation,
  ensureSettings: mocks.ensureSettings,
  findConversation: mocks.findConversation,
  listConversations: mocks.listConversations,
  marquerConversationLue: mocks.marquerConversationLue,
  messageDuCompte: mocks.messageDuCompte,
  scheduleTask: mocks.scheduleTask,
  searchWakiesMemories: mocks.searchWakiesMemories,
  searchWakiesTasks: mocks.searchWakiesTasks,
  searchWakiesWorkspace: mocks.searchWakiesWorkspace,
  spaceExists: mocks.spaceExists,
  transfererMessage: mocks.transfererMessage,
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
    // La recherche unifiée est la surface par défaut de la route
    // `/search` : sans valeur par défaut, la route rendrait des résultats
    // indéfinis.
    mocks.searchWakiesWorkspace.mockResolvedValue({
      counts: { conversation: 0, message: 0, page: 0, space: 0, wakie: 0 },
      hits: [],
    });
    mocks.searchWakiesMemories.mockResolvedValue([]);
    mocks.searchWakiesTasks.mockResolvedValue([]);
    mocks.chercherDansWakiesMessages.mockResolvedValue({
      conversations: [],
      messages: [],
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

  describe("POST /api/wakies/conversations/[id]/read", () => {
    it("marque la conversation lue jusqu'au seq fourni", async () => {
      const { POST } = await import(
        "@/app/(chat)/api/wakies/conversations/[id]/read/route"
      );
      mocks.marquerConversationLue.mockResolvedValue(42);
      const res = await POST(
        new Request("http://localhost/api/wakies/conversations/conv-1/read", {
          body: JSON.stringify({ seq: 42 }),
          headers: {
            "Content-Type": "application/json",
            origin: "http://localhost",
          },
          method: "POST",
        }),
        { params: Promise.resolve({ id: "conv-1" }) }
      );
      expect(res.status).toBe(200);
      expect(mocks.marquerConversationLue).toHaveBeenCalledWith(
        "alice",
        "conv-1",
        42
      );
    });

    it("refuse un curseur négatif sans écrire", async () => {
      const { POST } = await import(
        "@/app/(chat)/api/wakies/conversations/[id]/read/route"
      );
      const res = await POST(
        new Request("http://localhost/api/wakies/conversations/conv-1/read", {
          body: JSON.stringify({ seq: -1 }),
          headers: {
            "Content-Type": "application/json",
            origin: "http://localhost",
          },
          method: "POST",
        }),
        { params: Promise.resolve({ id: "conv-1" }) }
      );
      expect(res.status).toBe(400);
      expect(mocks.marquerConversationLue).not.toHaveBeenCalled();
    });
  });

  describe("POST /api/wakies/messages/[id]/forward", () => {
    it("copie le message dans la conversation visée", async () => {
      const { POST } = await import(
        "@/app/(chat)/api/wakies/messages/[id]/forward/route"
      );
      mocks.transfererMessage.mockResolvedValue({
        conversationId: "conv-2",
        id: "forward-1",
      });
      const res = await POST(
        new Request("http://localhost/api/wakies/messages/m1/forward", {
          body: JSON.stringify({
            conversationId: CIDBLE,
          }),
          headers: {
            "Content-Type": "application/json",
            origin: "http://localhost",
          },
          method: "POST",
        }),
        { params: Promise.resolve({ id: "m1" }) }
      );
      expect(res.status).toBe(201);
      expect(mocks.transfererMessage).toHaveBeenCalledWith(
        "alice",
        "m1",
        CIDBLE
      );
    });

    it("refuse une cible absente du compte en 404", async () => {
      const { POST } = await import(
        "@/app/(chat)/api/wakies/messages/[id]/forward/route"
      );
      mocks.transfererMessage.mockResolvedValue(null);
      const res = await POST(
        new Request("http://localhost/api/wakies/messages/m1/forward", {
          body: JSON.stringify({
            conversationId: CIDBLE_ABSENTE,
          }),
          headers: {
            "Content-Type": "application/json",
            origin: "http://localhost",
          },
          method: "POST",
        }),
        { params: Promise.resolve({ id: "m1" }) }
      );
      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/wakies/messages/[id]/page", () => {
    it("enregistre le message en page et l'épingle", async () => {
      const { POST } = await import(
        "@/app/(chat)/api/wakies/messages/[id]/page/route"
      );
      mocks.spaceExists.mockResolvedValue(true);
      mocks.messageDuCompte.mockResolvedValue({
        conversationId: "conv-1",
        conversationTitre: "Veille",
        createdAt: new Date("2026-10-10T10:00:00Z"),
        extrait: "Un fait à garder",
        id: "m1",
        role: "user",
      });
      mocks.createPage.mockResolvedValue({ id: "page-1", spaceId: "space-1" });
      mocks.definirEpingle.mockResolvedValue(true);
      const res = await POST(
        new Request("http://localhost/api/wakies/messages/m1/page", {
          body: JSON.stringify({ spaceId: "space-1" }),
          headers: {
            "Content-Type": "application/json",
            origin: "http://localhost",
          },
          method: "POST",
        }),
        { params: Promise.resolve({ id: "m1" }) }
      );
      expect(res.status).toBe(201);
      expect(mocks.definirEpingle).toHaveBeenCalledWith("alice", "m1", true);
      // La page est un BLOC DE CITATION attribué : le contenu porte l'extrait
      // et son origine, pas une copie muette.
      const contenu = mocks.createPage.mock.calls[0][2].content as string;
      expect(contenu).toContain("> Un fait à garder");
      expect(contenu).toContain("Veille");
    });

    it("refuse un espace qui n'appartient pas au compte", async () => {
      const { POST } = await import(
        "@/app/(chat)/api/wakies/messages/[id]/page/route"
      );
      mocks.spaceExists.mockResolvedValue(false);
      const res = await POST(
        new Request("http://localhost/api/wakies/messages/m1/page", {
          body: JSON.stringify({ spaceId: "space-ailleurs" }),
          headers: {
            "Content-Type": "application/json",
            origin: "http://localhost",
          },
          method: "POST",
        }),
        { params: Promise.resolve({ id: "m1" }) }
      );
      expect(res.status).toBe(404);
      expect(mocks.createPage).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/wakies/search", () => {
    it("ne cherche pas sous deux caractères", async () => {
      const { GET } = await import("@/app/(chat)/api/wakies/search/route");
      const res = await GET(
        new Request("http://localhost/api/wakies/search?q=a")
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.messages).toEqual([]);
      expect(mocks.chercherDansWakies).not.toHaveBeenCalled();
      expect(mocks.searchWakiesWorkspace).not.toHaveBeenCalled();
    });

    it("cherche titres et messages au-delà du seuil", async () => {
      const { GET } = await import("@/app/(chat)/api/wakies/search/route");
      mocks.chercherDansWakiesMessages.mockResolvedValue({
        conversations: [],
        messages: [{ conversationId: "conv-1", extrait: "projet", id: "m1" }],
      });
      const res = await GET(
        new Request("http://localhost/api/wakies/search?q=projet&messages=1")
      );
      expect(res.status).toBe(200);
      expect(mocks.chercherDansWakiesMessages).toHaveBeenCalledWith(
        "alice",
        "projet"
      );
    });

    it("sert la recherche unifiée de l'espace de travail", async () => {
      const { GET } = await import("@/app/(chat)/api/wakies/search/route");
      mocks.searchWakiesWorkspace.mockResolvedValue({
        counts: { conversation: 1, message: 0, page: 0, space: 0, wakie: 0 },
        hits: [
          {
            conversationId: "conv-1",
            href: "/wakies/c/conv-1",
            id: "conversation-conv-1",
            kind: "conversation",
            title: "Projet Ada",
          },
        ],
      });
      const res = await GET(
        new Request("http://localhost/api/wakies/search?q=projet")
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(mocks.searchWakiesWorkspace).toHaveBeenCalledWith(
        "alice",
        "projet"
      );
      expect(data.hits).toHaveLength(1);
      expect(data.hits[0].title).toBe("Projet Ada");
      expect(data.counts.conversation).toBe(1);
    });
  });

  describe("GET /api/wakies/me/profile", () => {
    it("sert le profil Vibe du compte", async () => {
      const { GET } = await import("@/app/(chat)/api/wakies/me/profile/route");
      mocks.profilVibe.mockResolvedValue({
        avatarUrl: null,
        bio: "Je construis mAI.",
        displayName: "Alice",
        localisation: "Lyon",
        site: "",
        username: "alice",
      });
      const res = await GET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.displayName).toBe("Alice");
      // Le profil social ne transporte ni email ni forfait.
      expect(data.tier).toBeUndefined();
      expect(data.email).toBeUndefined();
    });

    it("répond 404 franc quand Vibe n'a pas de profil", async () => {
      const { GET } = await import("@/app/(chat)/api/wakies/me/profile/route");
      mocks.profilVibe.mockResolvedValue(null);
      const res = await GET();
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
