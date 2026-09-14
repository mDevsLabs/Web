import { describe, expect, it } from "vitest";

import {
  getPaidTierRank,
  isPaidTier,
  parseCanonicalTier,
  tierAtLeast,
} from "@/lib/auth/plan";

describe("parseCanonicalTier (normalisation users.tier)", () => {
  it("canonise Free/Plus/Pro/Max, insensible à la casse", () => {
    expect(parseCanonicalTier("Plus")).toBe("plus");
    expect(parseCanonicalTier("PLUS")).toBe("plus");
    expect(parseCanonicalTier(" max ")).toBe("max");
    expect(parseCanonicalTier("Free")).toBe("free");
  });

  it("renvoie null pour toute valeur inconnue, vide ou absente", () => {
    expect(parseCanonicalTier("Enterprise")).toBeNull();
    expect(parseCanonicalTier("")).toBeNull();
    expect(parseCanonicalTier("   ")).toBeNull();
    expect(parseCanonicalTier(null)).toBeNull();
    expect(parseCanonicalTier(undefined)).toBeNull();
  });
});

describe("isPaidTier / getPaidTierRank / tierAtLeast", () => {
  it("les forfaits payants sont exactement Plus, Pro et Max", () => {
    expect(isPaidTier("plus")).toBe(true);
    expect(isPaidTier("pro")).toBe(true);
    expect(isPaidTier("max")).toBe(true);
    expect(isPaidTier("free")).toBe(false);
    expect(isPaidTier("bogus")).toBe(false);
  });

  it("classe les rangs : free=0, plus=1, pro=2, max=3", () => {
    expect(getPaidTierRank("free")).toBe(0);
    expect(getPaidTierRank("plus")).toBe(1);
    expect(getPaidTierRank("pro")).toBe(2);
    expect(getPaidTierRank("max")).toBe(3);
  });

  it("tierAtLeast reflète la hiérarchie des forfaits", () => {
    expect(tierAtLeast("plus", "plus")).toBe(true);
    expect(tierAtLeast("pro", "plus")).toBe(true);
    expect(tierAtLeast("max", "pro")).toBe(true);
    expect(tierAtLeast("plus", "pro")).toBe(false);
    expect(tierAtLeast("free", "plus")).toBe(false);
  });
});
