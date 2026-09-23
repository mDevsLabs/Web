import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Garde-fous du correctif « le clic réel sur Agent est avalé » (chat → agent).
//
// Deux défauts d'empilement/hydratation rendaient le sélecteur Chat | Agent
// insensible aux VRAIS clics (les clics programmatiques .click() passaient,
// d'où un bug invisible aux tests automatisés) :
//
// 1. components/chat/messages.tsx : la pile d'accueil (sélecteur + greeting)
//    et le conteneur de messages sont frères en `absolute inset-0`. Le
//    conteneur, rendu APRÈS, peignait au-dessus de la pile d'accueil et
//    recueillait tous les pointeurs. Correctif : la pile d'accueil porte
//    désormais z-10.
// 2. components/chat/artifact.tsx : `useWindowSize` lit window.innerWidth dès
//    le premier rendu client, alors que le serveur rend la branche desktop.
//    Sur viewport < 768 px, la première hydration détachait l'arbre servi et
//    React le régénérait. Correctif : isMobile=false pendant l'hydratation,
//    révélé après montage.

const ROOT = path.resolve(import.meta.dirname, "../..");

function source(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), "utf8");
}

const MESSAGES = "components/chat/messages.tsx";
const ARTIFACT = "components/chat/artifact.tsx";

describe("La pile d'accueil ne doit pas être recouverte par le conteneur de messages", () => {
  it("la pile d'accueil porte un z-index supérieur au conteneur de messages", () => {
    const src = source(MESSAGES);
    // La pile d'accueil : absolute inset-0 + z-10 + pointer-events-none.
    expect(src).toContain(
      '"pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-y-auto p-4"'
    );
    // Le conteneur de messages reste sans z-index (frère suivant, z auto) :
    // sa présence est vérifiée pour documenter le rapport d'empilement.
    expect(src).toContain(
      '"absolute inset-0 touch-pan-y overflow-y-auto overscroll-contain"'
    );
  });

  it("la zone cliquable du sélecteur reste active (pointer-events-auto)", () => {
    const src = source(MESSAGES);
    // Le parent est pointer-events-none ; seul le wrapper du sélecteur
    // réactive les pointeurs. Le greeting reste volontairement non cliquable.
    expect(src).toContain("pointer-events-auto mb-8");
    expect(src).toContain("<Greeting />");
  });
});

describe("Artifact : hydratation identique au rendu serveur", () => {
  it("isMobile est neutralisé pendant l'hydratation (révélé après montage)", () => {
    const src = source(ARTIFACT);
    // L'état de connaissance du viewport démarre à false (rendu serveur = rendu
    // client n°1), et n'est levé que dans un useEffect de montage.
    expect(src).toContain("useState(false)");
    expect(src).toMatch(/setIsViewportKnown\(true\);\s*\n\s*\}, \[\]\);/);
    // La valeur dérivée exige la connaissance du viewport AVANT de comparer.
    expect(src).toContain("isViewportKnown && windowWidth");
  });

  it("aucune lecture directe de windowWidth pour le branchement mobile", () => {
    const src = source(ARTIFACT);
    // Garde-fou : la comparaison brute `windowWidth < 768` sans garde
    // isViewportKnown réintroduirait le bug d'hydratation.
    expect(src).not.toMatch(/const isMobile = windowWidth/);
  });
});
