"use client";

import "@/lib/editor/patch-prosemirror";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { Markdown, MarkdownManager } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import { SlashCommands } from "@/components/pages/slash-commands";

export function pageEditorExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      link: {
        autolink: false,
        openOnClick: false,
        protocols: ["http", "https"],
      },
    }),
    Image.configure({ allowBase64: false }),
    TableKit.configure({ table: { resizable: false } }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Placeholder.configure({
      placeholder: "Écrivez, ou tapez / pour insérer un bloc…",
    }),
    SlashCommands,
    Markdown,
  ];
}

const manager = new MarkdownManager({
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      link: { autolink: false, openOnClick: false },
    }),
    Image.configure({ allowBase64: false }),
    TableKit.configure({ table: { resizable: false } }),
    TaskList,
    TaskItem.configure({ nested: true }),
  ],
});

/** Le mode visuel ne s'ouvre que si le Markdown survit à un aller-retour. */
export function inspectPageMarkdown(source: string): {
  reason?: string;
  supported: boolean;
} {
  if (
    /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/.test(source) ||
    /^\[\^[^\]]+\]:/m.test(source) ||
    /^\s*(\$\$|:::)/m.test(source) ||
    /<[a-z][\s\S]*?>/i.test(source)
  ) {
    return {
      reason:
        "Ce document contient du Markdown étendu. Le mode source le préserve exactement.",
      supported: false,
    };
  }
  try {
    const parsed = manager.parse(source);
    const restored = manager.parse(manager.serialize(parsed));
    if (JSON.stringify(parsed) !== JSON.stringify(restored)) {
      return {
        reason:
          "Une partie de la mise en forme ne peut pas être convertie sans perte. Le mode source conserve le document intact.",
        supported: false,
      };
    }
    return { supported: true };
  } catch {
    return {
      reason:
        "Ce Markdown nécessite le mode source pour préserver son contenu.",
      supported: false,
    };
  }
}
