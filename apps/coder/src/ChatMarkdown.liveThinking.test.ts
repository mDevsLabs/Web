import React, { type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ChatMarkdown } from "./ChatMarkdown";
import { I18nProvider } from "./i18n";
import type { LiveAgentBlocksState } from "./liveAgentBlocks";

vi.mock("./AgentResultCard", () => ({
  AgentResultCard: () => null,
}));

function renderChatMarkdown(
  props: ComponentProps<typeof ChatMarkdown>
): string {
  return renderToStaticMarkup(
    React.createElement(
      I18nProvider,
      { initialLocale: "fr" },
      React.createElement(ChatMarkdown, props)
    )
  );
}

const liveBlocksWithInterleavedThinking: LiveAgentBlocksState = {
  blocks: [
    {
      endedAt: 1400,
      id: "think-1",
      sealed: true,
      startedAt: 1000,
      text: "Inspect the current UI state.",
      type: "thinking",
    },
    {
      id: "txt-1",
      text: "我正在整理结果。",
      type: "text",
    },
    {
      id: "think-2",
      startedAt: 1500,
      text: "Prepare the final response.",
      type: "thinking",
    },
  ],
};

const liveThoughtMeta: NonNullable<
  ComponentProps<typeof ChatMarkdown>["liveThoughtMeta"]
> = {
  elapsedSeconds: 1.2,
  phase: "streaming",
  streamingThinking: "Prepare the final response.",
};

describe("ChatMarkdown live thinking status", () => {
  it("renders one tail status in live preflight instead of multiple thinking rows", () => {
    const html = renderChatMarkdown({
      agentUi: true,
      content: "",
      liveAgentBlocksState: liveBlocksWithInterleavedThinking,
      liveThoughtMeta,
      preserveLivePreflight: true,
      renderMode: "preflight",
      showAgentWorking: true,
    });

    expect(html).toContain("ref-live-thinking-status");
    expect(html).toContain("flexion");
    expect(html).toContain("正在整理结果");
    expect(html).not.toContain("ref-preflight-thinking");
    expect(html).not.toContain("ref-thought-block");
    expect(html).not.toContain("Inspect the current UI state");
    expect(html).not.toContain("Prepare the final response");
  });

  it("renders the live thinking status outside the preflight shell", () => {
    const html = renderChatMarkdown({
      agentUi: true,
      content: "",
      liveThoughtMeta,
      preserveLivePreflight: true,
      renderMode: "preflight",
      showAgentWorking: true,
    });

    expect(html).toContain("ref-live-thinking-status");
    expect(html).not.toContain("ref-preflight-shell");
    expect(html).not.toContain("ref-preflight-thinking");
  });

  it("does not render ref-thought-block for live all-mode thinking", () => {
    const html = renderChatMarkdown({
      agentUi: true,
      content: "",
      liveAgentBlocksState: liveBlocksWithInterleavedThinking,
      liveThoughtMeta,
      showAgentWorking: true,
    });

    expect(html).toContain("ref-live-thinking-status");
    expect(html).toContain("flexion");
    expect(html).not.toContain("ref-thought-block");
    expect(html).not.toContain("Inspect the current UI state");
    expect(html).not.toContain("Prepare the final response");
  });

  it("moves the live thinking status to the outcome tail once the reply has started", () => {
    const content = [
      "先检查上下文。",
      '<tool_call tool="begin_outcome">{}</tool_call>',
      "这是正在流式输出的正式回复。",
    ].join("\n");

    const preflightHtml = renderChatMarkdown({
      agentUi: true,
      content,
      liveThoughtMeta,
      preserveLivePreflight: true,
      renderMode: "preflight",
      showAgentWorking: true,
    });
    const outcomeHtml = renderChatMarkdown({
      agentUi: true,
      content,
      liveThoughtMeta,
      preserveLivePreflight: true,
      renderMode: "outcome",
      showAgentWorking: true,
    });

    expect(preflightHtml).not.toContain("ref-live-thinking-status");
    expect(outcomeHtml).toContain("这是正在流式输出的正式回复。");
    expect(outcomeHtml).toContain("ref-live-thinking-status");
    expect(outcomeHtml.indexOf("这是正在流式输出的正式回复。")).toBeLessThan(
      outcomeHtml.indexOf("ref-live-thinking-status")
    );
  });
});
