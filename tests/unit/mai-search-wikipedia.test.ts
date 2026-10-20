import { afterEach, describe, expect, it, vi } from "vitest";
import {
  normalizeWikiTitle,
  stripHtml,
  wikipediaArticleUrl,
} from "@/lib/search/wikipedia";

afterEach(() => vi.restoreAllMocks());

describe("Wikipédia — normalisation des titres", () => {
  it("retire les artefacts de saisie", () => {
    expect(normalizeWikiTitle("[[Ada Lovelace]]")).toBe("Ada Lovelace");
    expect(normalizeWikiTitle("  Tour   Eiffel  ")).toBe("Tour Eiffel");
    expect(normalizeWikiTitle("")).toBe("");
  });
});

describe("Wikipédia — nettoyage des extraits HTML", () => {
  it("retire le balisage MediaWiki et décode les entités", () => {
    const extrait =
      '<span class="searchmatch">Ada</span> Lovelace &amp; <b>Alan</b> Turing';
    expect(stripHtml(extrait)).toBe("Ada Lovelace & Alan Turing");
  });

  it("préserve le texte quand il n'y a pas de balisage", () => {
    expect(stripHtml("Un article parfaitement ordinary.")).toBe(
      "Un article parfaitement ordinary."
    );
  });
});

describe("Wikipédia — URL canonique", () => {
  it("construit l'URL publique de l'article", () => {
    expect(wikipediaArticleUrl("Ada Lovelace", "fr")).toBe(
      "https://fr.wikipedia.org/wiki/Ada_Lovelace"
    );
  });

  it("suit la langue demandée", () => {
    expect(wikipediaArticleUrl("Ada Lovelace", "en")).toBe(
      "https://en.wikipedia.org/wiki/Ada_Lovelace"
    );
  });
});
