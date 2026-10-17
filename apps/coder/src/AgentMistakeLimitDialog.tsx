import { useState } from "react";
import { createPortal } from "react-dom";

export type MistakeLimitPayload = {
  recoveryId: string;
  consecutiveFailures: number;
  threshold: number;
};

type Props = {
  open: boolean;
  payload: MistakeLimitPayload | null;
  onContinue: () => void;
  onStop: () => void;
  onSendHint: (hint: string) => void;
  title: string;
  body: string;
  continueLabel: string;
  stopLabel: string;
  hintFieldLabel: string;
  sendHintLabel: string;
  hintPlaceholder: string;
};

export function AgentMistakeLimitDialog({
  open,
  payload,
  onContinue,
  onStop,
  onSendHint,
  title,
  body,
  continueLabel,
  stopLabel,
  hintFieldLabel,
  sendHintLabel,
  hintPlaceholder,
}: Props) {
  const [hint, setHint] = useState("");

  if (!open || !payload) {
    return null;
  }

  return createPortal(
    <div
      aria-labelledby="ref-mistake-limit-title"
      aria-modal="true"
      className="ref-tool-approval-overlay"
      role="dialog"
    >
      <div
        aria-hidden
        className="ref-tool-approval-backdrop"
        onClick={onStop}
      />
      <div className="ref-tool-approval-card ref-mistake-limit-card">
        <h2 className="ref-tool-approval-title" id="ref-mistake-limit-title">
          {title}
        </h2>
        <p className="ref-mistake-limit-body">{body}</p>
        <label
          className="ref-mistake-limit-hint-label"
          htmlFor="ref-mistake-limit-ta"
        >
          {hintFieldLabel}
        </label>
        <textarea
          className="ref-mistake-limit-textarea"
          id="ref-mistake-limit-ta"
          onChange={(e) => setHint(e.target.value)}
          placeholder={hintPlaceholder}
          rows={3}
          value={hint}
        />
        <div className="ref-tool-approval-actions ref-mistake-limit-actions">
          <button
            className="ref-tool-approval-btn ref-tool-approval-btn--deny"
            onClick={onStop}
            type="button"
          >
            {stopLabel}
          </button>
          <button
            className="ref-tool-approval-btn ref-tool-approval-btn--allow"
            onClick={onContinue}
            type="button"
          >
            {continueLabel}
          </button>
          <button
            className="ref-tool-approval-btn ref-mistake-limit-btn-hint"
            disabled={!hint.trim()}
            onClick={() => {
              const t = hint.trim();
              if (!t) return;
              setHint("");
              onSendHint(t);
            }}
            type="button"
          >
            {sendHintLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
