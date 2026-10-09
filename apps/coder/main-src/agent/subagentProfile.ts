/**
 * 子 Agent 类型解析：结合 subagent_type 与设置中的 AgentSubagent。
 */

import type { AgentSubagent } from "../agentSettingsTypes.js";
import { loadClaudeWorkspaceSubagents } from "../llm/agentMessagePrep.js";
import type { ShellSettings } from "../settingsStore.js";

export type SubagentRunProfile = "explore" | "full";

const EXPLORE_ALIASES = new Set([
  "explore",
  "explore_agent",
  "codebase_explore",
]);

/**
 * 根据 subagent_type 字符串决定子循环是只读探索还是完整工具。
 */
export function resolveSubagentProfile(
  rawType: string | undefined
): SubagentRunProfile {
  const t = (rawType ?? "").trim().toLowerCase().replace(/\s+/g, "_");
  if (!t) return "full";
  if (EXPLORE_ALIASES.has(t)) return "explore";
  return "full";
}

function matchesSubagent(
  s: AgentSubagent,
  raw: string,
  lower: string
): boolean {
  return (
    s.enabled !== false &&
    (s.id === raw ||
      s.name.trim().toLowerCase() === raw.toLowerCase() ||
      s.name.trim().toLowerCase().replace(/\s+/g, "_") === lower)
  );
}

export function findConfiguredSubagent(
  settings: ShellSettings,
  rawType: string | undefined,
  workspaceRoot?: string | null
): AgentSubagent | undefined {
  const t = (rawType ?? "").trim();
  const lower = t.toLowerCase().replace(/\s+/g, "_");
  if (!t) return;

  const settingsHit = (settings.agent?.subagents ?? []).find((s) =>
    matchesSubagent(s, t, lower)
  );
  if (settingsHit) return settingsHit;

  if (workspaceRoot) {
    const diskSubs = loadClaudeWorkspaceSubagents(workspaceRoot);
    const diskHit = diskSubs.find((s) => matchesSubagent(s, t, lower));
    if (diskHit) return diskHit;
  }
}

/**
 * 追加到子 Agent 系统提示的片段（在父级 agentSystemAppend 之后）。
 */
export function buildSubagentSystemAppend(
  settings: ShellSettings,
  rawType: string | undefined,
  workspaceRoot?: string | null
): string | undefined {
  const t = (rawType ?? "").trim();
  const lower = t.toLowerCase().replace(/\s+/g, "_");
  if (!t) return;

  if (EXPLORE_ALIASES.has(lower)) {
    return [
      "## Subagent profile: explore",
      "You only have read-oriented tools (no file writes, no shell execute).",
      "Search and read the codebase thoroughly, then summarize findings in your final reply.",
    ].join("\n");
  }

  const match = findConfiguredSubagent(settings, rawType, workspaceRoot);
  if (match) {
    return [
      `## Subagent: ${match.name}`,
      match.description.trim(),
      match.memoryScope ? `Memory scope: ${match.memoryScope}` : "",
      "",
      match.instructions.trim(),
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    `## Subagent type: ${t}`,
    "Complete the task using the tools available to you.",
  ].join("\n");
}
