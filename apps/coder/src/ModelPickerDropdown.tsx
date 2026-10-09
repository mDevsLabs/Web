import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  type ClampedPopoverLayout,
  computeClampedPopoverLayout,
} from "./anchorPopoverLayout";
import { useI18n } from "./i18n";
import type { ThinkingLevel } from "./ipcTypes";
import { THINKING_EFFORT_IDS } from "./ipcTypes";

export type ModelPickerItem = {
  id: string;
  label: string;
  description: string;
  subtitle?: string;
  /** 弱化展示：模型所属提供商名称 */
  providerLabel?: string;
};

const OPTIONS_PANEL_W = 276;

function IconGlobe({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="14"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="14"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="14"
      stroke="currentColor"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
      width="14"
    >
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  items: ModelPickerItem[];
  selectedId: string;
  /** 点击某一模型行时切换当前对话模型 */
  onSelectModel: (id: string) => void;
  /** 在右栏底部「管理模型…」进入设置（非「编辑」按钮） */
  onNavigateToSettings: () => void;
  onAddModels: () => void;
  /** 按选择器 id（`auto` 或模型条目 id）读取/写入思考档位 */
  getThinkingLevel: (modelId: string) => ThinkingLevel;
  onThinkingLevelChange: (modelId: string, level: ThinkingLevel) => void;
};

type MenuLayout = ClampedPopoverLayout & { minWidth: number; listMinW: number };

export function ModelPickerDropdown({
  open,
  onClose,
  anchorRef,
  items,
  selectedId,
  onSelectModel,
  onNavigateToSettings,
  onAddModels,
  getThinkingLevel,
  onThinkingLevelChange,
}: Props) {
  const { t } = useI18n();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuLayout, setMenuLayout] = useState<MenuLayout>({
    left: 0,
    listMinW: 460,
    maxHeightPx: 400,
    minHeightPx: 160,
    minWidth: 460 + OPTIONS_PANEL_W,
    placement: "below",
    top: 100,
    width: 460 + OPTIONS_PANEL_W,
  });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  /** 点击「编辑」后展开右栏，并锁定为该条模型展示说明 */
  const [optsOpen, setOptsOpen] = useState(false);
  const [optsModelId, setOptsModelId] = useState<string | null>(null);
  const [rendered, setRendered] = useState(open);

  const panelModelId = optsOpen ? (optsModelId ?? selectedId) : selectedId;
  const thinkingLevel = getThinkingLevel(panelModelId);
  const thinkingOn = thinkingLevel !== "off";

  useEffect(() => {
    if (open) {
      setRendered(true);
      return;
    }
    if (!rendered) {
      return;
    }
    const id = window.setTimeout(() => setRendered(false), 120);
    return () => window.clearTimeout(id);
  }, [open, rendered]);

  useEffect(() => {
    if (open || rendered) {
      return;
    }
    setOptsOpen(false);
    setOptsModelId(null);
  }, [open, rendered]);

  const computeLayout = useCallback(() => {
    const el = anchorRef.current;
    if (!el) {
      return;
    }
    const menu = menuRef.current;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const listMinW = Math.max(420, Math.ceil(r.width));
    const totalW = listMinW + (optsOpen ? OPTIONS_PANEL_W : 0);
    const estimate = Math.min(420, Math.max(160, items.length * 52 + 140));
    const natural =
      menu && menu.scrollHeight > 48
        ? Math.max(menu.scrollHeight, estimate)
        : estimate;
    const L = computeClampedPopoverLayout(r, {
      contentHeight: natural,
      menuWidth: totalW,
      viewportHeight: vh,
      viewportWidth: vw,
    });
    setMenuLayout({ ...L, listMinW, minWidth: totalW });
  }, [anchorRef, items.length, optsOpen]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    computeLayout();
    const id0 = requestAnimationFrame(() => {
      computeLayout();
      requestAnimationFrame(() => computeLayout());
    });
    const menu = menuRef.current;
    const ro =
      menu && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => computeLayout())
        : null;
    if (menu && ro) {
      ro.observe(menu);
    }
    const onWin = () => computeLayout();
    window.addEventListener("resize", onWin);
    window.addEventListener("scroll", onWin, true);
    return () => {
      cancelAnimationFrame(id0);
      ro?.disconnect();
      window.removeEventListener("resize", onWin);
      window.removeEventListener("scroll", onWin, true);
    };
  }, [open, computeLayout, optsOpen]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onDoc = (e: MouseEvent) => {
      const tgt = e.target as Node;
      if (menuRef.current?.contains(tgt) || anchorRef.current?.contains(tgt)) {
        return;
      }
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, anchorRef]);

  if (!rendered) {
    return null;
  }

  const focusId =
    optsOpen && optsModelId ? optsModelId : (hoveredId ?? selectedId);
  const focusItem =
    items.find((i) => i.id === focusId) ??
    items.find((i) => i.id === selectedId);

  const setThinkingToggle = (modelId: string, on: boolean) => {
    const cur = getThinkingLevel(modelId);
    if (on) {
      onThinkingLevelChange(modelId, cur === "off" ? "medium" : cur);
    } else {
      onThinkingLevelChange(modelId, "off");
    }
  };

  const node = (
    <div
      className={`ref-model-dd ref-model-dd--split ${optsOpen ? "ref-model-dd--opts-open" : ""} ${menuLayout.placement === "above" ? "ref-model-dd--above" : ""} ${open ? "" : "is-closing"}`}
      ref={menuRef}
      role="presentation"
      style={{
        bottom: menuLayout.placement === "above" ? menuLayout.bottom : "auto",
        display: "flex",
        flexDirection: "column",
        left: menuLayout.left,
        maxHeight: menuLayout.maxHeightPx,
        minHeight: menuLayout.minHeightPx,
        minWidth: menuLayout.minWidth,
        overflow: "hidden",
        top: menuLayout.placement === "below" ? menuLayout.top : "auto",
        width: menuLayout.minWidth,
      }}
    >
      <div className="ref-model-dd-split">
        <div
          className="ref-model-dd-col ref-model-dd-col--list"
          onMouseLeave={() => setHoveredId(null)}
          style={{
            flexBasis: menuLayout.listMinW,
            maxWidth: menuLayout.listMinW,
          }}
        >
          <div
            aria-label={t("modelPicker.selectAria")}
            className="ref-model-dd-inner"
            role="listbox"
          >
            {items.length === 0 ? (
              <div className="ref-model-dd-empty">
                <p className="ref-model-dd-empty-text">
                  {t("modelPicker.emptyHint")}
                </p>
              </div>
            ) : null}
            {items.map((m) => {
              const isSel = selectedId === m.id;
              return (
                <div
                  aria-selected={isSel}
                  className={`ref-model-dd-row ${isSel ? "is-selected" : ""}`}
                  key={m.id}
                  onClick={() => {
                    void onSelectModel(m.id);
                    onClose();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      void onSelectModel(m.id);
                      onClose();
                    }
                  }}
                  onMouseEnter={() => setHoveredId(m.id)}
                  role="option"
                  tabIndex={0}
                >
                  <span aria-hidden className="ref-model-dd-globe">
                    <IconGlobe />
                  </span>
                  <span className="ref-model-dd-main">
                    <span className="ref-model-dd-title-row">
                      <span className="ref-model-dd-label" title={m.label}>
                        {m.label}
                      </span>
                    </span>
                    {m.providerLabel ? (
                      <span
                        className="ref-model-dd-provider-meta"
                        title={m.providerLabel}
                      >
                        {m.providerLabel}
                      </span>
                    ) : null}
                    {m.subtitle ? (
                      <span className="ref-model-dd-sub">{m.subtitle}</span>
                    ) : null}
                  </span>
                  <div className="ref-model-dd-trailing">
                    <button
                      className="ref-model-dd-edit"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOptsModelId(m.id);
                        setOptsOpen(true);
                      }}
                      type="button"
                    >
                      {t("modelPicker.edit")}
                    </button>
                    {isSel ? (
                      <span aria-hidden className="ref-model-dd-check">
                        <IconCheck />
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="ref-model-dd-sep" role="separator" />
          <button
            className="ref-model-dd-add"
            onClick={() => {
              onAddModels();
              onClose();
            }}
            type="button"
          >
            {t("modelPicker.addModels")}
          </button>
        </div>

        {optsOpen ? (
          <>
            <div aria-hidden className="ref-model-dd-col-divider" />

            <aside
              aria-label={t("thinking.panelAria")}
              className="ref-model-dd-col ref-model-dd-col--opts"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                className="ref-model-opts-collapse"
                onClick={() => {
                  setOptsOpen(false);
                  setOptsModelId(null);
                }}
                type="button"
              >
                <svg
                  aria-hidden
                  className="ref-model-opts-collapse-chev"
                  fill="none"
                  height="14"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  viewBox="0 0 24 24"
                  width="14"
                >
                  <path
                    d="M15 18l-6-6 6-6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {t("thinking.collapsePanel")}
              </button>

              <div className="ref-model-opts-focus">
                <span className="ref-model-opts-focus-name">
                  {focusItem?.label ?? "—"}
                </span>
                <p className="ref-model-opts-focus-desc">
                  {focusItem?.description ?? ""}
                </p>
              </div>

              <p className="ref-model-opts-hint">{t("thinking.panelHint")}</p>

              <div className="ref-model-opts-section">
                {t("thinking.section.options")}
              </div>
              <div className="ref-model-opts-toggle-row">
                <span className="ref-model-opts-toggle-label">
                  {t("thinking.toggleLabel")}
                </span>
                <button
                  aria-checked={thinkingOn}
                  className={`ref-model-opts-switch ${thinkingOn ? "is-on" : ""}`}
                  onClick={() => setThinkingToggle(panelModelId, !thinkingOn)}
                  role="switch"
                  type="button"
                >
                  <span className="ref-model-opts-switch-knob" />
                </button>
              </div>

              <div className="ref-model-opts-section">
                {t("thinking.section.effort")}
              </div>
              <div
                className={`ref-model-opts-effort ${thinkingOn ? "" : "is-disabled"}`}
              >
                {THINKING_EFFORT_IDS.map((id) => {
                  const active = thinkingOn && thinkingLevel === id;
                  return (
                    <button
                      className={`ref-model-opts-effort-row ${active ? "is-active" : ""}`}
                      disabled={!thinkingOn}
                      key={id}
                      onClick={() => onThinkingLevelChange(panelModelId, id)}
                      type="button"
                    >
                      <span>{t(`thinking.effort.${id}`)}</span>
                      {active ? (
                        <span
                          aria-hidden
                          className="ref-model-opts-effort-check"
                        >
                          <IconCheck />
                        </span>
                      ) : (
                        <span
                          aria-hidden
                          className="ref-model-opts-effort-check-placeholder"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                className="ref-model-opts-settings-foot"
                onClick={() => {
                  onNavigateToSettings();
                  onClose();
                }}
                type="button"
              >
                {t("modelPicker.manageInSettings")}
              </button>
            </aside>
          </>
        ) : null}
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
