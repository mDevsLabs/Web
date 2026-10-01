import { describe, expect, it } from "vitest";
import {
  formatBytesFr,
  formatCompactFr,
  formatDaysFr,
  formatDurationFr,
  formatTokensFr,
} from "@/lib/account/format";

// Formateurs ajoutés pour la page Statistiques. Ils encadrent des KPI dont la
// largeur doit rester stable, donc leur formatage est verrouillé.

describe("Formatage compact", () => {
  it("produit la notation française attendue", () => {
    // C'est la forme exacte des KPI de l'image de référence : 388,2 M.
    expect(formatCompactFr(388_200_000)).toBe("388,2 M");
    expect(formatCompactFr(125_800_000)).toBe("125,8 M");
    expect(formatCompactFr(1_250_000_000)).toBe("1,3 Md");
    expect(formatCompactFr(12_400)).toBe("12,4 k");
  });

  it("garde le nombre entier sous 10 000", () => {
    // « 9,4 k » économise trois caractères au prix d'un nombre moins lisible
    // dans un KPI de largeur fixe. Le séparateur de milliers est l'ESPACE FINE
    // INSÉCABLE (U+202F) qu'Intl produit en fr-FR — c'est le comportement
    // correct, on compare donc au formateur de référence plutôt qu'à un
    // espace ordinaire.
    expect(formatCompactFr(9999)).toBe(formatTokensFr(9999));
    expect(formatCompactFr(9999)).toContain("999");
    expect(formatCompactFr(9999)).not.toContain("k");
  });

  it("ne renvoie jamais NaN", () => {
    // Un KPI affichant « NaN » trahirait une division par zéro dans une série
    // vide : la pageStatistiques en compte plusieurs.
    expect(formatCompactFr(Number.NaN)).toBe("0");
    expect(formatCompactFr(Number.POSITIVE_INFINITY)).toBe("0");
    expect(formatCompactFr(-500_000)).toBe("-500 k");
  });
});

describe("Formatage de durée", () => {
  it("détaille jusqu'à l'heure", () => {
    expect(formatDurationFr(2 * 3_600_000 + 33 * 60_000)).toBe("2 h 33 min");
    expect(formatDurationFr(3 * 3_600_000)).toBe("3 h");
    expect(formatDurationFr(45 * 60_000)).toBe("45 min");
    expect(formatDurationFr(45 * 60_000 + 30_000)).toBe("45 min 30 s");
  });

  it("arrondit sous dix secondes", () => {
    // « 0,4 s » dans un KPI est plus précis que lisible.
    expect(formatDurationFr(400)).toBe("0 s");
    expect(formatDurationFr(8400)).toBe("8 s");
  });

  it("affiche un tiret plutôt que zéro", () => {
    // Zéro signifie « aucune donnée mesurée » sur les run Agent, pas
    // « une tâche de durée nulle ».
    expect(formatDurationFr(0)).toBe("—");
    expect(formatDurationFr(-1)).toBe("—");
  });
});

describe("Formatage de jours", () => {
  it("accorde au singulier", () => {
    expect(formatDaysFr(1)).toBe("1 jour");
    expect(formatDaysFr(6)).toBe("6 jours");
    expect(formatDaysFr(0)).toBe("0 jour");
  });
});

describe("Formatage d'octets (non-régression)", () => {
  it("conserve le comportement existant", () => {
    // `formatBytesFr` n'est pas touché par cet ajout, mais il est vérifié ici
    // parce que la page Statistiques l'affiche dans le récapitulatif.
    expect(formatBytesFr(0)).toBe("0 Mo");
    expect(formatBytesFr(1024 * 1024 * 5)).toBe("5.0 Mo");
  });
});
