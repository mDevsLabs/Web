import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { AgentLoopOptions } from "./agentLoop.js";
import {
  clearManagedAgentsForThread,
  closeManagedAgent,
  closeManagedAgentsForThread,
  getManagedAgentSession,
  spawnManagedAgent,
} from "./managedSubagents.js";

const baseOptions = {
  composerMode: "agent",
  maxOutputTokens: 1024,
  paradigm: "openai-compatible",
  requestApiKey: "",
  requestModelId: "test-model",
} satisfies Omit<AgentLoopOptions, "signal">;

describe("managed sub-agent snapshots", () => {
  it("creates snapshots without recursively rebuilding child snapshots", () => {
    const threadId = `managed-subagents-${randomUUID()}`;
    const parent = spawnManagedAgent({
      background: true,
      context: "",
      options: baseOptions,
      parentToolCallId: "tool-parent",
      settings: {},
      task: "Parent task",
      threadId,
    });
    const child = spawnManagedAgent({
      background: true,
      context: "",
      options: baseOptions,
      parentAgentId: parent.agentId,
      parentToolCallId: "tool-child",
      settings: {},
      task: "Child task",
      threadId,
    });

    const session = getManagedAgentSession(threadId);

    expect(session?.agents[parent.agentId]?.childAgentIds).toEqual([
      child.agentId,
    ]);
    expect(session?.agents[child.agentId]?.childAgentIds).toEqual([]);

    closeManagedAgent({ agentId: parent.agentId, threadId });
  });

  it("closes active child agents for a whole thread", () => {
    const threadId = `managed-subagents-close-thread-${randomUUID()}`;
    const parent = spawnManagedAgent({
      background: true,
      context: "",
      options: baseOptions,
      parentToolCallId: "tool-parent-close",
      settings: {},
      task: "Parent task",
      threadId,
    });
    const child = spawnManagedAgent({
      background: true,
      context: "",
      options: baseOptions,
      parentAgentId: parent.agentId,
      parentToolCallId: "tool-child-close",
      settings: {},
      task: "Child task",
      threadId,
    });

    closeManagedAgentsForThread({ threadId });
    const session = getManagedAgentSession(threadId);

    expect(session?.agents[parent.agentId]?.status).toBe("closed");
    expect(session?.agents[child.agentId]?.status).toBe("closed");
  });

  it("clears thread agent cards after an edited resend", () => {
    const threadId = `managed-subagents-clear-thread-${randomUUID()}`;
    const emittedSessions: unknown[] = [];
    const agent = spawnManagedAgent({
      background: true,
      context: "",
      emit: (evt) => {
        if (evt.type === "agent_session_sync") {
          emittedSessions.push(evt.session);
        }
      },
      options: baseOptions,
      parentToolCallId: "tool-clear",
      settings: {},
      task: "Old task",
      threadId,
    });

    expect(
      getManagedAgentSession(threadId)?.agents[agent.agentId]
    ).toBeTruthy();

    clearManagedAgentsForThread({
      emit: (evt) => {
        if (evt.type === "agent_session_sync") {
          emittedSessions.push(evt.session);
        }
      },
      threadId,
    });
    const session = emittedSessions[emittedSessions.length - 1] as
      | { agents?: unknown; pendingUserInput?: unknown }
      | undefined;

    expect(session?.agents).toEqual({});
    expect(session?.pendingUserInput).toBeNull();
  });
});
