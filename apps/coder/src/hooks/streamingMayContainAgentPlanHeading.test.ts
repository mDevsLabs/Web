import { describe, expect, it } from "vitest";
import { streamingMayContainAgentPlanHeading } from "./usePlanSystem";

describe("streamingMayContainAgentPlanHeading", () => {
  it("returns false for empty and plain prose without plan line", () => {
    expect(streamingMayContainAgentPlanHeading("")).toBe(false);
    expect(streamingMayContainAgentPlanHeading("hello world")).toBe(false);
    expect(
      streamingMayContainAgentPlanHeading("talk about plans for the weekend")
    ).toBe(false);
  });

  it("returns true when a line starts with # Plan:", () => {
    expect(streamingMayContainAgentPlanHeading("# Plan: Fix bug")).toBe(true);
    expect(streamingMayContainAgentPlanHeading("intro\n# Plan: Title")).toBe(
      true
    );
    expect(streamingMayContainAgentPlanHeading("# plan: lower")).toBe(true);
  });

  it("returns true for structured assistant payload so flatten path can run", () => {
    const raw = JSON.stringify({
      _asyncAssistant: 1,
      parts: [{ text: "no plan heading here", type: "text" }],
      v: 1,
    });
    expect(streamingMayContainAgentPlanHeading(raw)).toBe(true);
  });
});
