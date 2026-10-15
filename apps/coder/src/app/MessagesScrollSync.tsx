import { memo, type RefObject, useLayoutEffect } from "react";
import { useStreaming } from "../streamingStore";

export interface MessagesScrollSyncProps {
  hasConversation: boolean;
  pinMessagesToBottomRef: RefObject<boolean>;
  scheduleMessagesScrollToBottom: () => void;
  syncMessagesScrollIndicators: () => void;
}

/**
 * 流式跟随滚动：订阅 streamingStore 的 streaming 字段，仅该子组件按 token 重渲染，
 * 粘底时每次 token 变化都调度一帧合并滚动，App 根不再因 streaming 重渲染。
 */
export const MessagesScrollSync = memo(function MessagesScrollSync({
  hasConversation,
  pinMessagesToBottomRef,
  scheduleMessagesScrollToBottom,
  syncMessagesScrollIndicators,
}: MessagesScrollSyncProps) {
  const streaming = useStreaming();
  useLayoutEffect(() => {
    if (!hasConversation) return;
    if (pinMessagesToBottomRef.current) {
      scheduleMessagesScrollToBottom();
    }
    const rafId = requestAnimationFrame(() => {
      syncMessagesScrollIndicators();
    });
    return () => cancelAnimationFrame(rafId);
  }, [
    hasConversation,
    streaming,
    pinMessagesToBottomRef,
    scheduleMessagesScrollToBottom,
    syncMessagesScrollIndicators,
  ]);
  return null;
});
