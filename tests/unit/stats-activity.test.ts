import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  computeStreaks,
  getActivity,
  getDailyActivity,
  resolveHeatmapStart,
} from "@/lib/stats/activity-stats";
import { formatBucketLabel, weekStartOf } from "@/lib/stats/heatmap";
import {
  buildBucketAxis,
  countBuckets,
  HEATMAP_MONTHS,
  maxPointsFor,
} from "@/lib/stats/stats-types";

// La carte de chaleur et les séries reposent sur une logique de dates non
// triviale : c'est elle, et non le rendu, qui décide si une série de 6 jours
// est correcte. Ces tests la verrouillent.
//
// En fin de fichier : le SQL des requêtes d'activité, compilé par Drizzle mais
// non exécuté. C'est ce qui permet de vérifier qu'une conversation supprimée
// reste comptée — la régression ne s'observe pas sur les helpers purs, elle est
// dans la forme des requêtes.

const day = (n: number) =>
  new Date(Date.UTC(2026, 0, 1 + n)).toISOString().slice(0, 10);

/**
 * Base SANS serveur, pour lire le SQL que le code produit réellement.
 *
 * Un faux constructeur de requêtes ne prouverait rien : c'est la compilation
 * Drizzle qui produit le SQL, et c'est elle qu'on veut inspecter. On branche donc
 * un vrai `drizzle` sur un pilote proxy qui enregistre chaque requête et répond
 * par un tableau vide. `server-only` est neutralisé — le module testé en dépend
 * pour interdire son import côté client, ce qui n'a rien à dire d'un test.
 */
const captured = vi.hoisted(() => ({ sql: [] as string[] }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/queries", async () => {
  const { drizzle } = await import("drizzle-orm/pg-proxy");
  const db = drizzle(async (sql: string) => {
    captured.sql.push(sql);
    // `rows: []` suffit : rien n'est lu, seul le SQL compte.
    return { fields: [], rows: [], type: "select" as const };
  });
  return { getDb: () => db };
});

function entry(dayKey: string, conversations: number, tokens = 1000) {
  return {
    agentRuns: 0,
    audioTokens: 0,
    conversations,
    day: dayKey,
    imageCount: 0,
    textTokens: tokens,
    tokens,
  };
}

describe("Début de la fenêtre de la carte", () => {
  it("tombe sur le 1er du mois, 11 mois en arrière", () => {
    // Ancrer sur le 1er du mois et non sur « il y a 364 jours » évite qu'un
    // mois apparaisse tronqué en début et en fin de grille.
    const start = resolveHeatmapStart(new Date("2026-09-27T10:00:00Z"));
    expect(start.toISOString().slice(0, 10)).toBe("2025-10-01");
    const months =
      (start.getUTCFullYear() - 2025) * 12 +
      (start.getUTCMonth() - 9) +
      HEATMAP_MONTHS;
    expect(months).toBe(12);
  });

  it("gère le changement d'année sans dérive", () => {
    expect(
      resolveHeatmapStart(new Date("2026-01-15T00:00:00Z"))
        .toISOString()
        .slice(0, 10)
    ).toBe("2025-02-01");
  });
});

describe("Semaine calendaire", () => {
  it("ramène toujours au lundi", () => {
    // Le 27 septembre 2026 est un dimanche : la semaine doit commencer au
    // lundi 21, jamais à la date elle-même.
    expect(
      weekStartOf(new Date("2026-09-27T00:00:00Z")).toISOString().slice(0, 10)
    ).toBe("2026-09-21");
    expect(
      weekStartOf(new Date("2026-09-21T00:00:00Z")).toISOString().slice(0, 10)
    ).toBe("2026-09-21");
    expect(
      weekStartOf(new Date("2026-09-22T00:00:00Z")).toISOString().slice(0, 10)
    ).toBe("2026-09-21");
  });
});

describe("Libellé de case", () => {
  it("omet l'année sauf demande explicite", () => {
    expect(formatBucketLabel("2026-01-05", false)).toBe("5 janv");
    expect(formatBucketLabel("2026-01-05", true)).toBe("5 janv 2026");
  });

  it("reste lisible pour une date illisible", () => {
    // Une date corrompue ne doit pas produire « Invalid Date » dans un title.
    expect(formatBucketLabel("pas-une-date", true)).toBe("pas-une-date");
  });
});

describe("Granularité quotidienne", () => {
  it("autorise une année de points quotidiens", () => {
    // C'est la raison d'être du plafond par granularité : 104 semaines ne
    // suffisaient pas à porter une carte de 12 mois.
    expect(maxPointsFor("day")).toBeGreaterThanOrEqual(366);
    const from = new Date("2025-10-01T00:00:00Z");
    const to = new Date("2026-09-27T00:00:00Z");
    // `countBuckets` mesure une DURÉE (bornes comprises), l'axe produit des
    // CAS INCLUSIFS des deux bornes : ils diffèrent donc d'un jour. L'écart est
    // sans conséquence — `countBuckets` ne sert qu'à choisir une granularité —
    // mais il est consigné ici pour que personne ne s'y fie de travers.
    expect(countBuckets(from, to, "day")).toBe(361);
    expect(buildBucketAxis(from, to, "day")).toHaveLength(362);
  });

  it("produit un axe quotidien continu et sans doublon", () => {
    const from = new Date("2026-01-01T00:00:00Z");
    const to = new Date("2026-01-31T00:00:00Z");
    const axis = buildBucketAxis(from, to, "day").map((date) =>
      date.toISOString().slice(0, 10)
    );
    expect(axis).toHaveLength(31);
    expect(new Set(axis).size).toBe(31);
    for (let index = 1; index < axis.length; index++) {
      const gap =
        new Date(`${axis[index]}T00:00:00Z`).getTime() -
        new Date(`${axis[index - 1]}T00:00:00Z`).getTime();
      expect(gap).toBe(86_400_000);
    }
  });
});

describe("Séries de jours actifs", () => {
  it("compte la plus longue suite de jours avec conversation", () => {
    const daily = [
      entry(day(0), 1),
      entry(day(1), 2),
      entry(day(2), 0),
      entry(day(3), 1),
      entry(day(4), 1),
      entry(day(5), 1),
      entry(day(6), 0),
    ];
    const { longest } = computeStreaks(daily, day(6));
    expect(longest).toBe(3);
  });

  it("ignore un jour vide SI C'EST aujourd'hui", () => {
    // L'utilisateur n'a pas encore utilisé l'application aujourd'hui : sa série
    // n'est pas perdue. Le casser à chaque minuit rendrait l'indicateur
    // illisible, puisqu'il vaudrait presque toujours 1.
    const daily = [entry(day(0), 1), entry(day(1), 1), entry(day(2), 0)];
    const { current } = computeStreaks(daily, day(2));
    expect(current).toBe(2);
  });

  it("casse la série sur un jour vide ANTERIEUR à aujourd'hui", () => {
    const daily = [entry(day(0), 1), entry(day(1), 0), entry(day(2), 1)];
    const { current } = computeStreaks(daily, day(2));
    expect(current).toBe(1);
  });

  it("vaut zéro sur une période sans aucune conversation", () => {
    const daily = [entry(day(0), 0), entry(day(1), 0)];
    expect(computeStreaks(daily, day(1))).toEqual({ current: 0, longest: 0 });
  });

  it("ne compte pas un jour de tokens sans conversation", () => {
    // Le seuil est « une conversation », pas « un token » : un run isolé ne
    // doit pas pouvoir prolonger artificiellement une série.
    const daily = [entry(day(0), 0, 50_000), entry(day(1), 0, 10_000)];
    expect(computeStreaks(daily, day(1)).longest).toBe(0);
  });

  it("tolère une série vide", () => {
    expect(computeStreaks([], "2026-01-01")).toEqual({
      current: 0,
      longest: 0,
    });
  });
});

// ─── Conversations supprimées ───────────────────────────────────────────────
//
// Régression : l'activité était comptée sur `Chat`, seule table qui recense les
// conversations. Or `deleteChatById` SUPPRIME cette ligne. Supprimer une
// conversation faisait donc disparaître rétroactivement son jour de la carte de
// chaleur, de la série de jours et du total de chats — un historique qui se
// réécrit quand on range une conversation est un historique faux.
//
// Le correctif ajoute les conversations SUPPRIMÉES, lues dans le journal de
// consommation qui survit (aucune clé étrangère), en les EXCLUANT de celles que
// `Chat` compte déjà. Ces tests verrouillent la forme de la requête : c'est la
// seule façon de garantir l'exclusion stricte, dont dépend l'absence de double
// comptage — et une erreur ici ne se verrait sur aucun helper pur.
describe("Activité des conversations supprimées", () => {
  beforeEach(() => {
    captured.sql.length = 0;
  });

  /** SQL compilé de chaque requête émise par `getDailyActivity`. */
  function allQueries(): string[] {
    return captured.sql;
  }

  /**
   * Requêtes qui comptent les conversations disparues.
   *
   * Drizzle compile en minuscules (`left join`, `is null`) : comparer sur la
   * forme compilée plutôt que sur la casse du source évitent un test qui passe
   * pour une mauvaise raison.
   */
  function deletedConversationQueries(): string[] {
    return allQueries().filter((sql) => sql.includes('left join "Chat"'));
  }

  async function runDailyActivity(): Promise<void> {
    await getDailyActivity(
      ["1"],
      new Date("2026-01-01"),
      new Date("2026-01-07")
    );
  }

  it("compte les conversations vivantes ET celles que seul le journal connaît", async () => {
    await runDailyActivity();

    // Les conversations présentes, comptées par date de création.
    expect(
      allQueries().filter((sql) => sql.includes('from "Chat"'))
    ).not.toHaveLength(0);

    const deleted = deletedConversationQueries();
    expect(deleted).not.toHaveLength(0);
    for (const sql of deleted) {
      // La condition d'exclusion. Sans elle, un jour couvert par les deux
      // requêtes serait compté deux fois.
      expect(sql).toContain('"Chat"."id" is null');
      expect(sql).toContain('"UsageEvent"."chatId" is not null');
      // `count(DISTINCT chatId)` et non `count(*)` : une conversation longue
      // produit plusieurs lignes d'usage et doit compter pour UN seul jour.
      expect(sql).toContain("count(DISTINCT");
    }
  });

  it("n'attribue jamais une conversation fantôme à un compte", async () => {
    await runDailyActivity();

    // Un appel en mode fantôme n'appartient à personne : l'inclure polluerait
    // les séries d'un compte réel.
    const deleted = deletedConversationQueries();
    expect(deleted).not.toHaveLength(0);
    for (const sql of deleted) {
      expect(sql).toContain('"UsageEvent"."isGhostMode" = $2');
    }
  });

  it("borne les deux termes sur la même fenêtre", async () => {
    await runDailyActivity();

    // Les deux termes additionnés doivent être bornés par la même fenêtre, sinon
    // la somme recouvrirait deux périodes différentes et le jour serait faux. Le
    // terme supprimé est daté par la CONSOMMATION (seule date qui survit), le
    // terme vivant par la CRÉATION : les deux bornes sont présentes, mais sur
    // des colonnes distinctes.
    for (const sql of deletedConversationQueries()) {
      expect(sql).toContain('"UsageEvent"."createdAt" >= $3');
      expect(sql).toContain('"UsageEvent"."createdAt" <= $4');
    }
    const live = allQueries().filter(
      (sql) => sql.includes('from "Chat"') && !sql.includes("left join")
    );
    expect(live).not.toHaveLength(0);
    for (const sql of live) {
      expect(sql).toContain('"Chat"."createdAt" >= $2');
    }
  });
});

// ─── Outils : les deux modes ────────────────────────────────────────────────
//
// Régression : `ToolExecution` était lisible uniquement par jointure sur
// `AgentRun`, `runId` étant NOT NULL. Le chemin Chat n'était donc pas
// observable, et le classement affichait 0 exécution pour un plugin très utilisé
// en conversation. La migration 0036 rend `runId` nullable et ajoute `userId` ;
// ces tests vérifient que la lecture utilise bien cette seconde voie, et qu'elle
// ne DOUBLE PAS le MCP du Chat — déjà compté par `McpLog`.
describe("Outils les plus utilisés", () => {
  beforeEach(() => {
    captured.sql.length = 0;
  });

  async function runActivity(): Promise<string[]> {
    await getActivity(
      ["1"],
      [],
      new Date("2026-01-01"),
      new Date("2026-01-07"),
      "2026-01-07"
    );
    return captured.sql;
  }

  it("compte les plugins du Chat sans repasser par AgentRun", async () => {
    const sql = await runActivity();

    const agent = sql.filter((entry) =>
      entry.includes('"ToolExecution"."category" in ($2, $3)')
    );
    expect(agent).toHaveLength(1);
    expect(agent[0]).toContain('inner join "AgentRun"');

    // Le chemin Chat : `runId IS NULL` + `userId IN (…)`. C'est la condition qui
    // rend les lignes du Chat identifiables, `AgentRun` n'ayant plus de rôle.
    const chat = sql.filter((entry) =>
      entry.includes('"ToolExecution"."runId" is null')
    );
    expect(chat).toHaveLength(1);
    expect(chat[0]).not.toContain("AgentRun");
    expect(chat[0]).toContain('"ToolExecution"."userId" in ($1)');
    // Uniquement les PLUGINS : le MCP du Chat est dans `McpLog`, l'écrire aussi
    // ici compterait chaque appel deux fois.
    expect(chat[0]).toContain('"ToolExecution"."category" = $2');
  });

  it("rattache l'activité supprimée aux mêmes identités que la vivante", async () => {
    const sql = await runActivity();

    // Le total de chats additionne les conversations disparues…
    const deletedChats = sql.filter(
      (entry) =>
        entry.includes("count(DISTINCT") &&
        entry.includes('"Chat"."id" is null') &&
        !entry.includes("FILTER")
    );
    expect(deletedChats).not.toHaveLength(0);

    // …et la répartition Chat/Agent fait de même, en lisant le mode DÉNORMALISÉ
    // (`chatMode`, migration 0035) : c'est la seule source qui survit à la
    // suppression de la ligne `Chat`.
    const deletedSplit = sql.filter((entry) =>
      entry.includes('"UsageEvent"."chatMode"')
    );
    expect(deletedSplit).toHaveLength(1);
    expect(deletedSplit[0]).toContain('"Chat"."id" is null');
    expect(deletedSplit[0]).toContain("count(DISTINCT");
  });
});
