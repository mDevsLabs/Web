import { describe, expect, it } from "vitest";

import {
  buildConversationRenderKey,
  computeTurnSectionSpacerPx,
  findLatestTurnStartUserIndex,
  findStickyUserIndexForViewport,
  type MeasuredTurnFocusRow,
  resolveStickyUserIndex,
  shouldEnableLatestTurnSpacer,
} from "./agentTurnFocus";
import type { ChatMessage } from "./threadTypes";

function row(
  params: Partial<MeasuredTurnFocusRow> & Pick<MeasuredTurnFocusRow, "rowId">
): MeasuredTurnFocusRow {
  return {
    height: params.height ?? 0,
    isTurnStart: params.isTurnStart ?? false,
    messageIndex: params.messageIndex ?? null,
    offsetTop: params.offsetTop ?? 0,
    rowId: params.rowId,
    stickyUserIndex: params.stickyUserIndex ?? null,
    top: params.top ?? 0,
    turnOwnerUserIndex: params.turnOwnerUserIndex ?? null,
  };
}

describe("agentTurnFocus", () => {
  it("targets the latest user turn so every new prompt becomes the active sticky anchor", () => {
    const displayMessages: ChatMessage[] = [
      { content: "第一轮提问", role: "user" },
      { content: "第一轮回复", role: "assistant" },
      { content: "第二轮提问", role: "user" },
      { content: "流式中", role: "assistant" },
    ];

    expect(findLatestTurnStartUserIndex(displayMessages, "agent")).toBe(2);
  });

  it("uses composer mode in the render key so mode switches reset chat row measurements", () => {
    expect(buildConversationRenderKey("thread-1", "agent")).toBe(
      "thread-1:agent"
    );
    expect(buildConversationRenderKey("thread-1", "team")).toBe(
      "thread-1:team"
    );
    expect(buildConversationRenderKey("thread-1", "agent")).not.toBe(
      buildConversationRenderKey("thread-1", "team")
    );
  });

  it("allows the latest turn spacer whenever non-team mode may need geometric补高", () => {
    expect(shouldEnableLatestTurnSpacer("agent")).toBe(true);
    expect(shouldEnableLatestTurnSpacer("plan")).toBe(true);
    expect(shouldEnableLatestTurnSpacer("ask")).toBe(true);
    expect(shouldEnableLatestTurnSpacer("team")).toBe(false);
  });

  it("keeps turn focus on the latest user message even after a short assistant reply finishes", () => {
    expect(
      findLatestTurnStartUserIndex(
        [
          { content: "第一轮提问", role: "user" },
          { content: "第一轮回复", role: "assistant" },
          { content: "第二轮提问", role: "user" },
          { content: "短回复", role: "assistant" },
        ],
        "agent"
      )
    ).toBe(2);
  });

  it("keeps the first non-team prompt anchored as soon as a user bubble exists", () => {
    // 让第一轮也参与 spacer / sticky 机制：assistant 流式增长时不会再把
    // 用户气泡推出视口或与气泡顶部叠加。
    expect(
      findLatestTurnStartUserIndex(
        [
          { content: "第一条消息", role: "user" },
          { content: "流式中", role: "assistant" },
        ],
        "ask"
      )
    ).toBe(0);

    expect(
      findLatestTurnStartUserIndex(
        [
          { content: "普通提问", role: "user" },
          { content: "普通回复", role: "assistant" },
        ],
        "agent"
      )
    ).toBe(0);
  });

  it("still skips turn focus for team bootstrapping when no supplemental row appeared yet", () => {
    // team 模式下用户气泡之后会被 leader/plan 卡片接管布局，没有补充行时仍然不锚定。
    expect(
      findLatestTurnStartUserIndex(
        [
          { content: "team 消息", role: "user" },
          { content: "流式中", role: "assistant" },
        ],
        "team"
      )
    ).toBeNull();
  });

  it("allows team mode to keep the latest user bubble in focus once timeline content appears below it", () => {
    expect(
      findLatestTurnStartUserIndex(
        [
          { content: "我想做一个比羊了个羊还火爆的游戏", role: "user" },
          { content: "团队正在规划中", role: "assistant" },
        ],
        "team",
        true
      )
    ).toBe(0);
  });

  it("computes only the spacer needed to pull the active turn start to the top", () => {
    const spacer = computeTurnSectionSpacerPx({
      activeTurnStartUserIndex: 2,
      bottomPadding: 100,
      renderedRows: [
        row({
          height: 60,
          isTurnStart: true,
          messageIndex: 0,
          offsetTop: 0,
          rowId: "u1",
          stickyUserIndex: 0,
          turnOwnerUserIndex: 0,
        }),
        row({
          height: 160,
          messageIndex: 1,
          offsetTop: 82,
          rowId: "a1",
          turnOwnerUserIndex: 0,
        }),
        row({
          height: 70,
          isTurnStart: true,
          messageIndex: 2,
          offsetTop: 266,
          rowId: "u2",
          stickyUserIndex: 2,
          turnOwnerUserIndex: 2,
        }),
        row({
          height: 72,
          messageIndex: 3,
          offsetTop: 336,
          rowId: "a2",
          turnOwnerUserIndex: 2,
        }),
      ],
      stickyTopPx: 8,
      topPadding: 8,
      viewportHeight: 600,
    });

    expect(spacer).toBe(342);
  });

  it("includes team rows in the active turn section height", () => {
    const spacer = computeTurnSectionSpacerPx({
      activeTurnStartUserIndex: 2,
      bottomPadding: 100,
      renderedRows: [
        row({
          height: 70,
          isTurnStart: true,
          messageIndex: 2,
          offsetTop: 0,
          rowId: "u2",
          stickyUserIndex: 2,
          turnOwnerUserIndex: 2,
        }),
        row({
          height: 72,
          offsetTop: 70,
          rowId: "leader",
          turnOwnerUserIndex: 2,
        }),
        row({
          height: 180,
          offsetTop: 242,
          rowId: "plan",
          turnOwnerUserIndex: 2,
        }),
      ],
      stickyTopPx: 8,
      topPadding: 8,
      viewportHeight: 600,
    });

    expect(spacer).toBe(62);
  });

  it("returns zero when the active turn already fills the available viewport height", () => {
    const spacer = computeTurnSectionSpacerPx({
      activeTurnStartUserIndex: 2,
      bottomPadding: 100,
      renderedRows: [
        row({
          height: 420,
          isTurnStart: true,
          messageIndex: 2,
          offsetTop: 0,
          rowId: "u2",
          stickyUserIndex: 2,
          turnOwnerUserIndex: 2,
        }),
        row({
          height: 100,
          messageIndex: 3,
          offsetTop: 420,
          rowId: "a2",
          turnOwnerUserIndex: 2,
        }),
      ],
      stickyTopPx: 8,
      topPadding: 8,
      viewportHeight: 600,
    });

    expect(spacer).toBe(0);
  });

  it("picks the nearest turn start that has crossed the sticky top boundary", () => {
    expect(
      findStickyUserIndexForViewport({
        latestTurnSpacerPx: 0,
        latestTurnStartUserIndex: 4,
        renderedRows: [
          row({
            height: 56,
            isTurnStart: true,
            messageIndex: 0,
            rowId: "u1",
            stickyUserIndex: 0,
            top: -220,
            turnOwnerUserIndex: 0,
          }),
          row({
            height: 80,
            messageIndex: 1,
            rowId: "a1",
            top: -120,
            turnOwnerUserIndex: 0,
          }),
          row({
            height: 48,
            isTurnStart: true,
            messageIndex: 2,
            rowId: "u2",
            stickyUserIndex: 2,
            top: -16,
            turnOwnerUserIndex: 2,
          }),
          row({
            height: 72,
            messageIndex: 3,
            rowId: "a2",
            top: 96,
            turnOwnerUserIndex: 2,
          }),
          row({
            height: 48,
            isTurnStart: true,
            messageIndex: 4,
            rowId: "u3",
            stickyUserIndex: 4,
            top: 240,
            turnOwnerUserIndex: 4,
          }),
        ],
        stickyTopPx: 0,
      })
    ).toBe(2);
  });

  it("does not activate sticky state before any turn start reaches the top edge", () => {
    expect(
      findStickyUserIndexForViewport({
        latestTurnSpacerPx: 0,
        latestTurnStartUserIndex: 2,
        renderedRows: [
          row({
            height: 48,
            isTurnStart: true,
            messageIndex: 0,
            rowId: "u1",
            stickyUserIndex: 0,
            top: 24,
            turnOwnerUserIndex: 0,
          }),
          row({
            height: 72,
            messageIndex: 1,
            rowId: "a1",
            top: 120,
            turnOwnerUserIndex: 0,
          }),
          row({
            height: 48,
            isTurnStart: true,
            messageIndex: 2,
            rowId: "u2",
            stickyUserIndex: 2,
            top: 256,
            turnOwnerUserIndex: 2,
          }),
        ],
        stickyTopPx: 0,
      })
    ).toBeNull();
  });

  it("sticks only the latest turn user after it reaches the top boundary when turn spacer is active", () => {
    expect(
      findStickyUserIndexForViewport({
        latestTurnSpacerPx: 420,
        latestTurnStartUserIndex: 2,
        renderedRows: [
          row({
            height: 104,
            isTurnStart: true,
            messageIndex: 0,
            rowId: "u1",
            stickyUserIndex: 0,
            top: -12,
            turnOwnerUserIndex: 0,
          }),
          row({
            height: 64,
            messageIndex: 1,
            rowId: "a1",
            top: 92,
            turnOwnerUserIndex: 0,
          }),
          row({
            height: 48,
            isTurnStart: true,
            messageIndex: 2,
            rowId: "u2",
            stickyUserIndex: 2,
            top: -6,
            turnOwnerUserIndex: 2,
          }),
          row({
            height: 126,
            rowId: "plan",
            top: 42,
            turnOwnerUserIndex: 2,
          }),
        ],
        stickyTopPx: 0,
      })
    ).toBe(2);
  });

  it("ignores older turn starts while the latest focused turn is still approaching the top", () => {
    expect(
      findStickyUserIndexForViewport({
        latestTurnSpacerPx: 320,
        latestTurnStartUserIndex: 2,
        renderedRows: [
          row({
            height: 104,
            isTurnStart: true,
            messageIndex: 0,
            rowId: "u1",
            stickyUserIndex: 0,
            top: -80,
            turnOwnerUserIndex: 0,
          }),
          row({
            height: 64,
            messageIndex: 1,
            rowId: "a1",
            top: 48,
            turnOwnerUserIndex: 0,
          }),
          row({
            height: 48,
            isTurnStart: true,
            messageIndex: 2,
            rowId: "u2",
            stickyUserIndex: 2,
            top: 28,
            turnOwnerUserIndex: 2,
          }),
          row({
            height: 112,
            rowId: "team-plan",
            top: 76,
            turnOwnerUserIndex: 2,
          }),
        ],
        stickyTopPx: 0,
      })
    ).toBeNull();
  });

  it("lets an older turn take over once the latest focused turn is no longer near the top boundary", () => {
    expect(
      findStickyUserIndexForViewport({
        latestTurnSpacerPx: 320,
        latestTurnStartUserIndex: 2,
        renderedRows: [
          row({
            height: 72,
            isTurnStart: true,
            messageIndex: 0,
            rowId: "u1",
            stickyUserIndex: 0,
            top: -36,
            turnOwnerUserIndex: 0,
          }),
          row({
            height: 360,
            messageIndex: 1,
            rowId: "a1",
            top: 40,
            turnOwnerUserIndex: 0,
          }),
          row({
            height: 48,
            isTurnStart: true,
            messageIndex: 2,
            rowId: "u2",
            stickyUserIndex: 2,
            top: 84,
            turnOwnerUserIndex: 2,
          }),
          row({
            height: 80,
            rowId: "task-card",
            top: 132,
            turnOwnerUserIndex: 2,
          }),
        ],
        stickyTopPx: 0,
      })
    ).toBe(0);
  });

  it("releases sticky when the latest turn row has fully scrolled out of viewport", () => {
    expect(
      findStickyUserIndexForViewport({
        latestTurnSpacerPx: 400,
        latestTurnStartUserIndex: 2,
        renderedRows: [
          row({
            height: 50,
            isTurnStart: true,
            messageIndex: 0,
            rowId: "u1",
            stickyUserIndex: 0,
            top: -200,
            turnOwnerUserIndex: 0,
          }),
          row({
            height: 60,
            messageIndex: 1,
            rowId: "a1",
            top: -120,
            turnOwnerUserIndex: 0,
          }),
          row({
            height: 48,
            isTurnStart: true,
            messageIndex: 2,
            rowId: "u2",
            stickyUserIndex: 2,
            top: -100,
            turnOwnerUserIndex: 2,
          }),
          row({
            height: 20,
            messageIndex: 3,
            rowId: "a2",
            top: -30,
            turnOwnerUserIndex: 2,
          }),
        ],
        stickyTopPx: 0,
      })
    ).toBeNull();
  });

  it("keeps sticky output after candidate selection", () => {
    expect(resolveStickyUserIndex(2)).toBe(2);
  });

  it("passes through nulls", () => {
    expect(resolveStickyUserIndex(null)).toBeNull();
    expect(resolveStickyUserIndex(1)).toBe(1);
  });
});
