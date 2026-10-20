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
    expect(normalizeMaiSearchResultCount(1)).toBe(MAI_SEARCH_RESULT_COUNT_MIN);
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
