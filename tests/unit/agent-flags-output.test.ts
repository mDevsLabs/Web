import { describe, expect, it } from "vitest";
import { DEFAULT_AGENT_FLAGS, filterToolsByFlags } from "@/lib/agent/flags";
import { toToolCategories } from "@/lib/agent/settings";
import { unwrapAgentToolOutput } from "@/lib/agent/types";

describe("Agent flags serveur", () => {
  it("retire les outils des catégories désactivées", () => {
    const tools = [
      { category: "web" as const },
      { category: "plugins" as const },
      { category: "internal" as const },
    ];
    const result = filterToolsByFlags(tools, {
      ...DEFAULT_AGENT_FLAGS,
      "agent.plugins": false,
      "agent.webSearch": false,
    });
    expect(result).toEqual([{ category: "internal" }]);
  });

  it("transforme une liste de catégories inconnue en aucune sélection", () => {
    expect(toToolCategories(["category-inconnue"])).toEqual([]);
  });
});

describe("Sortie d'outil Agent", () => {
  it("retire l'enveloppe de succès pour les renderers", () => {
    expect(
      unwrapAgentToolOutput({
        data: { image_url: "https://example.test/image" },
        success: true,
      })
    ).toEqual({ image_url: "https://example.test/image" });
  });

  it("retire l'enveloppe d'échec sans exposer les détails internes", () => {
    expect(
      unwrapAgentToolOutput({
        error: { code: "tool_failed", message: "Échec sûr" },
        success: false,
      })
    ).toEqual({ error: "Échec sûr" });
  });
});
