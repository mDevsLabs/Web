import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";
import { describe, expect, it } from "vitest";

describe("isolation des feuilles Wakies exécutées", () => {
  for (const name of [
    "wakies.css",
    "wakies-editor.css",
    "wakies-ui.css",
    "wakies-host.css",
  ]) {
    it(`${name} ne modifie pas les sélecteurs des autres applications`, () => {
      const css = postcss.parse(
        fs.readFileSync(
          path.join(process.cwd(), "components/wakies", name),
          "utf8"
        )
      );
      const violations: string[] = [];
      css.walkRules((rule) => {
        let parent: typeof rule.parent | postcss.Document = rule.parent;
        while (parent) {
          if (parent.type === "atrule" && parent.name.endsWith("keyframes"))
            return;
          parent = parent.parent;
        }
        for (const selector of rule.selectors)
          if (!selector.startsWith(".wakies-root")) violations.push(selector);
      });
      expect(violations).toEqual([]);
      css.walkAtRules((rule) => {
        if (rule.name.endsWith("keyframes"))
          expect(rule.params.startsWith(`${name.replace(".css", "")}-`)).toBe(
            true
          );
      });
      if (name === "wakies-ui.css") {
        expect(css.toString()).not.toContain("@font-face");
        expect(css.toString()).not.toContain("prefers-color-scheme: dark");
      }
    });
  }
  it("laisse les primitives gagner sur les contrôles historiques sans effacer leurs états", () => {
    for (const name of ["wakies.css", "wakies-editor.css"]) {
      const css = postcss.parse(
        fs.readFileSync(
          path.join(process.cwd(), "components/wakies", name),
          "utf8"
        )
      );
      const layers: string[] = [];
      css.walkAtRules("layer", (rule) => {
        layers.push(rule.params);
      });
      expect(layers).toEqual(["wakies-base, mdevs", "wakies-base"]);
    }
    const overrides = fs.readFileSync(
      path.join(process.cwd(), "components/wakies/wakies-host.css"),
      "utf8"
    );
    expect(overrides).not.toContain("revert-layer");
  });
});
