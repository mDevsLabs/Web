/**
 * Shell 模块统一导出
 */

// Provider 实现
export {
  BashShellProvider,
  createBashProvider,
  createBashProviderWithPath,
  findUnixShell,
} from "./bashProvider";
// Shell 检测和管理
export {
  detectShellProvider,
  getShellDiagnostics,
  getShellProvider,
  resetShellCache,
  setShellProvider,
} from "./detectShell";
export {
  createPowerShellProvider,
  createPowerShellProviderWithPath,
  findPowerShell,
  PowerShellProvider,
} from "./powershellProvider";
// 类型导出
export type {
  ShellCommandOptions,
  ShellCommandResult,
  ShellConfig,
  ShellProvider,
  ShellProviderFactory,
  ShellType,
} from "./shellProvider";
