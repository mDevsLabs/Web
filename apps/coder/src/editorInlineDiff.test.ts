import { createTwoFilesPatch } from "diff";
import { describe, expect, it } from "vitest";
import { deriveOriginalContentFromUnifiedDiff } from "./editorInlineDiff";

describe("deriveOriginalContentFromUnifiedDiff", () => {
  it("reconstructs the original content from a modified file and unified diff", async () => {
    const original = ["const a = 1;", "const b = 2;", ""].join("\n");
    const modified = ["const a = 1;", "const b = 3;", "const c = 4;", ""].join(
      "\n"
    );
    const diff = createTwoFilesPatch(
      "a/demo.ts",
      "b/demo.ts",
      original,
      modified,
      "",
      "",
      { context: 3 }
    );
    expect(await deriveOriginalContentFromUnifiedDiff(modified, diff)).toBe(
      original
    );
  });

  it("reconstructs an empty original for new-file diffs", async () => {
    const modified = ["hello", "world", ""].join("\n");
    const diff = createTwoFilesPatch(
      "/dev/null",
      "b/new.txt",
      "",
      modified,
      "",
      "",
      { context: 3 }
    );
    expect(await deriveOriginalContentFromUnifiedDiff(modified, diff)).toBe("");
  });

  it("returns null for invalid or multi-file diffs", async () => {
    const modified = "value\n";
    const multi = [
      createTwoFilesPatch("a/one.txt", "b/one.txt", "a\n", "b\n", "", "", {
        context: 3,
      }).trim(),
      createTwoFilesPatch("a/two.txt", "b/two.txt", "x\n", "y\n", "", "", {
        context: 3,
      }).trim(),
    ].join("\n");
    expect(
      await deriveOriginalContentFromUnifiedDiff(modified, "not a patch")
    ).toBe(null);
    expect(await deriveOriginalContentFromUnifiedDiff(modified, multi)).toBe(
      null
    );
  });
});
