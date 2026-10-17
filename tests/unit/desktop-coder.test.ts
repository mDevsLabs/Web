// Le lancement utilise le runtime complet ; aucun binaire réel ne démarre ici.
import { EventEmitter } from "node:events";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ exists: false, spawn: vi.fn() }));
vi.mock("node:fs", () => ({ existsSync: () => mocks.exists }));
vi.mock("electron", () => ({ app: { isPackaged: false } }));
vi.mock("node:child_process", () => ({ spawn: mocks.spawn }));

// Charger au runtime pour garder le typecheck Web indépendant des types Electron.
const { launchCoder } = await vi.importActual<{
  launchCoder: (opts?: {
    workspacePath?: string;
  }) => Promise<{ success: boolean; error?: string }>;
}>("../../apps/desktop/src/coder-launcher");

describe("Coder embarqué dans mAI Desktop", () => {
  beforeEach(() => {
    mocks.exists = false;
    mocks.spawn.mockReset();
  });
  it("signale un paquet incomplet sans ouvrir une fausse fenêtre d’éditeur", async () => {
    const result = await launchCoder();
    expect(result.success).toBe(false);
    expect(result.error).toContain("absent du paquet");
    expect(mocks.spawn).not.toHaveBeenCalled();
  });
  it("lance Coder avec son espace comme argument unique, sans shell", async () => {
    mocks.exists = true;
    const child = Object.assign(new EventEmitter(), { unref: vi.fn() });
    mocks.spawn.mockImplementation(() => {
      queueMicrotask(() => child.emit("spawn"));
      return child;
    });
    const result = await launchCoder({
      workspacePath: "C:/Un projet/espace & test",
    });
    expect(result.success).toBe(true);
    expect(mocks.spawn).toHaveBeenCalledWith(
      expect.any(String),
      ["--workspace=C:/Un projet/espace & test"],
      expect.objectContaining({
        detached: true,
        env: expect.objectContaining({ MAI_CODER_LOAD_DIST: "1" }),
        stdio: "ignore",
      })
    );
    expect(mocks.spawn.mock.calls[0][2].shell).toBeUndefined();
    expect(child.unref).toHaveBeenCalledOnce();
  });
  it("remonte les erreurs du système au bouton de lancement", async () => {
    mocks.exists = true;
    const child = new EventEmitter();
    mocks.spawn.mockImplementation(() => {
      queueMicrotask(() => child.emit("error", new Error("EACCES")));
      return child;
    });
    expect(await launchCoder()).toEqual({
      error: "Impossible de lancer Coder : EACCES",
      success: false,
    });
  });
});
