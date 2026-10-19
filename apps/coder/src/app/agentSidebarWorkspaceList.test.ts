import { describe, expect, it } from "vitest";
import {
  isAgentWorkspaceCollapsed,
  selectAgentSidebarThreadPaths,
} from "./agentSidebarWorkspaceList";

describe("selectAgentSidebarThreadPaths", () => {
  it("keeps non-current workspaces expanded unless explicitly collapsed elsewhere", () => {
    expect(isAgentWorkspaceCollapsed("D:/work/A", [])).toBe(false);
    expect(isAgentWorkspaceCollapsed("D:/work/A", ["D:/work/A"])).toBe(true);
  });

  it("always includes the current workspace even when it falls past the visible limit", () => {
    const orderedPaths = [
      "D:/work/one",
      "D:/work/two",
      "D:/work/three",
      "D:/work/four",
      "D:/work/current",
    ];

    expect(
      selectAgentSidebarThreadPaths({
        currentWorkspace: "D:/work/current",
        hiddenPaths: [],
        limit: 3,
        orderedPaths,
      })
    ).toEqual(["D:/work/one", "D:/work/two", "D:/work/current"]);
  });

  it("returns every visible workspace when no explicit limit is provided", () => {
    const orderedPaths = Array.from(
      { length: 12 },
      (_, i) => `D:/work/${i + 1}`
    );

    expect(
      selectAgentSidebarThreadPaths({
        currentWorkspace: null,
        hiddenPaths: [],
        orderedPaths,
      })
    ).toHaveLength(12);
  });

  it("filters out hidden workspaces so removed entries do not reappear", () => {
    expect(
      selectAgentSidebarThreadPaths({
        currentWorkspace: null,
        hiddenPaths: ["D:/work/B"],
        limit: 8,
        orderedPaths: ["D:/work/A", "D:/work/B"],
      })
    ).toEqual(["D:/work/A"]);
  });
});
