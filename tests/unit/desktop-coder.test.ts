// Le lancement utilise le runtime complet ; aucun binaire réel ne démarre ici.
import { EventEmitter } from "node:events";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  exists: false,
  marker: "",
  spawn: vi.fn(),
  writes: [] as unknown[][],
}));
vi.mock("node:fs", () => ({
  existsSync: () => mocks.exists,
  readFileSync: () => mocks.marker,
  unlinkSync: vi.fn(),
  writeFileSync: (...args: unknown[]) => mocks.writes.push(args),
}));
// `launchCoder` part du home de l'utilisateur : le mock doit exposer `getPath`,
// sinon le test échoue sur le double Electron et non sur le lanceur.
vi.mock("electron", () => ({
  app: {
    getPath: () => "C:/Users/test",
    getVersion: () => "0.9.2",
    isPackaged: false,
  },
}));
vi.mock("node:child_process", () => ({ spawn: mocks.spawn }));

// Charger au runtime pour garder le typecheck Web indépendant des types Electron.
const { launchCoder } = await vi.importActual<{
  launchCoder: (opts?: {
    workspacePath?: string;
    sessionToken?: string;
  }) => Promise<{ success: boolean; error?: string }>;
}>("../../apps/desktop/src/coder-launcher");

/**
 * Un jeton de session RÉELLEMENT exploitable.
 *
 * Le lanceur refuse un jeton qui n'est pas un JWT porteur d'une identité
 * (`isUsableSessionToken`) : sans cela, Coder afficherait le dernier compte
 * local — un compte qui ne correspond pas à la session de mAI Desktop. Un
 * jeton de forme `a.b.c` ne suffirait donc pas au test.
 */
function jetonSession(): string {
  const encoder = (valeur: unknown) =>
    Buffer.from(JSON.stringify(valeur), "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/[=]+$/, "");
  return `${encoder({ alg: "HS256", typ: "JWT" })}.${encoder({
    email: "test@mai.fr",
    exp: Math.floor(Date.now() / 1000) + 3600,
  })}.signature`;
}

function spawnOk() {
  const child = Object.assign(new EventEmitter(), { unref: vi.fn() });
  mocks.spawn.mockImplementation(() => {
    queueMicrotask(() => child.emit("spawn"));
    return child;
  });
  return child;
}

describe("Coder embarqué dans mAI Desktop", () => {
  beforeEach(() => {
    mocks.exists = false;
    mocks.marker = "";
    mocks.spawn.mockReset();
    mocks.writes = [];
  });

  it("signale un paquet incomplet sans ouvrir une fausse fenêtre d’éditeur", async () => {
    const result = await launchCoder();
    expect(result.success).toBe(false);
    expect(result.error).toContain("absent du paquet");
    expect(mocks.spawn).not.toHaveBeenCalled();
  });

  it("refuse un paquet sans marqueur de version", async () => {
    mocks.exists = true;
    const result = await launchCoder({ sessionToken: jetonSession() });
    expect(result.success).toBe(false);
    expect(result.error).toContain("marqueur de version absent");
    expect(mocks.spawn).not.toHaveBeenCalled();
  });

  it("lance Coder avec son espace comme argument, sans shell", async () => {
    mocks.exists = true;
    mocks.marker = JSON.stringify({ version: "0.9.2" });
    const child = spawnOk();
    const result = await launchCoder({
      sessionToken: jetonSession(),
      workspacePath: "C:/Un projet/espace & test",
    });
    expect(result.success).toBe(true);
    expect(mocks.spawn).toHaveBeenCalledWith(
      expect.any(String),
      [
        "--workspace=C:/Un projet/espace & test",
        expect.stringMatching(/^--mai-session-token-file=/),
      ],
      expect.objectContaining({
        detached: true,
        env: expect.objectContaining({
          MAI_CODER_EMBEDDED: "1",
          MAI_CODER_LOAD_DIST: "1",
        }),
        stdio: "ignore",
      })
    );
    expect(mocks.spawn.mock.calls[0][2].shell).toBeUndefined();
    expect(child.unref).toHaveBeenCalledOnce();
  });

  it("transmet le jeton par fichier éphémère, jamais dans les arguments", async () => {
    mocks.exists = true;
    mocks.marker = JSON.stringify({ version: "0.9.2" });
    spawnOk();
    const token = jetonSession();
    expect(await launchCoder({ sessionToken: token })).toEqual({
      success: true,
    });
    const args = mocks.spawn.mock.calls[0][2];
    expect(args.env.MAI_SESSION_TOKEN).toBe(token);
    const argv = mocks.spawn.mock.calls[0][1] as string[];
    expect(argv).toHaveLength(1);
    expect(argv[0]).toMatch(/^--mai-session-token-file=/);
    expect(JSON.stringify(argv)).not.toContain(token);
    expect(mocks.writes).toHaveLength(1);
    expect(mocks.writes[0][1]).toBe(token);
    expect(mocks.writes[0][2]).toEqual(
      expect.objectContaining({ mode: 0o600 })
    );
  });

  it("refuse de lancer Coder sans jeton de session exploitable", async () => {
    // Sans jeton, Coder afficherait le dernier compte local — un compte qui
    // ne correspond pas à la session de mAI Desktop. Le lancement est donc
    // refusé, et aucun jeton n'est transmis.
    mocks.exists = true;
    mocks.marker = JSON.stringify({ version: "0.9.2" });
    spawnOk();
    const result = await launchCoder();
    expect(result.success).toBe(false);
    expect(result.error).toContain("Connectez-vous");
    expect(mocks.spawn).not.toHaveBeenCalled();
  });

  it("refuse un jeton qui n'est pas un JWT porteur d'une identité", async () => {
    mocks.exists = true;
    mocks.marker = JSON.stringify({ version: "0.9.2" });
    spawnOk();
    const result = await launchCoder({
      sessionToken: "header.payload.signature",
    });
    expect(result.success).toBe(false);
    expect(mocks.spawn).not.toHaveBeenCalled();
  });

  it("refuse un Coder embarqué dont la version diverge de mAI Desktop", async () => {
    mocks.exists = true;
    mocks.marker = JSON.stringify({ version: "0.0.1" });
    const result = await launchCoder({ sessionToken: jetonSession() });
    expect(result.success).toBe(false);
    expect(result.error).toContain("ne correspond pas à mAI Desktop");
    expect(mocks.spawn).not.toHaveBeenCalled();
  });

  it("remonte les erreurs du système au bouton de lancement", async () => {
    mocks.exists = true;
    mocks.marker = JSON.stringify({ version: "0.9.2" });
    const child = new EventEmitter();
    mocks.spawn.mockImplementation(() => {
      queueMicrotask(() => child.emit("error", new Error("EACCES")));
      return child;
    });
    expect(await launchCoder({ sessionToken: jetonSession() })).toEqual({
      error: "Impossible de lancer Coder : EACCES",
      success: false,
    });
  });
});
