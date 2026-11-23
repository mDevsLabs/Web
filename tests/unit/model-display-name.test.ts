import { describe, expect, it } from "vitest";
import {
  FALLBACK_MODELS,
  formatModelName,
  normalizeModelDisplayName,
  stripModelNameParentheses,
} from "@/lib/ai/models";

describe("noms affichés des modèles sans parenthèses", () => {
  it("supprime tous les commentaires entre parenthèses dans un nom de modèle", () => {
    expect(stripModelNameParentheses("Gemma 4 26B A4B (Free)")).toBe(
      "Gemma 4 26B A4B"
    );
    expect(
      stripModelNameParentheses("Gemini 2.5 Pro (Experimental) (Preview)")
    ).toBe("Gemini 2.5 Pro");
    expect(stripModelNameParentheses("DeepSeek R1 (Raisonnement)")).toBe(
      "DeepSeek R1"
    );
  });

  it("ne ré-ajoute jamais (Free) ni d'autres parenthèses via normalizeModelDisplayName", () => {
    expect(
      normalizeModelDisplayName(
        "google/gemma-4-26b-a4b-it:free",
        "Google: Gemma 4 26B A4B (Free)"
      )
    ).toBe("Gemma 4 26B A4B");

    expect(
      normalizeModelDisplayName(
        "google/gemma-4-31b-it:free",
        "Google: Gemma 4 31B (free)"
      )
    ).toBe("Gemma 4 31B");

    expect(
      normalizeModelDisplayName(
        "openai/gpt-5-preview",
        "OpenAI: GPT-5 (Preview) (2025)"
      )
    ).toBe("GPT-5");

    expect(normalizeModelDisplayName("nvidia/nemotron-3-ultra:free")).toBe(
      "Nemotron 3 Ultra"
    );
  });

  it("conserve isFree sans polluer le nom dans formatModelName", () => {
    const r1 = formatModelName("deepseek/deepseek-r1:free");
    expect(r1.isFree).toBe(true);
    expect(r1.name).toBe("DeepSeek R1");
    expect(r1.name).not.toMatch(/[()]/);
  });

  it("ne contient aucune parenthèse dans les noms ni descriptions de FALLBACK_MODELS", () => {
    for (const model of FALLBACK_MODELS) {
      expect(model.name).not.toMatch(/[()]/);
      expect(model.description).not.toMatch(/\(Gratuit\)|\(Free\)/i);
    }
  });
});
