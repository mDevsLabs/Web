import { describe, expect, it } from "vitest";
import {
  renderForPlatform,
  renderTelegramRichText,
  splitTelegramRichText,
} from "./platformMarkdown.js";

describe("renderTelegramRichText", () => {
  it("converts common markdown markers into Telegram entities", () => {
    const rich = renderTelegramRichText(
      "## Title\n**Bold** and [link](https://example.com) with `code`."
    );

    expect(rich.text).toBe("Title\nBold and link with code.");
    expect(rich.entities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ length: 5, offset: 0, type: "bold" }),
        expect.objectContaining({ length: 4, offset: 6, type: "bold" }),
        expect.objectContaining({
          length: 4,
          offset: 15,
          type: "text_link",
          url: "https://example.com",
        }),
        expect.objectContaining({ length: 4, offset: 25, type: "code" }),
      ])
    );
  });

  it("marks fenced code blocks as pre entities and preserves their text", () => {
    const rich = renderTelegramRichText(
      "```ts\nconst x = 1;\nconsole.log(x)\n```"
    );

    expect(rich.text).toBe("const x = 1;\nconsole.log(x)");
    expect(rich.entities).toEqual([
      expect.objectContaining({
        language: "ts",
        length: rich.text.length,
        offset: 0,
        type: "pre",
      }),
    ]);
  });

  it("maps spoiler, horizontal rules, and task list lines to Telegram-friendly plain text", () => {
    const rich = renderTelegramRichText(
      "||secret||\n---\n- [ ] todo\n- [x] done"
    );

    expect(rich.text).toBe("secret\n──────────\n☐ todo\n☑ done");
    expect(rich.entities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ length: 6, offset: 0, type: "spoiler" }),
      ])
    );
  });

  it("renderForPlatform(telegram) returns plain text compatible with entity-based sendMessage", () => {
    expect(renderForPlatform("**bold**", "telegram")).toBe("bold");
  });
});

describe("splitTelegramRichText", () => {
  it("splits long text while keeping entities on the right chunk", () => {
    const rich = renderTelegramRichText(
      "**Alpha** beta gamma delta epsilon zeta eta theta iota kappa"
    );
    const chunks = splitTelegramRichText(rich, 20);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]?.entities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ length: 5, offset: 0, type: "bold" }),
      ])
    );
    expect(chunks.map((chunk) => chunk.text).join(" ")).toContain(
      "Alpha beta gamma"
    );
  });

  it("does not split in the middle of a UTF-16 surrogate pair", () => {
    const emoji = "\uD83D\uDE00";
    const rich = renderTelegramRichText(`prefix${emoji}`);
    const chunks = splitTelegramRichText(rich, "prefix".length + 1);
    expect(chunks.map((c) => c.text).join("")).toBe(rich.text);
    expect(chunks[0]?.text).toBe("prefix");
    expect(chunks[1]?.text).toBe(emoji);
  });
});
