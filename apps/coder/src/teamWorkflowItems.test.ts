import { describe, expect, it } from "vitest";
import type { TeamSessionState } from "./hooks/useTeamSession";
import { createEmptyLiveAgentBlocks } from "./liveAgentBlocks";
import { buildTeamWorkflowItems } from "./teamWorkflowItems";

function buildSession(
  overrides: Partial<TeamSessionState> = {}
): TeamSessionState {
  return {
    finalSummary: "",
    leaderMessage: "",
    leaderWorkflow: null,
    originalUserRequest: "",
    pendingQuestion: null,
    pendingQuestionRequestId: null,
    pendingUserInput: null,
    phase: "planning",
    planProposal: null,
    planRevisions: [],
    planSummary: "",
    preflightSummary: "",
    preflightVerdict: null,
    reviewerTaskId: null,
    reviewSummary: "",
    reviewVerdict: null,
    roleWorkflowByTaskId: {},
    selectedTaskId: null,
    tasks: [],
    timelineEntries: [],
    updatedAt: 0,
    ...overrides,
  };
}

describe("buildTeamWorkflowItems", () => {
  it("does not synthesize a reviewer card from summary text alone", () => {
    const items = buildTeamWorkflowItems(
      buildSession({
        preflightSummary: "The request looked actionable.",
        preflightVerdict: "ok",
        reviewSummary: "All tasks completed successfully.",
        reviewVerdict: "approved",
        tasks: [
          {
            acceptanceCriteria: [],
            dependencies: [],
            description: "Inspect the chat area",
            expertAssignmentKey: "frontend",
            expertId: "frontend",
            expertName: "Frontend",
            id: "task-1",
            logs: [],
            roleType: "frontend",
            status: "completed",
          },
        ],
      })
    );

    expect(items.map((item) => item.roleKind)).toEqual(["specialist"]);
  });

  it("keeps the reviewer card when an actual reviewer workflow exists", () => {
    const items = buildTeamWorkflowItems(
      buildSession({
        reviewerTaskId: "reviewer-reviewer",
        reviewSummary: "Approved after checking the result.",
        reviewVerdict: "approved",
        roleWorkflowByTaskId: {
          "reviewer-reviewer": {
            awaitingReply: false,
            expertId: "reviewer",
            expertName: "Reviewer",
            lastTurnUsage: null,
            lastUpdatedAt: 0,
            liveBlocks: createEmptyLiveAgentBlocks(),
            messages: [],
            roleKind: "reviewer",
            roleType: "reviewer",
            streaming: "",
            streamingThinking: "",
            taskId: "reviewer-reviewer",
          },
        },
        tasks: [
          {
            acceptanceCriteria: [],
            dependencies: [],
            description: "Inspect the chat area",
            expertAssignmentKey: "frontend",
            expertId: "frontend",
            expertName: "Frontend",
            id: "task-1",
            logs: [],
            roleType: "frontend",
            status: "completed",
          },
        ],
      })
    );

    expect(items.map((item) => item.roleKind)).toEqual([
      "specialist",
      "reviewer",
    ]);
  });
});
