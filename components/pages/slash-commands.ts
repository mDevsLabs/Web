"use client";

import { type Editor, Extension, type Range } from "@tiptap/core";
import Suggestion, {
  exitSuggestion,
  type SuggestionProps,
} from "@tiptap/suggestion";

type Block = {
  description: string;
  run: (editor: Editor, range: Range) => void;
  title: string;
};

const command =
  (action: (editor: Editor) => void) => (editor: Editor, range: Range) => {
    editor.chain().focus().deleteRange(range).run();
    action(editor);
  };

const blocks: Block[] = [
  {
    description: "Un paragraphe simple",
    run: command((editor) => editor.chain().setParagraph().run()),
    title: "Texte",
  },
  ...([1, 2, 3] as const).map((level) => ({
    description: `Titre de niveau ${level}`,
    run: command((editor) => editor.chain().setHeading({ level }).run()),
    title: `Titre ${level}`,
  })),
  {
    description: "Une liste à puces",
    run: command((editor) => editor.chain().toggleBulletList().run()),
    title: "Liste à puces",
  },
  {
    description: "Une liste numérotée",
    run: command((editor) => editor.chain().toggleOrderedList().run()),
    title: "Liste numérotée",
  },
  {
    description: "Des cases à cocher",
    run: command((editor) => editor.chain().toggleTaskList().run()),
    title: "Liste de tâches",
  },
  {
    description: "Un passage en exergue",
    run: command((editor) => editor.chain().toggleBlockquote().run()),
    title: "Citation",
  },
  {
    description: "Un bloc de code",
    run: command((editor) => editor.chain().toggleCodeBlock().run()),
    title: "Code",
  },
  {
    description: "Une ligne de séparation",
    run: command((editor) => editor.chain().setHorizontalRule().run()),
    title: "Séparateur",
  },
  {
    description: "Trois colonnes, avec en-tête",
    run: command((editor) =>
      editor
        .chain()
        .insertTable({ cols: 3, rows: 3, withHeaderRow: true })
        .run()
    ),
    title: "Tableau",
  },
];

const menuClass =
  "fixed z-50 max-h-80 w-72 overflow-y-auto rounded-xl border border-border bg-popover p-1 text-sm shadow-lg";
const itemClass =
  "flex w-full flex-col items-start rounded-lg px-2 py-1.5 text-left hover:bg-muted";

export const SlashCommands = Extension.create({
  addProseMirrorPlugins() {
    return [
      Suggestion<Block>({
        allowedPrefixes: null,
        char: "/",
        command: ({ editor, props, range }) => props.run(editor, range),
        editor: this.editor,
        items: ({ query }) =>
          blocks.filter((block) =>
            `${block.title} ${block.description}`
              .toLowerCase()
              .includes(query.toLowerCase())
          ),
        render: () => {
          let menu: HTMLDivElement | undefined;
          let current: SuggestionProps<Block> | undefined;
          let index = 0;
          const close = () => {
            menu?.remove();
            menu = undefined;
            document.removeEventListener("pointerdown", outside);
          };
          const outside = (event: PointerEvent) => {
            if (menu && !menu.contains(event.target as Node)) {
              if (current) {
                exitSuggestion(current.editor.view);
              }
              close();
            }
          };
          const paint = () => {
            if (!menu || !current) {
              return;
            }
            menu.replaceChildren();
            const label = document.createElement("div");
            label.className =
              "px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground";
            label.textContent = "Insérer un bloc";
            menu.append(label);
            current.items.forEach((item, itemIndex) => {
              const button = document.createElement("button");
              button.type = "button";
              button.className =
                itemIndex === index ? `${itemClass} bg-muted` : itemClass;
              const title = document.createElement("strong");
              title.textContent = item.title;
              const description = document.createElement("span");
              description.className = "text-xs text-muted-foreground";
              description.textContent = item.description;
              button.append(title, description);
              button.addEventListener("mousedown", (event) => {
                event.preventDefault();
              });
              button.addEventListener("click", () => current?.command(item));
              menu?.append(button);
            });
            const rect = current.clientRect?.();
            if (rect) {
              menu.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - 300))}px`;
              menu.style.top = `${Math.max(12, rect.bottom + 8)}px`;
            }
          };
          return {
            onExit: close,
            onKeyDown: ({ event, view }) => {
              if (!current?.items.length) {
                return false;
              }
              if (event.key === "Escape") {
                exitSuggestion(view);
                close();
                return true;
              }
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                const delta = event.key === "ArrowDown" ? 1 : -1;
                index =
                  (index + delta + current.items.length) % current.items.length;
                paint();
                return true;
              }
              if (event.key === "Enter") {
                const item = current.items[index];
                if (item) {
                  current.command(item);
                }
                return true;
              }
              return false;
            },
            onStart: (props) => {
              current = props;
              index = 0;
              menu = document.createElement("div");
              menu.className = menuClass;
              menu.setAttribute("role", "listbox");
              menu.setAttribute("aria-label", "Insérer un bloc");
              document.body.append(menu);
              document.addEventListener("pointerdown", outside);
              paint();
            },
            onUpdate: (props) => {
              current = props;
              index = 0;
              paint();
            },
          };
        },
        startOfLine: true,
      }),
    ];
  },
  name: "slashCommands",
});
