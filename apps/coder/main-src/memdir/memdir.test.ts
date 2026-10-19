import { describe, expect, it } from "vitest";
import { buildMemoryPrompt, truncateEntrypointContent } from "./memdir.js";

describe("truncateEntrypointContent", () => {
  it("truncates oversized entrypoints and appends a warning", () => {
    const raw = Array.from(
      { length: 240 },
      (_, i) => `- [Entry ${i}](e${i}.md) — hook`
    ).join("\n");
    const out = truncateEntrypointContent(raw);
    expect(out.wasLineTruncated).toBe(true);
    expect(out.content).toContain("WARNING: MEMORY.md");
    expect(out.content.split("\n").length).toBeGreaterThan(200);
  });
});

describe("buildMemoryPrompt", () => {
  it("returns null when no workspace root is provided", () => {
    expect(buildMemoryPrompt(null)).toBeNull();
  });
});
