import { describe, expect, it } from "vitest";
import { setPlanQuestionRuntime } from "./planQuestionRuntime.js";
import {
  executeAskPlanQuestionTool,
  normalizePlanQuestionArgs,
  resolvePlanQuestionTool,
} from "./planQuestionTool.js";

describe("normalizePlanQuestionArgs", () => {
  it("keeps only 3 concrete options and appends custom option last", () => {
    const out = normalizePlanQuestionArgs({
      options: [
        { id: "architecture", label: "架构重构" },
        { id: "code-quality", label: "代码质量" },
        { id: "dependency", label: "依赖优化" },
        { id: "performance", label: "性能优化" },
        { id: "custom", label: "其他（请填写）" },
      ],
      question: "你想重构项目的哪个方面？",
    });

    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.q.options).toEqual([
      { id: "architecture", label: "架构重构" },
      { id: "code-quality", label: "代码质量" },
      { id: "dependency", label: "依赖优化" },
      { id: "custom", label: "其他（请填写）" },
    ]);
  });

  it("synthesizes custom option when model forgets it", () => {
    const out = normalizePlanQuestionArgs({
      options: ["Architecture", "Code quality", "Dependencies", "Performance"],
      question: "Which direction should I take?",
    });

    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.q.options).toEqual([
      { id: "choice_1", label: "Architecture" },
      { id: "choice_2", label: "Code quality" },
      { id: "choice_3", label: "Dependencies" },
      { id: "custom", label: "Other (please specify)" },
    ]);
  });

  it("supports freeform-only fallback questions", () => {
    const out = normalizePlanQuestionArgs({
      freeform: true,
      options: [{ id: "custom", label: "请补充说明" }],
      question: "请补充你想优化的具体模块和目标。",
    });

    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.q.freeform).toBe(true);
    expect(out.q.options).toEqual([{ id: "custom", label: "请补充说明" }]);
  });

  it("executes as a generic clarification tool when a runtime is available", async () => {
    const emitted: Record<string, unknown>[] = [];
    const ac = new AbortController();
    setPlanQuestionRuntime({
      emit: (evt) => emitted.push(evt),
      signal: ac.signal,
      threadId: "thread-any-mode",
    });
    try {
      const resultPromise = executeAskPlanQuestionTool({
        arguments: {
          options: ["范围", "风格", "优先级", "其他"],
          question: "需要先确认哪一点？",
        },
        id: "call-1",
        name: "ask_plan_question",
      });

      expect(emitted[0]).toMatchObject({
        requestId: "pq:thread-any-mode:call-1",
        type: "plan_question_request",
      });
      expect(
        resolvePlanQuestionTool("pq:thread-any-mode:call-1", {
          answerText: "范围",
        })
      ).toBe(true);
      await expect(resultPromise).resolves.toMatchObject({
        content: "范围",
        isError: false,
        name: "ask_plan_question",
      });
    } finally {
      ac.abort();
      setPlanQuestionRuntime(null);
    }
  });
});
