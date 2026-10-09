/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — COMPOSEUR DE MESSAGE RICHE
 * (src/components/messages/MessageRichInput.tsx)
 * contentEditable compact pour les DM : conversion « live » du Markdown inline
 * (gras/italique comme l'éditeur de posts), Entrée = envoyer, Maj+Entrée =
 * retour ligne, collage en texte brut, cap de caractères (texte brut).
 * ============================================================================
 */

import type React from "react";

import { useCallback, useEffect, useImperativeHandle, useRef } from "react";
import { prepareEditorHtml } from "@/components/vibe/common/richSanitizer";
import {
  escapeAttr,
  escapeHtml,
  tryApplyInlineMarkdown,
} from "@/components/vibe/common/richTextUtils";

export interface MessageRichInputHandle {
  clear: () => void;
  execCommand: (cmd: "bold" | "italic" | "underline" | "strikeThrough") => void;
  focus: () => void;
  getHTML: () => string;
  getText: () => string;
  insertLink: (url: string) => void;
  insertText: (text: string) => void;
  isEmpty: () => boolean;
  setHTML: (html: string) => void;
}

interface MessageRichInputProps {
  className?: string;
  disabled?: boolean;
  /** Cap en caractères de texte brut (défaut 3000). */
  maxChars?: number;
  onChange?: (html: string, text: string) => void;
  /** Entrée (sans Maj, hors IME) : déclenche l'envoi. */
  onEnterSend?: () => void;
  /** Frappe/collage réels de l'utilisateur (pas les setHTML programmatiques). */
  onUserInput?: () => void;
  placeholder?: string;
}

/**
 * React 19 : `ref` est une prop comme une autre, `forwardRef` est déprécié.
 * Les appelants passent toujours une `ref` impérative : leur code ne change pas.
 */
export function MessageRichInput({
  placeholder = "Écrivez un message…",
  disabled = false,
  maxChars = 3000,
  className = "",
  onChange,
  onUserInput,
  onEnterSend,
  ref,
}: MessageRichInputProps & { ref?: React.Ref<MessageRichInputHandle> }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);

  const syncEmptyState = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const empty =
      (el.textContent || "").trim().length === 0 &&
      !el.querySelector("img,a,li,br:not(:only-child)");
    el.dataset.empty = String(empty);
  }, []);

  const emitChange = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    syncEmptyState();
    onChange?.(el.innerHTML, el.textContent || "");
  }, [onChange, syncEmptyState]);

  const restoreSelection = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    const range = savedRangeRef.current;
    if (sel && range && el.contains(range.startContainer)) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      clear: () => {
        const el = editorRef.current;
        if (!el) return;
        el.innerHTML = "";
        savedRangeRef.current = null;
        emitChange();
      },
      execCommand: (cmd) => {
        const el = editorRef.current;
        if (!el) return;
        restoreSelection();
        document.execCommand(cmd, false);
        emitChange();
      },
      focus: () => editorRef.current?.focus(),
      getHTML: () => editorRef.current?.innerHTML || "",
      getText: () => editorRef.current?.textContent || "",
      insertLink: (url: string) => {
        const el = editorRef.current;
        if (!el) return;
        restoreSelection();
        const sel = window.getSelection();
        const selected = sel && !sel.isCollapsed ? sel.toString() : "";
        document.execCommand(
          "insertHTML",
          false,
          `<a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(selected || url)}</a>&nbsp;`
        );
        emitChange();
      },
      insertText: (text: string) => {
        const el = editorRef.current;
        if (!el) return;
        restoreSelection();
        document.execCommand("insertText", false, text);
        emitChange();
      },
      isEmpty: () => {
        const el = editorRef.current;
        return !el || (el.textContent || "").trim().length === 0;
      },
      setHTML: (html: string) => {
        const el = editorRef.current;
        if (!el) return;
        el.innerHTML = prepareEditorHtml(html);
        emitChange();
      },
    }),
    [emitChange, restoreSelection]
  );

  // Mémorise la dernière sélection interne (survit aux clics sur la barre
  // d'outils et aux prompt() du bouton lien).
  useEffect(() => {
    const onSelectionChange = () => {
      const sel = window.getSelection();
      const el = editorRef.current;
      if (
        sel &&
        sel.rangeCount > 0 &&
        el &&
        sel.anchorNode &&
        el.contains(sel.anchorNode)
      ) {
        savedRangeRef.current = sel.getRangeAt(0).cloneRange();
      }
    };
    document.addEventListener("selectionchange", onSelectionChange);
    return () =>
      document.removeEventListener("selectionchange", onSelectionChange);
  }, []);

  // Cap dur à la frappe : refuse les insertions au-delà de maxChars.
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const onBeforeInput = (e: InputEvent) => {
      if (e.inputType?.startsWith("insert") && e.data) {
        if ((el.textContent || "").length >= maxChars) e.preventDefault();
      }
    };
    el.addEventListener("beforeinput", onBeforeInput);
    return () => el.removeEventListener("beforeinput", onBeforeInput);
  }, [maxChars]);

  // État vide initial (placeholder)
  useEffect(() => {
    syncEmptyState();
  }, [syncEmptyState]);

  const handleInput = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    syncEmptyState();
    tryApplyInlineMarkdown(el);
    onChange?.(el.innerHTML, el.textContent || "");
    onUserInput?.();
  }, [onChange, onUserInput, syncEmptyState]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== "Enter") return;
      const native = e.nativeEvent as KeyboardEvent;
      if (native.isComposing) return;
      if (e.shiftKey) {
        e.preventDefault();
        document.execCommand("insertLineBreak");
        emitChange();
      } else {
        e.preventDefault();
        onEnterSend?.();
      }
    },
    [emitChange, onEnterSend]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault();
      const el = editorRef.current;
      if (!el) return;
      const text = e.clipboardData?.getData("text/plain") || "";
      if (!text) return;
      const remaining = Math.max(0, maxChars - (el.textContent || "").length);
      const clipped = text.slice(0, remaining);
      if (!clipped) return;
      restoreSelection();
      document.execCommand(
        "insertHTML",
        false,
        escapeHtml(clipped).replace(/\n/g, "<br>")
      );
      emitChange();
      onUserInput?.();
    },
    [emitChange, maxChars, onUserInput, restoreSelection]
  );
  return (
    // biome-ignore lint/a11y/useSemanticElements: saisie riche contenteditable (gras, italique, liens) — un <textarea> ne peut pas la porter.
    <div
      aria-label={placeholder}
      aria-multiline="true"
      className={`rte-content vibe-chat-input ${disabled ? "opacity-50 pointer-events-none" : ""} ${className}`}
      contentEditable={!disabled}
      data-placeholder={placeholder}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      ref={editorRef}
      role="textbox"
      suppressContentEditableWarning
      tabIndex={disabled ? -1 : 0}
    />
  );
}
