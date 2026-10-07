import { describe, expect, it } from "vitest";
import { shouldRunAgentInBackground } from "./agentForkPolicy.js";

describe("shouldRunAgentInBackground (background fork gate)", () => {
  it("returns true when run_in_background is true regardless of gate or subagent_type", () => {
    expect(
      shouldRunAgentInBackground({
        backgroundForkAgentSetting: false,
        runInBackground: true,
        subagentType: "explore",
      })
    ).toBe(true);
  });

  it("returns false when gate is off and not run_in_background", () => {
    expect(
      shouldRunAgentInBackground({
        backgroundForkAgentSetting: false,
        envAsyncAgentBackgroundFork: undefined,
        runInBackground: false,
        subagentType: undefined,
      })
    ).toBe(false);
  });

  it("returns true when setting gate is on and subagent_type is omitted", () => {
    expect(
      shouldRunAgentInBackground({
        backgroundForkAgentSetting: true,
        runInBackground: false,
        subagentType: undefined,
      })
    ).toBe(true);
  });

  it("returns false when gate is on but subagent_type is set (explicit typed agent stays synchronous)", () => {
    expect(
      shouldRunAgentInBackground({
        backgroundForkAgentSetting: true,
        runInBackground: false,
        subagentType: "explore",
      })
    ).toBe(false);
  });

  it.each([
    "1",
    "true",
    "yes",
    "on",
    "TRUE",
  ])("env ASYNC_AGENT_BACKGROUND_FORK=%s enables gate", (v) => {
    expect(
      shouldRunAgentInBackground({
        backgroundForkAgentSetting: false,
        envAsyncAgentBackgroundFork: v,
        runInBackground: false,
        subagentType: undefined,
      })
    ).toBe(true);
  });
});
