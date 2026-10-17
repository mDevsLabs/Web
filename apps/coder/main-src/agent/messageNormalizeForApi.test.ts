import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import type OpenAI from "openai";
import { describe, expect, it } from "vitest";
import {
  mergeAdjacentAnthropicUserMessages,
  normalizeAnthropicMessagesForApi,
  normalizeOpenAIMessagesForApi,
  stripOrphanAnthropicServerToolUsesInAssistant,
} from "./messageNormalizeForApi.js";

describe("mergeAdjacentAnthropicUserMessages", () => {
  it("merges consecutive string users", () => {
    const msgs: MessageParam[] = [
      { content: "a", role: "user" },
      { content: "b", role: "user" },
    ];
    const out = mergeAdjacentAnthropicUserMessages(msgs);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ role: "user" });
    const c = out[0]!.content;
    expect(Array.isArray(c)).toBe(true);
    const arr = c as { type: string; text?: string }[];
    expect(arr[0]!.type).toBe("text");
    expect(arr[0]!.text).toBe("a\n");
    expect(arr[1]!.text).toBe("b");
  });

  it("hoists tool_result before text when merging block users", () => {
    const msgs: MessageParam[] = [
      {
        content: [
          { text: "ctx", type: "text" },
          {
            content: "r",
            is_error: false,
            tool_use_id: "x",
            type: "tool_result",
          },
        ],
        role: "user",
      },
      { content: "more", role: "user" },
    ];
    const out = mergeAdjacentAnthropicUserMessages(msgs);
    expect(out).toHaveLength(1);
    const arr = out[0]!.content as { type: string }[];
    expect(arr[0]!.type).toBe("tool_result");
  });
});

describe("stripOrphanAnthropicServerToolUsesInAssistant", () => {
  it("removes server_tool_use without matching tool_use_id in same message", () => {
    const blocks = [
      {
        id: "srv1",
        input: {},
        name: "web_search",
        type: "server_tool_use" as const,
      },
      { text: "hi", type: "text" as const },
    ] as unknown as import("@anthropic-ai/sdk/resources/messages").ContentBlockParam[];
    const out = stripOrphanAnthropicServerToolUsesInAssistant(blocks);
    expect(out).toHaveLength(1);
    expect((out[0] as { type: string }).type).toBe("text");
  });

  it("keeps server_tool_use when a block references tool_use_id", () => {
    const blocks = [
      {
        id: "srv1",
        input: {},
        name: "web_search",
        type: "server_tool_use" as const,
      },
      {
        content: "done",
        is_error: false,
        tool_use_id: "srv1",
        type: "tool_result" as const,
      },
    ] as unknown as import("@anthropic-ai/sdk/resources/messages").ContentBlockParam[];
    const out = stripOrphanAnthropicServerToolUsesInAssistant(blocks);
    expect(out).toHaveLength(2);
  });
});

describe("normalizeAnthropicMessagesForApi", () => {
  it("merges consecutive plain-string assistants", () => {
    const msgs: MessageParam[] = [
      { content: "part1", role: "assistant" },
      { content: "part2", role: "assistant" },
    ];
    const out = normalizeAnthropicMessagesForApi(msgs);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      content: "part1\n\npart2",
      role: "assistant",
    });
  });
});

describe("normalizeOpenAIMessagesForApi", () => {
  it("merges adjacent string users and plain assistants", () => {
    const msgs: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { content: "u1", role: "user" },
      { content: "u2", role: "user" },
      { content: "a1", role: "assistant" },
      { content: "a2", role: "assistant" },
    ];
    const out = normalizeOpenAIMessagesForApi(msgs);
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ content: "u1\n\nu2", role: "user" });
    expect(out[1]).toMatchObject({ content: "a1\n\na2", role: "assistant" });
  });
});
