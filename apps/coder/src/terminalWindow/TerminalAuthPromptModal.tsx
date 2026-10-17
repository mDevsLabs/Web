import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { TFunction } from "../i18n";

type Props = {
  t: TFunction;
  kind: "password" | "passphrase";
  prompt: string;
  sessionTitle: string;
  profileName: string;
  onCancel(): void;
  onSubmit(value: string, remember: boolean): void;
};

export function TerminalAuthPromptModal({
  t,
  kind,
  prompt,
  sessionTitle,
  profileName,
  onCancel,
  onSubmit,
}: Props) {
  const [value, setValue] = useState("");
  const [remember, setRemember] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
        return;
      }
      if (event.key === "Enter" && value.length > 0) {
        event.preventDefault();
        onSubmit(value, kind === "password" && remember);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [kind, onCancel, onSubmit, remember, value]);

  const hasValue = value.length > 0;

  const modal = (
    <div
      className="ref-uterm-auth-modal-backdrop"
      onClick={onCancel}
      role="presentation"
    >
      <div
        aria-label={t("app.universalTerminalAuthPromptTitle")}
        aria-modal="true"
        className="ref-uterm-auth-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="ref-uterm-auth-modal-head">
          <div>
            <div className="ref-uterm-auth-modal-kicker">
              {t("app.universalTerminalWindowTitle")}
            </div>
            <h3 className="ref-uterm-auth-modal-title">
              {t("app.universalTerminalAuthPromptTitle")}
            </h3>
            <p className="ref-uterm-auth-modal-copy">
              {t("app.universalTerminalAuthPromptCopy")}
            </p>
          </div>
          <button
            aria-label={t("common.close")}
            className="ref-uterm-auth-modal-close"
            onClick={onCancel}
            type="button"
          >
            ×
          </button>
        </div>

        <div className="ref-uterm-auth-modal-body">
          <div className="ref-uterm-auth-modal-meta">
            <div className="ref-uterm-auth-modal-meta-row">
              <span className="ref-uterm-auth-modal-meta-label">
                {t("app.universalTerminalAuthPromptSession")}
              </span>
              <span className="ref-uterm-auth-modal-meta-value">
                {sessionTitle}
              </span>
            </div>
            <div className="ref-uterm-auth-modal-meta-row">
              <span className="ref-uterm-auth-modal-meta-label">
                {t("app.universalTerminalAuthPromptProfile")}
              </span>
              <span className="ref-uterm-auth-modal-meta-value">
                {profileName}
              </span>
            </div>
          </div>

          <div className="ref-uterm-auth-modal-prompt">{prompt}</div>

          <input
            className="ref-uterm-auth-modal-input"
            onChange={(event) => setValue(event.target.value)}
            placeholder={
              kind === "passphrase"
                ? t("app.universalTerminalAuthPromptPassphrasePlaceholder")
                : t("app.universalTerminalAuthPromptPasswordPlaceholder")
            }
            ref={inputRef}
            type="password"
            value={value}
          />

          {kind === "password" ? (
            <label className="ref-uterm-auth-modal-remember">
              <input
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                type="checkbox"
              />
              <span>{t("app.universalTerminalAuthPromptRemember")}</span>
            </label>
          ) : null}
        </div>

        <div className="ref-uterm-auth-modal-foot">
          <button
            className="ref-uterm-auth-modal-btn is-ghost"
            onClick={onCancel}
            type="button"
          >
            {t("common.cancel")}
          </button>
          <button
            className="ref-uterm-auth-modal-btn is-primary"
            disabled={!hasValue}
            onClick={() => onSubmit(value, kind === "password" && remember)}
            type="button"
          >
            {t("common.continue")}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document === "undefined"
    ? null
    : createPortal(modal, document.body);
}
