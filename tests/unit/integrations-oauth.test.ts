import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  callbackUriFor,
  newNonce,
  openState,
  sanitizeReturnTo,
  sealState,
  stateCookieName,
  stateCookiePath,
} from "@/lib/plugins/core/oauth-state";

/**
 * Le scellement de l'état OAuth et l'URI de rappel restent utilisés par les
 * plugins OAuth personnels (`/api/user-plugins/[id]/connect` et `callback`) :
 * ce fichier les teste sans réseau, sans base et sans écran de consentement.
 */

const ENV_KEYS = [
  "MCP_ENCRYPTION_KEY",
  "MCP_ENCRYPTION_KEY_ID",
  "MCP_ENCRYPTION_PREVIOUS_KEYS",
  "MCP_ENCRYPTION_ALLOW_LEGACY_DERIVED_KEY",
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

describe("sealState / openState", () => {
  it("fait voyager l'identité, la page de retour et l'identifiant de plugin", () => {
    const nonce = newNonce();
    const state = sealState({
      i: "custom-1",
      n: nonce,
      p: "custom-1",
      r: "/tools/plugins",
      u: "user-1",
      x: Date.now() + 60_000,
    });
    const opened = openState(state, { nonce, provider: "custom-1" });
    expect(opened).toMatchObject({
      i: "custom-1",
      n: nonce,
      p: "custom-1",
      r: "/tools/plugins",
      u: "user-1",
    });
  });

  it("rejette un état forgé, sans le déchiffrer partiellement", () => {
    expect(
      openState("mai1.v0.Zm9v", { nonce: newNonce(), provider: "custom-1" })
    ).toBeNull();
    expect(
      openState("pas-un-état", { nonce: newNonce(), provider: "custom-1" })
    ).toBeNull();
  });

  it("rejette un cookie de nonce absent ou différent", () => {
    const nonce = newNonce();
    const state = sealState({
      n: nonce,
      p: "custom-1",
      r: "/chat/1",
      u: "user-1",
      x: Date.now() + 60_000,
    });
    expect(
      openState(state, { nonce: undefined, provider: "custom-1" })
    ).toBeNull();
    expect(
      openState(state, { nonce: "autre", provider: "custom-1" })
    ).toBeNull();
  });

  it("rejette un état expiré", () => {
    const nonce = newNonce();
    const state = sealState({
      n: nonce,
      p: "custom-1",
      r: "/chat/1",
      u: "user-1",
      x: Date.now() - 1,
    });
    expect(openState(state, { nonce, provider: "custom-1" })).toBeNull();
  });

  it("refuse qu'un état d'un fournisseur déverrouille la connexion d'un autre", () => {
    const nonce = newNonce();
    const state = sealState({
      n: nonce,
      p: "custom-1",
      r: "/chat/1",
      u: "user-1",
      x: Date.now() + 60_000,
    });
    expect(openState(state, { nonce, provider: "custom-2" })).toBeNull();
  });

  it("échoue franchement sans coffre configuré", () => {
    delete process.env.MCP_ENCRYPTION_KEY;
    expect(() =>
      sealState({
        n: "n",
        p: "custom-1",
        r: "/chat/1",
        u: "user-1",
        x: Date.now() + 60_000,
      })
    ).toThrow(/MCP_ENCRYPTION_KEY/);
    expect(
      openState("mai1.v0.AAA", { nonce: "n", provider: "custom-1" })
    ).toBeNull();
  });

  it("isole le nonce par fournisseur : deux onglets ne s'écrasent pas", () => {
    expect(stateCookieName("custom-1")).toBe("mai_oauth_nonce-custom-1");
    expect(stateCookieName("custom-1")).not.toBe(stateCookieName("custom-2"));
  });

  it("place et efface le nonce sur le chemin public, basePath compris", () => {
    expect(stateCookiePath()).toBe("/api/user-plugins");
    expect(stateCookiePath("/demo")).toBe("/demo/api/user-plugins");
    expect(stateCookiePath("/demo/")).toBe("/demo/api/user-plugins");
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

describe("callbackUriFor", () => {
  it("conserve l'origine et le basePath tels que reçus", () => {
    expect(
      callbackUriFor({
        requestUrl:
          "https://mai.example/demo/api/user-plugins/custom-1/connect",
      })
    ).toBe("https://mai.example/demo/api/user-plugins/custom-1/callback");
  });

  it("suit le protocole réellement perçu derrière un proxy", () => {
    for (const protocol of ["https", "https:", "https, http"]) {
      expect(
        callbackUriFor({
          protocol,
          requestUrl: "http://127.0.0.1:3000/api/user-plugins/custom-1/connect",
        })
      ).toBe("https://127.0.0.1:3000/api/user-plugins/custom-1/callback");
    }
  });

  it("se laisse forcer par MAI_OAUTH_REDIRECT_BASE_URL", () => {
    process.env.MAI_OAUTH_REDIRECT_BASE_URL = "http://localhost:3000";
    expect(
      callbackUriFor({
        requestUrl: "https://mai.example/api/user-plugins/custom-1/connect",
      })
    ).toBe("http://localhost:3000/api/user-plugins/custom-1/callback");
  });

  it("ne fabrique pas une URI hors du flux", () => {
    expect(
      callbackUriFor({ requestUrl: "https://mai.example/api/plugins" })
    ).toBeNull();
    expect(callbackUriFor({ requestUrl: "pas une url" })).toBeNull();
  });
});
