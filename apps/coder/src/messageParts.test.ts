import { describe, expect, it } from "vitest";
import { type ComposerSegment, segmentsToWireText } from "./composerSegments";
import {
  deriveContentFromParts,
  partsToSegments,
  segmentsToParts,
  type UserMessagePart,
} from "./messageParts";

function skillSeg(
  slug: string,
  name: string
): Extract<ComposerSegment, { kind: "skill" }> {
  return { id: "sid", kind: "skill", name, slug };
}

describe("messageParts skill_invoke", () => {
  it("segmentsToParts：skill 落盘为 skill_invoke，并去掉 slug 的 ./ 前缀", () => {
    const segments: ComposerSegment[] = [
      skillSeg("./my-skill", " 显示名 "),
      { id: "t", kind: "text", text: "正文" },
    ];
    expect(segmentsToParts(segments)).toEqual([
      { kind: "skill_invoke", name: "显示名", slug: "my-skill" },
      { kind: "text", text: "正文" },
    ]);
  });

  it("segmentsToParts：空 slug 的 skill 不产生部件", () => {
    const segments: ComposerSegment[] = [
      { id: "s", kind: "skill", name: "x", slug: "  " },
      { id: "t", kind: "text", text: "only" },
    ];
    expect(segmentsToParts(segments)).toEqual([{ kind: "text", text: "only" }]);
  });

  it("segmentsToParts：无 name 时用 slug 作为展示名", () => {
    const segments: ComposerSegment[] = [skillSeg("alpha", "")];
    expect(segmentsToParts(segments)).toEqual([
      { kind: "skill_invoke", name: "alpha", slug: "alpha" },
    ]);
  });

  it("partsToSegments：skill_invoke 还原为 skill，并跳过空 slug", () => {
    const parts: UserMessagePart[] = [
      { kind: "skill_invoke", name: "Beta", slug: "beta" },
      { kind: "skill_invoke", name: "ignored", slug: "" },
      { kind: "text", text: "tail" },
    ];
    const segs = partsToSegments(parts);
    expect(segs).toHaveLength(2);
    expect(segs[0]).toMatchObject({
      kind: "skill",
      name: "Beta",
      slug: "beta",
    });
    expect(segs[1]).toMatchObject({ kind: "text", text: "tail" });
  });

  it("partsToSegments：相邻 text 与 skill_invoke 之间的 text 仍会合并", () => {
    const parts: UserMessagePart[] = [
      { kind: "text", text: "a" },
      { kind: "text", text: "b" },
      { kind: "skill_invoke", name: "S", slug: "s" },
      { kind: "text", text: "c" },
    ];
    const segs = partsToSegments(parts);
    expect(segs[0]).toMatchObject({ kind: "text", text: "ab" });
    expect(segs[1]).toMatchObject({ kind: "skill", name: "S", slug: "s" });
    expect(segs[2]).toMatchObject({ kind: "text", text: "c" });
  });

  it("deriveContentFromParts：skill 与紧贴正文之间补空格", () => {
    const parts: UserMessagePart[] = [
      { kind: "skill_invoke", name: "X", slug: "x" },
      { kind: "text", text: "no-leading-space" },
    ];
    expect(deriveContentFromParts(parts)).toBe("./x no-leading-space");
  });

  it("deriveContentFromParts：skill 后接已带空白正文不重复加空格", () => {
    const parts: UserMessagePart[] = [
      { kind: "skill_invoke", name: "X", slug: "x" },
      { kind: "text", text: " already" },
    ];
    expect(deriveContentFromParts(parts)).toBe("./x already");
  });

  it("deriveContentFromParts：skill 与 file_ref / command / 另一 skill 之间补空格", () => {
    expect(
      deriveContentFromParts([
        { kind: "skill_invoke", name: "A", slug: "a" },
        { kind: "file_ref", relPath: "src/a.ts" },
      ])
    ).toBe("./a @src/a.ts");

    expect(
      deriveContentFromParts([
        { kind: "skill_invoke", name: "A", slug: "a" },
        { command: "plan", kind: "command" },
      ])
    ).toBe("./a /plan");

    expect(
      deriveContentFromParts([
        { kind: "skill_invoke", name: "A", slug: "a" },
        { kind: "skill_invoke", name: "B", slug: "b" },
      ])
    ).toBe("./a ./b");

    expect(
      deriveContentFromParts([
        { kind: "file_ref", relPath: "f.ts" },
        { kind: "skill_invoke", name: "S", slug: "s" },
      ])
    ).toBe("@f.ts ./s");
  });

  it("deriveContentFromParts：command 后接 skill_invoke 补空格", () => {
    expect(
      deriveContentFromParts([
        { command: "plan", kind: "command" },
        { kind: "skill_invoke", name: "S", slug: "s" },
      ])
    ).toBe("/plan ./s");
  });

  it("segmentsToWireText 与 deriveContentFromParts 对同一逻辑片段一致", () => {
    const segments: ComposerSegment[] = [
      skillSeg("slides", "Slides"),
      { id: "t", kind: "text", text: "hello" },
      { id: "f", kind: "file", path: "a/b.ts" },
    ];
    const parts = segmentsToParts(segments);
    expect(segmentsToWireText(segments)).toBe(deriveContentFromParts(parts));
    expect(deriveContentFromParts(parts)).toBe("./slides hello@a/b.ts");
  });
});
