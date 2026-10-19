/**
 * 子 Agent 嵌套流式事件（主进程 → 渲染进程），字段与 ChatStreamPayload 对齐。
 */

export type NestedAgentStreamEmit =
  | {
      type: "delta";
      text: string;
      parentToolCallId: string;
      nestingDepth: number;
    }
  | {
      type: "tool_call";
      name: string;
      args: string;
      toolCallId: string;
      parentToolCallId: string;
      nestingDepth: number;
    }
  | {
      type: "tool_result";
      name: string;
      result: string;
      success: boolean;
      toolCallId: string;
      parentToolCallId: string;
      nestingDepth: number;
    }
  | {
      type: "tool_input_delta";
      name: string;
      partialJson: string;
      index: number;
      parentToolCallId: string;
      nestingDepth: number;
    }
  | {
      type: "thinking_delta";
      text: string;
      parentToolCallId: string;
      nestingDepth: number;
    }
  | {
      type: "tool_progress";
      name: string;
      phase: string;
      detail?: string;
      parentToolCallId: string;
      nestingDepth: number;
    };
