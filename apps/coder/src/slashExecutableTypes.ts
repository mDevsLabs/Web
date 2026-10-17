/**
 * 可执行斜杠命令的扩展点。
 * 当前仅类型与占位注册表；具体 IPC 与 handler 实现留待后续阶段接入。
 */

/** 命令执行完成后是否再发起一轮模型请求 */
export type SlashExecutableShouldQuery = boolean;

export type SlashExecutableContext = {
  threadId: string;
  /** 斜杠后的参数（已 trim） */
  args: string;
};

/**
 * 渲染进程可注册的处理器：返回是否消费该命令（若 true，发送路径应跳过默认 chat:send 文本）。
 * 未来可与 `ipcRenderer.invoke('slash:execute', …)` 组合，由主进程执行后回传结果再决定是否 query。
 */
export type SlashExecutableHandler = (ctx: SlashExecutableContext) => Promise<{
  handled: boolean;
  /** 若 handled 且需追加用户可见说明 */
  userMessage?: string;
  shouldQuery?: SlashExecutableShouldQuery;
}>;

const handlers = new Map<string, SlashExecutableHandler>();

export function registerSlashExecutable(
  slashName: string,
  handler: SlashExecutableHandler
): () => void {
  const key = slashName.trim().replace(/^\//, "").toLowerCase();
  if (!key) {
    return () => {};
  }
  handlers.set(key, handler);
  return () => {
    handlers.delete(key);
  };
}

export function getSlashExecutableHandler(
  slashName: string
): SlashExecutableHandler | undefined {
  const key = slashName.trim().replace(/^\//, "").toLowerCase();
  return handlers.get(key);
}
