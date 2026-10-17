import { describe, expect, it } from "vitest";
import { shouldSkipReloadForSameThread } from "./threadReloadSkip";

describe("shouldSkipReloadForSameThread", () => {
  it("只有当前线程与消息绑定线程都与选中 id 一致时才跳过 reload", () => {
    expect(shouldSkipReloadForSameThread("a", "a", "a")).toBe(true);
    expect(shouldSkipReloadForSameThread("a", "b", "a")).toBe(false);
    expect(shouldSkipReloadForSameThread("a", "a", "b")).toBe(false);
    expect(shouldSkipReloadForSameThread("a", null, "a")).toBe(false);
    expect(shouldSkipReloadForSameThread("a", "a", null)).toBe(false);
  });

  it("修复：侧栏已切到 B 但消息尚未绑定到 B 时，不得视为「已是同线程」而跳过加载", () => {
    // 例如刚点 B，loadMessages(B) 未完成，messagesThreadId 仍为 A
    expect(shouldSkipReloadForSameThread("b", "b", "a")).toBe(false);
  });
});
