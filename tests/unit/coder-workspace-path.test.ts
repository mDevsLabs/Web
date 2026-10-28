import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  isPathInsideRoot,
  resolveWorkspacePath,
} from "../../apps/coder/main-src/workspace.js";

describe("Coder — confinement des chemins du workspace", () => {
  let root = "";
  let outside = "";

  beforeAll(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "mai-ws-"));
    outside = fs.mkdtempSync(path.join(os.tmpdir(), "mai-outside-"));
    fs.mkdirSync(path.join(root, "captures"), { recursive: true });
  });

  afterAll(() => {
    fs.rmSync(root, { force: true, recursive: true });
    fs.rmSync(outside, { force: true, recursive: true });
  });

  it("accepte un chemin relatif à l'intérieur du workspace", () => {
    const resolved = resolveWorkspacePath("captures/shot.png", root);
    expect(isPathInsideRoot(resolved, root)).toBe(true);
  });

  it("refuse un traversal hors racine", () => {
    expect(() => resolveWorkspacePath("../evade.png", root)).toThrow();
  });

  it("refuse un chemin absolu hors racine", () => {
    expect(() =>
      resolveWorkspacePath(path.join(outside, "shot.png"), root)
    ).toThrow();
  });

  it("ne confond pas un préfixe de chaîne avec un sous-dossier", () => {
    expect(isPathInsideRoot(`${root}-evil/shot.png`, root)).toBe(false);
    expect(isPathInsideRoot(path.join(root, "captures"), root)).toBe(true);
  });

  it("refuse un lien symbolique qui sort de la racine", () => {
    const link = path.join(root, "lien-evasif");
    try {
      fs.symlinkSync(outside, link, "dir");
    } catch {
      // Windows sans privilège de création de liens : cas non exécutable.
      return;
    }
    expect(() => resolveWorkspacePath("lien-evasif/shot.png", root)).toThrow();
  });

  it("le handler screenshot ne résout plus le chemin utilisateur avec process.cwd()", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "apps/coder/main-src/browser/playwrightTool.ts"),
      "utf8"
    );
    expect(source).toContain("resolveWorkspacePath(userPath");
    expect(source).not.toContain(
      "path.resolve(ctx.workspaceRoot ?? process.cwd(), userPath)"
    );
  });
});
