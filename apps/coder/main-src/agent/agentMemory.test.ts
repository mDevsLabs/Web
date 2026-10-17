import * as os from "node:os";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { getAgentMemoryDir, loadAgentMemoryPrompt } from "./agentMemory.js";

describe("agentMemory", () => {
  it("builds project/local/user memory directories", () => {
    const root = path.join(os.tmpdir(), "async-workspace");
    expect(
      getAgentMemoryDir("reviewer", "project", root)?.replace(/\\/g, "/")
    ).toContain("/.mai/agent-memory/reviewer/");
    expect(
      getAgentMemoryDir("reviewer", "local", root)?.replace(/\\/g, "/")
    ).toContain("/.mai/agent-memory-local/reviewer/");
    expect(
      getAgentMemoryDir("reviewer", "user", root)?.replace(/\\/g, "/")
    ).toContain("/agent-memory/reviewer/");
  });

  it("loads an agent memory prompt for valid scope", () => {
    const root = path.join(os.tmpdir(), "async-workspace");
    const prompt = loadAgentMemoryPrompt("reviewer", "project", root);
    expect(prompt).toContain("Persistent agent memory");
    expect(prompt).toContain("project-scoped");
  });
});
