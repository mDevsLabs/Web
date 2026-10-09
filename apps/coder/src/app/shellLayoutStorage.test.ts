import { describe, expect, it } from "vitest";
import {
  clampSidebarLayout,
  readStoredShellLayoutModeFromKey,
} from "./shellLayoutStorage";

describe("shellLayoutStorage", () => {
  it("clampSidebarLayout keeps rails within min/max for a typical viewport", () => {
    const { left, right } = clampSidebarLayout(100, 100);
    expect(left).toBeGreaterThanOrEqual(200);
    expect(right).toBeGreaterThanOrEqual(260);
  });

  it("readStoredShellLayoutModeFromKey falls back to agent for missing key", () => {
    expect(
      readStoredShellLayoutModeFromKey("__void-shell-nonexistent-layout-key__")
    ).toBe("agent");
  });
});
