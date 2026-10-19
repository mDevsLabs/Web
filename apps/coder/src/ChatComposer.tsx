import {
  type Dispatch,
  type KeyboardEvent,
  type RefObject,
  type SetStateAction,
  useContext,
} from "react";
import { ComposerActionsContext } from "./ComposerActionsContext";
import {
  type ComposerContextMeterState,
  ComposerGitBranchRow,
} from "./ComposerGitBranchRow";
import {
  type ComposerMode,
  ComposerModeIcon,
  composerModeLabel,
} from "./ComposerPlusMenu";
import { ComposerRichInput } from "./ComposerRichInput";
import type {
  ComposerSegment,
  PersistedComposerAttachment,
} from "./composerSegments";
import { useI18n } from "./i18n";
import {
  IconArrowUp,
  IconChevron,
  IconImageOutline,
  IconMic,
  IconStop,
} from "./icons";
import type { AtComposerSlot } from "./useComposerAtMention";

export type ComposerAnchorSlot = "hero" | "bottom" | "inline";

type ComposerRef = RefObject<HTMLDivElement | null>;

interface ChatComposerProps {
  atMentionKeyDown: (e: KeyboardEvent<HTMLDivElement>) => boolean;
  awaitingReply: boolean;
  canSend: boolean;
  /** 当前模型在设置中配置了上下文窗口时显示 Git 行左侧圆环 */
  composerContextMeter?: ComposerContextMeterState | null;
  composerGitBranchAnchorRef: RefObject<HTMLButtonElement | null>;
  composerMode: ComposerMode;
  composerPlaceholder: string;
  composerRichBottomRef: ComposerRef;
  composerRichHeroRef: ComposerRef;
  composerRichInlineRef: ComposerRef;
  extraClass?: string;
  followUpComposerPlaceholder: string;
  hasConversation: boolean;
  modelPickerOpen: boolean;
  modelPillBottomRef: ComposerRef;
  modelPillHeroRef: ComposerRef;
  modelPillInlineRef: ComposerRef;
  modelPillLabel: string;
  /** 未传时尝试使用 ComposerActionsContext（App 根已提供） */
  onAbort?: () => void;
  /** 打开 Git 分支菜单前关闭 + / 模型选择（稳定回调，避免 git 更新带动 composer props 失效） */
  onBeforeToggleGitBranchPicker?: () => void;
  onExplorerOpenFile?: (rel: string) => void;
  onNewThread?: () => void;
  onSend?: () => void;
  persistComposerAttachments: (
    files: File[]
  ) => Promise<PersistedComposerAttachment[]>;
  plusAnchorBottomRef: ComposerRef;
  plusAnchorHeroRef: ComposerRef;
  plusAnchorInlineRef: ComposerRef;
  plusMenuOpen: boolean;
  resendFromUserIndex: number | null;
  segments: ComposerSegment[];
  setInlineResendSegments: Dispatch<SetStateAction<ComposerSegment[]>>;
  setModelPickerAnchorSlot: (slot: ComposerAnchorSlot) => void;
  setModelPickerOpen: Dispatch<SetStateAction<boolean>>;
  setPlusMenuAnchorSlot: (slot: ComposerAnchorSlot) => void;
  setPlusMenuOpen: Dispatch<SetStateAction<boolean>>;
  setResendFromUserIndex: Dispatch<SetStateAction<number | null>>;
  setSegments: Dispatch<SetStateAction<ComposerSegment[]>>;
  showGitBranchRow?: boolean;
  skillInvokeKeyDown: (e: KeyboardEvent<HTMLDivElement>) => boolean;
  slashCommandKeyDown: (e: KeyboardEvent<HTMLDivElement>) => boolean;
  slot: ComposerAnchorSlot;
  syncComposerOverlays: (root: HTMLElement, slot: AtComposerSlot) => void;
  variant?: "stacked" | "editor-hero";
}

export function ChatComposer({
  slot,
  variant = "stacked",
  segments,
  setSegments,
  canSend,
  extraClass,
  showGitBranchRow = true,
  composerContextMeter = null,
  composerRichHeroRef,
  composerRichBottomRef,
  composerRichInlineRef,
  plusAnchorHeroRef,
  plusAnchorBottomRef,
  plusAnchorInlineRef,
  modelPillHeroRef,
  modelPillBottomRef,
  modelPillInlineRef,
  composerMode,
  hasConversation,
  composerPlaceholder,
  followUpComposerPlaceholder,
  plusMenuOpen,
  modelPickerOpen,
  modelPillLabel,
  awaitingReply,
  resendFromUserIndex,
  composerGitBranchAnchorRef,
  onBeforeToggleGitBranchPicker,
  setPlusMenuAnchorSlot,
  setModelPickerOpen,
  setPlusMenuOpen,
  setModelPickerAnchorSlot,
  onAbort,
  onSend,
  onNewThread,
  onExplorerOpenFile,
  persistComposerAttachments,
  syncComposerOverlays,
  setResendFromUserIndex,
  setInlineResendSegments,
  skillInvokeKeyDown,
  slashCommandKeyDown,
  atMentionKeyDown,
}: ChatComposerProps) {
  const { t } = useI18n();
  const injected = useContext(ComposerActionsContext);
  const onSendFn = injected?.onSend ?? onSend;
  const onAbortFn = injected?.onAbort ?? onAbort;
  const onNewThreadFn = injected?.onNewThread ?? onNewThread;
  const onExplorerOpenFileFn =
    injected?.onExplorerOpenFile ?? onExplorerOpenFile;
  if (!onSendFn || !onAbortFn || !onNewThreadFn || !onExplorerOpenFileFn) {
    throw new Error(
      "ChatComposer requires onSend/onAbort/onNewThread/onExplorerOpenFile or ComposerActionsProvider"
    );
  }
  const isHero = variant === "editor-hero";
  const richRef =
    slot === "hero"
      ? composerRichHeroRef
      : slot === "bottom"
        ? composerRichBottomRef
        : composerRichInlineRef;
  const plusRef =
    slot === "hero"
      ? plusAnchorHeroRef
      : slot === "bottom"
        ? plusAnchorBottomRef
        : plusAnchorInlineRef;
  const modelRef =
    slot === "hero"
      ? modelPillHeroRef
      : slot === "bottom"
        ? modelPillBottomRef
        : modelPillInlineRef;
  const isBottomSlot = slot === "bottom";
  const showModelPicker = composerMode !== "team";
  const inputPlaceholder =
    isBottomSlot && hasConversation
      ? followUpComposerPlaceholder
      : composerPlaceholder;
  const sendTitle = awaitingReply ? t("app.stopGeneration") : t("app.send");

  const onComposerKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (skillInvokeKeyDown(e)) return;
    if (slashCommandKeyDown(e)) return;
    if (atMentionKeyDown(e)) return;
    if (
      e.key === "Escape" &&
      resendFromUserIndex !== null &&
      slot === "inline"
    ) {
      e.preventDefault();
      setResendFromUserIndex(null);
      setInlineResendSegments([]);
      return;
    }
    if (e.key === "Tab" && e.shiftKey) {
      e.preventDefault();
      onNewThreadFn();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendFn();
    }
  };

  const capsule = (
    <div
      className={[
        "ref-capsule",
        isHero ? "ref-capsule--editor-rail-hero" : "ref-capsule--stacked-chat",
        extraClass,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className={
          isHero ? "ref-composer-hero-body" : "ref-composer-stacked-body"
        }
      >
        <ComposerRichInput
          className={
            isHero
              ? "ref-capsule-input"
              : "ref-capsule-input ref-capsule-input--stacked-chat"
          }
          innerRef={richRef}
          onComposerAttachFiles={persistComposerAttachments}
          onFilePreview={(rel) => onExplorerOpenFileFn(rel)}
          onKeyDown={onComposerKeyDown}
          onRichInput={(root) => syncComposerOverlays(root, slot)}
          onRichSelect={(root) => syncComposerOverlays(root, slot)}
          onSegmentsChange={setSegments}
          placeholder={inputPlaceholder}
          segments={segments}
        />
      </div>
      <div
        className={
          isHero
            ? "ref-capsule-bar ref-capsule-bar--editor-rail"
            : "ref-capsule-bar ref-capsule-bar--stacked"
        }
      >
        <div
          className={
            isHero ? "ref-editor-rail-bar-left" : "ref-capsule-bar-start"
          }
        >
          <div
            className="ref-plus-anchor ref-editor-rail-mode-cluster"
            ref={plusRef}
          >
            <button
              aria-expanded={plusMenuOpen}
              aria-haspopup="menu"
              aria-label={t("app.addPlusAria")}
              className={`ref-mode-chip ref-mode-chip--${composerMode} ref-mode-chip--opens-menu is-active`}
              onClick={() => {
                setPlusMenuAnchorSlot(slot);
                setModelPickerOpen(false);
                setPlusMenuOpen((open) => !open);
              }}
              title={t("app.addPlusTitle")}
              type="button"
            >
              <ComposerModeIcon
                className="ref-mode-chip-ico"
                mode={composerMode}
              />
              <span className="ref-mode-chip-label">
                {composerModeLabel(composerMode, t)}
              </span>
              <IconChevron className="ref-mode-chip-menu-chev" />
            </button>
          </div>
          {showModelPicker ? (
            <div className="ref-model-pill-anchor" ref={modelRef}>
              <button
                aria-expanded={modelPickerOpen}
                aria-haspopup="listbox"
                className="ref-model-pill"
                onClick={() => {
                  setModelPickerAnchorSlot(slot);
                  setPlusMenuOpen(false);
                  setModelPickerOpen((open) => !open);
                }}
                type="button"
              >
                <span className="ref-model-name">{modelPillLabel}</span>
                <IconChevron className="ref-model-chev" />
              </button>
            </div>
          ) : null}
        </div>
        {isHero ? <div className="ref-capsule-bar-spacer" /> : null}
        <div
          className={
            isHero ? "ref-editor-rail-bar-right" : "ref-capsule-bar-end"
          }
        >
          {isHero ? (
            <button
              aria-label={t("app.comingSoon")}
              className="ref-mic-btn"
              disabled
              title={t("app.comingSoon")}
              type="button"
            >
              <IconImageOutline className="ref-mic-btn-svg" />
            </button>
          ) : null}
          <button
            aria-label={t("app.voiceSoonAria")}
            className="ref-mic-btn"
            disabled
            title={t("app.voiceSoonTitle")}
            type="button"
          >
            <IconMic className="ref-mic-btn-svg" />
          </button>
          <button
            aria-label={sendTitle}
            className={`ref-send-btn ${awaitingReply ? "is-stop" : ""}`}
            disabled={!awaitingReply && !canSend}
            onClick={() => (awaitingReply ? onAbortFn() : onSendFn())}
            title={sendTitle}
            type="button"
          >
            {awaitingReply ? (
              <IconStop className="ref-send-icon" />
            ) : (
              <IconArrowUp className="ref-send-icon" />
            )}
          </button>
        </div>
      </div>
    </div>
  );

  if (slot !== "bottom" || !showGitBranchRow) {
    return capsule;
  }

  return (
    <div className="ref-composer-stack-with-branch">
      {capsule}
      <ComposerGitBranchRow
        contextMeter={composerContextMeter}
        onBeforeToggleGitBranchPicker={onBeforeToggleGitBranchPicker}
        ref={composerGitBranchAnchorRef}
      />
    </div>
  );
}
