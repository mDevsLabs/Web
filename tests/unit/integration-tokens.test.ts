import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { IntegrationConnection } from "@/lib/db/schema";

/**
 * Rafraîchissement des jetons : le coin où une connexion Google meurt en
 * silence si l'on se trompe. La rotation du `refresh_token`, l'écriture
 * conditionnée et le vol en groupe sont testés contre `fetch` simulé, pas contre
 * un mock de notre propre client OAuth — la préservation de l'ancien
 * `refresh_token` vit dans `oauth.ts` et doit y être vérifiée.
 */

const store = vi.hoisted(() => ({
  getPrimaryConnection: vi.fn(),
  listActiveConnections: vi.fn(),
  markConnectionRevoked: vi.fn(),
  persistRefreshedTokens: vi.fn(),
  readAccessToken: vi.fn(),
  readRefreshToken: vi.fn(),
}));

vi.mock("@/lib/integrations/repository", () => ({
  getPrimaryConnection: store.getPrimaryConnection,
  listActiveConnections: store.listActiveConnections,
  markConnectionRevoked: store.markConnectionRevoked,
  persistRefreshedTokens: store.persistRefreshedTokens,
  readAccessToken: store.readAccessToken,
  readRefreshToken: store.readRefreshToken,
  storeConnection: vi.fn(),
}));

const {
  accessTokenForProvider,
  createIntegrationSecretResolver,
  ensureFreshAccessToken,
} = await import("@/lib/integrations/tokens");
const { GOOGLE_SCOPES, getIntegrationProvider } = await import(
  "@/lib/integrations/providers"
);

const google = getIntegrationProvider("google")!;
const GRANTED = google.scopes.join(" ");

function rowOf(
  overrides: Partial<IntegrationConnection> = {}
): IntegrationConnection {
  return {
    accessToken: "mai1.v0.cipher-access",
    accountEmail: "mathias@example.com",
    accountLabel: "mathias@example.com",
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 3_600_000),
    id: "connection-1",
    isPrimary: true,
    lastRefreshedAt: null,
    provider: "google",
    providerAccountId: "1234",
    refreshToken: "mai1.v0.cipher-refresh",
    revokedAt: null,
    scopes: GRANTED,
    updatedAt: new Date(),
    userId: "user-1",
    ...overrides,
  } as IntegrationConnection;
}

function almostExpired(): IntegrationConnection {
  return rowOf({ expiresAt: new Date(Date.now() + 60_000) });
}

function jsonResponse(payload: unknown, ok = true): Response {
  return {
    body: null,
    ok,
    status: ok ? 200 : 400,
    text: async () => JSON.stringify(payload),
  } as unknown as Response;
}

const fetchMock = vi.fn();

beforeEach(() => {
  vi.useFakeTimers({ now: new Date("2026-10-11T10:00:00Z") });
  process.env.MCP_ENCRYPTION_KEY = "cle-de-test-chiffrement-oauth";
  process.env.GOOGLE_CLIENT_ID = "google-id";
  process.env.GOOGLE_CLIENT_SECRET = "google-secret";
  // Rien ne traverse d'un test à l'autre : les faux dépôts portent l'état
  // chiffré, et une implémentation qui déborderait rendrait un vert mensonger.
  for (const mock of Object.values(store)) {
    mock.mockReset();
  }
  store.readAccessToken.mockReturnValue("jeton-deja-valide");
  store.readRefreshToken.mockReturnValue("refresh-prec");
  store.persistRefreshedTokens.mockResolvedValue(true);
  store.markConnectionRevoked.mockResolvedValue(true);
  store.getPrimaryConnection.mockResolvedValue(null);
  store.listActiveConnections.mockResolvedValue([]);
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  delete process.env.MCP_ENCRYPTION_KEY;
  delete process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_SECRET;
});

describe("ensureFreshAccessToken", () => {
  it("ne touche pas au réseau quand le porteur a encore la vie longue", async () => {
    const outcome = await ensureFreshAccessToken({
      descriptor: google,
      row: rowOf(),
    });
    expect(outcome.accessToken).toBe("jeton-deja-valide");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rafraîchit dans la marge de cinq minutes et écrit le nouveau jeton", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        access_token: "jeton-neuf",
        expires_in: 3599,
        refresh_token: "refresh-neuf",
        scope: GRANTED,
      })
    );
    const outcome = await ensureFreshAccessToken({
      descriptor: google,
      row: almostExpired(),
    });
    expect(outcome.accessToken).toBe("jeton-neuf");
    expect(store.persistRefreshedTokens).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: "jeton-neuf",
        // La comparaison porte sur la valeur chiffrée stockée, pas sur le clair.
        expectedAccessToken: "mai1.v0.cipher-access",
        refreshToken: "refresh-neuf",
      })
    );
  });

  it("conserve l'ancien refresh_token quand Google n'en émet pas un nouveau", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ access_token: "jeton-neuf", expires_in: 3599 })
    );
    await ensureFreshAccessToken({
      descriptor: google,
      row: almostExpired(),
    });
    // Perdre le refresh_token rendrait la connexion définitivement muette.
    expect(store.persistRefreshedTokens).toHaveBeenCalledWith(
      expect.objectContaining({ refreshToken: "refresh-prec" })
    );
  });

  it("relit la connexion gagnante quand l'écriture conditionnée échoue", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ access_token: "jeton-perdu", expires_in: 3599 })
    );
    store.persistRefreshedTokens.mockResolvedValueOnce(false);
    store.getPrimaryConnection.mockResolvedValueOnce(
      rowOf({ accessToken: "mai1.v0.cipher-gagnant" })
    );
    // Le porteur de départ reste lisible : seule la relecture du gagnant change.
    store.readAccessToken.mockImplementation((row: IntegrationConnection) =>
      row.accessToken === "mai1.v0.cipher-gagnant"
        ? "jeton-du-gagnant"
        : "jeton-deja-valide"
    );
    const outcome = await ensureFreshAccessToken({
      descriptor: google,
      row: almostExpired(),
    });
    expect(outcome.accessToken).toBe("jeton-du-gagnant");
    expect(store.getPrimaryConnection).toHaveBeenCalled();
  });

  it("ne fait qu'une seule requête pour deux appels concurrents", async () => {
    let resolveFetch: ((value: Response) => void) | undefined;
    fetchMock.mockImplementation(
      () => new Promise<Response>((resolve) => (resolveFetch = resolve))
    );
    const row = almostExpired();
    const first = ensureFreshAccessToken({ descriptor: google, row });
    const second = ensureFreshAccessToken({ descriptor: google, row });
    resolveFetch?.(
      jsonResponse({ access_token: "jeton-partage", expires_in: 3599 })
    );
    const outcomes = await Promise.all([first, second]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(outcomes[0].accessToken).toBe("jeton-partage");
    expect(outcomes[1].accessToken).toBe("jeton-partage");
  });

  it("révoque la ligne quand le fournisseur refuse le grant, sans mentir sur la panne", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: "invalid_grant" }, false)
    );
    const outcome = await ensureFreshAccessToken({
      descriptor: google,
      row: almostExpired(),
    });
    expect(outcome.accessToken).toBeNull();
    expect(store.markConnectionRevoked).toHaveBeenCalled();
    expect(store.persistRefreshedTokens).not.toHaveBeenCalled();
  });

  it("lève sur une panne réseau : une indisponibilité n'est pas un « non connecté »", async () => {
    fetchMock.mockRejectedValueOnce(new Error("ECONNRESET"));
    await expect(
      ensureFreshAccessToken({ descriptor: google, row: almostExpired() })
    ).rejects.toThrow(/indisponible/);
    expect(store.markConnectionRevoked).not.toHaveBeenCalled();
  });

  it("signale une connexion révoquée plutôt qu'un jeton vide", async () => {
    // `markConnectionRevoked` remplace la valeur chiffrée par une chaîne vide,
    // et un coffre incohérent déchiffre en vide : dans les deux cas la ligne
    // doit être dite révoquée, jamais utilisée comme bearer.
    store.readAccessToken.mockReturnValue(null);
    const outcome = await ensureFreshAccessToken({
      descriptor: google,
      row: rowOf({ accessToken: "" }),
    });
    expect(outcome.revoked).toBe(true);
    expect(outcome.accessToken).toBeNull();
  });
});

describe("createIntegrationSecretResolver", () => {
  it("ignore tout ce qui n'est pas un secret d'autorisation", async () => {
    const resolver = createIntegrationSecretResolver({ userId: "user-1" });
    expect(
      await resolver({ key: "google.access_token", kind: "env" })
    ).toBeUndefined();
    expect(await resolver({ key: "INCONNU", kind: "auth" })).toBeUndefined();
    expect(
      await resolver({ key: "notion.access_token", kind: "auth" })
    ).toBeUndefined();
  });

  it("délivre le porteur d'accès et les portées, jamais le refresh_token", async () => {
    store.getPrimaryConnection.mockResolvedValue(rowOf());
    const resolver = createIntegrationSecretResolver({ userId: "user-1" });
    expect(await resolver({ key: "google.access_token", kind: "auth" })).toBe(
      "jeton-deja-valide"
    );
    expect(await resolver({ key: "google.scopes", kind: "auth" })).toContain(
      GOOGLE_SCOPES.mailSend
    );
    // Un outil qui mettrait la main là-dessus pourrait s'affranchir du
    // consentement : la demande est refusée, pas ignorée.
    await expect(
      resolver({ key: "google.refresh_token", kind: "auth" })
    ).rejects.toThrow(/jamais expos/i);
  });

  it("rend undefined — et non une exception — quand aucun compte n'est connecté", async () => {
    store.getPrimaryConnection.mockResolvedValue(null);
    // Le plugin rendra un conseil : c'est exactement ce qu'un échec permanent
    // doit produire, l'Agent ne rejouera pas le tour.
    expect(
      await accessTokenForProvider({ provider: "google", userId: "user-1" })
    ).toEqual({ accessToken: null, revoked: false, scopes: "" });
    const resolver = createIntegrationSecretResolver({ userId: "user-1" });
    expect(
      await resolver({ key: "google.access_token", kind: "auth" })
    ).toBeUndefined();
  });

  it("refuse de fonctionner sans coffre configuré", async () => {
    delete process.env.MCP_ENCRYPTION_KEY;
    const resolver = createIntegrationSecretResolver({ userId: "user-1" });
    await expect(
      resolver({ key: "google.access_token", kind: "auth" })
    ).rejects.toThrow(/Coffre non configur/);
  });
});
