import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isNativeToolId,
  isPluginProvidedToolId,
  NATIVE_TOOL_IDS,
  PLUGIN_PROVIDED_TOOL_IDS,
  TOOL_IDS,
} from "@/lib/ai/tools/ids";
import { getAirQuality } from "@/lib/plugins/air-quality";
import {
  getPluginManifest,
  isPluginOnlyToolId,
  PLUGIN_MANIFEST_LIST,
  PLUGIN_ONLY_TOOL_IDS,
} from "@/lib/plugins/catalog";
import { frHolidays } from "@/lib/plugins/fr-holidays";
import { isLucideIconName } from "@/lib/plugins/icon-allowlist";
import { jsonToolbox } from "@/lib/plugins/json-toolbox";
import { createPluginTools, getPluginDefinition } from "@/lib/plugins/server";

const TOOL_CALL_OPTIONS = {
  abortSignal: new AbortController().signal,
  context: {},
  messages: [],
  toolCallId: "test-call",
} as const;

type ExecutableTool = {
  execute?: (input: never, options: never) => unknown;
};

// Exécute l'outil exactement comme le SDK AI le ferait (entrée validée + options
// d'exécution) sans introduire de `any` dans les tests.
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

describe("Catalogue de plugins", () => {
  it("expose les cinq plugins attendus, avec identifiants uniques", () => {
    const ids = PLUGIN_MANIFEST_LIST.map((plugin) => plugin.id).toSorted(
      (a, b) => a.localeCompare(b)
    );
    expect(ids).toEqual([
      "air-quality",
      "fr-holidays",
      "json-toolbox",
      "quizzly",
      "weather",
    ]);

    const toolIds = PLUGIN_MANIFEST_LIST.map((plugin) => plugin.tool.id);
    expect(new Set(toolIds).size).toBe(toolIds.length);
  });

  it("déclare des permissions explicites, un forfait payant et une icône connue", () => {
    for (const plugin of PLUGIN_MANIFEST_LIST) {
      expect(plugin.version).toMatch(/^\d+\.\d+\.\d+/);
      expect(plugin.category.length).toBeGreaterThan(0);
      expect(plugin.tags.length).toBeGreaterThan(0);
      expect(plugin.tool.label.length).toBeGreaterThan(0);
      expect(plugin.tool.systemHint.length).toBeGreaterThan(0);

      // Les plugins sont réservés aux forfaits payants.
      expect(["plus", "pro", "max"]).toContain(plugin.minTier);

      // Permissions déclaratives obligatoires.
      expect(["none", "read-only"]).toContain(plugin.permissions.network);
      expect(typeof plugin.permissions.readsUserData).toBe("boolean");
      expect(typeof plugin.permissions.writesUserData).toBe("boolean");
      expect(typeof plugin.permissions.requiresApproval).toBe("boolean");
      // Aucun plugin de ce lot n'écrit de donnée utilisateur ; une écriture
      // exigerait une approbation explicite.
      expect(plugin.permissions.requiresApproval).toBe(
        plugin.permissions.writesUserData
      );

      if (plugin.icon.type === "lucide") {
        expect(isLucideIconName(plugin.icon.name)).toBe(true);
      }
    }
  });

  it("ne réutilise jamais un identifiant d'outil implémenté nativement", () => {
    for (const plugin of PLUGIN_MANIFEST_LIST) {
      expect(isNativeToolId(plugin.tool.id)).toBe(false);
      if ((TOOL_IDS as readonly string[]).includes(plugin.tool.id)) {
        expect(isPluginProvidedToolId(plugin.tool.id)).toBe(true);
      }
    }
  });

  it("partitionne TOOL_IDS entre outils natifs et outils fournis par un plugin", () => {
    expect([...NATIVE_TOOL_IDS, ...PLUGIN_PROVIDED_TOOL_IDS].sort()).toEqual(
      [...TOOL_IDS].sort()
    );
    expect(
      new Set([...NATIVE_TOOL_IDS, ...PLUGIN_PROVIDED_TOOL_IDS]).size
    ).toBe(TOOL_IDS.length);
  });

  it("marque comme « plugin uniquement » les outils fournis par un plugin", () => {
    expect(PLUGIN_ONLY_TOOL_IDS).toContain("getWeather");
    expect(PLUGIN_ONLY_TOOL_IDS).toContain("quizzly");
    expect(isPluginOnlyToolId("getWeather")).toBe(true);
    expect(isPluginOnlyToolId("webSearch")).toBe(false);
    expect(isPluginOnlyToolId("mcp_github_list")).toBe(false);
  });

  it("fournit une implémentation exécutable pour chaque manifeste", () => {
    for (const plugin of PLUGIN_MANIFEST_LIST) {
      const definition = getPluginDefinition(plugin.id);
      expect(definition).toBeDefined();
      const tool = definition?.createTool({});
      expect(tool?.description?.length ?? 0).toBeGreaterThan(0);
      expect(typeof tool?.execute).toBe("function");
    }
    expect(getPluginManifest("air-quality")?.tool.id).toBe("getAirQuality");
  });

  it("n'instancie que les outils des plugins autorisés", () => {
    const all = createPluginTools({});
    expect(Object.keys(all).toSorted((a, b) => a.localeCompare(b))).toEqual(
      PLUGIN_MANIFEST_LIST.map((plugin) => plugin.tool.id).toSorted((a, b) =>
        a.localeCompare(b)
      )
    );
    const scoped = createPluginTools({}, ["fr-holidays"]);
    expect(Object.keys(scoped)).toEqual(["frHolidays"]);
    expect(createPluginTools({}, [])).toEqual({});
  });
});

describe("Plugin Boîte à outils JSON (100 % local)", () => {
  it("valide un document et expose sa forme", async () => {
    const result = await runTool(jsonToolbox, {
      operation: "validate",
      payload: '{"a":1,"b":[1,2]}',
    });
    expect(result).toMatchObject({
      depth: 3,
      operation: "validate",
      topLevelType: "object",
      valid: true,
    });
  });

  it("signale une syntaxe invalide sans lever", async () => {
    const result = await runTool(jsonToolbox, {
      operation: "validate",
      payload: '{"a":',
    });
    expect(result.valid).toBeUndefined();
    expect(String(result.error)).toContain("Syntaxe JSON invalide");
  });

  it("formate et minifie", async () => {
    const formatted = await runTool(jsonToolbox, {
      operation: "format",
      payload: '{"a":1}',
    });
    expect(formatted.result).toBe('{\n  "a": 1\n}');

    const minified = await runTool(jsonToolbox, {
      operation: "minify",
      payload: '{\n  "a": 1\n}',
    });
    expect(minified.result).toBe('{"a":1}');
  });

  it("compare deux documents", async () => {
    const result = await runTool(jsonToolbox, {
      compareTo: '{"a":1,"c":3}',
      operation: "diff",
      payload: '{"a":1,"b":2}',
    });
    expect(result.identical).toBe(false);
    const differences = result.differences as Array<{ kind: string }>;
    expect(
      differences
        .map((entry) => entry.kind)
        .toSorted((a, b) => a.localeCompare(b))
    ).toEqual(["added", "removed"]);
  });

  it("liste les chemins d'accès", async () => {
    const result = await runTool(jsonToolbox, {
      operation: "paths",
      payload: '{"a":{"b":[1]}}',
    });
    const paths = (result.entries as Array<{ path: string }>).map(
      (entry) => entry.path
    );
    expect(paths).toContain("$.a.b[0]");
  });

  it("refuse un document trop volumineux ou trop profond", async () => {
    const tooBig = await runTool(jsonToolbox, {
      operation: "validate",
      payload: `"${"x".repeat(262_145)}"`,
    });
    expect(String(tooBig.error)).toContain("limite");

    let deep: unknown = 1;
    for (let index = 0; index < 70; index += 1) {
      deep = { nested: deep };
    }
    const tooDeep = await runTool(jsonToolbox, {
      operation: "validate",
      payload: JSON.stringify(deep),
    });
    expect(String(tooDeep.error)).toContain("profondeur");
  });

  it("exige un second document pour l'opération diff", async () => {
    const result = await runTool(jsonToolbox, {
      operation: "diff",
      payload: "{}",
    });
    expect(String(result.error)).toContain("compareTo");
  });
});

describe("Plugin Jours fériés FR (calcul local)", () => {
  function holidayDates(result: Record<string, unknown>): string[] {
    return (result.holidays as Array<{ date: string }>).map((h) => h.date);
  }

  it("liste les 11 jours fériés légaux, triés et avec leur jour", async () => {
    const result = await runTool(frHolidays, { year: 2026 });
    const dates = holidayDates(result);
    expect(dates).toHaveLength(11);
    expect([...dates].sort()).toEqual(dates);
    expect(dates).toContain("2026-01-01");
    expect(dates).toContain("2026-12-25");
    for (const holiday of result.holidays as Array<{
      date: string;
      weekday: string;
    }>) {
      expect(holiday.weekday.length).toBeGreaterThan(3);
    }
  });

  it("calcule correctement les fêtes mobiles (Pâques)", async () => {
    const easter2024 = await runTool(frHolidays, { year: 2024 });
    expect(holidayDates(easter2024)).toContain("2024-04-01"); // Lundi de Pâques
    expect(holidayDates(easter2024)).toContain("2024-05-09"); // Ascension
    expect(holidayDates(easter2024)).toContain("2024-05-20"); // Pentecôte

    const easter2026 = await runTool(frHolidays, { year: 2026 });
    expect(holidayDates(easter2026)).toContain("2026-04-06");
    expect(holidayDates(easter2026)).toContain("2026-05-14");
    expect(holidayDates(easter2026)).toContain("2026-05-25");
  });

  it("détecte les ponts des jours fériés mardi/jeudi", async () => {
    const result2024 = await runTool(frHolidays, { year: 2024 });
    expect(
      (result2024.bridges as Array<{ date: string }>).map((b) => b.date)
    ).toEqual(["2024-05-10", "2024-08-16"]);

    const result2026 = await runTool(frHolidays, { year: 2026 });
    expect(
      (result2026.bridges as Array<{ date: string }>).map((b) => b.date)
    ).toEqual(["2026-01-02", "2026-05-15", "2026-07-13"]);
  });

  it("peut masquer les ponts et compte les jours ouvrés", async () => {
    const withoutBridges = await runTool(frHolidays, {
      includeBridges: false,
      year: 2026,
    });
    expect(withoutBridges.bridges).toEqual([]);

    const range = await runTool(frHolidays, {
      from: "2026-05-01",
      to: "2026-05-31",
      year: 2026,
    });
    expect(range.range).toEqual({
      from: "2026-05-01",
      to: "2026-05-31",
      totalDays: 31,
      workdays: 17,
    });
  });

  it("refuse un intervalle inversé", async () => {
    const result = await runTool(frHolidays, {
      from: "2026-06-01",
      to: "2026-05-01",
      year: 2026,
    });
    expect(String(result.error)).toContain("précéder");
  });
});

describe("Plugin Qualité de l'air (réseau lecture seule)", () => {
  const GEOCODING = "https://geocoding-api.open-meteo.com";
  const AIR_QUALITY = "https://air-quality-api.open-meteo.com";

  it("interroge uniquement Open-Meteo et borne le résultat", async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        calls.push(url);
        if (url.startsWith(GEOCODING)) {
          return new Response(
            JSON.stringify({
              results: [
                {
                  country: "France",
                  latitude: 48.85,
                  longitude: 2.35,
                  name: "Paris",
                },
              ],
            }),
            { status: 200 }
          );
        }
        return new Response(
          JSON.stringify({
            current: { european_aqi: 35, pm2_5: 12 },
            current_units: { european_aqi: "EAQI" },
            hourly: {
              pm2_5: [1, 2, 3, 4, 5],
              time: ["t1", "t2", "t3", "t4", "t5"],
            },
          }),
          { status: 200 }
        );
      })
    );

    const result = await runTool(getAirQuality, { city: "Paris", hours: 3 });

    expect(calls).toHaveLength(2);
    for (const url of calls) {
      expect(url.startsWith(GEOCODING) || url.startsWith(AIR_QUALITY)).toBe(
        true
      );
    }
    expect(result.locationName).toBe("Paris, France");
    expect(result.current).toMatchObject({
      aqiLevel: "Correct",
      european_aqi: 35,
    });
    // Sortie bornée : 3 échéances horaires, pas le dump complet.
    expect(result.hours).toBe(3);
    expect(result.time).toEqual(["t1", "t2", "t3"]);
    const hourly = result.hourly as Array<{ field: string; values: unknown[] }>;
    expect(hourly[0]?.values).toHaveLength(3);
  });

  it("renvoie une erreur structurée sans lever quand le service échoue", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) =>
        String(input).startsWith(GEOCODING)
          ? new Response(
              JSON.stringify({
                results: [{ latitude: 1, longitude: 2, name: "Test" }],
              }),
              { status: 200 }
            )
          : new Response("boom", { status: 503 })
      )
    );

    const result = await runTool(getAirQuality, { city: "Test" });
    expect(String(result.error)).toContain("Qualité de l'air indisponible");
  });

  it("signale une ville introuvable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ results: [] }), { status: 200 })
      )
    );
    const result = await runTool(getAirQuality, { city: "VilleInconnue" });
    expect(String(result.error)).toContain("introuvable");
  });
});
