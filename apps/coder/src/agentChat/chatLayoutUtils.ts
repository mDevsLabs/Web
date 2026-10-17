import type { AgentLifecycleStatus } from "../agentSessionTypes";
import type { TFunction } from "../i18n";

/** 未测量行时用于高度预算的估算高度（与旧虚拟列表 estimate 对齐） */
export const ESTIMATED_MESSAGE_ROW_PX = 160;
/** 目标：已渲染轨道总高度至少为视口高度的倍数 + 额外缓冲，避免首屏过短 */
export const HEIGHT_BUDGET_VIEWPORT_MULT = 2;
export const HEIGHT_BUDGET_OVERSCAN_PX = 400;
/** 顶部哨兵触发时再往上加载的近似高度（约一整屏 + 边距） */
export const SCROLL_UP_LOAD_VIEWPORT_MULT = 1;
export const SCROLL_UP_LOAD_EXTRA_PX = 250;

export function startIndexForHeightBudget(
  len: number,
  targetContentPx: number,
  getRowHeight: (i: number) => number,
  gapPx: number
): number {
  if (len <= 0) {
    return 0;
  }
  let sum = 0;
  for (let i = len - 1; i >= 0; i--) {
    sum += getRowHeight(i);
    if (i < len - 1) {
      sum += gapPx;
    }
    if (sum >= targetContentPx) {
      return i;
    }
  }
  return 0;
}

export function expandStartIndexByPixelBudget(
  currentStart: number,
  pixelBudget: number,
  getRowHeight: (i: number) => number,
  gapPx: number
): number {
  if (currentStart <= 0 || pixelBudget <= 0) {
    return currentStart;
  }
  let add = 0;
  let newStart = currentStart;
  while (newStart > 0 && add < pixelBudget) {
    newStart--;
    add += getRowHeight(newStart) + gapPx;
  }
  return newStart;
}

export function sanitizeTeamCriteria(criteria?: readonly string[]): string[] {
  if (!criteria || criteria.length === 0) {
    return [];
  }
  return criteria.map((item) => String(item ?? "").trim()).filter(Boolean);
}

export function agentStatusLabel(
  t: TFunction,
  status: AgentLifecycleStatus
): string {
  switch (status) {
    case "running":
      return t("agent.session.status.running");
    case "waiting_input":
      return t("agent.session.status.waiting");
    case "completed":
      return t("agent.session.status.completed");
    case "failed":
      return t("agent.session.status.failed");
    case "closed":
      return t("agent.session.status.closed");
    default:
      return status;
  }
}
