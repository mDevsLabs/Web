import { createContext, type ReactNode } from "react";

/** 聊天输入区核心动作：由 App 注入，避免经 sharedComposerProps 每层传递新函数引用 */
export type ComposerActionsValue = {
  onSend: () => void;
  onAbort: () => void;
  onNewThread: () => void;
  onExplorerOpenFile: (rel: string) => void;
};

export const ComposerActionsContext =
  createContext<ComposerActionsValue | null>(null);

export function ComposerActionsProvider({
  value,
  children,
}: {
  value: ComposerActionsValue;
  children: ReactNode;
}) {
  return (
    <ComposerActionsContext.Provider value={value}>
      {children}
    </ComposerActionsContext.Provider>
  );
}
