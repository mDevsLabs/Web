import {
  normalizePlanDraftSubmission,
  type PlanDraftSubmission,
} from "../../src/planDraft.js";
import type { AgentToolDef, ToolCall, ToolResult } from "./agentTools.js";

type PlanDraftRuntime = {
  onDraft: (draft: PlanDraftSubmission) => void;
};

const runtimes = new Map<string, PlanDraftRuntime>();

export const planSubmitDraftTool: AgentToolDef = {
  description:
    "Submit the structured plan draft. Must be called exactly once when the plan is ready.",
  name: "plan_submit_draft",
  parameters: {
    properties: {
      executionOverview: {
        description: "High-level sequencing or milestone bullets.",
        items: { type: "string" },
        type: "array",
      },
      filesToChange: {
        description: "Planned file changes.",
        items: {
          properties: {
            action: { enum: ["Edit", "New", "Delete"], type: "string" },
            description: { type: "string" },
            path: { type: "string" },
          },
          required: ["path", "action", "description"],
          type: "object",
        },
        type: "array",
      },
      goal: { description: "One or two sentence plan goal.", type: "string" },
      implementationSteps: {
        description: "Ordered implementation steps.",
        items: {
          properties: {
            description: { type: "string" },
            title: { type: "string" },
          },
          required: ["title", "description"],
          type: "object",
        },
        type: "array",
      },
      openQuestions: {
        description: "Outstanding open questions.",
        items: { type: "string" },
        type: "array",
      },
      risksAndEdgeCases: {
        description: "Important risks and edge cases.",
        items: { type: "string" },
        type: "array",
      },
      scopeContext: {
        description: "Key scope or context bullets.",
        items: { type: "string" },
        type: "array",
      },
      title: { description: "Concise plan title.", type: "string" },
      todos: {
        description: "Checklist items for the plan.",
        items: {
          properties: {
            content: { type: "string" },
            id: { type: "string" },
            status: { enum: ["pending", "completed"], type: "string" },
          },
          required: ["content"],
          type: "object",
        },
        type: "array",
      },
    },
    required: ["title", "goal", "implementationSteps", "todos"],
    type: "object",
  },
};

export function setPlanDraftRuntime(
  threadId: string,
  next: PlanDraftRuntime | null
): void {
  if (!threadId) {
    return;
  }
  if (next) {
    runtimes.set(threadId, next);
  } else {
    runtimes.delete(threadId);
  }
}

export async function executePlanSubmitDraftTool(
  call: ToolCall,
  threadId?: string | null
): Promise<ToolResult> {
  const runtime = threadId ? (runtimes.get(threadId) ?? null) : null;
  if (!runtime) {
    return {
      content: "plan_submit_draft is only available during Plan mode sessions.",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const normalized = normalizePlanDraftSubmission(call.arguments);
  if (!normalized.ok) {
    return {
      content: normalized.error,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  runtime.onDraft(normalized.draft);
  return {
    content: `Plan draft recorded: ${normalized.draft.title}.`,
    isError: false,
    name: call.name,
    toolCallId: call.id,
  };
}
