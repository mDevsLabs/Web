/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — COMPOSEUR DE MESSAGE RICHE
 * (src/components/messages/MessageRichInput.tsx)
 * contentEditable compact pour les DM : conversion « live » du Markdown inline
 * (gras/italique comme l'éditeur de posts), Entrée = envoyer, Maj+Entrée =
 * retour ligne, collage en texte brut, cap de caractères (texte brut).
 * ============================================================================
 */

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { escapeAttr, escapeHtml, tryApplyInlineMarkdown } from '../common/richTextUtils';
import { prepareEditorHtml } from '../common/richSanitizer';

export interface MessageRichInputHandle {
  getHTML: () => string;
  getText: () => string;
  isEmpty: () => boolean;
  setHTML: (html: string) => void;
  clear: () => void;
  focus: () => void;
  insertText: (text: string) => void;
  insertLink: (url: string) => void;
  execCommand: (cmd: 'bold' | 'italic' | 'underline' | 'strikeThrough') => void;
}

interface MessageRichInputProps {
  placeholder?: string;
  disabled?: boolean;
  /** Cap en caractères de texte brut (défaut 3000). */
  maxChars?: number;
  className?: string;
  onChange?: (html: string, text: string) => void;
  /** Frappe/collage réels de l'utilisateur (pas les setHTML programmatiques). */
  onUserInput?: () => void;
  /** Entrée (sans Maj, hors IME) : déclenche l'envoi. */
  onEnterSend?: () => void;
}

export const MessageRichInput = forwardRef<MessageRichInputHandle, MessageRichInputProps>(
  (
    {
      placeholder = 'Écrivez un message…',
      disabled = false,
      maxChars = 3000,
      className = '',
      onChange,
      onUserInput,
      onEnterSend,
    },
    ref
  ) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const savedRangeRef = useRef<Range | null>(null);

    const syncEmptyState = useCallback(() => {
      const el = editorRef.current;
      if (!el) return;
      const empty =
        (el.textContent || '').trim().length === 0 && !el.querySelector('img,a,li,br:not(:only-child)');
      el.dataset.empty = String(empty);
    }, []);

    const emitChange = useCallback(() => {
      const el = editorRef.current;
      if (!el) return;
      syncEmptyState();
      onChange?.(el.innerHTML, el.textContent || '');
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
        getHTML: () => editorRef.current?.innerHTML || '',
        getText: () => editorRef.current?.textContent || '',
        isEmpty: () => {
          const el = editorRef.current;
          return !el || (el.textContent || '').trim().length === 0;
        },
        setHTML: (html: string) => {
          const el = editorRef.current;
          if (!el) return;
          el.innerHTML = prepareEditorHtml(html);
          emitChange();
        },
        clear: () => {
          const el = editorRef.current;
          if (!el) return;
          el.innerHTML = '';
          savedRangeRef.current = null;
          emitChange();
        },
        focus: () => editorRef.current?.focus(),
        insertText: (text: string) => {
          const el = editorRef.current;
          if (!el) return;
          restoreSelection();
          document.execCommand('insertText', false, text);
          emitChange();
        },
        insertLink: (url: string) => {
          const el = editorRef.current;
          if (!el) return;
          restoreSelection();
          const sel = window.getSelection();
          const selected = sel && !sel.isCollapsed ? sel.toString() : '';
          document.execCommand(
            'insertHTML',
            false,
            `<a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(selected || url)}</a>&nbsp;`
          );
          emitChange();
        },
        execCommand: (cmd) => {
          const el = editorRef.current;
          if (!el) return;
          restoreSelection();
          document.execCommand(cmd, false);
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
        if (sel && sel.rangeCount > 0 && el && sel.anchorNode && el.contains(sel.anchorNode)) {
          savedRangeRef.current = sel.getRangeAt(0).cloneRange();
        }
      };
      document.addEventListener('selectionchange', onSelectionChange);
      return () => document.removeEventListener('selectionchange', onSelectionChange);
    }, []);

    // Cap dur à la frappe : refuse les insertions au-delà de maxChars.
    useEffect(() => {
      const el = editorRef.current;
      if (!el) return;
      const onBeforeInput = (e: InputEvent) => {
        if (e.inputType && e.inputType.startsWith('insert') && e.data) {
          if ((el.textContent || '').length >= maxChars) e.preventDefault();
        }
      };
      el.addEventListener('beforeinput', onBeforeInput);
      return () => el.removeEventListener('beforeinput', onBeforeInput);
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
      onChange?.(el.innerHTML, el.textContent || '');
      onUserInput?.();
    }, [onChange, onUserInput, syncEmptyState]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key !== 'Enter') return;
        const native = e.nativeEvent as KeyboardEvent;
        if (native.isComposing) return;
        if (e.shiftKey) {
          e.preventDefault();
          document.execCommand('insertLineBreak');
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
        const text = e.clipboardData?.getData('text/plain') || '';
        if (!text) return;
        const remaining = Math.max(0, maxChars - (el.textContent || '').length);
        const clipped = text.slice(0, remaining);
        if (!clipped) return;
        restoreSelection();
        document.execCommand('insertHTML', false, escapeHtml(clipped).replace(/\n/g, '<br>'));
        emitChange();
        onUserInput?.();
      },
      [emitChange, maxChars, onUserInput, restoreSelection]
    );

    return (
      <div
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder}
        data-placeholder={placeholder}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        className={`rte-content vibe-chat-input ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}
      />
    );
  }
);

MessageRichInput.displayName = 'MessageRichInput';
