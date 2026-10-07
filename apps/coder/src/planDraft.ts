import { parseAgentAssistantPayload } from "./agentStructuredMessage";
import type { ParsedPlan, PlanTodoItem } from "./planParser";

export type PlanDraftTodoStatus = "pending" | "completed";
export type PlanDraftFileAction = "Edit" | "New" | "Delete";

export type PlanDraftSubmission = {
  title: string;
  goal: string;
  scopeContext: string[];
  executionOverview: string[];
  implementationSteps: Array<{
    title: string;
    description: string;
  }>;
  todos: Array<{
    id: string;
    content: string;
    status: PlanDraftTodoStatus;
  }>;
  filesToChange: Array<{
    path: string;
    action: PlanDraftFileAction;
    description: string;
  }>;
  risksAndEdgeCases: string[];
  openQuestions: string[];
};

export type ThreadPlanDraft = {
  title: string;
  steps: Array<{
    id: string;
    title: string;
    description: string;
    status: "pending" | "completed";
    targetFiles?: string[];
  }>;
  updatedAt: number;
  sourcePath?: string;
  sourceRelPath?: string;
};

export function extractLatestPlanDraftFromMessages(
  messages: ReadonlyArray<{ role: string; content: string }>
): PlanDraftSubmission | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message?.role !== "assistant") {
      continue;
    }
    const draft = extractLatestPlanDraftFromAssistantContent(message.content);
    if (draft) {
      return draft;
    }
  }
  return null;
}

function normalizeStringList(raw: unknown): string[] {
  return Array.isArray(raw)
    ? raw.map((value) => String(value ?? "").trim()).filter(Boolean)
    : [];
}

function normalizeSteps(
  raw: unknown
): Array<{ title: string; description: string }> {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: Array<{ title: string; description: string }> = [];
  for (const item of raw) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      continue;
    }
    const record = item as Record<string, unknown>;
    const title = String(record.title ?? "").trim();
    const description = String(record.description ?? "").trim();
    if (!title || !description) {
      continue;
    }
    out.push({ description, title });
  }
  return out;
}

function normalizeTodos(raw: unknown): PlanDraftSubmission["todos"] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: PlanDraftSubmission["todos"] = [];
  let index = 0;
  for (const item of raw) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      continue;
    }
    const record = item as Record<string, unknown>;
    const content = String(record.content ?? "").trim();
    if (!content) {
      continue;
    }
    index += 1;
    const rawId = String(record.id ?? "").trim();
    const rawStatus = String(record.status ?? "pending").trim();
    out.push({
      content,
      id: rawId || `todo-${index}`,
      status: rawStatus === "completed" ? "completed" : "pending",
    });
  }
  return out;
}

function normalizeFilesToChange(
  raw: unknown
): PlanDraftSubmission["filesToChange"] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: PlanDraftSubmission["filesToChange"] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      continue;
    }
    const record = item as Record<string, unknown>;
    const path = String(record.path ?? "").trim();
    const description = String(record.description ?? "").trim();
    const actionRaw = String(record.action ?? "").trim();
    const action =
      actionRaw === "New" || actionRaw === "Delete" ? actionRaw : "Edit";
    if (!path || !description) {
      continue;
    }
    out.push({ action, description, path });
  }
  return out;
}

export function normalizePlanDraftSubmission(
  raw: Record<string, unknown>
): { ok: true; draft: PlanDraftSubmission } | { ok: false; error: string } {
  const title = String(raw.title ?? "").trim();
  const goal = String(raw.goal ?? "").trim();
  const implementationSteps = normalizeSteps(raw.implementationSteps);
  const todos = normalizeTodos(raw.todos);
  if (!title) {
    return { error: "Error: plan_submit_draft.title is required.", ok: false };
  }
  if (!goal) {
    return { error: "Error: plan_submit_draft.goal is required.", ok: false };
  }
  if (implementationSteps.length === 0) {
    return {
      error:
        "Error: plan_submit_draft.implementationSteps requires at least one step.",
      ok: false,
    };
  }
  if (todos.length === 0) {
    return {
      error: "Error: plan_submit_draft.todos requires at least one todo item.",
      ok: false,
    };
  }
  return {
    draft: {
      executionOverview: normalizeStringList(raw.executionOverview),
      filesToChange: normalizeFilesToChange(raw.filesToChange),
      goal,
      implementationSteps,
      openQuestions: normalizeStringList(raw.openQuestions),
      risksAndEdgeCases: normalizeStringList(raw.risksAndEdgeCases),
      scopeContext: normalizeStringList(raw.scopeContext),
      title,
      todos,
    },
    ok: true,
  };
}

function markdownBulletSection(heading: string, items: string[]): string {
  if (items.length === 0) {
    return "";
  }
  return [`## ${heading}`, ...items.map((item) => `- ${item}`)].join("\n");
}

function markdownFilesTable(
  files: PlanDraftSubmission["filesToChange"]
): string {
  if (files.length === 0) {
    return "";
  }
  return [
    "## Files to Change",
    "| File | Action | Description |",
    "|------|--------|-------------|",
    ...files.map(
      (file) =>
        `| \`${file.path}\` | ${file.action} | ${file.description.replace(/\|/g, "\\|")} |`
    ),
  ].join("\n");
}

export function planDraftToMarkdown(draft: PlanDraftSubmission): string {
  const sections = [
    `# Plan: ${draft.title}`,
    "",
    "## Goal",
    draft.goal,
    "",
    markdownBulletSection("Scope & Context", draft.scopeContext),
    "",
    markdownBulletSection("Execution Overview", draft.executionOverview),
    "",
    [
      "## Implementation Steps",
      ...draft.implementationSteps.map(
        (step, index) => `${index + 1}. **${step.title}** - ${step.description}`
      ),
    ].join("\n"),
    "",
    [
      "## To-dos",
      ...draft.todos.map(
        (todo) =>
          `- [${todo.status === "completed" ? "x" : " "}] ${todo.content}`
      ),
    ].join("\n"),
    "",
    markdownFilesTable(draft.filesToChange),
    "",
    markdownBulletSection("Risks & Edge Cases", draft.risksAndEdgeCases),
    "",
    markdownBulletSection("Open Questions", draft.openQuestions),
  ]
    .filter((part) => String(part).trim().length > 0)
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return sections;
}

export function planDraftToParsedPlan(draft: PlanDraftSubmission): ParsedPlan {
  const todos: PlanTodoItem[] = draft.todos.map((todo) => ({
    content: todo.content,
    id: todo.id,
    status: todo.status,
  }));
  return {
    body: planDraftToMarkdown(draft),
    name: draft.title,
    overview: draft.goal,
    todos,
  };
}

export function planDraftToThreadPlan(
  draft: PlanDraftSubmission,
  source?: { path?: string | null; relPath?: string | null }
): ThreadPlanDraft {
  return {
    sourcePath: source?.path ?? undefined,
    sourceRelPath: source?.relPath ?? undefined,
    steps: draft.todos.map((todo) => ({
      description: todo.content,
      id: todo.id,
      status: todo.status,
      targetFiles: draft.filesToChange.map((file) => file.path),
      title: todo.content.split(":")[0]?.trim() ?? todo.content,
    })),
    title: draft.title,
    updatedAt: Date.now(),
  };
}

export function extractLatestPlanDraftFromAssistantContent(
  raw: string
): PlanDraftSubmission | null {
  const payload = parseAgentAssistantPayload(raw);
  if (payload) {
    for (let i = payload.parts.length - 1; i >= 0; i--) {
      const part = payload.parts[i];
      if (
        part?.type !== "tool" ||
        part.name !== "plan_submit_draft" ||
        part.success !== true
      ) {
        continue;
      }
      const normalized = normalizePlanDraftSubmission(part.args);
      return normalized.ok ? normalized.draft : null;
    }
  }

  const matches = [
    ...String(raw ?? "").matchAll(
      /<tool_call\s+tool="plan_submit_draft"[^>]*>([\s\S]*?)<\/tool_call>/g
    ),
  ];
  for (let i = matches.length - 1; i >= 0; i--) {
    const json = matches[i]?.[1];
    if (!json) {
      continue;
    }
    try {
      const parsed = JSON.parse(json) as Record<string, unknown>;
      const normalized = normalizePlanDraftSubmission(parsed);
      if (normalized.ok) {
        return normalized.draft;
      }
    } catch {}
  }
  return null;
}
