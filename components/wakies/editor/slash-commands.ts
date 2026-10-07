"use client";

import { type Editor, Extension, type Range } from "@tiptap/core";
import Suggestion, {
  exitSuggestion,
  type SuggestionProps,
} from "@tiptap/suggestion";

interface Block {
  description: string;
  run: (editor: Editor, range: Range) => void;
  title: string;
}
const command =
  (action: (editor: Editor) => void) => (editor: Editor, range: Range) => {
    editor.chain().focus().deleteRange(range).run();
    action(editor);
  };
export const blocks: Block[] = [
  {
    description: "Commencer par un paragraphe simple",
    run: command((e) => e.chain().setParagraph().run()),
    title: "Texte",
  },
  ...([1, 2, 3] as const).map((level) => ({
    description:
      level === 1
        ? "Un titre de grande taille"
        : level === 2
          ? "Un titre de taille moyenne"
          : "Un titre de petite taille",
    run: command((e) => e.chain().setHeading({ level }).run()),
    title: `Titre ${level}`,
  })),
  {
    description: "Une liste simple à puces",
    run: command((e) => e.chain().toggleBulletList().run()),
    title: "Liste à puces",
  },
  {
    description: "Une suite ordonnée",
    run: command((e) => e.chain().toggleOrderedList().run()),
    title: "Liste numérotée",
  },
  {
    description: "Suivre les tâches à faire",
    run: command((e) => e.chain().toggleTaskList().run()),
    title: "Liste de tâches",
  },
  {
    description: "Mettre un passage en exergue",
    run: command((e) => e.chain().toggleBlockquote().run()),
    title: "Citation",
  },
  {
    description: "Un bloc de code",
    run: command((e) => e.chain().toggleCodeBlock().run()),
    title: "Code",
  },
  {
    description: "Séparer des sections",
    run: command((e) => e.chain().setHorizontalRule().run()),
    title: "Séparateur",
  },
  {
    description: "Trois colonnes avec un en-tête",
    run: command((e) =>
      e.chain().insertTable({ cols: 3, rows: 3, withHeaderRow: true }).run()
    ),
    title: "Tableau",
  },
];
export const SlashCommands = Extension.create({
  addProseMirrorPlugins() {
    return [
      Suggestion<Block>({
        allowedPrefixes: null,
        char: "/",
        command: ({ editor, range, props }) => props.run(editor, range),
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
            const dom = current?.editor.view.dom;
            dom?.removeAttribute("aria-controls");
            dom?.removeAttribute("aria-activedescendant");
            dom?.removeAttribute("aria-autocomplete");
            document.removeEventListener("pointerdown", outside);
          };
          const outside = (event: PointerEvent) => {
            if (menu && !menu.contains(event.target as Node)) {
              if (current) exitSuggestion(current.editor.view);
              close();
            }
          };
          const paint = () => {
            if (!menu || !current) return;
            const props = current;
            menu.replaceChildren();
            const label = document.createElement("div");
            label.className = "slash-menu-label";
            label.textContent = "INSÉRER UN BLOC";
            menu.append(label);
            if (!props.items.length) {
              const empty = document.createElement("p");
              empty.textContent = "Aucun bloc correspondant";
              menu.append(empty);
            }
            props.items.forEach((item, i) => {
              const button = document.createElement("button");
              button.type = "button";
              button.id = `slash-block-${i}`;
              button.setAttribute("role", "option");
              button.setAttribute("aria-selected", String(i === index));
              button.className = i === index ? "selected" : "";
              const title = document.createElement("strong");
              title.textContent = item.title;
              const description = document.createElement("span");
              description.textContent = item.description;
              button.append(title, description);
              button.addEventListener("mousedown", (event) =>
                event.preventDefault()
              );
              button.addEventListener("click", () => props.command(item));
              menu!.append(button);
            });
            const rect = props.clientRect?.();
            if (rect) {
              menu.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - 332))}px`;
              menu.style.top = `${Math.max(12, Math.min(rect.bottom + 8, window.innerHeight - 360))}px`;
            }
            props.editor.view.dom.setAttribute(
              "aria-activedescendant",
              `slash-block-${index}`
            );
            menu
              .querySelector(".selected")
              ?.scrollIntoView({ block: "nearest" });
          };
          return {
            onExit: close,
            onKeyDown: ({ event, view }) => {
              if (event.isComposing || view.composing || event.keyCode === 229)
                return false;
              if (event.key === "Escape") {
                exitSuggestion(view);
                close();
                return true;
              }
              if (!current?.items.length) return false;
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                index =
                  (index +
                    (event.key === "ArrowDown" ? 1 : -1) +
                    current.items.length) %
                  current.items.length;
                paint();
                return true;
              }
              if (event.key === "Enter") {
                current.command(current.items[index]);
                return true;
              }
              return false;
            },
            onStart: (props) => {
              current = props;
              index = 0;
              menu = document.createElement("div");
              menu.id = "document-block-menu";
              menu.className = "slash-menu";
              menu.setAttribute("role", "listbox");
              menu.setAttribute("aria-label", "Insérer un bloc");
              document.body.append(menu);
              props.editor.view.dom.setAttribute("aria-controls", menu.id);
              props.editor.view.dom.setAttribute("aria-autocomplete", "list");
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
