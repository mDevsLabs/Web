import { describe, expect, it } from "vitest";

import {
  computeTierUsagePercent,
  formatUsageDisplay,
  getWeeklyResetDate,
  isTierUsageExceeded,
  TIER_USAGE_CAPACITIES,
} from "@/lib/plans/usage-engine";

describe("usage-engine: calcul d'usage en pourcentage par forfait", () => {
  it("définit les capacités contractuelles relatives", () => {
    expect(TIER_USAGE_CAPACITIES.free).toBe(100);
    expect(TIER_USAGE_CAPACITIES.plus).toBe(200);
    expect(TIER_USAGE_CAPACITIES.pro).toBe(400);
    expect(TIER_USAGE_CAPACITIES.max).toBe(1000);
  });

  it("calcule les pourcentages exacts pour chaque forfait", () => {
    // Forfait Free (capacité 100) : 50 unités = 50%
    expect(computeTierUsagePercent({ consumed: 50, tier: "free" })).toBe(50);
    // Forfait Plus (capacité 200) : 50 unités = 25%
    expect(computeTierUsagePercent({ consumed: 50, tier: "plus" })).toBe(25);
    // Forfait Pro (capacité 400) : 100 unités = 25%
    expect(computeTierUsagePercent({ consumed: 100, tier: "pro" })).toBe(25);
    // Forfait Max (capacité 1000) : 250 unités = 25%
    expect(computeTierUsagePercent({ consumed: 250, tier: "max" })).toBe(25);
  });

  it("arrondit correctement et plafonne à 100%", () => {
    // 33.333% -> 33%
    expect(computeTierUsagePercent({ consumed: 33.3, tier: "free" })).toBe(33);
    // 66.666% -> 67%
    expect(computeTierUsagePercent({ consumed: 66.7, tier: "free" })).toBe(67);
    // Dépassement -> plafonné à 100%
    expect(computeTierUsagePercent({ consumed: 150, tier: "free" })).toBe(100);
    expect(computeTierUsagePercent({ consumed: 99_999, tier: "max" })).toBe(
      100
    );
  });

  it("traite les valeurs négatives ou nulles comme 0%", () => {
    expect(computeTierUsagePercent({ consumed: 0, tier: "free" })).toBe(0);
    expect(computeTierUsagePercent({ consumed: -10, tier: "free" })).toBe(0);
  });

  it("retombe sur Free en cas de tier inconnu ou manquant", () => {
    expect(computeTierUsagePercent({ consumed: 50, tier: "unknown" })).toBe(50);
    expect(computeTierUsagePercent({ consumed: 50, tier: null })).toBe(50);
    expect(computeTierUsagePercent({ consumed: 50, tier: undefined })).toBe(50);
  });

  it("détecte correctement l'épuisement du quota (>= 100%)", () => {
    expect(isTierUsageExceeded({ consumed: 99, tier: "free" })).toBe(false);
    expect(isTierUsageExceeded({ consumed: 100, tier: "free" })).toBe(true);
    expect(isTierUsageExceeded({ consumed: 150, tier: "free" })).toBe(true);

    expect(isTierUsageExceeded({ consumed: 199, tier: "plus" })).toBe(false);
    expect(isTierUsageExceeded({ consumed: 200, tier: "plus" })).toBe(true);
  });

  it("formate l'affichage pour l'interface sans tokens bruts", () => {
    const normal = formatUsageDisplay({ consumed: 40, tier: "plus" });
    expect(normal.percent).toBe(20);
    expect(normal.label).toBe("20%");
    expect(normal.isWarning).toBe(false);
    expect(normal.isExceeded).toBe(false);
    expect(normal.tierLabel).toBe("Plus");

    const warning = formatUsageDisplay({ consumed: 85, tier: "free" });
    expect(warning.percent).toBe(85);
    expect(warning.label).toBe("85%");
    expect(warning.isWarning).toBe(true);
    expect(warning.isExceeded).toBe(false);

    const exceeded = formatUsageDisplay({ consumed: 120, tier: "free" });
    expect(exceeded.percent).toBe(100);
    expect(exceeded.label).toBe("100%");
    expect(exceeded.isWarning).toBe(false);
    expect(exceeded.isExceeded).toBe(true);
  });

  it("calcule la réinitialisation hebdomadaire au lundi 00:00 UTC", () => {
    // Mercredi 19 novembre 2026 -> Prochain lundi : 23 novembre 2026 à 00:00:00 UTC
    const wednesday = new Date("2026-11-19T14:30:00.000Z");
    const nextReset = getWeeklyResetDate(wednesday);
    expect(nextReset.getUTCDay()).toBe(1); // Lundi
    expect(nextReset.getUTCHours()).toBe(0);
    expect(nextReset.getUTCMinutes()).toBe(0);
    expect(nextReset.toISOString()).toBe("2026-11-23T00:00:00.000Z");
  });
});
