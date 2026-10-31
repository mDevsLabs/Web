import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  cleCompteAmi,
  deciderDemande,
  normaliserPseudo,
} from "@/lib/quizzly/friends";
import {
  comparerMembres,
  decouperCohortes,
  type MembreCohorte,
  resoudreCohorte,
  semaineSuivante,
} from "@/lib/quizzly/leagues";
import { normaliserNomAffiche, versIndicatif } from "@/lib/quizzly/name";
import { LEAGUE_COLOR, SUBJECT_COLOR, YEAR_COLOR } from "@/lib/quizzly/palette";
import { cheminsChapitresAttendus } from "@/lib/quizzly/program";
import {
  achatImpossible,
  appliquerAchat,
  avancerSerie,
  boosterActif,
  DAILY_GIFT_GEMS,
  delaiProchainCoeur,
  HEART_REGEN_MS,
  HEARTS_MAX,
  idsDebloques,
  jourParis,
  mouvementsQuetes,
  niveauDepuisXp,
  prolongerBooster,
  quizReussi,
  recompensesPremiereValidation,
  recordSerie,
  regeneratedHearts,
  semaineIso,
  serieApresTentative,
  tirerUneParMesure,
  XP_BOOST_CAP_MS,
  XP_BOOST_MS,
  xpAvecBooster,
  xpPourPalier,
} from "@/lib/quizzly/rules";
import { SHOP_ITEMS } from "@/lib/quizzly/shop";
import { matiereSuivie, normaliserMatieres } from "@/lib/quizzly/subjects";

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

  it("compte un quiz terminé, quel que soit le score, une fois par jour", () => {
    const apresEchec = serieApresTentative(
      { streakCount: 2, streakFreezes: 1, streakLastDay: "2026-10-29" },
      "2026-10-30"
    );
    expect(apresEchec.streakCount).toBe(3);
    expect(serieApresTentative(apresEchec, "2026-10-30")).toEqual(apresEchec);

    const avecGel = serieApresTentative(
      { streakCount: 4, streakFreezes: 1, streakLastDay: "2026-10-28" },
      "2026-10-30"
    );
    expect(avecGel).toEqual({
      streakCount: 5,
      streakFreezes: 0,
      streakLastDay: "2026-10-30",
    });

    const sansGel = serieApresTentative(
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
  it("accorde 1 XP par bonne réponse dès 8/10, et 5 gemmes", () => {
    expect(quizReussi(7)).toBe(false);
    expect(recompensesPremiereValidation(7)).toEqual({ gems: 0, xp: 0 });
    expect(recompensesPremiereValidation(8)).toEqual({ gems: 5, xp: 8 });
    expect(recompensesPremiereValidation(10)).toEqual({ gems: 5, xp: 10 });
  });

  it("lit le niveau sur l'XP, sans le stocker", () => {
    expect(niveauDepuisXp(0)).toEqual({
      niveau: 1,
      xpDansPalier: 0,
      xpPalier: 10,
    });
    expect(xpPourPalier(1)).toBe(10);
    expect(xpPourPalier(2)).toBe(15);
    expect(niveauDepuisXp(9)).toEqual({
      niveau: 1,
      xpDansPalier: 9,
      xpPalier: 10,
    });
    expect(niveauDepuisXp(10)).toEqual({
      niveau: 2,
      xpDansPalier: 0,
      xpPalier: 15,
    });
    expect(niveauDepuisXp(25)).toEqual({
      niveau: 3,
      xpDansPalier: 0,
      xpPalier: 20,
    });
  });

  it("débloque le quiz suivant seulement si le précédent est validé", () => {
    const ouverts = idsDebloques(["a", "b", "c"], new Set(["a"]));
    expect([...ouverts]).toEqual(["a", "b"]);
  });

  it("avance les quêtes tirées, et ignore le rejeu sauf la série", () => {
    const actives = [
      {
        id: "qd-001",
        mesure: "quiz_valide" as const,
        portee: "daily" as const,
      },
      { id: "qd-040", mesure: "sans_faute" as const, portee: "daily" as const },
      {
        id: "qh-070",
        mesure: "serie" as const,
        portee: "weekly" as const,
      },
      {
        id: "qh-090",
        mesure: "jours_actifs" as const,
        portee: "weekly" as const,
      },
    ];
    const mouvements = mouvementsQuetes(actives, "2026-10-30", "2026-W44", {
      bonnesReponses: 10,
      firstPass: true,
      nouveauJour: true,
      parfait: true,
      serie: 3,
    });
    expect(mouvements.map((mouvement) => mouvement.cle)).toEqual([
      "daily:2026-10-30:qd-001",
      "daily:2026-10-30:qd-040",
      "weekly:2026-W44:qh-070",
      "weekly:2026-W44:qh-090",
    ]);
    const rejeu = mouvementsQuetes(actives, "2026-10-30", "2026-W44", {
      bonnesReponses: 10,
      firstPass: false,
      nouveauJour: false,
      parfait: true,
      serie: 3,
    });
    expect(rejeu).toEqual([
      {
        cle: "weekly:2026-W44:qh-070",
        mode: "set",
        valeur: 3,
      },
    ]);
  });

  it("tire la même quête par mesure pour une période donnée", () => {
    const quetes = [
      { id: "a", mesure: "quiz_valide" },
      { id: "b", mesure: "quiz_valide" },
      { id: "c", mesure: "sans_faute" },
    ];
    const premier = tirerUneParMesure(quetes, "daily:2026-10-30", [
      "quiz_valide",
      "sans_faute",
    ]);
    expect(
      tirerUneParMesure(quetes, "daily:2026-10-30", [
        "quiz_valide",
        "sans_faute",
      ])
    ).toEqual(premier);
    expect(new Set(premier.map((quete) => quete.mesure)).size).toBe(2);
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

  it("traite une sélection vide comme toutes les matières", () => {
    expect(normaliserMatieres("6e", [])).toEqual([]);
    expect(matiereSuivie([], "francais")).toBe(true);
    const partielle = normaliserMatieres("6e", ["francais", "inconnu"]);
    expect(partielle).toEqual(["francais"]);
    expect(matiereSuivie(partielle, "anglais")).toBe(false);
  });
});

function membre(
  userId: string,
  weeklyXp: number,
  totalXp = 0,
  shield = false
): MembreCohorte {
  return { league: "silver", shield, totalXp, userId, weeklyXp };
}

describe("ligues", () => {
  it("fait monter les 5 premiers et descendre les 5 derniers", () => {
    const membres = Array.from({ length: 12 }, (_, index) =>
      membre(`u${String(index).padStart(2, "0")}`, index)
    );
    const issues = resoudreCohorte(membres);
    const parId = new Map(issues.map((issue) => [issue.userId, issue.league]));
    for (const id of ["u11", "u10", "u09", "u08", "u07"]) {
      expect(parId.get(id)).toBe("gold");
    }
    for (const id of ["u05", "u06"]) {
      expect(parId.get(id)).toBe("silver");
    }
    for (const id of ["u00", "u01", "u02", "u03", "u04"]) {
      expect(parId.get(id)).toBe("bronze");
    }
  });

  it("laisse Champion sans montée et Bronze sans descente", () => {
    const haut = Array.from({ length: 10 }, (_, index) => ({
      ...membre(`c${index}`, index),
      league: "champion" as const,
    }));
    const parHaut = new Map(
      resoudreCohorte(haut).map((issue) => [issue.userId, issue.league])
    );
    for (const id of ["c9", "c8", "c7", "c6", "c5"]) {
      expect(parHaut.get(id)).toBe("champion");
    }
    for (const id of ["c4", "c3", "c2", "c1", "c0"]) {
      expect(parHaut.get(id)).toBe("diamond");
    }
    const bas = Array.from({ length: 10 }, (_, index) => ({
      ...membre(`b${index}`, index),
      league: "bronze" as const,
    }));
    const parBas = new Map(
      resoudreCohorte(bas).map((issue) => [issue.userId, issue.league])
    );
    for (const id of ["b9", "b8", "b7", "b6", "b5"]) {
      expect(parBas.get(id)).toBe("silver");
    }
    for (const id of ["b4", "b3", "b2", "b1", "b0"]) {
      expect(parBas.get(id)).toBe("bronze");
    }
  });

  it("ne bouge personne en dessous de 10", () => {
    const petits = Array.from({ length: 9 }, (_, index) =>
      membre(`p${index}`, index)
    );
    expect(
      resoudreCohorte(petits).every((issue) => issue.league === "silver")
    ).toBe(true);
  });

  it("décale la descente quand un bouclier couvre le dernier", () => {
    const membres = Array.from({ length: 12 }, (_, index) =>
      membre(`u${String(index).padStart(2, "0")}`, index, 0, index === 0)
    );
    const issues = resoudreCohorte(membres);
    const parId = new Map(issues.map((issue) => [issue.userId, issue.league]));
    expect(parId.get("u00")).toBe("silver");
    expect(parId.get("u05")).toBe("bronze");
    expect(parId.get("u06")).toBe("silver");
  });

  it("départage l'XP de semaine par l'XP totale puis par l'identifiant", () => {
    const tries = [
      membre("b", 10, 5),
      membre("a", 10, 50),
      membre("c", 10, 50),
    ].sort(comparerMembres);
    expect(tries.map((ligne) => ligne.userId)).toEqual(["a", "c", "b"]);
  });

  it("découpe les cohortes par 30 et avance la semaine ISO", () => {
    expect(decouperCohortes([1, 2, 3], 2)).toEqual([[1, 2], [3]]);
    expect(semaineSuivante("2026-W44")).toBe("2026-W45");
    expect(semaineSuivante("2020-W53")).toBe("2021-W01");
  });
});

describe("booster, cadeau et record", () => {
  const maintenant = new Date("2026-10-31T12:00:00.000Z");
  const contexte = {
    aujourdhui: "2026-10-31",
    maintenant,
    semaine: "2026-W44",
  };
  const booster = SHOP_ITEMS.find((article) => article.id === "booster-xp");
  const bouclier = SHOP_ITEMS.find(
    (article) => article.id === "bouclier-ligue"
  );
  const offre = SHOP_ITEMS.find((article) => article.id === "offre-jour");

  it("double l'XP seulement pendant le booster et plafonne à 30 minutes", () => {
    expect(xpAvecBooster(80, false)).toBe(80);
    expect(xpAvecBooster(80, true)).toBe(160);
    expect(xpAvecBooster(0, true)).toBe(0);
    expect(boosterActif(null, maintenant)).toBe(false);
    const dix = prolongerBooster(null, maintenant);
    expect(dix.getTime() - maintenant.getTime()).toBe(XP_BOOST_MS);
    const presquePlein = new Date(
      maintenant.getTime() + XP_BOOST_CAP_MS - 60_000
    );
    const plafonne = prolongerBooster(presquePlein, maintenant);
    expect(plafonne.getTime() - maintenant.getTime()).toBe(XP_BOOST_CAP_MS);
    expect(booster && bouclier && offre).toBeTruthy();
    if (!booster || !bouclier || !offre) {
      return;
    }
    const portefeuille = {
      gems: 400,
      hearts: 5,
      lastDailyGift: null,
      leagueShieldWeek: null,
      ownedFrames: [],
      streakFreezes: 0,
      xpBoostUntil: new Date(maintenant.getTime() + XP_BOOST_CAP_MS),
    };
    expect(achatImpossible(booster, portefeuille, contexte)).toMatch(/maximum/);
    const actif = appliquerAchat(
      booster,
      { ...portefeuille, xpBoostUntil: null },
      contexte
    );
    expect(actif.gems).toBe(320);
    expect(actif.xpBoostUntil?.getTime()).toBe(
      maintenant.getTime() + XP_BOOST_MS
    );
    expect(
      achatImpossible(
        bouclier,
        { ...portefeuille, leagueShieldWeek: "2026-W44" },
        contexte
      )
    ).toMatch(/bouclier/i);
    const pose = appliquerAchat(bouclier, portefeuille, contexte);
    expect(pose.leagueShieldWeek).toBe("2026-W44");
    expect(pose.gems).toBe(50);
  });

  it("ne donne les 5 gemmes qu'une fois par jour de Paris", () => {
    expect(offre).toBeDefined();
    if (!offre) {
      return;
    }
    const vide = {
      gems: 3,
      hearts: 5,
      lastDailyGift: null,
      leagueShieldWeek: null,
      ownedFrames: [],
      streakFreezes: 0,
      xpBoostUntil: null,
    };
    const pris = appliquerAchat(offre, vide, contexte);
    expect(pris.gems).toBe(3 + DAILY_GIFT_GEMS);
    expect(pris.lastDailyGift).toBe("2026-10-31");
    expect(achatImpossible(offre, pris, contexte)).toMatch(/déjà/);
    const lendemain = appliquerAchat(offre, pris, {
      ...contexte,
      aujourdhui: "2026-11-01",
    });
    expect(lendemain.gems).toBe(3 + DAILY_GIFT_GEMS * 2);
  });

  it("garde le record de série au-dessus de la série en cours", () => {
    expect(recordSerie(4, 9)).toBe(9);
    expect(recordSerie(12, 9)).toBe(12);
  });
});

describe("amis", () => {
  it("normalise le pseudo et accepte une demande déjà reçue", () => {
    expect(normaliserPseudo(" @Ada_01 ")).toBe("Ada_01");
    expect(normaliserPseudo("a")).toBeNull();
    expect(
      deciderDemande(
        {
          addresseeId: "moi",
          id: "f1",
          requesterId: "lui",
          status: "pending",
        },
        "moi",
        "lui"
      )
    ).toEqual({ action: "accepter", id: "f1" });
    expect(
      deciderDemande(
        {
          addresseeId: "lui",
          id: "f2",
          requesterId: "moi",
          status: "accepted",
        },
        "moi",
        "lui"
      )
    ).toEqual({ action: "deja" });
  });

  it("préfère le profil déjà ouvert, sinon la forme de l'appelant", () => {
    expect(
      cleCompteAmi({
        cleAppelant: "11111111-1111-1111-1111-111111111111",
        cleHote: "22222222-2222-2222-2222-222222222222",
        cleVibe: "42",
        profilsExistants: ["42"],
      })
    ).toBe("42");
    expect(
      cleCompteAmi({
        cleAppelant: "11111111-1111-1111-1111-111111111111",
        cleHote: "22222222-2222-2222-2222-222222222222",
        cleVibe: "42",
        profilsExistants: [],
      })
    ).toBe("22222222-2222-2222-2222-222222222222");
  });
});

describe("palette Quizzly", () => {
  it("recopie les couleurs dans la feuille sous .quizzly-root", () => {
    const css = readFileSync(
      resolve(import.meta.dirname, "../../app/globals.css"),
      "utf8"
    );
    for (const [id, couleur] of Object.entries(LEAGUE_COLOR)) {
      expect(css).toContain(`--q-league-${id}: ${couleur};`);
    }
    for (const [id, couleur] of Object.entries(YEAR_COLOR)) {
      expect(css).toContain(`--q-year-${id}: ${couleur};`);
    }
    for (const [id, couleur] of Object.entries(SUBJECT_COLOR)) {
      expect(css).toContain(`--q-subject-${id}: ${couleur};`);
    }
  });
});
