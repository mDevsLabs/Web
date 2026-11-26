import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function lire(relatif: string): string {
  return readFileSync(resolve(import.meta.dirname, "../..", relatif), "utf8");
}

describe("navigation et vue Espace Wakies", () => {
  it("retire le bouton Travail du menu WorkspaceNavigation tout en conservant les autres vues", () => {
    const nav = lire("components/wakies/WorkspaceNavigation.tsx");
    expect(nav).not.toContain('label: "Travail"');
    expect(nav).not.toContain('id: "space", label:');
    for (const libelle of [
      "Messages",
      "Amis",
      "Mon profil",
      "Activité",
      "Objectifs",
      "Aujourd’hui",
      "Mémoires",
    ]) {
      expect(nav).toContain(`label: "${libelle}"`);
    }
  });

  it("sécurise la vue Espace contre l'absence d'Espace et les réglages de page corrompus", () => {
    const app = lire("components/wakies/workspace-app.tsx");
    expect(app).toContain("espaceSelectionne ?");
    expect(app).toContain("Aucun Espace pour l’instant");
    expect(app).toContain("openPage(espaceSelectionne.id, id)");

    const topbar = lire("components/wakies/WorkspaceTopbar.tsx");
    expect(topbar).toMatch(/workspace\.spaces\[0\]\?\.name\s*\?\?\s*"Espaces"/);

    const library = lire("components/wakies/SpaceLibrary.tsx");
    expect(library).toContain("pageSettings.safeParse");
    expect(library).not.toContain("pageSettings.parse(");
  });
});
