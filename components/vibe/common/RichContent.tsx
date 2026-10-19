/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — RICH CONTENT (src/components/common/RichContent.tsx)
 * Rendu sécurisé du contenu riche (markdown, HTML WYSIWYG, formules KaTeX,
 * code coloré, surlignage, couleurs) : pipeline markdown-it → DOMPurify →
 * liens cliquables (@mentions, #hashtags, URLs).
 * ============================================================================
 */

import type React from "react";
import { useMemo } from "react";
import { renderRichMarkdown } from "@/components/vibe/common/richMarkdown";
import { sanitizeRichHtml } from "@/components/vibe/common/richSanitizer";
import {
  escapeHtml,
  htmlToPlainText,
  isRichHtml,
} from "@/components/vibe/common/richTextUtils";
import { useNavigate } from "../router";

export { htmlToPlainText, isRichHtml };

const MENTION_RE = /^@[a-zA-Z0-9_]{1,30}$/;
const HASHTAG_RE = /^#[\w\u00C0-\u017F]{1,50}$/;
const URL_RE = /^https?:\/\/[^\s]+$/i;
const URL_CORE_RE = /^https?:\/\/[^\s]+$/i;

/**
 * Sépare ponctuation de tête/queue d'un token (ex. « (https://x.com), ») pour
 * que le lien ne l'avale pas. Retourne null si le cœur n'est pas une URL.
 */
function extractUrlParts(
  token: string
): { lead: string; core: string; tail: string } | null {
  let lead = "";
  const leadMatch = token.match(/^[(«"'\u201C[{-]+/);
  let core = leadMatch ? token.slice(leadMatch[0].length) : token;
  if (leadMatch) lead = leadMatch[0];

  let tail = "";
  const tailMatch = core.match(/[.,;:!?\u2026"'»\u201D]+$/);
  if (tailMatch) {
    tail = tailMatch[0];
    core = core.slice(0, core.length - tailMatch[0].length);
  }
  while (core && /[)\]}]$/.test(core)) {
    const close = core.slice(-1);
    const open = close === ")" ? "(" : close === "]" ? "[" : "{";
    if (core.includes(open)) break;
    tail = close + tail;
    core = core.slice(0, -1);
  }
  if (!URL_CORE_RE.test(core)) return null;
  return { core, lead, tail };
}

/**
 * Transforme les @mentions / #hashtags / URLs présents dans les nœuds texte en
 * ancres cliquables. Ignore le code (pre/code), les formules (katex) et les
 * nœuds déjà situés dans un lien (pas d'ancres imbriquées).
 */
function linkifyTextNodes(root: HTMLElement) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = (node as Text).parentElement;
      if (!parent || parent.closest("a, pre, code, .katex")) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const textNodes: Text[] = [];
  let currentNode: Node | null;
  while ((currentNode = walker.nextNode())) textNodes.push(currentNode as Text);

  for (const node of textNodes) {
    const raw = node.textContent || "";
    if (!raw.trim()) continue;
    const parts = raw.split(/(\s+)/);
    const hasToken = parts.some(
      (p) => MENTION_RE.test(p) || HASHTAG_RE.test(p) || extractUrlParts(p)
    );
    if (!hasToken) continue;

    const frag = document.createDocumentFragment();
    let changed = false;
    for (const part of parts) {
      if (MENTION_RE.test(part)) {
        const a = document.createElement("a");
        a.setAttribute("href", `/@${part.slice(1)}`);
        a.setAttribute("data-mention", part.slice(1));
        a.className = "rich-link";
        a.textContent = part;
        frag.appendChild(a);
        changed = true;
      } else if (HASHTAG_RE.test(part)) {
        const a = document.createElement("a");
        a.setAttribute(
          "href",
          `/explore?q=${encodeURIComponent(part)}&tab=hashtags`
        );
        a.setAttribute("data-hashtag", part);
        a.className = "rich-link";
        a.textContent = part;
        frag.appendChild(a);
        changed = true;
      } else {
        const urlParts = extractUrlParts(part);
        if (urlParts) {
          if (urlParts.lead)
            frag.appendChild(document.createTextNode(urlParts.lead));
          const a = document.createElement("a");
          a.setAttribute("href", urlParts.core);
          a.setAttribute("data-external", "1");
          a.className = "rich-link";
          a.textContent = urlParts.core;
          frag.appendChild(a);
          if (urlParts.tail)
            frag.appendChild(document.createTextNode(urlParts.tail));
          changed = true;
        } else {
          frag.appendChild(document.createTextNode(part));
        }
      }
    }
    if (changed && node.parentNode) {
      node.parentNode.replaceChild(frag, node);
    }
  }
}

function buildSafeHtml(content: string): string {
  if (!content) return "";
  try {
    const rendered = renderRichMarkdown(content);
    const clean = sanitizeRichHtml(rendered);
    const tpl = document.createElement("div");
    tpl.innerHTML = clean;
    linkifyTextNodes(tpl);
    // Les liens externes s'ouvrent dans un nouvel onglet
    tpl.querySelectorAll('a[href^="http"]').forEach((a) => {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    });
    return tpl.innerHTML;
  } catch {
    // Fail-safe : jamais de HTML brut non assaini
    return sanitizeRichHtml(escapeHtml(content));
  }
}

interface RichContentProps {
  className?: string;
  content: string;
  onOpenProfile?: (username: string) => void;
  onSelectHashtag?: (tag: string) => void;
}

export const RichContent: React.FC<RichContentProps> = ({
  content,
  className = "",
  onOpenProfile,
  onSelectHashtag,
}) => {
  const navigate = useNavigate();
  const html = useMemo(() => buildSafeHtml(content || ""), [content]);

  if (!content) return null;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const anchor = (e.target as HTMLElement).closest("a");
    if (!anchor) return;
    e.preventDefault();
    e.stopPropagation();
    const bookId = anchor.getAttribute("data-book-id");
    const mention = anchor.getAttribute("data-mention");
    const hashtag = anchor.getAttribute("data-hashtag");
    if (bookId) {
      navigate(`/books/${bookId}`);
    } else if (mention) {
      if (onOpenProfile) onOpenProfile(mention);
      else navigate(`/@${mention}`);
    } else if (hashtag) {
      if (onSelectHashtag) onSelectHashtag(hashtag);
      else navigate(`/explore?q=${encodeURIComponent(hashtag)}&tab=hashtags`);
    } else {
      const href = anchor.getAttribute("href") || "";
      if (href.startsWith("http")) {
        window.open(href, "_blank", "noopener,noreferrer");
      } else if (href) {
        navigate(href);
      }
    }
  };

  return (
    <div
      className={`rich-content break-words ${className}`}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML produit par buildSafeHtml → sanitizeRichHtml (DOMPurify) ; même schéma que diagram-card.tsx.
      dangerouslySetInnerHTML={{ __html: html }}
      onClick={handleClick}
    />
  );
};
