/**
 * 工具执行引擎 — 接收工具调用并在工作区内安全执行。
 * Modularisé avec délégation aux sous-modules du dossier ./tools/
 */

import { executePlaywrightTool } from "../browser/playwrightTool.js";
import { getMcpManager } from "../mcp/index.js";
import type { ToolCall, ToolResult } from "./agentTools.js";
import { executePlanSubmitDraftTool } from "./planDraftTool.js";
import { executeAskPlanQuestionTool } from "./planQuestionTool.js";
import { executeTeamEscalateToLeadTool } from "./teamEscalateTool.js";
import { executeTeamPeerRequestTool } from "./teamPeerRequestTool.js";
import { executeTeamPlanDecideTool } from "./teamPlanDecideTool.js";
import { executeTeamReplyToPeerTool } from "./teamReplyToPeerTool.js";

import {
  clearDelegateContext,
  getDelegateContext,
  setDelegateContext,
  throwIfToolAbortRequested,
  type SubAgentBackgroundDonePayload,
  type ToolAfterWriteSnapshot,
  type ToolExecutionContext,
  type ToolExecutionHooks,
  type ToolWriteSnapshot,
} from "./tools/toolContext.js";
import {
  executeReadFile,
  executeStrReplace,
  executeViewImage,
  executeWriteToFile,
} from "./tools/fileTools.js";
import {
  executeGlob,
  executeGrepTool,
  executeListDir,
} from "./tools/searchTools.js";
import {
  executeCommand,
  executeTerminalTool,
} from "./tools/terminalTools.js";
import {
  executeFetchTool,
  executeWebSearchTool,
} from "./tools/webTools.js";
import {
  executeBrowserCaptureTool,
  executeBrowserTool,
} from "./tools/browserTools.js";
import { executeLspTool } from "./tools/lspTools.js";
import {
  executeAgentClose,
  executeAgentDelegate,
  executeAgentResume,
  executeAgentSendInput,
  executeAgentWait,
} from "./tools/subagentTools.js";
import {
  executeTaskGet,
  executeTaskList,
  executeTaskOutput,
  executeTodoWrite,
} from "./tools/taskTools.js";
import {
  executeListMcpResources,
  executeMcpAgentTool,
  executeReadMcpResource,
} from "./tools/mcpTools.js";

// Ré-export des types et fonctions canoniques pour préserver une rétrocompatibilité totale
export type {
  SubAgentBackgroundDonePayload,
  ToolAfterWriteSnapshot,
  ToolExecutionContext,
  ToolExecutionHooks,
  ToolWriteSnapshot,
};
export { clearDelegateContext, getDelegateContext, setDelegateContext };

export async function executeTool(
  call: ToolCall,
  hooks: ToolExecutionHooks = {},
  execCtx: ToolExecutionContext = {}
): Promise<ToolResult> {
  try {
    throwIfToolAbortRequested(execCtx.signal, call.name, "executeTool:start");
    const customHandler = execCtx.customToolHandlers?.[call.name];
    if (customHandler) {
      return await customHandler(call, hooks, execCtx);
    }
    switch (call.name) {
      case "Read":
        return executeReadFile(call, execCtx);
      case "view_image":
        return executeViewImage(call, execCtx);
      case "Write":
        return executeWriteToFile(call, hooks, execCtx);
      case "Edit":
        return executeStrReplace(call, hooks, execCtx);
      case "Glob":
        return executeGlob(call, execCtx);
      case "list_dir":
        return executeListDir(call, execCtx);
      case "Grep":
        return await executeGrepTool(call, execCtx);
      case "Bash":
        return await executeCommand(call, hooks, execCtx);
      case "Terminal":
        return await executeTerminalTool(call, execCtx);
      case "Browser":
        return await executeBrowserTool(call, execCtx);
      case "BrowserCapture":
        return await executeBrowserCaptureTool(call, execCtx);
      case "Playwright": {
        const hostId = execCtx.hostWebContentsId ?? null;
        if (!hostId) {
          return {
            content:
              "Playwright tool is unavailable because this run is not attached to an app window.",
            isError: true,
            name: call.name,
            toolCallId: call.id,
          };
        }
        return await executePlaywrightTool(call, {
          hostId,
          workspaceRoot: execCtx.workspaceRoot ?? null,
        });
      }
      case "WebSearch":
        return await executeWebSearchTool(call, execCtx);
      case "Fetch":
        return await executeFetchTool(call, execCtx);
      case "LSP":
        return await executeLspTool(call, execCtx);
      case "Agent":
      case "Task":
        return await executeAgentDelegate(call, execCtx);
      case "send_input":
        return await executeAgentSendInput(call, execCtx);
      case "wait_agent":
        return await executeAgentWait(call, execCtx);
      case "resume_agent":
        return await executeAgentResume(call, execCtx);
      case "close_agent":
        return await executeAgentClose(call, execCtx);
      case "request_user_input":
        return {
          content: "request_user_input is not available in this context.",
          isError: true,
          name: call.name,
          toolCallId: call.id,
        };
      case "ListMcpResourcesTool":
        return await executeListMcpResources(call);
      case "ReadMcpResourceTool":
        return await executeReadMcpResource(call, execCtx);
      case "begin_outcome":
        return {
          content: "outcome phase started",
          isError: false,
          name: call.name,
          toolCallId: call.id,
        };
      case "TodoWrite":
        return executeTodoWrite(call, execCtx);
      case "TaskCreate":
        return await executeAgentDelegate(
          {
            ...call,
            arguments: {
              ...call.arguments,
              // TaskCreate 始终异步：把 run_in_background 强制为 true，模型再用
              // TaskList / TaskGet / TaskOutput 取状态，TaskUpdate / TaskStop 操作进度。
              run_in_background: true,
            },
          },
          execCtx
        );
      case "TaskUpdate":
        return await executeAgentSendInput(
          {
            ...call,
            arguments: {
              ...call.arguments,
              target:
                call.arguments.target ??
                call.arguments.taskId ??
                call.arguments.id,
            },
          },
          execCtx
        );
      case "TaskList":
        return executeTaskList(call, execCtx);
      case "TaskGet":
        return executeTaskGet(call, execCtx);
      case "TaskOutput":
        return executeTaskOutput(call, execCtx);
      case "TaskStop":
        return await executeAgentClose(
          {
            ...call,
            arguments: {
              ...call.arguments,
              target:
                call.arguments.target ??
                call.arguments.taskId ??
                call.arguments.id,
            },
          },
          execCtx
        );
      case "ask_plan_question":
        return await executeAskPlanQuestionTool(
          call,
          execCtx.teamToolRoleScope
            ? { teamRoleScope: execCtx.teamToolRoleScope }
            : undefined
        );
      case "plan_submit_draft":
        return await executePlanSubmitDraftTool(call, execCtx.threadId);
      case "team_plan_decide":
        return await executeTeamPlanDecideTool(
          call,
          execCtx.teamToolRoleScope?.teamTaskId
        );
      case "team_escalate_to_lead":
        return await executeTeamEscalateToLeadTool(
          call,
          execCtx.teamToolRoleScope?.teamTaskId
        );
      case "team_request_from_peer":
        return await executeTeamPeerRequestTool(
          call,
          execCtx.teamToolRoleScope?.teamTaskId
        );
      case "team_reply_to_peer":
        return await executeTeamReplyToPeerTool(
          call,
          execCtx.teamToolRoleScope?.teamTaskId
        );
      default:
        if (getMcpManager().isMcpTool(call.name)) {
          return await executeMcpAgentTool(call, execCtx);
        }
        return {
          content: `Unknown tool: ${call.name}`,
          isError: true,
          name: call.name,
          toolCallId: call.id,
        };
    }
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw e;
    }
    return {
      content: `Error: ${e instanceof Error ? e.message : String(e)}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
}
