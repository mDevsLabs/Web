import { describe, expect, it } from "vitest";
import {
  QUETES_HEBDOMADAIRES,
  QUETES_QUOTIDIENNES,
} from "@/lib/quizzly/quetes";
import {
  GEMMES_QUETE_HEBDOMADAIRE,
  MESURES_HEBDOMADAIRES,
  MESURES_QUOTIDIENNES,
  tirerUneParMesure,
  XP_QUETE_QUOTIDIENNE,
} from "@/lib/quizzly/rules";

describe("catalogues de quêtes Quizzly", () => {
  it("publie 100 quêtes quotidiennes à 10 XP", () => {
    expect(QUETES_QUOTIDIENNES).toHaveLength(100);
    const ids = new Set(QUETES_QUOTIDIENNES.map((quete) => quete.id));
    const titres = new Set(QUETES_QUOTIDIENNES.map((quete) => quete.titre));
    expect(ids.size).toBe(100);
    expect(titres.size).toBe(100);
    for (const quete of QUETES_QUOTIDIENNES) {
      expect(quete.monnaie).toBe("xp");
      expect(quete.recompense).toBe(XP_QUETE_QUOTIDIENNE);
      expect(MESURES_QUOTIDIENNES).toContain(quete.mesure);
    }
    expect(new Set(QUETES_QUOTIDIENNES.map((quete) => quete.mesure)).size).toBe(
      MESURES_QUOTIDIENNES.length
    );
  });

  it("publie 100 quêtes hebdomadaires en gemmes", () => {
    expect(QUETES_HEBDOMADAIRES).toHaveLength(100);
    const ids = new Set(QUETES_HEBDOMADAIRES.map((quete) => quete.id));
    expect(ids.size).toBe(100);
    for (const quete of QUETES_HEBDOMADAIRES) {
      expect(quete.monnaie).toBe("gemmes");
      expect(GEMMES_QUETE_HEBDOMADAIRE).toContain(quete.recompense);
      expect(MESURES_HEBDOMADAIRES).toContain(quete.mesure);
    }
    expect(
      new Set(QUETES_HEBDOMADAIRES.map((quete) => quete.mesure)).size
    ).toBe(MESURES_HEBDOMADAIRES.length);
  });

  it("fige un tirage global, une mesure par quête", () => {
    const jour = tirerUneParMesure(
      QUETES_QUOTIDIENNES,
      "daily:2026-10-31",
      MESURES_QUOTIDIENNES
    );
    expect(jour).toHaveLength(3);
    expect(new Set(jour.map((quete) => quete.mesure)).size).toBe(3);
    expect(
      tirerUneParMesure(
        QUETES_QUOTIDIENNES,
        "daily:2026-10-31",
        MESURES_QUOTIDIENNES
      ).map((quete) => quete.id)
    ).toEqual(jour.map((quete) => quete.id));

    const semaine = tirerUneParMesure(
      QUETES_HEBDOMADAIRES,
      "weekly:2026-W44",
      MESURES_HEBDOMADAIRES
    );
    expect(semaine).toHaveLength(5);
    expect(new Set(semaine.map((quete) => quete.mesure)).size).toBe(5);

    const jours = Array.from({ length: 14 }, (_, index) => {
      const quantieme = String(index + 1).padStart(2, "0");
      return tirerUneParMesure(
        QUETES_QUOTIDIENNES,
        `daily:2026-10-${quantieme}`,
        MESURES_QUOTIDIENNES
      )[0]?.id;
    });
    expect(new Set(jours).size).toBeGreaterThan(1);
  });
});
