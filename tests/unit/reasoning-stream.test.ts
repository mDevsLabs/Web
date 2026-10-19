import { describe, expect, it } from "vitest";
import { createReasoningChunkWriter } from "@/lib/ai/reasoning-stream";

function collector() {
  const chunks: unknown[] = [];
  return {
    chunks,
    writer: { write: (chunk: unknown) => chunks.push(chunk) },
  };
}

describe("writer de réflexion", () => {
  it("ouvre, écrit puis ferme la part une seule fois", () => {
    const { chunks, writer } = collector();
    const reasoning = createReasoningChunkWriter(writer, "r1");
    reasoning.push("Je");
    reasoning.push(" réfléchis");
    reasoning.finish();
    reasoning.finish();
    expect(chunks).toEqual([
      { id: "r1", type: "reasoning-start" },
      { delta: "Je", id: "r1", type: "reasoning-delta" },
      { delta: " réfléchis", id: "r1", type: "reasoning-delta" },
      { id: "r1", type: "reasoning-end" },
    ]);
  });

  it("n'ouvre aucune part sans texte", () => {
    const { chunks, writer } = collector();
    const reasoning = createReasoningChunkWriter(writer, "r1");
    reasoning.push("");
    reasoning.finish();
    expect(chunks).toEqual([]);
  });

  it("ignore un flux déjà fermé au lieu de lever", () => {
    const writer = {
      write: () => {
        throw new Error("flux fermé");
      },
    };
    const reasoning = createReasoningChunkWriter(writer, "r1");
    expect(() => {
      reasoning.push("texte");
      reasoning.finish();
    }).not.toThrow();
  });
});
