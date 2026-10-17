import { describe, expect, it } from "vitest";
import {
  defaultMarkdownViewForPath,
  isMarkdownEditorPath,
  stripPlanFrontmatterForPreview,
} from "./editorMarkdownView";

describe("editorMarkdownView", () => {
  it("detects md paths", () => {
    expect(isMarkdownEditorPath("a/b.md")).toBe(true);
    expect(isMarkdownEditorPath("a\\x.MDX")).toBe(true);
    expect(isMarkdownEditorPath("a.ts")).toBe(false);
  });

  it("defaults plan files to preview", () => {
    expect(defaultMarkdownViewForPath(".mai/plans/foo.plan.md")).toBe(
      "preview"
    );
    expect(defaultMarkdownViewForPath("README.md")).toBe("source");
  });

  it("strips plan frontmatter for preview", () => {
    const raw = "---\nname: X\n---\n\n# Body\n";
    expect(stripPlanFrontmatterForPreview("p.plan.md", raw)).toBe("# Body\n");
    expect(stripPlanFrontmatterForPreview("README.md", raw)).toBe(raw);
  });
});
