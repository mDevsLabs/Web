import * as fs from "node:fs";
import * as fsp from "node:fs/promises";
import * as path from "node:path";
import type { AgentMemoryScope } from "../agentSettingsTypes.js";
import { getCachedMaiDataDir } from "../dataDir.js";
import {
  buildMemoryLines,
  truncateEntrypointContent,
} from "../memdir/memdir.js";

function sanitizeAgentTypeForPath(agentType: string): string {
  return agentType
    .trim()
    .replace(/[:<>"/\\|?*]+/g, "-")
    .replace(/\s+/g, "-");
}

export function getAgentMemoryDir(
  agentType: string,
  scope: AgentMemoryScope,
  workspaceRoot: string | null
): string | null {
  const dirName = sanitizeAgentTypeForPath(agentType || "subagent");
  switch (scope) {
    case "user":
      return (
        path.join(getCachedMaiDataDir(), "agent-memory", dirName) + path.sep
      );
    case "project":
      return workspaceRoot
        ? path.join(workspaceRoot, ".mai", "agent-memory", dirName) + path.sep
        : null;
    case "local":
      return workspaceRoot
        ? path.join(workspaceRoot, ".mai", "agent-memory-local", dirName) +
            path.sep
        : null;
  }
}

export async function ensureAgentMemoryDirExists(
  agentType: string,
  scope: AgentMemoryScope,
  workspaceRoot: string | null
): Promise<string | null> {
  const dir = getAgentMemoryDir(agentType, scope, workspaceRoot);
  if (!dir) {
    return null;
  }
  await fsp.mkdir(dir, { recursive: true });
  const entrypoint = path.join(dir, "MEMORY.md");
  try {
    await fsp.access(entrypoint);
  } catch {
    await fsp.writeFile(entrypoint, "", "utf8");
  }
  return dir;
}

function scopeNote(scope: AgentMemoryScope): string {
  switch (scope) {
    case "user":
      return "Since this memory is user-scoped, keep learnings general across projects.";
    case "project":
      return "Since this memory is project-scoped, tailor memories to this repository and shared team conventions.";
    case "local":
      return "Since this memory is local-scoped, tailor memories to this repository and this machine only.";
  }
}

export function loadAgentMemoryPrompt(
  agentType: string,
  scope: AgentMemoryScope,
  workspaceRoot: string | null
): string | null {
  const memoryDir = getAgentMemoryDir(agentType, scope, workspaceRoot);
  if (!memoryDir) {
    return null;
  }
  const entrypoint = path.join(memoryDir, "MEMORY.md");
  let entrypointContent = "";
  try {
    entrypointContent = fs.readFileSync(entrypoint, "utf8");
  } catch {
    entrypointContent = "";
  }
  const lines = [
    "# Persistent agent memory",
    "",
    `This subagent has its own persistent memory at \`${memoryDir.replace(/\\/g, "/")}\`.`,
    "",
    scopeNote(scope),
    "",
    ...buildMemoryLines(memoryDir).slice(2),
  ];
  if (entrypointContent.trim()) {
    const t = truncateEntrypointContent(entrypointContent);
    lines.push("", "## MEMORY.md", "", t.content);
  } else {
    lines.push("", "## MEMORY.md", "", "This agent memory is currently empty.");
  }
  return lines.join("\n");
}
