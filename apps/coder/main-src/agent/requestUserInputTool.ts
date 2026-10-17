import type {
  AgentUserInputQuestion,
  AgentUserInputRequest,
} from "../../src/agentSessionTypes.js";
import type { ToolCall, ToolResult } from "./agentTools.js";
import type { TeamPlanQuestionRoleScope } from "./planQuestionTool.js";

export type RequestUserInputEmitExtras = {
  teamRoleScope?: TeamPlanQuestionRoleScope;
};

export type RequestUserInputRuntime = {
  threadId: string;
  signal: AbortSignal;
  emit: (evt: Record<string, unknown>) => void;
  agentId: string;
  agentTitle: string;
  onPendingChange?: (request: AgentUserInputRequest | null) => void;
};

type RequestUserInputResponsePayload = {
  answers: Record<string, string>;
};

const waiters = new Map<
  string,
  (payload: RequestUserInputResponsePayload) => void
>();

function threadPrefix(threadId: string): string {
  return `ui:${threadId}:`;
}

function defaultHeader(question: string, index: number): string {
  return /[\u4e00-\u9fff]/.test(question)
    ? `问题 ${index + 1}`
    : `Question ${index + 1}`;
}

function normalizeQuestionOptions(
  raw: unknown
): AgentUserInputQuestion["options"] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const normalized = raw
    .map((item) => {
      if (typeof item === "string") {
        const label = item.trim();
        return label ? { description: "", label } : null;
      }
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }
      const row = item as Record<string, unknown>;
      const label = String(row.label ?? "").trim();
      const description = String(row.description ?? "").trim();
      if (!label) {
        return null;
      }
      return { description, label };
    })
    .filter((item): item is AgentUserInputQuestion["options"][number] =>
      Boolean(item)
    );
  return normalized.slice(0, 3);
}

export function normalizeRequestUserInputArgs(
  raw: Record<string, unknown>
):
  | { ok: true; questions: AgentUserInputQuestion[] }
  | { ok: false; error: string } {
  const rawQuestions = Array.isArray(raw.questions) ? raw.questions : [];
  if (rawQuestions.length === 0) {
    return {
      error: "Error: request_user_input requires 1-3 questions.",
      ok: false,
    };
  }
  const questions = rawQuestions
    .slice(0, 3)
    .map((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }
      const row = item as Record<string, unknown>;
      const question = String(row.question ?? "").trim();
      if (!question) {
        return null;
      }
      const id = String(row.id ?? "").trim() || `question_${index + 1}`;
      const header =
        String(row.header ?? "").trim() || defaultHeader(question, index);
      const options = normalizeQuestionOptions(row.options);
      if (options.length < 2) {
        return null;
      }
      return {
        header,
        id,
        options,
        question,
      } satisfies AgentUserInputQuestion;
    })
    .filter((item): item is AgentUserInputQuestion => Boolean(item));
  if (questions.length === 0) {
    return {
      error:
        "Error: request_user_input requires at least one valid question with 2-3 options.",
      ok: false,
    };
  }
  return { ok: true, questions };
}

function normalizeAnswersMap(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const id = String(key ?? "").trim();
    const answer = String(value ?? "").trim();
    if (!id || !answer) {
      continue;
    }
    out[id] = answer;
  }
  return out;
}

export function abortRequestUserInputWaitersForThread(threadId: string): void {
  const prefix = threadPrefix(threadId);
  for (const id of [...waiters.keys()]) {
    if (!id.startsWith(prefix)) {
      continue;
    }
    const waiter = waiters.get(id);
    waiters.delete(id);
    waiter?.({ answers: { _status: "aborted" } });
  }
}

export function resolveRequestUserInput(
  requestId: string,
  payload: { answers?: Record<string, unknown> }
): boolean {
  const waiter = waiters.get(requestId);
  if (!waiter) {
    return false;
  }
  waiters.delete(requestId);
  waiter({ answers: normalizeAnswersMap(payload.answers) });
  return true;
}

export function extractRequestUserInputAnswers(result: string): string[] {
  try {
    const parsed = JSON.parse(String(result ?? "")) as {
      answers?: Record<string, unknown>;
    } | null;
    if (
      !parsed?.answers ||
      typeof parsed.answers !== "object" ||
      Array.isArray(parsed.answers)
    ) {
      return [];
    }
    return Object.values(parsed.answers)
      .map((value) => String(value ?? "").trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export async function executeRequestUserInputTool(
  call: ToolCall,
  runtime: RequestUserInputRuntime,
  emitExtras?: RequestUserInputEmitExtras
): Promise<ToolResult> {
  const normalized = normalizeRequestUserInputArgs(call.arguments);
  if (!normalized.ok) {
    return {
      content: normalized.error,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const requestId = `${threadPrefix(runtime.threadId)}${runtime.agentId}:${call.id}`;
  const request: AgentUserInputRequest = {
    agentId: runtime.agentId,
    agentTitle: runtime.agentTitle,
    createdAt: Date.now(),
    questions: normalized.questions,
    requestId,
  };

  runtime.onPendingChange?.(request);
  runtime.emit({
    request,
    type: "user_input_request",
    ...(emitExtras?.teamRoleScope
      ? { teamRoleScope: emitExtras.teamRoleScope }
      : {}),
  });

  return await new Promise<ToolResult>((resolve) => {
    const finish = (payload: RequestUserInputResponsePayload) => {
      runtime.onPendingChange?.(null);
      resolve({
        content: JSON.stringify({ answers: payload.answers }, null, 2),
        isError: false,
        name: call.name,
        toolCallId: call.id,
      });
    };

    if (runtime.signal.aborted) {
      finish({ answers: { _status: "aborted" } });
      return;
    }

    const onAbort = () => {
      waiters.delete(requestId);
      finish({ answers: { _status: "aborted" } });
    };
    runtime.signal.addEventListener("abort", onAbort, { once: true });

    waiters.set(requestId, (payload) => {
      runtime.signal.removeEventListener("abort", onAbort);
      finish(payload);
    });
  });
}

export function createRequestUserInputToolHandler(
  runtime: RequestUserInputRuntime,
  emitExtras?: RequestUserInputEmitExtras
) {
  return (call: ToolCall) =>
    executeRequestUserInputTool(call, runtime, emitExtras);
}
