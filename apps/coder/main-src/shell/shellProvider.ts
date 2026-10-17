/**
 * Shell Provider 抽象接口
 *
 * Shell Provider 抽象接口，提供：
 * - 统一的 Shell 执行接口
 * - 支持多种 Shell (bash, zsh, powershell)
 * - 易于扩展新的 Shell 类型
 */

/** Shell 类型 */
export type ShellType = "bash" | "zsh" | "powershell" | "cmd";

/** Shell 执行结果 */
export interface ShellCommandResult {
  args: string[];
  command: string;
  cwd?: string;
}

/**
 * Shell Provider 接口
 *
 * 每种 Shell 需要实现此接口，提供：
 * - Shell 路径
 * - 命令构建逻辑
 * - 平台特定处理
 */
export interface ShellProvider {
  /**
   * 构建执行命令
   * 
   @param userCommand - 用户要执行的命令
   @param options - 执行选项
   @returns 构建后的命令和参数
   */
  buildCommand(
    userCommand: string,
    options?: ShellCommandOptions
  ): ShellCommandResult;

  /**
   * 获取交互式 Shell 的参数
   * 例如: bash -> ['-i'], powershell -> ['-NoExit']
   */
  getInteractiveArgs(): string[];

  /**
   * 是否为交互式 Shell
   * 用于 PTY 终端场景
   */
  isInteractive(): boolean;

  /** Shell 可执行文件路径 */
  readonly shellPath: string;
  /** Shell 类型名称 */
  readonly type: ShellType;
}

/** Shell 命令选项 */
export interface ShellCommandOptions {
  /** 命令 ID（用于追踪） */
  commandId?: string;
  /** 工作目录 */
  cwd?: string;
  /** 沙箱临时目录 */
  sandboxTmpDir?: string;
  /** 是否使用沙箱模式 */
  useSandbox?: boolean;
}

/**
 * Shell Provider 工厂函数类型
 */
export type ShellProviderFactory = () => Promise<ShellProvider>;

/**
 * Shell 配置
 */
export interface ShellConfig {
  /** 是否为首选 Shell */
  isPreferred: boolean;
  provider: ShellProvider;
}
