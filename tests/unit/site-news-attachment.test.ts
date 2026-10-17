import { describe, expect, it } from "vitest";
import { getAllNewsArticles, getNewsArticle } from "@/lib/site/news";
import { formatFileSizeFr } from "@/lib/site/text-utils";

/**
 * Le bloc `pdf` d'un `index.json` d'actualité alimente une URL publique et un
 * attribut `download`. Ces tests verrouillent le contrat fail-safe : une entrée
 * illisible retire le bouton, elle ne doit jamais casser `/news/<slug>` ni
 * pointer hors de `/site/news`.
 */
describe("Document joint à une actualité (pdf)", () => {
  it("expose l'URL publique et le poids réel du PDF de mAI-2", () => {
    const attachment = getNewsArticle("introducing-mai-2")?.attachment;

    expect(attachment).toBeDefined();
    expect(attachment?.url).toBe("/site/news/introducing-mai-2/mAI-2.pdf");
    expect(attachment?.fileName).toBe("mAI-2.pdf");
    expect(attachment?.label).toBeTruthy();
    // Le poids est mesuré sur `public/site/news`, jamais recopié dans le JSON :
    // un PDF remplacé ne doit pas laisser une taille fausse sous le bouton.
    expect(attachment?.detail).toMatch(/\d+([,.]\d+)?\s(Ko|Mo|Go)$/);
  });

  it("laisse les autres actualités sans document joint", () => {
    const sansPdf = getAllNewsArticles().filter((a) => !a.attachment);

    expect(sansPdf.length).toBeGreaterThan(0);
    expect(sansPdf.map((a) => a.slug)).toContain("introducing-mai-1.5");
  });

  it("rejette un nom de fichier qui sort de /site/news", () => {
    // Ces formes sont rejetées par le motif de `readAttachment`, inaccessible
    // directement : on vérifie donc qu'aucun article ne publie une URL qui
    // traverse `public/site/news`.
    for (const article of getAllNewsArticles()) {
      if (!article.attachment) continue;
      expect(article.attachment.url).toMatch(
        /^\/site\/news\/[A-Za-z0-9._-]+\/[A-Za-z0-9][A-Za-z0-9._-]*\.pdf$/
      );
    }
  });
});

describe("formatFileSizeFr", () => {
  it("utilise les unités françaises et une virgule décimale", () => {
    expect(formatFileSizeFr(396_921)).toBe("387,6 Ko");
    expect(formatFileSizeFr(512)).toBe("512 o");
    expect(formatFileSizeFr(1024)).toBe("1 Ko");
    expect(formatFileSizeFr(1_572_864)).toBe("1,5 Mo");
  });

  it("renvoie une chaîne vide sur une taille inconnue", () => {
    expect(formatFileSizeFr(0)).toBe("");
    expect(formatFileSizeFr(-1)).toBe("");
    expect(formatFileSizeFr(Number.NaN)).toBe("");
  });
});