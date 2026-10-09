/**
 * 判断是否可跳过 loadMessages：仅当「当前选中线程」与「内存中消息绑定的线程」均为目标线程时成立。
 * 避免 messagesThreadId 尚未跟上侧栏切换时误判为同线程，进而错误清空流式 UI。
 */
export function shouldSkipReloadForSameThread(
  selectedThreadId: string,
  currentThreadId: string | null,
  messagesBoundThreadId: string | null
): boolean {
  return (
    currentThreadId === selectedThreadId &&
    messagesBoundThreadId === selectedThreadId
  );
}
