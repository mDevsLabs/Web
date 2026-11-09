// Issue #28 — aucun installeur ne s'ouvre sans contrôle d'intégrité.
//
// Les tests manipulent des fichiers temporaires et un fetch simulé : aucun
// installeur réel n'est téléchargé ni exécuté, et `shell.openPath` est
// remplacé par une sentinelle.
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { app, shell } from "electron";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  downloadAndInstallUpdate,
  getPendingUpdate,
  INSTALLER_MANIFEST_NAME,
  isAllowedInstallerUrl,
  isManagedInstallerPath,
  isSafeFileName,
  type PendingUpdate,
  parseInstallerManifest,
  registerPendingUpdate,
} from "../../apps/desktop/src/updater";

const CONTENT = Buffer.from("contenu-de-faux-installeur");

function sha256Of(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function stubFetchWith(buffer: Buffer) {
  return vi.fn(async () => ({
    body: {
      getReader: () => {
        let sent = false;
        return {
          read: async () => {
            if (sent) return { done: true, value: undefined };
            sent = true;
            return { done: false, value: new Uint8Array(buffer) };
          },
        };
      },
    },
    headers: {
      get: (name: string) =>
        name === "content-length" ? String(buffer.length) : null,
    },
    ok: true,
    status: 200,
    statusText: "OK",
  }));
}

let tempDir: string | null = null;

function downloadsDir(): string {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "mai-installeur-test-"));
  vi.spyOn(app, "getPath").mockReturnValue(tempDir);
  return tempDir;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (tempDir) {
    fs.rmSync(tempDir, { force: true, recursive: true });
    tempDir = null;
  }
});

describe("allowlist d'URL et basename (issue #28)", () => {
  it("n'accepte que HTTPS vers les hôtes GitHub autorisés", () => {
    expect(
      isAllowedInstallerUrl(
        "https://github.com/mDevsLabs/Web/releases/download/tag/setup.exe"
      )
    ).toBe(true);
    expect(
      isAllowedInstallerUrl(
        "https://objects.githubusercontent.com/github-production-release-asset/setup.exe"
      )
    ).toBe(true);
    expect(
      isAllowedInstallerUrl(
        "http://github.com/mDevsLabs/Web/releases/download/tag/setup.exe"
      )
    ).toBe(false);
    expect(isAllowedInstallerUrl("https://evil.example.com/setup.exe")).toBe(
      false
    );
    expect(isAllowedInstallerUrl("file:///etc/passwd")).toBe(false);
    expect(isAllowedInstallerUrl("pas-une-url")).toBe(false);
  });

  it("refuse un nom de fichier avec séparateur ou chemin relatif", () => {
    expect(isSafeFileName("mAI-0.9.3-win-x64-setup.exe")).toBe(true);
    expect(isSafeFileName("../evil.exe")).toBe(false);
    expect(isSafeFileName("a/b.exe")).toBe(false);
    expect(isSafeFileName("a\\b.exe")).toBe(false);
    expect(isSafeFileName("..")).toBe(false);
    expect(isSafeFileName("")).toBe(false);
    expect(isSafeFileName("nul\0octet.exe")).toBe(false);
  });
});

describe("manifeste d'intégrité", () => {
  it("analyse les entrées valides et ignore les autres", () => {
    const manifest = parseInstallerManifest(
      JSON.stringify({
        files: [
          { name: "setup.exe", sha256: "a".repeat(64), size: 120 },
          { name: "../escape.exe", sha256: "b".repeat(64), size: 120 },
          { name: "court.exe", sha256: "pas-un-hash", size: 120 },
          { name: "sans-taille.exe", sha256: "c".repeat(64) },
          "n'importe-quoi",
        ],
      })
    );
    expect([...manifest.keys()]).toEqual(["setup.exe"]);
    expect(parseInstallerManifest("{json invalide").size).toBe(0);
    expect(parseInstallerManifest("{}").size).toBe(0);
    expect(INSTALLER_MANIFEST_NAME).toBe("installer-manifest.json");
  });
});

describe("registre des mises à jour", () => {
  it("ne renvoie la cible qu'à l'identifiant opaque délivré", () => {
    const pending: PendingUpdate = {
      fileName: "setup.exe",
      sha256: sha256Of(CONTENT),
      size: CONTENT.length,
      url: "https://github.com/mDevsLabs/Web/releases/download/tag/setup.exe",
    };
    const updateId = registerPendingUpdate(pending);
    expect(updateId).not.toContain("http");
    expect(getPendingUpdate(updateId)).toEqual(pending);
    expect(getPendingUpdate("identifiant-inconnu")).toBeNull();
  });
});

describe("téléchargement et ouverture d'installateur", () => {
  function makeTarget(overrides: Partial<PendingUpdate> = {}): PendingUpdate {
    return {
      fileName: "setup.exe",
      sha256: sha256Of(CONTENT),
      size: CONTENT.length,
      url: "https://github.com/mDevsLabs/Web/releases/download/tag/setup.exe",
      ...overrides,
    };
  }

  it("ouvre l'installateur quand taille et empreinte correspondent", async () => {
    downloadsDir();
    const openPath = vi
      .spyOn(shell, "openPath")
      .mockImplementation(async () => "");
    vi.stubGlobal("fetch", stubFetchWith(CONTENT));

    const res = await downloadAndInstallUpdate(makeTarget(), () => {});
    expect(res.success).toBe(true);
    expect(openPath).toHaveBeenCalledTimes(1);
    expect(isManagedInstallerPath(res.filePath ?? "")).toBe(true);
  });

  it("n'ouvre JAMAIS un installateur dont l'empreinte ne correspond pas", async () => {
    const dir = downloadsDir();
    const openPath = vi
      .spyOn(shell, "openPath")
      .mockImplementation(async () => "");
    vi.stubGlobal("fetch", stubFetchWith(Buffer.from("contenu-falsifie")));

    const res = await downloadAndInstallUpdate(makeTarget(), () => {});
    expect(res.success).toBe(false);
    expect(res.error).toContain("empreinte");
    expect(openPath).not.toHaveBeenCalled();
    // Le fichier écarté n'est pas laissé sur le disque.
    expect(fs.readdirSync(dir)).toEqual([]);
  });

  it("refuse une taille qui ne correspond pas au manifeste", async () => {
    downloadsDir();
    const openPath = vi
      .spyOn(shell, "openPath")
      .mockImplementation(async () => "");
    vi.stubGlobal("fetch", stubFetchWith(CONTENT));

    const res = await downloadAndInstallUpdate(
      makeTarget({ size: CONTENT.length + 1 }),
      () => {}
    );
    expect(res.success).toBe(false);
    expect(openPath).not.toHaveBeenCalled();
  });

  it("refuse une URL hors allowlist ou un nom de fichier à chemin", async () => {
    downloadsDir();
    const openPath = vi
      .spyOn(shell, "openPath")
      .mockImplementation(async () => "");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const horsAllowlist = await downloadAndInstallUpdate(
      makeTarget({ url: "https://evil.example.com/setup.exe" }),
      () => {}
    );
    expect(horsAllowlist.success).toBe(false);
    expect(horsAllowlist.error).toContain("refusée");

    const cheminInterdit = await downloadAndInstallUpdate(
      makeTarget({ fileName: "../evil.exe" }),
      () => {}
    );
    expect(cheminInterdit.success).toBe(false);
    expect(cheminInterdit.error).toContain("refusé");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(openPath).not.toHaveBeenCalled();
  });

  it("signale une échec de shell.openPath au lieu de l'ignorer", async () => {
    downloadsDir();
    vi.spyOn(shell, "openPath").mockImplementation(
      async () => "permission refusée"
    );
    vi.stubGlobal("fetch", stubFetchWith(CONTENT));

    const res = await downloadAndInstallUpdate(makeTarget(), () => {});
    expect(res.success).toBe(false);
    expect(res.error).toContain("permission refusée");
  });
});
