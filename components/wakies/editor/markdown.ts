"use client";

import "@/lib/editor/patch-prosemirror";
import { TableKit } from "@tiptap/extension-table";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { MarkdownManager } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
export const documentExtensions = () => [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    link: { autolink: false, openOnClick: false },
    underline: false,
  }),
  TableKit.configure({ table: { resizable: false } }),
  TaskList,
  TaskItem.configure({ nested: true }),
];
export const markdownManager = new MarkdownManager({
  extensions: documentExtensions(),
});
const allowed = new Set([
  "space",
  "code",
  "heading",
  "table",
  "hr",
  "blockquote",
  "list",
  "list_item",
  "paragraph",
  "text",
  "escape",
  "strong",
  "em",
  "codespan",
  "br",
  "del",
  "link",
  "taskList",
  "taskItem",
]);
export function inspectMarkdown(source: string): {
  supported: boolean;
  reason?: string;
} {
  try {
    if (
      /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/.test(source) ||
      /^\[\^[^\]]+\]:/m.test(source) ||
      /^\s*(\$\$|:::)/m.test(source)
    )
      return {
        reason:
          "Ce document contient du Markdown étendu. Le mode source le préserve exactement.",
        supported: false,
      };
    const tokens = markdownManager.instance.lexer(source);
    let unsupported = false;
    const pending: unknown[] = [tokens];
    while (pending.length) {
      const value = pending.pop();
      if (!value || typeof value !== "object") continue;
      if (
        "type" in value &&
        typeof value.type === "string" &&
        (!allowed.has(value.type) ||
          (value.type === "heading" &&
            "depth" in value &&
            typeof value.depth === "number" &&
            value.depth > 3))
      )
        unsupported = true;
      pending.push(...Object.values(value));
    }
    if (unsupported)
      return {
        reason:
          "Ce document contient des images, du HTML ou une mise en forme qui nécessite le mode source Markdown. Rien n’a été modifié.",
        supported: false,
      };
    const parsed = markdownManager.parse(source);
    const restored = markdownManager.parse(markdownManager.serialize(parsed));
    if (JSON.stringify(parsed) !== JSON.stringify(restored))
      return {
        reason:
          "Une partie de la mise en forme ne peut pas être convertie sans perte. Le mode source conserve le document intact.",
        supported: false,
      };
    return { supported: true };
  } catch {
    return {
      reason:
        "Ce Markdown nécessite le mode source pour préserver son contenu.",
      supported: false,
    };
  }
}
