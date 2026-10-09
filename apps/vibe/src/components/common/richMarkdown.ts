/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — RICH MARKDOWN (src/components/common/richMarkdown.ts)
 * Moteur markdown-it partagé du contenu riche :
 * - HTML du WYSIWYG conservé tel quel (html: true) ;
 * - code coloré via highlight.js (```lang) ;
 * - formules KaTeX : $inline$ et $$bloc$$ ;
 * - surlignage ==texte== (markdown-it-mark) ;
 * - couleurs de la palette fermée : {rouge}texte{/}.
 * ============================================================================
 */

import MarkdownIt from 'markdown-it';
import type { StateInline, Token } from 'markdown-it';
import markPlugin from 'markdown-it-mark';
import { renderToString as renderKatex } from 'katex';
import { escapeHtml } from './richTextUtils';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
import sql from 'highlight.js/lib/languages/sql';
import markdown from 'highlight.js/lib/languages/markdown';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import java from 'highlight.js/lib/languages/java';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('css', css);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('go', go);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('java', java);

/** Palette fermée des couleurs de texte (classes CSS .vibe-color-*). */
export const VIBE_COLORS = [
  'rouge', 'orange', 'ambre', 'vert', 'emeraude', 'bleu', 'violet', 'rose', 'gris',
] as const;
export type VibeColor = (typeof VIBE_COLORS)[number];

const COLOR_OPEN_RE = new RegExp(`^\\{(${VIBE_COLORS.join('|')})\\}`);

/**
 * $...$ / $$...$$ → KaTeX. Gardes anti-faux-positifs : « prix $5 et $10 »,
 * « 5$ », « a$b » restent littéraux ; un $ simple exige un signal mathématique.
 */
function vibeMathRule(state: StateInline, silent: boolean): boolean {
  const src = state.src;
  const start = state.pos;
  if (src[start] !== '$') return false;
  const delim = src[start + 1] === '$' ? 2 : 1;

  const prev = start > 0 ? src[start - 1] : ' ';
  if (/[A-Za-z0-9]/.test(prev)) return false;
  const afterOpen = src[start + delim];
  if (!afterOpen || afterOpen === ' ' || afterOpen === '\t' || afterOpen === '\n') return false;

  let end = start + delim;
  for (;;) {
    end = src.indexOf('$', end);
    if (end < 0) return false;
    if (delim === 2 && src[end + 1] !== '$') {
      end++;
      continue;
    }
    const before = src[end - 1];
    const after = src[end + delim] ?? ' ';
    if (before !== ' ' && before !== '\t' && before !== '\n' && !/[A-Za-z0-9]/.test(after)) break;
    end++;
  }

  const tex = src.slice(start + delim, end);
  if (!tex.trim() || tex.includes('\n')) return false;
  if (delim === 1 && !/[\\^_{}=+<>]/.test(tex)) return false;

  if (!silent) {
    let html = '';
    try {
      html = renderKatex(tex.trim(), {
        displayMode: delim === 2,
        throwOnError: false,
        strict: 'ignore',
        trust: false,
        maxSize: 20,
        maxExpand: 1000,
        errorColor: '#ef4444',
      });
    } catch {
      html = '';
    }
    if (!html) return false;
    state.push('vibe_math', '', 0).content = html;
  }
  state.pos = end + delim;
  return true;
}

/** {rouge}texte{/} → <span class="vibe-color-rouge">texte</span> (contenu re-parsé). */
function vibeColorRule(state: StateInline, silent: boolean): boolean {
  const src = state.src;
  const start = state.pos;
  if (src[start] !== '{') return false;
  const match = COLOR_OPEN_RE.exec(src.slice(start, start + 16));
  if (!match) return false;
  const contentStart = start + match[0].length;
  const close = src.indexOf('{/}', contentStart);
  if (close < 0 || close === contentStart) return false;
  const inner = src.slice(contentStart, close);
  if (inner.includes('\n')) return false;

  if (!silent) {
    const token = state.push('vibe_color', '', 0);
    token.content = `<span class="vibe-color-${match[1]}">${state.md.renderInline(inner)}</span>`;
  }
  state.pos = close + 3;
  return true;
}

const md = new MarkdownIt({
  html: true,
  linkify: false,
  breaks: true,
  typographer: false,
  highlight(code: string, lang: string): string {
    if (lang && hljs.getLanguage(lang)) {
      try {
        const highlighted = hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
        return `<pre class="hljs-block"><code class="hljs language-${lang}">${highlighted}</code></pre>`;
      } catch {
        // repli ci-dessous
      }
    }
    return `<pre class="hljs-block"><code class="hljs">${escapeHtml(code)}</code></pre>`;
  },
});

md.use(markPlugin);
md.inline.ruler.after('escape', 'vibe_math', vibeMathRule);
md.inline.ruler.after('vibe_math', 'vibe_color', vibeColorRule);
md.renderer.rules.vibe_math = (tokens: Token[], idx: number) => tokens[idx].content;
md.renderer.rules.vibe_color = (tokens: Token[], idx: number) => tokens[idx].content;

/** Point d'entrée : contenu brut (markdown ou HTML WYSIWYG) → HTML non assaini. */
export function renderRichMarkdown(content: string): string {
  return md.render(content);
}

/**
 * Rendu inline : convertit le markdown en HTML inline (sans balise <p> englobante).
 * Idéal pour les aperçus d'historique, titres et badges.
 */
export function renderInlineRichMarkdown(content: string): string {
  return md.renderInline(content);
}

/**
 * Nettoie la syntaxe markdown d'un texte pour obtenir une chaîne purement textuelle.
 */
export function stripMarkdownText(text: string): string {
  if (!text) return '';
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/==([^=]+)==/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\{[a-z]+\}([^{]*)\{\/\}/gi, '$1')
    .replace(/^#+\s+/gm, '')
    .replace(/^>\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}
