import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// `.nvmrc` est la source unique de la version Node.js : pnpm, `engines` et
// GitHub Actions doivent s'y aligner, sinon local et CI divergent sans bruit.
const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const pinned = read(".nvmrc").trim();

describe("version Node.js épinglée", () => {
  it(".nvmrc contient une version exacte", () => {
    expect(pinned).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("pnpm exécute les scripts avec la même version", () => {
    expect(read("pnpm-workspace.yaml")).toMatch(
      new RegExp(`^useNodeVersion: ${pinned.replaceAll(".", "\\.")}$`, "m")
    );
  });

  it("engines accepte la version épinglée sur la même majeure", () => {
    const pkg = JSON.parse(read("package.json")) as {
      engines?: { node?: string };
    };
    expect(pkg.engines?.node).toBe(`^${pinned}`);
  });

  it("les workflows lisent .nvmrc au lieu d'une version en dur", () => {
    const dir = ".github/workflows";
    for (const file of readdirSync(join(root, dir))) {
      if (!file.endsWith(".yml")) {
        continue;
      }
      const hardcoded = read(join(dir, file))
        .split("\n")
        .filter((line) => /^\s+node-version:\s*22\b/.test(line));
      expect(hardcoded, file).toEqual([]);
    }
  });
});
