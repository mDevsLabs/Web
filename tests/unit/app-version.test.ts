import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { APP_VERSION } from "@/lib/constants";
import { APP_VERSION as VERSION_SSOT } from "@/lib/version";

// La version affichée dans le menu utilisateur (sous-menu Support) et dans le
// pied de page venait d'une constante recopiée dans lib/constants.ts, figée à
// 0.5.5 pendant plusieurs versions. Ces tests ferment la porte : plus aucune
// version en dur dans le code, et une seule valeur exposée — celle de
// package.json.
describe("Version applicative", () => {
  const root = path.resolve(import.meta.dirname, "..", "..");
  // `lib/version.ts` est la SEULE définition autorisée. `lib/constants.ts` se
  // contente de la réexporter : c'est là que la constante vivait.
  const definitionSites = ["lib/constants.ts", "lib/version.ts"];

  it("expose la version de package.json, et rien d'autre", () => {
    expect(VERSION_SSOT).toBe(APP_VERSION);
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+(?:[-+].*)?$/);
  });

  it("ne redéclare plus APP_VERSION en dur", () => {
    const offenders = definitionSites.filter((file) =>
      /APP_VERSION\s*(?::[^=]+)?=\s*["'`]/.test(
        readFileSync(path.join(root, file), "utf8")
      )
    );
    // Toute affectation littérale est une divergence possible : seule la
    // lecture de package.json (lib/version.ts) est acceptable.
    expect(offenders).toEqual([]);
  });

  it("ne présente qu'une seule définition de APP_VERSION dans lib", () => {
    const definitions = definitionSites.filter((file) =>
      /export\s+(?:const|function|let)\s+APP_VERSION\b/.test(
        readFileSync(path.join(root, file), "utf8")
      )
    );
    expect(definitions).toEqual(["lib/version.ts"]);
  });
});
