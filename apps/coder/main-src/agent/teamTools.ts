import type { AgentToolDef } from "./agentTools.js";

export const TEAM_ORCHESTRATOR_TOOLS: AgentToolDef[] = [
  {
    description:
      "Team Lead tool. Create a specialist task with explicit owner, dependencies, and acceptance criteria.",
    name: "AssignTask",
    parameters: {
      properties: {
        acceptanceCriteria: {
          description: "Optional success criteria checklist.",
          items: { type: "string" },
          type: "array",
        },
        dependencies: {
          description: "Optional list of prerequisite task ids.",
          items: { type: "string" },
          type: "array",
        },
        expert: {
          description: "Expert id or role to assign this task to.",
          type: "string",
        },
        task: {
          description: "Concrete task instruction for the assigned expert.",
          type: "string",
        },
      },
      required: ["expert", "task"],
      type: "object",
    },
  },
  {
    description:
      "Team Lead tool. Review one task result and mark approved or revision_needed.",
    name: "ReviewResults",
    parameters: {
      properties: {
        feedback: {
          description: "Optional review summary or revision hints.",
          type: "string",
        },
        taskId: {
          description: "Task id being reviewed.",
          type: "string",
        },
        verdict: {
          description: "Review verdict for the task output.",
          enum: ["approved", "revision_needed"],
          type: "string",
        },
      },
      required: ["taskId", "verdict"],
      type: "object",
    },
  },
  {
    description:
      "Team Lead tool. Ask the user a blocking decision question when human input is required.",
    name: "RequestUserInput",
    parameters: {
      properties: {
        options: {
          description: "Optional answer options for quick selection.",
          items: { type: "string" },
          type: "array",
        },
        question: {
          description: "Question text for the user.",
          type: "string",
        },
      },
      required: ["question"],
      type: "object",
    },
  },
  {
    description:
      "Team Lead tool. Query aggregated progress for all tasks in this Team session.",
    name: "TeamStatus",
    parameters: {
      properties: {},
      required: [],
      type: "object",
    },
  },
];
