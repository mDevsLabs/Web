import { describe, expect, it } from "vitest";
import type { AgentSessionSnapshotAgent } from "./agentSessionTypes";
import { filterDuplicateSubAgentReplies } from "./subAgentChatProjection";
import type { ChatMessage } from "./threadTypes";

function agent(
  overrides: Partial<AgentSessionSnapshotAgent>
): AgentSessionSnapshotAgent {
  return {
    background: true,
    childAgentIds: [],
    closedAt: null,
    contextMode: "none",
    contextTurns: null,
    id: "agent-1",
    lastError: null,
    lastInputSummary: "",
    lastOutputSummary: "",
    lastResultSummary: "",
    messages: [],
    parentAgentId: null,
    parentToolCallId: "tool-1",
    runProfile: "explore",
    startedAt: 1,
    status: "completed",
    title: "Investigate",
    transcriptPath: null,
    updatedAt: 2,
    ...overrides,
  };
}

describe("sub-agent chat projection", () => {
  it("removes a latest-turn assistant bubble that duplicates a sub-agent reply", () => {
    const messages: ChatMessage[] = [
      { content: "please investigate", role: "user" },
      { content: "same answer", role: "assistant" },
    ];
    const filtered = filterDuplicateSubAgentReplies(messages, {
      "agent-1": agent({
        messages: [
          { content: "task", role: "user" },
          { content: "same answer", role: "assistant" },
        ],
      }),
    });

    expect(filtered).toEqual([{ content: "please investigate", role: "user" }]);
  });

  it("keeps older matching assistant messages from previous turns", () => {
    const messages: ChatMessage[] = [
      { content: "old", role: "user" },
      { content: "same answer", role: "assistant" },
      { content: "new", role: "user" },
      { content: "different answer", role: "assistant" },
    ];
    const filtered = filterDuplicateSubAgentReplies(messages, {
      "agent-1": agent({
        messages: [
          { content: "task", role: "user" },
          { content: "same answer", role: "assistant" },
        ],
      }),
    });

    expect(filtered).toBe(messages);
  });
});
