import { afterEach, describe, expect, it, vi } from "vitest";
import { getAirQuality, getAirQualityOutlook } from "@/lib/plugins/air-quality";
import {
  compareEurostatCountries,
  getEurostatData,
} from "@/lib/plugins/eurostat";
import { jsonToolbox } from "@/lib/plugins/json-toolbox";
import { gradeQuiz } from "@/lib/plugins/quizzly";
import { fetchPublicJson } from "@/lib/plugins/shared/public-api";
import { compareWeather, getWeather } from "@/lib/plugins/weather";
import { getWikidataEntities, getWikidataEntity } from "@/lib/plugins/wikidata";

const TOOL_CALL_OPTIONS = {
  abortSignal: new AbortController().signal,
  context: {},
  messages: [],
  toolCallId: "test-call",
} as const;

type ExecutableTool = {
  execute?: (input: never, options: never) => unknown;
};

async function runTool<TInput>(
  tool: unknown,
  input: TInput
): Promise<Record<string, unknown>> {
  const execute = (tool as ExecutableTool).execute;
  expect(execute).toBeTypeOf("function");
  return (await execute?.(
    input as never,
    TOOL_CALL_OPTIONS as never
  )) as Record<string, unknown>;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

const GEOCODING = "https://geocoding-api.open-meteo.com";

const CITIES: Record<
  string,
  { country: string; latitude: number; longitude: number; name: string }
> = {
  "Lyon, France": {
    country: "France",
    latitude: 45.76,
    longitude: 4.84,
    name: "Lyon",
  },
  "Paris, France": {
    country: "France",
    latitude: 48.85,
    longitude: 2.35,
    name: "Paris",
  },
};

function stubGeocoding() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (url.hostname === "geocoding-api.open-meteo.com") {
        const match = CITIES[url.searchParams.get("name") ?? ""];
        return Response.json({ results: match ? [match] : [] });
      }
      return new Response("unexpected host", { status: 500 });
    })
  );
}

describe("Météo enrichie", () => {
  const FORECAST = {
    current: {
      apparent_temperature: 17.4,
      interval: 900,
      is_day: 1,
      relative_humidity_2m: 55,
      temperature_2m: 18.2,
      time: "2026-09-28T10:00",
      weather_code: 3,
      wind_speed_10m: 22,
    },
    daily: {
      precipitation_sum: [0],
      sunrise: ["2026-09-28T07:31"],
      sunset: ["2026-09-28T19:45"],
      temperature_2m_max: [21],
      temperature_2m_min: [11],
      time: ["2026-09-28"],
      weather_code: [3],
      wind_speed_10m_max: [25],
    },
    hourly: { temperature_2m: [18.2], time: ["2026-09-28T10:00"] },
    latitude: 48.85,
    longitude: 2.35,
  };

  function stubForecast(temperatures: Record<string, number>) {
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = new URL(String(input));
        calls.push(url.href);
        if (url.hostname === "geocoding-api.open-meteo.com") {
          const match = CITIES[url.searchParams.get("name") ?? ""];
          return Response.json({ results: match ? [match] : [] });
        }
        const key = url.searchParams.get("latitude") ?? "";
        const temperature =
          temperatures[key] ?? FORECAST.current.temperature_2m;
        return Response.json({
          ...FORECAST,
          current: { ...FORECAST.current, temperature_2m: temperature },
        });
      })
    );
    return calls;
  }

  it("expose l'unité de vent demandée, l'historique et un résumé citable", async () => {
    const calls = stubForecast({});
    const result = await runTool(getWeather, {
      city: "Paris, France",
      pastDays: 7,
      units: "celsius",
      windSpeedUnit: "kn",
    });

    const forecastCall = calls.at(-1) ?? "";
    expect(forecastCall).toContain("wind_speed_unit=kn");
    expect(forecastCall).toContain("past_days=7");
    expect(result.units).toEqual({ temperature: "°C", wind: "nœuds" });
    // Lever/coucher remontés dans `current` : plus besoin de fouiller `daily`.
    expect(result.current).toMatchObject({
      sunrise: "2026-09-28T07:31",
      sunset: "2026-09-28T19:45",
    });
    expect(String(result.summary)).toContain("18 °C");
    expect(String(result.summary)).toContain("couvert");
    expect(result.location).toEqual({
      latitude: 48.85,
      longitude: 2.35,
      name: "Paris, France",
    });
    expect((result.source as { url: string }).url).toContain("open-meteo.com");
  });

  it("borne une demande de prévision hors limites au lieu de la laisser filer", async () => {
    const calls = stubForecast({});
    const result = await runTool(getWeather, {
      city: "Paris, France",
      forecastDays: 99,
      pastDays: 900,
    });
    // Le SDK valide l'entrée, mais l'outil se borne lui-même : un appel direct
    // ne doit pas pouvoir demander 99 jours de prévision ni 900 jours
    // d'historique au service amont.
    expect(calls.at(-1)).toContain("forecast_days=7");
    expect(calls.at(-1)).toContain("past_days=92");
  });

  it("compare plusieurs villes et désigne le classement", async () => {
    stubForecast({ "45.76": 24.6, "48.85": 18.2 });
    const result = await runTool(compareWeather, {
      cities: ["Paris, France", "Lyon, France"],
      units: "celsius",
    });

    expect(result.compared).toBe(2);
    expect(result.ranking).toEqual({
      coldest: "Paris, France",
      mostWindy: "Paris, France",
      warmest: "Lyon, France",
    });
    expect(result.temperatureSpread).toBe(6.4);
    const cities = result.cities as Array<{ temperature: number }>;
    expect(cities.map((entry) => entry.temperature)).toEqual([18.2, 24.6]);
  });

  it("refuse une comparaison d'une seule ville", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await runTool(compareWeather, {
      cities: ["Paris, France", "Paris, France"],
    });
    expect(String(result.error)).toContain("deux villes");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("signale une ville introuvable sans avaler les autres résultats", async () => {
    stubForecast({ "45.76": 24.6 });
    const result = await runTool(compareWeather, {
      cities: ["Lyon, France", "VilleInconnue"],
    });
    expect(result.compared).toBe(1);
    expect(result.failed).toBe(1);
  });
});

describe("Qualité de l'air enrichie", () => {
  const AIR_QUALITY = "https://air-quality-api.open-meteo.com";

  function stubAirQuality(hourly: Record<string, unknown>) {
    stubGeocodingCalls();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.startsWith(GEOCODING)) {
          return Response.json({
            results: [
              {
                country: "France",
                latitude: 48.85,
                longitude: 2.35,
                name: "Paris",
              },
            ],
          });
        }
        expect(url.startsWith(AIR_QUALITY)).toBe(true);
        return Response.json(hourly);
      })
    );
  }

  function stubGeocodingCalls() {}

  it("nomme le polluant dominant et donne une conduite à tenir", async () => {
    stubAirQuality({
      current: {
        european_aqi: 72,
        nitrogen_dioxide: 10,
        ozone: 40,
        pm2_5: 30,
        pm10: 20,
      },
      current_units: { european_aqi: "EAQI" },
    });
    const result = await runTool(getAirQuality, { city: "Paris" });

    expect(result.current).toMatchObject({
      aqiLevel: "Mauvais",
      european_aqi: 72,
    });
    // PM2.5 = 2× sa ligne directrice OMS, le plus haut ratio des six polluants.
    expect(result.dominantPollutant).toBe("Particules fines PM2.5");
    expect(String(result.healthAdvice)).toContain("Évitez l'effort physique");
    expect(String(result.outdoorAdvice)).toContain("Sport en intérieur");
    const pollutants = result.pollutants as Array<{
      exceedsGuideline: boolean;
      name: string;
      ratioToGuideline: number;
    }>;
    expect(pollutants[0]).toMatchObject({
      exceedsGuideline: true,
      name: "pm2_5",
      ratioToGuideline: 2,
    });
  });

  it("agrège la journée et désigne la fenêtre la plus propre", async () => {
    const hours = ["05", "06", "07", "08", "09", "10"];
    stubAirQuality({
      current: { european_aqi: 70 },
      current_units: { european_aqi: "EAQI" },
      hourly: {
        european_aqi: [70, 30, 25, 28, 60, 80],
        time: hours.map((hour) => `2026-09-28T${hour}:00`),
      },
    });
    const result = await runTool(getAirQualityOutlook, {
      city: "Paris",
      days: 1,
    });

    const days = result.days as Array<{
      bestOutdoorWindow: { from: string; level: string };
      max: number;
      mean: number;
      min: number;
    }>;
    expect(days).toHaveLength(1);
    expect(days[0].min).toBe(25);
    expect(days[0].max).toBe(80);
    expect(days[0].mean).toBe(48.8);
    // Créneau de 3 h le plus propre : 06:00-09:00, pas le point isolé de 07:00.
    expect(days[0].bestOutdoorWindow).toMatchObject({
      from: "2026-09-28T06:00",
      level: "Correct",
    });
    expect(result.overallLevel).toBe("Moyen");
  });

  it("refuse d'inventer une prévision horaire absente", async () => {
    stubAirQuality({ current: { european_aqi: 30 } });
    const result = await runTool(getAirQualityOutlook, { city: "Paris" });
    expect(String(result.error)).toContain("prévision horaire");
  });
});

describe("Boîte à outils JSON enrichie", () => {
  const DOC = '{"user":{"name":"Ada","tags":["a","b"],"age":36},"ok":true}';

  it("extrait une valeur par chemin pointé ou JSON Pointer", async () => {
    const dotted = await runTool(jsonToolbox, {
      operation: "get",
      path: "user.tags[1]",
      payload: DOC,
    });
    expect(dotted).toMatchObject({ found: true, result: "b", type: "string" });

    const pointer = await runTool(jsonToolbox, {
      operation: "get",
      path: "/user/age",
      payload: DOC,
    });
    expect(pointer).toMatchObject({ found: true, result: 36, type: "number" });

    const missing = await runTool(jsonToolbox, {
      operation: "get",
      path: "user.missing.deep",
      payload: DOC,
    });
    expect(missing).toMatchObject({ found: false, result: null });
  });

  it("aplatit en paires clé/valeur", async () => {
    const result = await runTool(jsonToolbox, {
      operation: "flatten",
      payload: '{"a":{"b":[1,2]}}',
      separator: "/",
    });
    expect(result.entries).toEqual({ "$/a/b/0": 1, "$/a/b/1": 2 });
    expect(result.total).toBe(2);
  });

  it("fusionne en profondeur, écrase ou concatène", async () => {
    const deep = await runTool(jsonToolbox, {
      compareTo: '{"a":{"c":3},"d":4}',
      operation: "merge",
      payload: '{"a":{"b":1,"c":2},"d":0}',
      strategy: "deep",
    });
    expect(JSON.parse(String(deep.result))).toEqual({
      a: { b: 1, c: 3 },
      d: 4,
    });

    const replaced = await runTool(jsonToolbox, {
      compareTo: '{"a":{"c":3}}',
      operation: "merge",
      payload: '{"a":{"b":1,"c":2}}',
      strategy: "replace",
    });
    expect(JSON.parse(String(replaced.result))).toEqual({ a: { c: 3 } });

    const concat = await runTool(jsonToolbox, {
      compareTo: "[2,3]",
      operation: "merge",
      payload: "[1]",
      strategy: "concat",
    });
    expect(JSON.parse(String(concat.result))).toEqual([1, 2, 3]);
  });

  it("projette une sélection et signale les chemins absents", async () => {
    const result = await runTool(jsonToolbox, {
      operation: "pick",
      paths: ["user.name", "user.age", "nope"],
      payload: DOC,
    });
    expect(result.total).toBe(3);
    expect(result.found).toBe(2);
    expect(result.missing).toEqual(["nope"]);
    expect(result.selected).toEqual({ "user.age": 36, "user.name": "Ada" });
  });

  it("établit une statistique descriptive du document", async () => {
    const result = await runTool(jsonToolbox, {
      operation: "stats",
      payload: '{"a":1,"b":[10,20,30],"c":{"a":1,"d":"xyz"}}',
    });
    const stats = result.stats as {
      depth: number;
      keys: { distinct: number; mostFrequent: Array<{ key: string }> };
      nodes: number;
      numbers: { count: number; max: number; mean: number; min: number };
      strings: { maxLength: number };
    };
    expect(stats.nodes).toBeGreaterThan(5);
    expect(stats.depth).toBe(3);
    // 1, 10, 20, 30 puis le 1 imbriqué : cinq nombres, pas quatre.
    expect(stats.numbers).toMatchObject({ count: 5, max: 30, min: 1 });
    expect(stats.strings.maxLength).toBe(3);
    expect(stats.keys.mostFrequent[0]?.key).toBe("a");
  });

  it("exige les arguments propres à chaque opération", async () => {
    const noPath = await runTool(jsonToolbox, {
      operation: "get",
      payload: "{}",
    });
    expect(String(noPath.error)).toContain("path");

    const noSecond = await runTool(jsonToolbox, {
      operation: "merge",
      payload: "{}",
    });
    expect(String(noSecond.error)).toContain("compareTo");

    const noPaths = await runTool(jsonToolbox, {
      operation: "pick",
      payload: "{}",
    });
    expect(String(noPaths.error)).toContain("paths");
  });
});

describe("Correction d'un quiz (locale et déterministe)", () => {
  const QUESTIONS = [
    {
      correctAnswers: [1],
      explanation: "2 + 2 = 4",
      id: "q1",
      options: ["3", "4", "5"],
      question: "Combien font 2 + 2 ?",
      type: "single_choice" as const,
    },
    {
      correctAnswers: [0, 2],
      explanation: "Le carré a quatre côtés égaux",
      id: "q2",
      options: ["Carré", "Losange", "Cercle"],
      question: "Quelles figures ont quatre côtés ?",
      type: "multiple_choice" as const,
    },
    {
      correctAnswers: [0],
      explanation: "Capitale de la France",
      id: "q3",
      options: ["Paris", "Lyon"],
      question: "Capitale de la France ?",
      type: "single_choice" as const,
    },
  ];

  it("note juste, tient compte des questions sans réponse et isole les rates", async () => {
    const result = await runTool(gradeQuiz, {
      answers: [
        { questionId: "q1", selectedIndexes: [1] },
        { questionId: "q2", selectedIndexes: [2, 0] },
        { questionId: "q3", selectedIndexes: [1] },
      ],
      questions: QUESTIONS,
    });

    expect(result.totalCount).toBe(3);
    expect(result.correctCount).toBe(2);
    expect(result.incorrectCount).toBe(1);
    expect(result.unansweredCount).toBe(0);
    expect(result.scorePercent).toBe(66.7);
    const results = result.results as Array<{
      expectedIndexes: number[];
      givenIndexes: number[];
      status: string;
    }>;
    // q2 est juste malgré l'ordre des choix : la comparaison porte sur des
    // ensembles triés, pas sur l'ordre de saisie.
    expect(results[1]).toMatchObject({
      expectedIndexes: [0, 2],
      status: "correct",
    });
    expect(results[2]).toMatchObject({
      givenIndexes: [1],
      status: "incorrect",
    });
    expect(result.byType).toEqual([
      { correct: 1, successRate: 50, total: 2, type: "single_choice" },
      { correct: 1, successRate: 100, total: 1, type: "multiple_choice" },
    ]);
  });

  it("compte « sans réponse » une question absente et signale les ids inconnus", async () => {
    const result = await runTool(gradeQuiz, {
      answers: [{ questionId: "inconnue", selectedIndexes: [0] }],
      questions: QUESTIONS,
    });
    expect(result.unansweredCount).toBe(3);
    expect(result.unknownQuestionIds).toEqual(["inconnue"]);
  });
});

describe("Wikidata enrichi", () => {
  it("traduit les identifiants de propriétés et d'entités en libellés", async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        calls.push(url);
        if (url.includes("Special:EntityData")) {
          return Response.json({
            entities: {
              Q42: {
                claims: {
                  P31: [{ mainsnak: { datavalue: { value: { id: "Q5" } } } }],
                },
                descriptions: { fr: { language: "fr", value: "écrivain" } },
                labels: { fr: { language: "fr", value: "Douglas Adams" } },
              },
            },
          });
        }
        return Response.json({
          entities: {
            P31: { labels: { fr: { language: "fr", value: "instance de" } } },
            Q5: { labels: { fr: { language: "fr", value: "humain" } } },
          },
        });
      })
    );

    const result = await runTool(getWikidataEntity, {
      entityId: "q42",
      language: "fr",
    });
    expect(calls.at(-1)).toContain("action=wbgetentities");
    const entity = result.entity as {
      claims: Array<{
        label: string;
        property: string;
        values: Array<{ label: string }>;
      }>;
    };
    expect(entity.claims[0]).toMatchObject({
      label: "instance de",
      property: "P31",
    });
    expect(entity.claims[0]?.values[0]).toMatchObject({
      entityId: "Q5",
      label: "humain",
    });
    expect(result.unresolvedLabels).toBe(false);
  });

  it("conserve les identifiants quand la résolution des libellés échoue", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) =>
        String(input).includes("Special:EntityData")
          ? Response.json({
              entities: {
                Q1: {
                  claims: {
                    P31: [{ mainsnak: { datavalue: { value: { id: "Q5" } } } }],
                  },
                },
              },
            })
          : new Response("boom", { status: 500 })
      )
    );
    const result = await runTool(getWikidataEntity, { entityId: "Q1" });
    const entity = result.entity as {
      claims: Array<{ values: Array<{ label: string }> }>;
    };
    expect(entity.claims[0]?.values[0]?.label).toBe("Q5");
    expect(result.unresolvedLabels).toBe(true);
  });

  it("lit plusieurs entités en une requête et signale les identifiants absents", async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = new URL(String(input));
        calls.push(url.href);
        return Response.json({
          entities: {
            Q42: {
              claims: { P31: [] },
              descriptions: { fr: { language: "fr", value: "écrivain" } },
              labels: { fr: { language: "fr", value: "Douglas Adams" } },
              sitelinks: { enwiki: { site: "enwiki", title: "Douglas Adams" } },
            },
          },
        });
      })
    );

    const result = await runTool(getWikidataEntities, {
      entityIds: ["q42", "Q9999999"],
      language: "fr",
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain("action=wbgetentities");
    expect(calls[0]).toContain("ids=Q42%7CQ9999999");
    expect(result.entities).toEqual([
      {
        description: "écrivain",
        id: "Q42",
        label: "Douglas Adams",
        properties: 0,
        sitelinkCount: 1,
        url: "https://www.wikidata.org/wiki/Q42",
      },
    ]);
    expect(result.missing).toEqual(["Q9999999"]);
  });
});

describe("Eurostat enrichi", () => {
  const GRID = {
    dimension: {
      geo: {
        category: {
          index: { DE: 0, FR: 1 },
          label: { DE: "Allemagne", FR: "France" },
        },
        label: "Pays",
      },
      time: {
        category: {
          index: { "2020": 0, "2021": 1 },
          label: { "2020": "2020", "2021": "2021" },
        },
        label: "Année",
      },
    },
    id: ["geo", "time"],
    label: "Test",
    size: [2, 2],
    updated: "2026-09-25T00:00:00Z",
    value: { "0": 30, "1": 40, "2": 10, "3": 20 },
  };

  function stubEurostat() {
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        calls.push(String(input));
        return Response.json(GRID);
      })
    );
    return calls;
  }

  it("réduit le détail des dimensions aux codes réellement utilisés", async () => {
    stubEurostat();
    const full = await runTool(getEurostatData, {
      dataset: "nama_10_gdp",
      dimensionsDetail: "full",
      geo: ["FR", "DE"],
      time: "2020",
    });
    expect(
      (full.dimensions as Array<{ values: unknown[] }>)[0]?.values
    ).toHaveLength(2);

    // `used` se calcule sur les observations RÉTURNÉES : avec limit 1, une seule
    // observation subsiste (DE/2020) et l'autre pays ne doit plus être listé.
    const used = await runTool(getEurostatData, {
      dataset: "nama_10_gdp",
      dimensionsDetail: "used",
      geo: ["FR", "DE"],
      limit: 1,
      time: ["2020", "2021"],
    });
    const dimensions = used.dimensions as Array<{
      id: string;
      values: Array<{ code: string }>;
    }>;
    expect(
      dimensions
        .find((dimension) => dimension.id === "geo")
        ?.values.map((value) => value.code)
    ).toEqual(["DE"]);
    expect(
      dimensions
        .find((dimension) => dimension.id === "time")
        ?.values.map((value) => value.code)
    ).toEqual(["2020"]);
    expect(used.totalMatches).toBe(4);
    expect(used.totalReturned).toBe(1);

    const none = await runTool(getEurostatData, {
      dataset: "nama_10_gdp",
      dimensionsDetail: "none",
      geo: "FR",
      limit: 1,
      time: "2020",
    });
    expect(none.dimensions).toEqual([]);
    expect((none.observations as unknown[]).length).toBe(1);
  });

  it("classe les pays, calcule l'écart au leader et l'évolution", async () => {
    const calls = stubEurostat();
    const result = await runTool(compareEurostatCountries, {
      dataset: "nama_10_gdp",
      geo: ["FR", "DE"],
      time: ["2020", "2021"],
    });

    expect(calls[0]).toContain("geo=FR%2BDE");
    const countries = result.countries as Array<{
      change: number;
      country: string;
      gapToLeader: number;
      label: string;
      period: string;
      rank: number;
      series: Array<{ period: string; value: number }>;
      value: number;
    }>;
    expect(countries.map((entry) => entry.country)).toEqual(["DE", "FR"]);
    expect(countries[0]).toMatchObject({
      label: "Allemagne",
      period: "2021",
      rank: 1,
      value: 40,
    });
    expect(countries[1]?.gapToLeader).toBe(-20);
    // 10 → 20 sur deux ans : +100 %, pas +200 %.
    expect(countries[1]?.change).toBe(100);
    expect(countries[1]?.series).toEqual([
      { period: "2020", value: 10 },
      { period: "2021", value: 20 },
    ]);
    expect(result.leader).toBe("DE");
    // Moyenne des DERNIÈRES valeurs (40 et 20), pas des quatre cases de la grille.
    expect(result.mean).toBe(30);
    expect(result.totalCompared).toBe(2);
  });

  it("refuse une comparaison d'un seul pays", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await runTool(compareEurostatCountries, {
      dataset: "nama_10_gdp",
      geo: "FR",
    });
    expect(String(result.error)).toContain("deux codes pays");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("Lecture HTTP bornée commune aux plugins", () => {
  it("rejoue une fois un incident 503 puis rend un message transitoire", async () => {
    const fetchMock = vi.fn(async () => new Response("nope", { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await fetchPublicJson("https://api.github.com/repos/a/b");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) {
      expect(result.error).toContain("Service indisponible");
      // « HTTP 5xx » : c'est ce marqueur qui fait classer l'échec en transient.
      expect(result.error).toContain("HTTP 503");
    }
  });

  it("ne rejoue pas un quota atteint et restitue le délai annoncé", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response("", {
          headers: { "retry-after": "42" },
          status: 429,
        })
    );
    vi.stubGlobal("fetch", fetchMock);
    const result = await fetchPublicJson("https://api.github.com/repos/a/b");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    if (!result.ok) {
      expect(result.error).toContain("HTTP 429");
      expect(result.error).toContain("réessayez dans 42 secondes");
    }
  });

  it("distingue un refus d'accès d'une panne, sans mot transitoire", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 403 }))
    );
    const forbidden = await fetchPublicJson("https://api.github.com/repos/a/b");
    expect(forbidden).toMatchObject({ ok: false });
    if (!forbidden.ok) {
      expect(forbidden.error).toContain("Accès refusé");
      // Aucun marqueur transitoire : sinon l'Agent rejouerait indéfiniment.
      for (const marker of ["limite", "délai", "indisponible", "temporaire"]) {
        expect(forbidden.error.toLowerCase()).not.toContain(marker);
      }
    }

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 400 }))
    );
    const badRequest = await fetchPublicJson(
      "https://api.github.com/repos/a/b"
    );
    if (!badRequest.ok) {
      expect(badRequest.error).toContain("HTTP 400");
    }
  });

  it("n'émet aucune requête si l'appelant a déjà abandonné", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();
    controller.abort();
    const result = await fetchPublicJson(
      "https://api.github.com/repos/a/b",
      {},
      { signal: controller.signal }
    );
    expect(fetchMock).not.toHaveBeenCalled();
    if (!result.ok) {
      expect(result.error).toContain("annulée");
    }
  });

  it("applique le plafond d'octets annoncé par l'en-tête", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response("{}", {
            headers: { "content-length": "5_000_000" },
            status: 200,
          })
      )
    );
    const refused = await fetchPublicJson("https://api.github.com/repos/a/b");
    if (!refused.ok) {
      expect(refused.error).toContain("trop volumineuse");
    }

    // Un connecteur qui annonce de grands corps relève son propre plafond.
    const accepted = await fetchPublicJson(
      "https://api.github.com/repos/a/b",
      {},
      {
        maxBytes: 8_000_000,
      }
    );
    expect(accepted.ok).toBe(true);
  });

  it("interrompt la lecture dès que le flux dépasse le plafond", async () => {
    // 1 200 × 1 024 octets = 1,2 Mo : au-delà du mégoctet, et sans content-length
    // à l'en-tête — seul le garde-fou au fil du flux peut arrêter la lecture.
    const oversized = new ReadableStream<Uint8Array>({
      start(controller) {
        const chunk = new TextEncoder().encode("x".repeat(1024));
        for (let index = 0; index < 1200; index += 1) {
          controller.enqueue(chunk);
        }
        controller.close();
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(oversized))
    );
    const result = await fetchPublicJson("https://api.github.com/repos/a/b");
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) {
      expect(result.error).toContain("trop volumineuse");
    }
  });

  it("refuse toujours un hôte absent de la liste blanche", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      fetchPublicJson("https://api.github.com.evil.example/repos/a/b")
    ).resolves.toMatchObject({ error: "Domaine de source non autorisé." });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
