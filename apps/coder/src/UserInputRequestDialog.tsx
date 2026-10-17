import { useEffect, useMemo, useRef, useState } from "react";
import type { AgentUserInputRequest } from "./agentSessionTypes";
import { useI18n } from "./i18n";

type AnswerDraft = {
  selected: string | null;
  custom: string;
};

type FormProps = {
  request: AgentUserInputRequest;
  onSubmit: (answers: Record<string, string>) => Promise<void> | void;
  compact?: boolean;
  submitLabel: string;
  title: string;
};

function buildInitialDrafts(
  request: AgentUserInputRequest
): Record<string, AnswerDraft> {
  const next: Record<string, AnswerDraft> = {};
  for (const question of request.questions) {
    next[question.id] = { custom: "", selected: null };
  }
  return next;
}

function RequestUserInputForm({
  request,
  onSubmit,
  compact = false,
  submitLabel,
  title,
}: FormProps) {
  const { t } = useI18n();
  const [drafts, setDrafts] = useState<Record<string, AnswerDraft>>(() =>
    buildInitialDrafts(request)
  );
  const [submitting, setSubmitting] = useState(false);
  const customInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    setDrafts(buildInitialDrafts(request));
    customInputRefs.current = {};
  }, [request.requestId]);

  const canSubmit = useMemo(
    () =>
      request.questions.every((question) => {
        const draft = drafts[question.id] ?? { custom: "", selected: null };
        if (!draft.selected) {
          return false;
        }
        if (draft.selected === "__other__") {
          return draft.custom.trim().length > 0;
        }
        return true;
      }),
    [drafts, request.questions]
  );

  const selectOption = (questionId: string, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] ?? { custom: "", selected: null }),
        selected: value,
      },
    }));
    if (value === "__other__") {
      setTimeout(() => customInputRefs.current[questionId]?.focus(), 30);
    }
  };

  const updateCustom = (questionId: string, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] ?? { custom: "", selected: "__other__" }),
        custom: value,
        selected: "__other__",
      },
    }));
  };

  const handleSubmit = async () => {
    if (!canSubmit || submitting) {
      return;
    }
    const answers: Record<string, string> = {};
    for (const question of request.questions) {
      const draft = drafts[question.id];
      if (!draft?.selected) {
        continue;
      }
      answers[question.id] =
        draft.selected === "__other__" ? draft.custom.trim() : draft.selected;
    }
    setSubmitting(true);
    try {
      await onSubmit(answers);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`ref-user-input-shell ${compact ? "ref-user-input-shell--compact" : ""}`}
    >
      <div className="ref-user-input-head">
        <div className="ref-user-input-head-main">
          <span className="ref-plan-q-title">{title}</span>
          <strong className="ref-user-input-agent">{request.agentTitle}</strong>
        </div>
      </div>
      <div className="ref-user-input-body">
        {request.questions.map((question, index) => {
          const draft = drafts[question.id] ?? { custom: "", selected: null };
          const otherSelected = draft.selected === "__other__";
          return (
            <section className="ref-user-input-question" key={question.id}>
              <div className="ref-user-input-question-head">
                <span className="ref-user-input-question-index">
                  {index + 1}
                </span>
                <div className="ref-user-input-question-copy">
                  <div className="ref-user-input-question-header">
                    {question.header}
                  </div>
                  <p className="ref-user-input-question-text">
                    {question.question}
                  </p>
                </div>
              </div>
              <div className="ref-plan-q-options">
                {question.options.map((option, optionIndex) => {
                  const active = draft.selected === option.label;
                  return (
                    <button
                      aria-checked={active}
                      className={`ref-plan-q-opt ${active ? "is-selected" : ""}`}
                      key={`${question.id}-${option.label}`}
                      onClick={() => selectOption(question.id, option.label)}
                      role="radio"
                      type="button"
                    >
                      <span className="ref-plan-q-opt-id">
                        {String.fromCharCode(65 + optionIndex)}
                      </span>
                      <span className="ref-user-input-option-copy">
                        <span className="ref-plan-q-opt-label">
                          {option.label}
                        </span>
                        {option.description ? (
                          <span className="ref-user-input-option-description">
                            {option.description}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  );
                })}
                <button
                  aria-checked={otherSelected}
                  className={`ref-plan-q-opt ${otherSelected ? "is-selected" : ""}`}
                  onClick={() => selectOption(question.id, "__other__")}
                  role="radio"
                  type="button"
                >
                  <span className="ref-plan-q-opt-id">
                    {String.fromCharCode(65 + question.options.length)}
                  </span>
                  <span className="ref-plan-q-opt-label ref-plan-q-opt-label--other">
                    <span className="ref-plan-q-opt-other-prefix">
                      {t("agent.userInput.other")}
                    </span>
                    {otherSelected ? (
                      <input
                        className="ref-plan-q-custom-input"
                        onChange={(event) =>
                          updateCustom(question.id, event.target.value)
                        }
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && canSubmit) {
                            event.preventDefault();
                            void handleSubmit();
                          }
                        }}
                        placeholder={t("agent.userInput.customPlaceholder")}
                        ref={(node) => {
                          customInputRefs.current[question.id] = node;
                        }}
                        type="text"
                        value={draft.custom}
                      />
                    ) : null}
                  </span>
                </button>
              </div>
            </section>
          );
        })}
      </div>
      <div className="ref-plan-q-foot">
        <button
          className="ref-plan-q-btn ref-plan-q-btn--primary"
          disabled={!canSubmit || submitting}
          onClick={() => void handleSubmit()}
          type="button"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

type DialogProps = {
  request: AgentUserInputRequest;
  onSubmit: (answers: Record<string, string>) => Promise<void> | void;
};

export function UserInputRequestDialog({ request, onSubmit }: DialogProps) {
  const { t } = useI18n();
  return (
    <div
      aria-label={t("agent.userInput.dialogAria")}
      className="ref-plan-q"
      role="dialog"
    >
      <RequestUserInputForm
        onSubmit={onSubmit}
        request={request}
        submitLabel={t("common.continue")}
        title={t("agent.userInput.dialogTitle")}
      />
    </div>
  );
}

type InlineProps = {
  request: AgentUserInputRequest;
  onSubmit: (answers: Record<string, string>) => Promise<void> | void;
};

export function UserInputRequestInlineCard({ request, onSubmit }: InlineProps) {
  const { t } = useI18n();
  return (
    <div className="ref-agent-session-user-input">
      <RequestUserInputForm
        compact={true}
        onSubmit={onSubmit}
        request={request}
        submitLabel={t("common.continue")}
        title={t("agent.userInput.inlineTitle")}
      />
    </div>
  );
}
