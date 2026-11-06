import { describe, expect, it } from "vitest";
import { markdownToHtml, markdownToText } from "@/lib/export/document-export";
import { pageMarkdownManager } from "@/lib/pages/markdown";
import { readPageMarkTag } from "@/lib/pages/style";

const MARKED = 'Avant <m font="serif" tone="info">bonjour **gras**</m> après.';

describe("Balise de zone des Pages", () => {
  it("accepte font et tone, et refuse un attribut libre", () => {
    expect(readPageMarkTag('font="serif" tone="info"')).toEqual({
      font: "serif",
      size: null,
      tone: "info",
      underline: false,
    });
    expect(readPageMarkTag('font="comic"')).toEqual({
      font: null,
      size: null,
      tone: null,
      underline: false,
    });
    expect(readPageMarkTag('style="color:red"')).toBeNull();
    expect(readPageMarkTag("")).toEqual({
      font: null,
      size: null,
      tone: null,
      underline: false,
    });
  });

  it("survit à un aller-retour Markdown", () => {
    const manager = pageMarkdownManager();
    const parsed = manager.parse(MARKED);
    const serialized = manager.serialize(parsed);
    const again = manager.parse(serialized);
    expect(JSON.stringify(again)).toBe(JSON.stringify(parsed));
    expect(serialized).toContain('font="serif"');
    expect(serialized).toContain('tone="info"');
    expect(serialized).toContain("**gras**");
  });

  it("rend la zone en HTML et la retire du texte brut", () => {
    const html = markdownToHtml(MARKED);
    expect(html).toContain("font-family:Georgia");
    expect(html).toContain("color:#2F6FED");
    expect(html).toContain("<strong>gras</strong>");
    expect(html).not.toContain("&lt;m");

    expect(markdownToText(MARKED)).toBe("Avant bonjour gras après.");

    const invalid = markdownToHtml('<m style="color:red">secret</m>');
    expect(invalid).toContain("&lt;m style=&quot;color:red&quot;&gt;");
    expect(invalid).not.toContain("<span");
  });
});
