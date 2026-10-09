import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import type OpenAI from "openai";
import { describe, expect, it } from "vitest";
import {
  type AgentContextCompactState,
  compactAnthropicConversationForContext,
  compactOpenAIConversationForContext,
} from "./agentConversationContext.js";

const large = (label: string) => `${label} ${"x".repeat(5000)}`;

describe("compactOpenAIConversationForContext", () => {
  it("compacts old API rounds and preserves recent tool call pairs", async () => {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { content: "system prompt", role: "system" },
    ];
    for (let i = 0; i < 10; i++) {
      messages.push({ content: large(`user ${i}`), role: "user" });
      messages.push({
        content: null,
        role: "assistant",
        tool_calls: [
          {
            function: { arguments: "{}", name: "Shell" },
            id: `call_${i}`,
            type: "function",
          },
        ],
      });
      messages.push({
        content: large(`result ${i}`),
        role: "tool",
        tool_call_id: `call_${i}`,
      });
    }

    let savedState: AgentContextCompactState | undefined;
    const result = await compactOpenAIConversationForContext(messages, {
      apiKey: "",
      contextWindowTokens: 12_000,
      maxOutputTokens: 1000,
      model: "test-model",
      onStateChange: (state) => {
        savedState = state;
      },
      signal: new AbortController().signal,
      state: { failureCount: 3 },
    });

    expect(result.changed).toBe(true);
    expect(result.messages[0]).toMatchObject({ role: "system" });
    expect(result.messages[1]).toMatchObject({ role: "user" });
    expect(result.mode).toBe("fallback");
    expect(
      String((result.messages[1] as { content?: unknown }).content)
    ).toContain("Conversation summary");
    expect(
      result.messages.some(
        (message) =>
          message.role === "tool" && message.tool_call_id === "call_9"
      )
    ).toBe(true);
    expect(
      result.messages.some(
        (message) =>
          message.role === "tool" && message.tool_call_id === "call_0"
      )
    ).toBe(false);
    expect(result.estimatedTokensAfter).toBeLessThan(
      result.estimatedTokensBefore
    );
    expect(savedState?.lastSummary).toContain("Conversation summary");
  });
});

describe("compactAnthropicConversationForContext", () => {
  it("compacts old rounds without leaving orphan tool_result blocks", async () => {
    const messages: MessageParam[] = [];
    for (let i = 0; i < 10; i++) {
      messages.push({
        content: [{ text: large(`user ${i}`), type: "text" }],
        role: "user",
      });
      messages.push({
        content: [
          {
            id: `tu_${i}`,
            input: { file_path: `f${i}.ts` },
            name: "Read",
            type: "tool_use",
          },
        ],
        role: "assistant",
      });
      messages.push({
        content: [
          {
            content: large(`result ${i}`),
            tool_use_id: `tu_${i}`,
            type: "tool_result",
          },
        ],
        role: "user",
      });
    }

    const result = await compactAnthropicConversationForContext(messages, {
      apiKey: "",
      contextWindowTokens: 12_000,
      maxOutputTokens: 1000,
      model: "test-model",
      signal: new AbortController().signal,
      state: { failureCount: 3 },
    });

    expect(result.changed).toBe(true);
    expect(result.messages[0]?.role).toBe("user");
    expect(JSON.stringify(result.messages[0]?.content)).toContain(
      "Conversation summary"
    );
    const liveMessages = JSON.stringify(result.messages.slice(1));
    expect(liveMessages).toContain("tu_9");
    expect(liveMessages).not.toContain("tu_0");
    expect(result.estimatedTokensAfter).toBeLessThan(
      result.estimatedTokensBefore
    );
  });

  it("microcompacts old tool results before summarizing when enough", async () => {
    const messages: MessageParam[] = [];
    for (let i = 0; i < 14; i++) {
      messages.push({
        content: [{ text: `user ${i}`, type: "text" }],
        role: "user",
      });
      messages.push({
        content: [
          {
            id: `tu_${i}`,
            input: { file_path: `f${i}.ts` },
            name: "Read",
            type: "tool_use",
          },
        ],
        role: "assistant",
      });
      messages.push({
        content: [
          {
            content: i < 8 ? large(`huge result ${i}`) : `small result ${i}`,
            tool_use_id: `tu_${i}`,
            type: "tool_result",
          },
        ],
        role: "user",
      });
    }

    const result = await compactAnthropicConversationForContext(messages, {
      apiKey: "",
      contextWindowTokens: 23_000,
      maxOutputTokens: 1000,
      model: "test-model",
      signal: new AbortController().signal,
      state: { failureCount: 3 },
    });

    expect(result.changed).toBe(true);
    expect(result.mode).toBe("microcompact");
    expect(result.clearedToolResults).toBeGreaterThan(0);
    expect(JSON.stringify(result.messages)).toContain(
      "Old tool result content cleared"
    );
  });
});
