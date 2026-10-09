import { FileTypeIcon } from "./fileTypeIcons";
import { voidShellDebugLog } from "./tabCloseDebug";

export type MarkdownTabView = "source" | "preview";

export type EditorTab = {
  id: string;
  filePath: string;
  dirty: boolean;
  /** 仅 `.md` / `.mdx`：当前为源码编辑或 Markdown 预览 */
  markdownView?: MarkdownTabView;
};

type Props = {
  tabs: EditorTab[];
  activeTabId: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
};

export function EditorTabBar({ tabs, activeTabId, onSelect, onClose }: Props) {
  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className="ref-tab-bar" role="tablist">
      {tabs.map((tab) => {
        const basename = tab.filePath.split(/[\\/]/).pop() ?? tab.filePath;
        const isActive = tab.id === activeTabId;
        return (
          <div
            className={`ref-tab-item ${isActive ? "is-active" : ""} ${tab.dirty ? "is-dirty" : ""}`}
            key={tab.id}
          >
            <div
              aria-selected={isActive}
              className="ref-tab-main"
              onClick={() => {
                voidShellDebugLog("editor-file-tab-select", {
                  activeTabId,
                  tabId: tab.id,
                  tabIds: tabs.map((x) => x.id),
                });
                onSelect(tab.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(tab.id);
                }
              }}
              role="tab"
              tabIndex={0}
              title={tab.filePath}
            >
              <span className="ref-tab-icon">
                <FileTypeIcon fileName={basename} isDirectory={false} />
              </span>
              <span className="ref-tab-label">{basename}</span>
              {tab.dirty ? (
                <span aria-label="unsaved" className="ref-tab-dot" />
              ) : null}
            </div>
            <button
              aria-label={`Close ${basename}`}
              className="ref-tab-close"
              onClick={(e) => {
                voidShellDebugLog("editor-file-tab-close-click", {
                  activeTabId,
                  button: e.button,
                  tabId: tab.id,
                  tabIds: tabs.map((x) => x.id),
                });
                e.preventDefault();
                e.stopPropagation();
                onClose(tab.id);
              }}
              onMouseDown={(e) => {
                if (e.button !== 0) return;
                voidShellDebugLog("editor-file-tab-close-mousedown", {
                  activeTabId,
                  button: e.button,
                  tabId: tab.id,
                  tabIds: tabs.map((x) => x.id),
                });
                e.preventDefault();
                e.stopPropagation();
                onClose(tab.id);
              }}
              type="button"
            >
              <svg
                aria-hidden
                fill="currentColor"
                height="12"
                viewBox="0 0 16 16"
                width="12"
              >
                <path d="M8 8.707l3.646 3.647.708-.708L8.707 8l3.647-3.646-.708-.708L8 7.293 4.354 3.646l-.708.708L7.293 8l-3.647 3.646.708.708L8 8.707z" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}

/** Generate a stable tab id from a file path */
export function tabIdFromPath(filePath: string): string {
  return `tab:${filePath.replace(/\\/g, "/")}`;
}
