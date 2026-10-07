/** 与 DOMRect 数值一致的可序列化快照，避免把 DOMRect 引用存进 React state 导致缩放后坐标不更新 */
export type CaretRectSnapshot = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

export function snapshotDomRect(
  r: DOMRect | null | undefined
): CaretRectSnapshot | null {
  if (!r) {
    return null;
  }
  return {
    bottom: r.bottom,
    height: r.height,
    left: r.left,
    right: r.right,
    top: r.top,
    width: r.width,
  };
}
