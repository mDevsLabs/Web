import { afterEach, describe, expect, it, vi } from "vitest";
import { refreshTokens } from "@/lib/integrations/oauth";
import { getIntegrationProvider } from "@/lib/integrations/providers";

function stubFetch(handler: () => Promise<Response> | Response) {
  const mock = vi.fn(handler);
  vi.stubGlobal("fetch", mock);
  return mock;
}

const descriptor = getIntegrationProvider("google");
if (!descriptor) {
  throw new Error("Le fournisseur google est requis pour ces tests.");
}
const credentials = { clientId: "client", clientSecret: "secret" };

describe("OAuth — distinguer refus terminal et indisponibilité", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("503 ne révoque pas : erreur temporaire", async () => {
    stubFetch(() => new Response("{}", { status: 503 }));
    const result = await refreshTokens(descriptor, {
      credentials,
      refreshToken: "refresh",
    });
    expect(result).toEqual({ ok: false, reason: "temporary" });
  });

  it("429 ne révoque pas : erreur temporaire", async () => {
    stubFetch(() => new Response("{}", { status: 429 }));
    const result = await refreshTokens(descriptor, {
      credentials,
      refreshToken: "refresh",
    });
    expect(result).toEqual({ ok: false, reason: "temporary" });
  });

  it("erreur réseau ne révoque pas", async () => {
    stubFetch(async () => {
      throw new TypeError("network down");
    });
    const result = await refreshTokens(descriptor, {
      credentials,
      refreshToken: "refresh",
    });
    expect(result).toEqual({ ok: false, reason: "temporary" });
  });

  it("invalid_grant est un refus TERMINAL", async () => {
    stubFetch(
      () =>
        new Response(JSON.stringify({ error: "invalid_grant" }), {
          status: 400,
        })
    );
    const result = await refreshTokens(descriptor, {
      credentials,
      refreshToken: "refresh",
    });
    expect(result).toEqual({ ok: false, reason: "grant_revoked" });
  });

  it("invalid_client est une erreur de CONFIGURATION, pas une révocation", async () => {
    stubFetch(
      () =>
        new Response(JSON.stringify({ error: "invalid_client" }), {
          status: 401,
        })
    );
    const result = await refreshTokens(descriptor, {
      credentials,
      refreshToken: "refresh",
    });
    expect(result).toEqual({ ok: false, reason: "configuration" });
  });

  it("une réponse valide renvoie le jeu de jetons et conserve le refresh", async () => {
    stubFetch(
      () =>
        new Response(
          JSON.stringify({
            access_token: "access-2",
            expires_in: 3600,
            token_type: "Bearer",
          }),
          { status: 200 }
        )
    );
    const result = await refreshTokens(descriptor, {
      credentials,
      refreshToken: "refresh",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.accessToken).toBe("access-2");
      expect(result.value.refreshToken).toBe("refresh");
      expect(result.value.expiresAt).toBeInstanceOf(Date);
    }
  });

  it("la reprise après indisponibilité réussit sans changement de jeton", async () => {
    let attempt = 0;
    stubFetch(() => {
      attempt += 1;
      if (attempt === 1) return new Response("{}", { status: 503 });
      return new Response(
        JSON.stringify({ access_token: "access-3", expires_in: 60 }),
        { status: 200 }
      );
    });
    const first = await refreshTokens(descriptor, {
      credentials,
      refreshToken: "refresh",
    });
    expect(first).toEqual({ ok: false, reason: "temporary" });
    const second = await refreshTokens(descriptor, {
      credentials,
      refreshToken: "refresh",
    });
    expect(second.ok).toBe(true);
  });
});
