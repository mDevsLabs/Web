// Vérifie le contrat public distribué : couleur héritée et nom accessible.
import { SearchIcon } from "@mdevs/icons/controls/search";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

describe("couleur et accessibilité des icônes", () => {
  it("laisse le SVG hériter du texte de son contrôle", () => {
    const svg = renderToStaticMarkup(createElement(SearchIcon));
    expect(svg).toContain('stroke="currentColor"');
    expect(svg).toContain('aria-hidden="true"');
    expect(svg).not.toMatch(/(?:style|color)="/);
  });
  it("préserve les couleurs explicites et les styles fournis", () => {
    const svg = renderToStaticMarkup(
      createElement(SearchIcon, {
        color: "red",
        style: { color: "blue", opacity: 0.5 },
      })
    );
    expect(svg).toContain('color="red"');
    expect(svg).toContain('style="color:blue;opacity:0.5"');
  });
  it("conserve le titre et le trait fixe sur la géométrie", () => {
    const svg = renderToStaticMarkup(
      createElement(SearchIcon, {
        absoluteStrokeWidth: true,
        size: 18,
        title: "Rechercher",
      })
    );
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-labelledby="');
    expect(svg).toContain('width="18"');
    expect(svg).toContain("Rechercher</title>");
    expect(svg).toContain('vector-effect="non-scaling-stroke"');
    expect(svg).not.toContain('aria-hidden="true"');
  });
});
