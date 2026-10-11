import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Annuaire, amis et clonage : trois routes qui touchent à la frontière entre
 * comptes. Ce que ces tests protègent, précisément :
 *
 *   - l'identité (session mAI, forfait payant) est vérifiée AVANT toute
 *     lecture de données ;
 *   - l'origine est vérifiée avant toute MUTATION (cookie de session oblige) ;
 *   - un Wakie privé répond 404, un Wakie qui m'appartient répond 409 : on ne
 *     « découvre » pas l'existence d'un Wakie privé par un code d'erreur ;
 *   - le clonage consomme le quota `wakies` et rend 429 quand il est atteint.
 */

const WAKIE = "11111111-1111-4111-8111-111111111111";

const mocks = vi.hoisted(() => ({
  ajouterAmi: vi.fn(),
  clonerWakiePublic: vi.fn(),
  findWakie: vi.fn(),
  listerAmis: vi.fn(),
  listerAnnuaire: vi.fn(),
  retirerAmi: vi.fn(),
  trouverWakiePublic: vi.fn(),
  user: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getMaiUser: mocks.user }));
vi.mock("@/lib/wakies/queries", () => ({
  ...mocks,
  WakiesQuotaError: class WakiesQuotaError extends Error {
    readonly limite: number;
    readonly utilise: number;
    constructor(limite: number, utilise: number) {
      super(`quota ${limite}`);
      this.limite = limite;
      this.utilise = utilise;
    }
  },
}));

const charger = async () => ({
  amis: await import("@/app/(chat)/api/wakies/friends/route"),
  annuaire: await import("@/app/(chat)/api/wakies/directory/route"),
  clone: await import("@/app/(chat)/api/wakies/wakies/[id]/clone/route"),
  queries: await import("@/lib/wakies/queries"),
});

const url = (chemin: string) => `https://mai.example/api/wakies${chemin}`;

describe("routes sociales Wakies", { timeout: 30_000 }, () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.user.mockResolvedValue({
      email: "alice@example.test",
      id: "alice",
      tier: "plus",
    });
    mocks.findWakie.mockResolvedValue(null);
    mocks.trouverWakiePublic.mockResolvedValue({
      avatar: null,
      handle: "muse",
      name: "Muse",
      publicPersona: "Je publie des notes.",
    });
  });

  describe("GET /api/wakies/directory", () => {
    it("exige une session et un forfait payant", async () => {
      const { annuaire } = await charger();
      mocks.user.mockResolvedValue(null);
      expect(
        (await annuaire.GET(new Request(url("/directory?q=mu")))).status
      ).toBe(401);
      mocks.user.mockResolvedValue({ id: "free", tier: "free" });
      expect(
        (await annuaire.GET(new Request(url("/directory?q=mu")))).status
      ).toBe(403);
      expect(mocks.listerAnnuaire).not.toHaveBeenCalled();
    });

    it("ne cherche pas sous deux caractères", async () => {
      const { annuaire } = await charger();
      const res = await annuaire.GET(new Request(url("/directory?q=m")));
      expect(res.status).toBe(200);
      expect((await res.json()).resultats).toEqual([]);
      expect(mocks.listerAnnuaire).not.toHaveBeenCalled();
    });

    it("rend les résultats publics enrichis pour le compte", async () => {
      const { annuaire } = await charger();
      mocks.listerAnnuaire.mockResolvedValue([
        {
          avatar: null,
          bio: "Notes courtes",
          estAmi: false,
          estMien: false,
          handle: "muse",
          name: "Muse",
          nombreImages: 3,
          personaPubliee: "Je publie des notes.",
          wakieId: WAKIE,
        },
      ]);
      const res = await annuaire.GET(new Request(url("/directory?q=muse")));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.resultats).toHaveLength(1);
      // Aucun identifiant de compte ne traverse cette route.
      expect(JSON.stringify(data)).not.toContain("userId");
      expect(mocks.listerAnnuaire).toHaveBeenCalledWith("alice", "muse", 20);
    });
  });

  describe("/api/wakies/friends", () => {
    it("refuse une mutation d'une autre origine", async () => {
      const { amis } = await charger();
      const res = await amis.POST(
        new Request(url("/friends"), {
          body: JSON.stringify({ wakieId: WAKIE }),
          headers: { origin: "https://hostile.example" },
          method: "POST",
        })
      );
      expect(res.status).toBe(403);
      expect(mocks.ajouterAmi).not.toHaveBeenCalled();
    });

    it("refuse un Wakie qui m'appartient, sans rien écrire", async () => {
      const { amis } = await charger();
      mocks.findWakie.mockResolvedValue({ id: WAKIE, name: "Le mien" });
      const res = await amis.POST(
        new Request(url("/friends"), {
          body: JSON.stringify({ wakieId: WAKIE }),
          method: "POST",
        })
      );
      expect(res.status).toBe(400);
      expect(mocks.ajouterAmi).not.toHaveBeenCalled();
    });

    it("répond 404 pour un Wakie privé ou inconnu", async () => {
      const { amis } = await charger();
      mocks.trouverWakiePublic.mockResolvedValue(null);
      const res = await amis.POST(
        new Request(url("/friends"), {
          body: JSON.stringify({ wakieId: WAKIE }),
          method: "POST",
        })
      );
      expect(res.status).toBe(404);
      expect(mocks.ajouterAmi).not.toHaveBeenCalled();
    });

    it("ajoute un ami public et rend la liste du compte", async () => {
      const { amis } = await charger();
      mocks.ajouterAmi.mockResolvedValue(true);
      mocks.listerAmis.mockResolvedValue([
        { handle: "muse", id: WAKIE, name: "Muse" },
      ]);
      const res = await amis.POST(
        new Request(url("/friends"), {
          body: JSON.stringify({ wakieId: WAKIE }),
          method: "POST",
        })
      );
      expect(res.status).toBe(201);
      expect(mocks.ajouterAmi).toHaveBeenCalledWith("alice", WAKIE);
      const liste = await amis.GET();
      expect((await liste.json()).amis).toHaveLength(1);
    });

    it("exige un identifiant valide au retrait", async () => {
      const { amis } = await charger();
      const res = await amis.DELETE(
        new Request(url("/friends?wakieId=pas-un-uuid"), { method: "DELETE" })
      );
      expect(res.status).toBe(400);
      expect(mocks.retirerAmi).not.toHaveBeenCalled();
    });
  });

  describe("POST /api/wakies/wakies/:id/clone", () => {
    const cloner = async (corps: unknown) => {
      const { clone } = await charger();
      return clone.POST(
        new Request(url(`/wakies/${WAKIE}/clone`), {
          body: JSON.stringify(corps),
          method: "POST",
        }),
        { params: Promise.resolve({ id: WAKIE }) }
      );
    };

    it("refuse le clonage d'un Wakie qui m'appartient", async () => {
      const { clone } = await charger();
      mocks.findWakie.mockResolvedValue({ id: WAKIE, name: "Le mien" });
      const res = await clone.POST(
        new Request(url(`/wakies/${WAKIE}/clone`), {
          body: JSON.stringify({ spaceId: "espace-1" }),
          method: "POST",
        }),
        { params: Promise.resolve({ id: WAKIE }) }
      );
      expect(res.status).toBe(400);
      expect(mocks.clonerWakiePublic).not.toHaveBeenCalled();
    });

    it("refuse un Wakie non public", async () => {
      mocks.trouverWakiePublic.mockResolvedValue(null);
      expect((await cloner({ spaceId: "espace-1" })).status).toBe(404);
      expect(mocks.clonerWakiePublic).not.toHaveBeenCalled();
    });

    it("exige un espace de destination", async () => {
      expect((await cloner({})).status).toBe(400);
      expect(mocks.clonerWakiePublic).not.toHaveBeenCalled();
    });

    it("crée le clone dans le quota du forfait", async () => {
      mocks.clonerWakiePublic.mockResolvedValue({
        id: "clone-1",
        name: "Muse",
        spaceIds: ["espace-1"],
      });
      const res = await cloner({ name: "Muse bis", spaceId: "espace-1" });
      expect(res.status).toBe(201);
      expect((await res.json()).wakie.id).toBe("clone-1");
      expect(mocks.clonerWakiePublic).toHaveBeenCalledWith(
        "alice",
        WAKIE,
        { name: "Muse bis", spaceId: "espace-1" },
        6
      );
    });

    it("rend 429 quand le quota de Wakies est atteint", async () => {
      const { queries } = await charger();
      mocks.clonerWakiePublic.mockRejectedValue(
        new queries.WakiesQuotaError(6, 6)
      );
      const res = await cloner({ spaceId: "espace-1" });
      expect(res.status).toBe(429);
      expect((await res.json()).details).toMatchObject({
        limit: "wakies",
        quota: 6,
      });
    });
  });
});
