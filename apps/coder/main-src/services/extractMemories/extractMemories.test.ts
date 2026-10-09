import { describe, expect, it } from "vitest";
import { buildMemoryEntrypoint, renderMemoryFile } from "./extractMemories.js";

describe("extractMemories helpers", () => {
  it("renders a memory file with frontmatter", () => {
    const out = renderMemoryFile({
      content: "Use `{ ok, data }`.",
      description: "Response envelope rules",
      filename: "project/api.md",
      name: "API notes",
      type: "project",
    });
    expect(out).toContain("name: API notes");
    expect(out).toContain("description: Response envelope rules");
    expect(out).toContain("type: project");
    expect(out).toContain("Use `{ ok, data }`.");
  });

  it("builds MEMORY.md index lines from scanned headers", () => {
    const out = buildMemoryEntrypoint([
      {
        description: "Response envelope rules",
        filename: "project/api.md",
        filePath: "/tmp/project/api.md",
        mtimeMs: 1,
        title: "API notes",
        type: "project",
      },
      {
        description: "Prefer concise answers",
        filename: "user/style.md",
        filePath: "/tmp/user/style.md",
        mtimeMs: 2,
        title: "User style",
        type: "user",
      },
    ]);
    expect(out).toContain("[API notes](project/api.md)");
    expect(out).toContain("[User style](user/style.md)");
  });
});
