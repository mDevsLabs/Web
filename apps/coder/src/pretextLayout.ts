/**
 * 使用 @chenglou/pretext 在浏览器内做纯算术排版测算，避免依赖 DOM 测量做高度猜测。
 * @see https://github.com/chenglou/pretext
 */
import { layout, prepare } from "@chenglou/pretext";

/** Pretext README：避免单独使用 system-ui 以保证各平台测量一致 */
const UI_SANS =
  'ui-sans-serif, "Segoe UI", Roboto, "Helvetica Neue", sans-serif';

const AT_MENU_LABEL_FONT = `500 13px ${UI_SANS}`;
const AT_MENU_SUB_FONT = `400 11px ${UI_SANS}`;
const AT_MENU_LABEL_LH = 13 * 1.35;
const AT_MENU_SUB_LH = 11 * 1.4;

/** 与 .ref-at-menu 内行布局一致：行内边距 + 图标列 + 文本列可用宽度 */
function atMenuTextColumnWidth(menuWidthPx: number): number {
  const menuPadX = 12;
  const rowPadX = 20;
  const iconCol = 26;
  return Math.max(72, menuWidthPx - menuPadX - rowPadX - iconCol);
}

/**
 * 估算 @ 提及菜单内容总高度（px），用于 popover 贴边/翻转时 contentHeight，减少固定 56px/行带来的跳动。
 */
export function estimateAtMenuContentHeightPx(
  items: ReadonlyArray<{ label: string; subtitle?: string }>,
  menuWidthPx: number
): number {
  if (items.length === 0) {
    return 44;
  }
  const tw = atMenuTextColumnWidth(menuWidthPx);
  const rowPadY = 20;
  const subGap = 2;
  let sum = 12;
  for (const it of items) {
    const lp = prepare(it.label, AT_MENU_LABEL_FONT);
    let h = rowPadY + layout(lp, tw, AT_MENU_LABEL_LH).height;
    const sub = it.subtitle?.trim();
    if (sub) {
      const sp = prepare(sub, AT_MENU_SUB_FONT);
      h += subGap + layout(sp, tw, AT_MENU_SUB_LH).height;
    }
    sum += h;
  }
  return sum;
}

export const AGENT_DIFF_PREVIEW_FONT =
  '11px ui-monospace, "Cascadia Code", "SFMono-Regular", Consolas, monospace';
export const AGENT_DIFF_PREVIEW_LINE_HEIGHT_PX = 11 * 1.45;

/** 与 .ref-agent-diff-line 水平 padding 一致（约 12px ×2） */
export function agentDiffContentWidthPx(
  linesContainerClientWidth: number
): number {
  return Math.max(64, linesContainerClientWidth - 24);
}

/**
 * 按预览区最大像素高度，计算应展示的 diff 逻辑行数（支持长行自动折行后的真实高度）。
 */
export function countAgentDiffLinesForPreviewPx(
  lines: readonly string[],
  contentWidthPx: number,
  maxPreviewBodyPx: number
): number {
  const w = agentDiffContentWidthPx(contentWidthPx);
  let acc = 0;
  let n = 0;
  for (const line of lines) {
    const text = line.length === 0 ? "\u00a0" : line;
    const p = prepare(text, AGENT_DIFF_PREVIEW_FONT, {
      whiteSpace: "pre-wrap",
    });
    const h = layout(p, w, AGENT_DIFF_PREVIEW_LINE_HEIGHT_PX).height;
    if (acc + h > maxPreviewBodyPx && n > 0) {
      break;
    }
    acc += h;
    n++;
  }
  return Math.min(n, lines.length);
}

const EDIT_PREVIEW_FONT =
  "11.5px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const EDIT_PREVIEW_LINE_HEIGHT_PX = 11.5 * 1.55;

/** 与 .ref-edit-card-preview-line 一致：左右 padding + 符号列 + gap */
export function agentEditCodeColumnWidthPx(previewClientWidth: number): number {
  return Math.max(48, previewClientWidth - 40);
}

export type EditPreviewLine = { text: string };

/**
 * 流式尾部 / 折叠头部：在最大像素高度内截取预览行（每行单独 pre-wrap 测量，对齐 DOM）。
 */
export function sliceAgentEditPreviewLines<T extends EditPreviewLine>(
  lines: readonly T[],
  codeColumnWidthPx: number,
  maxBodyPx: number,
  mode: "head" | "tail"
): T[] {
  const w = agentEditCodeColumnWidthPx(codeColumnWidthPx);
  if (lines.length === 0) {
    return [];
  }
  if (mode === "head") {
    let acc = 0;
    const out: T[] = [];
    for (const line of lines) {
      const p = prepare(line.text || " ", EDIT_PREVIEW_FONT, {
        whiteSpace: "pre-wrap",
      });
      const h = layout(p, w, EDIT_PREVIEW_LINE_HEIGHT_PX).height;
      if (acc + h > maxBodyPx && out.length > 0) {
        break;
      }
      acc += h;
      out.push(line);
    }
    return out;
  }
  let acc = 0;
  const out: T[] = [];
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i]!;
    const p = prepare(line.text || " ", EDIT_PREVIEW_FONT, {
      whiteSpace: "pre-wrap",
    });
    const h = layout(p, w, EDIT_PREVIEW_LINE_HEIGHT_PX).height;
    if (acc + h > maxBodyPx && out.length > 0) {
      break;
    }
    acc += h;
    out.unshift(line);
  }
  return out;
}
