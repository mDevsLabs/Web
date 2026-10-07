import { useEffect, useRef, useState } from "react";
import { PtyTerminalView } from "./PtyTerminalView";

type Props = {
  /** 创建会话前提示 */
  placeholder: string;
};

/** 侧栏抽屉内单会话 PTY，关闭抽屉时 kill */
export function DrawerPtyTerminal({ placeholder }: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const idRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let pendingId: string | null = null;
    void (async () => {
      const sh = window.maiShell;
      if (!sh) {
        return;
      }
      const r = (await sh.invoke("term:sessionCreate")) as {
        ok: boolean;
        session?: { id: string };
      };
      // Race: si unmount pendant l'await, tue immédiatement la session orpheline
      // au lieu de la laisser fantôme (node-pty).
      if (!r.ok || !r.session?.id) {
        return;
      }
      if (cancelled) {
        void window.maiShell
          ?.invoke("term:sessionKill", r.session.id)
          .catch(() => {});
        return;
      }
      pendingId = r.session.id;
      idRef.current = r.session.id;
      setSessionId(r.session.id);
    })();
    return () => {
      cancelled = true;
      const killId = idRef.current ?? pendingId;
      idRef.current = null;
      if (killId) {
        void window.maiShell
          ?.invoke("term:sessionKill", killId)
          .catch(() => {});
      }
    };
  }, []);

  if (!sessionId) {
    return <div className="pty-drawer-placeholder muted">{placeholder}</div>;
  }

  return <PtyTerminalView active compactChrome sessionId={sessionId} />;
}
