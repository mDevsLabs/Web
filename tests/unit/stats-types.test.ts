import { describe, expect, it } from "vitest";
import {
  bucketKey,
  buildBucketAxis,
  buildStatsQueryString,
  countBuckets,
  DEFAULT_STATS_QUERY,
  isStatsKind,
  isStatsMode,
  isStatsPeriod,
  MAX_SERIES_POINTS,
  niceTicks,
  resolveGranularity,
  resolvePeriodStart,
  STATS_KINDS,
  STATS_MODES,
  STATS_PERIODS,
} from "@/lib/stats/stats-types";

// Le module est volontairement pur (aucun accès base, aucun import serveur) :
// c'est ce qui permet à la page et à la route API de partager le vocabulaire et
// la construction de la query string sans franchir la frontière `server-only`.
// Ces tests verrouillent cette logique pure — en particulier l'ALIGNEMENT des
// buckets sur `date_trunc`, qui conditionne l'exactitude des deux graphiques.

const NOW = new Date("2026-03-15T12:00:00.000Z");

describe("Vocabulaire des statistiques", () => {
  it("rejette toute valeur hors des listes blanches", () => {
    for (const period of STATS_PERIODS) {
      expect(isStatsPeriod(period)).toBe(true);
    }
    expect(isStatsPeriod("6d")).toBe(false);
    expect(isStatsPeriod(undefined)).toBe(false);
    // Un `period` invalide NE DOIT PAS passer : c'est ce qui ferait échouer le
    // type de la fenêtre plutôt que de retomber sur un défaut silencieux.
    expect(isStatsPeriod("ALL")).toBe(false);

    for (const mode of STATS_MODES) {
      expect(isStatsMode(mode)).toBe(true);
    }
    expect(isStatsMode("planning")).toBe(false);

    for (const kind of STATS_KINDS) {
      expect(isStatsKind(kind)).toBe(true);
    }
    expect(isStatsKind("video")).toBe(false);
  });
});

describe("Fenêtre de la période", () => {
  it("retranche le nombre de jours demandé", () => {
    expect(resolvePeriodStart("7d", NOW)?.toISOString()).toBe(
      "2026-03-08T12:00:00.000Z"
    );
    expect(resolvePeriodStart("30d", NOW)?.toISOString()).toBe(
      "2026-02-13T12:00:00.000Z"
    );
    expect(resolvePeriodStart("90d", NOW)?.toISOString()).toBe(
      "2025-12-15T12:00:00.000Z"
    );
  });

  it("retrauche un mois calendaire pour « 12 mois »", () => {
    // Un mois calendaire, pas 365 jours : c'est la seule unité qui rende
    // « 12 mois » et « année dernière » équivalents.
    expect(resolvePeriodStart("12m", NOW)?.toISOString()).toBe(
      "2025-03-15T12:00:00.000Z"
    );
  });

  it("retrauche exactement douze mois calendaires, quelle que soit la longueur du mois", () => {
    // Le même jour du même mois, un an d'écart : c'est bien « l'an dernier » et
    // non « 365 jours ». Le cas du 29 février décalé en mars est le comportement
    // natif de `setUTCMonth` — acceptable, et c'est pourquoi la borne est posée
    // ici plutôt que recalculée à chaque rendu.
    expect(
      resolvePeriodStart("12m", new Date("2026-08-15T09:00:00Z"))?.toISOString()
    ).toBe("2025-08-15T09:00:00.000Z");
    expect(
      resolvePeriodStart("12m", new Date("2024-02-29T09:00:00Z"))?.toISOString()
    ).toBe("2023-03-01T09:00:00.000Z");
  });

  it("renvoie null pour « tout », pas une date arbitraire", () => {
    // `null` est le signal qui déclenche l'ancrage sur la plus ancienne donnée
    // réelle plutôt que sur une epoch choisie à l'avance.
    expect(resolvePeriodStart("all", NOW)).toBeNull();
  });
});

describe("Granularité des séries", () => {
  it("compte les buckets selon la granularité", () => {
    const from = new Date("2026-01-01T00:00:00.000Z");
    const to = new Date("2026-01-29T00:00:00.000Z");
    // 28 jours = 4 semaines pleines.
    expect(countBuckets(from, to, "week")).toBe(4);
    // Un seul mois calendaire, même si la fenêtre n'en couvre qu'une partie.
    expect(countBuckets(from, to, "month")).toBe(1);
  });

  it("conserve le mois quand l'historique est court", () => {
    const from = new Date("2026-01-01T00:00:00.000Z");
    const to = new Date("2026-03-01T00:00:00.000Z");
    expect(resolveGranularity(from, to, "week")).toBe("week");
  });

  it("regroupe en mois plutôt que de dépasser le plafond", () => {
    // Plus de 104 semaines d'historique : on coarsener, on ne tronque pas.
    // Tronquer supprimerait la période la plus récente, qui est la seule que
    // l'utilisateur consulte.
    const from = new Date("2023-01-01T00:00:00.000Z");
    const to = new Date("2026-01-01T00:00:00.000Z");
    expect(countBuckets(from, to, "week")).toBeGreaterThan(MAX_SERIES_POINTS);
    expect(resolveGranularity(from, to, "week")).toBe("month");
  });

  it("dégrade une série vide en une seule graduation plutôt qu'en zéro", () => {
    const instant = new Date("2026-01-01T00:00:00.000Z");
    expect(countBuckets(instant, instant, "week")).toBe(1);
  });
});

describe("Axe des buckets", () => {
  it("aligne les semaines sur le lundi, comme date_trunc de Postgres", () => {
    // 2026-03-15 est un dimanche. Postgres `date_trunc('week', …)` ramène au
    // lundi 2026-03-09 : un axe aligné sur le dimanche ferait correspondre les
    // libellés à des lignes SQL décalées d'un jour.
    const axis = buildBucketAxis(NOW, NOW, "week");
    expect(axis[0]?.toISOString().slice(0, 10)).toBe("2026-03-09");
  });

  it("aligne les mois sur le 1er", () => {
    const axis = buildBucketAxis(NOW, NOW, "month");
    expect(axis[0]?.toISOString().slice(0, 10)).toBe("2026-03-01");
  });

  it("produit un axe continu, sans trou ni doublon", () => {
    const from = new Date("2026-01-05T00:00:00.000Z");
    const to = new Date("2026-03-20T00:00:00.000Z");
    const weeks = buildBucketAxis(from, to, "week").map(bucketKey);
    expect(new Set(weeks).size).toBe(weeks.length);
    for (let index = 1; index < weeks.length; index++) {
      const previous = new Date(`${weeks[index - 1]}T00:00:00Z`);
      const current = new Date(`${weeks[index]}T00:00:00Z`);
      expect(current.getTime() - previous.getTime()).toBe(7 * 86_400_000);
    }
  });

  it("inclut le bucket qui contient la date de fin", () => {
    // Un bucket sans donnée doit exister : une semaine inactive qui disparaît
    // de l'axe se lit comme une rupture d'activité qui n'a jamais eu lieu.
    const from = new Date("2026-01-05T00:00:00.000Z");
    const axis = buildBucketAxis(from, NOW, "week");
    expect(axis.at(-1)?.toISOString().slice(0, 10)).toBe("2026-03-09");
  });

  it("ne boucle pas sur une fenêtre inversée", () => {
    const axis = buildBucketAxis(
      new Date("2026-03-20T00:00:00.000Z"),
      new Date("2026-01-01T00:00:00.000Z"),
      "week"
    );
    expect(axis).toHaveLength(0);
  });

  it("reste borné sur une fenêtre arbitrairement longue", () => {
    // `all` sur un compte de dix ans ne doit pas matérialiser 500 buckets
    // Heisenberg : la boucle a une borne dure.
    const axis = buildBucketAxis(
      new Date("2010-01-01T00:00:00.000Z"),
      new Date("2026-01-01T00:00:00.000Z"),
      "week"
    );
    expect(axis.length).toBeLessThanOrEqual(MAX_SERIES_POINTS * 4);
  });
});

describe("Query string des statistiques", () => {
  it("omet les filtres absents plutôt que d'envoyer des vides", () => {
    const encoded = buildStatsQueryString(DEFAULT_STATS_QUERY);
    expect(encoded).toContain("period=30d");
    expect(encoded).not.toContain("mode=");
    expect(encoded).not.toContain("model=");
    expect(encoded).not.toContain("projectId=");
    // Les trois types de contenu sont demandés par défaut.
    expect(encoded).toContain("kind=text");
    expect(encoded).toContain("kind=image");
    expect(encoded).toContain("kind=audio");
  });

  it("sérialise les filtres affinés", () => {
    const encoded = buildStatsQueryString({
      kinds: ["audio"],
      mode: "agent",
      model: "gemini/gemini-3.8-flash",
      period: "all",
      projectId: "abc-123",
    });
    expect(encoded).toContain("period=all");
    expect(encoded).toContain("mode=agent");
    expect(encoded).toContain("model=gemini%2Fgemini-3.8-flash");
    expect(encoded).toContain("projectId=abc-123");
    expect(encoded).toContain("kind=audio");
    expect(encoded).not.toContain("kind=text");
  });
});

describe("Graduations des graphiques", () => {
  // Régression : `niceTicks` divisait le maximum par `count` puis laissait
  // `Math.log10` descendre l'ordre de grandeur sous 1. Pour un maximum de 1, le
  // pas devenait 0,5 et les valeurs arrondies se confondaient — deux
  // graduations « 1 », donc deux clés React dupliquées et une ligne d'axe
  // dessinée deux fois au même endroit. Les séries comptant des entiers, le pas
  // ne peut pas descendre sous 1.
  it("ne produit jamais deux graduations identiques, quel que soit le maximum", () => {
    for (let max = 0; max <= 500; max++) {
      for (const count of [3, 4]) {
        const ticks = niceTicks(max, count);
        expect(ticks.length).toBeGreaterThan(0);
        expect(new Set(ticks).size).toBe(ticks.length);
        for (const tick of ticks) {
          expect(Number.isInteger(tick)).toBe(true);
          expect(tick).toBeGreaterThanOrEqual(0);
        }
        // Croissance stricte : chaque graduation peut servir de clé d'axe.
        for (let i = 1; i < ticks.length; i++) {
          expect(ticks[i]).toBeGreaterThan(ticks[i - 1]);
        }
      }
    }
  });

  it("reste croissant sur les grands ordres de grandeur et ne boucle pas", () => {
    expect(niceTicks(1, 3)).toEqual([0, 1]);
    expect(niceTicks(0)).toEqual([0]);
    expect(niceTicks(3, 3)).toEqual([0, 1, 2, 3]);
    // Un maximum non fini ne doit pas produire de `NaN` ni boucler.
    expect(niceTicks(Number.POSITIVE_INFINITY)).toEqual([0]);
    expect(niceTicks(Number.NaN)).toEqual([0]);

    for (const max of [12, 47, 320, 1500, 48_000, 3_200_000]) {
      const ticks = niceTicks(max, 4);
      expect(new Set(ticks).size).toBe(ticks.length);
      // La dernière graduation reste à moins d'un pas du maximum : l'axe ne
      // sature pas très loin au-dessus des données.
      const step = (ticks.at(1) ?? 1) - (ticks.at(0) ?? 0);
      expect((ticks.at(-1) ?? 0) + step).toBeGreaterThanOrEqual(max);
    }
  });
});
