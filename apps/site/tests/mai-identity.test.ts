import { describe, expect, it } from "vitest";

import {
  injectMaiIdentityPrompt,
  resolveMaiIdentityPrompt,
} from "@/mai-identity";

const MAI_2 = "You are mAI-2, developed by mAI.";
const MAI_2_MINI = "You are mAI-2 Mini, developed by mAI.";

describe("mAI identity prompt", () => {
  it("names the model actually requested", () => {
    expect(resolveMaiIdentityPrompt("mai-2")).toBe(MAI_2);
    expect(resolveMaiIdentityPrompt("mai-2-mini")).toBe(MAI_2_MINI);
  });

  it("normalizes the alias the way the routing layer does", () => {
    expect(resolveMaiIdentityPrompt("MAI-2")).toBe(MAI_2);
    expect(resolveMaiIdentityPrompt("  mAI-2-Mini  ")).toBe(MAI_2_MINI);
    expect(resolveMaiIdentityPrompt("mdevslabs/mai-2-mini")).toBe(MAI_2_MINI);
  });

  it("stays silent for every other model", () => {
    for (const model of [
      "mai-1.5-apex",
      "mai-2-preview",
      "mai-20",
      "deepseek/deepseek-v4.1-flash",
      "anthropic/claude-opus-5.5",
      "",
      null,
      undefined,
    ]) {
      expect(resolveMaiIdentityPrompt(model)).toBeNull();
    }
  });

  it("prefixes an OpenAI conversation without dropping the client prompt", () => {
    const body = {
      messages: [
        { content: "Tu es un ingénieur IA.", role: "system" },
        { content: "Bonjour", role: "user" },
      ],
      model: "deepseek/deepseek-v4.1-flash",
    };

    const result = injectMaiIdentityPrompt(body, "mai-2");

    expect(result.messages).toEqual([
      { content: MAI_2, role: "system" },
      { content: "Tu es un ingénieur IA.", role: "system" },
      { content: "Bonjour", role: "user" },
    ]);
  });

  it("adds the OpenAI prompt when the client sent none", () => {
    const result = injectMaiIdentityPrompt(
      { messages: [{ content: "Bonjour", role: "user" }] },
      "mai-2-mini"
    );

    expect(result.messages).toEqual([
      { content: MAI_2_MINI, role: "system" },
      { content: "Bonjour", role: "user" },
    ]);
  });

  it("prepends an Anthropic string prompt", () => {
    const result = injectMaiIdentityPrompt(
      { messages: [], system: "Sois bref." },
      "mai-2",
      "anthropic"
    );

    expect(result.system).toBe(`${MAI_2}\n\nSois bref.`);
  });

  it("prepends an Anthropic block prompt and creates it when absent", () => {
    const blocks = injectMaiIdentityPrompt(
      { system: [{ text: "Sois bref.", type: "text" }] },
      "mai-2-mini",
      "anthropic"
    );
    expect(blocks.system).toEqual([
      { text: MAI_2_MINI, type: "text" },
      { text: "Sois bref.", type: "text" },
    ]);

    expect(
      injectMaiIdentityPrompt<Record<string, any>>({}, "mai-2-mini", "anthropic")
        .system
    ).toBe(MAI_2_MINI);
  });

  it("prepends a Gemini system instruction", () => {
    const result = injectMaiIdentityPrompt(
      {
        contents: [{ parts: [{ text: "Décris cette image." }], role: "user" }],
        systemInstruction: { parts: [{ text: "Réponds en français." }] },
      },
      "mai-2",
      "gemini"
    );

    expect(result.systemInstruction.parts).toEqual([
      { text: MAI_2 },
      { text: "Réponds en français." },
    ]);
    expect(result.contents).toHaveLength(1);
  });

  it("creates the Gemini system instruction for an empty body", () => {
    // L'endpoint Gemini tolère un corps vide (le modèle est dans l'URL) :
    // le prompt obligatoire doit tout de même être présent.
    const result = injectMaiIdentityPrompt<Record<string, any>>(
      {},
      "mai-2",
      "gemini"
    );

    expect(result.systemInstruction).toEqual({ parts: [{ text: MAI_2 }] });
  });

  it("is idempotent so a retried request is not doubled", () => {
    const once = injectMaiIdentityPrompt(
      { messages: [{ content: "Bonjour", role: "user" }] },
      "mai-2"
    );
    const twice = injectMaiIdentityPrompt(once, "mai-2");

    expect(twice.messages).toEqual(once.messages);
    expect(twice.messages).toHaveLength(2);
  });

  it("never mutates the caller's body", () => {
    const body = { messages: [{ content: "Bonjour", role: "user" }] };

    injectMaiIdentityPrompt(body, "mai-2");

    expect(body.messages).toEqual([{ content: "Bonjour", role: "user" }]);
  });

  it("leaves third-party models byte-for-byte identical", () => {
    const body = {
      messages: [{ content: "Bonjour", role: "user" }],
      model: "anthropic/claude-opus-5.5",
    };

    expect(injectMaiIdentityPrompt(body, body.model)).toBe(body);
  });
});