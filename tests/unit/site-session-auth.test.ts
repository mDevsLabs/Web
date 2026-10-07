import { SignJWT } from "jose";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as sessionModule from "@/lib/auth/session";
import { MAI_SESSION_COOKIE } from "@/lib/constants";
import {
  authenticateSession,
  resolveSessionIdentity,
  verifyMaiSessionToken,
} from "@/lib/site/session-auth";

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
    vi.restoreAllMocks();
  });

  it("authentifie un token valide localement (chemin rapide HS256)", async () => {
    const validToken = await new SignJWT({ sub: "user_local_456", tier: "Pro" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(Math.floor(Date.now() / 1000) + 3600)
      .sign(secretBytes);

    const getMaiUserSpy = vi.spyOn(sessionModule, "getMaiUser");

    const identity = await resolveSessionIdentity(validToken);
    expect(identity).not.toBeNull();
    expect(identity?.userId).toBe("user_local_456");
    expect(identity?.tier).toBe("Pro");

    // En cas de succès local, getMaiUser ne doit pas être appelé
    expect(getMaiUserSpy).not.toHaveBeenCalled();

    // Test via authenticateSession avec Authorization Bearer
    const req = new NextRequest("https://localhost/api/site/test", {
      headers: { Authorization: `Bearer ${validToken}` },
    });
    const authResult = await authenticateSession(req);
    expect(authResult.ok).toBe(true);
    if (authResult.ok) {
      expect(authResult.identity.userId).toBe("user_local_456");
      expect(authResult.identity.tier).toBe("Pro");
    }
  });

  it("effectue un fallback sur getMaiUser lorsque la validation locale est impossible (clé absente ou divergente)", async () => {
    // Secret local inexistant ou différent
    delete process.env.MAI_JWT_SECRET;

    const distantToken = "distant_valid_jwt_token_from_backend";
    const getMaiUserSpy = vi
      .spyOn(sessionModule, "getMaiUser")
      .mockResolvedValue({
        email: "mathias@mai.dev",
        id: "user_remote_789",
        limit: 100000,
        tier: "Max",
        tokensUsed: 120,
        username: "mathias",
      });

    const identity = await resolveSessionIdentity(distantToken);
    expect(identity).not.toBeNull();
    expect(identity?.userId).toBe("user_remote_789");
    expect(identity?.tier).toBe("Max");
    expect(getMaiUserSpy).toHaveBeenCalledWith(distantToken);

    // Test via authenticateSession avec cookie mai_session
    const req = new NextRequest("https://localhost/api/site/test", {
      headers: { cookie: `${MAI_SESSION_COOKIE}=${distantToken}` },
    });
    const authResult = await authenticateSession(req);
    expect(authResult.ok).toBe(true);
    if (authResult.ok) {
      expect(authResult.identity.userId).toBe("user_remote_789");
      expect(authResult.identity.tier).toBe("Max");
    }
  });

  it("retourne null et 401 pour un token réellement invalide (rejeté localement et par getMaiUser)", async () => {
    delete process.env.MAI_JWT_SECRET;

    const invalidToken = "completely_invalid_garbage_token";
    vi.spyOn(sessionModule, "getMaiUser").mockResolvedValueOnce(null);

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
});
