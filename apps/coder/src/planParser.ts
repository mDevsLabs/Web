import { flattenAssistantTextPartsForSearch } from "./agentStructuredMessage";

/**
 * Parse Plan-mode AI output into structured questions and plan documents.
 *
 * Question block format (AI-produced):
 *   ---QUESTIONS---
 *   <question text>
 *   [A] option text
 *   [B] option text
 *   ---/QUESTIONS---
 *
 * Plan block format:
 *   # Plan: <title>
 *   ## Goal / ## Steps / ## Files to Change / ## Risks ...
 */

export type PlanQuestion = {
  text: string;
  options: { id: string; label: string }[];
  freeform?: boolean;
};

export type PlanTodoItem = {
  id: string;
  content: string;
  status: "pending" | "completed";
};

export type ParsedPlan = {
  name: string;
  overview: string;
  body: string;
  todos: PlanTodoItem[];
};

const Q_OPEN = /---QUESTIONS---/;
const Q_CLOSE = /---\/QUESTIONS---/;
const Q_OPTION = /^\s*\[([A-Z])\]\s+(.+)$/;

export function parseQuestions(text: string): PlanQuestion | null {
  const openMatch = text.match(Q_OPEN);
  const closeMatch = text.match(Q_CLOSE);
  if (!openMatch || !closeMatch) {
    return null;
  }
  const inner = text
    .slice(openMatch.index! + openMatch[0].length, closeMatch.index!)
    .trim();
  if (!inner) {
    return null;
  }

  const lines = inner.split("\n");
  const questionLines: string[] = [];
  const options: { id: string; label: string }[] = [];

  for (const line of lines) {
    const m = line.match(Q_OPTION);
    if (m) {
      options.push({ id: m[1]!, label: m[2]!.trim() });
    } else if (options.length === 0 && line.trim()) {
      questionLines.push(line.trim());
    }
  }

  if (questionLines.length === 0 || options.length < 2) {
    return null;
  }
  return { options, text: questionLines.join("\n") };
}

/**
 * 若线程最后一条是助手消息且内含 QUESTIONS 块，则视为「尚未继续对话、待用户作答」。
 * 用于切回线程时恢复 Plan 问题弹窗（助手内容为结构化 JSON 时会先展平文本再解析）。
 */
export function pendingPlanQuestionFromMessages(
  messages: ReadonlyArray<{ role: string; content: string }>
): PlanQuestion | null {
  if (messages.length === 0) {
    return null;
  }
  const last = messages[messages.length - 1]!;
  if (last.role !== "assistant") {
    return null;
  }
  const flat = flattenAssistantTextPartsForSearch(last.content);
  return parseQuestions(flat);
}

/**
 * Strip the entire ---QUESTIONS--- block (including content) from the message
 * so the chat bubble only shows the conversational context around it.
 */
export function stripQuestionMarkers(text: string): string {
  return text.replace(/---QUESTIONS---[\s\S]*?---\/QUESTIONS---/g, "").trim();
}

const Q_BLOCK_OPEN_MARKER = "---QUESTIONS---";
const Q_BLOCK_CLOSE_MARKER = "---/QUESTIONS---";

/**
 * 助手气泡渲染：去掉 ---QUESTIONS--- 块（弹窗已承载选项），避免用户看到原始标记；
 * 未闭合时也会先隐藏流式标记，避免原始协议泄漏到聊天气泡。
 */
export function assistantDisplayStripQuestionBlock(content: string): {
  text: string;
  questionState: "none" | "pending" | "ready";
} {
  const openIdx = content.indexOf(Q_BLOCK_OPEN_MARKER);
  if (openIdx === -1) {
    return { questionState: "none", text: content };
  }

  const closeIdx = content.indexOf(
    Q_BLOCK_CLOSE_MARKER,
    openIdx + Q_BLOCK_OPEN_MARKER.length
  );
  const endIdx =
    closeIdx === -1 ? content.length : closeIdx + Q_BLOCK_CLOSE_MARKER.length;
  const text = `${content.slice(0, openIdx)}${content.slice(endIdx)}`
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return {
    questionState: closeIdx === -1 ? "pending" : "ready",
    text,
  };
}

/**
 * 去掉 `# Plan:` 文档正文，聊天区只保留前言。
 */
export function stripPlanDocumentForChatDisplay(text: string): string {
  const m = text.match(/^#\s+Plan:\s/im);
  if (!m || m.index === undefined) {
    return text.trim();
  }
  const preamble = text.slice(0, m.index).trim();
  return preamble.length > 0
    ? preamble
    : "计划已生成，请查看下方 **Review Plan**；完整正文已保存为 `.plan.md`。";
}

/**
 * Remove the `# Plan:` document from chat when Review Plan panel shows the same content.
 * Keeps any preamble (e.g. short intro before the plan).
 */
export function stripPlanBodyForChatDisplay(text: string): string {
  return stripPlanDocumentForChatDisplay(stripQuestionMarkers(text));
}

const PLAN_HEADING = /^#\s+Plan:\s*(.+)$/m;
const GOAL_SECTION = /^##\s+Goal\s*$/m;
const EXECUTION_SECTION = /^##\s+Execution Overview\s*$/m;
const STEPS_SECTION = /^##\s+Implementation Steps\s*$/m;
const TODOS_SECTION = /^##\s+(?:To-dos|Todos|TODOs?)\s*$/m;
const CHECKBOX_LINE = /^\s*[-*]\s+\[([ xX])\]\s+(.+)$/;
const STEP_LINE = /^\d+\.\s+\*\*(.+?)\*\*\s*[—–-]\s*(.+)$/;

function sectionBody(text: string, heading: RegExp): string {
  const idx = text.search(heading);
  if (idx < 0) {
    return "";
  }
  const after = text.slice(idx).replace(heading, "").trim();
  const nextSection = after.search(/^##\s+/m);
  return (nextSection >= 0 ? after.slice(0, nextSection) : after).trim();
}

function parseChecklistTodos(block: string): PlanTodoItem[] {
  const todos: PlanTodoItem[] = [];
  let index = 0;
  for (const line of block.split("\n")) {
    const match = line.match(CHECKBOX_LINE);
    if (!match) {
      continue;
    }
    index++;
    todos.push({
      content: match[2]!.trim(),
      id: `todo-${index}`,
      status: match[1]!.toLowerCase() === "x" ? "completed" : "pending",
    });
  }
  return todos;
}

export function planBodyWithTodos(plan: ParsedPlan): string {
  const todoLines = plan.todos.map(
    (todo) => `- [${todo.status === "completed" ? "x" : " "}] ${todo.content}`
  );
  if (todoLines.length === 0) {
    return plan.body.trim();
  }
  const todoSection = `## To-dos\n${todoLines.join("\n")}`;
  if (TODOS_SECTION.test(plan.body)) {
    return plan.body
      .replace(
        /##\s+(?:To-dos|Todos|TODOs?)\s*$[\s\S]*?(?=^##\s+|\s*$)/m,
        `${todoSection}\n\n`
      )
      .trim();
  }
  return `${plan.body.trim()}\n\n${todoSection}`.trim();
}

export function parsePlanDocument(text: string): ParsedPlan | null {
  const headMatch = text.match(PLAN_HEADING);
  if (!headMatch) {
    return null;
  }

  const name = headMatch[1]!.trim();

  let overview = "";
  const goalBlock = sectionBody(text, GOAL_SECTION);
  if (goalBlock) {
    overview = goalBlock.trim().split("\n")[0]?.trim() ?? "";
  }
  if (!overview) {
    const executionBlock = sectionBody(text, EXECUTION_SECTION);
    overview =
      executionBlock
        .trim()
        .split("\n")[0]
        ?.replace(/^[-*]\s+/, "") ?? "";
  }

  const todos: PlanTodoItem[] = [];
  const todoBlock = sectionBody(text, TODOS_SECTION);
  if (todoBlock) {
    todos.push(...parseChecklistTodos(todoBlock));
  }
  if (todos.length === 0) {
    const stepsBlock = sectionBody(text, STEPS_SECTION);
    let stepNum = 0;
    for (const line of stepsBlock.split("\n")) {
      const m = line.match(STEP_LINE);
      if (m) {
        stepNum++;
        todos.push({
          content: `${m[1]!.trim()}: ${m[2]!.trim()}`,
          id: `step-${stepNum}`,
          status: "pending",
        });
      }
    }
  }

  if (todos.length === 0) {
    const numberedStep = /^\d+\.\s+(.+)$/gm;
    let sm: RegExpExecArray | null;
    let stepNum = 0;
    while ((sm = numberedStep.exec(text)) !== null) {
      stepNum++;
      if (stepNum > 20) break;
      todos.push({
        content: sm[1]!.trim().replace(/^\*\*(.+?)\*\*/, "$1"),
        id: `step-${stepNum}`,
        status: "pending",
      });
    }
  }

  const body = text.slice(headMatch.index!).trim();

  return { body, name, overview, todos };
}

/**
 * Generate YAML-frontmatter .plan.md content.
 */
export function toPlanMd(plan: ParsedPlan): string {
  const yamlTodos = plan.todos
    .map(
      (t) =>
        `  - id: ${t.id}\n    content: ${t.content.replace(/"/g, '\\"')}\n    status: ${t.status}`
    )
    .join("\n");

  return [
    "---",
    `name: ${plan.name}`,
    `overview: ${plan.overview}`,
    "todos:",
    yamlTodos,
    "isProject: false",
    "---",
    "",
    planBodyWithTodos(plan),
    "",
  ].join("\n");
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "_")
    .replace(/-+/g, "-")
    .slice(0, 40)
    .replace(/[_-]+$/, "");
}

export function generatePlanFilename(name: string): string {
  const slug = slugify(name) || "plan";
  const id = Math.random().toString(16).slice(2, 10);
  return `${slug}_${id}.plan.md`;
}
