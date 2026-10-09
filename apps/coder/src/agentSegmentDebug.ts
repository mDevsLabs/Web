/* eslint-disable no-console -- 仅调试开关开启时输出 */
/**
 * 调试 Agent 消息分段 / 流式围栏渲染。
 * 在 DevTools 执行：localStorage.setItem('ASYNC_DEBUG_AGENT_SEGMENTS', '1') 后刷新。
 * 关闭：localStorage.removeItem('ASYNC_DEBUG_AGENT_SEGMENTS')
 */
const STORAGE_KEY = "ASYNC_DEBUG_AGENT_SEGMENTS";

export function agentSegmentDebugEnabled(): boolean {
  try {
    return (
      typeof localStorage !== "undefined" &&
      localStorage.getItem(STORAGE_KEY) === "1"
    );
  } catch {
    return false;
  }
}

export function agentSegmentDebugLog(...args: unknown[]): void {
  if (!agentSegmentDebugEnabled()) return;
  console.log("[agentSegments]", ...args);
}

export function segmentTypeHistogram(
  segments: { type: string }[]
): Record<string, number> {
  const h: Record<string, number> = {};
  for (const s of segments) {
    h[s.type] = (h[s.type] ?? 0) + 1;
  }
  return h;
}
