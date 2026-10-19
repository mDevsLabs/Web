import { describe, expect, it } from "vitest";
import {
  budgetStructuredAssistantToolResults,
  dedupeStructuredAssistantToolUseIds,
  extractAssistantTextForDisplay,
  extractBotReplyImagePaths,
  extractBotReplyText,
  flattenAssistantTextPartsForSearch,
  formatChatMessageForCompactionSummary,
  isStructuredAssistantMessage,
  parseAgentAssistantPayload,
  stringifyAgentAssistantPayload,
  structuredToLegacyAgentXml,
} from "./agentStructuredMessage";

describe("agentStructuredMessage", () => {
  it("roundtrips parse/stringify", () => {
    const payload = {
      _asyncAssistant: 1 as const,
      parts: [
        { text: "Hello\n", type: "text" as const },
        {
          args: { pattern: "foo" },
          name: "Grep",
          result: "No matches found.",
          success: true,
          toolUseId: "call_1",
          type: "tool" as const,
        },
      ],
      v: 1 as const,
    };
    const raw = stringifyAgentAssistantPayload(payload);
    expect(isStructuredAssistantMessage(raw)).toBe(true);
    expect(parseAgentAssistantPayload(raw)).toEqual(payload);
  });

  it("structuredToLegacyAgentXml contains tool markers", () => {
    const p = parseAgentAssistantPayload(
      stringifyAgentAssistantPayload({
        _asyncAssistant: 1,
        parts: [
          {
            args: { file_path: "a.ts" },
            name: "Read",
            result: "1|ok",
            success: true,
            toolUseId: "x",
            type: "tool",
          },
        ],
        v: 1,
      })
    )!;
    const xml = structuredToLegacyAgentXml(p);
    expect(xml).toContain('<tool_call tool="Read"');
    expect(xml).toContain('<tool_result tool="Read"');
  });

  it("flattenAssistantTextPartsForSearch ignores tool bodies", () => {
    const raw = stringifyAgentAssistantPayload({
      _asyncAssistant: 1,
      parts: [
        { text: "Intro\n\n```diff\n+ x\n```", type: "text" },
        {
          args: {},
          name: "run",
          result: "out",
          success: true,
          toolUseId: "t",
          type: "tool",
        },
      ],
      v: 1,
    });
    expect(flattenAssistantTextPartsForSearch(raw)).toContain("```diff");
    expect(flattenAssistantTextPartsForSearch(raw)).not.toContain("out");
  });

  it("dedupeStructuredAssistantToolUseIds keeps first tool per id", () => {
    const raw = stringifyAgentAssistantPayload({
      _asyncAssistant: 1,
      parts: [
        {
          args: {},
          name: "x",
          result: "first",
          success: true,
          toolUseId: "dup",
          type: "tool",
        },
        {
          args: {},
          name: "x",
          result: "second",
          success: true,
          toolUseId: "dup",
          type: "tool",
        },
      ],
      v: 1,
    });
    const out = dedupeStructuredAssistantToolUseIds(raw);
    const p = parseAgentAssistantPayload(out)!;
    expect(p.parts.filter((x) => x.type === "tool")).toHaveLength(1);
    expect((p.parts[0] as { result: string }).result).toBe("first");
  });

  it("formatChatMessageForCompactionSummary flattens structured tools", () => {
    const raw = stringifyAgentAssistantPayload({
      _asyncAssistant: 1,
      parts: [
        { text: "Searching.", type: "text" },
        {
          args: {},
          name: "grep",
          result: "No matches found.",
          success: true,
          toolUseId: "t",
          type: "tool",
        },
      ],
      v: 1,
    });
    const line = formatChatMessageForCompactionSummary("assistant", raw, {
      maxChars: 2000,
    });
    expect(line).toContain("[ASSISTANT]");
    expect(line).toContain("[tool grep ok]");
    expect(line).not.toContain("_asyncAssistant");
  });

  it("budgetStructuredAssistantToolResults truncates tool result", () => {
    const long = "x".repeat(100);
    const raw = stringifyAgentAssistantPayload({
      _asyncAssistant: 1,
      parts: [
        {
          args: {},
          name: "x",
          result: long,
          success: true,
          toolUseId: "t",
          type: "tool",
        },
      ],
      v: 1,
    });
    const b = budgetStructuredAssistantToolResults(raw, 20);
    const p = parseAgentAssistantPayload(b)!;
    expect(p.parts[0]).toMatchObject({ type: "tool" });
    if (p.parts[0]!.type === "tool") {
      expect(p.parts[0].result.length).toBeLessThan(long.length);
    }
  });

  it("extractAssistantTextForDisplay unwraps structured text parts", () => {
    const raw = stringifyAgentAssistantPayload({
      _asyncAssistant: 1,
      parts: [
        { text: "第一段。", type: "text" },
        {
          args: { file_path: "a.ts" },
          name: "Read",
          result: "1|ok",
          success: true,
          toolUseId: "tool_1",
          type: "tool",
        },
        { text: "\n第二段。", type: "text" },
      ],
      v: 1,
    });

    expect(extractAssistantTextForDisplay(raw)).toBe("第一段。\n第二段。");
  });

  it("extractAssistantTextForDisplay returns fallback for tool-only structured payloads", () => {
    const raw = stringifyAgentAssistantPayload({
      _asyncAssistant: 1,
      parts: [
        {
          args: { file_path: "a.ts" },
          name: "Read",
          result: "1|ok",
          success: true,
          toolUseId: "tool_1",
          type: "tool",
        },
      ],
      v: 1,
    });

    expect(extractAssistantTextForDisplay(raw, "fallback text")).toBe(
      "fallback text"
    );
  });
});

describe("extractBotReplyText", () => {
  it("returns plain text as-is", () => {
    expect(extractBotReplyText("Hello world")).toBe("Hello world");
  });

  it("returns empty string as-is", () => {
    expect(extractBotReplyText("")).toBe("");
  });

  it("extracts text from outer orchestrator payload with no run_async_task", () => {
    const raw = stringifyAgentAssistantPayload({
      _asyncAssistant: 1,
      parts: [{ text: "Direct orchestrator reply.", type: "text" }],
      v: 1,
    });
    expect(extractBotReplyText(raw)).toBe("Direct orchestrator reply.");
  });

  it("extracts inner task text from nested structured payload", () => {
    const innerPayload = stringifyAgentAssistantPayload({
      _asyncAssistant: 1,
      parts: [
        { text: "Here is the answer from the agent.", type: "text" },
        {
          args: { file_path: "a.ts" },
          name: "Read",
          result: "1|ok",
          success: true,
          toolUseId: "tool_1",
          type: "tool",
        },
        { text: "\nAll done!", type: "text" },
      ],
      v: 1,
    });
    const outerRaw = stringifyAgentAssistantPayload({
      _asyncAssistant: 1,
      parts: [
        { text: "让我执行任务。", type: "text" },
        {
          args: { task: "do something" },
          name: "run_async_task",
          result: `workspace=D:\\Project\nmode=agent\nmodel=model-1\n\n${innerPayload}`,
          success: true,
          toolUseId: "call_run",
          type: "tool",
        },
      ],
      v: 1,
    });
    const extracted = extractBotReplyText(outerRaw);
    expect(extracted).toBe("Here is the answer from the agent.\nAll done!");
    expect(extracted).not.toContain("_asyncAssistant");
    expect(extracted).not.toContain("让我执行任务");
    expect(extracted).not.toContain("workspace=");
  });

  it("extracts plain text from run_async_task when inner result is not structured", () => {
    const outerRaw = stringifyAgentAssistantPayload({
      _asyncAssistant: 1,
      parts: [
        {
          args: { task: "hello" },
          name: "run_async_task",
          result:
            "workspace=(none)\nmode=agent\nmodel=m1\n\nThis is a plain text reply from ask mode.",
          success: true,
          toolUseId: "call_run",
          type: "tool",
        },
      ],
      v: 1,
    });
    expect(extractBotReplyText(outerRaw)).toBe(
      "This is a plain text reply from ask mode."
    );
  });

  it("strips metadata prefix correctly with all three lines", () => {
    const outerRaw = stringifyAgentAssistantPayload({
      _asyncAssistant: 1,
      parts: [
        {
          args: { task: "test" },
          name: "run_async_task",
          result:
            "workspace=C:\\Work\nmode=agent\nmodel=abc-123\n\nActual content here.",
          success: true,
          toolUseId: "call_run",
          type: "tool",
        },
      ],
      v: 1,
    });
    expect(extractBotReplyText(outerRaw)).toBe("Actual content here.");
  });

  it("handles run_async_task with no metadata prefix", () => {
    const outerRaw = stringifyAgentAssistantPayload({
      _asyncAssistant: 1,
      parts: [
        {
          args: { task: "test" },
          name: "run_async_task",
          result: "No prefix, just raw content.",
          success: true,
          toolUseId: "call_run",
          type: "tool",
        },
      ],
      v: 1,
    });
    expect(extractBotReplyText(outerRaw)).toBe("No prefix, just raw content.");
  });

  it("falls back to outer text when run_async_task result is empty", () => {
    const outerRaw = stringifyAgentAssistantPayload({
      _asyncAssistant: 1,
      parts: [
        { text: "Orchestrator fallback text.", type: "text" },
        {
          args: { task: "test" },
          name: "run_async_task",
          result: "workspace=(none)\nmode=agent\nmodel=m1\n\n",
          success: true,
          toolUseId: "call_run",
          type: "tool",
        },
      ],
      v: 1,
    });
    expect(extractBotReplyText(outerRaw)).toBe("Orchestrator fallback text.");
  });

  it("joins multiple run_async_task results", () => {
    const outerRaw = stringifyAgentAssistantPayload({
      _asyncAssistant: 1,
      parts: [
        {
          args: { task: "first" },
          name: "run_async_task",
          result: "workspace=W\nmode=agent\nmodel=m\n\nFirst result.",
          success: true,
          toolUseId: "call_1",
          type: "tool",
        },
        {
          args: { task: "second" },
          name: "run_async_task",
          result: "workspace=W\nmode=agent\nmodel=m\n\nSecond result.",
          success: true,
          toolUseId: "call_2",
          type: "tool",
        },
      ],
      v: 1,
    });
    const extracted = extractBotReplyText(outerRaw);
    expect(extracted).toContain("First result.");
    expect(extracted).toContain("Second result.");
  });

  it("ignores non-run_async_task tool parts", () => {
    const outerRaw = stringifyAgentAssistantPayload({
      _asyncAssistant: 1,
      parts: [
        { text: "Main text.", type: "text" },
        {
          args: {},
          name: "get_async_session",
          result: '{"some":"json"}',
          success: true,
          toolUseId: "call_session",
          type: "tool",
        },
      ],
      v: 1,
    });
    expect(extractBotReplyText(outerRaw)).toBe("Main text.");
  });

  it("returns a short summary instead of raw JSON for tool-only bot replies", () => {
    const outerRaw = stringifyAgentAssistantPayload({
      _asyncAssistant: 1,
      parts: [
        {
          args: {},
          name: "get_async_session",
          result: '{"workspace":"demo"}',
          success: true,
          toolUseId: "call_session",
          type: "tool",
        },
      ],
      v: 1,
    });
    expect(extractBotReplyText(outerRaw)).toBe(
      "已读取当前 mAI Coder 会话信息。"
    );
  });

  it("returns raw input for invalid structured message", () => {
    const malformed = '{"_asyncAssistant":1,"v":1,"parts":"not-an-array"}';
    expect(extractBotReplyText(malformed)).toBe(malformed);
  });

  it("returns empty string when structured message has empty parts", () => {
    const raw = stringifyAgentAssistantPayload({
      _asyncAssistant: 1,
      parts: [],
      v: 1,
    });
    expect(extractBotReplyText(raw)).toBe("");
  });
});

describe("extractBotReplyImagePaths", () => {
  it("extracts screenshot image paths from nested run_async_task results", () => {
    const innerPayload = stringifyAgentAssistantPayload({
      _asyncAssistant: 1,
      parts: [
        {
          args: { action: "screenshot_page" },
          name: "Browser",
          result: JSON.stringify({
            format: "png",
            path: "D:\\Temp\\capture.png",
          }),
          success: true,
          toolUseId: "tool_browser",
          type: "tool",
        },
      ],
      v: 1,
    });
    const outerRaw = stringifyAgentAssistantPayload({
      _asyncAssistant: 1,
      parts: [
        {
          args: { task: "capture" },
          name: "run_async_task",
          result: `workspace=D:\\Project\nmode=agent\nmodel=model-1\n\n${innerPayload}`,
          success: true,
          toolUseId: "call_run",
          type: "tool",
        },
      ],
      v: 1,
    });

    expect(extractBotReplyImagePaths(outerRaw)).toEqual([
      "D:\\Temp\\capture.png",
    ]);
  });
});
