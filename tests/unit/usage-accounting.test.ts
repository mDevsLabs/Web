import { describe, expect, it } from "vitest";
import {
  ensureUsageIncluded,
  estimateTokensFromText,
  extractUsageFromSseText,
  extractUsageTokens,
  MAX_TOKENS_PER_EVENT,
  parseUsageLogPayload,
} from "../../usage-accounting";

describe("/log-usage — validation des consommations", () => {
  it("accepte des valeurs normales et calcule le total", () => {
    expect(
      parseUsageLogPayload({ inputTokens: 120, outputTokens: 80 })
    ).toEqual({
      ok: true,
      value: { inputTokens: 120, outputTokens: 80, tokensUsed: 200 },
    });
    expect(parseUsageLogPayload({ tokensUsed: 42 })).toEqual({
      ok: true,
      value: { inputTokens: 0, outputTokens: 0, tokensUsed: 42 },
    });
    expect(
      parseUsageLogPayload({ completionTokens: "5", promptTokens: "10" })
    ).toEqual({
      ok: true,
      value: { inputTokens: 10, outputTokens: 5, tokensUsed: 15 },
    });
  });

  it("refuse une consommation négative (aucune diminution du compteur)", () => {
    expect(parseUsageLogPayload({ tokensUsed: -1000 }).ok).toBe(false);
    expect(parseUsageLogPayload({ inputTokens: -1 }).ok).toBe(false);
    expect(
      parseUsageLogPayload({ inputTokens: 10, outputTokens: 2, tokensUsed: -5 })
        .ok
    ).toBe(false);
  });

  it("refuse NaN, infini et les nombres non entiers", () => {
    expect(parseUsageLogPayload({ tokensUsed: Number.NaN }).ok).toBe(false);
    expect(
      parseUsageLogPayload({ tokensUsed: Number.POSITIVE_INFINITY }).ok
    ).toBe(false);
    expect(parseUsageLogPayload({ tokensUsed: 1.5 }).ok).toBe(false);
  });

  it("refuse les chaînes mal formées et les types inattendus", () => {
    expect(parseUsageLogPayload({ tokensUsed: "1e3" }).ok).toBe(false);
    expect(parseUsageLogPayload({ tokensUsed: "0x10" }).ok).toBe(false);
    expect(parseUsageLogPayload({ tokensUsed: " 12 " }).ok).toBe(true);
    expect(parseUsageLogPayload({ tokensUsed: {} }).ok).toBe(false);
    expect(parseUsageLogPayload(null).ok).toBe(false);
    expect(parseUsageLogPayload([]).ok).toBe(false);
  });

  it("refuse un dépassement de borne explicite", () => {
    expect(
      parseUsageLogPayload({ tokensUsed: MAX_TOKENS_PER_EVENT + 1 }).ok
    ).toBe(false);
    expect(
      parseUsageLogPayload({
        inputTokens: MAX_TOKENS_PER_EVENT,
        outputTokens: 1,
      }).ok
    ).toBe(false);
    expect(parseUsageLogPayload({ tokensUsed: MAX_TOKENS_PER_EVENT }).ok).toBe(
      true
    );
  });

  it("refuse un total explicite inférieur à la somme déclarée", () => {
    expect(
      parseUsageLogPayload({
        inputTokens: 100,
        outputTokens: 50,
        tokensUsed: 120,
      })
    ).toEqual({
      error: "tokensUsed est inférieur à la somme input/output déclarée.",
      ok: false,
    });
  });

  it("accepte un total explicite supérieur (raisonnement inclus)", () => {
    expect(
      parseUsageLogPayload({
        inputTokens: 100,
        outputTokens: 50,
        tokensUsed: 180,
      }).ok
    ).toBe(true);
  });
});

describe("Usage réel des générations directes", () => {
  it("lit le dialecte OpenAI", () => {
    expect(
      extractUsageTokens({
        usage: { completion_tokens: 20, prompt_tokens: 10, total_tokens: 30 },
      })
    ).toBe(30);
    expect(
      extractUsageTokens({
        usage: { completion_tokens: 20, prompt_tokens: 10 },
      })
    ).toBe(30);
  });

  it("lit le dialecte Anthropic", () => {
    expect(
      extractUsageTokens({ usage: { input_tokens: 12, output_tokens: 34 } })
    ).toBe(46);
  });

  it("lit le dialecte Gemini", () => {
    expect(
      extractUsageTokens({
        usageMetadata: {
          candidatesTokenCount: 7,
          promptTokenCount: 5,
          totalTokenCount: 12,
        },
      })
    ).toBe(12);
  });

  it("retourne null sans usage exploitable", () => {
    expect(extractUsageTokens({})).toBeNull();
    expect(extractUsageTokens({ usage: {} })).toBeNull();
    expect(extractUsageTokens(null)).toBeNull();
  });

  it("lit l'usage final d'un flux SSE, y compris réparti sur plusieurs chunks", () => {
    const first = 'data: {"choices":[{"delta":{"content":"Bonjour"}}]}\n\n';
    const second =
      'data: {"choices":[],"usage":{"prompt_tokens":9,"completion_tokens":4,"total_tokens":13}}\n\ndata: [DONE]\n\n';
    expect(extractUsageFromSseText(first)).toBeNull();
    expect(extractUsageFromSseText(first + second)).toBe(13);
  });

  it("ignore une ligne JSON partielle sans lever", () => {
    expect(
      extractUsageFromSseText('data: {"usage":{"total_tokens":99')
    ).toBeNull();
  });

  it("demande l'usage au fournisseur pour les flux, sans muter le body", () => {
    const body = { messages: [], model: "x", stream: true };
    const next = ensureUsageIncluded(body);
    expect(next.stream_options).toEqual({ include_usage: true });
    expect(body).toEqual({ messages: [], model: "x", stream: true });
    expect(
      ensureUsageIncluded({ stream: false }).stream_options
    ).toBeUndefined();
  });

  it("estime un repli borné et non nul pour un texte non vide", () => {
    expect(estimateTokensFromText("")).toBe(0);
    expect(estimateTokensFromText("abcd")).toBe(1);
    expect(estimateTokensFromText("a".repeat(400))).toBe(100);
  });
});
