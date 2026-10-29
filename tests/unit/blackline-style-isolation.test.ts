import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";
import { describe, expect, it } from "vitest";

/**
 * Isolation des feuilles Blackline exécutées.
 *
 * Le jeu est écrit pour posséder le document : sa feuille de style déclare
 * `:root`, `html` et `body`, et pose ses composants sur des sélecteurs nus
 * (`button`, `input`, `select`, `*`). Sans ré-ancrage, ces règles
 * s'appliqueraient à l'APPLICATION ENTIÈRE : le chat, la barre latérale et
 * les réglages mAI seraient repeints par la palette du jeu, et `overflow:hidden`
 * sur `body` couperait le défilement de toute la page.
 *
 * Ce test vérifie que la feuille générée ne sort JAMAIS de `.blackline-root`.
 */
describe("isolation des feuilles Blackline exécutées", () => {
  const FICHIER = path.join(
    process.cwd(),
    "components/blackline/blackline.css"
  );

  it("existe : la feuille est générée par scripts/build-blackline-css.mjs", () => {
    expect(fs.existsSync(FICHIER)).toBe(true);
  });

  it("ne modifie aucun sélecteur hors de .blackline-root", () => {
    const css = postcss.parse(fs.readFileSync(FICHIER, "utf8"));
    const violations: string[] = [];
    css.walkRules((rule) => {
      // Les `@keyframes` ne contiennent que des pourcentages : leurs «
      // sélecteurs » ne sont pas des sélecteurs.
      let parent: typeof rule.parent | postcss.Document = rule.parent;
      while (parent) {
        if (parent.type === "atrule" && parent.name.endsWith("keyframes")) {
          return;
        }
        parent = parent.parent;
      }
      for (const selector of rule.selectors) {
        if (!selector.startsWith(".blackline-root")) {
          violations.push(selector);
        }
      }
    });
    expect(violations).toEqual([]);
  });

  it("préfixe ses animations, pour ne pas heurter l'interface mAI", () => {
    // Les noms d'animation du jeu (`pulse`, `loading`, `scan`…) sont GLOBAUX.
    // Sans préfixe, l'interface mAI oscillerait avec les mêmes timings.
    const css = postcss.parse(fs.readFileSync(FICHIER, "utf8"));
    css.walkAtRules((rule) => {
      if (rule.name.endsWith("keyframes")) {
        expect(rule.params.startsWith("blackline-")).toBe(true);
      }
    });
  });

  it("porte les classes d'état sur la racine, pas sur un descendant", () => {
    // Le jeu pose `touch-device`, `left-handed`, `reduced-motion`… sur SA
    // RACINE (apps/blackline/src/root.ts). Une règle qui les attend sur un
    // descendant ne s'appliquerait JAMAIS : le jeu tournerait en mode
    // bureau sur mobile, et les effets de caméra ne seraient jamais coupés.
    const css = postcss.parse(fs.readFileSync(FICHIER, "utf8"));
    const classesEtat = [
      "left-handed",
      "no-screen-effects",
      "portrait-blocked",
      "reduced-motion",
      "touch-device",
    ];
    const malAncres: string[] = [];
    css.walkRules((rule) => {
      for (const selector of rule.selectors) {
        for (const classe of classesEtat) {
          if (selector.includes(`.blackline-root .${classe}`)) {
            malAncres.push(selector);
          }
        }
      }
    });
    expect(malAncres).toEqual([]);
  });

  it("laisse les classes de composant comme descendants", () => {
    // Symétrique du contrôle précédent : une classe de COMPONENT désigne un
    // élément à l'intérieur du jeu. La fusionner dans la racine la ferait
    // cibler la racine elle-même — et la règle ne s'appliquerait plus.
    const css = postcss.parse(fs.readFileSync(FICHIER, "utf8"));
    const malAncres: string[] = [];
    css.walkRules((rule) => {
      for (const selector of rule.selectors) {
        if (
          /\.blackline-root\.(nav-item|hero|sidebar|footer|menu-main)\b/.test(
            selector
          )
        ) {
          malAncres.push(selector);
        }
      }
    });
    expect(malAncres).toEqual([]);
  });

  it("borne le jeu au viewport : plus aucune position fixe", () => {
    // `position: fixed` se référence au VIEWPORT : le canvas du jeu
    // couvrirait alors la BARRE LATÉRALE du chat. Le script convertit en
    // `absolute` pour que le jeu reste dans sa racine.
    const css = postcss.parse(fs.readFileSync(FICHIER, "utf8"));
    const fixes: string[] = [];
    css.walkDecls((decl) => {
      if (decl.prop === "position" && decl.value.trim() === "fixed") {
        // `decl.parent` peut être absent (une déclaration à la racine du
        // conteneur CSS) : on ne retient alors que la déclaration.
        fixes.push(decl.parent?.toString() ?? decl.toString());
      }
    });
    expect(fixes).toEqual([]);
  });

  it("pointe la police du jeu vers son emplacement public", () => {
    // La police est la seule ressource ABSOLUE de la feuille : sans
    // réécriture, `url('/fonts/…')` 404 sous /blackline.
    const brut = fs.readFileSync(FICHIER, "utf8");
    expect(brut).toContain("/blackline/fonts/blackline.woff");
    expect(brut).not.toMatch(/url\(["']?\/fonts\//);
  });
});
