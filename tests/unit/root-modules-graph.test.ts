import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Hygiène des modules racine vs scripts (Issue #16)", () => {
  const rootDir = process.cwd();

  it("ne doit plus contenir de scripts CLI orphelins (admin*.ts) à la racine", () => {
    const rootAdminFiles = ["admin.ts", "admin-email.ts", "admin-models.ts"];
    for (const file of rootAdminFiles) {
      expect(
        fs.existsSync(path.join(rootDir, file)),
        `Le fichier orphelin ${file} ne doit plus exister à la racine (déplacé dans scripts/)`
      ).toBe(false);
    }
  });

  it("doit conserver les modules racine indispensables à Val Town (main.ts et cron)", () => {
    const valTownFiles = [
      "main.ts",
      "config.ts",
      "auth.ts",
      "email.ts",
      "models.ts",
      "cron.ts",
      "models-cron.ts",
      "updateModels.ts",
    ];
    for (const file of valTownFiles) {
      expect(
        fs.existsSync(path.join(rootDir, file)),
        `Le module backend Val Town ${file} doit être présent à la racine`
      ).toBe(true);
    }
  });

  it("doit conserver les scripts admin sous scripts/", () => {
    const scriptFiles = [
      "scripts/admin.ts",
      "scripts/admin-email.ts",
      "scripts/admin-models.ts",
    ];
    for (const file of scriptFiles) {
      expect(
        fs.existsSync(path.join(rootDir, file)),
        `Le script ${file} doit être présent dans scripts/`
      ).toBe(true);
    }
  });
});
