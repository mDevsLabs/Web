import type { ToolCall, ToolResult } from "../agentTools.js";
import { shouldRunAgentInBackground } from "../agentForkPolicy.js";
import {
  closeManagedAgent,
  getManagedAgentSession,
  resumeManagedAgent,
  sendInputToManagedAgent,
  spawnManagedAgent,
  startManagedAgent,
  waitForManagedAgents,
} from "../managedSubagents.js";
import {
  getDelegateContext,
  throwIfToolAbortRequested,
  type ToolExecutionContext,
} from "./toolContext.js";

export const BACKGROUND_AGENT_TOOL_RESULT =
  "[Background] Sub-agent started. Its task card opens the right sidebar; do not paste the sub-agent reply into the main chat unless the user asks. / 后台子 Agent 已启动，可从任务卡片打开右侧栏查看；除非用户要求，不要把子 Agent 回复原样贴回主聊天。";

export function coerceAgentDelegateArgs(call: ToolCall): {
  task: string;
  context: string;
  subagentType?: string;
  runInBackground: boolean;
  forkContext: boolean;
} {
  const a = call.arguments;
  const task = String(a.prompt ?? a.task ?? a.description ?? "").trim();
  const context = String(a.context ?? "").trim();
  const subagentType =
    typeof a.subagent_type === "string" && a.subagent_type.trim()
      ? a.subagent_type.trim()
      : undefined;
  const runInBackground =
    a.run_in_background === true || a.run_in_background === "true";
  const forkContext = a.fork_context === true || a.fork_context === "true";
  return { context, forkContext, runInBackground, subagentType, task };
}

export async function executeAgentDelegate(
  call: ToolCall,
  execCtx: ToolExecutionContext = {}
): Promise<ToolResult> {
  throwIfToolAbortRequested(execCtx.signal, call.name, "delegate:start");
  const { task, context, subagentType, runInBackground, forkContext } =
    coerceAgentDelegateArgs(call);
  if (!task) {
    return {
      content: "Error: `prompt` is required for the Agent tool.",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const delegateContext = getDelegateContext();
  if (!delegateContext) {
    return {
      content: "Agent tool is not available in this context.",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const depth = execCtx.delegateExecutionDepth ?? 0;
  if (depth >= 1) {
    return {
      content: "Nested Agent calls are not allowed (max nesting depth: 1).",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const prevCtx = delegateContext;
  const useBackgroundFork = shouldRunAgentInBackground({
    backgroundForkAgentSetting: prevCtx.settings.agent?.backgroundForkAgent,
    envAsyncAgentBackgroundFork:
      process.env.MAI_CODER_AGENT_BACKGROUND_FORK ??
      process.env.ASYNC_AGENT_BACKGROUND_FORK,
    runInBackground,
    subagentType,
  });
  const runtime = spawnManagedAgent({
    background: useBackgroundFork,
    context,
    emit: prevCtx.managedEmit,
    forkContext,
    nestedEmit: prevCtx.nestedEmit,
    options: prevCtx.options,
    parentAgentId: null,
    parentMessages: prevCtx.parentMessages,
    parentToolCallId: call.id,
    settings: prevCtx.settings,
    subagentType,
    task,
    threadId: prevCtx.threadId ?? execCtx.threadId ?? "_default",
    toolHooks: prevCtx.options.toolHooks,
  });
  if (useBackgroundFork) {
    void startManagedAgent(runtime);
    return {
      content: `${BACKGROUND_AGENT_TOOL_RESULT}\nAgent ID: ${runtime.agentId}`,
      isError: false,
      name: call.name,
      toolCallId: call.id,
    };
  }
  await startManagedAgent(runtime);
  const snapshot = getManagedAgentSession(runtime.threadId)?.agents[
    runtime.agentId
  ];
  const finalOutput =
    runtime.messages
      .filter((message) => message.role === "assistant")
      .map((message) => message.content)
      .slice(-1)[0] ?? "";
  if (snapshot?.lastError) {
    return {
      content: `Sub-agent error (${runtime.agentId}): ${snapshot.lastError}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  return {
    content:
      finalOutput || `(sub-agent ${runtime.agentId} completed with no output)`,
    isError: false,
    name: call.name,
    toolCallId: call.id,
  };
}

export async function executeAgentSendInput(
  call: ToolCall,
  execCtx: ToolExecutionContext = {}
): Promise<ToolResult> {
  const delegateContext = getDelegateContext();
  if (!delegateContext) {
    return {
      content: "send_input is not available in this context.",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const target = String(call.arguments.target ?? "").trim();
  const message = String(call.arguments.message ?? "").trim();
  const interrupt =
    call.arguments.interrupt === true || call.arguments.interrupt === "true";
  if (!target || !message) {
    return {
      content: "Error: send_input requires both target and message.",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const result = await sendInputToManagedAgent({
    agentId: target,
    emit: delegateContext.managedEmit,
    interrupt,
    message,
    options: delegateContext.options,
    settings: delegateContext.settings,
    threadId: delegateContext.threadId ?? execCtx.threadId ?? "_default",
  });
  return {
    content: result.ok ? `Queued message for agent ${target}.` : result.error,
    isError: !result.ok,
    name: call.name,
    toolCallId: call.id,
  };
}

export async function executeAgentWait(
  call: ToolCall,
  execCtx: ToolExecutionContext = {}
): Promise<ToolResult> {
  const rawTargets = Array.isArray(call.arguments.targets)
    ? call.arguments.targets
    : [];
  const targets = rawTargets
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);
  if (targets.length === 0) {
    return {
      content: "Error: wait_agent requires at least one target.",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const timeoutMsRaw = Number(call.arguments.timeout_ms ?? 30_000);
  const timeoutMs =
    Number.isFinite(timeoutMsRaw) && timeoutMsRaw > 0 ? timeoutMsRaw : 30_000;
  const delegateContext = getDelegateContext();
  const statuses = await waitForManagedAgents(
    execCtx.threadId ?? delegateContext?.threadId ?? "_default",
    targets,
    timeoutMs
  );
  return {
    content: JSON.stringify(
      {
        statuses,
        timedOut: Object.keys(statuses).length < targets.length,
      },
      null,
      2
    ),
    isError: false,
    name: call.name,
    toolCallId: call.id,
  };
}

export async function executeAgentResume(
  call: ToolCall,
  execCtx: ToolExecutionContext = {}
): Promise<ToolResult> {
  const delegateContext = getDelegateContext();
  if (!delegateContext) {
    return {
      content: "resume_agent is not available in this context.",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const agentId = String(call.arguments.id ?? "").trim();
  if (!agentId) {
    return {
      content: "Error: resume_agent requires id.",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const result = await resumeManagedAgent({
    agentId,
    emit: delegateContext.managedEmit,
    options: delegateContext.options,
    settings: delegateContext.settings,
    threadId: delegateContext.threadId ?? execCtx.threadId ?? "_default",
  });
  return {
    content: result.ok ? `Resumed agent ${agentId}.` : result.error,
    isError: !result.ok,
    name: call.name,
    toolCallId: call.id,
  };
}

export async function executeAgentClose(
  call: ToolCall,
  execCtx: ToolExecutionContext = {}
): Promise<ToolResult> {
  const agentId = String(call.arguments.target ?? "").trim();
  if (!agentId) {
    return {
      content: "Error: close_agent requires target.",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const delegateContext = getDelegateContext();
  const result = closeManagedAgent({
    agentId,
    emit: delegateContext?.managedEmit,
    threadId: execCtx.threadId ?? delegateContext?.threadId ?? "_default",
  });
  return {
    content: result.ok ? `Closed agent ${agentId}.` : result.error,
    isError: !result.ok,
    name: call.name,
    toolCallId: call.id,
  };
}
