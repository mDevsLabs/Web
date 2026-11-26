import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { FALLBACK_MODELS } from "@/lib/ai/models";
import { maiModelsList } from "@/lib/site/mai-models";
import { getModelById } from "@/lib/site/models";
import { modelsData } from "@/lib/site/models-data";
import {
  resolveMaiIdentityPrompt,
  resolveMaiModelTraits,
} from "@/mai-identity";
import { ModelAccessError, requireChatModel } from "@/openrouter-models";

describe("catalogue des modèles mAI-2.5", () => {
  const modelIds = ["mai-2.5-opal", "mai-2.5-apex", "mai-2.5-omni"] as const;

  it("publie les trois modèles dans modelsData", () => {
    for (const id of modelIds) {
      const card = modelsData.find((m) => m.id === id);
      expect(card).toBeDefined();
      expect(card?.cloud).toBe(true);
      expect(card?.apiAlias).toBe(id);
      expect(card?.vision).toBe(true);
      expect(card?.context).toBe("1M");
      expect(card?.bannerImage).toBeTruthy();
      expect(card?.squareImage).toBeTruthy();
    }
  });

  it("déclare les trois modèles dans maiModelsList de l'API", () => {
    const expectedBacking: Record<string, string> = {
      "mai-2.5-apex": "openai/gpt-6.1-terra",
      "mai-2.5-omni": "openai/gpt-6-luna",
      "mai-2.5-opal": "openai/gpt-6.1-sol",
    };
    for (const id of modelIds) {
      const apiEntry = maiModelsList.find((m) => m.id === id);
      expect(apiEntry).toBeDefined();
      expect(apiEntry?.cloud).toBe(true);
      expect(apiEntry?.contextWindow).toBe(1_000_000);
      expect(apiEntry?.capabilities.vision).toBe(true);
      expect(apiEntry?.capabilities.reasoning).toBe(true);
      expect(apiEntry?.capabilities.coding).toBe(true);
      expect(apiEntry?.backingModel).toBe(expectedBacking[id]);
      expect(apiEntry?.license).toBe("Propriétaire");
    }
  });

  it("définit les traits et prompts d'identité mAI-2.5", () => {
    for (const id of modelIds) {
      expect(resolveMaiIdentityPrompt(id)).toBeTruthy();
      const traits = resolveMaiModelTraits(id);
      expect(traits).toBeDefined();
      expect(traits?.reasoningEfforts).toEqual(["max", "high", "low"]);
      expect(traits?.defaultReasoningEffort).toBe("high");
      expect(traits?.inputModalities).toContain("text");
      expect(traits?.inputModalities).toContain("image");
    }
  });

  it("dispose des fichiers README.md complets dans apps/site/docs/", () => {
    const root = process.cwd();
    for (const id of modelIds) {
      const readmePath = join(root, "apps", "site", "docs", id, "README.md");
      expect(existsSync(readmePath)).toBe(true);
      const content = readFileSync(readmePath, "utf8");
      expect(content).toContain("# mAI-2.5");
      expect(content).toContain("## Benchmarks");
      expect(content).toContain("## Avancées technologiques majeures");
      expect(content).toContain("Raisonnement");
      expect(content).toContain("Codage");
      expect(content).toContain(`Utilisation de l'ordinateur`);
      expect(content).toContain("| Licence indiquée | Propriétaire |");
      expect(content).not.toContain("MIT");
    }
  });

  it("charge les fiches README.md et benchmarks mAI-2.5 sans colonnes GPT associées via getModelById", () => {
    const root = process.cwd();
    expect(
      existsSync(join(root, "apps", "site", "docs", "documentation"))
    ).toBe(false);

    const opal = getModelById("mai-2.5-opal")?.readmeContent ?? "";
    expect(opal).toContain("mAI-2.5 Opal");
    expect(opal).toContain("GPT-6 Astra");
    expect(opal).not.toContain("GPT-6.1 Sol");
    expect(opal).toContain("95.4");
    expect(opal).toContain("72.4");

    const apex = getModelById("mai-2.5-apex")?.readmeContent ?? "";
    expect(apex).toContain("mAI-2.5 Apex");
    expect(apex).not.toContain("GPT-6.1 Sol");
    expect(apex).not.toContain("GPT-6.1 Terra");
    expect(apex).toContain("94.3");
    expect(apex).toContain("74.2 (v2.1)*");

    const omni = getModelById("mai-2.5-omni")?.readmeContent ?? "";
    expect(omni).toContain("mAI-2.5 Omni");
    expect(omni).not.toContain("GPT-6 Luna");
    expect(omni).toContain("73.0");
    expect(omni).toContain("1437 (v2)");

    for (const content of [opal, apex, omni]) {
      expect(content).not.toContain("*[À renseigner]*");
    }
  });

  it("dispose de l'article d'annonce dans apps/site/docs/news/introducing-mai-2.5", () => {
    const root = process.cwd();
    const jsonPath = join(
      root,
      "apps",
      "site",
      "docs",
      "news",
      "introducing-mai-2.5",
      "index.json"
    );
    const mdPath = join(
      root,
      "apps",
      "site",
      "docs",
      "news",
      "introducing-mai-2.5",
      "index.md"
    );

    expect(existsSync(jsonPath)).toBe(true);
    expect(existsSync(mdPath)).toBe(true);

    const json = JSON.parse(readFileSync(jsonPath, "utf8"));
    expect(json.title).toContain("mAI-2.5");
    expect(json.date).toBe("2026-11-19");
    expect(json.image).toBe("/site/icon-25.png");

    const md = readFileSync(mdPath, "utf8");
    expect(md).toContain("![mAI-2.5 — Cover](/site/icon-25.png)");
    expect(md).toContain("mAI-2.5-Opal");
    expect(md).toContain("mAI-2.5-Apex");
    expect(md).toContain("mAI-2.5-Omni");
    expect(md).toContain("Tableau comparatif");
    expect(md).not.toContain("*[À renseigner]*");
    expect(md).not.toContain("GPT-6 Luna");
    expect(md).toContain("94.3");
    expect(md).toContain("73.0");
    expect(md).toContain("60.2 (AA)*");
  });
});

describe("catalogue des modèles mAI-2 (mai-2, mai-2-mini)", () => {
  const modelIds = ["mai-2", "mai-2-mini"] as const;

  it("publie les deux modèles dans modelsData avec le bon backingModel", () => {
    const expectedBacking: Record<string, string> = {
      "mai-2": "deepseek/deepseek-v4.1-flash",
      "mai-2-mini": "minimax/minimax-m3",
    };
    for (const id of modelIds) {
      const card = modelsData.find((m) => m.id === id);
      expect(card).toBeDefined();
      expect(card?.cloud).toBe(true);
      expect(card?.apiAlias).toBe(id);
      expect(card?.backingModel).toBe(expectedBacking[id]);
    }
  });

  it("déclare les deux modèles dans maiModelsList avec les backends et licence Propriétaire", () => {
    const expectedBacking: Record<string, string> = {
      "mai-2": "deepseek/deepseek-v4.1-flash",
      "mai-2-mini": "minimax/minimax-m3",
    };
    for (const id of modelIds) {
      const apiEntry = maiModelsList.find((m) => m.id === id);
      expect(apiEntry).toBeDefined();
      expect(apiEntry?.cloud).toBe(true);
      expect(apiEntry?.contextWindow).toBe(1_000_000);
      expect(apiEntry?.backingModel).toBe(expectedBacking[id]);
      expect(apiEntry?.license).toBe("Propriétaire");
    }
  });

  it("dispose des fichiers README.md avec licence Propriétaire et sans mention MIT", () => {
    const root = process.cwd();
    for (const id of modelIds) {
      const readmePath = join(root, "apps", "site", "docs", id, "README.md");
      expect(existsSync(readmePath)).toBe(true);
      const content = readFileSync(readmePath, "utf8");
      expect(content).toContain("# mAI-2");
      expect(content).toContain("## Benchmarks");
      expect(content).toContain("| Licence indiquée | Propriétaire |");
      expect(content).not.toContain("MIT");
    }
  });
});

describe("restrictions des plans (Free vs Plus, Pro, Max) sur mAI-2 et mAI-2.5", () => {
  it("attribue isFree: true à mAI-2, mAI-2-Mini et mAI-2.5-Omni, et isFree: false à Opal et Apex", () => {
    const opal = FALLBACK_MODELS.find((m) => m.id === "mai-2.5-opal");
    const apex = FALLBACK_MODELS.find((m) => m.id === "mai-2.5-apex");
    const omni = FALLBACK_MODELS.find((m) => m.id === "mai-2.5-omni");
    const mai2 = FALLBACK_MODELS.find((m) => m.id === "mai-2");
    const mai2Mini = FALLBACK_MODELS.find((m) => m.id === "mai-2-mini");

    expect(omni?.isFree).toBe(true);
    expect(mai2?.isFree).toBe(true);
    expect(mai2Mini?.isFree).toBe(true);

    expect(opal?.isFree).toBe(false);
    expect(apex?.isFree).toBe(false);
  });

  it("bloque mAI-2.5-Opal et Apex pour un compte Free dans requireChatModel", async () => {
    const fakeSql = (() => Promise.resolve([])) as any;

    await expect(
      requireChatModel(fakeSql, "mai-2.5-opal", false, "openai/gpt-6.1-sol")
    ).rejects.toThrow(ModelAccessError);

    await expect(
      requireChatModel(fakeSql, "mai-2.5-apex", false, "openai/gpt-6.1-terra")
    ).rejects.toThrow(ModelAccessError);
  });

  it("autorise les modèles :free et mAI gratuits (mai-2, mai-2-mini, mai-2.5-omni) pour un compte Free", async () => {
    const mockModel = {
      id: "google/gemini-2.5-flash:free",
      is_available: true,
      isActive: true,
      provider: "google",
      type: "chat",
    };
    const fakeSql = (() => Promise.resolve([mockModel])) as any;

    // :free est autorisé et ne lance pas d'erreur d'accès
    try {
      await requireChatModel(fakeSql, "google/gemini-2.5-flash:free", false);
    } catch (e) {
      if (e instanceof ModelAccessError) {
        expect(e.status).not.toBe(403);
      }
    }

    // mai-2.5-omni n'échoue pas au contrôle 403 de plan
    try {
      await requireChatModel(
        fakeSql,
        "mai-2.5-omni",
        false,
        "openai/gpt-6-luna"
      );
    } catch (e) {
      if (e instanceof ModelAccessError) {
        expect(e.status).not.toBe(403);
      }
    }
  });
});
