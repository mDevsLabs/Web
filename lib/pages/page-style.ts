import { Mark, mergeAttributes } from "@tiptap/core";
import {
  formatPageMark,
  isPageFont,
  isPageSize,
  isPageTone,
  locatePageMark,
  PAGE_MARK_FONT_CLASS,
  PAGE_MARK_SIZE_CLASS,
  PAGE_MARK_TONE_CLASS,
  type PageFont,
  type PageSize,
  type PageTone,
} from "@/lib/pages/style";

function markClass(
  font: PageFont | null,
  size: PageSize | null,
  tone: PageTone | null,
  underline: boolean
): string {
  return [
    font ? PAGE_MARK_FONT_CLASS[font] : "",
    size ? PAGE_MARK_SIZE_CLASS[size] : "",
    tone ? PAGE_MARK_TONE_CLASS[tone] : "",
    underline ? "underline" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Marque de zone : police et couleur, sérialisée en `<m font tone>`.
 *
 * Le jeton est reconnu par le gestionnaire Markdown de l'éditeur et par
 * celui qui décide si le mode visuel peut s'ouvrir. Une balise avec un
 * attribut hors liste n'est pas consommée : elle reste du HTML, et le
 * mode source conserve le document.
 */
export const PageStyle = Mark.create({
  addAttributes() {
    return {
      font: {
        default: null,
        parseHTML: (element) => {
          const value = element.getAttribute("font");
          return isPageFont(value) ? value : null;
        },
        renderHTML: (attributes) =>
          isPageFont(attributes.font) ? { font: attributes.font } : {},
      },
      size: {
        default: null,
        parseHTML: (element) => {
          const value = element.getAttribute("size");
          return isPageSize(value) ? value : null;
        },
        renderHTML: (attributes) =>
          isPageSize(attributes.size) ? { size: attributes.size } : {},
      },
      tone: {
        default: null,
        parseHTML: (element) => {
          const value = element.getAttribute("tone");
          return isPageTone(value) ? value : null;
        },
        renderHTML: (attributes) =>
          isPageTone(attributes.tone) ? { tone: attributes.tone } : {},
      },
      underline: {
        default: false,
        parseHTML: (element) => element.getAttribute("underline") === "1",
        renderHTML: (attributes) =>
          attributes.underline === true ? { underline: "1" } : {},
      },
    };
  },

  markdownTokenizer: {
    level: "inline",
    name: "pageStyle",
    start(src) {
      return locatePageMark(src)?.index ?? -1;
    },
    tokenize(src, _tokens, lexer) {
      const found = locatePageMark(src);
      if (found?.index !== 0 || !found) {
        return;
      }
      return {
        font: found.attrs.font,
        raw: found.raw,
        size: found.attrs.size,
        tokens: lexer.inlineTokens(found.inner),
        tone: found.attrs.tone,
        type: "pageStyle",
        underline: found.attrs.underline,
      };
    },
  },

  markdownTokenName: "pageStyle",

  name: "pageStyle",

  parseHTML() {
    return [{ tag: "m" }];
  },

  parseMarkdown(token, helpers) {
    const font = isPageFont(token.font) ? token.font : null;
    const size = isPageSize(token.size) ? token.size : null;
    const tone = isPageTone(token.tone) ? token.tone : null;
    const underline = token.underline === true;
    const content = token.tokens?.length
      ? helpers.parseInline(token.tokens)
      : [];
    if (!font && !size && !tone && !underline) {
      return content;
    }
    return helpers.applyMark(this.name, content, {
      font,
      size,
      tone,
      underline,
    });
  },

  renderHTML({ HTMLAttributes }) {
    const font = isPageFont(HTMLAttributes.font) ? HTMLAttributes.font : null;
    const size = isPageSize(HTMLAttributes.size) ? HTMLAttributes.size : null;
    const tone = isPageTone(HTMLAttributes.tone) ? HTMLAttributes.tone : null;
    const underline = HTMLAttributes.underline === true || HTMLAttributes.underline === "1";
    return [
      "m",
      mergeAttributes(HTMLAttributes, {
        class: markClass(font, size, tone, underline),
      }),
      0,
    ];
  },

  renderMarkdown(node, helpers) {
    const font = isPageFont(node.attrs?.font) ? node.attrs.font : null;
    const size = isPageSize(node.attrs?.size) ? node.attrs.size : null;
    const tone = isPageTone(node.attrs?.tone) ? node.attrs.tone : null;
    const underline = node.attrs?.underline === true;
    const inner = helpers.renderChildren(node.content ?? []);
    return formatPageMark(inner, { font, size, tone, underline });
  },
});
