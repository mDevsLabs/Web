import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import type OpenAI from "openai";
import { describe, expect, it } from "vitest";
import {
  repairAnthropicToolPairing,
  repairOpenAIToolPairing,
} from "./apiConversationRepair.js";

describe("repairOpenAIToolPairing", () => {
  it("drops leading orphan tool messages", () => {
    const msgs: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { content: "sys", role: "system" },
      { content: "orphan", role: "tool", tool_call_id: "x" },
      { content: "hi", role: "user" },
    ];
    const out = repairOpenAIToolPairing(msgs);
    expect(out.map((m) => m.role)).toEqual(["system", "user"]);
  });

  it("synthesizes missing tool responses after assistant tool_calls", () => {
    const msgs: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        content: null,
        role: "assistant",
        tool_calls: [
          {
            function: { arguments: "{}", name: "fn" },
            id: "a",
            type: "function",
          },
          {
            function: { arguments: "{}", name: "fn2" },
            id: "b",
            type: "function",
          },
        ],
      },
      { content: "ok", role: "tool", tool_call_id: "a" },
    ];
    const out = repairOpenAIToolPairing(msgs);
    expect(out).toHaveLength(3);
    expect(out[1]).toMatchObject({ role: "tool", tool_call_id: "a" });
    expect(out[2]).toMatchObject({ role: "tool", tool_call_id: "b" });
    expect(String((out[2] as { content?: unknown }).content)).toContain(
      "pairing repair"
    );
  });
});

describe("repairAnthropicToolPairing", () => {
  it("adds user tool_result block when missing after tool_use", () => {
    const msgs: MessageParam[] = [
      {
        content: [
          { text: "t", type: "text" },
          {
            id: "tu_1",
            input: { file_path: "a.ts" },
            name: "Read",
            type: "tool_use",
          },
        ],
        role: "assistant",
      },
    ];
    const out = repairAnthropicToolPairing(msgs);
    expect(out).toHaveLength(2);
    expect(out[1]!.role).toBe("user");
    const c = out[1]!.content;
    expect(Array.isArray(c)).toBe(true);
    const arr = c as {
      type: string;
      tool_use_id?: string;
      is_error?: boolean;
    }[];
    expect(
      arr.some((b) => b.type === "tool_result" && b.tool_use_id === "tu_1")
    ).toBe(true);
  });

  it("strips orphan user message that is only tool_results without preceding assistant", () => {
    const msgs: MessageParam[] = [
      {
        content: [
          {
            content: "x",
            is_error: false,
            tool_use_id: "ghost",
            type: "tool_result",
          },
        ],
        role: "user",
      },
      { content: "real question", role: "user" },
    ];
    const out = repairAnthropicToolPairing(msgs);
    expect(out).toHaveLength(2);
    expect(out[0]!.role).toBe("user");
    expect(Array.isArray(out[0]!.content)).toBe(true);
    expect(out[1]).toMatchObject({ content: "real question", role: "user" });
  });
});

describe("repairOpenAIToolPairing cross-message dedupe", () => {
  it("strips duplicate tool_call id in a later assistant (CC-1212)", () => {
    const msgs: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        content: null,
        role: "assistant",
        tool_calls: [
          {
            function: { arguments: "{}", name: "Read" },
            id: "dup",
            type: "function",
          },
        ],
      },
      { content: "ok", role: "tool", tool_call_id: "dup" },
      {
        content: null,
        role: "assistant",
        tool_calls: [
          {
            function: { arguments: "{}", name: "Read" },
            id: "dup",
            type: "function",
          },
        ],
      },
    ];
    const out = repairOpenAIToolPairing(msgs);
    const secondAssist = out.find((m, i) => m.role === "assistant" && i > 1) as
      | OpenAI.Chat.ChatCompletionAssistantMessageParam
      | undefined;
    expect(secondAssist?.tool_calls?.length ?? 0).toBe(0);
  });
});
