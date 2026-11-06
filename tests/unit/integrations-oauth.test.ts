import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buildAuthorizeUrl,
  callbackUriFor,
  newNonce,
  openState,
  readCredentials,
  sanitizeReturnTo,
  sealState,
  stateCookieName,
  stateCookiePath,
} from "@/lib/integrations/oauth";
import {
  getIntegrationProvider,
  hasWriteScope,
} from "@/lib/integrations/providers";

/**
 * Le scellement de l'état OAuth et l'URI de rappel sont les deux pièces qui
 * transforment un redirect en authentification : ce fichier les teste sans
 * réseau, sans base et sans écran de consentement.
 */

const ENV_KEYS = [
  "MCP_ENCRYPTION_KEY",
  "MCP_ENCRYPTION_KEY_ID",
  "MCP_ENCRYPTION_PREVIOUS_KEYS",
  "MCP_ENCRYPTION_ALLOW_LEGACY_DERIVED_KEY",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "MAI_OAUTH_REDIRECT_BASE_URL",
] as const;

let saved: Record<string, string | undefined> = {};

beforeEach(() => {
  saved = {};
  for (const key of ENV_KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
  process.env.MCP_ENCRYPTION_KEY = "cle-de-test-de-chiffrement-oauth";
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = saved[key];
    }
  }
});

const github = getIntegrationProvider("github")!;

describe("sealState / openState", () => {
  it("fait voyager l'identité, la page de retour et l'installation différée", () => {
    const nonce = newNonce();
    const state = sealState({
      i: "github",
      n: nonce,
      p: "github",
      r: "/tools/plugins/github",
      u: "user-1",
      x: Date.now() + 60_000,
    });
    const opened = openState(state, { nonce, provider: "github" });
    expect(opened).toMatchObject({
      i: "github",
      n: nonce,
      p: "github",
      r: "/tools/plugins/github",
      u: "user-1",
    });
  });

  it("rejecte un état forgé, sans le déchiffrer partiellement", () => {
    expect(
      openState("mai1.v0.Zm9v", { nonce: newNonce(), provider: "github" })
    ).toBeNull();
    expect(
      openState("pas-un-état", { nonce: newNonce(), provider: "github" })
    ).toBeNull();
  });

  it("rejecte un cookie de nonce absent ou différent", () => {
    const nonce = newNonce();
    const state = sealState({
      n: nonce,
      p: "github",
      r: "/chat/1",
      u: "user-1",
      x: Date.now() + 60_000,
    });
    expect(
      openState(state, { nonce: undefined, provider: "github" })
    ).toBeNull();
    expect(openState(state, { nonce: "autre", provider: "github" })).toBeNull();
  });

  it("rejecte un état expiré", () => {
    const nonce = newNonce();
    const state = sealState({
      n: nonce,
      p: "github",
      r: "/chat/1",
      u: "user-1",
      x: Date.now() - 1,
    });
    expect(openState(state, { nonce, provider: "github" })).toBeNull();
  });

  it("refuse qu'un état d'un fournisseur déverrouille la connexion d'un autre", () => {
    const nonce = newNonce();
    const state = sealState({
      n: nonce,
      p: "github",
      r: "/chat/1",
      u: "user-1",
      x: Date.now() + 60_000,
    });
    expect(openState(state, { nonce, provider: "notion" })).toBeNull();
  });

  it("échoue franchement sans coffre configuré", () => {
    delete process.env.MCP_ENCRYPTION_KEY;
    expect(() =>
      sealState({
        n: "n",
        p: "github",
        r: "/chat/1",
        u: "user-1",
        x: Date.now() + 60_000,
      })
    ).toThrow(/MCP_ENCRYPTION_KEY/);
    expect(
      openState("mai1.v0.AAA", { nonce: "n", provider: "github" })
    ).toBeNull();
  });

  it("isole le nonce par fournisseur : deux onglets ne s'écrasent pas", () => {
    expect(stateCookieName("github")).toBe("mai_oauth_nonce-github");
    expect(stateCookieName("github")).not.toBe(stateCookieName("notion"));
  });

  it("place et efface le nonce sur le chemin public, basePath compris", () => {
    expect(stateCookiePath()).toBe("/api/integration");
    expect(stateCookiePath("/demo")).toBe("/demo/api/integration");
    expect(stateCookiePath("/demo/")).toBe("/demo/api/integration");
  });
});

describe("sanitizeReturnTo", () => {
  it("n'accepte qu'une route interne", () => {
    expect(sanitizeReturnTo("/tools/plugins/github")).toBe(
      "/tools/plugins/github"
    );
    expect(sanitizeReturnTo("//evil.example")).toBeNull();
    expect(sanitizeReturnTo("/\\evil.example")).toBeNull();
    expect(sanitizeReturnTo("https://evil.example")).toBeNull();
    expect(sanitizeReturnTo("")).toBeNull();
    expect(sanitizeReturnTo(null)).toBeNull();
  });
});

describe("buildAuthorizeUrl", () => {
  const params = {
    clientId: "client-id",
    redirectUri: "https://mai.example/api/integration/github/callback",
    state: "état-scellé",
  };

  it("n'invente à GitHub aucun paramètre de refresh", () => {
    const url = new URL(
      buildAuthorizeUrl(github, {
        ...params,
        redirectUri: "https://mai.example/api/integration/github/callback",
      })
    );
    expect(url.origin).toBe("https://github.com");
    expect(url.searchParams.has("access_type")).toBe(false);
    expect(url.searchParams.has("prompt")).toBe(false);
    expect(url.searchParams.get("scope")).toBe("repo public_repo read:user");
  });

  it("n'ajoute pas de PKCE", () => {
    const url = new URL(buildAuthorizeUrl(github, params));
    expect(github.pkce).toBe(false);
    expect(url.searchParams.has("code_challenge")).toBe(false);
    expect(url.searchParams.get("state")).toBe("état-scellé");
  });
});

describe("callbackUriFor", () => {
  it("conserve l'origine et le basePath tels que reçus", () => {
    expect(
      callbackUriFor({
        requestUrl: "https://mai.example/demo/api/integration/github/connect",
      })
    ).toBe("https://mai.example/demo/api/integration/github/callback");
  });

  it("suit le protocole réellement perçu derrière un proxy", () => {
    // `x-forwarded-proto` peut arriver avec ou sans deux-points, et en liste.
    for (const protocol of ["https", "https:", "https, http"]) {
      expect(
        callbackUriFor({
          protocol,
          requestUrl: "http://127.0.0.1:3000/api/integration/github/connect",
        })
      ).toBe("https://127.0.0.1:3000/api/integration/github/callback");
    }
  });

  it("se laisse forcer par MAI_OAUTH_REDIRECT_BASE_URL", () => {
    process.env.MAI_OAUTH_REDIRECT_BASE_URL = "http://localhost:3000";
    expect(
      callbackUriFor({
        requestUrl: "https://mai.example/api/integration/github/connect",
      })
    ).toBe("http://localhost:3000/api/integration/github/callback");
  });

  it("ne fabrique pas une URI hors du flux", () => {
    expect(
      callbackUriFor({ requestUrl: "https://mai.example/api/plugins" })
    ).toBeNull();
    expect(callbackUriFor({ requestUrl: "pas une url" })).toBeNull();
  });
});

describe("readCredentials", () => {
  it("reste muet tant que le couple d'identifiants n'est pas complet", () => {
    expect(readCredentials(github)).toBeNull();
    process.env.GITHUB_CLIENT_ID = "id";
    expect(readCredentials(github)).toBeNull();
    process.env.GITHUB_CLIENT_SECRET = "secret";
    expect(readCredentials(github)).toEqual({
      clientId: "id",
      clientSecret: "secret",
    });
  });

  it("ignore un couple d'identifiants qui n'est pas celui de GitHub", () => {
    process.env.GOOGLE_CLIENT_ID = "google-id";
    process.env.GOOGLE_CLIENT_SECRET = "google-secret";
    expect(readCredentials(github)).toBeNull();
  });
});

describe("portées d'écriture", () => {
  it("lit les portées GitHub séparées par des virgules", () => {
    expect(hasWriteScope(github, "repo,read:user")).toBe(true);
    expect(hasWriteScope(github, "read:user")).toBe(false);
  });
});
