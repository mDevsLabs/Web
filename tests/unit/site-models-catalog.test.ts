import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { maiModelsList } from "@/lib/site/mai-models";
import { modelsData } from "@/lib/site/models-data";
import {
  resolveMaiIdentityPrompt,
  resolveMaiModelTraits,
} from "@/mai-identity";

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

  it("dispose des fiches de documentation dans apps/site/docs/documentation/", () => {
    const root = process.cwd();
    for (const id of modelIds) {
      const docPath = join(
        root,
        "apps",
        "site",
        "docs",
        "documentation",
        `model-${id}.md`
      );
      expect(existsSync(docPath)).toBe(true);
      const content = readFileSync(docPath, "utf8");
      expect(content).toContain(`category: "Modèles d'IA"`);
      expect(content).toContain("1 000 000 tokens");
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

    const md = readFileSync(mdPath, "utf8");
    expect(md).toContain("mAI-2.5-Opal");
    expect(md).toContain("mAI-2.5-Apex");
    expect(md).toContain("mAI-2.5-Omni");
    expect(md).toContain("Tableau comparatif");
  });
});
