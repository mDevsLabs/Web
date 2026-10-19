import { describe, expect, it } from "vitest";

import {
  extractLatestPlanDraftFromAssistantContent,
  normalizePlanDraftSubmission,
  planDraftToMarkdown,
  planDraftToParsedPlan,
} from "./planDraft";

describe("planDraft", () => {
  it("normalizes a structured plan draft submission", () => {
    const normalized = normalizePlanDraftSubmission({
      executionOverview: [
        "Migrate control flow first",
        "Keep UI backward compatible",
      ],
      filesToChange: [
        {
          action: "Edit",
          description: "Update the prompt path",
          path: "src/foo.ts",
        },
      ],
      goal: "Align planning flow around structured tool calls.",
      implementationSteps: [
        {
          description: "Create a structured plan submission tool.",
          title: "Add tool",
        },
      ],
      openQuestions: ["Should we migrate old persisted plan files?"],
      risksAndEdgeCases: ["Old threads may still contain markdown plans"],
      scopeContext: ["Team mode orchestration", "Plan-mode prompt contract"],
      title: "Fix Team Plan Flow",
      todos: [{ content: "Wire the tool into Plan mode" }],
    });

    expect(normalized.ok).toBe(true);
    if (!normalized.ok) {
      return;
    }
    expect(normalized.draft.todos[0]?.id).toBe("todo-1");
    expect(normalized.draft.filesToChange[0]?.action).toBe("Edit");
  });

  it("converts a plan draft into parsed plan markdown", () => {
    const normalized = normalizePlanDraftSubmission({
      executionOverview: ["Migrate control flow first"],
      filesToChange: [
        {
          action: "Edit",
          description: "Update the prompt path",
          path: "src/foo.ts",
        },
      ],
      goal: "Align planning flow around structured tool calls.",
      implementationSteps: [
        {
          description: "Create a structured plan submission tool.",
          title: "Add tool",
        },
      ],
      openQuestions: [],
      risksAndEdgeCases: ["Old threads may still contain markdown plans"],
      scopeContext: ["Team mode orchestration"],
      title: "Fix Team Plan Flow",
      todos: [
        {
          content: "Wire the tool into Plan mode",
          id: "todo-a",
          status: "pending",
        },
      ],
    });
    expect(normalized.ok).toBe(true);
    if (!normalized.ok) {
      return;
    }

    const parsed = planDraftToParsedPlan(normalized.draft);
    expect(parsed.name).toBe("Fix Team Plan Flow");
    expect(parsed.overview).toBe(
      "Align planning flow around structured tool calls."
    );
    expect(parsed.body).toContain("# Plan: Fix Team Plan Flow");
    expect(parsed.body).toContain("## Files to Change");
    expect(planDraftToMarkdown(normalized.draft)).toContain(
      "Wire the tool into Plan mode"
    );
  });

  it("extracts the latest structured plan draft from assistant content", () => {
    const content = JSON.stringify({
      _asyncAssistant: 1,
      parts: [
        { text: "I drafted the plan.", type: "text" },
        {
          args: {
            executionOverview: ["Migrate control flow first"],
            filesToChange: [],
            goal: "Align planning flow around structured tool calls.",
            implementationSteps: [
              {
                description: "Create a structured plan submission tool.",
                title: "Add tool",
              },
            ],
            openQuestions: [],
            risksAndEdgeCases: [],
            scopeContext: ["Team mode orchestration"],
            title: "Fix Team Plan Flow",
            todos: [{ content: "Wire the tool into Plan mode" }],
          },
          name: "plan_submit_draft",
          result: "Plan draft recorded.",
          success: true,
          toolUseId: "plan-1",
          type: "tool",
        },
      ],
      v: 1,
    });

    const extracted = extractLatestPlanDraftFromAssistantContent(content);
    expect(extracted?.title).toBe("Fix Team Plan Flow");
    expect(extracted?.implementationSteps).toHaveLength(1);
  });
});
