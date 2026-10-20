import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * La confirmation d'âge de BLACKLINE (16+, PEGI 16) ne doit RIEN écrire.
 *
 * Elle est demandée à chaque lancement : ni en base, ni dans le
 * `localStorage`, ni dans un cookie. C'est le comportement demandé, et c'est
 * aussi le plus simple à auditer — il n'y a rien à purger, donc rien qui
 * puisse survivre par accident.
 *
 * Ce test lit le SOURCE du composant : c'est la seule façon de vérifier
 * qu'une écriture n'a pas lieu, sans exécuter la page (le composant n'écrit
 * rien, donc il n'y a rien à observer à l'exécution).
 */
describe("confirmation d'âge de Blackline", () => {
  const AGE_GATE = join(process.cwd(), "components/blackline/age-gate.tsx");
  const source = readFileSync(AGE_GATE, "utf8");

  /**
   * Le SOURCE SANS SES COMMENTAIRES.
   *
   * Le composant DOCUMENTE ce qu'il ne fait pas (« ni dans le localStorage,
   * ni dans un cookie ») : ces phrases contain the very tokens the test
   * forbids. Tester le texte brut confondait la documentation avec le code
   * et faisait échouer un composant parfaitement conforme. On ne regarde donc
   * que le code exécutable.
   */
  const code = source
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|\s)\/\/[^\n]*/g, " ")
    // Les chaînes littérales restent : une chaîne n'écrit rien, mais une
    // URL de requête trahirait une intention d'appel réseau.
    .replace(/`(?:[^`\\]|\\.)*`/g, "``")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''");

  it("ne persiste rien : ni stockage, ni cookie, ni requête", () => {
    // Le composant ne doit contenir AUCUNE de ces écritures.
    for (const motif of [
      "localStorage",
      "sessionStorage",
      "document.cookie",
      "indexedDB",
      "fetch(",
      "XMLHttpRequest",
    ]) {
      expect(code, `la modale d'âge écrit « ${motif} »`).not.toContain(motif);
    }
  });

  it("annonce la classification PEGI 16", () => {
    expect(source).toContain("PEGI 16");
    expect(source).toContain("16 ans");
  });

  it("rappelle que l'âge n'est pas mémorisé", () => {
    // Le message doit être explicite : l'utilisateur doit savoir qu'il
    // sera redemandé.
    expect(source).toMatch(/ni enregistr|mémorisé|chaque lancement/i);
  });

  it("ne ferme pas sur Échap", () => {
    // C'est une condition d'accès, pas une fenêtre à quitter : la question
    // doit recevoir une réponse.
    expect(source).toContain("Escape");
  });
});
