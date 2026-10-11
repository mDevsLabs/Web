import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { integrationLogoSrc } from "@/lib/integrations/logo";
import { INTEGRATION_PROVIDERS } from "@/lib/integrations/providers";

/**
 * Inventaire des logos de connecteurs, dans la discipline de
 * `tests/unit/mcp-logo-inventory.test.ts` : un fichier réel par fournisseur
 * déclaré, et rien de plus.
 *
 * Le contrôle porte aussi sur la NATURE du fichier, parce que le rendu dépend
 * du drapeau `monochrome` : une marque déclarée monochrome mais peinte de
 * plusieurs couleurs rendrait un glyphe plat et méconnaissable dès qu'elle est
 * masquée en `currentColor`, et une marque couleur passerait inaperçue sur un
 * fond sombre.
 */

const LOGO_DIR = path.join(process.cwd(), "public", "plugins");

function readLogo(file: string): string {
  return readFileSync(path.join(LOGO_DIR, file), "utf8");
}

describe("public/plugins/", () => {
  it("expose un fichier pour chaque connecteur déclaré", () => {
    const missing = INTEGRATION_PROVIDERS.filter(
      (descriptor) => !integrationLogoSrc(descriptor.id).startsWith("/plugins/")
    );
    expect(missing).toEqual([]);
    for (const descriptor of INTEGRATION_PROVIDERS) {
      // Le fichier doit exister réellement : un logo manquant rendrait soit un
      // trou invisible (masque CSS), soit une image cassée (`<img>`).
      expect(
        () => readLogo(`${descriptor.id}.svg`),
        `${descriptor.id}.svg`
      ).not.toThrow();
    }
  });

  it("n'accepte que des SVG sans vecteur", () => {
    for (const descriptor of INTEGRATION_PROVIDERS) {
      const svg = readLogo(`${descriptor.id}.svg`);
      expect(svg).toContain("<svg");
      expect(svg).toContain("</svg>");
      // Un SVG servi depuis /public est lu par le navigateur : `href`, `url(`
      // et `<script` en font un vecteur, pas une image.
      expect(svg).not.toContain("<script");
      expect(svg).not.toMatch(/href\s*=/);
      expect(svg).not.toMatch(/url\(/i);
    }
  });

  it("exige une marque neutre là où le rendu est un masque currentColor", () => {
    const neutrals = new Set([
      "#000",
      "#000000",
      "#fff",
      "#ffffff",
      "#181717",
      "#24292f",
    ]);
    for (const descriptor of INTEGRATION_PROVIDERS.filter(
      (item) => item.monochrome
    )) {
      const svg = readLogo(`${descriptor.id}.svg`);
      const fills = new Set(
        [...svg.matchAll(/fill="(#[0-9a-f]{3,6})"/gi)].map((match) =>
          match[1].toLowerCase()
        )
      );
      // Une seule couleur, et sombre ou claire : c'est ce qui permet au masque
      // de la remplacer par le texte environnant.
      expect(
        fills.size,
        `${descriptor.id} doit rester monochrome`
      ).toBeLessThanOrEqual(1);
      for (const fill of fills) {
        expect(neutrals.has(fill), `${descriptor.id} : ${fill}`).toBe(true);
      }
    }
  });

  it("exige une couleur de marque là où le logo est rendu tel quel", () => {
    for (const descriptor of INTEGRATION_PROVIDERS.filter(
      (item) => !item.monochrome
    )) {
      const svg = readLogo(`${descriptor.id}.svg`);
      const fills = [...svg.matchAll(/fill="(#[0-9a-f]{3,6})"/gi)].map(
        (match) => match[1].toLowerCase()
      );
      expect(
        fills.length,
        `${descriptor.id} doit porter une couleur`
      ).toBeGreaterThan(0);
      // Ni noir ni blanc : sinon le glyphe disparaît sur l'un des deux thèmes.
      for (const fill of fills) {
        expect(
          ["#000", "#000000", "#fff", "#ffffff"].includes(fill),
          `${descriptor.id} : ${fill}`
        ).toBe(false);
      }
    }
  });

  it("dérive le chemin d'un identifiant, sans liste à entretenir", () => {
    expect(integrationLogoSrc("google")).toBe("/plugins/google.svg");
    expect(integrationLogoSrc("github")).toBe("/plugins/github.svg");
  });
});
