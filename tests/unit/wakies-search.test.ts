import { describe, expect, it } from "vitest";
import {
  WAKIES_SEARCH_LIMIT_PER_TYPE,
  WAKIES_SEARCH_MIN_LENGTH,
} from "@/lib/wakies/queries/search";

/**
 * La recherche Wakies — le CONTRAT de surface.
 *
 * Ces tests ne touchent pas la base : ils verrouillent ce que la recherche
 * promet (bornes, vocabulaire), pas la façon dont PostgreSQL répond. Le
 * comportement SQL est couvert par les tests de routes.
 */

describe("bornes de la recherche Wakies", () => {
  it("exige deux caractères", () => {
    // En dessous, le résultat ne serait pas une recherche : c'est le même
    // seuil que l'annuaire.
    expect(WAKIES_SEARCH_MIN_LENGTH).toBe(2);
  });

  it("borne le nombre de résultats par type", () => {
    // La borne porte sur les RÉSULTATS, pas sur les lignes candidates :
    // c'est la différence entre une recherche qui balaie un historique et
    // une recherche qui le parcourt.
    expect(WAKIES_SEARCH_LIMIT_PER_TYPE).toBeGreaterThan(0);
    expect(WAKIES_SEARCH_LIMIT_PER_TYPE).toBeLessThanOrEqual(20);
  });
});

describe("le rail ne reconstruit plus la recherche", () => {
  it("ne filtre plus les résultats côté navigateur", async () => {
    const { readFileSync } = await import("node:fs");
    const source = readFileSync(
      "components/wakies/WorkspaceSidebar.tsx",
      "utf8"
    );
    // Le rail AFFICHE les résultats du serveur. S'il les filtrait
    // lui-même, il pourrait montrer un résultat que la base ne contient
    // pas — et il le faisait, pour les pages.
    expect(source).not.toContain('.toLocaleLowerCase("fr")');
  });

  it("ne va plus chercher les pages Espace par Espace", async () => {
    const { readFileSync } = await import("node:fs");
    const source = readFileSync("components/wakies/workspace-app.tsx", "utf8");
    // L'ancienne recherche faisait une requête par Espace, à chaque
    // frappe. Elle est remplacée par une requête unique. Le motif est
    // reconstruit à l'exécution pour ne pas être lu comme un gabarit.
    const motifAncien = ["/spaces/", "$", "{space.id}/pages"].join("");
    expect(source).not.toContain(motifAncien);
  });
});
