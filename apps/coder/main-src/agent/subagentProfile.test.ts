import { describe, expect, it } from "vitest";
import type { ShellSettings } from "../settingsStore.js";
import {
  buildSubagentSystemAppend,
  resolveSubagentProfile,
} from "./subagentProfile.js";

describe("resolveSubagentProfile", () => {
  it("treats explore aliases as read-only explore profile", () => {
    expect(resolveSubagentProfile("explore")).toBe("explore");
    expect(resolveSubagentProfile("EXPLORE_AGENT")).toBe("explore");
    expect(resolveSubagentProfile("codebase_explore")).toBe("explore");
  });

  it("uses full tool pool for unknown types", () => {
    expect(resolveSubagentProfile("general-purpose")).toBe("full");
    expect(resolveSubagentProfile(undefined)).toBe("full");
  });
});

describe("buildSubagentSystemAppend", () => {
  const settings = (subs: ShellSettings["agent"]): ShellSettings => ({
    agent: subs,
  });

  it("returns explore read-only block for explore type", () => {
    const s = settings(undefined);
    const b = buildSubagentSystemAppend(s, "explore");
    expect(b).toContain("Subagent profile: explore");
    expect(b).toContain("read-oriented tools");
  });

  it("matches configured subagent by id", () => {
    const s = settings({
      subagents: [
        {
          description: "Does work",
          enabled: true,
          id: "my-worker",
          instructions: "Be concise.",
          memoryScope: "project",
          name: "Worker",
        },
      ],
    });
    const b = buildSubagentSystemAppend(s, "my-worker");
    expect(b).toContain("## Subagent: Worker");
    expect(b).toContain("Be concise.");
    expect(b).toContain("Memory scope: project");
  });

  it("returns generic block for unknown named type", () => {
    const s = settings({ subagents: [] });
    const b = buildSubagentSystemAppend(s, "unknown_type");
    expect(b).toContain("## Subagent type: unknown_type");
  });
});
