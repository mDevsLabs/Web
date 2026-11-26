import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  groupModelsByProvider,
  isMai2ModelId,
  isRecommendedModel,
  isRecommendedModelId,
  sortModelsForDisplay,
} from "@/lib/ai/model-selector/order";
import { excludeBatchModels, isBatchModelId } from "@/lib/ai/models";

const ROOT = path.resolve(import.meta.dirname, "..", "..");

function readSource(relPath: string): string {
  return readFileSync(path.join(ROOT, relPath), "utf8");
}

describe("label Recommandé sur mAI-2.5 vs mAI-2", () => {
  it("recommande les trois modèles mAI-2.5 (Opal, Apex, Omni)", () => {
    expect(isRecommendedModelId("mai-2.5-opal")).toBe(true);
    expect(isRecommendedModelId("mai-2.5-apex")).toBe(true);
    expect(isRecommendedModelId("mai-2.5-omni")).toBe(true);
    expect(isRecommendedModelId("mdevslabs/mai-2.5-opal")).toBe(true);
    expect(isRecommendedModelId("mAI-2.5-Apex")).toBe(true);
    expect(
      isRecommendedModel({ id: "mai-2.5-omni", name: "mAI-2.5-Omni" })
    ).toBe(true);
  });

  it("retire le label Recommandé de la génération mAI-2 et mAI-2-Mini", () => {
    expect(isRecommendedModelId("mai-2")).toBe(false);
    expect(isRecommendedModelId("mai-2-mini")).toBe(false);
    expect(isRecommendedModelId("mdevslabs/mai-2")).toBe(false);
    expect(isRecommendedModelId("mdevslabs/mai-2-mini")).toBe(false);
    expect(isRecommendedModel({ id: "mai-2", name: "mAI-2" })).toBe(false);
    expect(isRecommendedModel({ id: "mai-2-mini", name: "mAI-2-Mini" })).toBe(
      false
    );
    expect(isMai2ModelId("mai-2")).toBe(true);
    expect(isMai2ModelId("mai-2-mini")).toBe(true);
  });

  it("n'attribue jamais Recommandé aux modèles tiers", () => {
    expect(isRecommendedModelId("google/gemini-2.5-flash")).toBe(false);
    expect(isRecommendedModelId("openai/gpt-4o")).toBe(false);
  });

  it("affiche mAI-2.5 avant mAI-2 et garde le groupe mAI en tête", () => {
    const unsorted = [
      {
        id: "google/gemini-2.5-flash",
        name: "Gemini 2.5 Flash",
        provider: "google",
      },
      { id: "mai-2-mini", name: "mAI-2-Mini", provider: "mdevslabs" },
      { id: "mai-2", name: "mAI-2", provider: "mdevslabs" },
      { id: "mai-2.5-omni", name: "mAI-2.5-Omni", provider: "mdevslabs" },
      { id: "mai-2.5-opal", name: "mAI-2.5-Opal", provider: "mdevslabs" },
      { id: "mai-2.5-apex", name: "mAI-2.5-Apex", provider: "mdevslabs" },
    ];

    expect(sortModelsForDisplay(unsorted).map((m) => m.id)).toEqual([
      "mai-2.5-opal",
      "mai-2.5-apex",
      "mai-2.5-omni",
      "mai-2",
      "mai-2-mini",
      "google/gemini-2.5-flash",
    ]);

    const grouped = groupModelsByProvider(unsorted);
    expect(grouped[0].providerKey).toBe("mai");
    expect(grouped[0].models.map((m) => m.id)).toEqual([
      "mai-2.5-opal",
      "mai-2.5-apex",
      "mai-2.5-omni",
      "mai-2",
      "mai-2-mini",
    ]);
  });
});

describe("exclusion des modèles :batch de la sélection", () => {
  it("détecte les identifiants contenant :batch quelle que soit la casse", () => {
    expect(isBatchModelId("google/gemini-4-neon:batch")).toBe(true);
    expect(isBatchModelId("google/gemini-4-argon:BATCH")).toBe(true);
    expect(isBatchModelId("google/gemini-3.8-flash:batch")).toBe(true);
    expect(isBatchModelId("google/gemini-4-neon")).toBe(false);
    expect(isBatchModelId("google/gemini-2.5-flash:free")).toBe(false);
    expect(isBatchModelId(null)).toBe(false);
    expect(isBatchModelId(undefined)).toBe(false);
  });

  it("filtre uniquement les modèles :batch de la liste", () => {
    const models = [
      { id: "mai-2.5-opal", name: "mAI-2.5-Opal" },
      { id: "google/gemini-4-neon", name: "Gemini 4 Neon" },
      { id: "google/gemini-4-neon:batch", name: "Gemini 4 Neon (batch)" },
      { id: "google/gemini-4-argon:batch", name: "Gemini 4 Argon (batch)" },
      { id: "google/gemini-3.8-flash", name: "Gemini 3.8 Flash" },
      { id: "google/gemini-3.8-flash:batch", name: "Gemini 3.8 Flash (batch)" },
    ];

    expect(excludeBatchModels(models).map((m) => m.id)).toEqual([
      "mai-2.5-opal",
      "google/gemini-4-neon",
      "google/gemini-3.8-flash",
    ]);
  });

  it("branche le badge mAI-2.5 et le filtre :batch dans les sélecteurs et le catalogue serveur", () => {
    const compact = readSource("components/chat/model-selector-compact.tsx");
    const siteSelector = readSource(
      "components/site/model-selector-groups.tsx"
    );
    const serverCatalog = readSource("lib/ai/models.server.ts");

    expect(compact).toContain("isRecommendedModel(model)");
    expect(compact).not.toContain("isMai2Model(model)");
    expect(compact).toContain("isBatchModelId");

    expect(siteSelector).toContain("isRecommendedModel(model)");
    expect(siteSelector).not.toContain("isMai2Model(model)");
    expect(siteSelector).toContain("isBatchModelId");

    expect(serverCatalog).toContain("isBatchModelId");
  });
});

describe("barre latérale fixe de Vibe au défilement", () => {
  it("n'utilise pas overflow-x: hidden sur html et body (qui casse position: sticky)", () => {
    const globalsCss = readSource("app/globals.css");
    const baseSection = globalsCss.slice(
      globalsCss.indexOf("body {\n    position: relative;"),
      globalsCss.indexOf("h1,\n  h2,")
    );

    expect(baseSection).toContain("overflow-x: clip;");
    expect(baseSection).not.toContain("overflow-x: hidden;");
  });

  it("annule le transform de SidebarInset pour .vibe-root et garde la Sidebar sticky en haut", () => {
    const chatLayout = readSource("app/(chat)/layout.tsx");
    const vibeSidebar = readSource("components/vibe/layout/Sidebar.tsx");

    expect(chatLayout).toContain("has-[.vibe-root]:[transform:none]");
    expect(vibeSidebar).toContain("sticky");
    expect(vibeSidebar).toContain("top-0");
    expect(vibeSidebar).toContain("self-start");
    expect(vibeSidebar).toContain("overflow-y-auto");
  });
});
