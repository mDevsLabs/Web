import { describe, expect, it } from "vitest";
import { computeMergedAgentFileChanges } from "./agentFileChangesCompute";
import type { TFunction } from "./i18n";
import type { ChatMessage } from "./threadTypes";

const t = ((key: string) => key) as unknown as TFunction;

function assistant(content: string): ChatMessage {
  return { content, role: "assistant" };
}

describe("computeMergedAgentFileChanges", () => {
  it("includes snapshot-only paths for agent mode", () => {
    const result = computeMergedAgentFileChanges(
      [assistant("")],
      "agent",
      t,
      new Set(),
      { diffPreviews: {}, gitChangedPaths: [], gitStatusOk: false },
      null,
      new Set(["src/bash-edited.ts"])
    );
    expect(result).toEqual([
      { additions: 0, deletions: 0, path: "src/bash-edited.ts" },
    ]);
  });

  it("includes snapshot-only paths for team mode", () => {
    const result = computeMergedAgentFileChanges(
      [assistant("")],
      "team",
      t,
      new Set(),
      { diffPreviews: {}, gitChangedPaths: [], gitStatusOk: false },
      null,
      new Set(["src/team-worker.ts"])
    );
    expect(result).toEqual([
      { additions: 0, deletions: 0, path: "src/team-worker.ts" },
    ]);
  });

  it("merges snapshot paths with git stats and respects dismissal", () => {
    const result = computeMergedAgentFileChanges(
      [assistant("")],
      "agent",
      t,
      new Set(["src/skip.ts"]),
      {
        diffPreviews: {
          "src/bash-edited.ts": { additions: 3, deletions: 1 },
          "src/skip.ts": { additions: 9, deletions: 4 },
        },
        gitChangedPaths: ["src/bash-edited.ts", "src/skip.ts"],
        gitStatusOk: true,
      },
      null,
      new Set(["src/bash-edited.ts", "src/skip.ts"])
    );
    expect(result).toEqual([
      { additions: 3, deletions: 1, path: "src/bash-edited.ts" },
    ]);
  });

  it("keeps snapshot-only paths visible even when git is already clean", () => {
    const result = computeMergedAgentFileChanges(
      [assistant("")],
      "agent",
      t,
      new Set(),
      { diffPreviews: {}, gitChangedPaths: [], gitStatusOk: true },
      null,
      new Set(["src/clean-after-bash.ts"])
    );
    expect(result).toEqual([
      { additions: 0, deletions: 0, path: "src/clean-after-bash.ts" },
    ]);
  });
});
