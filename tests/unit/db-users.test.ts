import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getPersistedTier, invalidatePersistedTier } from "@/lib/db/users";

// Mock de la couche SQL : aucune base réelle, aucun compte de production.
const unsafeMock = vi.hoisted(() => vi.fn());
const dbReadyMock = vi.hoisted(() => vi.fn(async () => {}));

vi.mock("@/lib/db/queries", () => ({
  dbReady: dbReadyMock,
  getRawClient: vi.fn(() => ({ unsafe: unsafeMock })),
}));
function sqlRow(
  tier: string | null
): Array<{ id: string; tier: string | null }> {
  return [{ id: "u-1", tier }];
}

describe("getPersistedTier (source de vérité users.tier)", () => {
  beforeEach(() => {
    unsafeMock.mockReset();
    // Le cache tier est un état module partagé : chaque cas repart d'un
    // cache vide pour refléter une requête réelle.
    invalidatePersistedTier("u-1");
    invalidatePersistedTier("ghost");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lit users.tier pour la ligne correspondant à users.id (cas Plus)", async () => {
    unsafeMock.mockResolvedValue(sqlRow("Plus"));

    const result = await getPersistedTier({ userId: "u-1" });

    expect(result).toEqual({ ok: true, tier: "plus" });
    expect(unsafeMock).toHaveBeenCalledWith(expect.any(String), ["u-1"]);
  });

  it("normalise la casse (PLUS, plus, Max) vers la forme canonique", async () => {
    unsafeMock.mockResolvedValue(sqlRow("PLUS"));
    expect((await getPersistedTier({ userId: "u-1" })).ok).toBe(true);

    // Nouvelle lecture : invalidation du cache entre les deux cas.
    invalidatePersistedTier("u-1");
    unsafeMock.mockResolvedValue(sqlRow("Max"));
    const max = await getPersistedTier({ userId: "u-1" });
    expect(max.ok && max.tier).toBe("max");
  });

  it("refus ferme (missing) si aucun users.id ne correspond", async () => {
    unsafeMock.mockResolvedValue([]);

    const result = await getPersistedTier({ userId: "ghost" });

    expect(result).toEqual({ ok: false, reason: "missing" });
  });

  it("refus ferme (invalid) pour un tier inconnu — aucun privilège implicite", async () => {
    unsafeMock.mockResolvedValue(sqlRow("Enterprise"));

    const result = await getPersistedTier({ userId: "u-1" });

    expect(result).toEqual({ ok: false, reason: "invalid" });
  });

  it("refus ferme (invalid) pour un tier vide ou NULL", async () => {
    unsafeMock.mockResolvedValue(sqlRow(""));
    expect(await getPersistedTier({ userId: "u-1" })).toEqual({
      ok: false,
      reason: "invalid",
    });

    unsafeMock.mockResolvedValue(sqlRow(null));
    expect(await getPersistedTier({ userId: "u-1" })).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("refus ferme (unavailable) si la base est injoignable — jamais de repli JWT", async () => {
    unsafeMock.mockRejectedValue(new Error("connection refused"));

    const result = await getPersistedTier({ userId: "u-1" });

    expect(result).toEqual({ ok: false, reason: "unavailable" });
  });

  it("refus (missing) si l'identifiant est absent ou vide", async () => {
    expect(await getPersistedTier({ userId: null })).toEqual({
      ok: false,
      reason: "missing",
    });
    expect(await getPersistedTier({ userId: "   " })).toEqual({
      ok: false,
      reason: "missing",
    });
  });

  it("met en cache le tier persisté (60 s) et sert les lectures suivantes sans SQL", async () => {
    unsafeMock.mockResolvedValue(sqlRow("Pro"));

    await getPersistedTier({ userId: "u-1" });
    await getPersistedTier({ userId: "u-1" });

    expect(unsafeMock).toHaveBeenCalledTimes(1);
  });

  it("invalidatePersistedTier force une nouvelle lecture SQL", async () => {
    unsafeMock.mockResolvedValue(sqlRow("Free"));

    await getPersistedTier({ userId: "u-1" });
    invalidatePersistedTier("u-1");

    unsafeMock.mockResolvedValue(sqlRow("Plus"));
    const after = await getPersistedTier({ userId: "u-1" });

    expect(unsafeMock).toHaveBeenCalledTimes(2);
    expect(after.ok && after.tier).toBe("plus");
  });
});
