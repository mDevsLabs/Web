/**
 * Police et couleur d'une zone de page.
 *
 * Le compte choisit la police de lecture (texte sans marque). Une zone
 * sélectionnée porte la sienne, et éventuellement une des quatre couleurs
 * d'accent, dans une balise `<m>` que l'assistant peut patcher. Les valeurs
 * hors liste sont ignorées ; tout autre attribut rend la balise invalide,
 * donc le document reste en mode source.
 */

export const PAGE_FONTS = ["sans", "serif", "mono"] as const;
export type PageFont = (typeof PAGE_FONTS)[number];

export const PAGE_TONES = [
  "info",
  "warning",
  "success",
  "destructive",
] as const;
export type PageTone = (typeof PAGE_TONES)[number];

export const PAGE_SIZES = ["small", "large", "huge"] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

export const PAGE_SHAPES = ["rect", "ellipse", "line", "arrow"] as const;
export type PageShapeKind = (typeof PAGE_SHAPES)[number];

export const PAGE_SHAPE_WIDTHS = [120, 200, 280] as const;
export const PAGE_SHAPE_HEIGHTS = [48, 80, 120] as const;

export type PageShapeAttrs = {
  height: (typeof PAGE_SHAPE_HEIGHTS)[number];
  kind: PageShapeKind;
  tone: PageTone | null;
  width: (typeof PAGE_SHAPE_WIDTHS)[number];
};

export type PageMarkAttrs = {
  font: PageFont | null;
  size: PageSize | null;
  tone: PageTone | null;
  underline: boolean;
};

export type TextSegment = PageMarkAttrs & {
  text: string;
};

export const PAGE_FONT_LABELS: Record<PageFont, string> = {
  mono: "Mono",
  sans: "Sans",
  serif: "Serif",
};

export const PAGE_SIZE_LABELS: Record<PageSize, string> = {
  huge: "Très grand",
  large: "Grand",
  small: "Petit",
};

export const PAGE_SHAPE_LABELS: Record<PageShapeKind, string> = {
  arrow: "Flèche",
  ellipse: "Ellipse",
  line: "Ligne",
  rect: "Rectangle",
};

export const PAGE_TONE_LABELS: Record<PageTone, string> = {
  destructive: "Erreur",
  info: "Information",
  success: "Validation",
  warning: "Important",
};

/** Classes Tailwind de la police de lecture, sur l'éditeur visuel. */
export const PAGE_FONT_CLASS: Record<PageFont, string> = {
  mono: "font-mono",
  sans: "font-sans",
  serif: "font-serif",
};

/** Classes Tailwind d'une zone. Chaînes complètes pour le scan Tailwind. */
export const PAGE_MARK_FONT_CLASS: Record<PageFont, string> = {
  mono: "font-mono",
  sans: "font-sans",
  serif: "font-serif",
};

export const PAGE_MARK_TONE_CLASS: Record<PageTone, string> = {
  destructive: "text-destructive",
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
};

export const PAGE_MARK_SIZE_CLASS: Record<PageSize, string> = {
  huge: "text-2xl",
  large: "text-lg",
  small: "text-sm",
};

const PAGE_SIZE_CSS: Record<PageSize, string> = {
  huge: "1.5rem",
  large: "1.125rem",
  small: "0.875rem",
};

/**
 * Couleurs d'export, hors de l'application : le HTML, Word et le PDF ne
 * voient pas les jetons CSS. Ce sont des approximations des accents.
 */
export const PAGE_TONE_HEX: Record<PageTone, string> = {
  destructive: "C4382F",
  info: "2F6FED",
  success: "1F8A4C",
  warning: "B86E00",
};

const PAGE_FONT_FAMILY: Record<PageFont, string> = {
  mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  serif: "Georgia, 'Times New Roman', Times, serif",
};

export function isPageFont(value: unknown): value is PageFont {
  return (
    typeof value === "string" &&
    (PAGE_FONTS as readonly string[]).includes(value)
  );
}

export function isPageTone(value: unknown): value is PageTone {
  return (
    typeof value === "string" &&
    (PAGE_TONES as readonly string[]).includes(value)
  );
}

export function isPageSize(value: unknown): value is PageSize {
  return (
    typeof value === "string" &&
    (PAGE_SIZES as readonly string[]).includes(value)
  );
}

export function isPageShapeKind(value: unknown): value is PageShapeKind {
  return (
    typeof value === "string" &&
    (PAGE_SHAPES as readonly string[]).includes(value)
  );
}

function shapeNumber<T extends number>(
  value: string,
  allowed: readonly T[]
): T | null {
  const parsed = Number(value);
  return allowed.includes(parsed as T) ? (parsed as T) : null;
}

/** Une police illisible vaut sans : le réglage ne disparaît pas, il se réduit. */
export function normalizePageFont(value: unknown): PageFont {
  return isPageFont(value) ? value : "sans";
}

/**
 * Lit les attributs d'une balise `<m>`.
 *
 * `null` signifie que la balise n'est pas la nôtre (attribut inconnu, guillemets
 * manquants). Un `font` ou un `tone` hors liste est ignoré, et la balise reste
 * valide : police, taille, couleur et soulignement absents.
 */
export function readPageMarkTag(attrSource: string): PageMarkAttrs | null {
  const rest = attrSource.trim();
  if (!rest) {
    return { font: null, size: null, tone: null, underline: false };
  }
  const pattern = /\s*(font|size|tone|underline)="([^"]*)"/g;
  let consumed = 0;
  let font: PageFont | null = null;
  let size: PageSize | null = null;
  let tone: PageTone | null = null;
  let underline = false;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(rest))) {
    if (match.index !== consumed) {
      return null;
    }
    if (match[1] === "font") {
      font = isPageFont(match[2]) ? match[2] : null;
    } else if (match[1] === "size") {
      size = isPageSize(match[2]) ? match[2] : null;
    } else if (match[1] === "underline") {
      underline = match[2] === "1";
    } else {
      tone = isPageTone(match[2]) ? match[2] : null;
    }
    consumed = match.index + match[0].length;
  }
  if (consumed !== rest.length) {
    return null;
  }
  return { font, size, tone, underline };
}

export function readPageShapeTag(attrSource: string): PageShapeAttrs | null {
  const rest = attrSource.trim();
  const pattern = /\s*(height|kind|tone|width)="([^"]*)"/g;
  let consumed = 0;
  let height: PageShapeAttrs["height"] | null = null;
  let kind: PageShapeKind | null = null;
  let tone: PageTone | null = null;
  let width: PageShapeAttrs["width"] | null = null;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(rest))) {
    if (match.index !== consumed) {
      return null;
    }
    if (match[1] === "kind") {
      kind = isPageShapeKind(match[2]) ? match[2] : null;
    } else if (match[1] === "tone") {
      tone = isPageTone(match[2]) ? match[2] : null;
    } else if (match[1] === "width") {
      width = shapeNumber(match[2], PAGE_SHAPE_WIDTHS);
    } else {
      height = shapeNumber(match[2], PAGE_SHAPE_HEIGHTS);
    }
    consumed = match.index + match[0].length;
  }
  if (!rest || consumed !== rest.length || !kind || !width || !height) {
    return null;
  }
  return { height, kind, tone, width };
}

export function formatPageMark(inner: string, attrs: PageMarkAttrs): string {
  const parts: string[] = [];
  if (attrs.font) {
    parts.push(`font="${attrs.font}"`);
  }
  if (attrs.size) {
    parts.push(`size="${attrs.size}"`);
  }
  if (attrs.tone) {
    parts.push(`tone="${attrs.tone}"`);
  }
  if (attrs.underline) {
    parts.push('underline="1"');
  }
  if (parts.length === 0) {
    return inner;
  }
  return `<m ${parts.join(" ")}>${inner}</m>`;
}

export function formatPageShape(attrs: PageShapeAttrs): string {
  const parts = [
    `kind="${attrs.kind}"`,
    `width="${attrs.width}"`,
    `height="${attrs.height}"`,
  ];
  if (attrs.tone) {
    parts.push(`tone="${attrs.tone}"`);
  }
  return `<shape ${parts.join(" ")}></shape>`;
}

export function pageMarkCss(attrs: PageMarkAttrs): string {
  const parts: string[] = [];
  if (attrs.font) {
    parts.push(`font-family:${PAGE_FONT_FAMILY[attrs.font]}`);
  }
  if (attrs.size) {
    parts.push(`font-size:${PAGE_SIZE_CSS[attrs.size]}`);
  }
  if (attrs.tone) {
    parts.push(`color:#${PAGE_TONE_HEX[attrs.tone]}`);
  }
  if (attrs.underline) {
    parts.push("text-decoration:underline");
  }
  return parts.join(";");
}

export function docxFontName(font: PageFont): string {
  if (font === "serif") {
    return "Times New Roman";
  }
  if (font === "mono") {
    return "Consolas";
  }
  return "Calibri";
}

export function pdfFontName(
  font: PageFont | null,
  weight: "bold" | "italic" | "regular"
): string {
  const family = font ?? "sans";
  if (family === "serif") {
    if (weight === "bold") {
      return "Times-Bold";
    }
    if (weight === "italic") {
      return "Times-Italic";
    }
    return "Times-Roman";
  }
  if (family === "mono") {
    if (weight === "bold") {
      return "Courier-Bold";
    }
    if (weight === "italic") {
      return "Courier-Oblique";
    }
    return "Courier";
  }
  if (weight === "bold") {
    return "Helvetica-Bold";
  }
  if (weight === "italic") {
    return "Helvetica-Oblique";
  }
  return "Helvetica";
}

const SHAPE_PATTERN = /<shape\b([^>]*)>\s*<\/shape>/gi;

/** Retire les formes valides avant le détecteur HTML. */
export function concealValidPageShapes(source: string): string {
  return source.replace(SHAPE_PATTERN, (full, attrs: string) =>
    readPageShapeTag(attrs) ? "" : full
  );
}

const MARK_PATTERN = /<m\b([^>]*)>([\s\S]*?)<\/m>/gi;

/** Retire les balises valides pour le détecteur HTML, en gardant le texte. */
export function concealValidPageMarks(source: string): string {
  return source.replace(MARK_PATTERN, (full, attrs: string, inner: string) =>
    readPageMarkTag(attrs) ? inner : full
  );
}

export function locatePageMark(source: string): {
  attrs: PageMarkAttrs;
  index: number;
  inner: string;
  raw: string;
} | null {
  const pattern = /<m\b([^>]*)>([\s\S]*?)<\/m>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source))) {
    const attrs = readPageMarkTag(match[1] ?? "");
    if (!attrs) {
      continue;
    }
    return {
      attrs,
      index: match.index,
      inner: match[2] ?? "",
      raw: match[0],
    };
  }
  return null;
}

/**
 * Découpe un fragment qui peut contenir des `<m>`.
 *
 * `stack` est conservé par l'appelant : une balise ouverte dans un jeton
 * se ferme dans le suivant. Une balise invalide reste du texte.
 */
export function takePageMarkSegments(
  text: string,
  stack: PageMarkAttrs[]
): TextSegment[] {
  const segments: TextSegment[] = [];
  const pattern = /<m\b([^>]*)>|<\/m>/gi;
  let last = 0;
  let match: RegExpExecArray | null;
  const push = (value: string) => {
    if (!value) {
      return;
    }
    const top = stack.at(-1);
    segments.push({
      font: top?.font ?? null,
      size: top?.size ?? null,
      text: value,
      tone: top?.tone ?? null,
      underline: top?.underline ?? false,
    });
  };
  while ((match = pattern.exec(text))) {
    push(text.slice(last, match.index));
    if (match[0].toLowerCase() === "</m>") {
      stack.pop();
    } else {
      const parsed = readPageMarkTag(match[1] ?? "");
      if (parsed) {
        stack.push(parsed);
      } else {
        push(match[0]);
      }
    }
    last = match.index + match[0].length;
  }
  push(text.slice(last));
  return segments;
}

function decodeHtmlAttr(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/**
 * Le rendu Markdown échappe le HTML. On ne réinjecte un `<span>` que pour
 * une balise `<m>` valide : le style vient de la liste fermée, jamais de
 * l'attribut lui-même.
 */
export function revealPageMarks(html: string): string {
  const pattern = /&lt;m\b([\s\S]*?)&gt;([\s\S]*?)&lt;\/m&gt;/gi;
  return html.replace(pattern, (full, attrs: string, inner: string) => {
    const parsed = readPageMarkTag(decodeHtmlAttr(attrs));
    if (!parsed) {
      return full;
    }
    const content = revealPageMarks(inner);
    if (!parsed.font && !parsed.size && !parsed.tone && !parsed.underline) {
      return content;
    }
    return `<span style="${pageMarkCss(parsed)}">${content}</span>`;
  });
}
