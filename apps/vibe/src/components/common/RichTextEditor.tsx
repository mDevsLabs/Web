/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — RICH TEXT EDITOR (src/components/common/RichTextEditor.tsx)
 * Éditeur WYSIWYG contenteditable : gras, italique, souligné, barré, listes à
 * barre d'outils WYSIWYG & collage d'URL avec nom de lien.
 * ============================================================================
 */

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Link2,
  X,
  Check,
  CornerDownLeft,
  Highlighter,
  Palette,
  Sigma,
  Braces,
} from 'lucide-react';
import { ApiService } from '../../services/api';
import { MentionAutocomplete, type MentionUser, type MentionBook } from '../feed/MentionAutocomplete';
import { prepareEditorHtml } from './richSanitizer';
import { VIBE_COLORS } from './richMarkdown';
import { tryApplyInlineMarkdown } from './richTextUtils';

export interface RichTextEditorHandle {
  getHTML: () => string;
  getText: () => string;
  isEmpty: () => boolean;
  setHTML: (html: string) => void;
  /** Insertion de texte (dictée vocale) à la position du curseur ou en fin. */
  insertText: (text: string) => void;
  /** Insertion de HTML (références de Livres, cartes) à la position du curseur ou en fin. */
  insertHtml: (html: string) => void;
  focus: () => void;
  clear: () => void;
}

interface RichTextEditorProps {
  /** HTML initial (lu au montage uniquement). */
  initialHTML?: string;
  onChange?: (html: string, text: string) => void;
  placeholder?: string;
  /** Mode compact (commentaires) : barre d'outils resserrée, hauteur réduite. */
  compact?: boolean;
  disabled?: boolean;
  className?: string;
  /** Mode étendu (modal) : remplit toute la hauteur disponible */
  fillHeight?: boolean;
  /** Cap de caractères (texte brut) : bloque la frappe et tronque le collage au-delà. */
  maxChars?: number;
}

interface LinkDraft {
  /** URL verrouillée (collée) ou saisie manuellement. */
  url: string;
  text: string;
  lockedUrl: boolean;
}

const URL_RE = /^https?:\/\/[^\s<>"']+$/i;

const escapeAttr = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Teintes des pastilles de la palette (miroir des classes .vibe-color-*). */
const COLOR_SWATCHES: Record<string, string> = {
  rouge: '#ef4444',
  orange: '#f97316',
  ambre: '#eab308',
  vert: '#22c55e',
  emeraude: '#10b981',
  bleu: '#3b82f6',
  violet: '#8b5cf6',
  rose: '#ec4899',
  gris: '#71717a',
};

export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  (
    {
      initialHTML,
      onChange,
      placeholder = 'Écrivez votre vibe…',
      compact = false,
      disabled = false,
      className = '',
      fillHeight = false,
      maxChars,
    },
    ref
  ) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const savedRangeRef = useRef<Range | null>(null);
    const [_isEmpty, setIsEmpty] = useState(true);
    const [activeStates, setActiveStates] = useState<{
      bold: boolean;
      italic: boolean;
      underline: boolean;
      strikeThrough: boolean;
      mark: boolean;
      color: string | null;
    }>({
      bold: false,
      italic: false,
      underline: false,
      strikeThrough: false,
      mark: false,
      color: null,
    });
    const [linkDraft, setLinkDraft] = useState<LinkDraft | null>(null);
    const linkTextInputRef = useRef<HTMLInputElement>(null);
    const [paletteOpen, setPaletteOpen] = useState(false);
    const paletteRef = useRef<HTMLSpanElement>(null);

    // ── Autocomplete de mentions « @ » (posts & commentaires) ────────────
    // Même mécanique que ToolAutocomplete pour les outils mAI : détection du
    // dernier mot tapé, popover de comptes (avatar + nom + @username),
    // navigation clavier, insertion « @username » remplaçant le token.
    const [mention, setMention] = useState<{ query: string } | null>(null);
    const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([]);
    const [mentionBooks, setMentionBooks] = useState<MentionBook[]>([]);
    const [mentionIndex, setMentionIndex] = useState(0);
    const mentionRangeRef = useRef<Range | null>(null);

    const closeMention = useCallback(() => {
      setMention(null);
      setMentionUsers([]);
      setMentionBooks([]);
      setMentionIndex(0);
    }, []);

    const detectMention = useCallback(() => {
      const sel = window.getSelection();
      const el = editorRef.current;
      if (
        !sel ||
        !sel.isCollapsed ||
        !el ||
        !el.contains(sel.anchorNode) ||
        sel.anchorNode?.nodeType !== Node.TEXT_NODE
      ) {
        closeMention();
        return;
      }
      const before = (sel.anchorNode as Text).textContent?.slice(0, sel.anchorOffset) || '';
      const lastWord = before.split(/\s+/).pop() || '';
      if (/^@[a-zA-Z0-9_]{0,30}$/.test(lastWord)) {
        mentionRangeRef.current = sel.getRangeAt(0).cloneRange();
        setMention((prev) => (prev?.query === lastWord ? prev : { query: lastWord }));
        setMentionIndex(0);
      } else {
        closeMention();
      }
    }, [closeMention]);

    const mentionQuery = mention ? mention.query.slice(1) : '';

    useEffect(() => {
      if (!mention || mentionQuery.length < 1) {
        setMentionUsers([]);
        setMentionBooks([]);
        return;
      }
      let cancelled = false;
      const timer = setTimeout(async () => {
        // Recherche parallèle : comptes Vibe + Livres publics (dès 2 caractères)
        const [usersRes, booksRes] = await Promise.all([
          ApiService.searchUsers(mentionQuery).catch(() => null),
          mentionQuery.length >= 2
            ? ApiService.searchPublicBooks(mentionQuery).catch(() => null)
            : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setMentionUsers((usersRes?.users || []).slice(0, 6));
        setMentionBooks(((booksRes as any)?.books || []).slice(0, 4));
      }, 250);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }, [mentionQuery, mention]);

    // ── Utilitaires internes ────────────────────────────────────────────

    const syncEmptyState = useCallback(() => {
      const el = editorRef.current;
      if (!el) return;
      const html = el.innerHTML.replace(/<br\s*\/?>/gi, '').trim();
      const empty = el.textContent!.trim().length === 0 && !el.querySelector('img,li');
      el.dataset.empty = String(empty);
      setIsEmpty(empty || html === '');
    }, []);

    const emitChange = useCallback(() => {
      const el = editorRef.current;
      if (!el) return;
      syncEmptyState();
      onChange?.(el.innerHTML, el.textContent || '');
    }, [onChange, syncEmptyState]);

    // Cap de caractères (texte brut) : refuse les insertions au-delà de maxChars
    useEffect(() => {
      const el = editorRef.current;
      if (!el || !maxChars || !Number.isFinite(maxChars)) return;
      const onBeforeInput = (e: InputEvent) => {
        if (e.inputType && e.inputType.startsWith('insert') && e.data) {
          if ((el.textContent || '').length >= maxChars) e.preventDefault();
        }
      };
      el.addEventListener('beforeinput', onBeforeInput);
      return () => el.removeEventListener('beforeinput', onBeforeInput);
    }, [maxChars]);

    const selectMention = useCallback(
      (user: MentionUser) => {
        const el = editorRef.current;
        const range = mentionRangeRef.current;
        if (!el || !range) {
          closeMention();
          return;
        }
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
        el.focus();
        document.execCommand('insertText', false, `@${user.username} `);
        emitChange();
        closeMention();
      },
      [closeMention, emitChange]
    );

    /** Ancre de référence de Livre (@livre) insérée dans le contenu. */
    const bookAnchorHtml = useCallback((book: MentionBook) => {
      const safeTitle = String(book.title || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
      return `<a data-book-id="${book.id}" href="/books/${book.id}" class="rich-link">@${safeTitle}</a>&nbsp;`;
    }, []);

    const selectBookMention = useCallback(
      (book: MentionBook) => {
        const el = editorRef.current;
        const range = mentionRangeRef.current;
        if (!el || !range) {
          closeMention();
          return;
        }
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
        el.focus();
        document.execCommand('insertHTML', false, bookAnchorHtml(book));
        emitChange();
        closeMention();
      },
      [bookAnchorHtml, closeMention, emitChange]
    );

    const handleMentionKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        const total = mentionUsers.length + mentionBooks.length;
        if (!mention || total === 0) return;
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setMentionIndex((i) => (i + 1) % total);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setMentionIndex((i) => (i - 1 + total) % total);
        } else if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          if (mentionIndex < mentionUsers.length) {
            const user = mentionUsers[mentionIndex];
            if (user) selectMention(user);
          } else {
            const book = mentionBooks[mentionIndex - mentionUsers.length];
            if (book) selectBookMention(book);
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          closeMention();
        }
      },
      [mention, mentionUsers, mentionBooks, mentionIndex, selectMention, selectBookMention, closeMention]
    );

    const focusEditor = useCallback(() => {
      editorRef.current?.focus();
    }, []);

    const exec = useCallback(
      (cmd: string, value?: string) => {
        focusEditor();
        document.execCommand(cmd, false, value);
        emitChange();
      },
      [emitChange, focusEditor]
    );

    const readActiveStates = useCallback(() => {
      try {
        const sel = window.getSelection();
        const anchorEl = sel?.anchorNode
          ? sel.anchorNode instanceof HTMLElement
            ? sel.anchorNode
            : sel.anchorNode.parentElement
          : null;
        const colorSpan = anchorEl?.closest('span[class*="vibe-color-"]') as HTMLElement | null;
        const activeColor = colorSpan
          ? Array.from(colorSpan.classList)
              .find((cls) => cls.startsWith('vibe-color-'))
              ?.slice('vibe-color-'.length) || null
          : null;
        setActiveStates({
          bold: document.queryCommandState('bold'),
          italic: document.queryCommandState('italic'),
          underline: document.queryCommandState('underline'),
          strikeThrough: document.queryCommandState('strikeThrough'),
          mark: Boolean(anchorEl?.closest('mark')),
          color: activeColor,
        });
      } catch {
        /* navigateur sans queryCommandState */
      }
    }, []);

    const saveSelection = useCallback(() => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
        savedRangeRef.current = sel.getRangeAt(0).cloneRange();
      }
    }, []);

    const restoreSelection = useCallback(() => {
      const sel = window.getSelection();
      const range = savedRangeRef.current;
      if (sel && range) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
      focusEditor();
    }, [focusEditor]);

    // ── Règles Markdown à la frappe ─────────────────────────────────────

    const applyInlineMarkdown = useCallback(() => {
      const el = editorRef.current;
      if (!el) return;
      if (tryApplyInlineMarkdown(el)) emitChange();
    }, [emitChange]);

    const applyBlockMarkdown = useCallback(() => {
      const sel = window.getSelection();
      const el = editorRef.current;
      if (!sel || !sel.isCollapsed || !el || !el.contains(sel.anchorNode)) return;
      // Bloc courant = enfant direct de l'éditeur contenant le curseur
      let node: Node | null = sel.anchorNode;
      let block: HTMLElement | null = null;
      while (node && node !== el) {
        if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).parentElement === el) {
          block = node as HTMLElement;
          break;
        }
        node = node.parentNode;
      }
      if (!block) {
        // Première ligne : texte direct dans l'éditeur
        if (sel.anchorNode?.parentElement === el || sel.anchorNode === el) {
          const text = (el.textContent || '').trim();
          if (/^(-|\*|1\.|>) $/.test(`${text} `)) {
            el.textContent = '';
            if (text.trim() === '>') document.execCommand('formatBlock', false, 'blockquote');
            else document.execCommand(text.trim() === '1.' ? 'insertOrderedList' : 'insertUnorderedList');
            emitChange();
          }
        }
        return;
      }
      const blockText = (block.textContent || '').trim();
      if (blockText === '-' || blockText === '*') {
        block.innerHTML = '';
        document.execCommand('insertUnorderedList');
        emitChange();
      } else if (blockText === '1.') {
        block.innerHTML = '';
        document.execCommand('insertOrderedList');
        emitChange();
      } else if (blockText === '>') {
        block.innerHTML = '';
        document.execCommand('formatBlock', false, 'blockquote');
        emitChange();
      }
    }, [emitChange]);

    // ── Enrichissements : surlignage, couleur, formule, bloc de code ────

    /** Remonte l'arbre jusqu'au premier élément vérifiant le prédicat (borné à l'éditeur). */
    const closestInlineWrapper = useCallback(
      (node: Node | null, predicate: (el: HTMLElement) => boolean): HTMLElement | null => {
        const el = editorRef.current;
        let current: Node | null = node;
        while (current && current !== el) {
          if (current instanceof HTMLElement && predicate(current)) return current;
          current = current.parentNode;
        }
        return null;
      },
      []
    );

    const unwrapElement = useCallback((wrapper: HTMLElement) => {
      const parent = wrapper.parentNode;
      if (!parent) return;
      while (wrapper.firstChild) parent.insertBefore(wrapper.firstChild, wrapper);
      parent.removeChild(wrapper);
    }, []);

    const isColorSpan = (el: HTMLElement) =>
      el.tagName === 'SPAN' && Array.from(el.classList).some((cls) => cls.startsWith('vibe-color-'));

    /**
     * Applique (ou retire, en toggle) un wrapper inline sur la sélection.
     * Le contenu est extrait puis réenveloppé : les enrichissements existants
     * (mark dans une couleur, couleur dans un mark…) sont préservés, et un
     * second clic sur le même style retire le wrapper englobant.
     */
    const applyWrapper = useCallback(
      (tagName: 'mark' | 'span', className?: string) => {
        const sel = window.getSelection();
        const el = editorRef.current;
        if (!sel || !el || !el.contains(sel.anchorNode)) return;

        const findWrapper = (node: Node | null) =>
          tagName === 'mark'
            ? closestInlineWrapper(node, (n) => n.tagName === 'MARK')
            : closestInlineWrapper(node, isColorSpan);

        // Curseur simple : retire le surlignage / la couleur englobante
        if (sel.isCollapsed) {
          const enclosing = findWrapper(sel.anchorNode);
          if (!enclosing) return;
          unwrapElement(enclosing);
          emitChange();
          return;
        }

        const range = sel.getRangeAt(0);
        const startWrapper = findWrapper(range.startContainer);
        const endWrapper = findWrapper(range.endContainer);

        // Toggle OFF : toute la sélection est déjà dans le même wrapper
        if (startWrapper && startWrapper === endWrapper) {
          if (tagName === 'span' && className && !startWrapper.classList.contains(className)) {
            // Même famille (couleur) mais teinte différente : remplacement direct
            Array.from(startWrapper.classList)
              .filter((cls) => cls.startsWith('vibe-color-'))
              .forEach((cls) => startWrapper.classList.remove(cls));
            startWrapper.classList.add(className);
          } else {
            unwrapElement(startWrapper);
          }
          emitChange();
          return;
        }

        el.focus();
        const frag = range.extractContents();
        const node = document.createElement(tagName);
        if (className) node.className = className;
        node.appendChild(frag);
        range.insertNode(node);
        sel.removeAllRanges();
        const next = document.createRange();
        next.selectNodeContents(node);
        sel.addRange(next);
        emitChange();
      },
      [closestInlineWrapper, emitChange, unwrapElement]
    );

    const clearColor = useCallback(() => {
      const sel = window.getSelection();
      const el = editorRef.current;
      if (!sel || !el || !el.contains(sel.anchorNode)) return;
      let node: Node | null = sel.anchorNode;
      while (node && node !== el) {
        if (
          node instanceof HTMLElement &&
          node.tagName === 'SPAN' &&
          Array.from(node.classList).some((cls) => cls.startsWith('vibe-color-'))
        ) {
          const parent = node.parentNode;
          if (parent) {
            while (node.firstChild) parent.insertBefore(node.firstChild, node);
            parent.removeChild(node);
          }
          emitChange();
          return;
        }
        node = node.parentNode;
      }
    }, [emitChange]);

    const insertFormula = useCallback(() => {
      const el = editorRef.current;
      if (!el) return;
      const sel = window.getSelection();
      if (!sel || !el.contains(sel.anchorNode)) focusEditor();

      // Sélection : l'entoure de $…$ (formule en ligne)
      const s = window.getSelection();
      if (s && !s.isCollapsed && s.rangeCount > 0 && el.contains(s.anchorNode)) {
        const tex = s.toString().replace(/\$/g, '').trim();
        if (tex) document.execCommand('insertText', false, `$${tex}$`);
        emitChange();
        return;
      }

      document.execCommand('insertText', false, '$$');
      // Place le curseur entre les deux $ pour taper la formule
      const after = window.getSelection();
      const range = after && after.rangeCount > 0 ? after.getRangeAt(0) : null;
      if (after && range && range.startContainer.nodeType === Node.TEXT_NODE) {
        const inner = document.createRange();
        inner.setStart(range.startContainer, Math.max(0, range.startOffset - 1));
        inner.collapse(true);
        after.removeAllRanges();
        after.addRange(inner);
      }
      emitChange();
    }, [emitChange, focusEditor]);

    const insertCodeBlock = useCallback(() => {
      const el = editorRef.current;
      if (!el) return;
      el.focus();
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      if (!el.contains(sel.anchorNode)) {
        // Curseur en fin d'éditeur
        const end = document.createRange();
        end.selectNodeContents(el);
        end.collapse(false);
        sel.removeAllRanges();
        sel.addRange(end);
      }
      const s = window.getSelection();
      if (!s || s.rangeCount === 0) return;
      const range = s.getRangeAt(0);
      const hasContent = !s.isCollapsed;
      const codeText = hasContent ? range.toString() : 'code';
      range.deleteContents();
      const pre = document.createElement('pre');
      pre.className = 'hljs-block';
      const code = document.createElement('code');
      code.textContent = codeText;
      pre.appendChild(code);
      const frag = document.createDocumentFragment();
      frag.appendChild(pre);
      frag.appendChild(document.createElement('br'));
      range.insertNode(frag);
      // Placeholder sélectionné (frappe directe) ou curseur en fin de code
      const next = document.createRange();
      next.selectNodeContents(code);
      if (hasContent) next.collapse(false);
      s.removeAllRanges();
      s.addRange(next);
      emitChange();
    }, [emitChange]);

    // Ferme la palette de couleurs au clic extérieur
    useEffect(() => {
      if (!paletteOpen) return;
      const onMouseDown = (e: MouseEvent) => {
        if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
          setPaletteOpen(false);
        }
      };
      document.addEventListener('mousedown', onMouseDown);
      return () => document.removeEventListener('mousedown', onMouseDown);
    }, [paletteOpen]);

    // ── Synchronisation de la sélection avec la barre d'outils ─────────
    const handleSelectionUpdate = useCallback(() => {
      readActiveStates();
      saveSelection();
    }, [readActiveStates, saveSelection]);

    // ── Colle le lien : popover de nommage ──────────────────────────────

    const handlePaste = useCallback(
      (e: React.ClipboardEvent) => {
        if (disabled) return;
        const pasted = (e.clipboardData.getData('text/plain') || '').trim();
        if (pasted && URL_RE.test(pasted)) {
          e.preventDefault();
          const sel = window.getSelection();
          const selectedText =
            sel && !sel.isCollapsed && editorRef.current?.contains(sel.anchorNode)
              ? sel.toString()
              : '';
          saveSelection();
          setLinkDraft({ url: pasted, text: selectedText, lockedUrl: true });
          setTimeout(() => linkTextInputRef.current?.focus(), 30);
          return;
        }
        // Collage en texte brut : évite tout HTML parasite copié ailleurs
        if (pasted) {
          e.preventDefault();
          const remaining =
            maxChars && Number.isFinite(maxChars)
              ? Math.max(0, maxChars - (editorRef.current?.textContent || '').length)
              : pasted.length;
          const clipped = pasted.slice(0, remaining);
          if (clipped) document.execCommand('insertText', false, clipped);
        }
      },
      [disabled, maxChars, saveSelection]
    );

    const insertLinkHTML = useCallback(
      (url: string, text: string) => {
        restoreSelection();
        const sel = window.getSelection();
        const hasSelection = sel && !sel.isCollapsed && editorRef.current?.contains(sel.anchorNode);
        const html = `<a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${escapeAttr(text || url)}</a>&nbsp;`;
        if (hasSelection) {
          document.execCommand('insertHTML', false, html);
        } else {
          document.execCommand('insertHTML', false, html);
        }
        savedRangeRef.current = null;
        emitChange();
      },
      [emitChange, restoreSelection]
    );

    const openLinkPopover = useCallback(() => {
      const sel = window.getSelection();
      const selectedText =
        sel && !sel.isCollapsed && editorRef.current?.contains(sel.anchorNode) ? sel.toString() : '';
      saveSelection();
      setLinkDraft({ url: '', text: selectedText, lockedUrl: false });
      setTimeout(() => linkTextInputRef.current?.focus(), 30);
    }, [saveSelection]);

    const confirmLink = useCallback(() => {
      if (!linkDraft) return;
      const url = linkDraft.url.trim();
      if (!url || !URL_RE.test(url)) {
        // URL invalide : insertion en texte simple
        if (linkDraft.text.trim()) {
          restoreSelection();
          document.execCommand('insertText', false, `${linkDraft.text} ${url}`);
        }
      } else {
        insertLinkHTML(url, linkDraft.text.trim());
      }
      setLinkDraft(null);
    }, [insertLinkHTML, linkDraft, restoreSelection]);

    const toggleBlockquote = useCallback(() => {
      const sel = window.getSelection();
      const el = editorRef.current;
      if (!sel || !el || !el.contains(sel.anchorNode)) return;
      let node: Node | null = sel.anchorNode;
      let inQuote = false;
      while (node) {
        if (node === el) break;
        if ((node as HTMLElement).tagName === 'BLOCKQUOTE') {
          inQuote = true;
          break;
        }
        node = node.parentNode;
      }
      exec('formatBlock', inQuote ? 'div' : 'blockquote');
    }, [exec]);

    // ── API impérative (dictée, préremplissage, soumission) ─────────────

    useImperativeHandle(ref, () => ({
      getHTML: () => {
        const el = editorRef.current;
        if (!el) return '';
        const html = el.innerHTML;
        if (html.replace(/<br\s*\/?>/gi, '').trim() === '' && !el.querySelector('img,li,blockquote,ul,ol,a')) {
          return '';
        }
        return html;
      },
      getText: () => editorRef.current?.textContent || '',
      isEmpty: () => {
        const el = editorRef.current;
        if (!el) return true;
        return el.textContent!.trim().length === 0 && !el.querySelector('img,li,blockquote,ul,ol,a');
      },
      setHTML: (html: string) => {
        const el = editorRef.current;
        if (!el) return;
        el.innerHTML = prepareEditorHtml(html);
        syncEmptyState();
      },
      insertText: (text: string) => {
        const el = editorRef.current;
        if (!el) return;
        el.focus();
        const sel = window.getSelection();
        if (!sel || !el.contains(sel.anchorNode)) {
          // Curseur en fin d'éditeur
          const range = document.createRange();
          range.selectNodeContents(el);
          range.collapse(false);
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
        document.execCommand('insertText', false, text);
        emitChange();
      },
      insertHtml: (html: string) => {
        const el = editorRef.current;
        if (!el) return;
        el.focus();
        const sel = window.getSelection();
        if (!sel || !el.contains(sel.anchorNode)) {
          // Curseur en fin d'éditeur
          const range = document.createRange();
          range.selectNodeContents(el);
          range.collapse(false);
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
        document.execCommand('insertHTML', false, html);
        emitChange();
      },
      focus: () => editorRef.current?.focus(),
      clear: () => {
        const el = editorRef.current;
        if (!el) return;
        el.innerHTML = '';
        syncEmptyState();
      },
    }));

    // Contenu initial (montage uniquement)
    useEffect(() => {
      const el = editorRef.current;
      if (el && initialHTML) {
        el.innerHTML = prepareEditorHtml(initialHTML);
      }
      syncEmptyState();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleInput = useCallback(() => {
      applyBlockMarkdown();
      applyInlineMarkdown();
      emitChange();
      detectMention();
    }, [applyBlockMarkdown, applyInlineMarkdown, emitChange, detectMention]);

    const toolbarBtn = (
      icon: React.ReactNode,
      title: string,
      onClick: () => void,
      active?: boolean
    ) => (
      <button
        key={title}
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClick}
        disabled={disabled}
        className={`p-1.5 rounded-lg transition-colors ${
          active
            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black shadow-sm'
            : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800'
        }`}
        title={title}
      >
        {icon}
      </button>
    );

    return (
      <div
        ref={wrapperRef}
        className={`relative ${fillHeight ? 'flex-1 flex flex-col min-h-0' : ''} ${className}`}
        onClick={(e) => {
          // Cliquer dans la zone libre de l'éditeur place le focus
          if (
            e.target === wrapperRef.current &&
            editorRef.current &&
            document.activeElement !== editorRef.current
          ) {
            editorRef.current.focus();
          }
        }}
      >
        {/* Barre d'outils principale */}
        <div className="flex items-center gap-0.5 flex-wrap pb-1.5 border-b border-zinc-200 dark:border-zinc-800 mb-1 shrink-0">
          {toolbarBtn(<Bold className="w-3.5 h-3.5" />, 'Gras (**texte**)', () => exec('bold'), activeStates.bold)}
          {toolbarBtn(<Italic className="w-3.5 h-3.5" />, 'Italique (*texte*)', () => exec('italic'), activeStates.italic)}
          {toolbarBtn(<UnderlineIcon className="w-3.5 h-3.5" />, 'Souligné', () => exec('underline'), activeStates.underline)}
          {toolbarBtn(<Strikethrough className="w-3.5 h-3.5" />, 'Barré (~~texte~~)', () => exec('strikeThrough'), activeStates.strikeThrough)}
          {!compact && (
            <>
              <span className="w-px h-4 bg-zinc-300 dark:bg-zinc-800 mx-1" />
              {toolbarBtn(<List className="w-3.5 h-3.5" />, 'Liste à puces (- + espace)', () => exec('insertUnorderedList'))}
              {toolbarBtn(<ListOrdered className="w-3.5 h-3.5" />, 'Liste numérotée (1. + espace)', () => exec('insertOrderedList'))}
              {toolbarBtn(<Quote className="w-3.5 h-3.5" />, 'Citation (> + espace)', toggleBlockquote)}
              {toolbarBtn(<Code className="w-3.5 h-3.5" />, 'Code (`texte`)', () => {
                const sel = window.getSelection();
                if (sel && !sel.isCollapsed) exec('insertHTML', `<code>${escapeAttr(sel.toString())}</code>&nbsp;`);
              })}
            </>
          )}
          <span className="w-px h-4 bg-zinc-300 dark:bg-zinc-800 mx-1" />
          {toolbarBtn(<Highlighter className="w-3.5 h-3.5" />, 'Surligner / retirer le surlignage (==texte==)', () => applyWrapper('mark'), activeStates.mark)}
          <span ref={paletteRef} className="relative">
            {toolbarBtn(
              <Palette className="w-3.5 h-3.5" />,
              'Couleur du texte ({rouge}texte{/})',
              () => setPaletteOpen((open) => !open),
              paletteOpen || Boolean(activeStates.color)
            )}
            {paletteOpen && (
              <div className="absolute z-40 top-full left-1/2 -translate-x-1/2 mt-1.5 p-2 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 shadow-2xl flex items-center gap-1.5 animate-fadeIn">
                {VIBE_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      applyWrapper('span', `vibe-color-${color}`);
                      setPaletteOpen(false);
                    }}
                    title={color}
                    aria-label={`Couleur ${color}`}
                    className="w-5 h-5 rounded-full border border-black/10 dark:border-white/25 hover:scale-110 transition-transform"
                    style={{ backgroundColor: COLOR_SWATCHES[color] }}
                  />
                ))}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    clearColor();
                    setPaletteOpen(false);
                  }}
                  title="Aucune couleur"
                  aria-label="Retirer la couleur"
                  className="w-5 h-5 rounded-full border border-zinc-300 dark:border-zinc-600 text-zinc-500 hover:text-black dark:hover:text-white flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </span>
          {toolbarBtn(<Sigma className="w-3.5 h-3.5" />, 'Formule mathématique ($…$)', insertFormula)}
          {!compact && toolbarBtn(<Braces className="w-3.5 h-3.5" />, 'Bloc de code', insertCodeBlock)}
          {toolbarBtn(<Link2 className="w-3.5 h-3.5" />, 'Insérer un lien', openLinkPopover)}
        </div>

        {/* Zone éditable */}
        <div
          ref={editorRef}
          contentEditable={!disabled}
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          data-placeholder={placeholder}
          onInput={handleInput}
          onKeyDown={handleMentionKeyDown}
          onPaste={handlePaste}
          onKeyUp={handleSelectionUpdate}
          onMouseUp={handleSelectionUpdate}
          onBlur={() => {
            saveSelection();
            closeMention();
          }}
          className={`rte-content w-full bg-transparent text-black dark:text-white text-sm sm:text-base leading-relaxed focus:outline-none overflow-y-auto ${
            fillHeight
              ? 'flex-1 min-h-[10rem] sm:min-h-[14rem]'
              : compact
              ? 'min-h-[2.75rem] max-h-32'
              : 'min-h-[7rem] max-h-[45vh]'
          }`}
        />

        {/* Popover d'autocomplete de mentions « @ » (comptes + Livres publics) */}
        {mention && (mentionUsers.length > 0 || mentionBooks.length > 0) && (
          <MentionAutocomplete
            users={mentionUsers}
            books={mentionBooks}
            highlightedIndex={mentionIndex}
            onSelect={selectMention}
            onSelectBook={selectBookMention}
          />
        )}

        {/* Popover de nommage des liens (collage d'URL ou bouton lien) */}
        {linkDraft && (
          <div className="absolute z-30 top-0 left-0 right-0 p-3 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 shadow-2xl animate-fadeIn space-y-2 text-black dark:text-white">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Link2 className="w-3 h-3" />
                {linkDraft.lockedUrl ? 'Coller un lien' : 'Insérer un lien'}
              </span>
              <button
                type="button"
                onClick={() => setLinkDraft(null)}
                className="p-0.5 rounded-full text-zinc-400 hover:text-black dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex gap-2">
              <input
                ref={linkTextInputRef}
                type="text"
                value={linkDraft.text}
                onChange={(e) => setLinkDraft((d) => (d ? { ...d, text: e.target.value } : d))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    confirmLink();
                  }
                }}
                placeholder="Nom du lien (ex : ICI)"
                className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 text-sm text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
              />
              {!linkDraft.lockedUrl && (
                <input
                  type="url"
                  value={linkDraft.url}
                  onChange={(e) => setLinkDraft((d) => (d ? { ...d, url: e.target.value } : d))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      confirmLink();
                    }
                  }}
                  placeholder="https://…"
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 text-sm text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 font-mono text-xs"
                />
              )}
              <button
                type="button"
                onClick={confirmLink}
                className="px-3 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-black text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center gap-1 shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
                Insérer
              </button>
            </div>
            {linkDraft.lockedUrl && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-zinc-500 font-mono truncate">{linkDraft.url}</span>
                <button
                  type="button"
                  onClick={() => {
                    restoreSelection();
                    document.execCommand('insertText', false, linkDraft.url);
                    setLinkDraft(null);
                    emitChange();
                  }}
                  className="text-[11px] text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white flex items-center gap-1 shrink-0"
                >
                  <CornerDownLeft className="w-3 h-3" />
                  Coller l'URL telle quelle
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';
