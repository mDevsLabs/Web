"use client";

import "@/lib/editor/patch-prosemirror";
import {
  BoldIcon as Bold,
  Code2Icon as Code2,
  ItalicIcon as Italic,
  Link2Icon as Link2,
  ListIcon as List,
  ListOrderedIcon as ListOrdered,
  QuoteIcon as Quote,
  Redo2Icon as Redo2,
  Undo2Icon as Undo2,
} from "@mdevs/icons";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { useEffect, useRef } from "react";
import { documentExtensions } from "@/components/wakies/editor/markdown";
import { SlashCommands } from "@/components/wakies/editor/slash-commands";
import { openPageLink } from "@/components/wakies/page-navigation";
export default function RichEditor({
  value,
  onChange,
  onNotice,
}: {
  value: string;
  onChange: (value: string) => void;
  onNotice: (message: string) => void;
}) {
  const change = useRef(onChange);
  change.current = onChange;
  const notice = useRef(onNotice);
  notice.current = onNotice;
  const emitted = useRef(value);
  const editor = useEditor({
    content: value,
    contentType: "markdown",
    editorProps: {
      attributes: {
        "aria-label": "Contenu de la page",
        "aria-multiline": "true",
        class: "document-prose",
        role: "textbox",
      },
      handleClick: (_view, _pos, event) => {
        const target =
          event.target instanceof Element ? event.target.closest("a") : null;
        const href = target?.getAttribute("href");
        if (
          href?.startsWith("/#/spaces/") &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault();
          openPageLink(href);
          return true;
        }
        return false;
      },
      handlePaste: (_view, event) => {
        const html = event.clipboardData?.getData("text/html") ?? "";
        if (/<(img|iframe|script)\b/i.test(html)) {
          event.preventDefault();
          notice.current(
            "Les images et les contenus intégrés ne sont pas pris en charge ici. Utilisez la source Markdown pour conserver leur balisage d’origine."
          );
          return true;
        }
        return false;
      },
    },
    extensions: [
      ...documentExtensions(),
      Markdown,
      Placeholder.configure({
        placeholder: "Start writing, or type / for blocks…",
      }),
      SlashCommands,
    ],
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const markdown = editor.getMarkdown();
      emitted.current = markdown;
      change.current(markdown);
    },
  });
  const state = useEditorState({
    editor,
    selector: ({ editor }) =>
      editor
        ? {
            bold: editor.isActive("bold"),
            bullet: editor.isActive("bulletList"),
            code: editor.isActive("codeBlock"),
            italic: editor.isActive("italic"),
            ordered: editor.isActive("orderedList"),
            quote: editor.isActive("blockquote"),
            redo: editor.can().redo(),
            undo: editor.can().undo(),
          }
        : null,
  });
  useEffect(() => {
    if (editor && value !== emitted.current) {
      emitted.current = value;
      editor.commands.setContent(value, {
        contentType: "markdown",
        emitUpdate: false,
      });
    }
  }, [editor, value]);
  if (!editor)
    return <div className="editor-loading">Chargement de l’éditeur…</div>;
  return (
    <>
      <div
        aria-label="Mise en forme du texte"
        className="format-toolbar"
        role="toolbar"
      >
        <button
          aria-label="Gras"
          aria-pressed={state?.bold}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Gras (⌘/Ctrl B)"
        >
          <Bold size={16} />
        </button>
        <button
          aria-label="Italique"
          aria-pressed={state?.italic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italique (⌘/Ctrl I)"
        >
          <Italic size={16} />
        </button>
        <span className="toolbar-divider" />
        <button
          aria-label="Liste à puces"
          aria-pressed={state?.bullet}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Liste à puces"
        >
          <List size={17} />
        </button>
        <button
          aria-label="Liste numérotée"
          aria-pressed={state?.ordered}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Liste numérotée"
        >
          <ListOrdered size={17} />
        </button>
        <button
          aria-label="Citation"
          aria-pressed={state?.quote}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Citation"
        >
          <Quote size={15} />
        </button>
        <button
          aria-label="Bloc de code"
          aria-pressed={state?.code}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Bloc de code"
        >
          <Code2 size={17} />
        </button>
        <button
          aria-label="Ajouter un lien"
          onClick={() => {
            const url = window.prompt(
              "Link URL (https:// or an internal page link)",
              editor.getAttributes("link").href ?? ""
            );
            if (url === null) return;
            if (!url) {
              editor.chain().focus().unsetLink().run();
              return;
            }
            if (!/^(https?:\/\/|\/#\/spaces\/)/i.test(url)) {
              onNotice("Use a public http(s) URL or an internal page link.");
              return;
            }
            editor
              .chain()
              .focus()
              .extendMarkRange("link")
              .setLink({ href: url })
              .run();
          }}
          title="Ajouter un lien"
        >
          <Link2 size={16} />
        </button>
        <span className="toolbar-divider" />
        <button
          aria-label="Annuler"
          disabled={!state?.undo}
          onClick={() => editor.chain().focus().undo().run()}
          title="Annuler"
        >
          <Undo2 size={16} />
        </button>
        <button
          aria-label="Rétablir"
          disabled={!state?.redo}
          onClick={() => editor.chain().focus().redo().run()}
          title="Rétablir"
        >
          <Redo2 size={16} />
        </button>
      </div>
      <EditorContent editor={editor} />
      <p className="editor-hint">
        Tapez <kbd>/</kbd> pour un bloc · ⌘/Ctrl + S pour enregistrer
      </p>
    </>
  );
}
