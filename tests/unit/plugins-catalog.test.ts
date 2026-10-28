import { tool } from "ai";
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  listPluginAgentTools,
  narrowPluginAgentToolsForTask,
} from "@/lib/agent/tools/adapters/plugins";
import {
  isNativeToolId,
  isPluginProvidedToolId,
  NATIVE_TOOL_IDS,
  PLUGIN_PROVIDED_TOOL_IDS,
  TOOL_IDS,
} from "@/lib/ai/tools/ids";
import { getIntegrationByPluginId } from "@/lib/integrations/providers";
import { getAirQuality } from "@/lib/plugins/air-quality";
import {
  getPluginManifest,
  getReadToolIdsForPluginIds,
  isPluginOnlyToolId,
  PLUGIN_MANIFEST_LIST,
  PLUGIN_ONLY_TOOL_IDS,
} from "@/lib/plugins/catalog";
import {
  frHolidays,
  internationalHolidays,
  isPublicHoliday,
} from "@/lib/plugins/fr-holidays";
import { isLucideIconName } from "@/lib/plugins/icon-allowlist";
import { jsonToolbox } from "@/lib/plugins/json-toolbox";
import { getFoodProduct } from "@/lib/plugins/open-food-facts";
import { quizQuestionSchema, quizzly } from "@/lib/plugins/quizzly";
import {
  createPluginTools,
  getPluginDefinition,
  getToolIdsForPluginIds,
  PLUGIN_DEFINITION_LIST,
} from "@/lib/plugins/server";
import {
  fetchPublicJson,
  PUBLIC_API_MAX_BYTES,
} from "@/lib/plugins/shared/public-api";
import {
  hasReadTool,
  readToolIds,
  toolEffect,
  writeToolIds,
} from "@/lib/plugins/tool-effect";
import type { PluginDefinition, PluginManifest } from "@/lib/plugins/types";
import { searchWorldBankIndicators } from "@/lib/plugins/world-bank";

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
  it("expose le catalogue courant, avec des identifiants uniques", () => {
    const ids = PLUGIN_MANIFEST_LIST.map((plugin) => plugin.id).toSorted(
      (a, b) => a.localeCompare(b)
    );
    expect(ids).toEqual([
      "air-quality",
      "asana",
      "brave",
      "brevo",
      "cloudflare",
      "crossref",
      "discord",
      "dockerhub",
      "eurostat",
      "exchange-rate",
      "fr-holidays",
      "github",
      "gitlab-public",
      "google",
      "jira",
      "json-toolbox",
      "linear",
      "make",
      "mapbox",
      "mobilite-fr",
      "neon",
      "notion",
      "npm",
      "open-food-facts",
      "open-library",
      "openalex",
      "posthog",
      "quizzly",
      "resend",
      "sentry",
      "sonarcloud",
      "stripe",
      "supabase",
      "tvmaze",
      "twilio",
      "upstash",
      "vercel",
      "weather",
      "wikidata",
      "world-bank",
      "zapier",
    ]);

    const toolIds = PLUGIN_MANIFEST_LIST.flatMap((plugin) =>
      plugin.tools.map((tool) => tool.id)
    );
    expect(new Set(toolIds).size).toBe(toolIds.length);
  });

  it("déclare des permissions explicites, un forfait valide et une icône connue", () => {
    for (const plugin of PLUGIN_MANIFEST_LIST) {
      expect(plugin.version).toMatch(/^\d+\.\d+\.\d+/);
      expect(plugin.category.length).toBeGreaterThan(0);
      expect(plugin.tags.length).toBeGreaterThan(0);
      expect(plugin.tools.length).toBeGreaterThan(0);
      for (const pluginTool of plugin.tools) {
        expect(pluginTool.label.length).toBeGreaterThan(0);
        expect(pluginTool.description.length).toBeGreaterThan(0);
        expect(pluginTool.systemHint.length).toBeGreaterThan(0);
      }

      // Les plugins sont autorisés dès le forfait Free.
      expect(["free", "plus", "pro", "max"]).toContain(plugin.minTier);

      // Permissions déclaratives obligatoires.
      expect(["none", "read-only", "read-write"]).toContain(
        plugin.permissions.network
      );
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
      for (const pluginTool of plugin.tools) {
        expect(isNativeToolId(pluginTool.id)).toBe(false);
        if ((TOOL_IDS as readonly string[]).includes(pluginTool.id)) {
          expect(isPluginProvidedToolId(pluginTool.id)).toBe(true);
        }
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
      const tools = definition?.createTools({});
      expect(
        Object.keys(tools ?? {}).toSorted((left, right) =>
          left.localeCompare(right)
        )
      ).toEqual(
        plugin.tools
          .map((pluginTool) => pluginTool.id)
          .toSorted((left, right) => left.localeCompare(right))
      );
      for (const pluginTool of Object.values(tools ?? {})) {
        expect(pluginTool.description?.length ?? 0).toBeGreaterThan(0);
        expect(typeof pluginTool.execute).toBe("function");
      }
    }
    expect(getPluginManifest("air-quality")?.tools[0]?.id).toBe(
      "getAirQuality"
    );
  });

  it("convertit une erreur réseau de plugin en ToolFailure Agent", async () => {
    // Un outil de connecteur authentifié : le jeton vient du coffre, et c'est
    // bien l'incident de transport (503) qui doit être classé rejouable.
    const [repositoryDetails] = listPluginAgentTools(["github"], {
      secretResolver: async ({ kind }) =>
        kind === "auth" ? "jeton-de-test" : undefined,
      userId: "user",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("service unavailable", { status: 503 }))
    );
    const result = await repositoryDetails.execute(
      { repository: "openai/example" },
      {
        chatId: "chat",
        projectId: null,
        runId: "run",
        sessionToken: "token",
        signal: new AbortController().signal,
        stepId: "step",
        toolCallId: "call",
        toolExecutionId: "execution",
        userEmail: "user@example.com",
        userId: "user",
      }
    );
    expect(result).toMatchObject({
      error: { category: "transient", retryable: true },
      success: false,
    });
  });

  it("n'instancie que les outils des plugins autorisés", () => {
    // Sans canal, le contexte est traité comme Agent : les connecteurs y
    // servent leurs écritures. Il leur faut en revanche une identité.
    const all = createPluginTools({ userId: "user" });
    expect(Object.keys(all).toSorted((a, b) => a.localeCompare(b))).toEqual(
      PLUGIN_MANIFEST_LIST.flatMap((plugin) =>
        plugin.tools.map((pluginTool) => pluginTool.id)
      ).toSorted((a, b) => a.localeCompare(b))
    );
    const scoped = createPluginTools({}, ["fr-holidays"]);
    expect(Object.keys(scoped).toSorted()).toEqual([
      "frHolidays",
      "getHolidayLongWeekends",
      "internationalHolidays",
      "isPublicHoliday",
      "listHolidayCountries",
    ]);
    expect(createPluginTools({}, [])).toEqual({});
  });

  it("ne retire aucun outil aux plugins qui n'écrivent nulle part", () => {
    // Les plugins historiques n'ont aucun outil d'écriture : projeter la
    // lecture seule doit leur rendre la totalité de leurs outils, sinon le
    // filtre aurait silencieusement amputé un canal existant.
    const plainPluginIds = PLUGIN_MANIFEST_LIST.filter(
      (plugin) => !getIntegrationByPluginId(plugin.id)
    ).map((plugin) => plugin.id);
    expect(getReadToolIdsForPluginIds(plainPluginIds).toSorted()).toEqual(
      getToolIdsForPluginIds(plainPluginIds).toSorted()
    );
    // Les deux connecteurs, eux, perdent exactement leurs écritures.
    expect(
      getToolIdsForPluginIds(["github", "google"]).length -
        getReadToolIdsForPluginIds(["github", "google"]).length
    ).toBe(5);
  });

  describe("effet par outil, non par plugin", () => {
    const mixedManifest: PluginManifest = {
      author: "mAI",
      category: "productivite",
      description: "Lit et écrit le calendrier.",
      icon: { name: "Calendar", type: "lucide" },
      id: "mixed-agenda",
      minTier: "plus",
      name: "Agenda mixte",
      permissions: {
        network: "read-write",
        readsUserData: true,
        requiresApproval: true,
        writesUserData: true,
      },
      tags: [],
      tools: [
        {
          description: "d",
          // Un plugin mixte doit le dire outil par outil : sans cette
          // déclaration, l'écriture du plugin contamine toute sa lecture.
          effect: "read",
          id: "listEvents",
          label: "l",
          systemHint: "h",
        },
        {
          description: "d",
          effect: "write",
          id: "createEvent",
          label: "c",
          systemHint: "h",
        },
      ],
      version: "1.0.0",
    };

    function stubDefinition() {
      return {
        createTools: () => ({
          createEvent: tool({
            description: "cr",
            execute: async () => ({ ok: true }),
            inputSchema: z.object({}),
          }),
          listEvents: tool({
            description: "li",
            execute: async () => ({ ok: true }),
            inputSchema: z.object({}),
          }),
        }),
        manifest: mixedManifest,
      } as unknown as PluginDefinition;
    }

    /** Le catalogue généré est un tableau exporté : on l'enrichit, puis on rend. */
    function withMixedPlugin<T>(run: () => T): T {
      const definition = stubDefinition();
      PLUGIN_DEFINITION_LIST.push(definition);
      try {
        return run();
      } finally {
        PLUGIN_DEFINITION_LIST.splice(
          PLUGIN_DEFINITION_LIST.indexOf(definition),
          1
        );
      }
    }

    it("déduit l'effet des permissions quand l'outil ne dit rien", () => {
      const undeclared = {
        description: "d",
        id: "undeclared",
        label: "u",
        systemHint: "h",
      };
      // Un plugin qui écrit quelque part est présumé écrire partout : c'est le
      // seul repli qui ne puisse pas exposer une écriture sans approbation.
      expect(toolEffect(mixedManifest, undeclared)).toBe("write");
      const declared = mixedManifest.tools.find(
        (item) => item.id === "listEvents"
      )!;
      expect(toolEffect(mixedManifest, declared)).toBe("read");
      const pureRead = {
        ...mixedManifest,
        permissions: {
          network: "read-only",
          readsUserData: false,
          requiresApproval: false,
          writesUserData: false,
        },
      } as PluginManifest;
      expect(toolEffect(pureRead, undeclared)).toBe("read");
    });

    it("sert la lecture au Chat et garde l'écriture pour l'Agent", () => {
      const result = withMixedPlugin(() => ({
        agent: createPluginTools({ channel: "agent", userId: "user-1" }, [
          "mixed-agenda",
        ]),
        chat: createPluginTools({ channel: "chat", userId: "user-1" }, [
          "mixed-agenda",
        ]),
        planning: createPluginTools({ channel: "planning", userId: "user-1" }, [
          "mixed-agenda",
        ]),
      }));
      expect(Object.keys(result.agent).toSorted()).toEqual([
        "createEvent",
        "listEvents",
      ]);
      // Surtout : plus aucune exception au milieu d'un tour de Chat.
      expect(Object.keys(result.chat)).toEqual(["listEvents"]);
      expect(Object.keys(result.planning)).toEqual(["listEvents"]);
    });

    it("écarte un connecteur de compte quand l'appel ne porte pas d'identité", () => {
      const warnings: unknown[] = [];
      const warn = console.warn;
      console.warn = (...args: unknown[]) => warnings.push(args.join(" "));
      try {
        const result = withMixedPlugin(() =>
          createPluginTools({ channel: "chat" }, ["mixed-agenda"])
        );
        expect(result).toEqual({});
      } finally {
        console.warn = warn;
      }
      expect(warnings.join("\n")).toContain("aucun identifiant utilisateur");
    });

    it("ne laisse aucun outil à servir pour un plugin purement scripté", () => {
      const writeOnly = {
        ...mixedManifest,
        tools: [
          {
            description: "d",
            effect: "write",
            id: "createEvent",
            label: "c",
            systemHint: "h",
          },
        ],
      } as PluginManifest;
      expect(hasReadTool(writeOnly)).toBe(false);
      expect(readToolIds(writeOnly)).toEqual([]);
      expect(readToolIds(mixedManifest)).toEqual(["listEvents"]);
      expect(writeToolIds(mixedManifest)).toEqual(["createEvent"]);
    });
  });

  it("adapte les outils des plugins à Agent et réduit la sélection automatique", () => {
    const githubTools = listPluginAgentTools(["github"], {
      secretResolver: async ({ kind }) =>
        kind === "auth" ? "jeton-de-test" : undefined,
      userId: "user",
    });
    // Neuf outils, dont trois écritures : l'Agent est le seul canal qui les
    // serve, et chacun de ces trois doit être marqué à approuver.
    expect(githubTools).toHaveLength(9);
    expect(
      githubTools.filter((agentTool) => agentTool.permissions.readOnly)
    ).toHaveLength(6);
    expect(
      githubTools
        .filter((agentTool) => agentTool.permissions.default === "ask")
        .map((agentTool) => agentTool.id)
        .toSorted()
    ).toEqual([
      "commentGithubIssue",
      "createGithubIssue",
      "createGithubPullRequest",
    ]);
    expect(
      githubTools.every((agentTool) => agentTool.source === "plugin")
    ).toBe(true);
    expect(
      narrowPluginAgentToolsForTask(
        "Montre les issues GitHub ouvertes",
        githubTools,
        ["github"]
      ).map((agentTool) => agentTool.id)
    ).toEqual(["listGithubIssues"]);
    expect(
      narrowPluginAgentToolsForTask("@GitHub inspecte ce dépôt", githubTools, [
        "github",
      ])
    ).toHaveLength(9);
    expect(listPluginAgentTools([])).toEqual([]);
  });

  it("ne sert que la lecture d'un connecteur sur un canal non-Agent", () => {
    // GitHub : 9 outils, 6 en lecture. Google : 12 outils, 10 en lecture
    // (créer un événement et envoyer un mail restent côté Agent).
    expect(getReadToolIdsForPluginIds(["github"])).toHaveLength(6);
    expect(getReadToolIdsForPluginIds(["google"])).toHaveLength(10);
    expect(getReadToolIdsForPluginIds(["github", "google"])).toHaveLength(16);
    const chatTools = createPluginTools({ channel: "chat", userId: "user" }, [
      "github",
      "google",
    ]);
    expect(Object.keys(chatTools)).toHaveLength(16);
    expect(chatTools.sendGmailMessage).toBeUndefined();
    expect(chatTools.createCalendarEvent).toBeUndefined();
    expect(chatTools.searchDriveFiles).toBeDefined();
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

  it("distingue une panne du géocodeur d'une ville inconnue", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("unavailable", { status: 503 }))
    );
    const result = await runTool(getAirQuality, { city: "Paris" });
    expect(String(result.error)).toContain("Géo-codeur");
    expect(String(result.error)).not.toContain("introuvable");
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

describe("Connecteurs publics des plugins", () => {
  it("refuse tout hôte externe à la liste autorisée sans envoyer de requête", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await fetchPublicJson("https://example.org/private");
    expect(result).toMatchObject({
      error: "Domaine de source non autorisé.",
      ok: false,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("normalise la limite HTTP 429 et refuse un corps trop grand", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response("", {
            headers: {
              "content-length": String(PUBLIC_API_MAX_BYTES + 1),
              "retry-after": "30",
            },
            status: 429,
          })
      )
    );
    const limited = await fetchPublicJson(
      "https://api.github.com/repos/openai/openai-node"
    );
    expect(limited).toMatchObject({ ok: false });
    if (!limited.ok) expect(limited.error).toContain("HTTP 429");

    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response("{}", {
            headers: { "content-length": String(PUBLIC_API_MAX_BYTES + 1) },
            status: 200,
          })
      )
    );
    const oversized = await fetchPublicJson(
      "https://api.github.com/repos/openai/openai-node"
    );
    expect(oversized).toMatchObject({
      error: "Réponse trop volumineuse; résultat refusé.",
      ok: false,
    });
  });

  it("normalise les erreurs réseau sans propager une exception au modèle", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("socket unavailable");
      })
    );
    const result = await fetchPublicJson(
      "https://api.github.com/repos/openai/openai-node"
    );
    expect(result).toMatchObject({
      error: "Erreur réseau ou réponse JSON invalide.",
      ok: false,
    });
  });

  it("porte le jeton du compte sur chaque appel GitHub", async () => {
    const calls: { authorization: string | null; url: string }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        calls.push({
          authorization:
            new Headers(init?.headers).get("authorization") ?? null,
          url: String(input),
        });
        return Response.json({
          default_branch: "main",
          description: "Dépôt de test",
          forks_count: 12,
          full_name: "openai/example",
          html_url: "https://github.com/openai/example",
          license: { spdx_id: "MIT" },
          open_issues_count: 3,
          private: true,
          stargazers_count: 42,
          updated_at: "2026-09-22T00:00:00Z",
        });
      })
    );
    const tools = createPluginTools(
      {
        channel: "agent",
        secretResolver: async () => "jeton-du-compte",
        userId: "user",
      },
      ["github"]
    );
    const result = await runTool(tools.getGithubRepositoryDetails, {
      repository: "openai/example",
    });
    expect(calls.map((call) => call.url)).toEqual([
      "https://api.github.com/repos/openai/example",
    ]);
    // Le jeton vient du coffre du compte, plus d'une variable d'environnement :
    // c'est ce qui rend un dépôt privé lisible pour son propriétaire seulement.
    expect(calls[0]?.authorization).toBe("Bearer jeton-du-compte");
    expect(result).toMatchObject({
      isPrivate: true,
      name: "openai/example",
      source: { url: "https://github.com/openai/example" },
      stars: 42,
    });
  });

  it("conseille de connecter le compte au lieu d'appeler sans jeton", async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        calls.push(String(input));
        return Response.json({});
      })
    );
    // Aucun `secretResolver` : aucun compte connecté sur ce compte mAI.
    const tools = createPluginTools({ channel: "agent", userId: "user" }, [
      "github",
    ]);
    const result = await runTool(tools.getGithubRepositories, {});
    expect(String(result.error)).toContain("Aucune connexion GitHub");
    expect(calls).toEqual([]);
  });

  it("refuse une écriture dont le consentement ne porte pas la portée", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ id: "evt" }))
    );
    const tools = createPluginTools(
      {
        channel: "agent",
        secretResolver: async ({ key }) =>
          key.endsWith(".scopes")
            ? "openid email https://www.googleapis.com/auth/calendar.readonly"
            : "jeton-du-compte",
        userId: "user",
      },
      ["google"]
    );
    const result = await runTool(tools.createCalendarEvent, {
      endsAt: "2026-10-12T11:00:00Z",
      startsAt: "2026-10-12T10:00:00Z",
      summary: "Point mensuel",
    });
    expect(String(result.error)).toContain("n'inclut pas la portée");
  });

  it("valide les indices et les longueurs du quiz", () => {
    expect(
      quizQuestionSchema.safeParse({
        correctAnswers: [-1, 1, 1],
        explanation: "explication",
        id: "q1",
        options: ["a", "b"],
        question: "Question",
        type: "single_choice",
      }).success
    ).toBe(false);
    expect(
      quizQuestionSchema.safeParse({
        correctAnswers: [0],
        explanation: "explication",
        id: "q2",
        options: ["a", "b"],
        question: "Question",
        type: "single_choice",
      }).success
    ).toBe(true);
  });

  it("refuse une date grégorienne impossible", async () => {
    const result = await runTool(frHolidays, {
      from: "2026-02-31",
      to: "2026-02-31",
      year: 2026,
    });
    expect(String(result.error)).toContain("Date");
  });

  it("signale l'absence de produit Open Food Facts sans inventer de champs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ status: 0, status_verbose: "product not found" })
      )
    );
    const result = await runTool(getFoodProduct, { barcode: "3017620422003" });
    expect(String(result.error)).toContain("absent");
  });

  it("recherche les indicateurs par l'endpoint de métadonnées officiel", async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        calls.push(String(input));
        return Response.json({
          source: [
            {
              concept: [
                {
                  id: "Series",
                  variable: [
                    {
                      id: "NY.GDP.MKTP.CD",
                      metatype: [
                        { id: "definition", value: "GDP (current US$)" },
                      ],
                    },
                  ],
                },
              ],
              id: "2",
              name: "World Development Indicators",
            },
          ],
        });
      })
    );
    const result = await runTool(searchWorldBankIndicators, {
      limit: 5,
      query: "gross domestic product",
    });
    expect(calls).toEqual([
      "https://api.worldbank.org/v2/sources/2/search/gross%20domestic%20product?format=json&per_page=100",
    ]);
    expect(result.indicators).toMatchObject([
      { id: "NY.GDP.MKTP.CD", matches: [{ text: "GDP (current US$)" }] },
    ]);
  });

  it("utilise l'API Nager v4 et ne confond pas un congé scolaire avec un jour férié", async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        calls.push(String(input));
        return Response.json([
          {
            countryCode: "AT",
            date: "2026-01-01",
            holidayTypes: ["Public"],
            name: "New Year's Day",
            nationalHoliday: true,
            subdivisionCodes: null,
          },
          {
            countryCode: "AT",
            date: "2026-01-02",
            holidayTypes: ["School"],
            name: "School Holiday",
            nationalHoliday: false,
            subdivisionCodes: ["AT-1"],
          },
        ]);
      })
    );
    const listed = await runTool(internationalHolidays, {
      country: "at",
      year: 2026,
    });
    expect(calls[0]).toBe("https://nagerholidays.com/api/v4/Holidays/AT/2026");
    expect((listed.holidays as Array<{ name: string }>)[0]?.name).toBe(
      "New Year's Day"
    );

    const checked = await runTool(isPublicHoliday, {
      country: "at",
      date: "2026-01-02",
    });
    expect(checked.isPublicHoliday).toBe(false);
  });
});
