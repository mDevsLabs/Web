/**
 * Utilitaires texte du contenu riche : détection HTML, aplatissement en texte
 * brut (aperçus, TTS, partage, notifications) et échappement.
 */

/** Indique si un contenu est au format HTML riche (éditeur) ou texte brut. */
export const isRichHtml = (content: string | undefined | null): boolean =>
  Boolean(content && /<[a-z][\s\S]*>/i.test(content));

export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const BLOCK_SELECTOR = 'p, div, li, blockquote, pre, h1, h2, h3, h4, h5, h6, tr';

/**
 * Version texte brut d'un contenu riche : les <br> et fins de blocs deviennent
 * des sauts de ligne (l'ancienne version les perdait, collait les phrases).
 * DOMParser isole le parsing (aucun script, aucun chargement de ressource).
 */
export const htmlToPlainText = (content: string | undefined | null): string => {
  if (!content) return '';
  if (!isRichHtml(content)) return content;
  try {
    const doc = new DOMParser().parseFromString(
      content.replace(/<br\s*\/?>/gi, '\n'),
      'text/html'
    );
    doc.querySelectorAll(BLOCK_SELECTOR).forEach((el) => el.append('\n'));
    return (doc.body.textContent || '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  } catch {
    return content.replace(/<[^>]*>/g, ' ').trim();
  }
};

/** Extrait court (une ligne) pour aperçus, notifications et titres. */
export const makeExcerpt = (content: string | undefined | null, max = 80): string => {
  const text = htmlToPlainText(content).replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
};

/**
 * Retire les URLs des nœuds texte d'un HTML riche (garde intactes les URLs
 * des attributs, ex. href des liens). Sert aux bulles de message : les URLs
 * média attachées en fin de contenu sont rendues en lecteurs, pas en texte.
 */
export const stripUrlsFromHtml = (html: string): string => {
  if (!html) return html;
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode as Text);
    for (const node of textNodes) {
      node.textContent = (node.textContent || '').replace(/https?:\/\/[^\s]+/g, ' ');
    }
    return doc.body.innerHTML;
  } catch {
    return html;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Conversion « live » du Markdown inline (partagée éditeur de posts / composeur
// de messages) : `**gras**`, `*italique*`, `~~barré~~`, etc. deviennent du HTML
// pendant la frappe, sans que la syntaxe reste visible.
// ─────────────────────────────────────────────────────────────────────────────

export const escapeAttr = (v: string): string =>
  v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export interface InlineMarkdownRule {
  re: RegExp;
  html: (inner: string, url?: string) => string;
}

export const INLINE_MARKDOWN_RULES: InlineMarkdownRule[] = [
  { re: /\*\*([^*\s][^*]*)\*\*$/, html: (t) => `<b>${escapeAttr(t)}</b>&nbsp;` },
  { re: /(?<![*\w])\*([^*\s][^*]*)\*$/, html: (t) => `<i>${escapeAttr(t)}</i>&nbsp;` },
  { re: /__([^_\s][^_]*)__$/, html: (t) => `<b>${escapeAttr(t)}</b>&nbsp;` },
  { re: /~~([^~\s][^~]*)~~$/, html: (t) => `<s>${escapeAttr(t)}</s>&nbsp;` },
  { re: /==([^=\s][^=]*)==$/, html: (t) => `<mark>${escapeAttr(t)}</mark>&nbsp;` },
  { re: /`([^`\s][^`]*)`$/, html: (t) => `<code>${escapeAttr(t)}</code>&nbsp;` },
  { re: /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/, html: (t, url?) => `<a href="${escapeAttr(url || '')}">${escapeAttr(t)}</a>&nbsp;` },
];

/**
 * Applique la règle inline correspondant au curseur (sélection repliée collée à
 * la fin du motif, dans `el`). Retourne true si une conversion a eu lieu.
 * L'appelant est responsable du onChange/emit après coup.
 */
export const tryApplyInlineMarkdown = (el: HTMLElement): boolean => {
  const sel = window.getSelection();
  if (!sel || !sel.isCollapsed || !el.contains(sel.anchorNode)) return false;
  const node = sel.anchorNode;
  if (!node || node.nodeType !== Node.TEXT_NODE) return false;
  const text = node.textContent || '';
  const offset = sel.anchorOffset;
  const before = text.slice(0, offset);

  for (const rule of INLINE_MARKDOWN_RULES) {
    const m = before.match(rule.re);
    if (!m) continue;
    const start = offset - m[0].length;
    const range = document.createRange();
    range.setStart(node, start);
    range.setEnd(node, offset);
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand('insertHTML', false, rule.html(m[1], m[2]));
    return true;
  }
  return false;
};
