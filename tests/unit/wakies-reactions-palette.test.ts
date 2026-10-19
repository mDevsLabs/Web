// La barre de réaction et la validation serveur doivent lire la MÊME palette.
// Deux listes avaient divergé : l'interface proposait 👎/🤔/✅/❌ que la route
// refusait avec « Émoji hors palette ». Ce test garde l'unique source.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  estReactionValide,
  PALETTE_REACTIONS,
} from "@/lib/wakies/shared/reactions";

describe("palette de réactions Wakies", () => {
  it("accepte chaque émoji qu'elle propose", () => {
    for (const emoji of PALETTE_REACTIONS) {
      expect(estReactionValide(emoji)).toBe(true);
    }
  });

  it("refuse un émoji hors palette, y compris les anciens doublons de l'interface", () => {
    for (const emoji of ["👎", "🤔", "🙏", "🎉", "✅", "❌", "🫶", ""]) {
      expect(estReactionValide(emoji)).toBe(false);
    }
  });

  it("n'a qu'un seul exemplaire de la palette dans le code", () => {
    const source = readFileSync("components/wakies/ChatTranscript.tsx", "utf8");
    // Le composant LIT la palette partagée et ne la redéfinit plus.
    expect(source).toContain(
      'import { PALETTE_REACTIONS } from "@/lib/wakies/shared/reactions"'
    );
    expect(source).not.toContain("PALETTE_REACTIONS_UI");
    expect(source).not.toMatch(/const PALETTE_REACTIONS\s*=/);
  });

  it("l'outil du modèle décrit exactement la palette validée", () => {
    const source = readFileSync("lib/wakies/tools.ts", "utf8");
    expect(source).toContain(
      'import { PALETTE_REACTIONS } from "./shared/reactions"'
    );
    expect(source).not.toMatch(/const PALETTE_REACTIONS\s*=/);
  });
});
