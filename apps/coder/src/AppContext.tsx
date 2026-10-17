import { createContext, type ReactNode, useContext, useMemo } from "react";
import type { TFunction } from "./i18n";

export type AppShell = NonNullable<Window["maiShell"]> | undefined;

export interface AppContextValue {
  shell: AppShell;
  t: TFunction;
  workspace: string | null;
}

type ShellSlice = { shell: AppShell };
type WorkspaceSlice = { workspace: string | null };
type TSlice = { t: TFunction };

const ShellSliceContext = createContext<ShellSlice | null>(null);
const WorkspaceSliceContext = createContext<WorkspaceSlice | null>(null);
const AppTSliceContext = createContext<TSlice | null>(null);

function useShellSlice(): ShellSlice {
  const ctx = useContext(ShellSliceContext);
  if (!ctx) {
    throw new Error(
      "useAppShell / useAppContext must be used within AppProvider"
    );
  }
  return ctx;
}

function useWorkspaceSlice(): WorkspaceSlice {
  const ctx = useContext(WorkspaceSliceContext);
  if (!ctx) {
    throw new Error(
      "useAppWorkspace / useAppContext must be used within AppProvider"
    );
  }
  return ctx;
}

function useTSlice(): TSlice {
  const ctx = useContext(AppTSliceContext);
  if (!ctx) {
    throw new Error(
      "useAppShellT / useAppContext must be used within AppProvider"
    );
  }
  return ctx;
}

/** 仅订阅 IPC shell；workspace / 语言变化不会触发本 hook 的消费者重渲染。 */
export function useAppShell(): AppShell {
  return useShellSlice().shell;
}

/** 仅订阅当前工作区路径。 */
export function useAppWorkspace(): string | null {
  return useWorkspaceSlice().workspace;
}

/** 仅订阅 `t`（随 locale / 字典更新而变）。 */
export function useAppShellT(): TFunction {
  return useTSlice().t;
}

/** 同时订阅 shell、workspace、t（与未分层前行为一致）。 */
export function useAppContext(): AppContextValue {
  return {
    shell: useAppShell(),
    t: useAppShellT(),
    workspace: useAppWorkspace(),
  };
}

export function AppProvider({
  shell,
  workspace,
  t,
  children,
}: AppContextValue & { children: ReactNode }) {
  const shellValue = useMemo(() => ({ shell }), [shell]);
  const workspaceValue = useMemo(() => ({ workspace }), [workspace]);
  const tValue = useMemo(() => ({ t }), [t]);

  return (
    <ShellSliceContext.Provider value={shellValue}>
      <WorkspaceSliceContext.Provider value={workspaceValue}>
        <AppTSliceContext.Provider value={tValue}>
          {children}
        </AppTSliceContext.Provider>
      </WorkspaceSliceContext.Provider>
    </ShellSliceContext.Provider>
  );
}
