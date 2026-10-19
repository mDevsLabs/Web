import { beforeEach, describe, expect, it } from "vitest";
import {
  clearSummaryCacheForTests,
  pruneSummaryCache,
  summarizeThreadForSidebar,
} from "./threadListSummary.js";
import type { ChatMessage } from "./threadStore.js";

function thread(
  messages: ChatMessage[],
  options?: { id?: string; updatedAt?: number }
) {
  return {
    id: options?.id ?? "thread-1",
    messages,
    updatedAt: options?.updatedAt ?? 1,
  };
}

function diffAssistant(addedLine: string): ChatMessage {
  return {
    content: [
      "Done.",
      "```diff",
      "diff --git a/file.txt b/file.txt",
      "--- a/file.txt",
      "+++ b/file.txt",
      "@@ -1 +1 @@",
      "-old",
      `+${addedLine}`,
      "```",
    ].join("\n"),
    role: "assistant",
  };
}

describe("summarizeThreadForSidebar", () => {
  beforeEach(() => {
    clearSummaryCacheForTests();
  });

  it("reuses the cached summary when only updatedAt changes", () => {
    const messages: ChatMessage[] = [
      { content: "hidden", role: "system" },
      { content: "Please edit file.txt", role: "user" },
      diffAssistant("new"),
    ];

    const first = summarizeThreadForSidebar(
      thread(messages, { updatedAt: 1 }),
      "D:/work/a"
    );
    const second = summarizeThreadForSidebar(
      thread(messages, { updatedAt: 2 }),
      "D:/work/a"
    );

    expect(second).toBe(first);
    expect(second.previewCount).toBe(2);
    expect(second.hasUserMessages).toBe(true);
  });

  it("invalidates the cache when the assistant diff changes without updatedAt changing", () => {
    const first = summarizeThreadForSidebar(
      thread([
        { content: "Please edit file.txt", role: "user" },
        diffAssistant("new"),
      ]),
      "D:/work/a"
    );
    const second = summarizeThreadForSidebar(
      thread([
        { content: "Please edit file.txt", role: "user" },
        diffAssistant("newer"),
      ]),
      "D:/work/a"
    );

    expect(second).not.toBe(first);
    expect(second.hasAgentDiff).toBe(true);
    expect(second.filePaths).toEqual(["file.txt"]);
  });

  it("prunes only the requested workspace cache", () => {
    const messages: ChatMessage[] = [
      { content: "Hello", role: "user" },
      { content: "Hi", role: "assistant" },
    ];
    const wsA = "D:/work/a";
    const wsB = "D:/work/b";

    const firstA = summarizeThreadForSidebar(thread(messages), wsA);
    const firstB = summarizeThreadForSidebar(thread(messages), wsB);
    pruneSummaryCache(new Set(), wsA);

    const secondA = summarizeThreadForSidebar(thread(messages), wsA);
    const secondB = summarizeThreadForSidebar(thread(messages), wsB);

    expect(secondA).not.toBe(firstA);
    expect(secondB).toBe(firstB);
  });
});
