import { mergeAttributes, Node } from "@tiptap/core";
import {
  formatPageShape,
  isPageShapeKind,
  isPageTone,
  PAGE_MARK_TONE_CLASS,
  PAGE_SHAPE_HEIGHTS,
  PAGE_SHAPE_WIDTHS,
  readPageShapeTag,
  type PageShapeAttrs,
  type PageShapeKind,
  type PageTone,
} from "@/lib/pages/style";

function shapeBody(attrs: PageShapeAttrs): unknown[] {
  const stroke = "currentColor";
  const open = {
    fill: "none",
    stroke,
    "stroke-width": 2,
  };
  if (attrs.kind === "ellipse") {
    return [
      "ellipse",
      {
        ...open,
        cx: attrs.width / 2,
        cy: attrs.height / 2,
        rx: attrs.width / 2 - 2,
        ry: attrs.height / 2 - 2,
      },
    ];
  }
  if (attrs.kind === "line" || attrs.kind === "arrow") {
    const y = attrs.height / 2;
    const end = attrs.kind === "arrow" ? attrs.width - 14 : attrs.width - 2;
    const parts: unknown[] = [
      "g",
      {},
      ["line", { ...open, x1: 2, x2: end, y1: y, y2: y }],
    ];
    if (attrs.kind === "arrow") {
      parts.push([
        "polygon",
        {
          fill: stroke,
          points: `${attrs.width - 14},${y - 6} ${attrs.width - 2},${y} ${attrs.width - 14},${y + 6}`,
        },
      ]);
    }
    return parts;
  }
  return [
    "rect",
    {
      ...open,
      height: attrs.height - 4,
      rx: 8,
      width: attrs.width - 4,
      x: 2,
      y: 2,
    },
  ];
}

type RawShapeAttrs = {
  height?: unknown;
  kind?: unknown;
  tone?: unknown;
  width?: unknown;
};

function attrsOf(
  value: RawShapeAttrs | null | undefined
): PageShapeAttrs | null {
  if (!value || !isPageShapeKind(value.kind)) {
    return null;
  }
  const width = (PAGE_SHAPE_WIDTHS as readonly unknown[]).includes(value.width)
    ? (value.width as PageShapeAttrs["width"])
    : null;
  const height = (PAGE_SHAPE_HEIGHTS as readonly unknown[]).includes(
    value.height
  )
    ? (value.height as PageShapeAttrs["height"])
    : null;
  if (!width || !height) {
    return null;
  }
  return {
    height,
    kind: value.kind,
    tone: isPageTone(value.tone) ? value.tone : null,
    width,
  };
}

/**
 * Forme insérée dans la page : rectangle, ellipse, ligne ou flèche.
 *
 * La balise `<shape>` est fermée : un attribut hors liste n'est pas une
 * forme, et le mode source conserve le document.
 */
export const PageShape = Node.create({
  atom: true,
  group: "block",

  addAttributes() {
    return {
      height: { default: 80 },
      kind: { default: "rect" },
      tone: { default: null },
      width: { default: 200 },
    };
  },

  markdownTokenizer: {
    level: "block",
    name: "pageShape",
    start(src: string) {
      return src.search(/<shape\b/);
    },
    tokenize(src: string) {
      const match = /^<shape\b([^>]*)>\s*<\/shape>(?:\r?\n)?/.exec(src);
      if (!match) {
        return;
      }
      const parsed = readPageShapeTag(match[1] ?? "");
      if (!parsed) {
        return;
      }
      return {
        height: parsed.height,
        kind: parsed.kind,
        raw: match[0],
        tone: parsed.tone,
        type: "pageShape",
        width: parsed.width,
      };
    },
  },

  markdownTokenName: "pageShape",

  name: "pageShape",

  parseHTML() {
    return [{ tag: "shape" }];
  },

  parseMarkdown(token, helpers) {
    const parsed = attrsOf({
      height: token.height,
      kind: token.kind as PageShapeKind,
      tone: token.tone as PageTone | null,
      width: token.width,
    });
    if (!parsed) {
      return [];
    }
    return helpers.createNode(this.name, parsed);
  },

  renderHTML({ HTMLAttributes }) {
    const parsed =
      attrsOf({
        height: Number(HTMLAttributes.height),
        kind: HTMLAttributes.kind,
        tone: HTMLAttributes.tone,
        width: Number(HTMLAttributes.width),
      }) ?? {
        height: 80 as const,
        kind: "rect" as const,
        tone: null,
        width: 200 as const,
      };
    const toneClass = parsed.tone ? PAGE_MARK_TONE_CLASS[parsed.tone] : "";
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        class: `my-3 inline-block text-foreground ${toneClass}`.trim(),
      }),
      [
        "svg",
        {
          "aria-hidden": "true",
          height: parsed.height,
          viewBox: `0 0 ${parsed.width} ${parsed.height}`,
          width: parsed.width,
        },
        shapeBody(parsed),
      ],
    ];
  },

  renderMarkdown(node) {
    const parsed = attrsOf({
      height: node.attrs?.height,
      kind: node.attrs?.kind,
      tone: node.attrs?.tone,
      width: node.attrs?.width,
    });
    if (!parsed) {
      return "";
    }
    return `${formatPageShape(parsed)}\n\n`;
  },
});
