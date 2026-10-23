import { describe, expect, it } from "vitest";
import {
  MAI_SEARCH_RESULT_COUNT_DEFAULT,
  MAI_SEARCH_RESULT_COUNT_MAX,
  MAI_SEARCH_RESULT_COUNT_MIN,
  MAI_SEARCH_SOURCE_KEYS,
  normalizeMaiSearchLanguage,
  normalizeMaiSearchResultCount,
  normalizeMaiSearchSafetyLevel,
  normalizeMaiSearchSources,
  resolveMaiSearchResultCount,
} from "@/lib/search/sources";

describe("vocabulaire des sources de recherche", () => {
  it("expose les cinq sources attendues, Wikipédia comprise", () => {
    expect(MAI_SEARCH_SOURCE_KEYS).toContain("wikipedia");
    expect(MAI_SEARCH_SOURCE_KEYS).toHaveLength(5);
  });

  it("retombe sur toutes les sources quand la liste est illisible", () => {
    // Une préférence corrompue ne doit pas rendre mAI Search muet : le
    // repli est « tout chercher », pas « ne rien chercher ».
    expect(normalizeMaiSearchSources(undefined)).toEqual([
      ...MAI_SEARCH_SOURCE_KEYS,
    ]);
    expect(normalizeMaiSearchSources("n'importe quoi")).toEqual([
      ...MAI_SEARCH_SOURCE_KEYS,
    ]);
    expect(normalizeMaiSearchSources([])).toEqual([...MAI_SEARCH_SOURCE_KEYS]);
  });

  it("retombe sur toutes les sources quand la liste ne contient que des inconnues", () => {
    expect(normalizeMaiSearchSources(["inexistant", "autre"])).toEqual([
      ...MAI_SEARCH_SOURCE_KEYS,
    ]);
  });

  it("conserve les sources valides et retire les doublons", () => {
    expect(normalizeMaiSearchSources(["web", "wikipedia", "web"])).toEqual([
      "web",
      "wikipedia",
    ]);
  });

  it("ne garde pas les sources inconnues mêlées aux valides", () => {
    expect(normalizeMaiSearchSources(["web", "fantome"])).toEqual(["web"]);
  });
});

describe("normalisation de la langue de recherche", () => {
  it("conserve une langue connue", () => {
    expect(normalizeMaiSearchLanguage("en")).toBe("en");
    expect(normalizeMaiSearchLanguage("de")).toBe("de");
  });

  it("retombe sur le français pour une langue illisible", () => {
    expect(normalizeMaiSearchLanguage("klingon")).toBe("fr");
    expect(normalizeMaiSearchLanguage(null)).toBe("fr");
    expect(normalizeMaiSearchLanguage(42)).toBe("fr");
  });
});

describe("normalisation du filtre de sécurité", () => {
  it("conserve un niveau connu", () => {
    expect(normalizeMaiSearchSafetyLevel("strict")).toBe("strict");
    expect(normalizeMaiSearchSafetyLevel("low")).toBe("low");
  });

  it("retombe sur « modéré » pour un niveau illisible", () => {
    expect(normalizeMaiSearchSafetyLevel("n'importe quoi")).toBe("medium");
    expect(normalizeMaiSearchSafetyLevel(undefined)).toBe("medium");
  });
});

describe("normalisation du nombre de résultats", () => {
  it("conserve un nombre dans les bornes", () => {
    expect(normalizeMaiSearchResultCount(15)).toBe(15);
    expect(normalizeMaiSearchResultCount(MAI_SEARCH_RESULT_COUNT_MIN)).toBe(
      MAI_SEARCH_RESULT_COUNT_MIN
    );
    expect(normalizeMaiSearchResultCount(MAI_SEARCH_RESULT_COUNT_MAX)).toBe(
      MAI_SEARCH_RESULT_COUNT_MAX
    );
  });

  it("borne un nombre hors limites", () => {
    // La borne basse est à 1 : une recherche d'une seule source est un usage
    // légitime, la refuser ressemblerait à une panne.
    expect(MAI_SEARCH_RESULT_COUNT_MIN).toBe(1);
    expect(normalizeMaiSearchResultCount(0)).toBe(MAI_SEARCH_RESULT_COUNT_MIN);
    expect(normalizeMaiSearchResultCount(1000)).toBe(
      MAI_SEARCH_RESULT_COUNT_MAX
    );
  });

  it("retombe sur la valeur par défaut pour une valeur illisible", () => {
    expect(normalizeMaiSearchResultCount(Number.NaN)).toBe(
      MAI_SEARCH_RESULT_COUNT_DEFAULT
    );
    expect(normalizeMaiSearchResultCount("beaucoup")).toBe(
      MAI_SEARCH_RESULT_COUNT_DEFAULT
    );
  });
});

describe("résolution du nombre de résultats", () => {
  it("plafonne par forfait", () => {
    // Free 50, Plus 100, Pro 150, Max 200.
    expect(resolveMaiSearchResultCount({ preferred: 200, tier: "free" })).toBe(
      50
    );
    expect(resolveMaiSearchResultCount({ preferred: 200, tier: "plus" })).toBe(
      100
    );
    expect(resolveMaiSearchResultCount({ preferred: 200, tier: "pro" })).toBe(
      150
    );
    expect(resolveMaiSearchResultCount({ preferred: 200, tier: "max" })).toBe(
      200
    );
  });

  it("traite un forfait illisible comme un forfait gratuit", () => {
    // Fail-safe : une limite qui s'élargit sur une valeur illisible
    // accorderait un privilège à un compte qu'on ne connaît pas.
    expect(
      resolveMaiSearchResultCount({ preferred: 200, tier: "inexistant" })
    ).toBe(50);
    expect(resolveMaiSearchResultCount({ preferred: 200, tier: null })).toBe(
      50
    );
    expect(resolveMaiSearchResultCount({ preferred: 200 })).toBe(50);
  });

  it("ne laisse jamais dépasser la préférence du compte", () => {
    // Le client peut RÉTRÉCIR, jamais élargir : demander 200 quand la
    // préférence est à 10 donne 10.
    expect(
      resolveMaiSearchResultCount({
        preferred: 10,
        requested: 200,
        tier: "max",
      })
    ).toBe(10);
  });

  it("ne fait jamais descendre sous un résultat", () => {
    expect(
      resolveMaiSearchResultCount({ preferred: 1, requested: 1, tier: "max" })
    ).toBe(1);
  });

  it("applique la préférence quand le client ne demande rien", () => {
    expect(resolveMaiSearchResultCount({ preferred: 75, tier: "max" })).toBe(
      75
    );
  });

  it("reste dans la borne absolue du produit", () => {
    expect(
      resolveMaiSearchResultCount({
        preferred: 5000,
        requested: 5000,
        tier: "max",
      })
    ).toBe(MAI_SEARCH_RESULT_COUNT_MAX);
  });
});
