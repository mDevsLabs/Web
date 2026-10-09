import type { ToolCall, ToolResult } from "./agentTools.js";
import { getPlanQuestionRuntime } from "./planQuestionRuntime.js";

/** 与渲染进程 `TeamRoleScope` 一致，用于 Team 模式下把澄清题挂到对应角色工作流 */
export type TeamPlanQuestionRoleScope = {
  teamTaskId: string;
  teamExpertId: string;
  teamRoleKind: "specialist" | "reviewer" | "lead";
  teamExpertName: string;
  teamRoleType: string;
};

export type PlanQuestionEmitExtras = {
  teamRoleScope?: TeamPlanQuestionRoleScope;
};

export type PlanQuestionWire = {
  text: string;
  options: { id: string; label: string }[];
  freeform?: boolean;
};

const waiters = new Map<
  string,
  (payload: { skipped?: boolean; answerText?: string }) => void
>();
const OTHER_PATTERNS = /^(other|其他|自定义|custom)/i;

function threadPrefix(threadId: string): string {
  return `pq:${threadId}:`;
}

/** 中止对话时释放正在等待的 ask_plan_question */
export function abortPlanQuestionWaitersForThread(threadId: string): void {
  const prefix = threadPrefix(threadId);
  for (const id of [...waiters.keys()]) {
    if (!id.startsWith(prefix)) continue;
    const w = waiters.get(id);
    waiters.delete(id);
    w?.({ answerText: "已中止生成。", skipped: true });
  }
}

export function resolvePlanQuestionTool(
  requestId: string,
  payload: { skipped?: boolean; answerText?: string }
): boolean {
  const w = waiters.get(requestId);
  if (!w) return false;
  waiters.delete(requestId);
  w(payload);
  return true;
}

function defaultOtherLabel(question: string): string {
  return /[\u4e00-\u9fff]/.test(question)
    ? "其他（请填写）"
    : "Other (please specify)";
}

export function normalizePlanQuestionArgs(
  raw: Record<string, unknown>
): { ok: true; q: PlanQuestionWire } | { ok: false; error: string } {
  const question = String(raw.question ?? "").trim();
  const freeform = raw.freeform === true;
  if (!question) {
    return {
      error: "Error: question is required for ask_plan_question.",
      ok: false,
    };
  }
  const optRaw = raw.options;
  if (freeform) {
    const customLabel =
      Array.isArray(optRaw) && optRaw.length > 0
        ? String(
            (typeof optRaw[0] === "string"
              ? optRaw[0]
              : (optRaw[0] as Record<string, unknown> | null | undefined)
                  ?.label) ?? ""
          ).trim()
        : "";
    return {
      ok: true,
      q: {
        freeform: true,
        options: [
          { id: "custom", label: customLabel || defaultOtherLabel(question) },
        ],
        text: question,
      },
    };
  }
  if (!Array.isArray(optRaw) || optRaw.length < 3) {
    return {
      error:
        "Error: ask_plan_question requires 3 concrete options plus 1 custom option.",
      ok: false,
    };
  }
  const concrete: { id: string; label: string }[] = [];
  let custom: { id: string; label: string } | null = null;
  for (let i = 0; i < optRaw.length; i++) {
    const item = optRaw[i];
    let id = "";
    let label = "";
    if (typeof item === "string") {
      label = item.trim();
    } else if (item && typeof item === "object" && !Array.isArray(item)) {
      const o = item as Record<string, unknown>;
      id = String(o.id ?? "").trim();
      label = String(o.label ?? o.text ?? "").trim();
    }
    if (!label) continue;
    if (OTHER_PATTERNS.test(label) || OTHER_PATTERNS.test(id)) {
      custom = { id: id || "custom", label };
      continue;
    }
    if (concrete.length < 3) {
      concrete.push({
        id: id || `choice_${concrete.length + 1}`,
        label,
      });
    }
  }
  if (concrete.length < 3) {
    return {
      error:
        "Error: ask_plan_question requires exactly 3 concrete options before the custom option.",
      ok: false,
    };
  }
  return {
    ok: true,
    q: {
      options: [
        ...concrete,
        custom ?? {
          id: "custom",
          label: defaultOtherLabel(question),
        },
      ],
      text: question,
    },
  };
}

/**
 * 通用澄清：阻塞直到用户在 UI 中选择或跳过；结果作为 tool_result 回到模型。
 */
export async function executeAskPlanQuestionTool(
  call: ToolCall,
  emitExtras?: PlanQuestionEmitExtras
): Promise<ToolResult> {
  const rt = getPlanQuestionRuntime();
  if (!rt) {
    return {
      content: "ask_plan_question is not available in this execution context.",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const norm = normalizePlanQuestionArgs(call.arguments);
  if (!norm.ok) {
    return {
      content: norm.error,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const requestId = `${threadPrefix(rt.threadId)}${call.id}`;

  rt.emit({
    question: norm.q,
    requestId,
    type: "plan_question_request",
    ...(emitExtras?.teamRoleScope
      ? { teamRoleScope: emitExtras.teamRoleScope }
      : {}),
  });

  return await new Promise<ToolResult>((resolve) => {
    const finish = (payload: { skipped?: boolean; answerText?: string }) => {
      const text = payload.skipped
        ? payload.answerText?.trim() ||
          "[User skipped — use your recommended default and continue.]"
        : payload.answerText?.trim() || "(empty answer)";
      resolve({
        content: text,
        isError: false,
        name: call.name,
        toolCallId: call.id,
      });
    };

    if (rt.signal.aborted) {
      finish({ answerText: "已中止生成。", skipped: true });
      return;
    }

    const onAbort = () => {
      waiters.delete(requestId);
      finish({ answerText: "已中止生成。", skipped: true });
    };
    rt.signal.addEventListener("abort", onAbort, { once: true });

    waiters.set(requestId, (payload) => {
      rt.signal.removeEventListener("abort", onAbort);
      finish(payload);
    });
  });
}
