import { describe, expect, it } from "vitest";
import type {
  TeamPlanProposalState,
  TeamSessionState,
} from "./hooks/useTeamSession";
import { createEmptyLiveAgentBlocks } from "./liveAgentBlocks";
import {
  buildTeamConversationTimeline,
  normalizeTeamLeaderText,
  shouldHideTeamPlanProposalSummary,
} from "./teamChatTimeline";

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

function buildProposal(summary: string): TeamPlanProposalState {
  return {
    awaitingApproval: true,
    proposalId: "proposal-1",
    summary,
    tasks: [],
  };
}

describe("teamChatTimeline", () => {
  it("keeps leader kickoff before the delegated task card and keeps a newer leader reply trailing after cards", () => {
    const session = buildSession({
      leaderMessage: "我已经拿到结果，接下来给你汇总。",
      leaderWorkflow: {
        awaitingReply: false,
        expertId: "lead",
        expertName: "Leader",
        lastTurnUsage: null,
        lastUpdatedAt: 0,
        liveBlocks: createEmptyLiveAgentBlocks(),
        messages: [
          { content: "我先安排前端同学检查聊天区时间线。", role: "assistant" },
        ],
        roleKind: "lead",
        roleType: "team_lead",
        streaming: "",
        streamingThinking: "",
        taskId: "team-lead",
      },
      tasks: [
        {
          acceptanceCriteria: [],
          dependencies: [],
          description: "Inspect chat timeline rendering",
          expertId: "frontend",
          expertName: "Frontend",
          id: "task-1",
          logs: [],
          roleType: "frontend",
          status: "pending",
        },
      ],
      timelineEntries: [
        {
          content: "我先安排前端同学检查聊天区时间线。",
          id: "leader-1",
          kind: "leader_message",
        },
        { id: "task-1", kind: "task_card", taskId: "task-1" },
      ],
    });

    const timeline = buildTeamConversationTimeline(session, [
      { content: "修一下 team 时间线", role: "user" },
    ]);

    expect(timeline.entries.map((entry) => entry.kind)).toEqual([
      "leader_message",
      "task_card",
    ]);
    expect(timeline.currentLeaderMessage).toBe(
      "我已经拿到结果，接下来给你汇总。"
    );
  });

  it("hides the duplicated leader terminal summary when the final assistant message already shows it", () => {
    const session = buildSession({
      leaderMessage: "请先明确目标范围，再继续 team 分派。",
      leaderWorkflow: {
        awaitingReply: false,
        expertId: "lead",
        expertName: "Leader",
        lastTurnUsage: null,
        lastUpdatedAt: 0,
        liveBlocks: createEmptyLiveAgentBlocks(),
        messages: [
          {
            content: "请先明确目标范围，再继续 team 分派。",
            role: "assistant",
          },
        ],
        roleKind: "lead",
        roleType: "team_lead",
        streaming: "",
        streamingThinking: "",
        taskId: "team-lead",
      },
      phase: "delivering",
      timelineEntries: [
        {
          content: "请先明确目标范围，再继续 team 分派。",
          id: "leader-1",
          kind: "leader_message",
        },
      ],
    });

    const timeline = buildTeamConversationTimeline(session, [
      { content: "优化一下项目", role: "user" },
      { content: "请先明确目标范围，再继续 team 分派。", role: "assistant" },
    ]);

    expect(timeline.entries).toEqual([]);
    expect(timeline.currentLeaderMessage).toBe("");
  });

  it("normalizes proposal summaries and hides them when leader text already shows the same content", () => {
    const seenLeaderTexts = new Set([
      "请先明确你想优化的是性能、代码质量还是用户体验。",
    ]);

    expect(
      shouldHideTeamPlanProposalSummary(
        buildProposal("请先明确你想优化的是性能、代码质量还是用户体验。"),
        seenLeaderTexts
      )
    ).toBe(true);
    expect(
      normalizeTeamLeaderText(
        "请先明确你想优化的是性能、代码质量还是用户体验。"
      )
    ).toBe("请先明确你想优化的是性能、代码质量还是用户体验。");
  });

  it("keeps the review card visible without pending role cards before plan approval", () => {
    const session = buildSession({
      planProposal: {
        awaitingApproval: true,
        preflightSummary: "当前信息足够推进。",
        preflightVerdict: "ok",
        proposalId: "proposal-1",
        summary: "我先拆 3 个专家方向。",
        tasks: [
          {
            acceptanceCriteria: ["给出 3 个方案"],
            expert: "game_designer",
            expertName: "Game Designer",
            roleType: "custom",
            task: "设计 3 个高话题玩法方向",
          },
        ],
      },
      timelineEntries: [
        { id: "proposal-1", kind: "plan_proposal", proposalId: "proposal-1" },
      ],
    });

    const timeline = buildTeamConversationTimeline(session, [
      { content: "做个爆款游戏", role: "user" },
    ]);

    expect(timeline.entries.map((entry) => entry.kind)).toEqual([
      "plan_proposal",
    ]);
  });

  it("shows pending role cards after the user approves the plan", () => {
    const session = buildSession({
      planProposal: {
        awaitingApproval: false,
        decision: "approved",
        proposalId: "proposal-1",
        summary: "我先拆 3 个专家方向。",
        tasks: [
          {
            acceptanceCriteria: ["给出 3 个方案"],
            expert: "game_designer",
            expertName: "Game Designer",
            roleType: "custom",
            task: "设计 3 个高话题玩法方向",
          },
        ],
      },
      timelineEntries: [
        { id: "proposal-1", kind: "plan_proposal", proposalId: "proposal-1" },
      ],
    });

    const timeline = buildTeamConversationTimeline(session, [
      { content: "做个爆款游戏", role: "user" },
    ]);

    expect(timeline.entries.map((entry) => entry.kind)).toEqual([
      "plan_proposal",
      "task_card",
    ]);
  });
});
