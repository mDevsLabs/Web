import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { getAllNewsArticles, getNewsArticle, getNewsArticles } from "@/lib/news";

/**
 * La découverte des articles est purement filesystem (`readdirSync(docs/news)`) :
 * un dossier incomplet est silencieusement ignoré, et une date mal formatée casse
 * le tri. Ces tests verrouillent les deux invariants.
 */

const NEWS_DIR = join(process.cwd(), "docs/news");

describe("news catalogue", () => {
  it("exposes at least one article", () => {
    expect(getAllNewsArticles().length).toBeGreaterThan(0);
  });

  it("gives every article a parseable index.json", () => {
    const broken = getAllNewsArticles()
      .filter((article) => article.title === "Sans titre" || !article.description)
      .map((article) => article.slug);

    expect(broken).toEqual([]);
  });

  it("sorts articles by descending ISO date", () => {
    const articles = getAllNewsArticles();
    const dates = articles.map((article) => article.date);

    for (const date of dates) {
      expect(date, `date non ISO dans un article : ${date}`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }

    expect(dates).toEqual([...dates].sort().reverse());
  });

  it("keeps every visible article in the filtered list", () => {
    const all = getAllNewsArticles().filter((article) => article.visibility !== "hidden");
    expect(getNewsArticles().map((article) => article.slug)).toEqual(
      all.map((article) => article.slug)
    );
  });

  it("reads the release-candidate projects announcement", () => {
    const article = getNewsArticle("introducing-projects-release-candidate");
    expect(article).not.toBeNull();
    expect(article?.visibility).toBe("standard");
    expect(article?.category).toBe("Lancement");
    expect(article?.image).toBe("https://upload.fs.fr/dA57zDuVV5.png");
    expect(article?.content).toContain("Release Candidate");
  });

  it("presents the five projects in their published order", () => {
    const content = getNewsArticle("introducing-projects-release-candidate")?.content ?? "";
    const positions = ["## Web", "## Vibe", "## Coder", "## CLI", "## Pulse"].map((heading) =>
      content.indexOf(heading)
    );

    for (const position of positions) {
      expect(position).toBeGreaterThan(-1);
    }
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it("rejects path traversal in article slugs", () => {
    for (const malicious of ["../secrets", "..\\secrets", "a/b", ""]) {
      expect(getNewsArticle(malicious)).toBeNull();
    }
  });

  it("has no orphaned audit artefact referencing a missing article", () => {
    // Les fichiers `_audit_*.txt` sont des vestiges d'un audit SEO ponctuel : ils
    // ne sont lus par aucun code, mais ils ne doivent pas non plus prétendre
    // couvrir le catalogue actuel.
    const auditTitles = join(NEWS_DIR, "_audit_titles.txt");
    if (!existsSync(auditTitles)) return;
    const listed = readFileSync(auditTitles, "utf8")
      .split("\n")
      .map((line) => line.split("|")[0]?.trim())
      .filter(Boolean);

    for (const slug of listed) {
      expect(existsSync(join(NEWS_DIR, slug)), `slug obsolète dans _audit_titles.txt : ${slug}`).toBe(
        true
      );
    }
  });
});
