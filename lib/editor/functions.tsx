"use client";

import { defaultMarkdownSerializer } from "prosemirror-markdown";
import { DOMParser, type Node } from "prosemirror-model";
import { Decoration, DecorationSet, type EditorView } from "prosemirror-view";
import { renderToString } from "react-dom/server";
import DOMPurify from "dompurify";

import { MessageResponse } from "@/components/ai-elements/message";

import { documentSchema } from "./config";
import type { UISuggestion } from "./suggestions";

export const buildDocumentFromContent = (content: string) => {
  const parser = DOMParser.fromSchema(documentSchema);
  const stringFromMarkdown = renderToString(
    <MessageResponse>{content}</MessageResponse>
  );
  // Purifie le HTML issu du markdown LLM avant parsing ProseMirror
  const clean = DOMPurify.sanitize(stringFromMarkdown, {
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus"],
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form"],
  });
  const tempContainer = document.createElement("div");
  tempContainer.innerHTML = clean;
  return parser.parse(tempContainer);
};

export const buildContentFromDocument = (document: Node) =>
  defaultMarkdownSerializer.serialize(document);

export const createDecorations = (
  suggestions: UISuggestion[],
  _view: EditorView
) => {
  const decorations: Decoration[] = [];

  for (const suggestion of suggestions) {
    decorations.push(
      Decoration.inline(
        suggestion.selectionStart,
        suggestion.selectionEnd,
        {
          class: "suggestion-highlight",
          "data-suggestion-id": suggestion.id,
        },
        {
          suggestionId: suggestion.id,
          type: "highlight",
        }
      )
    );
  }

  return DecorationSet.create(_view.state.doc, decorations);
};
