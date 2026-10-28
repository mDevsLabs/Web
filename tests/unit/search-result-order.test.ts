import { describe, expect, it } from "vitest";
import { formatModelName } from "@/lib/ai/models";
import { orderResults, parsePageAge } from "@/lib/search/result-order";

const NOW = Date.parse("2026-10-28T12:00:00Z");

describe("ordre des résultats mAI Search", () => {
  it("lit une date relative et une date absolue", () => {
    expect(parsePageAge("il y a 2 jours", NOW)).toBe(
      NOW - 2 * 24 * 60 * 60 * 1000
    );
    expect(parsePageAge("2026-10-27T12:00:00Z", NOW)).toBe(
      Date.parse("2026-10-27T12:00:00Z")
    );
    expect(parsePageAge(undefined, NOW)).toBeNull();
  });

  it("trie par date et écarte les résultats trop anciens", () => {
    const items = [
      { page_age: "il y a 10 jours", title: "Ancien" },
      { page_age: "il y a 2 heures", title: "Récent" },
      { title: "Sans date" },
    ];
    const ordered = orderResults(items, "date", "day", NOW);
    expect(ordered.map((item) => item.title)).toEqual(["Récent", "Sans date"]);
  });
});

describe("nom affiché des modèles mAI", () => {
  it("affiche mAI-2 Mini et non l'identifiant", () => {
    expect(formatModelName("mai-2-mini").name).toBe("mAI-2 Mini");
    expect(formatModelName("mai-2").name).toBe("mAI-2");
  });
});
