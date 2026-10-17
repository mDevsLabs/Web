import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "./i18n";

type AsyncShell = NonNullable<Window["maiShell"]>;

type Row = { kind: "recent"; path: string } | { kind: "home"; path: string };

type Props = {
  open: boolean;
  onClose: () => void;
  shell?: AsyncShell;
  homePath: string;
  onWorkspaceOpened: (path: string) => void;
};

function IconFolderPlus({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      height="18"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="18"
    >
      <path
        d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
        strokeLinejoin="round"
      />
      <path d="M12 11v6M9 14h6" strokeLinecap="round" />
    </svg>
  );
}

function IconFolder({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <path
        d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconHome({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <path
        d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        strokeLinejoin="round"
      />
      <polyline points="9 22 9 12 15 12 15 22" strokeLinejoin="round" />
    </svg>
  );
}

function IconDesktop({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <rect height="14" rx="2" width="20" x="2" y="3" />
      <path d="M8 21h8M12 17v4" strokeLinecap="round" />
    </svg>
  );
}

function IconCloud({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <path
        d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconServer({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <rect height="8" rx="2" width="20" x="2" y="2" />
      <rect height="8" rx="2" width="20" x="2" y="14" />
      <circle cx="6" cy="6" fill="currentColor" r="1" />
      <circle cx="6" cy="18" fill="currentColor" r="1" />
    </svg>
  );
}

function IconChevronRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      height="14"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="14"
    >
      <path d="M9 18l6-6-6-6" strokeLinecap="round" />
    </svg>
  );
}

export function OpenWorkspaceModal({
  open,
  onClose,
  shell,
  homePath,
  onWorkspaceOpened,
}: Props) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [recents, setRecents] = useState<string[]>([]);
  const [selected, setSelected] = useState(0);
  const [footerHint, setFooterHint] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reloadRecents = useCallback(async () => {
    if (!shell) {
      return;
    }
    const r = (await shell.invoke("workspace:listRecents")) as {
      paths?: string[];
    };
    setRecents(Array.isArray(r.paths) ? r.paths : []);
  }, [shell]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setQuery("");
    setFooterHint(null);
    void reloadRecents();
    setSelected(0);
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open, reloadRecents]);

  const rows: Row[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (p: string) => !q || p.toLowerCase().includes(q);
    const recentRows: Row[] = recents
      .filter(match)
      .map((path) => ({ kind: "recent" as const, path }));
    const homeMatch =
      !q ||
      q.includes("home") ||
      q.includes("主") ||
      (homePath && homePath.toLowerCase().includes(q));
    const tail: Row[] = [];
    if (homePath && homeMatch) {
      tail.push({ kind: "home", path: homePath });
    }
    return [...recentRows, ...tail];
  }, [recents, query, homePath]);

  useEffect(() => {
    if (selected >= rows.length) {
      setSelected(rows.length > 0 ? rows.length - 1 : 0);
    }
  }, [rows.length, selected]);

  const openRow = useCallback(
    async (row: Row) => {
      if (!shell) {
        setFooterHint(t("ws.needDesktop"));
        return;
      }
      setFooterHint(null);
      const r = (await shell.invoke("workspace:openPath", row.path)) as {
        ok: boolean;
        path?: string;
        error?: string;
      };
      if (r.ok && r.path) {
        onWorkspaceOpened(r.path);
        onClose();
      } else {
        setFooterHint(r.error ?? t("ws.openFailed"));
        void reloadRecents();
      }
    },
    [shell, onWorkspaceOpened, onClose, reloadRecents, t]
  );

  const onPickFolder = useCallback(async () => {
    if (!shell) {
      setFooterHint(t("ws.needDesktop"));
      return;
    }
    setFooterHint(null);
    const r = (await shell.invoke("workspace:pickFolder")) as {
      ok: boolean;
      path?: string;
    };
    if (r.ok && r.path) {
      onWorkspaceOpened(r.path);
      onClose();
    }
  }, [shell, onWorkspaceOpened, onClose, t]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) {
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((i) => Math.min(i + 1, Math.max(rows.length - 1, 0)));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && rows.length > 0) {
        e.preventDefault();
        const row = rows[selected];
        if (row) {
          void openRow(row);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, rows, selected, openRow]);

  if (!open) {
    return null;
  }

  return (
    <div className="ws-modal-backdrop" onClick={onClose} role="presentation">
      <div
        aria-labelledby="ws-modal-title"
        className="ws-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="ws-modal-head">
          <IconFolderPlus className="ws-modal-head-icon" />
          <h2 className="ws-modal-title" id="ws-modal-title">
            {t("ws.title")}
          </h2>
        </div>

        <div className="ws-modal-search-wrap">
          <input
            className="ws-modal-search"
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                if (e.key === "ArrowDown") {
                  setSelected((i) =>
                    Math.min(i + 1, Math.max(rows.length - 1, 0))
                  );
                } else {
                  setSelected((i) => Math.max(i - 1, 0));
                }
              }
              if (e.key === "Enter" && rows.length > 0) {
                e.preventDefault();
                const row = rows[selected];
                if (row) {
                  void openRow(row);
                }
              }
            }}
            placeholder={t("ws.filterPlaceholder")}
            ref={inputRef}
            type="text"
            value={query}
          />
        </div>

        <div className="ws-modal-scroll">
          <div className="ws-modal-section-label">{t("ws.recents")}</div>
          <div
            aria-label={t("ws.recentsAria")}
            className="ws-modal-list"
            role="listbox"
          >
            {rows.length === 0 ? (
              <div className="ws-modal-empty">{t("ws.empty")}</div>
            ) : (
              rows.map((row, i) => (
                <button
                  aria-selected={i === selected}
                  className={`ws-modal-row ${i === selected ? "is-selected" : ""}`}
                  key={row.kind === "home" ? "home" : row.path}
                  onClick={() => void openRow(row)}
                  onMouseEnter={() => setSelected(i)}
                  role="option"
                  type="button"
                >
                  {row.kind === "home" ? (
                    <IconHome className="ws-modal-row-icon" />
                  ) : (
                    <IconFolder className="ws-modal-row-icon" />
                  )}
                  <span className="ws-modal-row-text">
                    {row.kind === "home" ? t("ws.home") : row.path}
                  </span>
                </button>
              ))
            )}
          </div>

          <div className="ws-modal-section-label">{t("ws.runOn")}</div>
          <div className="ws-modal-runon">
            <button
              className="ws-modal-runon-row"
              disabled
              title={t("common.soon")}
              type="button"
            >
              <IconDesktop className="ws-modal-row-icon" />
              <span className="ws-modal-row-text">{t("ws.thisPc")}</span>
              <IconChevronRight className="ws-modal-chev" />
            </button>
            <button
              className="ws-modal-runon-row"
              disabled
              title={t("common.soon")}
              type="button"
            >
              <IconCloud className="ws-modal-row-icon" />
              <span className="ws-modal-row-text">{t("ws.asyncCloud")}</span>
              <IconChevronRight className="ws-modal-chev" />
            </button>
          </div>
        </div>

        <div className="ws-modal-footer">
          <button
            className="ws-modal-footer-btn"
            onClick={() => void onPickFolder()}
            type="button"
          >
            <IconFolder className="ws-modal-footer-icon" />
            {t("ws.openFolder")}
          </button>
          <button
            className="ws-modal-footer-btn"
            disabled
            title={t("common.soon")}
            type="button"
          >
            <IconServer className="ws-modal-footer-icon" />
            {t("ws.connectSsh")}
          </button>
        </div>
        {footerHint ? <p className="ws-modal-hint">{footerHint}</p> : null}
      </div>
    </div>
  );
}
