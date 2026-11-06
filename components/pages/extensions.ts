"use client";

import "@/lib/editor/patch-prosemirror";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "@tiptap/markdown";
import { SlashCommands } from "@/components/pages/slash-commands";
import {
  pageMarkdownExtensions,
  pageMarkdownManager,
} from "@/lib/pages/markdown";
import {
  concealValidPageMarks,
  concealValidPageShapes,
} from "@/lib/pages/style";

export function pageEditorExtensions() {
  return [
    ...pageMarkdownExtensions(),
    Placeholder.configure({
      placeholder: "Écrivez, ou tapez / pour insérer un bloc…",
    }),
    SlashCommands,
    Markdown,
  ];
}

/** Le mode visuel ne s'ouvre que si le Markdown survit à un aller-retour. */
export function inspectPageMarkdown(source: string): {
  reason?: string;
  supported: boolean;
} {
  // Les `<m>` valides ne sont pas du HTML libre : on les retire avant le
  // refus, le texte intérieur reste inspecté (une autre balise dedans
  // bascule encore en mode source).
  const inspected = concealValidPageShapes(concealValidPageMarks(source));
  if (
    /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/.test(inspected) ||
    /^\[\^[^\]]+\]:/m.test(inspected) ||
    /^\s*(\$\$|:::)/m.test(inspected) ||
    /<[a-z][\s\S]*?>/i.test(inspected)
  ) {
    return {
      reason:
        "Ce document contient du Markdown étendu. Le mode source le préserve exactement.",
      supported: false,
    };
  }
  try {
    const manager = pageMarkdownManager();
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
