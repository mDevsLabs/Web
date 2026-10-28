import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const newsRoot = path.join(process.cwd(), "apps", "site", "docs", "news");

describe("Actualités du Site — index.json valides", () => {
  const slugs = fs
    .readdirSync(newsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((slug) => fs.existsSync(path.join(newsRoot, slug, "index.json")));

  it("les deux articles historiquement invisibles sont listés", () => {
    expect(slugs).toContain("android-mobile-app");
    expect(slugs).toContain("renommage-mai");
  });

  it("chaque index.json est un JSON strict avec titre, description et date", () => {
    for (const slug of slugs) {
      const file = path.join(newsRoot, slug, "index.json");
      const raw = fs.readFileSync(file, "utf8");
      let parsed: Record<string, unknown>;
      // Aucun JSON5, aucune virgule finale : JSON.parse est le même parseur que
      // `readArticle` en production.
      expect(() => {
        parsed = JSON.parse(raw);
      }, slug).not.toThrow();
      const metadata = parsed!;
      for (const field of ["title", "description", "date"]) {
        expect(typeof metadata[field], `${slug}.${field}`).toBe("string");
        expect(String(metadata[field]).trim().length).toBeGreaterThan(0);
      }
    }
  });
});
