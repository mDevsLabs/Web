import { SignJWT } from "jose";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAI_SESSION_COOKIE } from "@/lib/constants";
import {
  authenticateSession,
  resolveSessionIdentity,
  verifyMaiSessionToken,
} from "@/lib/site/session-auth";

/**
 * Ces tests sont hermétiques : `fetch` est TOUJOURS stubbé. L'API distante est
 * l'autorité de session ; le token local n'est qu'un repli en cas de panne.
 */

describe("Authentification Site — resolveSessionIdentity et authenticateSession", () => {
  const secretKey = "test_super_secret_mai_jwt_32_bytes_len!";
  const secretBytes = new TextEncoder().encode(secretKey);
  const originalEnvSecret = process.env.MAI_JWT_SECRET;

  beforeEach(() => {
    process.env.MAI_JWT_SECRET = secretKey;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.MAI_JWT_SECRET = originalEnvSecret;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  async function makeToken(sub: string, tier = "Pro"): Promise<string> {
    return new SignJWT({ sub, tier })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(Math.floor(Date.now() / 1000) + 3600)
      .sign(secretBytes);
  }

  function stubUsageResponse(user: Record<string, unknown>) {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify(user), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        })
    );
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("authentifie un token validé par l'API émettrice", async () => {
    const token = await makeToken("user_local_456", "Pro");
    const fetchMock = stubUsageResponse({
      id: "user_local_456",
      limit: 30_000_000,
      tier: "Pro",
      tokensUsed: 42,
      username: "mathias",
    });

    const identity = await resolveSessionIdentity(token);
    expect(identity).not.toBeNull();
    expect(identity?.userId).toBe("user_local_456");
    expect(identity?.tier).toBe("Pro");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const req = new NextRequest("https://localhost/api/site/test", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const authResult = await authenticateSession(req);
    expect(authResult.ok).toBe(true);
    if (authResult.ok) {
      expect(authResult.identity.userId).toBe("user_local_456");
      expect(authResult.identity.tier).toBe("Pro");
    }
  });

  it("refuse un token révoqué par le backend même si sa signature locale est valide, et ne le ressuscite pas sans réseau", async () => {
    const token = await makeToken("user_revoked_1", "Max");
    expect(await verifyMaiSessionToken(token)).not.toBeNull();

    const fetchMock = vi.fn(async () => new Response("{}", { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);

    const identity = await resolveSessionIdentity(token);
    expect(identity).toBeNull();

    // L'entrée négative/refus est mémorisée : une nouvelle résolution ne
    // redemande pas l'API et ne réhabilite pas la signature locale.
    fetchMock.mockClear();
    const again = await resolveSessionIdentity(token);
    expect(again).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuse un compte bloqué (403) comme un refus définitif", async () => {
    const token = await makeToken("user_blocked_1");

    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ blocked: true }), { status: 403 })
    );
    vi.stubGlobal("fetch", fetchMock);

    const req = new NextRequest("https://localhost/api/site/test", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const authResult = await authenticateSession(req);
    expect(authResult.ok).toBe(false);
    if (!authResult.ok) {
      expect(authResult.response.status).toBe(401);
    }
  });

  it("accepte la signature locale quand l'API est injoignable (panne réseau, pas déconnexion)", async () => {
    const token = await makeToken("user_offline_1", "Plus");

    const fetchMock = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    vi.stubGlobal("fetch", fetchMock);

    const identity = await resolveSessionIdentity(token);
    expect(identity).not.toBeNull();
    expect(identity?.userId).toBe("user_offline_1");
    expect(identity?.tier).toBe("Plus");
  });

  it("accepte la signature locale si l'API répond 503 (indisponibilité sans jeton rejeté)", async () => {
    const token = await makeToken("user_503_1", "Plus");

    const fetchMock = vi.fn(async () => new Response("{}", { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);

    // 503 = panne : la signature locale reste un repli acceptable.
    const identity = await resolveSessionIdentity(token);
    expect(identity).not.toBeNull();
    expect(identity?.userId).toBe("user_503_1");
  });

  it("retourne null et 401 pour un token réellement invalide, sans second appel réseau", async () => {
    delete process.env.MAI_JWT_SECRET;

    const invalidToken = `completely_invalid_garbage_token_${Math.random()}`;
    const fetchMock = vi.fn(async () => new Response("{}", { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);

    const identity = await resolveSessionIdentity(invalidToken);
    expect(identity).toBeNull();

    const req = new NextRequest("https://localhost/api/site/test", {
      headers: { Authorization: `Bearer ${invalidToken}` },
    });
    const authResult = await authenticateSession(req);
    expect(authResult.ok).toBe(false);
    if (!authResult.ok) {
      expect(authResult.response.status).toBe(401);
      const body = await authResult.response.json();
      expect(body.error?.code).toBe("unauthorized");
    }

    // B14 : plus de `mockResolvedValueOnce` épuisé qui laisserait filer un
    // second appel réseau ; il y a au plus une résolution par invocation.
    expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(2);
  });

  it("retourne null et 401 en l'absence totale de session (aucun token)", async () => {
    const identity = await resolveSessionIdentity(null);
    expect(identity).toBeNull();

    const emptyIdentity = await resolveSessionIdentity("");
    expect(emptyIdentity).toBeNull();

    const req = new NextRequest("https://localhost/api/site/test");
    const authResult = await authenticateSession(req);
    expect(authResult.ok).toBe(false);
    if (!authResult.ok) {
      expect(authResult.response.status).toBe(401);
    }
  });

  it("lit le cookie mai_session sans promouvoir un en-tête", async () => {
    const token = await makeToken("user_cookie_1", "Max");
    const fetchMock = stubUsageResponse({
      id: "user_cookie_1",
      limit: 50_000_000,
      tier: "Max",
      tokensUsed: 0,
      username: "cookie",
    });

    const req = new NextRequest("https://localhost/api/site/test", {
      headers: { cookie: `${MAI_SESSION_COOKIE}=${token}` },
    });
    const authResult = await authenticateSession(req);
    expect(authResult.ok).toBe(true);
    if (authResult.ok) {
      expect(authResult.identity.userId).toBe("user_cookie_1");
    }
    expect(fetchMock).toHaveBeenCalled();
  });
});
