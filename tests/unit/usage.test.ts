import { describe, expect, it } from "vitest";
import {
  addNormalizedUsage,
  emptyNormalizedUsage,
  estimateRunCost,
  normalizeProviderUsage,
  readReasoningDetails,
  readReasoningTokens,
  resolveBillableTotal,
} from "@/lib/agent/usage";

describe("Usage provider normalisé", () => {
  it("normalise les deux conventions de nommage du SDK", () => {
    const usage = normalizeProviderUsage(
      { cachedInputTokens: 25, completionTokens: 40, promptTokens: 100 },
      { latencyMs: 850, provider: "google" }
    );
    expect(usage.inputTokens).toBe(100);
    expect(usage.outputTokens).toBe(40);
    expect(usage.totalTokens).toBe(140);
    expect(usage.cacheReadTokens).toBe(25);
    expect(usage.provider).toBe("google");
    expect(usage.latencyMs).toBe(850);
  });

  it("ignore les valeurs non numériques et négatives", () => {
    const usage = normalizeProviderUsage({
      inputTokens: "beaucoup",
      outputTokens: -5,
    });
    expect(usage.inputTokens).toBe(0);
    expect(usage.outputTokens).toBe(0);
    expect(usage.totalTokens).toBe(0);
  });

  it("additionne les usages de plusieurs étapes", () => {
    const a = normalizeProviderUsage({ inputTokens: 10, outputTokens: 5 });
    const b = normalizeProviderUsage({ inputTokens: 7, outputTokens: 3 });
    const total = addNormalizedUsage(a, b);
    expect(total.inputTokens).toBe(17);
    expect(total.outputTokens).toBe(8);
    expect(total.totalTokens).toBe(25);
    expect(total.retries).toBe(0);
  });

  it("propage le nombre de retries et les unités de calcul", () => {
    const usage = normalizeProviderUsage(
      { inputTokens: 1 },
      { provider: "openai", retries: 2 }
    );
    usage.computeUnits = 3;
    const merged = addNormalizedUsage(usage, emptyNormalizedUsage());
    expect(merged.retries).toBe(2);
    expect(merged.computeUnits).toBe(3);
  });

  it("refuse d'estimer un coût sans tarifs configurés", () => {
    expect(estimateRunCost()).toBeNull();
  });
});
describe("Lecture des tokens de réflexion", () => {
  it("lit la décomposition réellement livrée par onFinish", () => {
    // Forme de ai@7 : outputTokens est À PLAT et inclut déjà la réflexion,
    // outputTokenDetails porte le sous-ensemble. C'est ce que reçoit
    // onFinish({ usage }) dans le Chat comme dans l'Agent.
    const usage = {
      inputTokens: 10_500,
      outputTokenDetails: { reasoningTokens: 8200, textTokens: 1400 },
      outputTokens: 9600,
      totalTokens: 20_100,
    };
    expect(readReasoningTokens(usage)).toBe(8200);
  });

  it("lit la forme brute du fournisseur, en snake_case", () => {
    expect(
      readReasoningTokens({
        completion_tokens_details: { reasoning_tokens: 512 },
      })
    ).toBe(512);
  });

  it("lit la forme plate et l'ancienne forme camelCase", () => {
    expect(readReasoningTokens({ reasoningTokens: 256 })).toBe(256);
    expect(
      readReasoningTokens({ completionTokensDetails: { reasoningTokens: 128 } })
    ).toBe(128);
  });

  it("tolère la forme imbriquée des anciens runtimes", () => {
    expect(
      readReasoningTokens({ outputTokens: { reasoning: 64, text: 10 } })
    ).toBe(64);
  });

  it("renvoie zéro plutôt que d'inventer une valeur", () => {
    for (const raw of [
      null,
      undefined,
      {},
      "beaucoup",
      { completion_tokens_details: null },
      { outputTokenDetails: null },
      { completion_tokens_details: { reasoning_tokens: -10 } },
    ]) {
      expect(readReasoningTokens(raw)).toBe(0);
    }
  });
});

describe("Le total facturé ne compte jamais la réflexion deux fois", () => {
  const call = (
    inputTokens: number,
    outputTokens: number,
    reasoningTokens: number,
    totalTokens: number
  ) =>
    resolveBillableTotal({
      inputTokens,
      outputTokens,
      reasoningTokens,
      totalTokens,
    });

  it("respecte le total amont, qui inclut déjà la réflexion", () => {
    // Cas réel de ai@7 : outputTokens = 9 600 (dont 8 200 de réflexion),
    // totalTokens = 20 100. Ajouter 8 200 donnerait 28 300 et facturerait
    // deux fois la réflexion.
    expect(call(10_500, 9600, 8200, 20_100)).toBe(20_100);
  });

  it("ne recompose que lorsqu'aucun total n'est fourni", () => {
    // Sans total amont, entrée + sortie : la réflexion y est déjà incluse.
    expect(call(10_500, 9600, 8200, 0)).toBe(20_100);
  });

  it("ignore les compteurs négatifs plutôt que de les soustraire", () => {
    expect(call(-10, 50, 0, 0)).toBe(50);
    expect(call(100, 50, 0, -5)).toBe(150);
  });

  it("conserve un total amont supérieur à la somme des parties", () => {
    // Certains fournisseurs comptent des tokens que nous ne ventilons pas
    // (cache, brouillon). Sous-facturer serait pire que rester approximatif.
    expect(call(100, 50, 10, 1000)).toBe(1000);
  });

  it("ne bouge pas pour un appel sans réflexion", () => {
    expect(call(100, 50, 0, 150)).toBe(150);
  });
});

describe("reasoning_details est conservé sans faire échouer l'appelant", () => {
  it("lit la forme du fournisseur", () => {
    const details = readReasoningDetails({
      reasoning_details: [
        { signature: "abc", text: "On commence par…" },
        { text: "Puis on vérifie.", type: "reasoning.text" },
      ],
    });
    expect(details).toHaveLength(2);
    expect(details[0].text).toBe("On commence par…");
  });

  it("plafonne la collecte", () => {
    const raw = {
      reasoning_details: Array.from({ length: 500 }, (_, i) => ({ i })),
    };
    expect(readReasoningDetails(raw)).toHaveLength(20);
    expect(readReasoningDetails(raw, 5)).toHaveLength(5);
  });

  it("tolère une forme inattendue", () => {
    for (const raw of [
      null,
      {},
      { reasoning_details: "texte" },
      { reasoning_details: null },
    ]) {
      expect(readReasoningDetails(raw)).toEqual([]);
    }
  });

  it("ignore les entrées non object", () => {
    expect(
      readReasoningDetails({
        reasoning_details: ["texte", null, 42, { a: 1 }],
      })
    ).toEqual([{ a: 1 }]);
  });
});
