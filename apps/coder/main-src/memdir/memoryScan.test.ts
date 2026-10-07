import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { formatMemoryManifest, scanMemoryFiles } from "./memoryScan.js";

const tempDirs: string[] = [];

async function makeTempDir(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "async-memscan-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(
    tempDirs
      .splice(0)
      .map((dir) => fs.rm(dir, { force: true, recursive: true }))
  );
});

describe("scanMemoryFiles", () => {
  it("reads frontmatter headers and excludes MEMORY.md", async () => {
    const dir = await makeTempDir();
    await fs.writeFile(
      path.join(dir, "project-arch.md"),
      `---
name: Project architecture
description: Main service boundaries
type: project
---

Body`,
      "utf8"
    );
    await fs.mkdir(path.join(dir, "nested"), { recursive: true });
    await fs.writeFile(
      path.join(dir, "nested", "user-style.md"),
      `---
name: User style
description: Prefer concise answers
type: user
---

Body`,
      "utf8"
    );
    await fs.writeFile(
      path.join(dir, "MEMORY.md"),
      "- [ignored](project-arch.md) — ignored",
      "utf8"
    );

    const scanned = await scanMemoryFiles(dir);
    expect(scanned.map((m) => m.filename).sort()).toEqual([
      "nested/user-style.md",
      "project-arch.md",
    ]);
    expect(
      scanned.find((m) => m.filename === "project-arch.md")?.description
    ).toBe("Main service boundaries");
    expect(
      scanned.find((m) => m.filename === "nested/user-style.md")?.type
    ).toBe("user");
    expect(formatMemoryManifest(scanned)).toContain("project-arch.md");
    expect(formatMemoryManifest(scanned)).not.toContain("MEMORY.md");
  });
});
