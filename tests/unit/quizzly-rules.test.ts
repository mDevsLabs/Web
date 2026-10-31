import { describe, expect, it } from "vitest";
import { normaliserNomAffiche, versIndicatif } from "@/lib/quizzly/name";
import { cheminsChapitresAttendus } from "@/lib/quizzly/program";
import {
  achatImpossible,
  appliquerAchat,
  avancerSerie,
  delaiProchainCoeur,
  HEART_REGEN_MS,
  HEARTS_MAX,
  idsDebloques,
  incrementsQuetes,
  jourParis,
  quizReussi,
  recompensesPremiereValidation,
  regeneratedHearts,
  semaineIso,
} from "@/lib/quizzly/rules";
import { SHOP_ITEMS } from "@/lib/quizzly/shop";

const gel = SHOP_ITEMS.find((article) => article.id === "gel-serie");
const cadre = SHOP_ITEMS.find((article) => article.id === "cadre-ardoise");
const recharge = SHOP_ITEMS.find((article) => article.id === "recharge-coeurs");

describe("cœurs Quizzly", () => {
  it("rend un cœur toutes les 30 minutes, sans dépasser 5", () => {
    const debut = new Date("2026-10-30T10:00:00.000Z");
    const tropTot = regeneratedHearts(
      2,
      debut,
      new Date(debut.getTime() + 29 * 60 * 1000)
    );
    expect(tropTot.changed).toBe(false);
    expect(tropTot.hearts).toBe(2);

    const unCoeur = regeneratedHearts(
      2,
      debut,
      new Date(debut.getTime() + HEART_REGEN_MS + 1000)
    );
    expect(unCoeur.hearts).toBe(3);

    const plafond = regeneratedHearts(
      4,
      debut,
      new Date(debut.getTime() + 3 * HEART_REGEN_MS)
    );
    expect(plafond.hearts).toBe(HEARTS_MAX);
  });

  it("n'arme un délai que tant qu'un cœur peut encore arriver", () => {
    const debut = Date.parse("2026-10-30T10:00:00.000Z");
    expect(delaiProchainCoeur(HEARTS_MAX, debut, debut)).toBeNull();
    expect(delaiProchainCoeur(2, Number.NaN, debut)).toBeNull();
    expect(delaiProchainCoeur(2, debut, debut)).toBe(HEART_REGEN_MS);
    expect(delaiProchainCoeur(2, debut, debut + 1000)).toBe(
      HEART_REGEN_MS - 1000
    );
    expect(delaiProchainCoeur(4, debut, debut + HEART_REGEN_MS)).toBeNull();
  });
});

describe("série Quizzly", () => {
  it("avance d'un jour, consomme un gel, ou repart à 1", () => {
    expect(
      avancerSerie(
        { streakCount: 4, streakFreezes: 1, streakLastDay: "2026-10-29" },
        "2026-10-30"
      ).streakCount
    ).toBe(5);

    const avecGel = avancerSerie(
      { streakCount: 4, streakFreezes: 1, streakLastDay: "2026-10-28" },
      "2026-10-30"
    );
    expect(avecGel.streakCount).toBe(5);
    expect(avecGel.streakFreezes).toBe(0);

    const sansGel = avancerSerie(
      { streakCount: 4, streakFreezes: 0, streakLastDay: "2026-10-28" },
      "2026-10-30"
    );
    expect(sansGel.streakCount).toBe(1);
    expect(sansGel.streakFreezes).toBe(0);
  });

  it("ne change pas si un quiz a déjà été validé aujourd'hui", () => {
    const etat = {
      streakCount: 3,
      streakFreezes: 1,
      streakLastDay: "2026-10-30",
    };
    expect(avancerSerie(etat, "2026-10-30")).toEqual(etat);
  });
});

describe("récompenses et verrous", () => {
  it("n'accorde XP et gemmes qu'à partir de 8/10, avec bonus au sans-faute", () => {
    expect(quizReussi(7)).toBe(false);
    expect(recompensesPremiereValidation(7)).toEqual({ gems: 0, xp: 0 });
    expect(recompensesPremiereValidation(8)).toEqual({ gems: 5, xp: 80 });
    expect(recompensesPremiereValidation(10)).toEqual({ gems: 5, xp: 120 });
  });

  it("débloque le quiz suivant seulement si le précédent est validé", () => {
    const ouverts = idsDebloques(["a", "b", "c"], new Set(["a"]));
    expect([...ouverts]).toEqual(["a", "b"]);
  });

  it("compte la quête du jour seulement à la première validation", () => {
    const mouvements = incrementsQuetes({
      firstPass: true,
      parfait: true,
      periodeJour: "2026-10-30",
      periodeSemaine: "2026-W44",
      serie: 3,
      xp: 120,
    });
    expect(mouvements.map((mouvement) => mouvement.cle)).toContain(
      "daily:2026-10-30:perfect"
    );
    const rejeu = incrementsQuetes({
      firstPass: false,
      parfait: true,
      periodeJour: "2026-10-30",
      periodeSemaine: "2026-W44",
      serie: 3,
      xp: 0,
    });
    expect(rejeu).toEqual([
      {
        cle: "weekly:2026-W44:streak",
        mode: "set",
        valeur: 3,
      },
    ]);
  });
});

describe("boutique", () => {
  it("refuse un achat trop cher et débite le prix annoncé", () => {
    expect(gel).toBeDefined();
    expect(cadre).toBeDefined();
    expect(recharge).toBeDefined();
    if (!gel || !cadre || !recharge) {
      return;
    }
    const pauvre = {
      gems: 10,
      hearts: 5,
      ownedFrames: [],
      streakFreezes: 0,
    };
    expect(achatImpossible(gel, pauvre)).toBe("Pas assez de gemmes.");
    const achete = appliquerAchat(cadre, { ...pauvre, gems: 80 });
    expect(achete.gems).toBe(0);
    expect(achete.ownedFrames).toEqual(["cadre-ardoise"]);
    expect(
      achatImpossible(cadre, {
        gems: 100,
        hearts: 1,
        ownedFrames: ["cadre-ardoise"],
        streakFreezes: 0,
      })
    ).toMatch(/déjà/);
    expect(
      achatImpossible(recharge, {
        gems: 200,
        hearts: 5,
        ownedFrames: [],
        streakFreezes: 0,
      })
    ).toMatch(/complet/);
  });
});

describe("nom affiché", () => {
  it("borne le nom et coupe l'indicatif Blackline à 18 caractères", () => {
    expect(normaliserNomAffiche("  Ada   Lovelace ")).toBe("Ada Lovelace");
    expect(normaliserNomAffiche("A")).toBeNull();
    expect(versIndicatif("Un nom vraiment trop long pour le jeu")).toHaveLength(
      18
    );
  });
});

describe("calendrier de Paris", () => {
  it("donne un jour civil et une semaine ISO", () => {
    expect(jourParis(new Date("2026-06-15T10:00:00.000Z"))).toBe("2026-06-15");
    expect(jourParis(new Date("2026-01-15T23:30:00.000Z"))).toBe("2026-01-16");
    expect(semaineIso("2020-12-31")).toBe("2020-W53");
  });
});

describe("carte scolaire", () => {
  it("prévoit trois chapitres par matière", () => {
    expect(cheminsChapitresAttendus()).toHaveLength(309);
  });
});
