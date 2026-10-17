import { createTwoFilesPatch } from "diff";
import { describe, expect, it } from "vitest";
import { buildFileEditPreviewDiff } from "./agentChatSegments";
import {
  buildAgentFilePreviewHunks,
  buildAgentFilePreviewRows,
} from "./agentFilePreviewDiff";

describe("buildAgentFilePreviewRows", () => {
  it("renders inline add and delete rows around modified content", async () => {
    const content = ["alpha", "beta updated", "gamma", "delta"].join("\n");
    const diff = [
      "diff --git a/demo.ts b/demo.ts",
      "index 1111111..2222222 100644",
      "--- a/demo.ts",
      "+++ b/demo.ts",
      "@@ -1,4 +1,4 @@",
      " alpha",
      "-beta old",
      "+beta updated",
      " gamma",
      " delta",
    ].join("\n");

    const rows = await buildAgentFilePreviewRows(content, diff);

    expect(rows.map((row) => row.kind)).toEqual([
      "context",
      "del",
      "add",
      "context",
      "context",
    ]);
    expect(rows[1]).toMatchObject({
      kind: "del",
      newLineNo: null,
      oldLineNo: 2,
      text: "beta old",
    });
    expect(rows[2]).toMatchObject({
      kind: "add",
      newLineNo: 2,
      oldLineNo: null,
      text: "beta updated",
    });
    expect(rows[2]?.tokens.some((token) => token.kind === "add")).toBe(true);
  });

  it("falls back to plain source rows when no diff is present", async () => {
    const rows = await buildAgentFilePreviewRows("one\ntwo", "");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      kind: "context",
      newLineNo: 1,
      oldLineNo: 1,
      text: "one",
    });
    expect(rows[1]).toMatchObject({
      kind: "context",
      newLineNo: 2,
      oldLineNo: 2,
      text: "two",
    });
  });

  it("builds per-hunk patch payloads for inline actions", async () => {
    const diff = [
      "diff --git a/demo.ts b/demo.ts",
      "index 1111111..2222222 100644",
      "--- a/demo.ts",
      "+++ b/demo.ts",
      "@@ -1,2 +1,2 @@",
      "-old line",
      "+new line",
      " keep",
    ].join("\n");

    const hunks = await buildAgentFilePreviewHunks(diff);

    expect(hunks).toHaveLength(1);
    expect(hunks[0]).toMatchObject({ id: "hunk-0", newStart: 1, oldStart: 1 });
    expect(hunks[0]?.patch).toContain("@@ -1,2 +1,2 @@");
    expect(hunks[0]?.patch).toContain("+++ b/demo.ts");
  });

  it("renders add rows for a createTwoFilesPatch new-file diff", async () => {
    const content = ["first line", "second line"].join("\n");
    const diff = createTwoFilesPatch(
      "/dev/null",
      "b/new-file.ts",
      "",
      content,
      "",
      "",
      { context: 3 }
    );

    const rows = await buildAgentFilePreviewRows(content, diff);

    expect(rows.some((row) => row.kind === "add")).toBe(true);
    expect(rows.filter((row) => row.kind === "add")).toHaveLength(2);
  });

  it("renders inline rows from a synthetic file-edit diff", async () => {
    const content = ["alpha", "beta updated", "gamma"].join("\n");
    const diff = buildFileEditPreviewDiff({
      newStr: "beta updated",
      oldStr: "beta old",
      path: "app/components/home.tsx",
      startLine: 2,
    });

    const rows = await buildAgentFilePreviewRows(content, diff);

    expect(await buildAgentFilePreviewHunks(diff)).toHaveLength(1);
    expect(rows.map((row) => row.kind)).toContain("del");
    expect(rows.map((row) => row.kind)).toContain("add");
  });
});
