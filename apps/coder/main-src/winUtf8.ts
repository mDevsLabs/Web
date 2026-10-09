/**
 * Windows：为子进程设置常用 UTF-8 相关环境变量。
 *
 * 不在此用 `chcp 65001` 改当前进程的控制台：通过 `execFileSync`+`stdio:'inherit'`
 * 调用 cmd 会干扰 conhost 的行尾/换行处理，表现为 `console.log` 等多条日志挤成一行。
 * 主进程终端中文显示请用 Windows Terminal，或系统「区域设置 → 使用 Unicode UTF-8」。
 */
export function initWindowsConsoleUtf8(): void {
  if (process.platform !== "win32") {
    return;
  }
  if (!process.env.PYTHONUTF8) {
    process.env.PYTHONUTF8 = "1";
  }
}

/** PowerShell：管道默认编码常为系统 ANSI，强制 UTF-8 后再执行用户命令。 */
export function windowsPowerShellUtf8Command(userCommand: string): string {
  return (
    "[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false); " +
    "[Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false); " +
    "$OutputEncoding = [System.Text.UTF8Encoding]::new($false); " +
    userCommand
  );
}

/** cmd.exe：在运行用户命令前先切换代码页。 */
export function windowsCmdUtf8Prefix(command: string): string {
  return `chcp 65001>nul && ${command}`;
}
