import type { ToolCall, ToolResult } from "../agentTools.js";
import { getManagedAgentSession } from "../managedSubagents.js";
import { setTodos, type TodoItem } from "../todoStore.js";
import {
  getDelegateContext,
  type ToolExecutionContext,
} from "./toolContext.js";

export function summarizeManagedAgentForTaskList(agent: {
  id: string;
  title: string;
  status: string;
  subagentType?: string;
  background: boolean;
  parentAgentId: string | null;
  updatedAt: number;
  closedAt: number | null;
  lastError: string | null;
}): string {
  const parts = [
    `#${agent.id}`,
    `[${agent.status}]`,
    agent.background ? "(bg)" : "",
    agent.subagentType ? `<${agent.subagentType}>` : "",
    agent.title,
  ].filter(Boolean);
  if (agent.lastError) parts.push(`error="${agent.lastError}"`);
  return parts.join(" ");
}

export function executeTaskList(
  call: ToolCall,
  execCtx: ToolExecutionContext = {}
): ToolResult {
  const delegateCtx = getDelegateContext();
  const threadId = execCtx.threadId ?? delegateCtx?.threadId ?? "_default";
  const session = getManagedAgentSession(threadId);
  if (!session) {
    return {
      content: "No tasks. Use TaskCreate to spawn a sub-agent task.",
      isError: false,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const filter =
    typeof call.arguments.status === "string"
      ? String(call.arguments.status)
      : null;
  const all = Object.values(session.agents);
  const filtered = filter ? all.filter((a) => a.status === filter) : all;
  if (filtered.length === 0) {
    return {
      content: filter ? `No tasks with status "${filter}".` : "No tasks.",
      isError: false,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const lines = filtered
    .sort((a, b) => a.startedAt - b.startedAt)
    .map((a) => summarizeManagedAgentForTaskList(a));
  return {
    content: lines.join("\n"),
    isError: false,
    name: call.name,
    toolCallId: call.id,
  };
}

export function executeTaskGet(
  call: ToolCall,
  execCtx: ToolExecutionContext = {}
): ToolResult {
  const id = String(call.arguments.taskId ?? call.arguments.id ?? "").trim();
  if (!id) {
    return {
      content: "Error: taskId is required",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const delegateCtx = getDelegateContext();
  const threadId = execCtx.threadId ?? delegateCtx?.threadId ?? "_default";
  const session = getManagedAgentSession(threadId);
  const agent = session?.agents[id];
  if (!agent) {
    return {
      content: `Error: task ${id} not found in this session.`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const meta = {
    background: agent.background,
    childAgentIds: agent.childAgentIds,
    closedAt: agent.closedAt,
    id: agent.id,
    lastError: agent.lastError,
    lastInputSummary: agent.lastInputSummary,
    lastOutputSummary: agent.lastOutputSummary,
    lastResultSummary: agent.lastResultSummary,
    parentAgentId: agent.parentAgentId,
    parentToolCallId: agent.parentToolCallId,
    runProfile: agent.runProfile,
    startedAt: agent.startedAt,
    status: agent.status,
    subagentType: agent.subagentType ?? null,
    title: agent.title,
    updatedAt: agent.updatedAt,
  };
  return {
    content: JSON.stringify(meta, null, 2),
    isError: false,
    name: call.name,
    toolCallId: call.id,
  };
}

export function executeTaskOutput(
  call: ToolCall,
  execCtx: ToolExecutionContext = {}
): ToolResult {
  const id = String(call.arguments.taskId ?? call.arguments.id ?? "").trim();
  if (!id) {
    return {
      content: "Error: taskId is required",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const delegateCtx = getDelegateContext();
  const threadId = execCtx.threadId ?? delegateCtx?.threadId ?? "_default";
  const session = getManagedAgentSession(threadId);
  const agent = session?.agents[id];
  if (!agent) {
    return {
      content: `Error: task ${id} not found in this session.`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const last = call.arguments.last;
  const tail =
    typeof last === "number" && Number.isFinite(last) && last > 0
      ? Math.floor(last)
      : null;
  const messages = tail ? agent.messages.slice(-tail) : agent.messages;
  if (messages.length === 0) {
    return {
      content: `(task ${id} has no output yet; current status=${agent.status})`,
      isError: false,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const formatted = messages
    .map((m) => `[${m.role}] ${m.content}`)
    .join("\n\n---\n\n");
  const header = `Task #${id} status=${agent.status}\n\n`;
  return {
    content: header + formatted,
    isError: false,
    name: call.name,
    toolCallId: call.id,
  };
}

export function executeTodoWrite(
  call: ToolCall,
  execCtx: ToolExecutionContext
): ToolResult {
  const rawTodos = call.arguments.todos;
  if (!Array.isArray(rawTodos)) {
    return {
      content: "Error: todos must be an array",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const todos = rawTodos.map((t: Record<string, unknown>) => ({
    activeForm: String(t.activeForm ?? t.content ?? ""),
    content: String(t.content ?? ""),
    status: (["pending", "in_progress", "completed"].includes(String(t.status))
      ? String(t.status)
      : "pending") as TodoItem["status"],
  }));

  const key = execCtx.threadId ?? execCtx.workspaceRoot ?? "_default";
  const { newTodos } = setTodos(key, todos);

  const completed = newTodos.filter((t) => t.status === "completed").length;
  const inProgress = newTodos.filter((t) => t.status === "in_progress").length;
  const pending = newTodos.filter((t) => t.status === "pending").length;

  return {
    content: `Todo list updated: ${newTodos.length} tasks (${completed} done, ${inProgress} in progress, ${pending} pending)`,
    isError: false,
    name: call.name,
    toolCallId: call.id,
  };
}
