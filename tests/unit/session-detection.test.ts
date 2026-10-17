import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// La détection de session est le point de bascule de toute l'application :
// un utilisateur_connecté mais non détecté se retrouve dans une coquille vide
// (historique inaccessible, API en 401, aucun moyen de se déconnecter), et un
// utilisateur non connecté mais détecté le serait.
//
// Trois voies de validation existent, par ordre de coût croissant :
//  1. cache mémoire (positif ET négatif) ;
//  2. signature HS256 locale — un chemin RAPIDE, pas une autorité ;
//  3. l'API distante, qui a émis le jeton : seule arbitre d'un refus local.
//
// Le cas 2 échoue silencieusement quand MAI_JWT_SECRET (local) diffère de celui
// du backend déployé — c'est le bug qui rendait l'application inutilisable en
// dev. La session doit alors être résolue par le backend, jamais par les
// claims d'un jeton dont la signature n'a pas été vérifiée.

const LOCAL_SECRET = "local-secret-for-tests";
const BACKEND_SECRET = "backend-secret-for-tests";
const TOKEN = "header.payload.signature";

const cookieValue = { current: TOKEN as string | undefined };
const fetchMock = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) =>
      name === "mai_session_token" && cookieValue.current !== undefined
        ? { value: cookieValue.current }
        : undefined,
  })),
}));

function signJwt(claims: Record<string, unknown>, secret: string) {
  const b64url = (value: string) =>
    Buffer.from(value)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/[=]+$/, "");
  const head = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(JSON.stringify(claims));
  const data = `${head}.${body}`;
  const signature = createHmac("sha256", secret)
    .update(data)
    .digest("base64url");
  return `${data}.${signature}`;
}

function claims(overrides: Record<string, unknown> = {}) {
  return {
    email: "user@example.com",
    exp: Math.floor(Date.now() / 1000) + 3600,
    id: "u-1",
    tier: "Free",
    username: "user",
    ...overrides,
  };
}

function remoteUser(overrides: Record<string, unknown> = {}) {
  return {
    avatarUrl: null,
    email: "user@example.com",
    id: "u-1",
    limit: 500_000,
    phone: "",
    tier: "Free",
    tokensUsed: 12,
    username: "user",
    weekStart: "2026-09-21",
    ...overrides,
  };
}

// `getMaiUser` mémoïse le secret ET le cache de session : chaque cas repart
// d'une instance fraîche du module.
async function loadSession(env: Record<string, string | undefined>) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) {
    // `process.env.X = undefined` range la chaîne "undefined" : il faut
    // vraiment supprimer la variable pour simpler son absence.
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  return await import("@/lib/auth/session");
}

function okResponse(body: unknown) {
  return { json: async () => body, ok: true } as unknown as Response;
}

function errorResponse(status = 401) {
  return {
    json: async () => ({ error: "Non authentifié." }),
    ok: false,
    status,
  } as unknown as Response;
}

const BASE_ENV = {
  MAI_JWT_AUDIENCE: undefined,
  MAI_JWT_ISSUER: undefined,
  MAI_JWT_SECRET: LOCAL_SECRET,
  // `lib/constants.ts` lit l'URL du backend dans NEXT_PUBLIC_MAI_API_URL.
  NEXT_PUBLIC_MAI_API_URL: "https://mai.test",
};

// Délai porté : chaque cas recharge le module via `vi.resetModules()` suivi d'un
// `import()` dynamique de `lib/auth/session`, qui tire `jose`, la base et les
// constantes. Hors de ce fichier, ce chargement prend quelques dizaines de
// millisecondes ; sous la charge parallèle de la suite complète (85 workers),
// il dépasse le délai par défaut de 5 s et le test échoue sans que rien de
// fonctionnel n'ait changé. On rend le budget explicite plutôt que de laisser
// un échec intermittent que l'on prendra pour une régression.
describe("getMaiUser — détection de session", { timeout: 20_000 }, () => {
  const savedEnv = { ...process.env };
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    cookieValue.current = TOKEN;
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(okResponse(remoteUser()));
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    warn.mockRestore();
    process.env = { ...savedEnv };
  });

  it("valide localement un jeton signé et n'interroge pas le backend", async () => {
    const { getMaiUser } = await loadSession(BASE_ENV);
    cookieValue.current = signJwt(claims({ tier: "Plus" }), LOCAL_SECRET);

    const user = await getMaiUser();

    expect(user?.email).toBe("user@example.com");
    expect(user?.tier).toBe("Plus");
    // Le rafraîchissement d'usage part en tâche de fond : c'est le seul appel
    // attendu, et il ne doit pas faire échouer la résolution.
    expect(
      fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/usage"))
    ).toHaveLength(1);
  });

  it("résout la session via le backend quand la clé locale diverge", async () => {
    // Le bug dev : jeton émis par le backend, MAI_JWT_SECRET local différent.
    const { getMaiUser } = await loadSession(BASE_ENV);
    cookieValue.current = signJwt(claims({ tier: "Max" }), BACKEND_SECRET);
    fetchMock.mockResolvedValue(okResponse(remoteUser({ tier: "Free" })));

    const user = await getMaiUser();

    expect(user?.tier).toBe("Free");
    // Le tier vient du backend, jamais des claims non vérifiés du jeton.
    expect(user?.tier).not.toBe("Max");
  });

  it("n'emprunte aucun champ au payload quand la signature est refusée", async () => {
    const { getMaiUser } = await loadSession(BASE_ENV);
    // Un jeton forgé qui prétend être « Max » : le backend répond sur SON
    // identité, l'identifiant retourné doit venir de /usage.
    cookieValue.current = signJwt(
      claims({ id: "forged-id", tier: "Max", username: "forged" }),
      "signature-bidon"
    );
    fetchMock.mockResolvedValue(okResponse(remoteUser()));

    const user = await getMaiUser();

    expect(user?.id).toBe("u-1");
    expect(user?.username).toBe("user");
    expect(user?.tier).toBe("Free");
  });

  it("délègue à l'API distante quand aucun secret local n'est configuré", async () => {
    const { getMaiUser } = await loadSession({
      ...BASE_ENV,
      MAI_JWT_SECRET: undefined,
    });
    cookieValue.current = signJwt(claims({ tier: "Max" }), BACKEND_SECRET);

    const user = await getMaiUser();

    expect(user?.tier).toBe("Free");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://mai.test/usage",
      expect.objectContaining({
        headers: { Authorization: `Bearer ${cookieValue.current}` },
      })
    );
  });

  it("refuse un jeton que le backend refuse, et mémorise le refus", async () => {
    const { getMaiUser } = await loadSession(BASE_ENV);
    cookieValue.current = signJwt(claims(), BACKEND_SECRET);
    fetchMock.mockResolvedValue(errorResponse());

    expect(await getMaiUser()).toBeNull();
    const callsAfterFirst = fetchMock.mock.calls.length;

    // Cache négatif : le backend n'est pas réinterrogé à chaque requête.
    expect(await getMaiUser()).toBeNull();
    expect(fetchMock.mock.calls).toHaveLength(callsAfterFirst);
  });

  it("ne mémorise PAS une panne réseau comme un refus", async () => {
    const { getMaiUser } = await loadSession(BASE_ENV);
    cookieValue.current = signJwt(claims(), BACKEND_SECRET);
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await getMaiUser()).toBeNull();

    // Le réseau revient : la session doit être reconnue sans attendre.
    fetchMock.mockResolvedValue(okResponse(remoteUser()));
    expect((await getMaiUser())?.email).toBe("user@example.com");
  });

  it("refuse un jeton expiré, le backend tranchant le refus", async () => {
    const { getMaiUser } = await loadSession(BASE_ENV);
    cookieValue.current = signJwt(
      claims({ exp: Math.floor(Date.now() / 1000) - 60 }),
      LOCAL_SECRET
    );
    fetchMock.mockResolvedValue(errorResponse());

    expect(await getMaiUser()).toBeNull();
    expect(
      fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/usage"))
    ).toHaveLength(1);
  });

  it("ne renvoie aucun utilisateur sans cookie", async () => {
    const { getMaiUser } = await loadSession(BASE_ENV);
    cookieValue.current = undefined;

    expect(await getMaiUser()).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("trace le motif du repli distant en développement", async () => {
    const { getMaiUser } = await loadSession(BASE_ENV);
    cookieValue.current = signJwt(claims(), BACKEND_SECRET);

    await getMaiUser();

    const messages = warn.mock.calls.map((call: unknown[]) => String(call[0]));
    expect(
      messages.some(
        (message: string) =>
          message.includes("[auth]") && message.includes("API distante")
      )
    ).toBe(true);
    // Jamais de jeton complet dans les journaux.
    expect(messages.join(" ")).not.toContain(cookieValue.current as string);
  });
});
