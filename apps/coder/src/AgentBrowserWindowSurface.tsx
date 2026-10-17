import { memo, useCallback, useEffect, useState } from "react";
import { useAppShellChromeCore } from "./app/appShellContexts";
import { hideBootSplash } from "./bootSplash";
import {
  AgentRightSidebarBrowserPanel,
  type BrowserControlPayload,
  isBrowserControlPayload,
} from "./browserSurface";

export const AgentBrowserWindowSurface = memo(
  function AgentBrowserWindowSurface() {
    const { shell } = useAppShellChromeCore();
    const [pendingBrowserCommands, setPendingBrowserCommands] = useState<
      BrowserControlPayload[]
    >([]);

    const openBrowserSettingsInHost = useCallback(() => {
      void shell
        ?.invoke("app:requestOpenSettings", { nav: "browser" })
        .catch(() => {
          /* ignore */
        });
    }, [shell]);

    useEffect(() => {
      hideBootSplash();
    }, []);

    const closeWindow = useCallback(() => {
      void shell?.invoke("app:windowClose").catch(() => {
        /* ignore */
      });
    }, [shell]);

    useEffect(() => {
      const subscribe = shell?.subscribeBrowserControl;
      if (!subscribe) {
        return;
      }
      const unsubscribe = subscribe((payload) => {
        if (!isBrowserControlPayload(payload)) {
          return;
        }
        if (payload.type === "closeSidebar") {
          closeWindow();
          return;
        }
        setPendingBrowserCommands((prev) => [...prev, payload]);
      });
      return () => {
        unsubscribe?.();
      };
    }, [closeWindow, shell]);

    useEffect(() => {
      if (!shell) {
        return;
      }
      void shell.invoke("browser:windowReady").catch(() => {
        /* ignore */
      });
    }, [shell]);

    const handleBrowserCommandHandled = useCallback((commandId: string) => {
      setPendingBrowserCommands((prev) =>
        prev.filter((command) => command.commandId !== commandId)
      );
    }, []);

    return (
      <div className="ref-browser-window-root">
        <AgentRightSidebarBrowserPanel
          closeSidebar={closeWindow}
          hasAgentPlanSidebarContent={false}
          onCommandHandled={handleBrowserCommandHandled}
          onOpenBrowserSettings={openBrowserSettingsInHost}
          openView={() => {}}
          pendingCommand={pendingBrowserCommands[0] ?? null}
          variant="window"
        />
      </div>
    );
  }
);
