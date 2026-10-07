import { describe, expect, it } from "vitest";
import {
  applyThreadRowsPreservingDetails,
  type ChatMessage,
  chatMessagesListEqual,
  mergeThreadDetailRows,
  type ThreadInfo,
  threadListVersions,
} from "./threadTypes";

describe("chatMessagesListEqual skill_invoke", () => {
  it("相同 skill_invoke parts 视为相等", () => {
    const a: ChatMessage[] = [
      {
        content: "./x y",
        parts: [
          { kind: "skill_invoke", name: "X", slug: "x" },
          { kind: "text", text: "y" },
        ],
        role: "user",
      },
    ];
    const b: ChatMessage[] = [
      {
        content: "./x y",
        parts: [
          { kind: "skill_invoke", name: "X", slug: "x" },
          { kind: "text", text: "y" },
        ],
        role: "user",
      },
    ];
    expect(chatMessagesListEqual(a, b)).toBe(true);
  });

  it("skill slug 或 name 不同则不相等", () => {
    const base: ChatMessage = {
      content: "",
      parts: [{ kind: "skill_invoke", name: "A", slug: "a" }],
      role: "user",
    };
    expect(
      chatMessagesListEqual(
        [base],
        [{ ...base, parts: [{ kind: "skill_invoke", name: "A", slug: "b" }] }]
      )
    ).toBe(false);
    expect(
      chatMessagesListEqual(
        [base],
        [{ ...base, parts: [{ kind: "skill_invoke", name: "B", slug: "a" }] }]
      )
    ).toBe(false);
  });
});

describe("layered thread rows", () => {
  it("preserves existing summary details when a light row has the same version", () => {
    const prev: ThreadInfo[] = [
      {
        fileCount: 1,
        filePaths: ["src/a.ts"],
        hasAgentDiff: true,
        hasUserMessages: true,
        id: "t1",
        previewCount: 2,
        subtitleFallback: "Edited src/a.ts",
        title: "Old title",
        updatedAt: 10,
      },
    ];

    const next = applyThreadRowsPreservingDetails(prev, [
      {
        hasUserMessages: true,
        id: "t1",
        previewCount: 2,
        title: "New title",
        updatedAt: 10,
      },
    ]);

    expect(next[0]).toMatchObject({
      filePaths: ["src/a.ts"],
      hasAgentDiff: true,
      subtitleFallback: "Edited src/a.ts",
      title: "New title",
    });
  });

  it("does not merge stale detail rows across updatedAt changes", () => {
    const prev: ThreadInfo[] = [
      {
        hasUserMessages: true,
        id: "t1",
        previewCount: 3,
        title: "Current",
        updatedAt: 20,
      },
    ];

    const next = mergeThreadDetailRows(prev, [
      {
        filePaths: ["stale.ts"],
        hasAgentDiff: true,
        hasUserMessages: true,
        id: "t1",
        previewCount: 2,
        title: "Stale",
        updatedAt: 10,
      },
    ]);

    expect(next).toBe(prev);
  });

  it("propagates isAwaitingReply from a fresh light row when updatedAt changes", () => {
    const prev: ThreadInfo[] = [
      {
        fileCount: 1,
        filePaths: ["src/a.ts"],
        hasAgentDiff: true,
        hasUserMessages: true,
        id: "t1",
        isAwaitingReply: false,
        previewCount: 2,
        subtitleFallback: "Edited src/a.ts",
        title: "Existing",
        updatedAt: 10,
      },
    ];

    // 用户刚发出新消息：updatedAt 变更，light row 携带 isAwaitingReply=true。
    // 修复目标：必须在 light → detail 异步缝隙期间也立刻反映「正在回复」。
    const next = applyThreadRowsPreservingDetails(prev, [
      {
        hasUserMessages: true,
        id: "t1",
        isAwaitingReply: true,
        previewCount: 3,
        title: "Existing",
        updatedAt: 11,
      },
    ]);

    expect(next[0]?.isAwaitingReply).toBe(true);
    expect(next[0]?.updatedAt).toBe(11);
  });

  it("returns id and updatedAt pairs for detail hydration requests", () => {
    expect(
      threadListVersions([
        { id: "a", previewCount: 0, title: "A", updatedAt: 1 },
        { id: "b", previewCount: 1, title: "B", updatedAt: 2 },
      ])
    ).toEqual([
      { id: "a", updatedAt: 1 },
      { id: "b", updatedAt: 2 },
    ]);
  });
});
