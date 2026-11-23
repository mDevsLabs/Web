import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { IntegrationConnection } from "@/lib/db/schema";
import { packCredential } from "@/lib/integrations/credential-envelope";

/**
 * Résolution des jetons personnels stockés dans `integration_connection`.
 * Vérifie l'isolation par utilisateur, le dépaquetage des champs associés et
 * le refus d'exposer tout secret hors du périmètre autorisé.
 */

const store = vi.hoisted(() => ({
  getPrimaryConnection: vi.fn(),
  readAccessToken: vi.fn(),
}));

vi.mock("@/lib/integrations/repository", () => ({
  getPrimaryConnection: store.getPrimaryConnection,
  listActiveConnections: vi.fn(),
  markConnectionRevoked: vi.fn(),
  persistRefreshedTokens: vi.fn(),
  readAccessToken: store.readAccessToken,
  readRefreshToken: vi.fn(),
  storeConnection: vi.fn(),
}));

const { accessTokenForProvider, createIntegrationSecretResolver } =
  await import("@/lib/integrations/tokens");

function rowOf(
  overrides: Partial<IntegrationConnection> = {}
): IntegrationConnection {
  return {
    accessToken: "mai1.v0.cipher-access",
    accountEmail: "mathias@example.com",
    accountLabel: "mathias@example.com",
    createdAt: new Date(),
    expiresAt: null,
    id: "connection-1",
    isPrimary: true,
    lastRefreshedAt: null,
    provider: "github",
    providerAccountId: "1234",
    refreshToken: null,
    revokedAt: null,
    scopes: "",
    updatedAt: new Date(),
    userId: "user-1",
    ...overrides,
  } as IntegrationConnection;
}

beforeEach(() => {
  process.env.MCP_ENCRYPTION_KEY = "cle-de-test-chiffrement-oauth";
  store.getPrimaryConnection.mockReset();
  store.readAccessToken.mockReset();
  store.readAccessToken.mockReturnValue("jeton-deja-valide");
  store.getPrimaryConnection.mockResolvedValue(null);
});

afterEach(() => {
  delete process.env.MCP_ENCRYPTION_KEY;
});

describe("accessTokenForProvider", () => {
  it("retourne le jeton déchiffré pour un compte connecté", async () => {
    store.getPrimaryConnection.mockResolvedValue(rowOf());
    expect(
      await accessTokenForProvider({ provider: "github", userId: "user-1" })
    ).toEqual({
      accessToken: "jeton-deja-valide",
      revoked: false,
      scopes: "",
    });
  });

  it("signale une connexion révoquée si la ligne est indéchiffrable", async () => {
    store.getPrimaryConnection.mockResolvedValue(rowOf({ accessToken: "" }));
    store.readAccessToken.mockReturnValue(null);
    expect(
      await accessTokenForProvider({ provider: "github", userId: "user-1" })
    ).toEqual({
      accessToken: null,
      revoked: true,
      scopes: "",
    });
  });

  it("rend accessToken null quand aucun compte n'est connecté", async () => {
    store.getPrimaryConnection.mockResolvedValue(null);
    expect(
      await accessTokenForProvider({ provider: "github", userId: "user-1" })
    ).toEqual({ accessToken: null, revoked: false, scopes: "" });
  });
});

describe("createIntegrationSecretResolver", () => {
  it("ignore tout ce qui n'est pas un secret d'autorisation reconnu", async () => {
    const resolver = createIntegrationSecretResolver({ userId: "user-1" });
    expect(
      await resolver({ key: "github.access_token", kind: "env" })
    ).toBeUndefined();
    expect(await resolver({ key: "INCONNU", kind: "auth" })).toBeUndefined();
    expect(
      await resolver({ key: "inconnu.access_token", kind: "auth" })
    ).toBeUndefined();
    expect(
      await resolver({ key: "github.scopes", kind: "auth" })
    ).toBeUndefined();
  });

  it("délivre le jeton personnel et ses champs, jamais refresh_token", async () => {
    const packed = packCredential("phx_test_secret", { region: "eu" });
    store.getPrimaryConnection.mockResolvedValue(
      rowOf({ provider: "posthog" })
    );
    store.readAccessToken.mockReturnValue(packed);

    const resolver = createIntegrationSecretResolver({ userId: "user-1" });
    expect(await resolver({ key: "posthog.access_token", kind: "auth" })).toBe(
      "phx_test_secret"
    );
    expect(await resolver({ key: "posthog.fields", kind: "auth" })).toBe(
      JSON.stringify({ region: "eu" })
    );
    await expect(
      resolver({ key: "github.refresh_token", kind: "auth" })
    ).rejects.toThrow(/jamais expos/i);
  });

  it("rend undefined quand aucun compte n'est connecté", async () => {
    store.getPrimaryConnection.mockResolvedValue(null);
    const resolver = createIntegrationSecretResolver({ userId: "user-1" });
    expect(
      await resolver({ key: "github.access_token", kind: "auth" })
    ).toBeUndefined();
  });

  it("refuse de fonctionner sans coffre configuré", async () => {
    delete process.env.MCP_ENCRYPTION_KEY;
    const resolver = createIntegrationSecretResolver({ userId: "user-1" });
    await expect(
      resolver({ key: "github.access_token", kind: "auth" })
    ).rejects.toThrow(/Coffre non configur/);
  });
});
