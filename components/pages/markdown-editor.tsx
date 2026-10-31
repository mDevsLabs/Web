"use client";

import {
  BoldIcon,
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ImageIcon,
  ItalicIcon,
  Link2Icon,
  ListChecksIcon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  QuoteIcon,
  Redo2Icon,
  StrikethroughIcon,
  TableIcon,
  Undo2Icon,
} from "@mdevs/icons";
import {
  type Editor,
  EditorContent,
  useEditor,
  useEditorState,
} from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  inspectPageMarkdown,
  pageEditorExtensions,
} from "@/components/pages/extensions";
import { promptInApp } from "@/lib/ui/app-dialog";
import { cn } from "@/lib/utils";

type MarkdownEditorProps = {
  onChange: (markdown: string) => void;
  onSelection: (text: string) => void;
  readOnly: boolean;
  value: string;
};

function readMarkdown(editor: Editor): string {
  return editor.getMarkdown();
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function findInDoc(editor: Editor, query: string, from: number) {
  const needle = query.toLowerCase();
  let match: { from: number; to: number } | null = null;
  const scan = (startAt: number) => {
    editor.state.doc.descendants((node, pos) => {
      if (match || !node.isText || !node.text) {
        return;
      }
      let index = node.text.toLowerCase().indexOf(needle);
      while (index !== -1) {
        const absolute = pos + index;
        if (absolute >= startAt) {
          match = { from: absolute, to: absolute + needle.length };
          return false;
        }
        index = node.text.toLowerCase().indexOf(needle, index + 1);
      }
    });
  };
  scan(from);
  if (!match) {
    scan(0);
  }
  return match;
}

export function MarkdownEditor({
  onChange,
  onSelection,
  readOnly,
  value,
}: MarkdownEditorProps) {
  const emitted = useRef(value);
  const onChangeRef = useRef(onChange);
  const onSelectionRef = useRef(onSelection);
  onChangeRef.current = onChange;
  onSelectionRef.current = onSelection;
  const [mode, setMode] = useState<"source" | "visual">(() =>
    inspectPageMarkdown(value).supported ? "visual" : "source"
  );
  const [findQuery, setFindQuery] = useState("");
  const [replaceWith, setReplaceWith] = useState("");
  const sourceRef = useRef<HTMLTextAreaElement>(null);

  const editor = useEditor({
    content: value,
    contentType: "markdown",
    editable: !readOnly,
    editorProps: {
      attributes: {
        "aria-label": "Contenu de la page",
        "aria-multiline": "true",
        class:
          "prose prose-sm dark:prose-invert max-w-none min-h-[50vh] px-1 focus:outline-none",
        role: "textbox",
      },
    },
    extensions: pageEditorExtensions(),
    immediatelyRender: false,
    onSelectionUpdate: ({ editor: current }) => {
      const { from, to } = current.state.selection;
      onSelectionRef.current(
        from === to ? "" : current.state.doc.textBetween(from, to, "\n")
      );
    },
    onUpdate: ({ editor: current }) => {
      const markdown = readMarkdown(current);
      emitted.current = markdown;
      onChangeRef.current(markdown);
    },
  });

  const state = useEditorState({
    editor,
    selector: ({ editor: current }) =>
      current
        ? {
            bold: current.isActive("bold"),
            bullet: current.isActive("bulletList"),
            code: current.isActive("code"),
            codeBlock: current.isActive("codeBlock"),
            h1: current.isActive("heading", { level: 1 }),
            h2: current.isActive("heading", { level: 2 }),
            h3: current.isActive("heading", { level: 3 }),
            italic: current.isActive("italic"),
            ordered: current.isActive("orderedList"),
            quote: current.isActive("blockquote"),
            redo: current.can().redo(),
            strike: current.isActive("strike"),
            task: current.isActive("taskList"),
            undo: current.can().undo(),
          }
        : null,
  });

  useEffect(() => {
    editor?.setEditable(!readOnly);
  }, [editor, readOnly]);

  useEffect(() => {
    if (!editor || mode !== "visual" || value === emitted.current) {
      return;
    }
    emitted.current = value;
    editor.commands.setContent(value, {
      contentType: "markdown",
      emitUpdate: false,
    });
  }, [editor, mode, value]);

  function publishSelectionFromSource() {
    const field = sourceRef.current;
    if (!field) {
      onSelection("");
      return;
    }
    onSelection(value.slice(field.selectionStart, field.selectionEnd));
  }

  function switchMode(next: "source" | "visual") {
    if (next === mode) {
      return;
    }
    if (next === "source") {
      if (editor && mode === "visual") {
        const markdown = readMarkdown(editor);
        emitted.current = markdown;
        onChange(markdown);
      }
      setMode("source");
      return;
    }
    const check = inspectPageMarkdown(value);
    if (!check.supported) {
      toast.message(
        check.reason ??
          "Le mode source reste ouvert pour ne rien perdre de ce Markdown."
      );
      return;
    }
    setMode("visual");
  }

  function findNext() {
    if (!findQuery) {
      return;
    }
    if (mode === "source") {
      const field = sourceRef.current;
      if (!field) {
        return;
      }
      const start = field.selectionEnd;
      const hay = value.toLowerCase();
      const needle = findQuery.toLowerCase();
      const index = hay.indexOf(needle, start);
      const found = index === -1 ? hay.indexOf(needle) : index;
      if (found === -1) {
        return;
      }
      field.focus();
      field.setSelectionRange(found, found + findQuery.length);
      publishSelectionFromSource();
      return;
    }
    if (!editor) {
      return;
    }
    const match = findInDoc(editor, findQuery, editor.state.selection.to);
    if (!match) {
      return;
    }
    editor.chain().focus().setTextSelection(match).scrollIntoView().run();
  }

  function replaceCurrent() {
    if (!findQuery || readOnly) {
      return;
    }
    if (mode === "source") {
      const field = sourceRef.current;
      if (!field) {
        return;
      }
      const selected = value.slice(field.selectionStart, field.selectionEnd);
      if (selected.toLowerCase() !== findQuery.toLowerCase()) {
        findNext();
        return;
      }
      const next =
        value.slice(0, field.selectionStart) +
        replaceWith +
        value.slice(field.selectionEnd);
      onChange(next);
      return;
    }
    if (!editor) {
      return;
    }
    const selected = editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to,
      "\n"
    );
    if (selected.toLowerCase() !== findQuery.toLowerCase()) {
      findNext();
      return;
    }
    editor.chain().focus().insertContent(replaceWith).run();
  }

  const toolClass = (active?: boolean) =>
    cn(
      "inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40",
      active && "bg-muted text-foreground"
    );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-1 border-b border-border/60 px-2 py-1.5">
        <div
          aria-label="Mise en forme"
          className="flex items-center gap-0.5"
          role="toolbar"
        >
          <button
            className={toolClass(mode === "visual")}
            disabled={readOnly}
            onClick={() => switchMode("visual")}
            type="button"
          >
            Visuel
          </button>
          <button
            className={toolClass(mode === "source")}
            onClick={() => switchMode("source")}
            type="button"
          >
            Source
          </button>
        </div>
        {mode === "visual" && editor && !readOnly ? (
          <>
            <span className="mx-1 h-4 w-px bg-border" />
            <button
              aria-label="Titre 1"
              aria-pressed={state?.h1}
              className={toolClass(state?.h1)}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              type="button"
            >
              <Heading1Icon className="size-4" />
            </button>
            <button
              aria-label="Titre 2"
              aria-pressed={state?.h2}
              className={toolClass(state?.h2)}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              type="button"
            >
              <Heading2Icon className="size-4" />
            </button>
            <button
              aria-label="Titre 3"
              aria-pressed={state?.h3}
              className={toolClass(state?.h3)}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              type="button"
            >
              <Heading3Icon className="size-4" />
            </button>
            <button
              aria-label="Gras"
              aria-pressed={state?.bold}
              className={toolClass(state?.bold)}
              onClick={() => editor.chain().focus().toggleBold().run()}
              type="button"
            >
              <BoldIcon className="size-4" />
            </button>
            <button
              aria-label="Italique"
              aria-pressed={state?.italic}
              className={toolClass(state?.italic)}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              type="button"
            >
              <ItalicIcon className="size-4" />
            </button>
            <button
              aria-label="Barré"
              aria-pressed={state?.strike}
              className={toolClass(state?.strike)}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              type="button"
            >
              <StrikethroughIcon className="size-4" />
            </button>
            <button
              aria-label="Code"
              aria-pressed={state?.code}
              className={toolClass(state?.code)}
              onClick={() => editor.chain().focus().toggleCode().run()}
              type="button"
            >
              <CodeIcon className="size-4" />
            </button>
            <button
              aria-label="Liste à puces"
              aria-pressed={state?.bullet}
              className={toolClass(state?.bullet)}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              type="button"
            >
              <ListIcon className="size-4" />
            </button>
            <button
              aria-label="Liste numérotée"
              aria-pressed={state?.ordered}
              className={toolClass(state?.ordered)}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              type="button"
            >
              <ListOrderedIcon className="size-4" />
            </button>
            <button
              aria-label="Liste de tâches"
              aria-pressed={state?.task}
              className={toolClass(state?.task)}
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              type="button"
            >
              <ListChecksIcon className="size-4" />
            </button>
            <button
              aria-label="Citation"
              aria-pressed={state?.quote}
              className={toolClass(state?.quote)}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              type="button"
            >
              <QuoteIcon className="size-4" />
            </button>
            <button
              aria-label="Séparateur"
              className={toolClass()}
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              type="button"
            >
              <MinusIcon className="size-4" />
            </button>
            <button
              aria-label="Bloc de code"
              aria-pressed={state?.codeBlock}
              className={toolClass(state?.codeBlock)}
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              type="button"
            >
              <CodeIcon className="size-4" />
            </button>
            <button
              aria-label="Lien"
              className={toolClass()}
              onClick={async () => {
                const url = await promptInApp(
                  "Adresse du lien (https://…)",
                  editor.getAttributes("link").href ?? ""
                );
                if (url === null) return;
                if (!url) {
                  editor.chain().focus().unsetLink().run();
                  return;
                }
                if (!isHttpUrl(url)) {
                  toast.message("Indiquez une adresse http ou https.");
                  return;
                }
                editor
                  .chain()
                  .focus()
                  .extendMarkRange("link")
                  .setLink({ href: url })
                  .run();
              }}
              type="button"
            >
              <Link2Icon className="size-4" />
            </button>
            <button
              aria-label="Image par URL"
              className={toolClass()}
              onClick={async () => {
                const url = await promptInApp("Adresse de l'image (https://…)");
                if (!url) return;
                if (!isHttpUrl(url)) {
                  toast.message("Indiquez une adresse http ou https.");
                  return;
                }
                editor.chain().focus().setImage({ src: url }).run();
              }}
              type="button"
            >
              <ImageIcon className="size-4" />
            </button>
            <button
              aria-label="Tableau"
              className={toolClass()}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .insertTable({ cols: 3, rows: 3, withHeaderRow: true })
                  .run()
              }
              type="button"
            >
              <TableIcon className="size-4" />
            </button>
            <button
              aria-label="Annuler"
              className={toolClass()}
              disabled={!state?.undo}
              onClick={() => editor.chain().focus().undo().run()}
              type="button"
            >
              <Undo2Icon className="size-4" />
            </button>
            <button
              aria-label="Rétablir"
              className={toolClass()}
              disabled={!state?.redo}
              onClick={() => editor.chain().focus().redo().run()}
              type="button"
            >
              <Redo2Icon className="size-4" />
            </button>
          </>
        ) : null}
        <div className="ml-auto flex items-center gap-1">
          <input
            aria-label="Rechercher dans la page"
            className="field-input h-8 w-28 px-2 text-xs"
            onChange={(event) => setFindQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                findNext();
              }
            }}
            placeholder="Rechercher"
            value={findQuery}
          />
          <input
            aria-label="Remplacer par"
            className="field-input h-8 w-28 px-2 text-xs"
            disabled={readOnly}
            onChange={(event) => setReplaceWith(event.target.value)}
            placeholder="Remplacer"
            value={replaceWith}
          />
          <button className="chip" onClick={findNext} type="button">
            Suivant
          </button>
          <button
            className="chip"
            disabled={readOnly}
            onClick={replaceCurrent}
            type="button"
          >
            Remplacer
          </button>
        </div>
      </div>
      {mode === "visual" ? (
        editor ? (
          <EditorContent
            className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-8 [&_.ProseMirror]:min-h-[50vh] [&_.ProseMirror]:outline-none [&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:pl-0"
            editor={editor}
          />
        ) : (
          <p className="p-6 text-sm text-muted-foreground">
            Chargement de l'éditeur…
          </p>
        )
      ) : (
        <textarea
          aria-label="Source Markdown"
          className="min-h-0 flex-1 resize-none bg-transparent px-4 py-4 font-mono text-sm outline-none sm:px-8"
          onChange={(event) => onChange(event.target.value)}
          onSelect={publishSelectionFromSource}
          readOnly={readOnly}
          ref={sourceRef}
          spellCheck
          value={value}
        />
      )}
    </div>
  );
}
