import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getModelCapabilities } from "@/lib/ai/models";
import { getModelCapabilitiesFor } from "@/lib/ai/registry";
import { calculator } from "@/lib/ai/tools/calculator";
import { mergeToolHints, TOOL_SYSTEM_HINTS } from "@/lib/ai/tools/hints";
import { NATIVE_TOOL_IDS, TOOL_IDS } from "@/lib/ai/tools/ids";
import { readUrl } from "@/lib/ai/tools/read-url";
import { webSearch } from "@/lib/ai/tools/web-search";
import {
  chatModelToolParams,
  GENERIC_TOOL_DESCRIPTIONS,
  hasArtifactChatTool,
  isGenericToolDescription,
  readToolDescription,
  resolveActiveChatTools,
} from "@/lib/chat/tool-policy";
import type { ChatToolDeps } from "@/lib/chat/tools";
import { createChatTools } from "@/lib/chat/tools";
import { buildChatSystemPrompt } from "@/lib/prompts/chat";

const FLINT_ID = "recursive/flint-v1.0:free";

const openEligibility = {
  hasSessionToken: true,
  isGhostMode: false,
  memoryActive: true,
  toolsSupported: true,
};

function deps(overrides: Partial<ChatToolDeps> = {}): ChatToolDeps {
  return {
    chatId: null,
    chatModel: FLINT_ID,
    dataStream: { write() {} } as unknown as ChatToolDeps["dataStream"],
    effectiveAgentId: null,
    isGhostMode: false,
    maiUser: {
      email: "a@b.c",
      limit: 10,
      tier: "free",
      tokensUsed: 0,
      username: "a",
    },
    memoryActive: false,
    memoryAllowAdd: false,
    memoryLimit: 10,
    sessionToken: "session-token",
    toolsSupported: true,
    userEmail: "a@b.c",
    userId: "user-1",
    ...overrides,
  };
}

describe("capacités Flint", () => {
  it("n'accorde pas les outils à partir du seul nom", () => {
    expect(getModelCapabilities(FLINT_ID).tools).toBe(false);
    expect(getModelCapabilitiesFor(FLINT_ID).tools).toBe(false);
  });

  it("accorde les outils quand le catalogue déclare supported_parameters", () => {
    expect(
      getModelCapabilitiesFor(FLINT_ID, [
        {
          description: "Flint",
          id: FLINT_ID,
          isFree: true,
          name: "Flint",
          provider: "recursive",
          supported_parameters: [
            "include_reasoning",
            "reasoning",
            "temperature",
            "tools",
            "top_p",
          ],
        },
      ]).tools
    ).toBe(true);
  });
});

describe("résolution des outils du Chat", () => {
  it("n'annonce rien et n'envoie pas tools quand le modèle ne les accepte pas", () => {
    const tools = createChatTools(
      deps({ toolsSupported: false }),
      {},
      {
        readCustomPlugin: { description: "Lit un plugin personnel." },
      }
    );
    expect(tools).toEqual({});

    const announced = resolveActiveChatTools({
      customPluginIds: ["readCustomPlugin"],
      eligibility: { ...openEligibility, toolsSupported: false },
      hints: mergeToolHints(),
      installedPluginToolIds: ["getWeather"],
      mcpEnabled: true,
      mcpToolIds: ["mcp_demo_search"],
      requestedIds: [
        "calculator",
        "webSearch",
        "getWeather",
        "mcp_demo_search",
      ],
      tools: {
        calculator,
        getWeather: { description: "Météo." },
        mcp_demo_search: { description: "Recherche MCP." },
        readCustomPlugin: { description: "Lit un plugin personnel." },
        webSearch,
      },
    });
    expect(announced).toEqual([]);

    const params = chatModelToolParams(
      { calculator, webSearch },
      announced.map((tool) => tool.id)
    );
    expect(params).toEqual({});
    expect(params).not.toHaveProperty("tools");
  });

  it("retire audioGenerate et audioPodcast en mode fantôme, et garde calculator", () => {
    const tools = createChatTools(
      deps({
        isGhostMode: true,
        memoryActive: false,
        sessionToken: "session-token",
      })
    );
    expect(tools).not.toHaveProperty("audioGenerate");
    expect(tools).not.toHaveProperty("audioPodcast");
    expect(tools).not.toHaveProperty("imageGenerate");
    expect(tools).not.toHaveProperty("updateAccountProfile");
    expect(tools).not.toHaveProperty("updateProfilePicture");
    expect(tools).toHaveProperty("calculator");

    const announced = resolveActiveChatTools({
      customPluginIds: [],
      eligibility: {
        hasSessionToken: true,
        isGhostMode: true,
        memoryActive: false,
        toolsSupported: true,
      },
      hints: mergeToolHints(),
      installedPluginToolIds: [],
      mcpEnabled: false,
      mcpToolIds: [],
      requestedIds: ["audioGenerate", "audioPodcast", "calculator"],
      tools,
    });
    expect(announced.map((tool) => tool.id)).toEqual(["calculator"]);
    expect(announced[0]?.description.toLowerCase()).toContain("pourcent");
    expect(tools).toHaveProperty(announced[0]?.id ?? "");
  });

  it("retire les outils audio sans jeton de session", () => {
    const tools = createChatTools(
      deps({ isGhostMode: false, sessionToken: "   " })
    );
    expect(tools).not.toHaveProperty("audioGenerate");
    expect(tools).not.toHaveProperty("audioPodcast");
    expect(tools).toHaveProperty("calculator");
  });

  it("n'annonce pas un outil sans description spécifique", () => {
    const announced = resolveActiveChatTools({
      customPluginIds: [],
      eligibility: openEligibility,
      hints: {},
      installedPluginToolIds: [],
      mcpEnabled: false,
      mcpToolIds: [],
      requestedIds: ["calculator"],
      tools: {
        calculator: { description: GENERIC_TOOL_DESCRIPTIONS[0] },
      },
    });
    expect(announced).toEqual([]);
  });

  it("ne passe au modèle que les outils annoncés", () => {
    const tools = createChatTools(deps());
    const announced = resolveActiveChatTools({
      customPluginIds: [],
      eligibility: { ...openEligibility, memoryActive: false },
      hints: mergeToolHints(),
      installedPluginToolIds: [],
      mcpEnabled: false,
      mcpToolIds: [],
      requestedIds: ["webSearch", "readUrl"],
      tools,
    });
    const params = chatModelToolParams(
      tools,
      announced.map((tool) => tool.id)
    );
    expect(params).toMatchObject({
      activeTools: ["webSearch", "readUrl"],
    });
    expect(Object.keys("tools" in params ? params.tools : {})).toEqual([
      "webSearch",
      "readUrl",
    ]);
    for (const tool of announced) {
      expect(tools).toHaveProperty(tool.id);
      const schema = readToolDescription(tools[tool.id]);
      expect(schema && !isGenericToolDescription(schema)).toBe(true);
      expect(isGenericToolDescription(tool.description)).toBe(false);
    }
  });
});

describe("descriptions des outils", () => {
  it("donne une phrase utile à chaque identifiant du catalogue", () => {
    for (const id of TOOL_IDS) {
      const hint = TOOL_SYSTEM_HINTS[id];
      expect(hint.trim().length).toBeGreaterThan(20);
      expect(isGenericToolDescription(hint)).toBe(false);
      expect(GENERIC_TOOL_DESCRIPTIONS).not.toContain(hint);
    }
    expect(TOOL_SYSTEM_HINTS.calculator.toLowerCase()).toContain("pourcent");
    expect(TOOL_SYSTEM_HINTS.webSearch).toContain("readUrl");
    expect(TOOL_SYSTEM_HINTS.readUrl).toContain("webSearch");
  });

  it("aligne le schéma OpenAI de calculator, webSearch et readUrl sur le hint", () => {
    expect(readToolDescription(calculator)?.toLowerCase() ?? "").toContain(
      "pourcent"
    );
    expect(readToolDescription(webSearch) ?? "").toContain("readUrl");
    expect(readToolDescription(readUrl) ?? "").toContain("webSearch");
  });

  it("décrit chaque outil natif instancié, et n'injecte pas les artefacts pour un calcul", () => {
    const tools = createChatTools(deps({ memoryActive: true }));
    for (const id of NATIVE_TOOL_IDS) {
      expect(tools, id).toHaveProperty(id);
      const schema = readToolDescription(tools[id]);
      expect(schema && schema.trim().length > 20).toBe(true);
      expect(schema && isGenericToolDescription(schema)).toBe(false);
    }

    const prompt = buildChatSystemPrompt({
      addendum: null,
      artifactsAvailable: hasArtifactChatTool(["calculator"]),
      capabilities: {
        attachments: 0,
        memory: null,
        plan: null,
        reasoning: false,
        tools: [
          {
            description: TOOL_SYSTEM_HINTS.calculator,
            id: "calculator",
            kind: "native",
            label: "calculator",
          },
        ],
        toolsSupported: true,
      },
      requestHints: null,
    });
    expect(prompt.toLowerCase()).toContain("pourcent");
    expect(prompt).not.toContain("QUAND UTILISER `createDocument`");
    expect(prompt).not.toContain("Outil disponible pour cet échange.");
    expect(hasArtifactChatTool(["calculator"])).toBe(false);
    expect(hasArtifactChatTool(["createDocument"])).toBe(true);
  });
});
