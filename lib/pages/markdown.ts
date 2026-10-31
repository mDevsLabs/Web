import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { MarkdownManager } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import { PageStyle } from "@/lib/pages/page-style";
import { PageShape } from "@/lib/pages/shape";

/**
 * Extensions dont le Markdown doit survivre à un aller-retour.
 *
 * Le mode visuel et l'éditeur partagent cette liste. Les extensions
 * d'interface (placeholder, commandes /) n'y figurent pas : elles ne
 * sérialisent rien.
 */
export function pageMarkdownExtensions() {
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
    PageStyle,
    PageShape,
  ];
}

let manager: MarkdownManager | null = null;

export function pageMarkdownManager(): MarkdownManager {
  manager ??= new MarkdownManager({
    extensions: pageMarkdownExtensions(),
  });
  return manager;
}
