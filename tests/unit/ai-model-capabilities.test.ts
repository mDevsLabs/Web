import { describe, expect, it } from "vitest";
import { getModelCapabilities } from "@/lib/ai/models";
import { buildModelEntry, isAgentCompatible } from "@/lib/ai/registry";
import { getMemoizedCapabilities } from "@/lib/ai/registry/capabilities";

describe("capacités des modèles Agent", () => {
  it("normalise les paramètres OpenRouter avant de détecter les outils", () => {
    expect(
      getModelCapabilities({
        id: "poolside/laguna-xs-2.1:free",
        supported_parameters: [" Tools ", "FUNCTION_CALLING"],
      }).tools
    ).toBe(true);
  });

  it("construit une entrée Laguna compatible à partir du catalogue", () => {
    const entry = buildModelEntry({
      architecture: { input_modalities: ["text"] },
      description: "Laguna",
      id: "poolside/laguna-xs-2.1:free",
      isFree: true,
      name: "Laguna XS 2.1",
      provider: "poolside",
      supported_parameters: ["tools"],
    });

    expect(entry.capabilities.tools).toBe(true);
    expect(isAgentCompatible(entry)).toBe(true);
  });

  it("invalide le cache quand les métadonnées du même modèle changent", () => {
    const withTools = {
      description: "Laguna",
      id: "poolside/laguna-xs-2.1:free",
      name: "Laguna XS 2.1",
      provider: "poolside",
      supported_parameters: ["tools"],
    };
    const withoutTools = {
      description: "Laguna",
      id: "poolside/laguna-xs-2.1:free",
      name: "Laguna XS 2.1",
      provider: "poolside",
      supported_parameters: ["temperature"],
    };

    expect(getMemoizedCapabilities(withTools).tools).toBe(true);
    expect(getMemoizedCapabilities(withoutTools).tools).toBe(false);
  });
});
