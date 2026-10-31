import { describe, expect, it } from "vitest";
import { pickTrends } from "@/lib/search/trends";

const CATALOG = [
  "Charles III",
  "Auxerre",
  "Formule 1",
  "Bardella",
  "Euromillions",
  "Nintendo Direct",
  "Kylian Mbappé",
  "Air France",
];

describe("pickTrends", () => {
  it("rend quatre sujets distincts", () => {
    const drawn = pickTrends(CATALOG, [], 4, () => 0);
    expect(drawn).toHaveLength(4);
    expect(new Set(drawn).size).toBe(4);
    for (const item of drawn) {
      expect(CATALOG).toContain(item);
    }
  });

  it("écarte le lot affiché tant que le catalogue le permet", () => {
    const previous = CATALOG.slice(0, 4);
    const drawn = pickTrends(CATALOG, previous, 4, () => 0);
    expect(drawn).toHaveLength(4);
    for (const item of drawn) {
      expect(previous).not.toContain(item);
    }
  });

  it("repasse sur tout le catalogue quand il ne reste pas quatre autres sujets", () => {
    const previous = CATALOG.slice(0, 6);
    const drawn = pickTrends(CATALOG, previous, 4, () => 0);
    expect(drawn).toHaveLength(4);
  });

  it("rend le catalogue entier s'il est plus court que quatre", () => {
    expect(pickTrends(["Un", "Deux", " Un "], [], 4, () => 0)).toEqual([
      "Un",
      "Deux",
    ]);
  });
});
