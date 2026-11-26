import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  quizzlyLeagueSeat,
  quizzlyProfile,
  quizzlyQuest,
  quizzlyQuestDraw,
} from "@/lib/db/schema";
import {
  QUETES_HEBDOMADAIRES,
  QUETES_QUOTIDIENNES,
} from "@/lib/quizzly/quetes";
import {
  cleQuete,
  HEARTS_MAX,
  jourParis,
  MESURES_HEBDOMADAIRES,
  MESURES_QUOTIDIENNES,
  semaineIso,
  tirerUneParMesure,
  XP_QUETE_QUOTIDIENNE,
} from "@/lib/quizzly/rules";
import {
  texteXpSemaineAccueil,
  texteXpSemaineLigue,
} from "@/lib/quizzly/stats-display";

const mocks = vi.hoisted(() => ({
  assurerSiege: vi.fn(async () => {}),
  cloreLiguesEchues: vi.fn(async () => [] as string[]),
  profil: {
    cosmetics: null,
    gems: 20,
    hearts: 5,
    heartsUpdatedAt: new Date("2026-11-25T10:00:00.000Z"),
    league: "bronze",
    leagueShieldWeek: null,
    modelId: null,
    schoolYear: "6e",
    streakBest: 1,
    streakCount: 0,
    streakFreezes: 0,
    streakLastDay: null,
    subjects: [],
    updatedAt: new Date("2026-11-25T10:00:00.000Z"),
    userId: "user-1",
    xp: 1100,
    xpBoostUntil: null,
    yearChosen: true,
  },
  quete: {
    claimedAt: null as Date | null,
    progress: 999,
    questKey: "",
    userId: "user-1",
  },
  updates: [] as { set: Record<string, unknown>; table: unknown }[],
}));

function buildSelectChain(resultForTable: () => unknown[]) {
  return {
    where: () => ({
      for: () => ({
        limit: async () => resultForTable(),
      }),
      limit: async () => resultForTable(),
    }),
  };
}

function createFakeDb() {
  const tx = {
    insert: () => ({
      values: () => ({
        onConflictDoNothing: async () => [],
      }),
    }),
    select: () => ({
      from: (table: unknown) =>
        buildSelectChain(() => {
          if (table === quizzlyQuestDraw) {
            return [];
          }
          if (table === quizzlyProfile) {
            return [mocks.profil];
          }
          if (table === quizzlyQuest) {
            return [mocks.quete];
          }
          return [];
        }),
    }),
    update: (table: unknown) => ({
      set: (values: Record<string, unknown>) => ({
        where: async () => {
          mocks.updates.push({ set: values, table });
          return [];
        },
      }),
    }),
  };
  return {
    ...tx,
    transaction: async <T>(fn: (trx: typeof tx) => Promise<T>): Promise<T> =>
      fn(tx),
  };
}

vi.mock("@/lib/db/queries", () => ({
  dbReady: vi.fn(async () => {}),
  getDb: () => createFakeDb(),
}));

vi.mock("@/lib/quizzly/league-store", () => ({
  assurerSiege: mocks.assurerSiege,
  cloreLiguesEchues: mocks.cloreLiguesEchues,
  xpSemaine: vi.fn(async () => 0),
}));

import { reclamerQuete } from "@/lib/quizzly/queries";

describe("affichage XP hebdomadaire Quizzly", () => {
  it("n'affiche pas +0 cette semaine lorsque weeklyXp vaut 0", () => {
    expect(texteXpSemaineAccueil(0)).toEqual({
      actif: false,
      libelle: "Aucun XP cette semaine",
    });
    expect(texteXpSemaineAccueil(-5)).toEqual({
      actif: false,
      libelle: "Aucun XP cette semaine",
    });
    expect(texteXpSemaineAccueil(Number.NaN)).toEqual({
      actif: false,
      libelle: "Aucun XP cette semaine",
    });
    expect(texteXpSemaineAccueil(10)).toEqual({
      actif: true,
      libelle: "+10 cette semaine",
    });
    expect(texteXpSemaineLigue(0)).toBe("Aucun XP cette semaine");
    expect(texteXpSemaineLigue(42)).toBe("42 XP cette semaine");
  });

  it("évite font-black dans Quizzly et sécurise les marges du chemin d'accueil", () => {
    const racine = resolve(import.meta.dirname, "../../components/quizzly");
    for (const fichier of [
      "accueil.tsx",
      "boutique.tsx",
      "parcours.tsx",
      "quiz-player.tsx",
      "synthese.tsx",
    ]) {
      const contenu = readFileSync(resolve(racine, fichier), "utf8");
      expect(contenu).not.toContain("font-black");
    }
    const accueil = readFileSync(resolve(racine, "accueil.tsx"), "utf8");
    expect(accueil).toContain("overflow-x-auto px-2 py-4");
    expect(accueil).toContain("texteXpSemaineAccueil");
  });
});

describe("XP hebdomadaire des quêtes Quizzly", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updates = [];
    mocks.profil.gems = 20;
    mocks.profil.hearts = HEARTS_MAX;
    mocks.profil.xp = 1100;
    mocks.quete.claimedAt = null;
    mocks.quete.progress = 999;
  });

  it("crédite aussi weeklyXp lors de la réclamation d'une quête quotidienne en XP", async () => {
    const jour = jourParis(new Date());
    const tirage = tirerUneParMesure(
      QUETES_QUOTIDIENNES,
      `daily:${jour}`,
      MESURES_QUOTIDIENNES
    );
    const quete = tirage[0];
    expect(quete).toBeDefined();
    if (!quete) {
      return;
    }
    const cle = cleQuete("daily", jour, quete.id);
    mocks.quete.questKey = cle;

    const resultat = await reclamerQuete("user-1", cle);
    expect(resultat).toEqual({
      gems: 20,
      monnaie: "xp",
      ok: true,
      recompense: XP_QUETE_QUOTIDIENNE,
      xp: 1100 + XP_QUETE_QUOTIDIENNE,
    });
    expect(mocks.cloreLiguesEchues).toHaveBeenCalledTimes(1);
    expect(mocks.assurerSiege).toHaveBeenCalledTimes(1);
    const majLigue = mocks.updates.find(
      (entry) => entry.table === quizzlyLeagueSeat
    );
    expect(majLigue).toBeDefined();
    expect(majLigue?.set).toHaveProperty("weeklyXp");
  });

  it("ne touche pas à weeklyXp pour une quête hebdomadaire en gemmes", async () => {
    const semaine = semaineIso(jourParis(new Date()));
    const tirage = tirerUneParMesure(
      QUETES_HEBDOMADAIRES,
      `weekly:${semaine}`,
      MESURES_HEBDOMADAIRES
    );
    const quete = tirage[0];
    expect(quete).toBeDefined();
    if (!quete) {
      return;
    }
    const cle = cleQuete("weekly", semaine, quete.id);
    mocks.quete.questKey = cle;

    const resultat = await reclamerQuete("user-1", cle);
    expect(resultat).toEqual({
      gems: 20 + quete.recompense,
      monnaie: "gemmes",
      ok: true,
      recompense: quete.recompense,
      xp: 1100,
    });
    expect(mocks.cloreLiguesEchues).not.toHaveBeenCalled();
    expect(mocks.assurerSiege).not.toHaveBeenCalled();
    expect(
      mocks.updates.some((entry) => entry.table === quizzlyLeagueSeat)
    ).toBe(false);
  });
});
