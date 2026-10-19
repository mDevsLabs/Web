import { describe, expect, it } from "vitest";
import { planExecutedKey } from "./planExecutedKey";

describe("planExecutedKey", () => {
  it("prefers relative path", () => {
    expect(planExecutedKey("/proj", ".mai/plans/a.plan.md", null)).toBe(
      ".mai/plans/a.plan.md"
    );
  });

  it("strips workspace root from absolute path", () => {
    expect(
      planExecutedKey("D:/proj", null, "D:/proj/.mai/plans/x.plan.md")
    ).toBe(".mai/plans/x.plan.md");
  });
});
