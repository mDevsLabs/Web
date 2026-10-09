/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — RICH SANITIZER (src/components/common/richSanitizer.ts)
 * Assainissement DOMPurify du HTML riche : allowlist stricte (contenu, KaTeX +
 * MathML, tables), filtrage des classes (anti-hooks CSS type Tailwind) et des
 * styles inline (propriétés KaTeX uniquement, couleurs en hexadécimal).
 * ============================================================================
 */

import DOMPurify from 'dompurify';
import { escapeHtml, isRichHtml } from './richTextUtils';

const ALLOWED_TAGS = [
  // Structure & typographie
  'p', 'br', 'div', 'span', 'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'del', 'mark',
  'sub', 'sup', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr',
  'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  // KaTeX (HTML + MathML) — semantics/annotation explicitement autorisés,
  // sinon DOMPurify « hoiste » leur contenu TeX en texte visible.
  'math', 'semantics', 'annotation', 'annotation-xml', 'none', 'mprescripts',
  'mrow', 'mi', 'mo', 'mn', 'ms', 'mtext', 'mspace', 'mstyle', 'merror', 'menclose',
  'mfenced', 'mglyph', 'mlabeledtr', 'mfrac', 'msqrt', 'mroot', 'mover', 'munder',
  'munderover', 'msub', 'msup', 'msubsup', 'mmultiscripts', 'mpadded', 'mphantom',
  'mtable', 'mtr', 'mtd',
];

const ALLOWED_ATTR = [
  'href', 'target', 'rel', 'class', 'style',
  // Références de Livres (@livre) insérées par l'éditeur
  'data-book-id',
  // Attributs MathML émis par KaTeX
  'xmlns', 'encoding', 'display', 'displaystyle', 'mathvariant', 'mathcolor',
  'mathbackground', 'mathsize', 'columnalign', 'rowalign', 'columnspan', 'rowspan',
  'rowlines', 'columnlines', 'rowspacing', 'columnspacing', 'stretchy', 'fence',
  'separator', 'largeop', 'movablelimits', 'accent', 'accentunder', 'linethickness',
  'width', 'height', 'depth', 'lspace', 'rspace', 'minsize', 'maxsize', 'scriptlevel',
  'numalign', 'denomalign', 'lquote', 'rquote',
];

// Classes autorisées : KaTeX (+ classes nues de sa mise en page), highlight.js,
// langage de code, palette Vibe et lien riche. Tout le reste est retiré.
const ALLOWED_CLASS_RE =
  /^(?:katex|katex-[\w-]+|hljs|hljs-[\w-]+|language-[\w-]+|vibe-color-(?:rouge|orange|ambre|vert|emeraude|bleu|violet|rose|gris)|rich-link|base|strut|vlist|vlist-t|vlist-r|vlist-s|pstrut|sizing|reset-size\d+|mtight|mord|mop|mbin|mrel|mopen|mclose|mpunct|minner|mspace|mathnormal|mathdefault|mtext|mfrac|frac-line|sqrt|mroot|delimsizing[\w-]*|nulldelimiter|delimcenter|accent[\w-]*|op|op-symbol|large-op|small-op|mathop|boxpad|col-align-[\w-]+|vertical-separator|arraycolsep|hline|newline|frac|dfrac|binom|dots|cdots|ldots)$/i;

// Propriétés CSS inline tolérées (mise en page KaTeX essentiellement).
const ALLOWED_STYLE_PROPS = new Set([
  'height', 'vertical-align', 'margin', 'margin-left', 'margin-right', 'margin-top',
  'margin-bottom', 'padding', 'padding-left', 'padding-right', 'padding-top', 'padding-bottom',
  'top', 'bottom', 'left', 'right', 'width', 'min-width', 'max-width', 'font-size',
  'line-height', 'position', 'display', 'overflow', 'overflow-x', 'overflow-y',
  'white-space', 'border-width', 'border-top-width', 'border-bottom-width',
  'border-left-width', 'border-right-width', 'border-style', 'border-color',
  'color', 'background-color',
]);
const STYLE_VALUE_RE = /^[#%(),.\w\s+-]*$/;
const STYLE_HEX_RE = /^#[0-9a-f]{3,8}$/i;

let hooksInstalled = false;
function ensureHooks() {
  if (hooksInstalled) return;
  hooksInstalled = true;
  DOMPurify.addHook('uponSanitizeAttribute', (_node, data) => {
    if (data.attrName === 'style') {
      const declarations = String(data.attrValue).split(';').filter((d) => d.trim());
      if (declarations.length === 0) {
        data.keepAttr = false;
        return;
      }
      const keep = declarations.every((declaration) => {
        const sep = declaration.indexOf(':');
        if (sep < 0) return false;
        const prop = declaration.slice(0, sep).trim().toLowerCase();
        const value = declaration.slice(sep + 1).trim();
        if (!ALLOWED_STYLE_PROPS.has(prop) || !value || value.length > 60) return false;
        if (prop === 'position' && !/^(relative|absolute)$/.test(value)) return false;
        if ((prop === 'color' || prop === 'background-color') && !STYLE_HEX_RE.test(value)) {
          return false;
        }
        return STYLE_VALUE_RE.test(value);
      });
      if (!keep) data.keepAttr = false;
    } else if (data.attrName === 'class') {
      const kept = String(data.attrValue)
        .split(/\s+/)
        .filter((cls) => cls && ALLOWED_CLASS_RE.test(cls));
      if (kept.length === 0) data.keepAttr = false;
      else data.attrValue = kept.join(' ');
    }
  });
}

/** Assainit du HTML riche déjà rendu (sortie markdown-it/KaTeX/hljs ou éditeur). */
export function sanitizeRichHtml(html: string): string {
  if (!html) return '';
  ensureHooks();
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * HTML prêt pour l'éditeur WYSIWYG : sanitize si HTML, sinon échappement du
 * texte brut avec conversion des \n (contenus historiques multi-lignes).
 */
export function prepareEditorHtml(html: string | undefined | null): string {
  if (!html) return '';
  if (isRichHtml(html)) return sanitizeRichHtml(html);
  return escapeHtml(html).replace(/\n/g, '<br>');
}
