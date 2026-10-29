import { describe, expect, it } from "vitest";
import {
  extractUrl,
  isSearchableQuery,
  looksLikeUrl,
  MAI_SEARCH_MAX_QUERY_LENGTH,
  MAI_SEARCH_MIN_QUERY_LENGTH,
  normalizeSearchText,
  tokenizeQuery,
} from "@/lib/search/query";

describe("découpage d'une saisie en jetons", () => {
  it("écarte les espaces et les doublons", () => {
    expect(tokenizeQuery("  Ada   Lovelace  Lovelace ")).toEqual([
      "Ada",
      "Lovelace",
    ]);
  });

  it("conserve l'ordre des jetons", () => {
    // L'ordre départage des résultats de pertinence égale : il ne doit
    // jamais être réordonné.
    expect(tokenizeQuery("moteur recherche rapide")).toEqual([
      "moteur",
      "recherche",
      "rapide",
    ]);
  });

  it("distingue la casse pour la comparaison, pas pour l'affichage", () => {
    // « Ada » et « ada » sont le même terme de recherche, mais le texte
    // affiché reste celui que l'utilisateur a tapé.
    expect(tokenizeQuery("Ada ada")).toEqual(["Ada"]);
  });

  it("renvoie une liste vide pour une saisie vide", () => {
    expect(tokenizeQuery("   ")).toEqual([]);
  });
});

describe("longueur minimale d'une recherche", () => {
  it("exige deux caractères", () => {
    expect(MAI_SEARCH_MIN_QUERY_LENGTH).toBe(2);
    expect(isSearchableQuery("a")).toBe(false);
    expect(isSearchableQuery("ab")).toBe(true);
  });

  it("compte les espaces intermédiaires", () => {
    // « a b » fait deux caractères : c'est une recherche, et le moteur
    // décidera de ce qu'il en fait.
    expect(isSearchableQuery("a b")).toBe(true);
  });

  it("ignore les espaces de bord", () => {
    expect(isSearchableQuery("  a  ")).toBe(false);
    expect(isSearchableQuery("  ab  ")).toBe(true);
  });
});

describe("détection d'une adresse web", () => {
  it("reconnaît une adresse avec son schéma", () => {
    expect(looksLikeUrl("https://exemple.fr/page")).toBe(true);
    expect(looksLikeUrl("http://exemple.fr")).toBe(true);
  });

  it("reconnaît une adresse sans son schéma", () => {
    expect(looksLikeUrl("exemple.fr")).toBe(true);
    expect(looksLikeUrl("docs.exemple.fr/chemin/page")).toBe(true);
  });

  it("ne prend pas un mot ponctué pour une adresse", () => {
    // « node.js » est un MOT, pas une adresse : le traiter comme une URL
    // ferait ouvrir une page qui n'existe pas.
    expect(looksLikeUrl("node.js")).toBe(false);
    expect(looksLikeUrl("e.g.")).toBe(false);
  });

  it("ne prend pas une phrase pour une adresse", () => {
    expect(looksLikeUrl("comment aller à Paris")).toBe(false);
    expect(looksLikeUrl("")).toBe(false);
  });
});

describe("extraction d'une adresse", () => {
  it("ajoute le schéma par défaut", () => {
    expect(extractUrl("exemple.fr/page")).toBe("https://exemple.fr/page");
  });

  it("conserve le schéma quand il est présent", () => {
    expect(extractUrl("http://exemple.fr")).toBe("http://exemple.fr/");
  });

  it("renvoie null pour une saisie qui n'est pas une adresse", () => {
    expect(extractUrl("moteur de recherche")).toBeNull();
    expect(extractUrl("")).toBeNull();
  });

  it("renvoie null pour une adresse sans hôte", () => {
    expect(extractUrl("https://")).toBeNull();
  });
});

describe("normalisation d'une saisie", () => {
  it("normalise les espaces et la casse", () => {
    expect(normalizeSearchText("  Ada   LOVELACE ")).toBe("ada lovelace");
  });

  it("ne retire pas les accents", () => {
    // « Noël » et « Noel » ne sont pas la même recherche : retirer
    // l'accent ferait perdre des résultats, pas en gagner.
    expect(normalizeSearchText("Noël")).toBe("noël");
  });
});

describe("bornes de la saisie", () => {
  it("borne la longueur maximale acceptée", () => {
    expect(MAI_SEARCH_MAX_QUERY_LENGTH).toBe(500);
  });
});
