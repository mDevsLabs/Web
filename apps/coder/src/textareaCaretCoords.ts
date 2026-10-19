function px(cssLen: string): number {
  const n = Number.parseFloat(cssLen);
  return Number.isFinite(n) ? n : 0;
}

/**
 * 测量 textarea 内某字符位置的视口矩形（用于 @ 菜单锚定到光标附近）。
 * 在视口内用与输入框相同的折行宽度 + scroll 偏移做镜像，避免离屏测量导致坐标错误。
 */
export function getCaretClientRect(
  textarea: HTMLTextAreaElement,
  position: number
): DOMRect {
  const taRect = textarea.getBoundingClientRect();
  const cs = getComputedStyle(textarea);
  const bl = px(cs.borderLeftWidth);
  const bt = px(cs.borderTopWidth);
  const pl = px(cs.paddingLeft);
  const pt = px(cs.paddingTop);

  const outer = document.createElement("div");
  outer.setAttribute("aria-hidden", "true");
  Object.assign(outer.style, {
    boxSizing: "border-box",
    height: `${textarea.clientHeight}px`,
    left: `${taRect.left + bl + pl}px`,
    overflow: "hidden",
    pointerEvents: "none",
    position: "fixed",
    top: `${taRect.top + bt + pt}px`,
    visibility: "hidden",
    width: `${textarea.clientWidth}px`,
    zIndex: "-1",
  });

  const inner = document.createElement("div");
  Object.assign(inner.style, {
    border: "none",
    boxSizing: "border-box",
    font: cs.font,
    letterSpacing: cs.letterSpacing,
    lineHeight: cs.lineHeight,
    margin: "0",
    overflowWrap: "break-word",
    padding: "0",
    textAlign: cs.textAlign,
    textIndent: cs.textIndent,
    textTransform: cs.textTransform,
    transform: `translate(${-textarea.scrollLeft}px, ${-textarea.scrollTop}px)`,
    whiteSpace: "pre-wrap",
    width: `${textarea.clientWidth}px`,
    wordSpacing: cs.wordSpacing,
    wordWrap: "break-word",
  });

  const before = textarea.value.slice(0, position);
  inner.textContent = before;
  const span = document.createElement("span");
  span.textContent =
    position < textarea.value.length
      ? textarea.value.charAt(position)
      : "\u200b";
  inner.appendChild(span);

  outer.appendChild(inner);
  document.body.appendChild(outer);
  const r = span.getBoundingClientRect();
  document.body.removeChild(outer);

  const lineH = px(cs.lineHeight) || px(cs.fontSize) * 1.25;
  if (!Number.isFinite(r.left) || !Number.isFinite(r.top)) {
    return new DOMRect(taRect.left + bl, taRect.bottom - lineH, 1, lineH);
  }
  return new DOMRect(
    r.left,
    r.top,
    Math.max(r.width, 1),
    Math.max(r.height, lineH)
  );
}
