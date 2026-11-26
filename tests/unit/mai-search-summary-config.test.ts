import { describe, expect, it } from "vitest";
import {
  DEFAULT_CHAT_MODEL,
  FALLBACK_MODELS,
  formatModelName,
} from "@/lib/ai/models";
import {
  getModelCapabilitiesFor,
  resolveReasoningEffort,
} from "@/lib/ai/registry";
import {
  extractSummarySearchResults,
  resolveSummaryModelId,
} from "@/lib/search/summary-config";
import { MAI_SEARCH_SUMMARY_MODEL_ID } from "@/lib/search/summary-stream";

describe("configuration de la synthèse mAI Search", () => {
  it("impose mAI-2.5 Omni comme modèle de synthèse mAI Search", () => {
    expect(MAI_SEARCH_SUMMARY_MODEL_ID).toBe("mai-2.5-omni");
    expect(formatModelName(MAI_SEARCH_SUMMARY_MODEL_ID).name).toBe(
      "mAI-2.5 Omni"
    );
  });

  it("retient mai-2.5-omni pour tous les forfaits lorsqu'il est dans le catalogue", () => {
    for (const tier of ["free", "plus", "pro", "max", null, undefined]) {
      expect(resolveSummaryModelId({ catalogue: FALLBACK_MODELS, tier })).toBe(
        "mai-2.5-omni"
      );
    }
    expect(resolveSummaryModelId({ catalogue: [], tier: "free" })).toBe(
      "mai-2.5-omni"
    );
  });

  it("retombe sur le modèle par défaut si le catalogue non vide exclut mai-2.5-omni", () => {
    expect(
      resolveSummaryModelId({
        catalogue: [{ id: DEFAULT_CHAT_MODEL }],
        tier: "free",
      })
    ).toBe(DEFAULT_CHAT_MODEL);
  });

  it("recadre la préférence de réflexion par défaut sur les niveaux supportés par mAI-2.5 Omni", () => {
    const capabilities = getModelCapabilitiesFor(
      MAI_SEARCH_SUMMARY_MODEL_ID,
      FALLBACK_MODELS
    );
    expect(
      resolveReasoningEffort({ capabilities, preferred: "medium" }).effort
    ).toBe("high");
    expect(
      resolveReasoningEffort({ capabilities, preferred: "low" }).effort
    ).toBe("low");
    expect(
      resolveReasoningEffort({ capabilities, preferred: "max" }).effort
    ).toBe("max");
  });

  it("extrait searchResults en priorité et tolère sources en repli", () => {
    const fromSearchResults = [{ title: "A", url: "https://a.fr" }];
    const fromSources = [{ title: "B", url: "https://b.fr" }];

    expect(
      extractSummarySearchResults({ searchResults: fromSearchResults })
    ).toEqual(fromSearchResults);
    expect(extractSummarySearchResults({ sources: fromSources })).toEqual(
      fromSources
    );
    expect(
      extractSummarySearchResults({
        searchResults: fromSearchResults,
        sources: fromSources,
      })
    ).toEqual(fromSearchResults);
    expect(extractSummarySearchResults(null)).toEqual([]);
    expect(extractSummarySearchResults({})).toEqual([]);
  });
});
