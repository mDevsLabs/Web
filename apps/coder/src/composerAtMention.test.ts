import { describe, expect, it } from "vitest";
import { parseLeadingWorkspaceRefs } from "./composerAtMention";
import { userMessageToSegments } from "./composerSegments";

const ZW = "\u200c";

describe("parseLeadingWorkspaceRefs", () => {
  it("splits inline file ref from same-line body after ZWNJ", () => {
    const { refs, body } = parseLeadingWorkspaceRefs(
      `@src/foo.ts${ZW}这是什么问题`
    );
    expect(refs).toEqual(["src/foo.ts"]);
    expect(body).toBe("这是什么问题");
  });

  it("keeps legacy first line of multiple @ refs", () => {
    const { refs, body } = parseLeadingWorkspaceRefs("@a.ts @b.ts\n\nhello");
    expect(refs).toEqual(["a.ts", "b.ts"]);
    expect(body).toBe("hello");
  });
});

describe("userMessageToSegments (wire → chip)", () => {
  it("uses ASCII space between @path and body (主流 wire 分隔)", () => {
    const segs = userMessageToSegments("@src/foo.ts bug");
    expect(
      segs.map((s) =>
        s.kind === "text"
          ? `t:${s.text}`
          : s.kind === "file"
            ? `f:${s.path}`
            : "c"
      )
    ).toEqual(["f:src/foo.ts", "t: bug"]);
  });

  it("仍兼容历史 ZWNJ 分隔", () => {
    const segs = userMessageToSegments(`@src/foo.ts${ZW}bug`);
    expect(
      segs.map((s) =>
        s.kind === "text"
          ? `t:${s.text}`
          : s.kind === "file"
            ? `f:${s.path}`
            : "c"
      )
    ).toEqual(["f:src/foo.ts", "t:bug"]);
  });

  it("不把 email 中的 @ 当成文件引用", () => {
    const segs = userMessageToSegments("联系 user@example.com 谢谢");
    expect(
      segs.map((s) =>
        s.kind === "text"
          ? `t:${s.text}`
          : s.kind === "file"
            ? `f:${s.path}`
            : "c"
      )
    ).toEqual(["t:联系 user@example.com 谢谢"]);
  });
});
