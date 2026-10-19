import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type AnthropicCacheBreakpointDecision,
  addAnthropicCacheBreakpoints,
  observeAnthropicPromptCacheUsage,
  resetAnthropicPromptCacheTracking,
} from "./anthropicPromptCache.js";

function countCacheControls(value: unknown): number {
  if (Array.isArray(value))
    return value.reduce<number>(
      (sum, child) => sum + countCacheControls(child),
      0
    );
  if (!value || typeof value !== "object") return 0;
  const record = value as Record<string, unknown>;
  return (
    (record.cache_control ? 1 : 0) +
    Object.values(record).reduce<number>(
      (sum, child) => sum + countCacheControls(child),
      0
    )
  );
}

function markedMessageIndexes(messages: MessageParam[]): number[] {
  return messages
    .map((message, index) => (countCacheControls(message) > 0 ? index : -1))
    .filter((index) => index >= 0);
}

afterEach(() => {
  resetAnthropicPromptCacheTracking();
  vi.restoreAllMocks();
});

describe("addAnthropicCacheBreakpoints", () => {
  it("places one marker on the stable prefix before a volatile user tail", () => {
    let decision: AnthropicCacheBreakpointDecision | undefined;
    const messages: MessageParam[] = [
      { content: "first request", role: "user" },
      { content: "stable answer", role: "assistant" },
      { content: "new request that changes every turn", role: "user" },
    ];

    const result = addAnthropicCacheBreakpoints(messages, true, {
      onDecision: (next) => {
        decision = next;
      },
      strategy: "stable-prefix",
    });

    expect(markedMessageIndexes(result)).toEqual([1]);
    expect(decision?.reason).toBe("stable-prefix-before-new-user-tail");
    expect(countCacheControls(result)).toBe(1);
    expect(countCacheControls(messages)).toBe(0);
  });

  it("places one marker before a latest tool_result round", () => {
    let decision: AnthropicCacheBreakpointDecision | undefined;
    const messages: MessageParam[] = [
      { content: "inspect files", role: "user" },
      {
        content: [
          { text: "I will run a tool.", type: "text" },
          {
            id: "toolu_1",
            input: { path: "a.ts" },
            name: "read_file",
            type: "tool_use",
          },
        ],
        role: "assistant",
      },
      {
        content: [
          {
            content: "file contents",
            tool_use_id: "toolu_1",
            type: "tool_result",
          },
        ],
        role: "user",
      },
    ];

    const result = addAnthropicCacheBreakpoints(messages, true, {
      onDecision: (next) => {
        decision = next;
      },
      strategy: "stable-prefix",
    });

    expect(markedMessageIndexes(result)).toEqual([1]);
    expect(decision?.reason).toBe("stable-prefix-before-tool-result");
    expect(countCacheControls(result)).toBe(1);
  });

  it("preserves Claude Code fork semantics for skipCacheWrite", () => {
    let decision: AnthropicCacheBreakpointDecision | undefined;
    const messages: MessageParam[] = [
      { content: "one", role: "user" },
      { content: "two", role: "assistant" },
      { content: "three", role: "user" },
      { content: "four", role: "assistant" },
    ];

    const result = addAnthropicCacheBreakpoints(messages, true, {
      onDecision: (next) => {
        decision = next;
      },
      skipCacheWrite: true,
      strategy: "stable-prefix",
    });

    expect(markedMessageIndexes(result)).toEqual([2]);
    expect(decision?.reason).toBe("skip-cache-write-shared-prefix");
    expect(countCacheControls(result)).toBe(1);
  });

  it("removes stale cache markers before applying the current marker", () => {
    const messages: MessageParam[] = [
      {
        content: [
          { cache_control: { type: "ephemeral" }, text: "old", type: "text" },
        ],
        role: "user",
      },
      {
        content: [
          { cache_control: { type: "ephemeral" }, text: "older", type: "text" },
        ],
        role: "assistant",
      },
      { content: "fresh tail", role: "user" },
    ];

    const result = addAnthropicCacheBreakpoints(messages, true, {
      strategy: "stable-prefix",
    });

    expect(markedMessageIndexes(result)).toEqual([1]);
    expect(countCacheControls(result)).toBe(1);
  });

  it("falls back when an assistant tail only contains thinking blocks", () => {
    let decision: AnthropicCacheBreakpointDecision | undefined;
    const messages: MessageParam[] = [
      { content: "question", role: "user" },
      {
        content: [{ signature: "sig", thinking: "hidden", type: "thinking" }],
        role: "assistant",
      },
    ];

    const result = addAnthropicCacheBreakpoints(messages, true, {
      onDecision: (next) => {
        decision = next;
      },
      strategy: "tail",
    });

    expect(markedMessageIndexes(result)).toEqual([0]);
    expect(decision?.reason).toBe("fallback-marker-eligible-message");
    expect(countCacheControls(result)).toBe(1);
  });
});

describe("observeAnthropicPromptCacheUsage", () => {
  it("warns when cache read tokens drop sharply on a stable signature", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const decision: AnthropicCacheBreakpointDecision = {
      enabled: true,
      markerIndex: 1,
      markerRole: "assistant",
      messageCount: 3,
      reason: "stable-prefix-before-new-user-tail",
      strategy: "stable-prefix",
      volatileTailMessages: 1,
    };

    observeAnthropicPromptCacheUsage({
      decision,
      model: "claude-sonnet",
      source: "agent:test",
      system: "system",
      toolNames: ["Read", "Write"],
      usage: { cacheReadTokens: 20_000, cacheWriteTokens: 500 },
    });
    observeAnthropicPromptCacheUsage({
      decision,
      model: "claude-sonnet",
      source: "agent:test",
      system: "system",
      toolNames: ["Write", "Read"],
      usage: { cacheReadTokens: 12_000, cacheWriteTokens: 8000 },
    });

    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toContain("cache read dropped");
    expect(String(warn.mock.calls[0]?.[0])).toContain("signatureChanged=false");
  });
});
