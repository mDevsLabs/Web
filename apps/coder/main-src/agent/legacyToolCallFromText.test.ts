import { describe, expect, it } from "vitest";
import {
  createLegacyToolCallStreamFilter,
  extractLegacyToolCallsFromAssistantText,
  stripLegacyToolCallMarkup,
} from "./legacyToolCallFromText.js";

describe("legacyToolCallFromText", () => {
  it("extracts tool calls and strips markup from assistant text", () => {
    const raw =
      'Hello\n<tool_call tool="Read">{"file_path":"src/App.tsx"}</tool_call>\nDone';
    const { text, toolCalls } = extractLegacyToolCallsFromAssistantText(
      raw,
      "tc_"
    );
    expect(text).toBe("Hello\n\nDone");
    expect(toolCalls).toHaveLength(1);
    expect(toolCalls[0]!.name).toBe("Read");
    expect(JSON.parse(toolCalls[0]!.arguments)).toEqual({
      file_path: "src/App.tsx",
    });
    expect(toolCalls[0]!.id.startsWith("tc_")).toBe(true);
  });

  it("stripLegacyToolCallMarkup removes blocks without returning calls", () => {
    const raw = 'x<tool_call tool="Grep">{"pattern":"foo"}</tool_call>y';
    expect(stripLegacyToolCallMarkup(raw)).toBe("xy");
  });

  it("stream filter suppresses tool_call chunks until closed", () => {
    const f = createLegacyToolCallStreamFilter("s_");
    expect(f.feed("before ")).toBe("before ");
    expect(f.feed('<tool_call tool="Read">{"file_path":"a.ts"}')).toBe("");
    expect(f.feed("</tool_call> after")).toBe(" after");
    expect(f.finish()).toBe("");
    expect(f.toolCalls).toHaveLength(1);
    expect(f.toolCalls[0]!.name).toBe("Read");
  });
});
