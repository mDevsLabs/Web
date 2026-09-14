import { beforeEach, describe, expect, it, vi } from "vitest";

import { authenticateChatRequest } from "@/lib/chat/auth";
import { clearPersistedTierCache } from "@/lib/db/users";

// Mock des couches externes : le pipeline d'authentification doit produire un
// ChatAuth dont le tier provient EXCLUSIVEMENT de users.tier (DB), jamais du
// JWT ni d'un cookie. Aucune vraie base, aucun vrai compte.
const unsafeMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db/queries", () => ({
  dbReady: vi.fn(async () => {}),
  getRawClient: vi.fn(() => ({ unsafe: unsafeMock })),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) =>
      name === "mai_session" ? { value: "tok" } : undefined,
  })),
}));

vi.mock("@vercel/functions", () => ({
  ipAddress: () => "203.0.113.9",
}));

vi.mock("botid/server", () => ({
  checkBotId: vi.fn(async () => ({ isBot: false })),
}));

vi.mock("@/lib/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/session")>();
  return {
    ...actual,
    getMaiSessionToken: vi.fn(async () => "tok"),
    // getMaiUser est vérifié en détail dans les tests session ; ici on simule
    // un JWT valide dont le tier embarqué est volontairement OBSOLÈTE (Free)
    // alors que users.tier dit Plus : la DB doit gagner.
    getMaiUser: vi.fn(async () => ({
      avatarUrl: null,
      email: "user@example.com",
      id: "u-1",
      limit: 1_000_000,
      tier: "Free",
      tokensUsed: 0,
      username: "user",
    })),
  };
});

vi.mock("@/lib/ratelimit", () => ({
  checkIpRateLimit: vi.fn(async () => {}),
}));

function row(tier: string | null): Array<{ id: string; tier: string | null }> {
  return tier === null ? [] : [{ id: "u-1", tier }];
}

describe("authenticateChatRequest (tier = users.tier, jamais le JWT)", () => {
  beforeEach(() => {
    // Le cache tier est un état module partagé : chaque cas repart d'un cache
    // vide pour refléter une requête réelle.
    clearPersistedTierCache();
  });
  it("un JWT tier=Free + users.tier=Plus donne un ChatAuth Plus (bug Plus corrigé)", async () => {
    unsafeMock.mockResolvedValue(row("Plus"));

    const { auth, tierFailure } = await authenticateChatRequest();

    expect(tierFailure).toBeUndefined();
    expect(auth?.maiUser.tier).toBe("plus");
    expect(auth?.isFreeUser).toBe(false);
    expect(unsafeMock).toHaveBeenCalledWith(expect.any(String), ["u-1"]);
  });

  it("les valeurs users.tier avec casse différente sont canonisées", async () => {
    unsafeMock.mockResolvedValue(row("PRO"));

    const { auth } = await authenticateChatRequest();

    expect(auth?.maiUser.tier).toBe("pro");
  });
  it("un utilisateur absent de users est refusé (aucun repli silencieux)", async () => {
    unsafeMock.mockResolvedValue([]);

    const { auth, error, tierFailure } = await authenticateChatRequest();

    expect(auth).toBeUndefined();
    expect(error).toBe("unauthorized");
    expect(tierFailure).toBe("missing");
  });

  it("un tier inconnu est refusé (invalid) — aucun privilège implicite", async () => {
    unsafeMock.mockResolvedValue(row("Enterprise"));

    const { auth, tierFailure } = await authenticateChatRequest();

    expect(auth).toBeUndefined();
    expect(tierFailure).toBe("invalid");
  });

  it("une base injoignable refuse fermement (unavailable), sans utiliser le tier JWT", async () => {
    unsafeMock.mockRejectedValue(new Error("connection refused"));

    const { auth, tierFailure } = await authenticateChatRequest();

    expect(auth).toBeUndefined();
    expect(tierFailure).toBe("unavailable");
  });

  it("une session absente renvoie unauthorized sans lire la base", async () => {
    const { getMaiSessionToken } = await import("@/lib/auth/session");
    (getMaiSessionToken as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    unsafeMock.mockResolvedValue(row("Plus"));

    const { auth, error } = await authenticateChatRequest();

    expect(auth).toBeUndefined();
    expect(error).toBe("unauthorized");
    expect(unsafeMock).not.toHaveBeenCalled();
  });
});
