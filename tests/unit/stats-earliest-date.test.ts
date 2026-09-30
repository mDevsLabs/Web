import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StatsQuery } from "@/lib/stats/stats-types";
import { getUsageStats } from "@/lib/stats/usage-stats";

// Régression : la requête qui ancre « tout l'historique » sur la plus ancienne
// donnée existante est écrite en SQL brut (le `UNION ALL` mélange `"userId"` et
// `"user_id"`), et elle a failli être encodée `= ANY(${userIds})`. Drizzle
// sérialise un tableau interpolé en CONSTRUCTEUR DE LIGNE `($1, $2)`, pas en
// `text[]` : Postgres levait alors `22P02 malformed array literal` et la page
// Statistiques tombait en erreur — en changeant de période, puisque cette
// requête ne précède que « tout l'historique ».
//
// Aucune base réelle ici. On branche un VRAI `drizzle` sur un pilote proxy qui
// enregistre le SQL et répond par des lignes vides : le SQL inspected est donc
// exactement celui que Postgres recevrait, et non un SQL fabriqué par le test.
// `server-only` est neutralisé — il n'interdit au module que d'être importé côté
// client, ce qui n'a rien à dire d'un test.
const captured = vi.hoisted(() => ({
  calls: [] as { params: unknown[]; sql: string }[],
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/queries", async () => {
  const { drizzle } = await import("drizzle-orm/pg-proxy");
  const db = drizzle(async (sql: string, params: unknown[]) => {
    // `params` est indispensable : le SQL transporte des placeholders `$n`, les
    // valeurs voyagent à part. Lire l'identifiant dans le SQL reviendrait à
    // chercher une valeur qui n'y est pas.
    captured.calls.push({ params, sql });
    return { rows: [] };
  });
  return { dbReady: vi.fn(async () => {}), getDb: () => db };
});

/** SQL émis, dans l'ordre. */
function allSql(): string[] {
  return captured.calls.map((call) => call.sql);
}

const allTime: StatsQuery = {
  kinds: [],
  mode: null,
  model: null,
  period: "all",
  projectId: null,
};

/** Dernière requête émise : SQL et paramètres, tels que le pilote les reçoit. */
function lastQuery(): { params: unknown[]; sql: string } {
  return captured.calls.at(-1) ?? { params: [], sql: "" };
}

/** Compte les prédicats `colonne IN (…)` du SQL. */
function inPredicates(sql: string): string[] {
  return [...sql.matchAll(/IN \(([^)]*)\)/gi)].map((match) => match[1].trim());
}

describe("Ancrage de « tout l'historique »", () => {
  beforeEach(() => {
    captured.calls.length = 0;
  });

  it("lie les identifiants un par un, jamais en tableau", async () => {
    await getUsageStats({ email: "moi@exemple.fr", id: "1" }, allTime);

    const { params, sql } = lastQuery();
    // Le piège récurrent : un tableau passé à ANY. La forme correcte est une
    // liste de placeholders, un par valeur — donc six paramètres pour trois
    // branches, jamais un tableau sérialisé.
    expect(sql).not.toContain("ANY(");
    expect(inPredicates(sql)).toEqual(["$1, $2", "$3, $4", "$5, $6"]);
    // Les trois branches du UNION ALL filtrent sur le même périmètre : l'id puis
    // l'email, trois fois.
    expect(params).toEqual([
      "1",
      "moi@exemple.fr",
      "1",
      "moi@exemple.fr",
      "1",
      "moi@exemple.fr",
    ]);
  });

  it("gère le compte à un seul identifiant", async () => {
    // Cas du bug rapporté : un seul identifiant, donc une liste de une valeur.
    await getUsageStats({ id: "1" }, allTime);

    const { params, sql } = lastQuery();
    expect(sql).not.toContain("ANY(");
    expect(inPredicates(sql)).toEqual(["$1", "$2", "$3"]);
    expect(params).toEqual(["1", "1", "1"]);
  });

  it("interroge les trois sources de consommation", async () => {
    await getUsageStats({ id: "1" }, allTime);

    // Cette requête est écrite en SQL brut, non compilée par Drizzle : la casse
    // est celle de la source.
    const { sql } = lastQuery();
    expect(sql).toContain('FROM "UsageEvent"');
    expect(sql).toContain('FROM "mprojects_speech_generations"');
    expect(sql).toContain('FROM "mprojects_image_generations"');
  });

  it("signale l'absence d'historique sans laisser la page vide", async () => {
    const stats = await getUsageStats({ id: "1" }, allTime);

    expect(stats.warnings).toEqual([
      "Aucun historique de consommation n'a été trouvé pour ce compte.",
    ]);
    expect(stats.consumption).toEqual([]);
    expect(stats.overview.totalTokens).toBe(0);
  });
});

// ─── Conversations supprimées ───────────────────────────────────────────────
//
// Régression : les filtres « mode » et « projet » passaient par une JOINTURE
// `Chat`. Or `deleteChatById` supprime la ligne `Chat` alors que le journal de
// consommation survit (aucune clé étrangère). Résultat : poser « Mode Chat »
// faisait chuter le total de tokens de toutes les conversations supprimées — et
// le révoquer ne le remontait pas, la ligne ayant disparu de la requête et non
// du chiffre. Même erreur sur le projet, aggravée par le `ON DELETE SET NULL`
// de `Chat.projectId` : supprimer un projet suffisait à perdre l'information.
//
// Le correctif compare les colonnes DÉNORMALISÉES (`chatMode`, `chatProjectId`,
// migration 0035), figées à l'écriture. Ces tests verrouillent l'absence de
// jointure : c'est la seule propriété qui distingue la version correcte, et
// elle se vérifie sans la moindre donnée réelle.
describe("Filtrage des tokens sans jointure sur Chat", () => {
  beforeEach(() => {
    captured.calls.length = 0;
  });

  /**
   * Les deux agrégats de tokens de la PAGE, et eux seuls : le classement par
   * modèle et la série de consommation.
   *
   * Trois autres requêtes de la page somment aussi `totalTokens` et ne doivent
   * PAS porter ces filtres, chacune pour une raison qui tient à son rôle :
   *
   * - la carte de chaleur (`date_trunc('day')`) couvre TOUJOURS 12 mois et ignore
   *   le filtre de période par conception ;
   * - le pic hebdomadaire (`order by sum(...) desc limit`) est un indicateur
   *   d'intensité sur la période, pas une série filtrable ;
   * - `countUnattributedTokens` (`chatMode is null`) est une MESURE de plus, dont
   *   le seul but est de chiffrer l'avertissement.
   *
   * Les écarter nommément, plutôt que de filtrer large, évite qu'un test passe
   * ou échoue pour une requête qu'il ne visait pas.
   */
  function pageTokenQueries(): string[] {
    return allSql().filter(
      (sql) =>
        sql.includes('from "UsageEvent"') &&
        // Le classement par modèle : `coalesce("model", …)` est sa signature.
        (sql.includes('coalesce("model"') ||
          // La série : un `date_trunc` de semaine ou de mois SUR `"UsageEvent"`,
          // avec les deux bornes de période et sans `limit`.
          (sql.includes("date_trunc(") &&
            !sql.includes("date_trunc('day'") &&
            !sql.includes("limit")))
    );
  }

  it("filtre le mode sur la colonne figée, jamais par jointure", async () => {
    // Période 30 j : elle court-circuite l'ancre « tout l'historique » et atteint
    // les agrégats, qui sont les requêtes à inspecter.
    await getUsageStats(
      { id: "1" },
      { ...allTime, mode: "chat", period: "30d" }
    );

    const queries = pageTokenQueries();
    expect(queries.length).toBeGreaterThan(0);
    for (const sql of queries) {
      // Le classement par modèle ET la série de consommation doivent être filtrés
      // tous les deux : n'en filtrer qu'un laisserait les deux graphiques se
      // contredire sur la même période.
      expect(sql).toContain('"UsageEvent"."chatMode"');
      // C'est la jointure, et elle seule, qui faisait disparaître les
      // conversations supprimées du chiffre.
      expect(sql).not.toContain('join "Chat"');
    }
  });

  it("filtre le projet sur sa colonne figée", async () => {
    await getUsageStats(
      { id: "1" },
      {
        ...allTime,
        period: "30d",
        projectId: "11111111-1111-1111-1111-111111111111",
      }
    );

    const queries = pageTokenQueries();
    expect(queries.length).toBeGreaterThan(0);
    for (const sql of queries) {
      expect(sql).toContain('"UsageEvent"."chatProjectId"');
      expect(sql).not.toContain('join "Chat"');
    }
  });

  it("n'exclut aucune ligne du total global", async () => {
    await getUsageStats({ id: "1" }, { ...allTime, period: "30d" });

    const queries = pageTokenQueries();
    expect(queries.length).toBeGreaterThan(0);
    for (const sql of queries) {
      // Le cas le plus important. Sans filtre, AUCUNE ligne de consommation ne
      // doit être écartée : une conversation supprimée a bien consommé, et son
      // total doit rester dans le chiffre global.
      expect(sql).not.toContain('"UsageEvent"."chatMode"');
      expect(sql).not.toContain('join "Chat"');
    }
  });
});

describe("Classement des modèles compatible PostgreSQL", () => {
  beforeEach(() => {
    captured.calls.length = 0;
  });
  it("utilise le même regroupement pour les modèles absents et inconnus", async () => {
    await getUsageStats({ id: "1" }, { ...allTime, period: "30d" });
    const ranking = captured.calls.find(
      ({ sql }) =>
        sql.includes('"model"') &&
        sql.includes("coalesce(") &&
        sql.includes("group by") &&
        !sql.includes("date_trunc")
    );
    expect(ranking).toBeDefined();
    // Le fallback figure à l'identique dans les deux expressions, jamais sous
    // deux paramètres distincts ($1 / $7), rejetés par PostgreSQL.
    expect(
      ranking?.sql.match(/coalesce\((?:"UsageEvent"\.)?"model", 'inconnu'\)/g)
    ).toHaveLength(2);
    expect(ranking?.params).not.toContain("inconnu");
  });
});
