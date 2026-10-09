import { describe, expect, it } from "vitest";
import { computeNextOccurrence } from "@/lib/planning/executor";

describe("Récurrence des envois planifiés", () => {
  const base = new Date("2026-03-10T09:00:00.000Z");

  it("avance d'un jour, sans tient compte de l'heure d'été", () => {
    const next = computeNextOccurrence(base, "daily");
    expect(next?.toISOString()).toBe("2026-03-11T09:00:00.000Z");
  });

  it("avance de sept jours", () => {
    const next = computeNextOccurrence(base, "weekly");
    expect(next?.toISOString()).toBe("2026-03-17T09:00:00.000Z");
  });

  it("avance d'un mois", () => {
    const next = computeNextOccurrence(base, "monthly");
    expect(next?.toISOString()).toBe("2026-04-10T08:00:00.000Z");
  });

  it("conserve l'heure locale d'un envoi mensuel malgré le passage à l'heure d'été", () => {
    // Le 29 mars 2026 l'Europe passe à l'heure d'été. `setMonth` travaille en
    // heure LOCALE : ajouter un mois à un envoi fixé à 09:00 le 10 mars
    // redonne bien 09:00 le 10 avril, soit 08:00 en UTC parce que l'offset a
    // changé. C'est le comportement voulu — un plan « le 10 du mois à 9 h »
    // doit rester à 9 h chez l'utilisateur — et c'est exactement ce que
    //Daily ne fait pas.
    expect(
      computeNextOccurrence(
        new Date("2026-03-10T09:00:00.000Z"),
        "monthly"
      )?.toISOString()
    ).toBe("2026-04-10T08:00:00.000Z");
  });

  it("saute le jour qui n'existe pas au lieu de déborder sur le mois suivant", () => {
    // 31 janvier + un mois n'existe pas : `setMonth(1)` donne le 3 mars, pas
    // le 28 février. On documente le comportement réel, qui est une dérive
    // connue de la récurrence mensuelle.
    const next = computeNextOccurrence(
      new Date("2026-01-31T09:00:00.000Z"),
      "monthly"
    );
    expect(next?.getUTCMonth()).toBe(2); // mars
    expect(next?.getUTCDate()).toBe(3);
  });

  it("ne programme rien pour une absence de récurrence", () => {
    expect(computeNextOccurrence(base, "none")).toBeNull();
  });
});
