import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
  componentStack: string | null;
  resetState: "idle" | "pending" | "done" | "failed";
  resetMessage: string | null;
};

type AsyncShellLike = {
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
};

function getAsyncShell(): AsyncShellLike | null {
  const w = window as unknown as { asyncShell?: AsyncShellLike };
  return w.asyncShell ?? null;
}

/**
 * 渲染进程根错误兜底：避免初始化时单点异常把整个窗口顶成黑屏。
 * 命中时显示故障页：重载、备份并重置当前工作区 .mai/ 目录。
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = {
    componentStack: null,
    error: null,
    resetMessage: null,
    resetState: "idle",
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.setState({ componentStack: info.componentStack ?? null });
    console.error("[AppErrorBoundary] caught render error", error, info);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleResetAsync = async (): Promise<void> => {
    const shell = getAsyncShell();
    if (!shell) {
      this.setState({
        resetMessage: "IPC bridge unavailable.",
        resetState: "failed",
      });
      return;
    }
    this.setState({ resetMessage: null, resetState: "pending" });
    try {
      const result = (await shell.invoke("workspaceAgent:resetAsyncDir")) as
        | { ok: true; backupPath: string | null }
        | { ok: false; error: string };
      if (result.ok) {
        this.setState({
          resetMessage: result.backupPath
            ? `Backed up to ${result.backupPath}. Reload to continue.`
            : "No .mai folder was found. Reload to continue.",
          resetState: "done",
        });
      } else {
        this.setState({ resetMessage: result.error, resetState: "failed" });
      }
    } catch (e) {
      this.setState({
        resetMessage: (e as Error)?.message ?? String(e),
        resetState: "failed",
      });
    }
  };

  render(): ReactNode {
    const { error, componentStack, resetState, resetMessage } = this.state;
    if (!error) {
      return this.props.children;
    }
    const resetting = resetState === "pending";
    return (
      <div className="ref-app-error-boundary" role="alert">
        <div className="ref-app-error-boundary-card">
          <h1 className="ref-app-error-boundary-title">
            mAI Coder a rencontré un problème
          </h1>
          <p className="ref-app-error-boundary-msg">
            The window failed to initialize. This is often caused by a corrupted
            file under your workspace's
            <code>.mai/</code> folder (for example <code>.mai/agent.json</code>
            ). Try reloading first; if it still crashes, back up and reset that
            folder — your global settings are not affected.
          </p>
          <div className="ref-app-error-boundary-actions">
            <button
              className="ref-app-error-boundary-btn"
              onClick={this.handleReload}
              type="button"
            >
              Reload window
            </button>
            <button
              className="ref-app-error-boundary-btn"
              disabled={resetting || resetState === "done"}
              onClick={() => void this.handleResetAsync()}
              type="button"
            >
              {resetting ? "Resetting…" : "Back up & reset .mai/"}
            </button>
          </div>
          {resetMessage ? (
            <p
              className={`ref-app-error-boundary-status ${resetState === "failed" ? "is-error" : "is-ok"}`}
            >
              {resetMessage}
            </p>
          ) : null}
          <details className="ref-app-error-boundary-details">
            <summary>Technical details</summary>
            <pre className="ref-app-error-boundary-pre">
              {error.name}: {error.message}
              {error.stack ? `\n\n${error.stack}` : ""}
              {componentStack ? `\n\nComponent stack:${componentStack}` : ""}
            </pre>
          </details>
        </div>
      </div>
    );
  }
}
