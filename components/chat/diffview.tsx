"use client";

import { Columns2Icon, Rows2Icon } from "lucide-react";
import OrderedMap from "orderedmap";
import {
  DOMParser,
  Fragment,
  type MarkSpec,
  type Node as ProsemirrorNode,
  Schema,
} from "prosemirror-model";
import { schema } from "prosemirror-schema-basic";
import { addListNodes } from "prosemirror-schema-list";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { useEffect, useRef, useState } from "react";
import { renderToString } from "react-dom/server";

import { MessageResponse } from "@/components/ai-elements/message";
import { DiffType, diffEditor } from "@/lib/editor/diff";
import { cn } from "@/lib/utils";

const diffSchema = new Schema({
  marks: OrderedMap.from({
    ...schema.spec.marks.toObject(),
    diffMark: {
      attrs: { type: { default: "" } },
      toDOM(mark) {
        let className = "";

        switch (mark.attrs.type) {
          case DiffType.Inserted:
            className =
              "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 rounded-sm px-0.5 -mx-0.5";
            break;
          case DiffType.Deleted:
            className =
              "bg-red-500/15 line-through text-red-600 dark:text-red-400 rounded-sm px-0.5 -mx-0.5 opacity-70";
            break;
          default:
            className = "";
        }
        return ["span", { class: className }, 0];
      },
    } as MarkSpec,
  }),
  nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
});

function computeDiff(oldDoc: ProsemirrorNode, newDoc: ProsemirrorNode) {
  return diffEditor(diffSchema, oldDoc.toJSON(), newDoc.toJSON());
}

// Détermine si un bloc contient des marques de diff insertion/suppression
function collectDiffPresence(node: ProsemirrorNode) {
  let hasDeleted = false;
  let hasInserted = false;
  const checkNode = (n: ProsemirrorNode) => {
    for (const mark of n.marks) {
      if (mark.type.name === "diffMark") {
        if (mark.attrs.type === DiffType.Inserted) {
          hasInserted = true;
        } else if (mark.attrs.type === DiffType.Deleted) {
          hasDeleted = true;
        }
      }
    }
    n.descendants((child) => checkNode(child));
  };
  checkNode(node);
  return { hasDeleted, hasInserted };
}

type DiffEditorProps = {
  oldContent: string;
  newContent: string;
};

type ViewMode = "inline" | "split";

export const DiffView = ({ oldContent, newContent }: DiffEditorProps) => {
  const [mode, setMode] = useState<ViewMode>("split");
  const inlineRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const viewsRef = useRef<EditorView[]>([]);

  useEffect(() => {
    const parser = DOMParser.fromSchema(diffSchema);

    const oldHtmlContent = renderToString(
      <MessageResponse>{oldContent}</MessageResponse>
    );
    const newHtmlContent = renderToString(
      <MessageResponse>{newContent}</MessageResponse>
    );

    const oldContainer = document.createElement("div");
    oldContainer.innerHTML = oldHtmlContent;
    const newContainer = document.createElement("div");
    newContainer.innerHTML = newHtmlContent;

    const oldDoc = parser.parse(oldContainer);
    const newDoc = parser.parse(newContainer);

    const diffedDoc = computeDiff(oldDoc, newDoc);

    const createView = (
      container: HTMLElement | null,
      doc: ProsemirrorNode
    ) => {
      if (!container) {
        return null;
      }
      const state = EditorState.create({ doc, plugins: [] });
      const view = new EditorView(container, {
        editable: () => false,
        state,
      });
      viewsRef.current.push(view);
      return view;
    };

    viewsRef.current = [];

    if (mode === "inline") {
      createView(inlineRef.current, diffedDoc);
      // Défilement vers le premier changement
      requestAnimationFrame(() => {
        const firstDiff = inlineRef.current?.querySelector(
          "[class*='bg-emerald'], [class*='bg-red']"
        );
        if (firstDiff) {
          firstDiff.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    } else {
      // Vue côte à côte : répartition des blocs du doc fusionné selon leurs marques
      const leftChildren: ProsemirrorNode[] = [];
      const rightChildren: ProsemirrorNode[] = [];
      diffedDoc.forEach((child: ProsemirrorNode) => {
        const { hasDeleted, hasInserted } = collectDiffPresence(child);
        if (hasDeleted && !hasInserted) {
          leftChildren.push(child);
        } else if (hasInserted && !hasDeleted) {
          rightChildren.push(child);
        } else {
          // Bloc inchangé ou mixte : affiché des deux côtés
          leftChildren.push(child);
          rightChildren.push(child);
        }
      });
      const buildDoc = (children: ProsemirrorNode[]) =>
        diffSchema.nodes.doc.create(
          null,
          children.length > 0
            ? Fragment.fromArray(children)
            : Fragment.fromArray([diffSchema.nodes.paragraph.create()])
        );
      createView(leftRef.current, buildDoc(leftChildren));
      createView(rightRef.current, buildDoc(rightChildren));
      requestAnimationFrame(() => {
        const firstDiff = leftRef.current?.querySelector(
          "[class*='bg-emerald'], [class*='bg-red']"
        );
        if (firstDiff) {
          firstDiff.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    }

    return () => {
      for (const view of viewsRef.current) {
        view.destroy();
      }
      viewsRef.current = [];
    };
  }, [oldContent, newContent, mode]);

  return (
    <div className="w-full">
      {/* Bascule de vue */}
      <div className="mb-3 flex items-center justify-end">
        <div className="flex items-center rounded-md border border-border/50 bg-muted/40 p-0.5 text-xs">
          <button
            className={cn(
              "flex items-center gap-1 rounded-sm px-2 py-1 font-medium transition-colors",
              mode === "split"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setMode("split")}
            title="Vue côte à côte"
            type="button"
          >
            <Columns2Icon className="size-3.5" />
            <span>Côte à côte</span>
          </button>
          <button
            className={cn(
              "flex items-center gap-1 rounded-sm px-2 py-1 font-medium transition-colors",
              mode === "inline"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setMode("inline")}
            title="Vue fusionnée"
            type="button"
          >
            <Rows2Icon className="size-3.5" />
            <span>Fusionnée</span>
          </button>
        </div>
      </div>

      {mode === "inline" ? (
        <div
          className="diff-editor prose dark:prose-invert prose-neutral relative max-w-none"
          ref={inlineRef}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="overflow-hidden rounded-lg border border-red-500/20 bg-background">
            <div className="border-b border-border/40 bg-red-500/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
              Ancienne version
            </div>
            <div
              className="diff-editor prose dark:prose-invert prose-neutral relative max-w-none p-3"
              ref={leftRef}
            />
          </div>
          <div className="overflow-hidden rounded-lg border border-emerald-500/20 bg-background">
            <div className="border-b border-border/40 bg-emerald-500/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Nouvelle version
            </div>
            <div
              className="diff-editor prose dark:prose-invert prose-neutral relative max-w-none p-3"
              ref={rightRef}
            />
          </div>
        </div>
      )}
    </div>
  );
};
