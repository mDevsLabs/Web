import { describe, expect, it } from "vitest";
import type { ChatModel } from "@/lib/ai/models";
import {
  getMemoizedCapabilities,
  resetCapabilitiesCache,
} from "@/lib/ai/registry/capabilities";
import { resolveWakieCatalogModel } from "@/lib/wakies/model";
import { MAI_MODEL_TRAITS, resolveMaiModelTraits } from "@/mai-identity";

describe("traits des alias mAI-2", () => {
  it("déclare les trois efforts du routeur, dans l'ordre du fournisseur", () => {
    expect(resolveMaiModelTraits("mai-2")?.reasoningEfforts).toEqual([
      "max",
      "high",
      "low",
    ]);
    expect(resolveMaiModelTraits("MAI-2")?.defaultReasoningEffort).toBe("high");
  });

  it("reconnaît aussi la forme préfixée mDevsLabs", () => {
    expect(resolveMaiModelTraits("mdevslabs/mai-2")).toBe(
      MAI_MODEL_TRAITS["mai-2"]
    );
  });

  it("n'invente aucun niveau pour mAI-2-Mini", () => {
    const traits = resolveMaiModelTraits("mai-2-mini");
    expect(traits?.reasoningEfforts).toEqual([]);
    expect(traits?.defaultReasoningEffort).toBeUndefined();
  });

  it("ignore tout autre modèle", () => {
    expect(resolveMaiModelTraits("google/gemini-2.5-flash")).toBeNull();
    expect(resolveMaiModelTraits(null)).toBeNull();
  });

  it("publie vision, fichiers et niveaux dans le registre", () => {
    resetCapabilitiesCache();
    const capabilities = getMemoizedCapabilities({
      architecture: { input_modalities: ["text", "image", "file"] },
      id: "mai-2",
      name: "mAI-2",
      provider: "mdevslabs",
      reasoning: {
        default_effort: "high",
        supported_efforts: ["max", "high", "low"],
      },
      supported_parameters: ["tools", "reasoning"],
    } as unknown as ChatModel);

    expect(capabilities.reasoning).toBe(true);
    expect(capabilities.reasoningLevels).toEqual(["max", "high", "low"]);
    expect(capabilities.vision).toBe(true);
    expect(capabilities.image).toBe(true);
    expect(capabilities.file).toBe(true);
  });
});

describe("modèle par défaut d'un Wakie", () => {
  const models = [
    { id: "gemini/gemini-3.8-flash" },
    { id: "mai-2" },
    { id: "mai-2-mini" },
  ];

  it("suit la préférence de l'hôte quand aucun choix explicite n'existe", () => {
    expect(resolveWakieCatalogModel(models, null, null, "mai-2")).toBe("mai-2");
  });

  it("un choix de conversation prime sur la préférence", () => {
    expect(resolveWakieCatalogModel(models, "mai-2-mini", null, "mai-2")).toBe(
      "mai-2-mini"
    );
  });

  it("ignore une préférence absente du catalogue", () => {
    expect(resolveWakieCatalogModel(models, null, null, "modele/retire")).toBe(
      "gemini/gemini-3.8-flash"
    );
  });
});
